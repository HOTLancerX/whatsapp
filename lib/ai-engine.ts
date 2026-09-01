/**
 * plugin/whatsapp/lib/ai-engine.ts
 *
 * WhatsApp-optimized AI completions engine compatible with OpenAI,
 * OpenRouter, Groq, Together AI, DeepSeek, and local Ollama APIs.
 * Includes automatic rate-limit retries with exponential backoff,
 * model failover, and zero-downtime smart knowledge fallbacks.
 */

import { Settings } from "@/lib/settings";
import { type StoreKnowledgeContext } from "./knowledge-search";
import { type IWhatsAppAccount } from "../models/WhatsAppAccount";

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AiGenerationResult {
    replyText: string;
    shouldSendCarousel: boolean;
    intent: "product_search" | "price_inquiry" | "order_status" | "faq_policy" | "greeting" | "human_agent";
    suggestedProductIds: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeJson(res: Response): Promise<any | null> {
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json") && !ct.includes("text/json")) {
        const text = await res.text();
        console.error("[whatsapp/ai-engine] Non-JSON response:", text.slice(0, 250));
        return null;
    }
    try {
        return await res.json();
    } catch (e) {
        console.error("[whatsapp/ai-engine] JSON parse error:", e);
        return null;
    }
}

// Fallback models when primary model hits rate limit (429)
const RATE_LIMIT_FALLBACK_MODELS = [
    "gpt-4o-mini",
    "gpt-3.5-turbo",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemini-1.5-flash",
];

export async function generateWhatsAppReply(
    userMessage: string,
    history: { role: "user" | "assistant" | "agent"; content: string }[],
    knowledge: StoreKnowledgeContext,
    account?: IWhatsAppAccount | null,
    baseUrl: string = ""
): Promise<AiGenerationResult> {
    const settings = await Settings();

    const apiUrl =
        (settings.ai_chat_api_url as string | undefined)?.trim() ||
        (settings.whatsapp_ai_api_url as string | undefined)?.trim() ||
        "https://api.openai.com/v1/chat/completions";

    const apiKey =
        (settings.whatsapp_ai_api_key as string | undefined)?.trim() ||
        (settings.ai_chat_api_key as string | undefined)?.trim() ||
        "";

    const defaultModel =
        account?.aiModel?.trim() ||
        (settings.whatsapp_ai_model as string | undefined)?.trim() ||
        (settings.ai_chat_model as string | undefined)?.trim() ||
        "gpt-4o-mini";

    const siteName = (settings.siteName as string | undefined)?.trim() || "Our Store";
    const siteInfo =
        (settings.whatsapp_store_info as string | undefined)?.trim() ||
        (settings.ai_chat_site_info as string | undefined)?.trim() ||
        "";

    const maxWords = parseInt(
        (settings.whatsapp_max_words as string | undefined) ||
        (settings.ai_chat_max_words as string | undefined) ||
        "160",
        10
    );

    // Intent detection helper
    const detectIntent = (text: string): AiGenerationResult["intent"] => {
        const lower = text.toLowerCase();
        if (lower.includes("order") || lower.includes("track") || lower.includes("shipping status") || lower.includes("অর্ডার")) {
            return "order_status";
        } else if (lower.includes("return") || lower.includes("policy") || lower.includes("delivery") || lower.includes("refund") || lower.includes("ডেলিভারি")) {
            return "faq_policy";
        } else if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("দাম") || lower.includes("টাকা")) {
            return "price_inquiry";
        } else if (lower.includes("human") || lower.includes("agent") || lower.includes("talk to person") || lower.includes("manager") || lower.includes("মানুষ")) {
            return "human_agent";
        } else if (lower.length <= 15 && (lower.includes("hi") || lower.includes("hello") || lower.includes("hey") || lower.includes("salam") || lower.includes("হ্যালো"))) {
            return "greeting";
        }
        return "product_search";
    };

    const currentIntent = detectIntent(userMessage);

    // Helper: Seamless Smart Fallback builder (User never sees technical error)
    const buildSmartFallbackReply = (): AiGenerationResult => {
        let replyText = `Hello! Thanks for reaching out to *${siteName}*.\n\n`;

        if (knowledge.products.length > 0) {
            replyText += `Here are our top matching products for your request:\n\n`;
            knowledge.products.slice(0, 4).forEach((p) => {
                replyText += `• *${p.title}* — ${p.price || "Check website"}\n  ${p.url}\n`;
            });
            replyText += `\nFeel free to ask any details or let us know if you'd like to place an order!`;
        } else if (siteInfo) {
            replyText += `We are here to help you! Here is some information about us:\n${siteInfo.slice(0, 300)}\n\nHow else may we assist you today?`;
        } else {
            replyText += `We have received your message and are happy to assist. Please visit our website: ${baseUrl || ""}`;
        }

        const shouldSendCarousel =
            (account?.carouselEnabled ?? true) &&
            knowledge.products.length > 0 &&
            (currentIntent === "product_search" || currentIntent === "price_inquiry" || currentIntent === "greeting");

        return {
            replyText,
            shouldSendCarousel,
            intent: currentIntent,
            suggestedProductIds: knowledge.products.map((p) => p.id),
        };
    };

    // If no API key is set, use smart fallback immediately
    if (!apiKey) {
        return buildSmartFallbackReply();
    }

    // ── Build WhatsApp-specific System Prompt ──
    const customPrompt =
        account?.aiSystemPrompt?.trim() ||
        (settings.whatsapp_system_prompt as string | undefined)?.trim() ||
        "";

    const systemInstructions = [
        `You are the friendly, professional WhatsApp customer support and sales bot for *${siteName}*.`,
        `You ONLY answer about products, services, store policies, orders, and content on ${siteName}.`,
        `Format your response specifically for WhatsApp:`,
        `  - Use *bold* for emphasis and product titles.`,
        `  - Use bullet points (•) for lists.`,
        `  - Use helpful emojis naturally (✨, 🛍️, 📦, 🏷️, 💬, 🚚).`,
        `  - Keep replies concise (maximum ${maxWords} words) because WhatsApp users prefer quick, readable messages.`,
        `  - Always reply in the same language the customer uses (e.g. English, Bengali, etc.).`,
        `  - When recommending products, ALWAYS include the product price and clickable URL.`,
        `  - If no matching product exists in the context below, state so politely and offer alternatives or suggest contacting support. Never invent fake products or prices.`,
    ];

    if (customPrompt) {
        systemInstructions.push(`\n### Account Specific Instructions:\n${customPrompt}`);
    }

    if (siteInfo) {
        systemInstructions.push(`\n### About ${siteName} & Store Policies:\n${siteInfo}`);
    }

    if (knowledge.formattedContext) {
        systemInstructions.push(`\n### Live Database Context:\n${knowledge.formattedContext}`);
    }

    // Prepare multi-turn history (last 6 messages)
    const recentHistory: ChatMessage[] = history.slice(-6).map((h) => ({
        role: h.role === "assistant" || h.role === "agent" ? ("assistant" as const) : ("user" as const),
        content: h.content,
    }));

    const messages: ChatMessage[] = [
        { role: "system", content: systemInstructions.join("\n") },
        ...recentHistory,
        { role: "user", content: userMessage },
    ];

    // ── Intelligent Retry Loop with Exponential Backoff & Model Failover ──
    const MAX_RETRIES = 4;
    let modelToTry = defaultModel;
    let fallbackIndex = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per call

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: modelToTry,
                    messages,
                    max_tokens: 500,
                    temperature: 0.7,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle Rate Limit (HTTP 429) or Server Overload (500, 502, 503, 504)
            if (res.status === 429 || res.status >= 500) {
                const retryAfterHeader = res.headers.get("retry-after");
                let waitTimeMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 1500 * Math.pow(1.8, attempt - 1);
                waitTimeMs = Math.min(waitTimeMs + Math.random() * 500, 7000); // Jitter & max cap 7s

                console.warn(
                    `[whatsapp/ai-engine] AI limit/error reached (HTTP ${res.status}). Retrying attempt ${attempt}/${MAX_RETRIES} in ${Math.round(waitTimeMs)}ms on model ${modelToTry}...`
                );

                // Try failover to lighter fallback model if rate limited
                if (res.status === 429 && fallbackIndex < RATE_LIMIT_FALLBACK_MODELS.length) {
                    const nextModel = RATE_LIMIT_FALLBACK_MODELS[fallbackIndex++];
                    if (nextModel !== modelToTry) {
                        modelToTry = nextModel;
                        console.log(`[whatsapp/ai-engine] Failing over to model: ${modelToTry}`);
                    }
                }

                if (attempt < MAX_RETRIES) {
                    await sleep(waitTimeMs);
                    continue;
                }
            }

            const data = await safeJson(res);

            if (res.ok && data?.choices?.[0]?.message?.content) {
                const reply = data.choices[0].message.content.trim();

                const shouldSendCarousel =
                    (account?.carouselEnabled ?? true) &&
                    knowledge.products.length > 0 &&
                    (currentIntent === "product_search" || currentIntent === "price_inquiry" || currentIntent === "greeting");

                return {
                    replyText: reply,
                    shouldSendCarousel,
                    intent: currentIntent,
                    suggestedProductIds: knowledge.products.map((p) => p.id),
                };
            }

            // If error returned in body
            const errMsg = data?.error?.message || data?.error || `HTTP ${res.status}`;
            console.error(`[whatsapp/ai-engine] Provider error on attempt ${attempt}:`, errMsg);

            if (attempt < MAX_RETRIES) {
                await sleep(1500 * attempt);
                continue;
            }
        } catch (err: any) {
            console.warn(`[whatsapp/ai-engine] Exception on attempt ${attempt}/${MAX_RETRIES}:`, err?.message || err);
            if (attempt < MAX_RETRIES) {
                await sleep(1500 * attempt);
                continue;
            }
        }
    }

    // ── Seamless Fallback (User never notices limit exhaustion) ──
    console.warn("[whatsapp/ai-engine] All AI retries exhausted. Providing seamless smart catalog fallback.");
    return buildSmartFallbackReply();
}


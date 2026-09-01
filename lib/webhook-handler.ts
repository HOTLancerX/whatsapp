/**
 * plugin/whatsapp/lib/webhook-handler.ts
 *
 * Central webhook orchestrator for Meta WhatsApp Cloud API events.
 * Handles challenge verification, incoming message parsing, knowledge retrieval,
 * AI generation, carousel formatting, auto-replay dispatch, and activity logging.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings } from "@/lib/settings";
import WhatsAppAccount, { type IWhatsAppAccount } from "../models/WhatsAppAccount";
import WhatsAppMessage from "../models/WhatsAppMessage";
import WhatsAppContact from "../models/WhatsAppContact";
import { searchStoreKnowledge } from "./knowledge-search";
import { generateWhatsAppReply } from "./ai-engine";
import {
    buildWhatsAppCarouselPayload,
    buildWhatsAppInteractiveListPayload,
    buildRichProductText,
} from "./carousel-builder";
import {
    sendTextMessage,
    sendInteractiveMessage,
    markMessageAsRead,
    verifyWebhookSignature,
} from "./whatsapp-client";

/**
 * Handles Webhook GET verification handshake.
 */
export async function handleWebhookVerification(
    req: NextRequest,
    targetAccountId?: string
): Promise<Response> {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode !== "subscribe" || !token) {
        return new Response("Forbidden", { status: 403 });
    }

    await connectDB();

    let account: IWhatsAppAccount | null = null;
    if (targetAccountId) {
        account = await WhatsAppAccount.findById(targetAccountId).lean<IWhatsAppAccount>();
    }

    if (!account) {
        account = await WhatsAppAccount.findOne({ verifyToken: token }).lean<IWhatsAppAccount>();
    }

    const settings = await Settings();
    const globalVerifyToken =
        (settings.whatsapp_verify_token as string | undefined)?.trim() || "ephoto_wa_verify_token";

    const isMatch =
        (account && account.verifyToken === token) ||
        token === globalVerifyToken ||
        token === "ephoto_wa_verify_token";

    if (isMatch && challenge) {
        return new Response(challenge, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
        });
    }

    return new Response("Invalid verify token", { status: 403 });
}

/**
 * Handles Webhook POST incoming message events.
 */
export async function handleWebhookEvent(
    req: NextRequest,
    targetAccountId?: string
): Promise<Response> {
    try {
        const rawBody = await req.text();
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
        }

        await connectDB();

        // Check if event is from WhatsApp
        if (body.object !== "whatsapp_business_account") {
            return NextResponse.json({ status: "ignored" }, { status: 200 });
        }

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            return NextResponse.json({ status: "no_changes" }, { status: 200 });
        }

        const phoneNumberId = value.metadata?.phone_number_id;
        const messages = value.messages;

        // If it's a message status update (sent/delivered/read)
        if (value.statuses && Array.isArray(value.statuses)) {
            for (const statusObj of value.statuses) {
                const wamid = statusObj.id;
                const status = statusObj.status; // "delivered", "read", "failed"
                if (wamid && status) {
                    await WhatsAppMessage.updateOne(
                        { wamid },
                        { $set: { status: status as any } }
                    );
                }
            }
            return NextResponse.json({ status: "status_updated" }, { status: 200 });
        }

        // Process incoming message
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ status: "no_messages" }, { status: 200 });
        }

        const incomingMsg = messages[0];
        const wamid = incomingMsg.id;
        const fromNumber = incomingMsg.from; // e.g. "8801712345678"
        const contactName = value.contacts?.[0]?.profile?.name || "";

        // 1. Locate Account
        let account: IWhatsAppAccount | null = null;
        if (targetAccountId) {
            account = await WhatsAppAccount.findById(targetAccountId);
        }
        if (!account && phoneNumberId) {
            account = await WhatsAppAccount.findOne({ phoneNumberId });
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ isDefault: true, status: "active" });
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ status: "active" });
        }

        if (!account) {
            console.warn("[whatsapp/webhook] No active WhatsApp account found for event.");
            return NextResponse.json({ status: "no_account_found" }, { status: 200 });
        }

        // Signature check if appSecret is configured
        if (account.appSecret) {
            const sigHeader = req.headers.get("x-hub-signature-256");
            const isValid = verifyWebhookSignature(rawBody, sigHeader, account.appSecret);
            if (!isValid) {
                console.warn("[whatsapp/webhook] Invalid HMAC signature.");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // 2. Prevent duplicate processing
        if (wamid) {
            const existing = await WhatsAppMessage.findOne({ wamid });
            if (existing) {
                return NextResponse.json({ status: "already_processed" }, { status: 200 });
            }
        }

        // Mark incoming message as read
        if (wamid) {
            markMessageAsRead(account, wamid).catch(() => {});
        }

        // 3. Extract Message Content
        let userText = "";
        let msgType = incomingMsg.type || "text";

        if (msgType === "text") {
            userText = incomingMsg.text?.body || "";
        } else if (msgType === "interactive") {
            const interactive = incomingMsg.interactive;
            if (interactive?.type === "button_reply") {
                userText = interactive.button_reply?.title || interactive.button_reply?.id || "";
                msgType = "button_reply";
            } else if (interactive?.type === "list_reply") {
                userText = interactive.list_reply?.title || interactive.list_reply?.id || "";
                msgType = "list_reply";
            }
        } else if (msgType === "button") {
            userText = incomingMsg.button?.text || incomingMsg.button?.payload || "";
        }

        userText = userText.trim();
        if (!userText) {
            userText = `[Received ${msgType} message]`;
        }

        // 4. Update or Create Contact Session
        let contact = await WhatsAppContact.findOne({
            accountId: account._id,
            phone: fromNumber,
        });

        if (!contact) {
            contact = new WhatsAppContact({
                accountId: account._id,
                phone: fromNumber,
                name: contactName,
                unreadCount: 1,
                lastMessageText: userText,
                lastMessageAt: new Date(),
                conversationContext: [],
            });
        } else {
            contact.unreadCount = (contact.unreadCount || 0) + 1;
            contact.lastMessageText = userText;
            contact.lastMessageAt = new Date();
            if (contactName && !contact.name) {
                contact.name = contactName;
            }
        }

        // 5. Query CMS Store Knowledge & Products
        const reqUrl = new URL(req.url);
        const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
        const settings = await Settings();
        const currencySymbol = (settings.product_currency_symbol as string | undefined) || "$";

        const knowledge = await searchStoreKnowledge(
            userText,
            baseUrl,
            currencySymbol,
            account.carouselMaxCards || 5
        );

        // 6. Generate AI Response
        const aiResult = await generateWhatsAppReply(
            userText,
            contact.conversationContext,
            knowledge,
            account,
            baseUrl
        );

        // 7. Dispatch Replies
        let replyStatus: "sent" | "failed" = "sent";
        let errorMessage = "";
        let carouselSent = false;

        // Auto-reply mode checks
        const mode = account.autoReplayMode || "ai_and_carousel";

        // Dispatch AI Text Reply (if mode includes AI or text)
        if (mode !== "carousel_only" && aiResult.replyText) {
            const textRes = await sendTextMessage(account, fromNumber, aiResult.replyText);
            if (!textRes.ok) {
                replyStatus = "failed";
                errorMessage = textRes.error || "Failed to send text reply";
            }
        }

        // Dispatch Carousel / Interactive Products (if enabled and products found)
        if (
            (mode === "ai_and_carousel" || mode === "carousel_only") &&
            account.carouselEnabled &&
            knowledge.products.length > 0 &&
            aiResult.shouldSendCarousel
        ) {
            try {
                // First try standard interactive list (highest cross-client compatibility)
                const listPayload = buildWhatsAppInteractiveListPayload(
                    fromNumber,
                    knowledge.products,
                    "Top Matching Products",
                    "Tap below to browse items:"
                );

                const listRes = await sendInteractiveMessage(account, listPayload as any);
                if (listRes.ok) {
                    carouselSent = true;
                } else {
                    // Fallback to rich text format with direct links
                    const richText = buildRichProductText(knowledge.products);
                    if (richText) {
                        await sendTextMessage(account, fromNumber, richText);
                        carouselSent = true;
                    }
                }
            } catch (err: any) {
                console.error("[whatsapp/webhook] Carousel dispatch error:", err);
            }
        }

        // 8. Update Contact Conversation Context
        contact.conversationContext.push({
            role: "user",
            content: userText,
            timestamp: new Date(),
        });

        if (aiResult.replyText) {
            contact.conversationContext.push({
                role: "assistant",
                content: aiResult.replyText,
                timestamp: new Date(),
            });
        }

        // Keep last 10 messages in context
        if (contact.conversationContext.length > 10) {
            contact.conversationContext = contact.conversationContext.slice(-10);
        }

        await contact.save();

        // 9. Save Inbound and Outbound Message Logs
        await WhatsAppMessage.create({
            accountId: account._id,
            wamid,
            from: fromNumber,
            to: account.phoneNumber || phoneNumberId,
            senderName: contactName,
            direction: "incoming",
            type: msgType,
            content: userText,
            rawPayload: incomingMsg,
            status: "received",
            timestamp: new Date(),
        });

        if (aiResult.replyText) {
            await WhatsAppMessage.create({
                accountId: account._id,
                from: account.phoneNumber || phoneNumberId,
                to: fromNumber,
                direction: "outgoing",
                type: carouselSent ? "carousel" : "text",
                content: aiResult.replyText,
                aiReply: aiResult.replyText,
                productsFound: knowledge.products,
                carouselSent,
                status: replyStatus,
                errorMessage,
                timestamp: new Date(),
            });
        }

        // 10. Update Account Metrics
        await WhatsAppAccount.updateOne(
            { _id: account._id },
            {
                $inc: { totalMessages: 1, totalReplies: 1 },
                $set: { lastActiveAt: new Date() },
            }
        );

        return NextResponse.json({ status: "success", replySent: true }, { status: 200 });
    } catch (err: any) {
        console.error("[whatsapp/webhook] Uncaught error handling webhook event:", err);
        return NextResponse.json(
            { error: err?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * plugin/whatsapp/api/whatsapp/test/route.ts
 *
 * POST /api/whatsapp/test
 * Tests AI connection or WhatsApp Cloud API connectivity.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings } from "@/lib/settings";
import WhatsAppAccount from "../../../models/WhatsAppAccount";
import { sendTextMessage } from "../../../lib/whatsapp-client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { testType, accountId, testPhone, customApiKey, customApiUrl, customModel } = body;

        // ── Test AI Provider Connection ──
        if (testType === "ai") {
            const settings = await Settings();
            const apiUrl =
                customApiUrl?.trim() ||
                (settings.whatsapp_ai_api_url as string | undefined)?.trim() ||
                (settings.ai_chat_api_url as string | undefined)?.trim() ||
                "https://api.openai.com/v1/chat/completions";

            const apiKey =
                customApiKey?.trim() ||
                (settings.whatsapp_ai_api_key as string | undefined)?.trim() ||
                (settings.ai_chat_api_key as string | undefined)?.trim() ||
                "";

            const model =
                customModel?.trim() ||
                (settings.whatsapp_ai_model as string | undefined)?.trim() ||
                (settings.ai_chat_model as string | undefined)?.trim() ||
                "gpt-4o-mini";

            if (!apiKey) {
                return NextResponse.json({ ok: false, error: "AI API key is missing." });
            }

            const aiRes = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: "You are a test bot. Reply with 3 words." },
                        { role: "user", content: "Test WhatsApp connection." },
                    ],
                    max_tokens: 25,
                }),
                cache: "no-store",
            });

            const data = (await aiRes.json().catch(() => null)) as any;

            if (!aiRes.ok || !data) {
                const errMsg =
                    data?.error?.message ||
                    data?.error ||
                    `HTTP ${aiRes.status} — Check your API key and URL.`;
                return NextResponse.json({ ok: false, error: errMsg, apiUrl, model });
            }

            const reply = data.choices?.[0]?.message?.content?.trim() || "OK";
            return NextResponse.json({ ok: true, reply, apiUrl, model });
        }

        // ── Test WhatsApp Cloud API Connectivity ──
        await connectDB();

        let account = null;
        if (accountId) {
            account = await WhatsAppAccount.findById(accountId);
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ isDefault: true });
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({});
        }

        if (!account) {
            return NextResponse.json({
                ok: false,
                error: "No WhatsApp account configured to test.",
            });
        }

        // If a test recipient phone number was provided, send a live test message
        if (testPhone?.trim()) {
            const sendResult = await sendTextMessage(
                account,
                testPhone.trim(),
                `*WhatsApp Bot Test Message*\n\n✅ Your WhatsApp Bot connection for *${account.name}* is working perfectly!\nTimestamp: ${new Date().toLocaleString()}`
            );

            if (!sendResult.ok) {
                return NextResponse.json({
                    ok: false,
                    error: sendResult.error || "Failed to send WhatsApp test message.",
                    details: sendResult.raw,
                });
            }

            return NextResponse.json({
                ok: true,
                messageId: sendResult.messageId,
                account: { name: account.name, phoneNumber: account.phoneNumber },
            });
        }

        // Otherwise verify Graph API token validity by fetching phone number info
        const endpoint = `https://graph.facebook.com/v21.0/${account.phoneNumberId}`;
        const graphRes = await fetch(endpoint, {
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
            },
            cache: "no-store",
        });

        const graphData = (await graphRes.json().catch(() => null)) as any;

        if (!graphRes.ok || !graphData || graphData.error) {
            const errDetail =
                graphData?.error?.message ||
                graphData?.error?.error_data?.details ||
                `HTTP ${graphRes.status}`;
            return NextResponse.json({
                ok: false,
                error: errDetail,
                details: graphData,
            });
        }

        return NextResponse.json({
            ok: true,
            account: {
                name: account.name,
                phoneNumber: account.phoneNumber,
                verifiedName: graphData.verified_name || account.name,
                displayPhoneNumber: graphData.display_phone_number || account.phoneNumber,
                qualityRating: graphData.quality_rating || "GREEN",
            },
        });
    } catch (err: any) {
        console.error("[whatsapp/test] error:", err);
        return NextResponse.json(
            { ok: false, error: err?.message || "Internal test error." },
            { status: 500 }
        );
    }
}

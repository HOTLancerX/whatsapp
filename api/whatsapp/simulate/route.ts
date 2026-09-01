/**
 * plugin/whatsapp/api/whatsapp/simulate/route.ts
 *
 * POST /api/whatsapp/simulate
 * Simulates an incoming customer message, searches CMS store knowledge,
 * generates AI WhatsApp reply, and builds interactive carousel cards
 * without sending a real message over WhatsApp API.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Settings } from "@/lib/settings";
import WhatsAppAccount from "../../../models/WhatsAppAccount";
import { searchStoreKnowledge } from "../../../lib/knowledge-search";
import { generateWhatsAppReply } from "../../../lib/ai-engine";
import {
    buildWhatsAppCarouselPayload,
    buildWhatsAppInteractiveListPayload,
    buildRichProductText,
} from "../../../lib/carousel-builder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, accountId } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message query text is required." }, { status: 400 });
        }

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

        const reqUrl = new URL(req.url);
        const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
        const settings = await Settings();
        const currencySymbol = (settings.product_currency_symbol as string | undefined) || "$";

        // 1. Search Store Knowledge
        const knowledge = await searchStoreKnowledge(
            message.trim(),
            baseUrl,
            currencySymbol,
            account?.carouselMaxCards || 5
        );

        // 2. Generate AI Reply
        const aiResult = await generateWhatsAppReply(
            message.trim(),
            [],
            knowledge,
            account,
            baseUrl
        );

        // 3. Build WhatsApp Carousel & Interactive List payloads
        const carouselPayload = buildWhatsAppCarouselPayload(
            "1234567890",
            knowledge.products,
            account,
            "Matching Products",
            "Here are the items found in our catalog:"
        );

        const listPayload = buildWhatsAppInteractiveListPayload(
            "1234567890",
            knowledge.products,
            "Product Catalog",
            "Select an item from our store:"
        );

        const richText = buildRichProductText(knowledge.products);

        return NextResponse.json({
            ok: true,
            query: message.trim(),
            aiReply: aiResult.replyText,
            intent: aiResult.intent,
            shouldSendCarousel: aiResult.shouldSendCarousel,
            matchedProducts: knowledge.products,
            totalFound: knowledge.products.length,
            searchTokens: knowledge.searchTokens,
            carouselPayload,
            listPayload,
            richText,
            account: account ? { name: account.name, phoneNumber: account.phoneNumber } : null,
        });
    } catch (err: any) {
        console.error("[whatsapp/simulate] POST error:", err);
        return NextResponse.json(
            { error: err?.message || "Simulation failed." },
            { status: 500 }
        );
    }
}

/**
 * plugin/whatsapp/api/whatsapp/accounts/route.ts
 *
 * GET  /api/whatsapp/accounts — List all configured WhatsApp accounts
 * POST /api/whatsapp/accounts — Create a new WhatsApp account
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppAccount, { type IWhatsAppAccount } from "../../../models/WhatsAppAccount";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectDB();
        const accounts = await WhatsAppAccount.find({})
            .sort({ isDefault: -1, createdAt: -1 })
            .lean<IWhatsAppAccount[]>();

        return NextResponse.json({ accounts });
    } catch (err: any) {
        console.error("[whatsapp/accounts] GET error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to fetch WhatsApp accounts." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            phoneNumber,
            phoneNumberId,
            wabaId,
            accessToken,
            verifyToken,
            appSecret,
            status,
            isDefault,
            aiEnabled,
            aiModel,
            aiSystemPrompt,
            welcomeMessage,
            offHoursMessage,
            fallbackMessage,
            carouselEnabled,
            carouselMaxCards,
            carouselRatio,
            autoReplayMode,
        } = body;

        if (!name?.trim() || !phoneNumber?.trim() || !phoneNumberId?.trim() || !accessToken?.trim()) {
            return NextResponse.json(
                { error: "Account Name, Phone Number, Phone Number ID, and Access Token are required." },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if phone number ID already exists
        const existing = await WhatsAppAccount.findOne({ phoneNumberId: phoneNumberId.trim() });
        if (existing) {
            return NextResponse.json(
                { error: "An account with this Phone Number ID already exists." },
                { status: 409 }
            );
        }

        const totalExisting = await WhatsAppAccount.countDocuments();
        const shouldBeDefault = isDefault || totalExisting === 0;

        if (shouldBeDefault) {
            await WhatsAppAccount.updateMany({}, { $set: { isDefault: false } });
        }

        const newAccount = await WhatsAppAccount.create({
            name: name.trim(),
            phoneNumber: phoneNumber.trim(),
            phoneNumberId: phoneNumberId.trim(),
            wabaId: wabaId?.trim() || "",
            accessToken: accessToken.trim(),
            verifyToken: verifyToken?.trim() || "ephoto_wa_verify_token",
            appSecret: appSecret?.trim() || "",
            status: status || "active",
            isDefault: shouldBeDefault,
            aiEnabled: aiEnabled ?? true,
            aiModel: aiModel?.trim() || "",
            aiSystemPrompt: aiSystemPrompt?.trim() || "",
            welcomeMessage: welcomeMessage || "Hello! Welcome to our store. How can we help you today?",
            offHoursMessage: offHoursMessage || "",
            fallbackMessage: fallbackMessage || "Sorry, I could not find matching products. Let me connect you with an agent.",
            carouselEnabled: carouselEnabled ?? true,
            carouselMaxCards: parseInt(String(carouselMaxCards || "5"), 10) || 5,
            carouselRatio: carouselRatio || "1:1",
            autoReplayMode: autoReplayMode || "ai_and_carousel",
        });

        return NextResponse.json({ success: true, account: newAccount }, { status: 201 });
    } catch (err: any) {
        console.error("[whatsapp/accounts] POST error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to create WhatsApp account." },
            { status: 500 }
        );
    }
}

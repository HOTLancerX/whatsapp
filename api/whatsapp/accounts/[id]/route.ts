/**
 * plugin/whatsapp/api/whatsapp/accounts/[id]/route.ts
 *
 * GET    /api/whatsapp/accounts/[id] — Get single WhatsApp account
 * PUT    /api/whatsapp/accounts/[id] — Update WhatsApp account
 * DELETE /api/whatsapp/accounts/[id] — Delete WhatsApp account
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppAccount from "../../../../models/WhatsAppAccount";

export const dynamic = "force-dynamic";

interface RouteProps {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
    try {
        const { id } = await params;
        await connectDB();
        const account = await WhatsAppAccount.findById(id).lean();
        if (!account) {
            return NextResponse.json({ error: "WhatsApp account not found." }, { status: 404 });
        }
        return NextResponse.json({ account });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed to get account." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
    try {
        const { id } = await params;
        const body = await req.json();
        await connectDB();

        const account = await WhatsAppAccount.findById(id);
        if (!account) {
            return NextResponse.json({ error: "WhatsApp account not found." }, { status: 404 });
        }

        if (body.isDefault) {
            await WhatsAppAccount.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
        }

        const allowedFields = [
            "name",
            "phoneNumber",
            "phoneNumberId",
            "wabaId",
            "accessToken",
            "verifyToken",
            "appSecret",
            "status",
            "isDefault",
            "aiEnabled",
            "aiModel",
            "aiSystemPrompt",
            "welcomeMessage",
            "offHoursMessage",
            "fallbackMessage",
            "carouselEnabled",
            "carouselMaxCards",
            "carouselRatio",
            "autoReplayMode",
        ];

        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                (account as any)[key] = body[key];
            }
        }

        await account.save();

        return NextResponse.json({ success: true, account });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed to update account." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
    try {
        const { id } = await params;
        await connectDB();
        const deleted = await WhatsAppAccount.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "WhatsApp account not found." }, { status: 404 });
        }

        // If the deleted account was default, pick another one to be default
        if (deleted.isDefault) {
            const nextAccount = await WhatsAppAccount.findOne({});
            if (nextAccount) {
                nextAccount.isDefault = true;
                await nextAccount.save();
            }
        }

        return NextResponse.json({ success: true, message: "Account deleted successfully." });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed to delete account." }, { status: 500 });
    }
}

/**
 * plugin/whatsapp/api/whatsapp/contacts/route.ts
 *
 * GET /api/whatsapp/contacts — List stored WhatsApp customer contacts
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppContact from "../../../models/WhatsAppContact";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);

        const search = searchParams.get("search")?.trim();
        const accountId = searchParams.get("accountId");
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const skip = (page - 1) * limit;

        const query: Record<string, any> = {};
        if (accountId) query.accountId = accountId;
        if (search) {
            query.$or = [
                { phone: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { lastMessageText: { $regex: search, $options: "i" } },
            ];
        }

        const [contacts, total] = await Promise.all([
            WhatsAppContact.find(query)
                .sort({ lastMessageAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("accountId", "name phoneNumber")
                .lean(),
            WhatsAppContact.countDocuments(query),
        ]);

        return NextResponse.json({
            contacts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err: any) {
        console.error("[whatsapp/contacts] GET error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to fetch contacts." },
            { status: 500 }
        );
    }
}

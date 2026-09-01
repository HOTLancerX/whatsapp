/**
 * plugin/whatsapp/api/whatsapp/messages/route.ts
 *
 * GET  /api/whatsapp/messages — Retrieve conversation logs with pagination and filters
 * POST /api/whatsapp/messages — Send a manual message to a customer from admin
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppMessage from "../../../models/WhatsAppMessage";
import WhatsAppAccount from "../../../models/WhatsAppAccount";
import WhatsAppContact from "../../../models/WhatsAppContact";
import { sendTextMessage } from "../../../lib/whatsapp-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);

        const accountId = searchParams.get("accountId");
        const phone = searchParams.get("phone");
        const direction = searchParams.get("direction");
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const skip = (page - 1) * limit;

        const query: Record<string, any> = {};
        if (accountId) query.accountId = accountId;
        if (phone) {
            query.$or = [{ from: phone }, { to: phone }];
        }
        if (direction) query.direction = direction;

        const [messages, total] = await Promise.all([
            WhatsAppMessage.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("accountId", "name phoneNumber")
                .lean(),
            WhatsAppMessage.countDocuments(query),
        ]);

        return NextResponse.json({
            messages,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err: any) {
        console.error("[whatsapp/messages] GET error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to fetch messages." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accountId, to, text } = body;

        if (!to?.trim() || !text?.trim()) {
            return NextResponse.json(
                { error: "Recipient phone number ('to') and message text are required." },
                { status: 400 }
            );
        }

        await connectDB();

        let account = null;
        if (accountId) {
            account = await WhatsAppAccount.findById(accountId);
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ isDefault: true, status: "active" });
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ status: "active" });
        }

        if (!account) {
            return NextResponse.json(
                { error: "No active WhatsApp account available to send message." },
                { status: 400 }
            );
        }

        // Send via WhatsApp Cloud API
        const sendRes = await sendTextMessage(account, to.trim(), text.trim());

        const savedMsg = await WhatsAppMessage.create({
            accountId: account._id,
            from: account.phoneNumber,
            to: to.trim(),
            direction: "outgoing",
            type: "text",
            content: text.trim(),
            status: sendRes.ok ? "sent" : "failed",
            errorMessage: sendRes.error || "",
            timestamp: new Date(),
        });

        // Update contact session
        await WhatsAppContact.updateOne(
            { accountId: account._id, phone: to.trim() },
            {
                $set: {
                    lastMessageText: text.trim(),
                    lastMessageAt: new Date(),
                },
                $push: {
                    conversationContext: {
                        $each: [{ role: "agent", content: text.trim(), timestamp: new Date() }],
                        $slice: -10,
                    },
                },
            },
            { upsert: true }
        );

        if (!sendRes.ok) {
            return NextResponse.json(
                {
                    error: sendRes.error || "Failed to deliver message to WhatsApp.",
                    message: savedMsg,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, message: savedMsg }, { status: 200 });
    } catch (err: any) {
        console.error("[whatsapp/messages] POST error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to send message." },
            { status: 500 }
        );
    }
}

/**
 * plugin/whatsapp/api/whatsapp/stats/route.ts
 *
 * GET /api/whatsapp/stats
 * Aggregates statistics, message volume, active accounts, and activity metrics.
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppAccount from "../../../models/WhatsAppAccount";
import WhatsAppMessage from "../../../models/WhatsAppMessage";
import WhatsAppContact from "../../../models/WhatsAppContact";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectDB();

        const [
            totalAccounts,
            activeAccounts,
            totalMessages,
            incomingCount,
            outgoingCount,
            carouselSentCount,
            totalContacts,
            recentMessages,
        ] = await Promise.all([
            WhatsAppAccount.countDocuments(),
            WhatsAppAccount.countDocuments({ status: "active" }),
            WhatsAppMessage.countDocuments(),
            WhatsAppMessage.countDocuments({ direction: "incoming" }),
            WhatsAppMessage.countDocuments({ direction: "outgoing" }),
            WhatsAppMessage.countDocuments({ carouselSent: true }),
            WhatsAppContact.countDocuments(),
            WhatsAppMessage.find({})
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("accountId", "name phoneNumber")
                .lean(),
        ]);

        return NextResponse.json({
            totalAccounts,
            activeAccounts,
            totalMessages,
            incomingCount,
            outgoingCount,
            carouselSentCount,
            totalContacts,
            autoReplyRate:
                incomingCount > 0
                    ? Math.round((outgoingCount / incomingCount) * 100)
                    : 100,
            recentMessages,
        });
    } catch (err: any) {
        console.error("[whatsapp/stats] error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to load stats." },
            { status: 500 }
        );
    }
}

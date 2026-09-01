/**
 * plugin/whatsapp/api/whatsapp/campaigns/[id]/route.ts
 *
 * GET    /api/whatsapp/campaigns/[id] — Retrieve single campaign details and logs
 * DELETE /api/whatsapp/campaigns/[id] — Delete a campaign record
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppCampaign from "../../../../models/WhatsAppCampaign";

export const dynamic = "force-dynamic";

interface RouteProps {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
    try {
        const { id } = await params;
        await connectDB();
        const campaign = await WhatsAppCampaign.findById(id)
            .populate("accountId", "name phoneNumber")
            .lean();

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || "Failed to get campaign details." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
    try {
        const { id } = await params;
        await connectDB();
        const deleted = await WhatsAppCampaign.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Campaign deleted successfully." });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || "Failed to delete campaign." },
            { status: 500 }
        );
    }
}

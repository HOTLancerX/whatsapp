/**
 * plugin/whatsapp/api/whatsapp/webhook/[accountId]/route.ts
 *
 * Account-specific dedicated webhook endpoint.
 * GET  /api/whatsapp/webhook/[accountId] — Account webhook verification
 * POST /api/whatsapp/webhook/[accountId] — Ingest incoming WhatsApp messages for this specific account
 */

import { NextRequest } from "next/server";
import { handleWebhookVerification, handleWebhookEvent } from "../../../../lib/webhook-handler";

export const dynamic = "force-dynamic";

interface RouteProps {
    params: Promise<{ accountId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
    const { accountId } = await params;
    return handleWebhookVerification(req, accountId);
}

export async function POST(req: NextRequest, { params }: RouteProps) {
    const { accountId } = await params;
    return handleWebhookEvent(req, accountId);
}

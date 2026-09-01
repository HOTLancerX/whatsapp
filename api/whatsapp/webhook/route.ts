/**
 * plugin/whatsapp/api/whatsapp/webhook/route.ts
 *
 * GET  /api/whatsapp/webhook — Meta Webhook verification handshake
 * POST /api/whatsapp/webhook — Ingest incoming WhatsApp messages & auto-reply
 */

import { NextRequest } from "next/server";
import { handleWebhookVerification, handleWebhookEvent } from "../../../lib/webhook-handler";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    return handleWebhookVerification(req);
}

export async function POST(req: NextRequest) {
    return handleWebhookEvent(req);
}

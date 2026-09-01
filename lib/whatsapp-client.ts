/**
 * plugin/whatsapp/lib/whatsapp-client.ts
 *
 * Meta WhatsApp Cloud API client for sending messages, carousels,
 * interactive templates, and verifying incoming webhook payloads.
 */

import crypto from "crypto";
import { type IWhatsAppAccount } from "../models/WhatsAppAccount";

export interface WhatsAppSendResult {
    ok: boolean;
    messageId?: string;
    error?: string;
    raw?: any;
}

const GRAPH_API_VERSION = "v25.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta webhooks.
 */
export function verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null,
    appSecret: string
): boolean {
    if (!signatureHeader || !appSecret) return true; // allow if no secret configured
    try {
        const parts = signatureHeader.split("sha256=");
        if (parts.length !== 2) return false;
        const expectedSignature = crypto
            .createHmac("sha256", appSecret)
            .update(rawBody)
            .digest("hex");
        return crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedSignature));
    } catch {
        return false;
    }
}

/**
 * Sends a raw WhatsApp Cloud API message payload.
 */
export async function sendWhatsAppApiRequest(
    account: IWhatsAppAccount,
    payload: Record<string, any>
): Promise<WhatsAppSendResult> {
    if (!account.phoneNumberId || !account.accessToken) {
        return {
            ok: false,
            error: "Account missing Phone Number ID or Access Token.",
        };
    }

    const endpoint = `${GRAPH_BASE_URL}/${account.phoneNumberId}/messages`;

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${account.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        const data = (await res.json().catch(() => null)) as any;

        if (!res.ok || !data || data.error) {
            const errDetail =
                data?.error?.message ||
                data?.error?.error_data?.details ||
                `HTTP ${res.status}`;
            console.error("[whatsapp/client] API send failed:", errDetail, data);
            return {
                ok: false,
                error: errDetail,
                raw: data,
            };
        }

        const messageId = data.messages?.[0]?.id;
        return {
            ok: true,
            messageId,
            raw: data,
        };
    } catch (err: any) {
        console.error("[whatsapp/client] Network error calling WhatsApp API:", err);
        return {
            ok: false,
            error: err?.message || "Network error calling WhatsApp API.",
        };
    }
}

/**
 * Sends a plain text message to a recipient phone number.
 */
export async function sendTextMessage(
    account: IWhatsAppAccount,
    to: string,
    text: string,
    previewUrl: boolean = true
): Promise<WhatsAppSendResult> {
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
            preview_url: previewUrl,
            body: text,
        },
    };
    return sendWhatsAppApiRequest(account, payload);
}

/**
 * Sends an interactive message (Carousel, List, or Quick Reply Buttons).
 */
export async function sendInteractiveMessage(
    account: IWhatsAppAccount,
    payload: Record<string, any>
): Promise<WhatsAppSendResult> {
    return sendWhatsAppApiRequest(account, payload);
}

/**
 * Sends an image message with optional caption.
 */
export async function sendImageMessage(
    account: IWhatsAppAccount,
    to: string,
    imageUrl: string,
    caption?: string
): Promise<WhatsAppSendResult> {
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
            link: imageUrl,
            caption: caption ? caption.slice(0, 1024) : undefined,
        },
    };
    return sendWhatsAppApiRequest(account, payload);
}

/**
 * Sends a pre-approved WhatsApp message template.
 */
export async function sendTemplateMessage(
    account: IWhatsAppAccount,
    to: string,
    templateName: string,
    languageCode: string = "en_US",
    parameters: string[] = []
): Promise<WhatsAppSendResult> {
    const components: any[] = [];
    if (parameters.length > 0) {
        components.push({
            type: "body",
            parameters: parameters.map((text) => ({ type: "text", text })),
        });
    }

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
            name: templateName,
            language: {
                code: languageCode,
            },
            components: components.length > 0 ? components : undefined,
        },
    };
    return sendWhatsAppApiRequest(account, payload);
}

/**
 * Marks an incoming message as read.
 */
export async function markMessageAsRead(
    account: IWhatsAppAccount,
    messageId: string
): Promise<boolean> {
    if (!account.phoneNumberId || !account.accessToken || !messageId) return false;
    const endpoint = `${GRAPH_BASE_URL}/${account.phoneNumberId}/messages`;
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${account.accessToken}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                status: "read",
                message_id: messageId,
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

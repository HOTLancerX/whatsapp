/**
 * plugin/whatsapp/api/whatsapp/models/route.ts
 *
 * GET /api/whatsapp/models
 * Fetches available AI models from the configured AI provider.
 */

import { NextResponse } from "next/server";
import { Settings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const settings = await Settings();

        const apiUrl =
            (settings.whatsapp_ai_api_url as string | undefined)?.trim() ||
            (settings.ai_chat_api_url as string | undefined)?.trim() ||
            "https://api.openai.com/v1/chat/completions";

        const apiKey =
            (settings.whatsapp_ai_api_key as string | undefined)?.trim() ||
            (settings.ai_chat_api_key as string | undefined)?.trim() ||
            "";

        if (!apiKey) {
            return NextResponse.json({ error: "AI API key is not configured." }, { status: 400 });
        }

        let modelsUrl: string;
        try {
            const url = new URL(apiUrl);
            const basePath = url.pathname.replace(/\/chat\/completions\/?$/, "");
            modelsUrl = `${url.origin}${basePath}/models`;
        } catch {
            modelsUrl = "https://api.openai.com/v1/models";
        }

        const res = await fetch(modelsUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            console.error("[whatsapp/models] error:", res.status, errText);
            return NextResponse.json(
                { error: `Provider returned HTTP ${res.status}. Verify your API URL and key.` },
                { status: 502 }
            );
        }

        const data = (await res.json().catch(() => ({}))) as any;

        let models: string[] = [];
        if (Array.isArray(data.data)) {
            models = data.data.map((m: any) => m.id).filter(Boolean).sort();
        } else if (Array.isArray(data.models)) {
            models = data.models.map((m: any) => m.id).filter(Boolean).sort();
        } else if (Array.isArray(data)) {
            models = data.map((m: any) => m.id ?? m).filter(Boolean).sort();
        }

        return NextResponse.json({ models });
    } catch (err: any) {
        console.error("[whatsapp/models] route error:", err);
        return NextResponse.json({ error: err?.message || "Internal server error." }, { status: 500 });
    }
}

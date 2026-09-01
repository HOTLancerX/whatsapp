/**
 * plugin/whatsapp/index.ts — WhatsApp Auto-Reply & Carousel Bot Plugin.
 *
 * Automatically collects products, pricing, stock, categories, and store knowledge
 * from the CMS database to respond to incoming WhatsApp inquiries with conversational AI
 * and interactive product carousels across multiple WhatsApp Cloud API accounts.
 *
 * Features:
 *   • Multi-Account Manager (Multiple WhatsApp numbers, WABA IDs & Tokens)
 *   • Real-Time CMS Knowledge & Catalog Collector (Products, Prices, Permalinks)
 *   • Token matching with dynamic Ratio & Relevance scoring
 *   • OpenAI-compatible AI Chat completions brain (OpenAI, Groq, Together, DeepSeek, Ollama)
 *   • Meta WhatsApp Cloud API Interactive Carousel Messages (1:1, 16:9, 4:3 ratios)
 *   • Fallback Interactive Lists, Quick Reply buttons, and Rich Text formatting
 *   • Webhook auto-verification & deduplication (`wamid`)
 *   • Live Admin Inbox, Message logs, and Real-Time Simulator Sandbox
 *
 * Admin page:
 *   URL: /admin/whatsapp
 */

import { addHook, type PluginMeta } from "@/hook";
import WhatsAppAdminPage from "./ui/page";

// ─── Plugin Metadata ──────────────────────────────────────────────────────────
export const PLUGINS: PluginMeta = {
    nx: "whatsapp",
    name: "WhatsApp Bot",
    version: "1.0.0",
    description: "WhatsApp auto-reply bot with AI knowledge extraction, multi-account support, and interactive product carousels.",
    author: "System",
    path: "https://github.com/HOTLancerX/whatsapp.git",
    icon: "fa:whatsapp",
    color: "from-emerald-500 to-green-500",
};

/**
 * Register hooks for this plugin.
 */
export function register() {
    // ─── Admin Sidebar Nav ────────────────────────────────────────────────────
    addHook(
        "admin.nav",
        [
            {
                key: "whatsapp",
                label: "WhatsApp Bot",
                icon: "fa:whatsapp",
                slug: "whatsapp",
                parent: "",
                position: 84,
            },
        ],
        PLUGINS.nx
    );

    // ─── Admin Management Page ────────────────────────────────────────────────
    // URL: /admin/whatsapp
    addHook(
        "admin.pages",
        [
            {
                key: "whatsapp",
                label: "WhatsApp Bot Management",
                type: "whatsapp-manager",
                style: "left",
                position: 12,
                path: WhatsAppAdminPage,
            },
        ],
        PLUGINS.nx
    );
}

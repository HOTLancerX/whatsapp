"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface OverviewTabProps {
    onNavigateTab: (tabId: string) => void;
    onAddAccount: () => void;
}

export default function OverviewTab({ onNavigateTab, onAddAccount }: OverviewTabProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/whatsapp/stats", { cache: "no-store" });
            const data = await res.json();
            setStats(data);
        } catch {
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/whatsapp/webhook` : "/api/whatsapp/webhook";

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 2000);
    };

    const cards = [
        {
            title: "Total Inbound Messages",
            value: stats?.incomingCount ?? 0,
            icon: "solar:chat-round-line-bold",
            color: "from-blue-500 to-indigo-600",
            bgLight: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
        },
        {
            title: "Auto-Replies Sent",
            value: stats?.outgoingCount ?? 0,
            icon: "solar:magic-stick-3-bold",
            color: "from-emerald-500 to-teal-600",
            bgLight: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
            sub: `${stats?.autoReplyRate ?? 100}% Response Rate`,
        },
        {
            title: "Carousel & Product Cards",
            value: stats?.carouselSentCount ?? 0,
            icon: "solar:widget-2-bold",
            color: "from-purple-500 to-violet-600",
            bgLight: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
        },
        {
            title: "Active WhatsApp Accounts",
            value: stats?.activeAccounts ?? 0,
            icon: "fa:whatsapp",
            color: "from-green-500 to-emerald-600",
            bgLight: "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
            sub: `${stats?.totalAccounts ?? 0} Total Connected`,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="relative z-10 max-w-xl space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
                        <Icon icon="solar:sparkles-bold" width={14} className="text-amber-300" />
                        <span>AI Knowledge & Dynamic Carousel Engine</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        WhatsApp Auto-Reply & Carousel Bot
                    </h2>
                    <p className="text-sm text-emerald-100/90 leading-relaxed">
                        Seamlessly collects published store items, prices, and knowledge from your CMS to auto-replay with conversational AI and interactive product carousels across multiple WhatsApp accounts.
                    </p>
                </div>

                <div className="relative z-10 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onAddAccount}
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-800 font-bold text-xs shadow-lg transition flex items-center gap-2 active:scale-98"
                    >
                        <Icon icon="solar:add-circle-bold" width={16} />
                        <span>Connect Account</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigateTab("simulator")}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 border border-white/20 text-white font-bold text-xs backdrop-blur-xs transition flex items-center gap-2 active:scale-98"
                    >
                        <Icon icon="solar:play-circle-bold" width={16} />
                        <span>Launch Simulator</span>
                    </button>
                </div>

                {/* Decorative background shapes */}
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-36 top-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.title}</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bgLight}`}>
                                <Icon icon={c.icon} width={20} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {loading ? "..." : c.value.toLocaleString()}
                            </span>
                            {c.sub && (
                                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {c.sub}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Webhook Configuration Quick Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Icon icon="solar:link-circle-bold" width={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Meta Webhook Configuration</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure this callback URL inside your Meta WhatsApp App dashboard.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchStats}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                        <Icon icon="solar:refresh-bold" width={14} />
                        <span>Refresh</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Callback URL (Webhook)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                className="flex-1 text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(webhookUrl)}
                                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
                            >
                                <Icon icon={copiedWebhook ? "solar:check-circle-bold" : "solar:copy-bold"} width={14} />
                                <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Verify Token</label>
                        <input
                            type="text"
                            readOnly
                            value="ephoto_wa_verify_token"
                            className="w-full text-xs font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Message Activity Stream */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:history-bold" width={18} className="text-emerald-500" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent WhatsApp Activity</h4>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigateTab("inbox")}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                        <span>View All Inbox Logs</span>
                        <Icon icon="solar:arrow-right-linear" width={12} />
                    </button>
                </div>

                {stats?.recentMessages?.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stats.recentMessages.map((msg: any) => (
                            <div key={msg._id} className="py-3 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                                            msg.direction === "incoming" ? "bg-blue-500" : "bg-emerald-500"
                                        }`}
                                    >
                                        <Icon
                                            icon={msg.direction === "incoming" ? "solar:arrow-down-linear" : "solar:arrow-up-linear"}
                                            width={16}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                                {msg.direction === "incoming" ? msg.senderName || msg.from : msg.to}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                                                {msg.type}
                                            </span>
                                            {msg.carouselSent && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                                    <Icon icon="solar:widget-2-bold" width={10} /> Carousel
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>

                                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                        No WhatsApp message activity recorded yet. Try running the Simulator or send a message to your WhatsApp number!
                    </div>
                )}
            </div>
        </div>
    );
}

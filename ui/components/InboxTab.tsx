"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function InboxTab() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/whatsapp/messages?limit=100", { cache: "no-store" });
            const data = await res.json();
            const list = data.messages || [];
            setMessages(list);

            if (!selectedPhone && list.length > 0) {
                const firstCustomer = list.find((m: any) => m.direction === "incoming")?.from || list[0]?.from || list[0]?.to;
                setSelectedPhone(firstCustomer);
            }
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Group messages by contact phone number
    const threadsMap = new Map<string, { phone: string; name: string; lastMsg: any; messages: any[] }>();

    for (const msg of messages) {
        const contactPhone = msg.direction === "incoming" ? msg.from : msg.to;
        if (!contactPhone) continue;

        if (!threadsMap.has(contactPhone)) {
            threadsMap.set(contactPhone, {
                phone: contactPhone,
                name: msg.senderName || contactPhone,
                lastMsg: msg,
                messages: [],
            });
        }
        threadsMap.get(contactPhone)!.messages.push(msg);
    }

    const threads = Array.from(threadsMap.values()).filter(
        (t) =>
            t.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.lastMsg.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeThread = selectedPhone ? threadsMap.get(selectedPhone) : null;
    const activeMessages = activeThread ? [...activeThread.messages].reverse() : [];

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPhone || !replyText.trim() || sending) return;

        setSending(true);
        setSendError("");

        try {
            const res = await fetch("/api/whatsapp/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: selectedPhone,
                    text: replyText.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSendError(data.error || "Failed to send manual WhatsApp reply.");
                return;
            }

            setReplyText("");
            fetchMessages();
        } catch (err: any) {
            setSendError(err?.message || "Network error while sending.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Live Inbox & Logs</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        View customer inquiries, AI auto-replies, matched products, and take over with manual responses.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchMessages}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                    <Icon icon="solar:refresh-bold" width={14} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Split Screen Inbox Layout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-150 max-h-180">
                {/* Left Column: Thread List */}
                <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Icon icon="solar:magnifer-linear" width={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search phone or text..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs bg-transparent focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                <Icon icon="svg-spinners:ring-resize" width={20} className="mx-auto mb-2" />
                                Loading conversations...
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs px-4">
                                No conversations found.
                            </div>
                        ) : (
                            threads.map((t) => (
                                <button
                                    key={t.phone}
                                    type="button"
                                    onClick={() => setSelectedPhone(t.phone)}
                                    className={`w-full text-left p-3 transition flex items-start gap-3 ${
                                        selectedPhone === t.phone
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800/40"
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                        <Icon icon="solar:user-bold" width={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                                {t.name || t.phone}
                                            </span>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                {new Date(t.lastMsg?.timestamp || t.lastMsg?.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {t.lastMsg?.content || "(No message content)"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Chat History & Reply */}
                <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900">
                    {activeThread ? (
                        <>
                            {/* Thread Header */}
                            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-900/40">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                        <Icon icon="fa:whatsapp" width={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                            {activeThread.name}
                                        </h4>
                                        <span className="text-[10px] font-mono text-slate-500">{activeThread.phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Bubble Stream */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                                {activeMessages.map((m: any, idx: number) => {
                                    const isCustomer = m.direction === "incoming";
                                    return (
                                        <div
                                            key={m._id || idx}
                                            className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl p-3 shadow-xs space-y-1.5 ${
                                                    isCustomer
                                                        ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                                                        : "bg-emerald-600 text-white"
                                                }`}
                                            >
                                                <div className="text-xs whitespace-pre-wrap leading-relaxed">
                                                    {m.content}
                                                </div>

                                                {/* Matched Products Card inside Outgoing AI Bubble */}
                                                {m.productsFound && m.productsFound.length > 0 && (
                                                    <div className="pt-2 mt-2 border-t border-emerald-500/40 space-y-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-emerald-100 flex items-center gap-1">
                                                            <Icon icon="solar:widget-2-bold" width={12} />
                                                            <span>Attached Product Cards ({m.productsFound.length})</span>
                                                        </span>
                                                        <div className="space-y-1">
                                                            {m.productsFound.map((p: any, pIdx: number) => (
                                                                <div
                                                                    key={pIdx}
                                                                    className="bg-emerald-700/60 rounded-lg p-1.5 text-[11px] flex items-center justify-between gap-2"
                                                                >
                                                                    <span className="truncate font-semibold">{p.title}</span>
                                                                    <span className="shrink-0 font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded text-[10px]">
                                                                        {p.price}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div
                                                    className={`flex items-center justify-end gap-1 text-[9px] ${
                                                        isCustomer ? "text-slate-400" : "text-emerald-200"
                                                    }`}
                                                >
                                                    <span>
                                                        {new Date(m.timestamp || m.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                    {!isCustomer && (
                                                        <Icon
                                                            icon={
                                                                m.status === "failed"
                                                                    ? "solar:danger-triangle-bold"
                                                                    : "solar:check-read-linear"
                                                            }
                                                            width={12}
                                                            className={m.status === "failed" ? "text-red-300" : "text-sky-200"}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Error notification if failed to send */}
                            {sendError && (
                                <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-4 border-t border-red-500/20">
                                    {sendError}
                                </div>
                            )}

                            {/* Manual Human Agent Reply Input Box */}
                            <form
                                onSubmit={handleSendReply}
                                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
                            >
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type a manual WhatsApp message to this customer..."
                                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!replyText.trim() || sending}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Icon icon={sending ? "svg-spinners:ring-resize" : "solar:plain-bold"} width={16} />
                                    <span>Send</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                            <Icon icon="solar:chat-round-call-bold" width={36} className="mb-2 opacity-60" />
                            <p className="text-xs">Select a conversation thread on the left to view message details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

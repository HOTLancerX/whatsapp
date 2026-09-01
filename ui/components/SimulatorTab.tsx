"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import WhatsAppPhoneMockup from "./WhatsAppPhoneMockup";
import { type IMatchedProduct } from "../../models/WhatsAppMessage";

export default function SimulatorTab() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [simulating, setSimulating] = useState(false);

    const [userMessage, setUserMessage] = useState("Do you have running shoes in stock?");
    const [aiReply, setAiReply] = useState<string>("");
    const [matchedProducts, setMatchedProducts] = useState<IMatchedProduct[]>([]);
    const [debugData, setDebugData] = useState<any | null>(null);

    const queryPresets = [
        "Do you have running shoes in stock?",
        "What are your top recommended products?",
        "How much does delivery cost and what is your return policy?",
        "Show me electronics under $500",
        "Hello! Tell me about your store and what you sell.",
    ];

    useEffect(() => {
        fetch("/api/whatsapp/accounts", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                const list = data.accounts || [];
                setAccounts(list);
                if (list.length > 0) {
                    const def = list.find((a: any) => a.isDefault) || list[0];
                    setSelectedAccountId(def._id);
                }
            })
            .catch(() => {});

        // Run initial simulation on load
        handleSimulate("Do you have running shoes in stock?");
    }, []);

    const handleSimulate = async (queryText: string) => {
        const text = queryText.trim();
        if (!text || simulating) return;

        setUserMessage(text);
        setSimulating(true);
        setAiReply("");
        setMatchedProducts([]);
        setDebugData(null);

        try {
            const res = await fetch("/api/whatsapp/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    accountId: selectedAccountId || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                setAiReply(data.aiReply || "Here are the top matches found:");
                setMatchedProducts(data.matchedProducts || []);
                setDebugData(data);
            } else {
                setAiReply(`Simulation error: ${data.error || "Failed to process query."}`);
            }
        } catch {
            setAiReply("Network error during simulation.");
        } finally {
            setSimulating(false);
        }
    };

    const selectedAccount = accounts.find((a) => a._id === selectedAccountId);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Live Simulator Sandbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test how the bot collects database information, computes product match ratios, and renders interactive carousel cards on WhatsApp.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Simulator Controls & Inspector Column */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Account Selector */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white">
                            Select WhatsApp Account to Simulate
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 font-semibold"
                        >
                            {accounts.map((a) => (
                                <option key={a._id} value={a._id}>
                                    {a.name} ({a.phoneNumber}) {a.isDefault ? "— [Primary]" : ""}
                                </option>
                            ))}
                            {accounts.length === 0 && <option value="">Global Default Bot</option>}
                        </select>
                    </div>

                    {/* Query Input Box */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white">
                            Simulated Customer Message
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSimulate(messageInput);
                                    }
                                }}
                                placeholder="Type any query (e.g. 'Show me organic honey', 'What is the price of shoes?')..."
                                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={() => handleSimulate(messageInput)}
                                disabled={!messageInput.trim() || simulating}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                                <Icon icon={simulating ? "svg-spinners:ring-resize" : "solar:plain-bold"} width={16} />
                                <span>{simulating ? "Processing..." : "Send Test"}</span>
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Try Instant Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {queryPresets.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setMessageInput(preset);
                                            handleSimulate(preset);
                                        }}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 transition text-left border border-slate-200 dark:border-slate-700/60"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Debug & Knowledge Inspection Panel */}
                    {debugData && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:code-circle-bold" width={18} className="text-emerald-500" />
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                        Knowledge Extraction & Ratio Breakdown
                                    </h4>
                                </div>
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                                    Intent: {debugData.intent}
                                </span>
                            </div>

                            {/* Search tokens */}
                            <div className="text-[11px] space-y-1">
                                <span className="text-slate-400 block text-[10px]">Extracted Search Tokens:</span>
                                <div className="flex flex-wrap gap-1">
                                    {debugData.searchTokens?.map((tok: string, i: number) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold"
                                        >
                                            {tok}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Products matched with ratio */}
                            <div className="space-y-1.5 pt-1">
                                <span className="text-slate-400 block text-[10px]">
                                    Matched Catalog Items ({debugData.totalFound}):
                                </span>
                                <div className="space-y-1 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {debugData.matchedProducts?.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="py-1.5 flex items-center justify-between gap-2 text-xs"
                                        >
                                            <div className="min-w-0 truncate">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                                    {p.title}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">{p.price}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    {Math.round(p.matchRatio * 100)}% match
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live WhatsApp Mockup Display Column */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                        <Icon icon="fa:whatsapp" width={14} />
                        <span>Live Simulated WhatsApp Experience</span>
                    </p>
                    <WhatsAppPhoneMockup
                        contactName={selectedAccount?.name || "WhatsApp Bot"}
                        contactPhone={selectedAccount?.phoneNumber || "+1 555 0192"}
                        userMessage={userMessage}
                        aiReply={aiReply}
                        matchedProducts={matchedProducts}
                        carouselRatio={selectedAccount?.carouselRatio || "1:1"}
                        isLoading={simulating}
                    />
                </div>
            </div>
        </div>
    );
}

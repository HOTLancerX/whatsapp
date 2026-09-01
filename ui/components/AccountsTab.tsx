"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface AccountsTabProps {
    onAddAccount: () => void;
    onEditAccount: (account: any) => void;
}

export default function AccountsTab({ onAddAccount, onEditAccount }: AccountsTabProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message?: string }>>({});

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/whatsapp/accounts", { cache: "no-store" });
            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch {
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove the WhatsApp account "${name}"?`)) return;
        try {
            const res = await fetch(`/api/whatsapp/accounts/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchAccounts();
            } else {
                alert("Failed to delete account.");
            }
        } catch {
            alert("Network error.");
        }
    };

    const handleCopyWebhook = (id: string) => {
        const url = `${window.location.origin}/api/whatsapp/webhook/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleTest = async (account: any) => {
        setTestingId(account._id);
        try {
            const res = await fetch("/api/whatsapp/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testType: "whatsapp",
                    accountId: account._id,
                }),
            });
            const data = await res.json();
            setTestResults((prev) => ({
                ...prev,
                [account._id]: {
                    ok: data.ok,
                    message: data.ok
                        ? `Live: ${data.account?.displayPhoneNumber || account.phoneNumber} (${data.account?.qualityRating || "GREEN"})`
                        : data.error || "Connection failed",
                },
            }));
        } catch {
            setTestResults((prev) => ({
                ...prev,
                [account._id]: { ok: false, message: "Network test error" },
            }));
        } finally {
            setTestingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Connected WhatsApp Accounts</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage multiple WhatsApp Cloud API business lines, department numbers, and custom auto-replies.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchAccounts}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                        <Icon icon="solar:refresh-bold" width={14} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={onAddAccount}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                        <Icon icon="solar:add-circle-bold" width={16} />
                        <span>Add Account</span>
                    </button>
                </div>
            </div>

            {/* Accounts List Cards */}
            {loading ? (
                <div className="py-16 flex items-center justify-center text-slate-400">
                    <Icon icon="svg-spinners:ring-resize" width={28} />
                </div>
            ) : accounts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <Icon icon="fa:whatsapp" width={32} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">No WhatsApp accounts connected yet</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Connect your Meta Cloud API Phone Number ID and Access Token to begin auto-replying to WhatsApp inquiries with store product carousels.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onAddAccount}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" width={16} />
                        <span>Connect First Account</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((acc) => {
                        const testRes = testResults[acc._id];
                        const isTesting = testingId === acc._id;

                        return (
                            <div
                                key={acc._id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition"
                            >
                                <div className="space-y-3">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                                <Icon icon="fa:whatsapp" width={22} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                                        {acc.name}
                                                    </h4>
                                                    {acc.isDefault && (
                                                        <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-mono text-slate-500">{acc.phoneNumber}</p>
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                acc.status === "active"
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                    : acc.status === "sandbox"
                                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                            }`}
                                        >
                                            {acc.status}
                                        </span>
                                    </div>

                                    {/* Account Meta Badges */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-slate-400 block text-[10px]">Phone Number ID:</span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold truncate block">
                                                {acc.phoneNumberId}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px]">Replay Strategy:</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-semibold capitalize block truncate">
                                                {acc.autoReplayMode?.replace(/_/g, " ") || "AI & Carousel"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px]">Carousel Aspect:</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                                {acc.carouselRatio || "1:1"} ({acc.carouselMaxCards || 5} cards)
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px]">Messages Processed:</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                                {acc.totalMessages || 0} in / {acc.totalReplies || 0} out
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dedicated Webhook URL */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold text-slate-400">Dedicated Webhook:</span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook/${acc._id}`}
                                                className="flex-1 text-[10px] font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 select-all truncate border border-slate-200 dark:border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleCopyWebhook(acc._id)}
                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition"
                                                title="Copy Webhook URL"
                                            >
                                                <Icon icon={copiedId === acc._id ? "solar:check-circle-bold" : "solar:copy-bold"} width={14} className={copiedId === acc._id ? "text-emerald-500" : ""} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Test Result Message */}
                                    {testRes && (
                                        <div
                                            className={`p-2 text-[11px] rounded-lg flex items-center gap-1.5 border ${
                                                testRes.ok
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                            <Icon icon={testRes.ok ? "solar:check-circle-bold" : "solar:close-circle-bold"} width={14} />
                                            <span className="truncate">{testRes.message}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTest(acc)}
                                        disabled={isTesting}
                                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition flex items-center gap-1"
                                    >
                                        <Icon icon={isTesting ? "svg-spinners:ring-resize" : "solar:shield-check-bold"} width={14} />
                                        <span>{isTesting ? "Testing..." : "Test"}</span>
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onEditAccount(acc)}
                                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition flex items-center gap-1"
                                        >
                                            <Icon icon="solar:pen-bold" width={13} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(acc._id, acc.name)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                            title="Delete Account"
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" width={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

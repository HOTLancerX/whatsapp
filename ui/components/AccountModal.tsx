"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    account?: any | null;
}

export default function AccountModal({
    isOpen,
    onClose,
    onSaved,
    account,
}: AccountModalProps) {
    const isEdit = Boolean(account?._id);

    const [tab, setTab] = useState<"general" | "credentials" | "ai" | "carousel">("general");

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneNumberId, setPhoneNumberId] = useState("");
    const [wabaId, setWabaId] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [verifyToken, setVerifyToken] = useState("ephoto_wa_verify_token");
    const [appSecret, setAppSecret] = useState("");
    const [status, setStatus] = useState<"active" | "inactive" | "sandbox">("active");
    const [isDefault, setIsDefault] = useState(false);

    // AI & Custom prompts
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiModel, setAiModel] = useState("");
    const [aiSystemPrompt, setAiSystemPrompt] = useState("");
    const [welcomeMessage, setWelcomeMsg] = useState("Hello! Welcome to our store. How can we help you today?");
    const [fallbackMessage, setFallbackMsg] = useState("Sorry, I could not find matching products. Let me connect you with an agent.");

    // Carousel & Replay
    const [carouselEnabled, setCarouselEnabled] = useState(true);
    const [carouselMaxCards, setCarouselMaxCards] = useState(5);
    const [carouselRatio, setCarouselRatio] = useState<"1:1" | "16:9" | "4:3" | "auto">("1:1");
    const [autoReplayMode, setAutoReplayMode] = useState("ai_and_carousel");

    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

    useEffect(() => {
        if (account) {
            setName(account.name || "");
            setPhoneNumber(account.phoneNumber || "");
            setPhoneNumberId(account.phoneNumberId || "");
            setWabaId(account.wabaId || "");
            setAccessToken(account.accessToken || "");
            setVerifyToken(account.verifyToken || "ephoto_wa_verify_token");
            setAppSecret(account.appSecret || "");
            setStatus(account.status || "active");
            setIsDefault(Boolean(account.isDefault));
            setAiEnabled(account.aiEnabled ?? true);
            setAiModel(account.aiModel || "");
            setAiSystemPrompt(account.aiSystemPrompt || "");
            setWelcomeMsg(account.welcomeMessage || "Hello! Welcome to our store. How can we help you today?");
            setFallbackMsg(account.fallbackMessage || "Sorry, I could not find matching products.");
            setCarouselEnabled(account.carouselEnabled ?? true);
            setCarouselMaxCards(account.carouselMaxCards || 5);
            setCarouselRatio(account.carouselRatio || "1:1");
            setAutoReplayMode(account.autoReplayMode || "ai_and_carousel");
        } else {
            setName("");
            setPhoneNumber("");
            setPhoneNumberId("");
            setWabaId("");
            setAccessToken("");
            setVerifyToken("ephoto_wa_verify_token");
            setAppSecret("");
            setStatus("active");
            setIsDefault(false);
            setAiEnabled(true);
            setAiModel("");
            setAiSystemPrompt("");
            setWelcomeMsg("Hello! Welcome to our store. How can we help you today?");
            setFallbackMsg("Sorry, I could not find matching products. Let me connect you with an agent.");
            setCarouselEnabled(true);
            setCarouselMaxCards(5);
            setCarouselRatio("1:1");
            setAutoReplayMode("ai_and_carousel");
        }
        setErrorMsg("");
        setTestResult(null);
        setTab("general");
    }, [account, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSaving(true);

        try {
            const url = isEdit
                ? `/api/whatsapp/accounts/${account._id}`
                : "/api/whatsapp/accounts";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phoneNumber,
                    phoneNumberId,
                    wabaId,
                    accessToken,
                    verifyToken,
                    appSecret,
                    status,
                    isDefault,
                    aiEnabled,
                    aiModel,
                    aiSystemPrompt,
                    welcomeMessage,
                    fallbackMessage,
                    carouselEnabled,
                    carouselMaxCards,
                    carouselRatio,
                    autoReplayMode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Failed to save WhatsApp account.");
                return;
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || "Network error while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        setErrorMsg("");

        try {
            const res = await fetch("/api/whatsapp/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testType: "whatsapp",
                    accountId: account?._id,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setTestResult({
                    ok: true,
                    message: `Verified! Phone: ${data.account?.displayPhoneNumber || phoneNumber}, Quality: ${data.account?.qualityRating || "GREEN"}`,
                });
            } else {
                setTestResult({
                    ok: false,
                    message: data.error || "WhatsApp Cloud API connection test failed.",
                });
            }
        } catch {
            setTestResult({
                ok: false,
                message: "Network error during connection test.",
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Icon icon="fa:whatsapp" width={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                {isEdit ? "Edit WhatsApp Account" : "Connect New WhatsApp Account"}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure Meta Cloud API credentials, auto-reply rules, and carousel formatting.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
                    >
                        <Icon icon="solar:close-circle-bold" width={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-2 bg-white dark:bg-slate-900">
                    {[
                        { id: "general", label: "General", icon: "solar:settings-bold" },
                        { id: "credentials", label: "Cloud API Keys", icon: "solar:key-minimalistic-bold" },
                        { id: "ai", label: "AI & Greetings", icon: "solar:magic-stick-3-bold" },
                        { id: "carousel", label: "Carousel & Ratio", icon: "solar:widget-2-bold" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition ${
                                tab === t.id
                                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            <Icon icon={t.icon} width={15} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-800 dark:text-slate-200">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                            <Icon icon="solar:danger-triangle-bold" width={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {testResult && (
                        <div
                            className={`p-3 text-xs rounded-xl flex items-center gap-2 border ${
                                testResult.ok
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                            }`}
                        >
                            <Icon icon={testResult.ok ? "solar:check-circle-bold" : "solar:close-circle-bold"} width={16} />
                            <span>{testResult.message}</span>
                        </div>
                    )}

                    {/* ── GENERAL TAB ── */}
                    {tab === "general" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Account Display Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Main Sales WhatsApp"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">WhatsApp Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="e.g. +1 555 123 4567"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Account Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    >
                                        <option value="active">Active (Replying)</option>
                                        <option value="sandbox">Sandbox / Testing</option>
                                        <option value="inactive">Inactive (Paused)</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                                        <input
                                            type="checkbox"
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                        />
                                        <span>Primary / Default Account</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Auto-Replay Mode</label>
                                <select
                                    value={autoReplayMode}
                                    onChange={(e) => setAutoReplayMode(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                >
                                    <option value="ai_and_carousel">AI Conversational Reply + Product Carousel Cards</option>
                                    <option value="carousel_only">Product Carousel Cards Only</option>
                                    <option value="ai_text_only">AI Text Reply Only</option>
                                    <option value="interactive_menu">Interactive Quick Menu</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ── CREDENTIALS TAB ── */}
                    {tab === "credentials" && (
                        <div className="space-y-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl leading-relaxed">
                                Get your <strong>Phone Number ID</strong> and <strong>Permanent System User Access Token</strong> from your Meta Developer Portal (App Dashboard → WhatsApp → API Setup).
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Phone Number ID *</label>
                                    <input
                                        type="text"
                                        required
                                        value={phoneNumberId}
                                        onChange={(e) => setPhoneNumberId(e.target.value)}
                                        placeholder="e.g. 104928374928374"
                                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">WhatsApp Business Account ID (WABA ID)</label>
                                    <input
                                        type="text"
                                        value={wabaId}
                                        onChange={(e) => setWabaId(e.target.value)}
                                        placeholder="e.g. 102938475628192"
                                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Meta Cloud API Access Token *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="EAAG... (Permanent System User Token)"
                                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Webhook Verify Token</label>
                                    <input
                                        type="text"
                                        value={verifyToken}
                                        onChange={(e) => setVerifyToken(e.target.value)}
                                        placeholder="ephoto_wa_verify_token"
                                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Meta App Secret (Optional HMAC verification)</label>
                                    <input
                                        type="password"
                                        value={appSecret}
                                        onChange={(e) => setAppSecret(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                            </div>

                            {isEdit && (
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testing}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
                                    >
                                        <Icon icon={testing ? "svg-spinners:ring-resize" : "solar:shield-check-bold"} width={16} />
                                        <span>{testing ? "Testing Meta Connection..." : "Test Cloud API Connection"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── AI & GREETINGS TAB ── */}
                    {tab === "ai" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-xs font-bold">Enable AI Auto-Replies for this Account</p>
                                    <p className="text-[11px] text-slate-500">Collects database products and answers queries automatically.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiEnabled}
                                    onChange={(e) => setAiEnabled(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Custom AI Model Override (Optional)</label>
                                <input
                                    type="text"
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                    placeholder="Leave empty to use global default (e.g. gpt-4o-mini)"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Custom Account Prompt / Persona</label>
                                <textarea
                                    rows={3}
                                    value={aiSystemPrompt}
                                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                                    placeholder="e.g. You are representing the Luxury Footwear department. Tone should be premium, courteous, and concise."
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Welcome Message Greeting</label>
                                <input
                                    type="text"
                                    value={welcomeMessage}
                                    onChange={(e) => setWelcomeMsg(e.target.value)}
                                    placeholder="Hello! Welcome to our store. How can we help you today?"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── CAROUSEL TAB ── */}
                    {tab === "carousel" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="text-xs font-bold">Enable Product Carousel / Interactive Cards</p>
                                    <p className="text-[11px] text-slate-500">Sends horizontal product cards with image, price, and CTA.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={carouselEnabled}
                                    onChange={(e) => setCarouselEnabled(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Image Aspect Ratio in Cards</label>
                                    <select
                                        value={carouselRatio}
                                        onChange={(e) => setCarouselRatio(e.target.value as any)}
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    >
                                        <option value="1:1">1:1 Square (Best for Products)</option>
                                        <option value="16:9">16:9 Widescreen</option>
                                        <option value="4:3">4:3 Standard</option>
                                        <option value="auto">Auto / Original</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Maximum Carousel Cards ({carouselMaxCards})</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        value={carouselMaxCards}
                                        onChange={(e) => setCarouselMaxCards(parseInt(e.target.value, 10))}
                                        className="w-full accent-emerald-500 mt-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Icon icon="svg-spinners:ring-resize" width={16} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:check-circle-bold" width={16} />
                                    <span>{isEdit ? "Update Account" : "Connect Account"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

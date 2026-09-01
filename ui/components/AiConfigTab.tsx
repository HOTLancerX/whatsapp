"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import useSettings from "@/lib/useSettings";
import { xFetch } from "@/lib/express";

export default function AiConfigTab() {
    const { settings, loading } = useSettings();

    const [apiUrl, setApiUrl] = useState("https://api.openai.com/v1/chat/completions");
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("gpt-4o-mini");
    const [maxWords, setMaxWords] = useState("160");
    const [storeInfo, setStoreInfo] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; reply?: string; error?: string } | null>(null);

    useEffect(() => {
        if (!loading && settings) {
            if (settings.whatsapp_ai_api_url || settings.ai_chat_api_url) {
                setApiUrl(settings.whatsapp_ai_api_url || settings.ai_chat_api_url);
            }
            if (settings.whatsapp_ai_api_key || settings.ai_chat_api_key) {
                setApiKey(settings.whatsapp_ai_api_key || settings.ai_chat_api_key);
            }
            if (settings.whatsapp_ai_model || settings.ai_chat_model) {
                setModel(settings.whatsapp_ai_model || settings.ai_chat_model);
            }
            if (settings.whatsapp_max_words) {
                setMaxWords(settings.whatsapp_max_words);
            }
            if (settings.whatsapp_store_info || settings.ai_chat_site_info) {
                setStoreInfo(settings.whatsapp_store_info || settings.ai_chat_site_info);
            }
            if (settings.whatsapp_system_prompt) {
                setSystemPrompt(settings.whatsapp_system_prompt);
            }
        }
    }, [loading, settings]);

    const handleFetchModels = async () => {
        setFetchingModels(true);
        setFetchError("");
        try {
            const res = await fetch("/api/whatsapp/models", { cache: "no-store" });
            const data = await res.json();
            if (res.ok && Array.isArray(data.models) && data.models.length > 0) {
                setFetchedModels(data.models);
            } else {
                setFetchError(data.error || "No models returned by the provider.");
            }
        } catch {
            setFetchError("Network error while loading models.");
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage("");
        try {
            const res = await xFetch("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    whatsapp_ai_api_url: apiUrl.trim(),
                    whatsapp_ai_api_key: apiKey.trim(),
                    whatsapp_ai_model: model.trim(),
                    whatsapp_max_words: maxWords.trim(),
                    whatsapp_store_info: storeInfo.trim(),
                    whatsapp_system_prompt: systemPrompt.trim(),
                }),
            });

            if (res.ok) {
                setSaveMessage("AI Brain settings saved successfully!");
                setTimeout(() => setSaveMessage(""), 3500);
            } else {
                const data = await res.json();
                setSaveMessage(`Error: ${data.error || "Failed to save"}`);
            }
        } catch {
            setSaveMessage("Network error while saving settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestAi = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch("/api/whatsapp/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testType: "ai",
                    customApiUrl: apiUrl,
                    customApiKey: apiKey,
                    customModel: model,
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch {
            setTestResult({ ok: false, error: "Network error during test." });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Brain & Knowledge Base</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure the OpenAI-compatible AI model, system personality, and store context used for WhatsApp auto-replies.
                </p>
            </div>

            {saveMessage && (
                <div
                    className={`p-3 text-xs font-semibold rounded-xl flex items-center gap-2 ${
                        saveMessage.startsWith("Error")
                            ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                >
                    <Icon icon={saveMessage.startsWith("Error") ? "solar:close-circle-bold" : "solar:check-circle-bold"} width={16} />
                    <span>{saveMessage}</span>
                </div>
            )}

            {/* Provider & API Credentials */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Icon icon="solar:key-bold" width={18} className="text-emerald-500" />
                    <span>AI Provider API Configuration</span>
                </div>
                <p className="text-xs text-slate-500">
                    Compatible with OpenAI, OpenRouter, Groq, Together AI, DeepSeek, and local Ollama.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                            API Endpoint URL
                        </label>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://api.openai.com/v1/chat/completions"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                            API Key (Bearer Token)
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 font-mono"
                        />
                    </div>
                </div>

                {/* Model Selection with live fetch */}
                <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        AI Model Name
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="e.g. gpt-4o-mini, llama-3.3-70b, deepseek-chat"
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                        />
                        <button
                            type="button"
                            onClick={handleFetchModels}
                            disabled={fetchingModels}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0"
                        >
                            <Icon icon={fetchingModels ? "svg-spinners:ring-resize" : "solar:refresh-bold"} width={14} />
                            <span>Fetch Models</span>
                        </button>
                    </div>

                    {fetchError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <Icon icon="solar:danger-triangle-bold" width={14} />
                            <span>{fetchError}</span>
                        </p>
                    )}

                    {fetchedModels.length > 0 && (
                        <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {fetchedModels.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setModel(m)}
                                    className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                                        model === m
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    <span className="font-mono">{m}</span>
                                    {model === m && <Icon icon="solar:check-circle-bold" width={14} className="text-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-48 pt-2">
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Max Words per Reply
                    </label>
                    <input
                        type="number"
                        min={50}
                        max={500}
                        value={maxWords}
                        onChange={(e) => setMaxWords(e.target.value)}
                        placeholder="160"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                    />
                </div>
            </div>

            {/* Store Information & FAQs Knowledge Base */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Icon icon="solar:document-text-bold" width={18} className="text-emerald-500" />
                    <span>Store Background Info & FAQ Knowledge</span>
                </div>
                <p className="text-xs text-slate-500">
                    Describe your store details, shipping timeframes, returns, payment options, and FAQs. The AI will cross-reference this with live products in the database.
                </p>

                <textarea
                    rows={6}
                    value={storeInfo}
                    onChange={(e) => setStoreInfo(e.target.value)}
                    placeholder={`Example:\nWe are an authentic fashion & footwear store.\nDelivery inside Dhaka: 24-48 hours ($2.00).\nDelivery outside Dhaka: 3-5 days ($4.00).\nReturn Policy: 7-day hassle-free return on unworn items.\nPayment: Cash on Delivery, bKash, Cards, and Stripe supported.`}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 leading-relaxed font-sans"
                />
            </div>

            {/* Test Connection Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Test AI Response</h4>
                        <p className="text-xs text-slate-500">Verifies that your AI API endpoint, key, and model respond correctly.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleTestAi}
                        disabled={testing}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                        <Icon icon={testing ? "svg-spinners:ring-resize" : "solar:play-circle-bold"} width={16} />
                        <span>{testing ? "Testing..." : "Test Connection"}</span>
                    </button>
                </div>

                {testResult && (
                    <div
                        className={`p-3 text-xs rounded-xl border ${
                            testResult.ok
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                        }`}
                    >
                        {testResult.ok ? (
                            <div>
                                <span className="font-bold block mb-1">AI Test Passed:</span>
                                <p className="font-mono bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-500/20">
                                    {testResult.reply}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <span className="font-bold">Test Error:</span> {testResult.error}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-60"
                >
                    <Icon icon={saving ? "svg-spinners:ring-resize" : "solar:check-circle-bold"} width={16} />
                    <span>{saving ? "Saving AI Settings..." : "Save AI Brain Settings"}</span>
                </button>
            </div>
        </div>
    );
}

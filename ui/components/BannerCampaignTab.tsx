"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Gallery from "@/components/Gallery";

export default function BannerCampaignTab() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");

    // Campaign form state
    const [campaignName, setCampaignName] = useState("");
    const [bannerImage, setBannerImage] = useState("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80");
    const [campaignTitle, setCampaignTitle] = useState("🔥 Mega Weekend Flash Sale — Up to 50% Off!");
    const [campaignMessage, setCampaignMessage] = useState("Hi there! Enjoy exclusive discounts on our top-selling items this weekend only. Free delivery on orders over $50!\n\nUse code: FLASH50 at checkout.");
    const [buttonText, setButtonText] = useState("Shop Collection");
    const [buttonUrl, setButtonUrl] = useState("https://example.com/flash-sale");

    // Audience targeting
    const [targetType, setTargetType] = useState<"all" | "selected" | "manual">("all");
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContactPhones, setSelectedContactPhones] = useState<string[]>([]);
    const [manualPhones, setManualPhones] = useState("");
    const [contactSearch, setContactSearch] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(false);

    // Campaigns history & execution
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);

    // View logs modal
    const [viewingLogsCampaign, setViewingLogsCampaign] = useState<any | null>(null);

    const presetBanners = [
        { label: "Flash Sale", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80" },
        { label: "New Collection", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80" },
        { label: "Special Discount", url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000&auto=format&fit=crop&q=80" },
        { label: "Store Announcement", url: "https://images.unsplash.com/photo-1556742049-0a67e5572263?w=1000&auto=format&fit=crop&q=80" },
    ];

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/whatsapp/accounts", { cache: "no-store" });
            const data = await res.json();
            const list = data.accounts || [];
            setAccounts(list);
            if (list.length > 0) {
                const def = list.find((a: any) => a.isDefault) || list[0];
                setSelectedAccountId(def._id);
            }
        } catch {
            setAccounts([]);
        }
    };

    const fetchContacts = async () => {
        try {
            setLoadingContacts(true);
            const res = await fetch("/api/whatsapp/contacts?limit=200", { cache: "no-store" });
            const data = await res.json();
            setContacts(data.contacts || []);
        } catch {
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            setLoadingCampaigns(true);
            const res = await fetch("/api/whatsapp/campaigns?limit=50", { cache: "no-store" });
            const data = await res.json();
            setCampaigns(data.campaigns || []);
        } catch {
            setCampaigns([]);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchContacts();
        fetchCampaigns();
    }, []);

    const toggleSelectAllContacts = () => {
        if (selectedContactPhones.length === contacts.length) {
            setSelectedContactPhones([]);
        } else {
            setSelectedContactPhones(contacts.map((c) => c.phone).filter(Boolean));
        }
    };

    const toggleContact = (phone: string) => {
        if (selectedContactPhones.includes(phone)) {
            setSelectedContactPhones(selectedContactPhones.filter((p) => p !== phone));
        } else {
            setSelectedContactPhones([...selectedContactPhones, phone]);
        }
    };

    const filteredContacts = contacts.filter(
        (c) =>
            c.phone?.toLowerCase().includes(contactSearch.toLowerCase()) ||
            c.name?.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const handleSubmitCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaignName.trim() || !campaignMessage.trim()) {
            setSendError("Please provide a campaign name and message.");
            return;
        }

        setSending(true);
        setSendError(null);
        setSendSuccess(null);

        try {
            const res = await fetch("/api/whatsapp/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignName.trim(),
                    accountId: selectedAccountId || undefined,
                    bannerImage: bannerImage.trim(),
                    title: campaignTitle.trim(),
                    message: campaignMessage.trim(),
                    buttonText: buttonText.trim(),
                    buttonUrl: buttonUrl.trim(),
                    targetType,
                    targetContacts: selectedContactPhones,
                    manualPhones: manualPhones.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSendError(data.error || "Failed to broadcast banner campaign.");
                return;
            }

            setSendSuccess(
                `Campaign launched! Sent to ${data.summary?.sent || 0} contacts (${data.summary?.failed || 0} failed).`
            );
            fetchCampaigns();
        } catch (err: any) {
            setSendError(err?.message || "Network error while broadcasting.");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign record?")) return;
        try {
            const res = await fetch(`/api/whatsapp/campaigns/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchCampaigns();
            }
        } catch {
            alert("Failed to delete campaign.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Banner Campaign Manager</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Broadcast eye-catching promotional banners, announcements, and marketing messages to all contacts or custom audience segments.
                </p>
            </div>

            {/* Campaign Form & Preview Split Screen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form & Target Selector */}
                <form onSubmit={handleSubmitCampaign} className="lg:col-span-7 space-y-6">
                    {sendSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" width={18} className="shrink-0" />
                            <span>{sendSuccess}</span>
                        </div>
                    )}

                    {sendError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
                            <Icon icon="solar:danger-triangle-bold" width={18} className="shrink-0" />
                            <span>{sendError}</span>
                        </div>
                    )}

                    {/* Step 1: Campaign Details */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">1</div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Campaign Information</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Campaign Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="e.g. Weekend Flash Sale Promo"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Sender WhatsApp Account *
                                </label>
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                >
                                    {accounts.map((a) => (
                                        <option key={a._id} value={a._id}>
                                            {a.name} ({a.phoneNumber}) {a.isDefault ? "— [Primary]" : ""}
                                        </option>
                                    ))}
                                    {accounts.length === 0 && <option value="">Default WhatsApp Account</option>}
                                </select>
                            </div>
                        </div>

                        {/* Banner Image Selection via CMS Gallery & Presets */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Campaign Banner Image
                                </label>
                                <span className="text-[10px] text-slate-400">Click below to open CMS Media Library</span>
                            </div>

                            {/* CMS Gallery Component */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                                <Gallery
                                    multiple={false}
                                    value={bannerImage}
                                    onChange={(val) => {
                                        const img = Array.isArray(val) ? val[0] || "" : val || "";
                                        setBannerImage(img);
                                    }}
                                    placeholder="Choose or Upload Banner Image from Media Library"
                                />
                            </div>

                            {/* Manual URL / Preset Fallback */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        Or enter Direct Image URL:
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                                        {presetBanners.map((p, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setBannerImage(p.url)}
                                                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={bannerImage}
                                    onChange={(e) => setBannerImage(e.target.value)}
                                    placeholder="https://example.com/banner.jpg"
                                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 font-mono"
                                />
                            </div>
                        </div>

                        {/* Heading & Message */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Banner Heading / Headline
                                </label>
                                <input
                                    type="text"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                    placeholder="e.g. 🔥 Flash Sale — 50% Off!"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Message Text / Body *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={campaignMessage}
                                    onChange={(e) => setCampaignMessage(e.target.value)}
                                    placeholder="Write your campaign details, discount codes, or announcement message..."
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500 leading-relaxed font-sans"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                        Action Button Label
                                    </label>
                                    <input
                                        type="text"
                                        value={buttonText}
                                        onChange={(e) => setButtonText(e.target.value)}
                                        placeholder="Shop Now"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                        Action Button URL
                                    </label>
                                    <input
                                        type="text"
                                        value={buttonUrl}
                                        onChange={(e) => setButtonUrl(e.target.value)}
                                        placeholder="https://example.com/link"
                                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Audience Target Selection */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">2</div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Target Audience & Contacts</h4>
                        </div>

                        {/* Audience Radio Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                {
                                    id: "all",
                                    title: "All Contacts",
                                    desc: `Broadcast to all ${contacts.length} customers`,
                                    icon: "solar:users-group-two-rounded-bold",
                                },
                                {
                                    id: "selected",
                                    title: "Select Contacts",
                                    desc: `Pick specific customers (${selectedContactPhones.length} chosen)`,
                                    icon: "solar:user-check-bold",
                                },
                                {
                                    id: "manual",
                                    title: "Manual Numbers",
                                    desc: "Paste custom phone numbers",
                                    icon: "solar:dialpad-square-bold",
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setTargetType(opt.id as any)}
                                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                                        targetType === opt.id
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                    }`}
                                >
                                    <Icon icon={opt.icon} width={20} className="mb-2 text-emerald-500" />
                                    <div>
                                        <p className="font-bold text-xs">{opt.title}</p>
                                        <p className="text-[10px] opacity-75">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Mode: Select Contacts Table */}
                        {targetType === "selected" && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <Icon icon="solar:magnifer-linear" width={16} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search contact name or phone..."
                                            value={contactSearch}
                                            onChange={(e) => setContactSearch(e.target.value)}
                                            className="w-full text-xs bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAllContacts}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-xl transition shrink-0"
                                    >
                                        {selectedContactPhones.length === contacts.length ? "Deselect All" : "Select All"}
                                    </button>
                                </div>

                                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                                    {loadingContacts ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">
                                            Loading contacts...
                                        </div>
                                    ) : filteredContacts.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">
                                            No matching contacts found.
                                        </div>
                                    ) : (
                                        filteredContacts.map((c) => {
                                            const isChecked = selectedContactPhones.includes(c.phone);
                                            return (
                                                <label
                                                    key={c._id || c.phone}
                                                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition text-xs"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleContact(c.phone)}
                                                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                                        />
                                                        <div>
                                                            <span className="font-bold text-slate-900 dark:text-white block">
                                                                {c.name || "Customer"}
                                                            </span>
                                                            <span className="font-mono text-[10px] text-slate-500">{c.phone}</span>
                                                        </div>
                                                    </div>
                                                    {c.lastMessageAt && (
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(c.lastMessageAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mode: Manual Numbers */}
                        {targetType === "manual" && (
                            <div className="space-y-2 pt-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Paste Recipient Phone Numbers (separated by commas or newlines)
                                </label>
                                <textarea
                                    rows={4}
                                    value={manualPhones}
                                    onChange={(e) => setManualPhones(e.target.value)}
                                    placeholder="+15551234567, +8801712345678, +447911123456"
                                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Step 3: Launch Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={sending}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-60"
                        >
                            <Icon icon={sending ? "svg-spinners:ring-resize" : "solar:plain-bold"} width={18} />
                            <span>{sending ? "Broadcasting Campaign..." : "Submit & Launch Banner Campaign"}</span>
                        </button>
                    </div>
                </form>

                {/* Right Column: Phone Mockup Live Preview */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                        <Icon icon="solar:eye-bold" width={14} className="text-emerald-500" />
                        <span>Live WhatsApp Banner Preview</span>
                    </p>

                    {/* Mockup Preview Box */}
                    <div className="w-full max-w-80 mx-auto rounded-xl overflow-hidden border-2 border-main shadow-2xl relative select-none">
                        <div className="flex flex-col h-140 relative">
                            {/* WhatsApp Header */}
                            <div className="bg-main p-3 flex items-center justify-between text-white shrink-0 shadow-md">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:arrow-left-linear" width={18} className="text-white" />
                                    <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
                                        <Icon icon="fa:whatsapp" width={16} />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="font-semibold text-xs text-slate-100">Store Official</p>
                                        <p className="text-[9px] text-emerald-400">Business Broadcast</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat View with Banner Card */}
                            <div
                                className="flex-1 overflow-y-auto p-3 space-y-3 relative text-xs"
                                style={{
                                    backgroundImage: "radial-gradient(#e8e2d8 1px, transparent 1px)",
                                    backgroundSize: "16px 16px",
                                }}
                            >
                                <div className="flex justify-start">
                                    <div className="bg-white text-black rounded-2xl rounded-tl-none overflow-hidden max-w-[95%] shadow-xl border border-main">
                                        {/* Banner Image */}
                                        {bannerImage ? (
                                            <div className="w-full aspect-video bg-slate-800 relative overflow-hidden">
                                                <img
                                                    src={bannerImage}
                                                    alt="Campaign Banner"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-slate-500">
                                                <Icon icon="solar:gallery-wide-bold" width={28} />
                                            </div>
                                        )}

                                        {/* Message Caption */}
                                        <div className="p-3 space-y-2">
                                            {campaignTitle && (
                                                <h4 className="font-bold text-xs text-black leading-tight">
                                                    {campaignTitle}
                                                </h4>
                                            )}
                                            <p className="text-[11px] text-black whitespace-pre-wrap leading-relaxed">
                                                {campaignMessage}
                                            </p>

                                            {/* Action Button */}
                                            {buttonUrl && (
                                                <div className="pt-2 border-t border-slate-700/50">
                                                    <a
                                                        href={buttonUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-1.5 bg-[#00a884] text-slate-900 font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                                                    >
                                                        <Icon icon="solar:link-circle-bold" width={13} />
                                                        <span>{buttonText || "View Offer"}</span>
                                                    </a>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-end text-[9px] text-slate-400 pt-0.5">
                                                <span>Just now</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* WhatsApp Chat Input Footer */}
                            <div className="bg-main p-2 flex items-center gap-1.5 shrink-0">
                                <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2 text-slate-400">
                                    <Icon icon="solar:smile-circle-outline" width={16} />
                                    <span className="text-[11px] text-slate-400 flex-1 truncate">Message</span>
                                    <Icon icon="solar:paperclip-linear" width={15} />
                                    <Icon icon="solar:camera-linear" width={15} />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-slate-900 shadow">
                                    <Icon icon="solar:microphone-bold" width={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Broadcast History Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:history-bold" width={18} className="text-emerald-500" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Past Banner Campaigns</h4>
                    </div>
                    <button
                        type="button"
                        onClick={fetchCampaigns}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                        <Icon icon="solar:refresh-bold" width={14} />
                        <span>Refresh History</span>
                    </button>
                </div>

                {loadingCampaigns ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                        <Icon icon="svg-spinners:ring-resize" width={20} className="mx-auto mb-2" />
                        Loading campaigns...
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                        No previous campaigns found. Launch your first banner campaign above!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                                    <th className="py-2.5 px-3">Banner & Campaign</th>
                                    <th className="py-2.5 px-3">Sender Line</th>
                                    <th className="py-2.5 px-3">Recipients Reached</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {campaigns.map((c) => (
                                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-3">
                                                {c.bannerImage ? (
                                                    <img
                                                        src={c.bannerImage}
                                                        alt={c.name}
                                                        className="w-12 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                        <Icon icon="solar:gallery-wide-bold" width={16} />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">
                                                        {c.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">
                                                        {c.title || c.message}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                                            {c.accountId?.name || "Primary Line"}
                                        </td>

                                        <td className="py-3 px-3">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {c.sentCount || 0} / {c.totalRecipients || 0}
                                            </span>
                                            {c.failedCount > 0 && (
                                                <span className="text-[10px] text-red-500 block">
                                                    ({c.failedCount} failed)
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    c.status === "completed"
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                        : c.status === "sending"
                                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                                                        : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                                }`}
                                            >
                                                {c.status}
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 text-slate-400 text-[10px]">
                                            {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </td>

                                        <td className="py-3 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingLogsCampaign(c)}
                                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs rounded-lg transition"
                                                    title="View Delivery Logs"
                                                >
                                                    Logs
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCampaign(c._id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                                    title="Delete Record"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold" width={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recipient Logs Modal */}
            {viewingLogsCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="font-bold text-sm">
                                Delivery Logs: {viewingLogsCampaign.name}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setViewingLogsCampaign(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <Icon icon="solar:close-circle-bold" width={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
                            {viewingLogsCampaign.recipientLogs?.length > 0 ? (
                                viewingLogsCampaign.recipientLogs.map((log: any, idx: number) => (
                                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-mono font-semibold block">{log.phone}</span>
                                            {log.error && <span className="text-[10px] text-red-500">{log.error}</span>}
                                        </div>
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                log.status === "sent"
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                            }`}
                                        >
                                            {log.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-6 text-slate-400 text-xs">No detailed logs stored for this campaign.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import OverviewTab from "./components/OverviewTab";
import AccountsTab from "./components/AccountsTab";
import AiConfigTab from "./components/AiConfigTab";
import CarouselStudioTab from "./components/CarouselStudioTab";
import InboxTab from "./components/InboxTab";
import BannerCampaignTab from "./components/BannerCampaignTab";
import SimulatorTab from "./components/SimulatorTab";
import AccountModal from "./components/AccountModal";

export default function WhatsAppAdminPage() {
    const [activeTab, setActiveTab] = useState<
        "overview" | "accounts" | "ai" | "carousel" | "inbox" | "campaign" | "simulator"
    >("overview");

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any | null>(null);

    const handleAddAccount = () => {
        setEditingAccount(null);
        setIsAccountModalOpen(true);
    };

    const handleEditAccount = (acc: any) => {
        setEditingAccount(acc);
        setIsAccountModalOpen(true);
    };

    const TABS = [
        { id: "overview", label: "Overview", icon: "solar:chart-square-bold" },
        { id: "accounts", label: "Accounts", icon: "fa:whatsapp" },
        { id: "ai", label: "AI Brain & Knowledge", icon: "solar:magic-stick-3-bold" },
        { id: "carousel", label: "Carousel Studio", icon: "solar:widget-2-bold" },
        { id: "inbox", label: "Inbox & Live Logs", icon: "solar:chat-round-dots-bold" },
        { id: "campaign", label: "Banner Campaign", icon: "bi:gift" },
        { id: "simulator", label: "Simulator Sandbox", icon: "solar:play-circle-bold" },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Icon icon="fa:whatsapp" width={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                WhatsApp Auto-Reply Bot
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Multi-account WhatsApp customer support, automated catalog retrieval & interactive product carousels.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAddAccount}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                        <Icon icon="solar:add-circle-bold" width={16} />
                        <span>Add Account</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
                {TABS.map((t) => {
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                isActive
                                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            }`}
                        >
                            <Icon icon={t.icon} width={16} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Display */}
            <div className="pt-2">
                {activeTab === "overview" && (
                    <OverviewTab
                        onNavigateTab={(tabId) => setActiveTab(tabId as any)}
                        onAddAccount={handleAddAccount}
                    />
                )}
                {activeTab === "accounts" && (
                    <AccountsTab
                        onAddAccount={handleAddAccount}
                        onEditAccount={handleEditAccount}
                    />
                )}
                {activeTab === "ai" && <AiConfigTab />}
                {activeTab === "carousel" && <CarouselStudioTab />}
                {activeTab === "inbox" && <InboxTab />}
                {activeTab === "campaign" && <BannerCampaignTab />}
                {activeTab === "simulator" && <SimulatorTab />}
            </div>

            {/* Account Edit / Add Modal */}
            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSaved={() => {
                    // Triggers refresh
                }}
                account={editingAccount}
            />
        </div>
    );
}

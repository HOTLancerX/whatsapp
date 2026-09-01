"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { type IMatchedProduct } from "../../models/WhatsAppMessage";

interface WhatsAppPhoneMockupProps {
    contactName?: string;
    contactPhone?: string;
    verified?: boolean;
    userMessage?: string;
    aiReply?: string;
    matchedProducts?: IMatchedProduct[];
    carouselRatio?: "1:1" | "16:9" | "4:3" | "auto";
    isLoading?: boolean;
    onProductClick?: (product: IMatchedProduct) => void;
}

export default function WhatsAppPhoneMockup({
    contactName = "Store Assistant",
    contactPhone = "+1 555 0192",
    verified = true,
    userMessage,
    aiReply,
    matchedProducts = [],
    carouselRatio = "1:1",
    isLoading = false,
    onProductClick,
}: WhatsAppPhoneMockupProps) {
    const formatWhatsAppText = (text: string) => {
        return text.split("\n").map((line, i) => {
            const parts = line.split(/(\*[^*]+\*|_.*?_|~.*?~)/g);
            return (
                <span key={i}>
                    {i > 0 && <br />}
                    {parts.map((part, j) => {
                        if (part.startsWith("*") && part.endsWith("*")) {
                            return <strong key={j} className="font-bold">{part.slice(1, -1)}</strong>;
                        }
                        if (part.startsWith("_") && part.endsWith("_")) {
                            return <em key={j} className="italic">{part.slice(1, -1)}</em>;
                        }
                        if (part.startsWith("~") && part.endsWith("~")) {
                            return <del key={j} className="line-through opacity-70">{part.slice(1, -1)}</del>;
                        }
                        return part;
                    })}
                </span>
            );
        });
    };

    const getAspectClass = () => {
        switch (carouselRatio) {
            case "16:9":
                return "aspect-video";
            case "4:3":
                return "aspect-[4/3]";
            case "1:1":
            default:
                return "aspect-square";
        }
    };

    return (
        <div className="w-full max-w-80 mx-auto rounded-xl overflow-hidden shadow-2xl border border-main relative select-none">
            {/* Screen Container */}
            <div className="bg-[#ece5dd] flex flex-col h-150 relative">
                {/* WhatsApp Header */}
                <div className="bg-main p-3 flex items-center justify-between text-white shrink-0 shadow-md">
                    <div className="flex items-center gap-2">
                        <button type="button" className="text-white hover:text-white">
                            <Icon icon="solar:arrow-left-linear" width={20} />
                        </button>
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
                                <Icon icon="fa:whatsapp" width={18} />
                            </div>
                            {verified && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 text-white">
                                    <Icon icon="solar:check-circle-bold" width={10} />
                                </div>
                            )}
                        </div>
                        <div className="leading-tight overflow-hidden">
                            <div className="flex items-center gap-1">
                                <p className="font-semibold text-xs text-white truncate max-w-32.5">{contactName}</p>
                                {verified && <Icon icon="solar:verified-check-bold" width={12} className="text-emerald-400 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-emerald-400 font-normal truncate">online • Official Business</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-white">
                        <Icon icon="solar:videocamera-record-bold" width={17} />
                        <Icon icon="solar:phone-bold" width={16} />
                        <Icon icon="solar:menu-dots-bold" width={16} />
                    </div>
                </div>

                {/* Chat Background & Messages */}
                <div
                    className="flex-1 overflow-y-auto p-3 space-y-3 relative text-xs"
                    style={{
                        backgroundImage: "radial-gradient(#e8e2d8 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                    }}
                >
                    {/* Encryption notice */}
                    <div className="text-center my-1">
                        <span className="bg-white text-main text-[9px] px-2.5 py-1 rounded-md inline-flex items-center gap-1 shadow-sm">
                            <Icon icon="solar:lock-bold" width={10} /> Messages are end-to-end encrypted.
                        </span>
                    </div>

                    {/* Customer Message */}
                    {userMessage && (
                        <div className="flex justify-end">
                            <div className="bg-main text-white rounded-lg rounded-tr-none px-3 py-1.5 max-w-[85%] shadow-sm relative wrap-break-word">
                                <p className="leading-relaxed text-[11.5px]">{userMessage}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-emerald-200/70">
                                    <span>12:00 PM</span>
                                    <Icon icon="solar:check-read-linear" width={12} className="text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Loading typing indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#202c33] text-slate-200 rounded-lg rounded-tl-none px-3 py-2 shadow-sm flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">typing</span>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Reply Bubble */}
                    {aiReply && !isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#ffffff] text-[#202c33] rounded-lg rounded-tl-none px-3 py-2 max-w-[90%] shadow-sm relative leading-relaxed">
                                <div className="text-[11.5px] whitespace-pre-wrap">{formatWhatsAppText(aiReply)}</div>
                                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                                    <span>12:01 PM</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interactive Carousel Cards */}
                    {matchedProducts.length > 0 && !isLoading && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold pl-1">
                                <Icon icon="solar:widget-2-bold" width={12} className="text-emerald-400" />
                                <span>Matching Products ({matchedProducts.length})</span>
                            </div>

                            {/* Horizontal scrollable carousel cards */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                                {matchedProducts.map((prod, idx) => (
                                    <div
                                        key={prod.id || idx}
                                        className="bg-[#fff] border border-slate-700/60 rounded-xl overflow-hidden min-w-47.5 max-w-47.5 shrink-0 shadow-lg snap-start flex flex-col justify-between"
                                    >
                                        {/* Product Image with aspect ratio */}
                                        <div className={`w-full ${getAspectClass()} bg-slate-800 relative overflow-hidden flex items-center justify-center`}>
                                            {prod.thumbnail ? (
                                                <img
                                                    src={prod.thumbnail}
                                                    alt={prod.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-500">
                                                    <Icon icon="solar:box-minimalistic-bold" width={32} />
                                                    <span className="text-[9px] mt-1">No Image</span>
                                                </div>
                                            )}

                                            {/* Match ratio badge */}
                                            {prod.matchRatio > 0 && (
                                                <div className="absolute top-1.5 right-1.5 bg-emerald-500/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                                                    {Math.round(prod.matchRatio * 100)}% match
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="p-2 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-100 text-[11px] line-clamp-2 leading-tight">
                                                    {prod.title}
                                                </h4>
                                                <div className="mt-1 flex items-baseline gap-1.5">
                                                    <span className="text-emerald-400 font-bold text-xs">{prod.price || "Price on request"}</span>
                                                    {prod.regularPrice && (
                                                        <span className="text-slate-400 text-[10px] line-through">{prod.regularPrice}</span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {prod.stock || "In Stock"}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                type="button"
                                                onClick={() => onProductClick?.(prod)}
                                                className="mt-2 w-full py-1.5 bg-[#00a884] hover:bg-[#008f6f] active:scale-98 text-slate-900 font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 shadow"
                                            >
                                                <Icon icon="solar:bag-3-bold" width={12} />
                                                <span>View Details</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
    );
}

"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import WhatsAppPhoneMockup from "./WhatsAppPhoneMockup";
import { type IMatchedProduct } from "../../models/WhatsAppMessage";

export default function CarouselStudioTab() {
    const [ratio, setRatio] = useState<"1:1" | "16:9" | "4:3" | "auto">("1:1");
    const [maxCards, setMaxCards] = useState(5);
    const [buttonLabel, setButtonLabel] = useState("View Details");
    const [headerText, setHeaderText] = useState("Featured Store Collection");

    const sampleProducts: IMatchedProduct[] = [
        {
            id: "sample-1",
            title: "Nike Air Zoom Pegasus 40 Running Shoes",
            slug: "nike-air-zoom-pegasus-40",
            price: "$129.99",
            regularPrice: "$150.00",
            stock: "In Stock",
            shortDescription: "Responsive cushioning for everyday running comfort.",
            thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            url: "https://example.com/product/nike-pegasus-40",
            matchScore: 3.5,
            matchRatio: 0.95,
        },
        {
            id: "sample-2",
            title: "Apple Watch Series 9 GPS 45mm",
            slug: "apple-watch-series-9",
            price: "$399.00",
            regularPrice: "$429.00",
            stock: "In Stock (3 left)",
            shortDescription: "Smarter, brighter, and mightier with S9 SiP.",
            thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
            url: "https://example.com/product/apple-watch-9",
            matchScore: 3.2,
            matchRatio: 0.88,
        },
        {
            id: "sample-3",
            title: "Sony WH-1000XM5 Wireless Headphones",
            slug: "sony-wh-1000xm5",
            price: "$348.00",
            regularPrice: "$399.99",
            stock: "In Stock",
            shortDescription: "Industry-leading noise cancellation and crystal-clear hands-free calling.",
            thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
            url: "https://example.com/product/sony-wh-1000xm5",
            matchScore: 2.8,
            matchRatio: 0.75,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Carousel & Template Ratio Studio</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preview and fine-tune the visual aspect ratio, card quantity, and template formatting for WhatsApp product carousels.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Configuration Controls Column */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Ratio Selection */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                        <label className="block text-xs font-bold text-slate-900 dark:text-white">
                            Card Image Aspect Ratio
                        </label>
                        <p className="text-xs text-slate-500">
                            Select the proportion used for product image headers in WhatsApp carousel slides.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            {[
                                { id: "1:1", label: "1:1 Square", desc: "Recommended", icon: "solar:square-bold" },
                                { id: "16:9", label: "16:9 Wide", desc: "Landscape", icon: "solar:tv-bold" },
                                { id: "4:3", label: "4:3 Standard", desc: "Classic", icon: "solar:gallery-wide-bold" },
                                { id: "auto", label: "Auto Fit", desc: "Natural", icon: "solar:maximize-square-bold" },
                            ].map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRatio(r.id as any)}
                                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                                        ratio === r.id
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                    }`}
                                >
                                    <Icon icon={r.icon} width={20} className="mb-2 text-emerald-500" />
                                    <div>
                                        <p className="font-bold text-xs">{r.label}</p>
                                        <p className="text-[10px] opacity-75">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card Quantity & Layout Options */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-900 dark:text-white">
                                    Maximum Carousel Cards to Attach ({maxCards} cards)
                                </label>
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{maxCards}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={maxCards}
                                onChange={(e) => setMaxCards(parseInt(e.target.value, 10))}
                                className="w-full accent-emerald-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>1 item (Single card)</span>
                                <span>5 items (Optimal)</span>
                                <span>10 items (Max)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Card Action Button Label
                                </label>
                                <input
                                    type="text"
                                    value={buttonLabel}
                                    onChange={(e) => setButtonLabel(e.target.value)}
                                    placeholder="View Details"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Carousel Header Text
                                </label>
                                <input
                                    type="text"
                                    value={headerText}
                                    onChange={(e) => setHeaderText(e.target.value)}
                                    placeholder="Featured Store Collection"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ratio & Meta Cloud API Compliance Note */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold">
                            <Icon icon="solar:shield-check-bold" width={16} />
                            <span>Meta WhatsApp Cloud API Compliance</span>
                        </div>
                        <p className="text-[11.5px]">
                            Interactive Carousel messages are rendered natively on WhatsApp iOS, Android, and Web clients with image headers, bold pricing, and CTA quick reply actions. In case of carrier network constraints, our engine automatically falls back to interactive list pickers or clickable media summaries.
                        </p>
                    </div>
                </div>

                {/* Live Phone Mockup Preview Column */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                        <Icon icon="solar:eye-bold" width={14} className="text-emerald-500" />
                        <span>Live WhatsApp Mobile Preview</span>
                    </p>
                    <WhatsAppPhoneMockup
                        contactName="Store WhatsApp Bot"
                        userMessage="Can you show me your top recommended products?"
                        aiReply={`Here are our top recommended products with the best ratings in our store today! 🛍️✨`}
                        matchedProducts={sampleProducts.slice(0, maxCards)}
                        carouselRatio={ratio}
                    />
                </div>
            </div>
        </div>
    );
}

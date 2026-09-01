/**
 * plugin/whatsapp/lib/knowledge-search.ts
 *
 * Collects published products, categories, pages, and store knowledge
 * from the CMS database and performs keyword/token matching with ratio scoring.
 */

import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Permalink from "@/models/permalink";
import Cat from "@/models/cat";
import { type IMatchedProduct } from "../models/WhatsAppMessage";

export interface VariateBlob {
    priceType?: string;
    regularprice?: string;
    sellingprice?: string;
    stock?: string;
    variants?: {
        price?: string;
        sellingprice?: string;
        title?: string;
        stock?: string;
        image?: string;
        thumbnail?: string;
        options?: Record<string, string>;
    }[];
}

export interface StoreKnowledgeContext {
    products: IMatchedProduct[];
    allFoundProducts: IMatchedProduct[];
    posts: { title: string; slug: string; type: string; url: string }[];
    categories: { title: string; slug: string; type: string }[];
    totalProductCount: number;
    totalPostCount: number;
    searchTokens: string[];
    formattedContext: string;
}

export function extractPrice(variateRaw: string | undefined): { price: string; regularPrice: string } {
    if (!variateRaw) return { price: "", regularPrice: "" };
    try {
        const v: VariateBlob = JSON.parse(variateRaw);
        if (v.priceType === "variant" && Array.isArray(v.variants) && v.variants.length > 0) {
            const prices = v.variants
                .map((vr) => parseFloat(vr.sellingprice ?? vr.price ?? ""))
                .filter((n) => !isNaN(n));
            const regularPrices = v.variants
                .map((vr) => parseFloat(vr.price ?? ""))
                .filter((n) => !isNaN(n));

            if (prices.length === 0) return { price: "", regularPrice: "" };
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const priceStr = min === max ? String(min) : `${min}–${max}`;
            const regPriceStr = regularPrices.length > 0 ? String(Math.max(...regularPrices)) : "";
            return { price: priceStr, regularPrice: regPriceStr };
        }
        return {
            price: v.sellingprice || v.regularprice || "",
            regularPrice: v.regularprice || "",
        };
    } catch {
        return { price: "", regularPrice: "" };
    }
}

export function extractStock(variateRaw: string | undefined): string {
    if (!variateRaw) return "In Stock";
    try {
        const v: VariateBlob = JSON.parse(variateRaw);
        if (v.priceType === "variant" && Array.isArray(v.variants)) {
            const total = v.variants.reduce((sum, vr) => sum + (parseInt(vr.stock ?? "0", 10) || 0), 0);
            return total > 0 ? String(total) : "Out of Stock";
        }
        if (v.stock) {
            const n = parseInt(v.stock, 10);
            return isNaN(n) ? v.stock : n > 0 ? String(n) : "Out of Stock";
        }
        return "In Stock";
    } catch {
        return "In Stock";
    }
}

export function extractThumbnail(info: Record<string, string>, baseUrl: string): string {
    const rawImg =
        info.thumbnail ||
        info.featured_image ||
        info._thumbnail ||
        info.image ||
        info._gallery ||
        info.cover ||
        "";

    if (!rawImg) return "";

    let firstImg = rawImg;
    if (rawImg.startsWith("[") || rawImg.includes(",")) {
        try {
            const parsed = JSON.parse(rawImg);
            if (Array.isArray(parsed) && parsed.length > 0) {
                firstImg = typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url || parsed[0]?.src || "";
            }
        } catch {
            firstImg = rawImg.split(",")[0].trim();
        }
    }

    firstImg = firstImg.trim();
    if (!firstImg) return "";

    if (firstImg.startsWith("http://") || firstImg.startsWith("https://")) {
        return firstImg;
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanPath = firstImg.startsWith("/") ? firstImg : `/${firstImg}`;
    return `${cleanBase}${cleanPath}`;
}

export function buildUrl(prefix: string, slug: string, baseUrl: string): string {
    const trimmed = prefix.trim().replace(/^\/+|\/+$/g, "");
    const path = trimmed ? `/${trimmed}/${slug}` : `/${slug}`;
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return `${cleanBase}${path}`;
}

export function extractSearchTerms(text: string): string[] {
    const stopwords = new Set([
        "what", "is", "are", "the", "a", "an", "of", "for", "in", "on", "at",
        "do", "you", "have", "can", "i", "me", "my", "your", "our", "that",
        "this", "it", "its", "and", "or", "but", "not", "yes", "no",
        "show", "list", "tell", "give", "find", "search", "please",
        "want", "need", "like", "looking", "some", "any", "all",
        "how", "much", "many", "which", "where", "when", "who", "there",
        "product", "products", "item", "items", "price", "prices",
        "about", "info", "information", "details", "detail", "send", "link",
        "hi", "hello", "hey", "good", "morning", "evening", "afternoon", "whatsapp",
        // Bengali stopwords
        "এবং", "অথবা", "কি", "না", "হ্যাঁ", "দেখাও", "বলুন", "দিন", "দাম", "কত", "আছে", "চাই",
    ]);

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 2 && !stopwords.has(t));
}

/**
 * Calculates keyword match score & ratio for a product against user search tokens.
 */
export function calculateMatchRatio(
    title: string,
    description: string,
    sku: string,
    categoryName: string,
    tokens: string[]
): { score: number; ratio: number } {
    if (tokens.length === 0) {
        return { score: 0.5, ratio: 0.5 };
    }

    const tLower = title.toLowerCase();
    const dLower = description.toLowerCase();
    const sLower = sku.toLowerCase();
    const cLower = categoryName.toLowerCase();

    let matchedTokensCount = 0;
    let score = 0;

    for (const token of tokens) {
        let tokenMatched = false;

        // Exact title whole word match (high priority)
        if (tLower.includes(token)) {
            score += 3.0;
            tokenMatched = true;
        }

        // Category match
        if (cLower.includes(token)) {
            score += 2.0;
            tokenMatched = true;
        }

        // SKU match
        if (sLower.includes(token)) {
            score += 2.5;
            tokenMatched = true;
        }

        // Description match
        if (dLower.includes(token)) {
            score += 1.0;
            tokenMatched = true;
        }

        if (tokenMatched) {
            matchedTokensCount++;
        }
    }

    const ratio = Math.min(1.0, Math.round((matchedTokensCount / tokens.length) * 100) / 100);
    return { score: Math.round(score * 10) / 10, ratio };
}

export async function searchStoreKnowledge(
    userMessage: string,
    baseUrl: string,
    currencySymbol: string = "$",
    maxResults: number = 8
): Promise<StoreKnowledgeContext> {
    await connectDB();

    const terms = extractSearchTerms(userMessage);

    // Fetch permalinks
    const permalinkDocs = ((await Permalink.find({}).lean()) as any[]) || [];
    const permalinkMap: Record<string, string> = {};
    for (const doc of permalinkDocs) {
        permalinkMap[doc.contentType] = doc.prefix ?? "";
    }

    // ── Search Products ──
    const productQuery: Record<string, any> = {
        type: "product",
        status: "published",
    };

    if (terms.length > 0) {
        productQuery.$or = terms.map((t) => ({
            title: { $regex: t, $options: "i" },
        }));
    }

    let productPosts = ((await Post.find(productQuery)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()) as any[]) || [];

    // Also search PostInfo shortDescription and SKU
    if (terms.length > 0) {
        const infoMatches = ((await PostInfo.find({
            name: { $in: ["shortDescription", "sku", "_variate"] },
            value: { $regex: terms.join("|"), $options: "i" },
        })
            .limit(25)
            .lean()) as any[]) || [];

        const extraPostIds = infoMatches
            .map((i: any) => String(i.postId))
            .filter((id) => productPosts.every((p: any) => String(p._id) !== id));

        if (extraPostIds.length > 0) {
            const extraPosts = ((await Post.find({
                _id: { $in: extraPostIds },
                type: "product",
                status: "published",
            }).lean()) as any[]) || [];
            productPosts.push(...extraPosts);
        }
    }

    // If query was empty or had no specific match, load newest products
    if (productPosts.length === 0) {
        productPosts = ((await Post.find({ type: "product", status: "published" })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()) as any[]) || [];
    }

    // Deduplicate
    const seenIds = new Set<string>();
    const uniquePosts = productPosts.filter((p: any) => {
        const id = String(p._id);
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
    });

    const totalProductCount = await Post.countDocuments({ type: "product", status: "published" });

    // Fetch PostInfo for all products
    const productIds = uniquePosts.map((p) => p._id);
    const postInfoRows = ((await PostInfo.find({
        postId: { $in: productIds },
        name: {
            $in: [
                "_variate",
                "shortDescription",
                "sku",
                "thumbnail",
                "featured_image",
                "_thumbnail",
                "image",
                "_gallery",
                "cover",
            ],
        },
    }).lean()) as any[]) || [];

    const infoMap: Record<string, Record<string, string>> = {};
    for (const row of postInfoRows) {
        const key = String(row.postId);
        if (!infoMap[key]) infoMap[key] = {};
        infoMap[key][row.name] = String(row.value ?? "");
    }

    // Fetch Categories
    const categoryIds = uniquePosts.map((p) => p.category).filter(Boolean);
    const catDocs = ((await Cat.find({ _id: { $in: categoryIds } }).lean()) as any[]) || [];
    const catMap: Record<string, string> = {};
    for (const c of catDocs) {
        catMap[String(c._id)] = String(c.title ?? "");
    }

    const productPrefix = permalinkMap["product"] ?? "";

    const matchedProducts: IMatchedProduct[] = uniquePosts.map((post): IMatchedProduct => {
        const info = infoMap[String(post._id)] || {};
        const { price, regularPrice } = extractPrice(info._variate);
        const stock = extractStock(info._variate);
        const thumbnail = extractThumbnail(info, baseUrl);
        const url = buildUrl(productPrefix, String(post.slug ?? ""), baseUrl);
        const desc = String(info.shortDescription ?? "");
        const sku = String(info.sku ?? "");
        const catName = post.category ? catMap[String(post.category)] || "" : "";

        const { score, ratio } = calculateMatchRatio(
            String(post.title ?? ""),
            desc,
            sku,
            catName,
            terms
        );

        return {
            id: String(post._id),
            title: String(post.title ?? ""),
            slug: String(post.slug ?? ""),
            price: price ? `${currencySymbol}${price}` : "",
            regularPrice: regularPrice ? `${currencySymbol}${regularPrice}` : undefined,
            stock,
            shortDescription: desc,
            thumbnail,
            url,
            matchScore: score,
            matchRatio: ratio,
        };
    });

    // Sort by match score & ratio descending
    matchedProducts.sort((a, b) => b.matchScore - a.matchScore || b.matchRatio - a.matchRatio);

    const topProducts = matchedProducts.slice(0, maxResults);

    // ── Search Blog / Pages / FAQ Knowledge ──
    const blogQuery: Record<string, any> = {
        type: { $in: ["blog", "page", "epaper"] },
        status: "published",
    };
    if (terms.length > 0) {
        blogQuery.$or = terms.map((t) => ({
            title: { $regex: t, $options: "i" },
        }));
    }

    const blogDocs = ((await Post.find(blogQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()) as any[]) || [];

    const totalPostCount = await Post.countDocuments({
        type: { $in: ["blog", "page", "epaper"] },
        status: "published",
    });

    const posts = blogDocs.map((p) => {
        const prefix = permalinkMap[p.type] ?? "";
        return {
            title: String(p.title ?? ""),
            slug: String(p.slug ?? ""),
            type: String(p.type ?? ""),
            url: buildUrl(prefix, String(p.slug ?? ""), baseUrl),
        };
    });

    const categories = catDocs.map((c) => ({
        title: String(c.title ?? ""),
        slug: String(c.slug ?? ""),
        type: String(c.type ?? ""),
    }));

    // ── Format Context String for AI Prompt ──
    const contextLines: string[] = [];

    if (topProducts.length > 0) {
        contextLines.push(`### Live Matching Store Products (Total Store Inventory: ${totalProductCount}):`);
        topProducts.forEach((p, idx) => {
            contextLines.push(
                `${idx + 1}. *${p.title}*\n   - Price: ${p.price || "Contact for Price"}${p.regularPrice ? ` (Regular: ${p.regularPrice})` : ""}\n   - Availability: ${p.stock}\n   - Match Ratio: ${Math.round(p.matchRatio * 100)}%\n   - Direct Link: ${p.url}${p.shortDescription ? `\n   - Details: ${p.shortDescription}` : ""}`
            );
        });
    } else if (totalProductCount > 0) {
        contextLines.push(`No exact product matches found for "${userMessage}". Total store inventory has ${totalProductCount} items.`);
    }

    if (posts.length > 0) {
        contextLines.push(`\n### Informational Pages & Policies:`);
        posts.forEach((p, idx) => {
            contextLines.push(`${idx + 1}. [${p.type.toUpperCase()}] ${p.title} — Link: ${p.url}`);
        });
    }

    return {
        products: topProducts,
        allFoundProducts: matchedProducts,
        posts,
        categories,
        totalProductCount,
        totalPostCount,
        searchTokens: terms,
        formattedContext: contextLines.join("\n\n"),
    };
}

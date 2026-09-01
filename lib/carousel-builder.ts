/**
 * plugin/whatsapp/lib/carousel-builder.ts
 *
 * Constructs WhatsApp Cloud API Interactive Carousel, Interactive List,
 * and Interactive Button payloads for ratio-based product messages.
 */

import { type IMatchedProduct } from "../models/WhatsAppMessage";
import { type IWhatsAppAccount } from "../models/WhatsAppAccount";

export interface WhatsAppCarouselPayload {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "interactive";
    interactive: {
        type: "carousel";
        header?: {
            type: "text";
            text: string;
        };
        body: {
            text: string;
        };
        action: {
            cards: WhatsAppCarouselCard[];
        };
    };
}

export interface WhatsAppCarouselCard {
    card_index: number;
    components: (
        | {
              type: "header";
              parameters: [
                  {
                      type: "image";
                      image: { link: string };
                  }
              ];
          }
        | {
              type: "body";
              parameters: [
                  {
                      type: "text";
                      text: string;
                  }
              ];
          }
        | {
              type: "button";
              sub_type: "quick_reply" | "url";
              index: number;
              parameters: [
                  {
                      type: "text" | "payload";
                      text?: string;
                      payload?: string;
                  }
              ];
          }
    )[];
}

export interface WhatsAppInteractiveListPayload {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "interactive";
    interactive: {
        type: "list";
        header?: {
            type: "text";
            text: string;
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: {
            button: string;
            sections: {
                title: string;
                rows: {
                    id: string;
                    title: string;
                    description?: string;
                }[];
            }[];
        };
    };
}

export interface WhatsAppInteractiveButtonsPayload {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "interactive";
    interactive: {
        type: "button";
        header?: {
            type: "text" | "image";
            text?: string;
            image?: { link: string };
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: {
            buttons: {
                type: "reply";
                reply: {
                    id: string;
                    title: string;
                };
            }[];
        };
    };
}

/**
 * Builds an official WhatsApp Cloud API Interactive Carousel payload.
 */
export function buildWhatsAppCarouselPayload(
    to: string,
    products: IMatchedProduct[],
    account?: IWhatsAppAccount | null,
    headerText: string = "Recommended Products",
    bodyText: string = "Browse our top matching items below:"
): WhatsAppCarouselPayload {
    const maxCards = account?.carouselMaxCards || 5;
    const items = products.slice(0, maxCards);

    const cards: WhatsAppCarouselCard[] = items.map((product, idx) => {
        const components: WhatsAppCarouselCard["components"] = [];

        // Header image
        if (product.thumbnail) {
            components.push({
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: { link: product.thumbnail },
                    },
                ],
            });
        }

        // Body text (title, price, stock, ratio)
        const priceStr = product.price ? `Price: ${product.price}` : "Price on request";
        const stockStr = product.stock ? ` • ${product.stock}` : "";
        const bodyContent = `*${product.title.slice(0, 55)}*\n${priceStr}${stockStr}`;

        components.push({
            type: "body",
            parameters: [
                {
                    type: "text",
                    text: bodyContent.slice(0, 160),
                },
            ],
        });

        // Action button (Quick reply button or payload)
        components.push({
            type: "button",
            sub_type: "quick_reply",
            index: 0,
            parameters: [
                {
                    type: "payload",
                    payload: `PRODUCT_DETAILS_${product.id || product.slug}`,
                },
            ],
        });

        return {
            card_index: idx,
            components,
        };
    });

    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "carousel",
            header: {
                type: "text",
                text: headerText.slice(0, 60),
            },
            body: {
                text: bodyText.slice(0, 1024),
            },
            action: {
                cards,
            },
        },
    };
}

/**
 * Builds a WhatsApp Interactive List payload (widely supported on all WhatsApp clients).
 */
export function buildWhatsAppInteractiveListPayload(
    to: string,
    products: IMatchedProduct[],
    headerText: string = "Product Catalog",
    bodyText: string = "Tap below to select or view products from our store:",
    buttonLabel: string = "View Products"
): WhatsAppInteractiveListPayload {
    const rows = products.slice(0, 10).map((p) => ({
        id: `PROD_${p.id || p.slug}`.slice(0, 200),
        title: p.title.slice(0, 24),
        description: `${p.price ? p.price + " • " : ""}${p.stock || "In Stock"}`.slice(0, 72),
    }));

    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: headerText.slice(0, 60),
            },
            body: {
                text: bodyText.slice(0, 1024),
            },
            footer: {
                text: "Select an item to see details",
            },
            action: {
                button: buttonLabel.slice(0, 20),
                sections: [
                    {
                        title: "Available Items",
                        rows,
                    },
                ],
            },
        },
    };
}

/**
 * Builds a fallback Interactive Quick Reply Button message.
 */
export function buildWhatsAppInteractiveButtonsPayload(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    headerText?: string
): WhatsAppInteractiveButtonsPayload {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "button",
            header: headerText ? { type: "text", text: headerText.slice(0, 60) } : undefined,
            body: {
                text: bodyText.slice(0, 1024),
            },
            action: {
                buttons: buttons.slice(0, 3).map((b) => ({
                    type: "reply",
                    reply: {
                        id: b.id.slice(0, 256),
                        title: b.title.slice(0, 20),
                    },
                })),
            },
        },
    };
}

/**
 * Formats a rich WhatsApp text summary with product cards and clickable links.
 */
export function buildRichProductText(products: IMatchedProduct[], headerTitle: string = "🛍️ Matching Products:"): string {
    if (products.length === 0) return "";

    const lines: string[] = [headerTitle, ""];
    products.slice(0, 5).forEach((p, idx) => {
        lines.push(`${idx + 1}. *${p.title}*`);
        if (p.price) lines.push(`   🏷️ Price: *${p.price}*${p.regularPrice ? ` ~${p.regularPrice}~` : ""}`);
        if (p.stock) lines.push(`   📦 Status: ${p.stock}`);
        if (p.shortDescription) lines.push(`   ℹ️ ${p.shortDescription.slice(0, 80)}`);
        lines.push(`   🔗 Link: ${p.url}`);
        lines.push("");
    });

    return lines.join("\n").trim();
}

import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IMatchedProduct {
    id: string;
    title: string;
    slug: string;
    price: string;
    regularPrice?: string;
    stock: string;
    shortDescription?: string;
    thumbnail?: string;
    url: string;
    matchScore: number;
    matchRatio: number;
}

export interface IWhatsAppMessage extends Document {
    _id: Types.ObjectId;
    accountId: Types.ObjectId;
    wamid?: string;
    from: string;
    to: string;
    senderName?: string;
    direction: "incoming" | "outgoing";
    type: "text" | "interactive" | "carousel" | "image" | "template" | "button_reply" | "list_reply" | "system";
    content: string;
    rawPayload?: any;
    aiReply?: string;
    productsFound: IMatchedProduct[];
    carouselSent: boolean;
    status: "received" | "sent" | "delivered" | "read" | "failed";
    errorMessage?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MatchedProductSchema = new Schema<IMatchedProduct>(
    {
        id: { type: String, default: "" },
        title: { type: String, default: "" },
        slug: { type: String, default: "" },
        price: { type: String, default: "" },
        regularPrice: { type: String, default: "" },
        stock: { type: String, default: "" },
        shortDescription: { type: String, default: "" },
        thumbnail: { type: String, default: "" },
        url: { type: String, default: "" },
        matchScore: { type: Number, default: 0 },
        matchRatio: { type: Number, default: 0 },
    },
    { _id: false }
);

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
        wamid: { type: String, default: "", index: true },
        from: { type: String, required: true, index: true },
        to: { type: String, required: true, index: true },
        senderName: { type: String, default: "" },
        direction: { type: String, enum: ["incoming", "outgoing"], required: true },
        type: {
            type: String,
            enum: ["text", "interactive", "carousel", "image", "template", "button_reply", "list_reply", "system"],
            default: "text",
        },
        content: { type: String, default: "" },
        rawPayload: { type: Schema.Types.Mixed, default: null },
        aiReply: { type: String, default: "" },
        productsFound: { type: [MatchedProductSchema], default: [] },
        carouselSent: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["received", "sent", "delivered", "read", "failed"],
            default: "received",
        },
        errorMessage: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

WhatsAppMessageSchema.index({ accountId: 1, from: 1, createdAt: -1 });

export default (mongoose.models.WhatsAppMessage as mongoose.Model<IWhatsAppMessage>) ||
    mongoose.model<IWhatsAppMessage>("WhatsAppMessage", WhatsAppMessageSchema);

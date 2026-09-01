import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IWhatsAppAccount extends Document {
    _id: Types.ObjectId;
    name: string;
    phoneNumber: string;
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
    verifyToken: string;
    appSecret?: string;
    status: "active" | "inactive" | "sandbox";
    isDefault: boolean;
    aiEnabled: boolean;
    aiModel?: string;
    aiSystemPrompt?: string;
    welcomeMessage?: string;
    offHoursMessage?: string;
    fallbackMessage?: string;
    carouselEnabled: boolean;
    carouselMaxCards: number;
    carouselRatio: "1:1" | "16:9" | "4:3" | "auto";
    autoReplayMode: "ai_and_carousel" | "carousel_only" | "ai_text_only" | "interactive_menu";
    totalMessages: number;
    totalReplies: number;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppAccountSchema = new Schema<IWhatsAppAccount>(
    {
        name: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        phoneNumberId: { type: String, required: true, trim: true, unique: true },
        wabaId: { type: String, default: "", trim: true },
        accessToken: { type: String, required: true, trim: true },
        verifyToken: { type: String, required: true, trim: true, default: "ephoto_wa_verify_token" },
        appSecret: { type: String, default: "", trim: true },
        status: { type: String, enum: ["active", "inactive", "sandbox"], default: "active" },
        isDefault: { type: Boolean, default: false },
        aiEnabled: { type: Boolean, default: true },
        aiModel: { type: String, default: "" },
        aiSystemPrompt: { type: String, default: "" },
        welcomeMessage: { type: String, default: "Hello! Welcome to our store. How can we help you today?" },
        offHoursMessage: { type: String, default: "" },
        fallbackMessage: { type: String, default: "Sorry, I could not find matching products. Let me connect you with an agent." },
        carouselEnabled: { type: Boolean, default: true },
        carouselMaxCards: { type: Number, default: 5, min: 1, max: 10 },
        carouselRatio: { type: String, enum: ["1:1", "16:9", "4:3", "auto"], default: "1:1" },
        autoReplayMode: {
            type: String,
            enum: ["ai_and_carousel", "carousel_only", "ai_text_only", "interactive_menu"],
            default: "ai_and_carousel",
        },
        totalMessages: { type: Number, default: 0 },
        totalReplies: { type: Number, default: 0 },
        lastActiveAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default (mongoose.models.WhatsAppAccount as mongoose.Model<IWhatsAppAccount>) ||
    mongoose.model<IWhatsAppAccount>("WhatsAppAccount", WhatsAppAccountSchema);

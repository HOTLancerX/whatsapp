import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICampaignRecipientLog {
    phone: string;
    name?: string;
    status: "sent" | "failed" | "pending";
    messageId?: string;
    error?: string;
    sentAt?: Date;
}

export interface IWhatsAppCampaign extends Document {
    _id: Types.ObjectId;
    name: string;
    accountId: Types.ObjectId;
    bannerImage?: string;
    title?: string;
    message: string;
    buttonText?: string;
    buttonUrl?: string;
    targetType: "all" | "selected" | "manual";
    targetContacts: string[]; // phone numbers or contact IDs
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    status: "draft" | "queued" | "sending" | "completed" | "failed";
    recipientLogs: ICampaignRecipientLog[];
    createdAt: Date;
    updatedAt: Date;
}

const CampaignRecipientLogSchema = new Schema<ICampaignRecipientLog>(
    {
        phone: { type: String, required: true },
        name: { type: String, default: "" },
        status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
        messageId: { type: String, default: "" },
        error: { type: String, default: "" },
        sentAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const WhatsAppCampaignSchema = new Schema<IWhatsAppCampaign>(
    {
        name: { type: String, required: true, trim: true },
        accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
        bannerImage: { type: String, default: "", trim: true },
        title: { type: String, default: "", trim: true },
        message: { type: String, required: true, trim: true },
        buttonText: { type: String, default: "", trim: true },
        buttonUrl: { type: String, default: "", trim: true },
        targetType: { type: String, enum: ["all", "selected", "manual"], default: "all" },
        targetContacts: { type: [String], default: [] },
        totalRecipients: { type: Number, default: 0 },
        sentCount: { type: Number, default: 0 },
        deliveredCount: { type: Number, default: 0 },
        failedCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["draft", "queued", "sending", "completed", "failed"],
            default: "completed",
        },
        recipientLogs: { type: [CampaignRecipientLogSchema], default: [] },
    },
    { timestamps: true }
);

export default (mongoose.models.WhatsAppCampaign as mongoose.Model<IWhatsAppCampaign>) ||
    mongoose.model<IWhatsAppCampaign>("WhatsAppCampaign", WhatsAppCampaignSchema);

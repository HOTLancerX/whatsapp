import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IConversationTurn {
    role: "user" | "assistant" | "agent";
    content: string;
    timestamp: Date;
}

export interface IWhatsAppContact extends Document {
    _id: Types.ObjectId;
    accountId: Types.ObjectId;
    phone: string;
    name: string;
    unreadCount: number;
    lastMessageText: string;
    lastMessageAt: Date;
    conversationContext: IConversationTurn[];
    tags: string[];
    isBlocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationTurnSchema = new Schema<IConversationTurn>(
    {
        role: { type: String, enum: ["user", "assistant", "agent"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const WhatsAppContactSchema = new Schema<IWhatsAppContact>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true, index: true },
        phone: { type: String, required: true, index: true },
        name: { type: String, default: "" },
        unreadCount: { type: Number, default: 0 },
        lastMessageText: { type: String, default: "" },
        lastMessageAt: { type: Date, default: Date.now },
        conversationContext: { type: [ConversationTurnSchema], default: [] },
        tags: { type: [String], default: [] },
        isBlocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

WhatsAppContactSchema.index({ accountId: 1, phone: 1 }, { unique: true });

export default (mongoose.models.WhatsAppContact as mongoose.Model<IWhatsAppContact>) ||
    mongoose.model<IWhatsAppContact>("WhatsAppContact", WhatsAppContactSchema);

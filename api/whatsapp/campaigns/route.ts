/**
 * plugin/whatsapp/api/whatsapp/campaigns/route.ts
 *
 * GET  /api/whatsapp/campaigns — List all WhatsApp banner campaigns
 * POST /api/whatsapp/campaigns — Create and launch a WhatsApp banner campaign
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WhatsAppCampaign, { type ICampaignRecipientLog } from "../../../models/WhatsAppCampaign";
import WhatsAppAccount from "../../../models/WhatsAppAccount";
import WhatsAppContact from "../../../models/WhatsAppContact";
import WhatsAppMessage from "../../../models/WhatsAppMessage";
import { sendImageMessage, sendTextMessage } from "../../../lib/whatsapp-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const skip = (page - 1) * limit;

        const [campaigns, total] = await Promise.all([
            WhatsAppCampaign.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("accountId", "name phoneNumber")
                .lean(),
            WhatsAppCampaign.countDocuments({}),
        ]);

        return NextResponse.json({
            campaigns,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err: any) {
        console.error("[whatsapp/campaigns] GET error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to fetch campaigns." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            accountId,
            bannerImage,
            title,
            message,
            buttonText,
            buttonUrl,
            targetType,
            targetContacts,
            manualPhones,
        } = body;

        if (!name?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: "Campaign Name and Message content are required." },
                { status: 400 }
            );
        }

        await connectDB();

        // 1. Resolve WhatsApp Account
        let account = null;
        if (accountId) {
            account = await WhatsAppAccount.findById(accountId);
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ isDefault: true, status: "active" });
        }
        if (!account) {
            account = await WhatsAppAccount.findOne({ status: "active" });
        }

        if (!account) {
            return NextResponse.json(
                { error: "No active WhatsApp account available to send campaign." },
                { status: 400 }
            );
        }

        // 2. Resolve Target Recipients
        interface ResolvedRecipient {
            phone: string;
            name?: string;
        }

        const recipientsMap = new Map<string, ResolvedRecipient>();

        if (targetType === "all") {
            // Fetch all contacts from the database
            const allContacts = await WhatsAppContact.find({
                isBlocked: { $ne: true },
            }).lean();

            for (const c of allContacts) {
                if (c.phone) {
                    recipientsMap.set(c.phone, { phone: c.phone, name: c.name || "" });
                }
            }
        } else if (targetType === "selected" && Array.isArray(targetContacts)) {
            // Find contacts matching the selected IDs or phone numbers
            const selectedDocs = await WhatsAppContact.find({
                $or: [
                    { _id: { $in: targetContacts.filter((id: string) => id.length === 24) } },
                    { phone: { $in: targetContacts } },
                ],
                isBlocked: { $ne: true },
            }).lean();

            for (const c of selectedDocs) {
                if (c.phone) {
                    recipientsMap.set(c.phone, { phone: c.phone, name: c.name || "" });
                }
            }
        } else if (targetType === "manual" && typeof manualPhones === "string") {
            // Parse manual phone numbers string (separated by commas, spaces, or newlines)
            const rawPhones = manualPhones
                .split(/[\n,;]+/)
                .map((p) => p.trim().replace(/[^\d+]/g, ""))
                .filter((p) => p.length >= 7);

            for (const phone of rawPhones) {
                recipientsMap.set(phone, { phone, name: "" });
            }
        }

        const recipientList = Array.from(recipientsMap.values());

        if (recipientList.length === 0) {
            return NextResponse.json(
                { error: "No valid recipient phone numbers found for this campaign target." },
                { status: 400 }
            );
        }

        // 3. Create Campaign Record
        const campaign = await WhatsAppCampaign.create({
            name: name.trim(),
            accountId: account._id,
            bannerImage: bannerImage?.trim() || "",
            title: title?.trim() || "",
            message: message.trim(),
            buttonText: buttonText?.trim() || "",
            buttonUrl: buttonUrl?.trim() || "",
            targetType: targetType || "all",
            targetContacts: targetContacts || [],
            totalRecipients: recipientList.length,
            sentCount: 0,
            deliveredCount: 0,
            failedCount: 0,
            status: "sending",
            recipientLogs: [],
        });

        // 4. Execute Broadcast Delivery
        let sentCount = 0;
        let failedCount = 0;
        const logs: ICampaignRecipientLog[] = [];

        // Build the caption/text
        let formattedText = message.trim();
        if (title?.trim()) {
            formattedText = `*${title.trim()}*\n\n${formattedText}`;
        }
        if (buttonUrl?.trim()) {
            formattedText += `\n\n🔗 ${buttonText?.trim() || "Visit Link"}: ${buttonUrl.trim()}`;
        }

        for (const recipient of recipientList) {
            let sendRes;
            try {
                if (bannerImage?.trim()) {
                    // Send as image with caption
                    sendRes = await sendImageMessage(
                        account,
                        recipient.phone,
                        bannerImage.trim(),
                        formattedText
                    );
                } else {
                    // Send as text message
                    sendRes = await sendTextMessage(
                        account,
                        recipient.phone,
                        formattedText
                    );
                }

                if (sendRes.ok) {
                    sentCount++;
                    logs.push({
                        phone: recipient.phone,
                        name: recipient.name,
                        status: "sent",
                        messageId: sendRes.messageId,
                        sentAt: new Date(),
                    });

                    // Log in WhatsAppMessage collection
                    await WhatsAppMessage.create({
                        accountId: account._id,
                        from: account.phoneNumber,
                        to: recipient.phone,
                        senderName: recipient.name,
                        direction: "outgoing",
                        type: bannerImage ? "image" : "text",
                        content: formattedText,
                        status: "sent",
                        timestamp: new Date(),
                    });
                } else {
                    failedCount++;
                    logs.push({
                        phone: recipient.phone,
                        name: recipient.name,
                        status: "failed",
                        error: sendRes.error || "Delivery failed",
                        sentAt: new Date(),
                    });
                }
            } catch (sendErr: any) {
                failedCount++;
                logs.push({
                    phone: recipient.phone,
                    name: recipient.name,
                    status: "failed",
                    error: sendErr?.message || "Delivery exception",
                    sentAt: new Date(),
                });
            }
        }

        // 5. Update Campaign Status
        campaign.sentCount = sentCount;
        campaign.failedCount = failedCount;
        campaign.status = failedCount === recipientList.length ? "failed" : "completed";
        campaign.recipientLogs = logs;
        await campaign.save();

        // Increment account statistics
        await WhatsAppAccount.updateOne(
            { _id: account._id },
            {
                $inc: { totalReplies: sentCount },
                $set: { lastActiveAt: new Date() },
            }
        );

        return NextResponse.json({
            success: true,
            campaign,
            summary: {
                total: recipientList.length,
                sent: sentCount,
                failed: failedCount,
            },
        });
    } catch (err: any) {
        console.error("[whatsapp/campaigns] POST error:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to execute banner campaign." },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { createNewsletterToken, hashNewsletterToken, newsletterActionUrl } from "@/lib/newsletter";
import { sendNewsletterCampaignEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

const schema = z.object({ retryFailed: z.boolean().default(false) });
const BATCH_SIZE = 20;

export const POST = withPermission(PERM.NEWSLETTER_MANAGE)(
  async (request: NextRequest, context) => {
    const id = Number((await (context as Context).params).id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    try {
      let requestBody: unknown;
      try {
        requestBody = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      const body = schema.parse(requestBody);
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
        select: { id: true, subject: true, bodyMarkdown: true },
      });
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      const staleSendingBefore = new Date(Date.now() - 10 * 60_000);
      const retryableStatuses = body.retryFailed ? ["PENDING", "FAILED"] : ["PENDING"];
      const candidates = await prisma.newsletterCampaignRecipient.findMany({
        where: {
          campaignId: id,
          OR: [
            { status: { in: retryableStatuses } },
            { status: "SENDING", updatedAt: { lte: staleSendingBefore } },
          ],
          subscription: { status: "ACTIVE", confirmedAt: { not: null } },
        },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        select: {
          id: true,
          subscription: { select: { id: true, email: true } },
        },
      });
      const blockedEmails = new Set(
        (await prisma.emailBlocklist.findMany({
          where: {
            isActive: true,
            email: { in: candidates.map((recipient) => recipient.subscription.email) },
          },
          select: { email: true },
        })).map((entry) => entry.email),
      );

      let sent = 0;
      let failed = 0;
      let skipped = 0;
      for (const recipient of candidates) {
        if (blockedEmails.has(recipient.subscription.email)) {
          await prisma.newsletterCampaignRecipient.updateMany({
            where: {
              id: recipient.id,
              OR: [
                { status: { in: retryableStatuses } },
                { status: "SENDING", updatedAt: { lte: staleSendingBefore } },
              ],
            },
            data: { status: "SKIPPED" },
          });
          skipped += 1;
          continue;
        }

        const token = createNewsletterToken();
        const claimed = await prisma.newsletterCampaignRecipient.updateMany({
          where: {
            id: recipient.id,
            OR: [
              { status: { in: retryableStatuses } },
              { status: "SENDING", updatedAt: { lte: staleSendingBefore } },
            ],
          },
          data: {
            status: "SENDING",
            unsubscribeTokenHash: hashNewsletterToken(token),
          },
        });
        if (claimed.count !== 1) continue;

        try {
          const delivered = await sendNewsletterCampaignEmail({
            to: recipient.subscription.email,
            subject: campaign.subject,
            markdown: campaign.bodyMarkdown,
            unsubscribeLink: newsletterActionUrl("unsubscribe", token),
          });
          await prisma.newsletterCampaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: delivered ? "SENT" : "FAILED",
              sentAt: delivered ? new Date() : null,
            },
          });
          if (delivered) sent += 1;
          else failed += 1;
        } catch (error) {
          console.error("Newsletter campaign recipient delivery failed:", {
            recipientId: recipient.id,
            emailDomain: recipient.subscription.email.split("@").at(-1),
            error,
          });
          await prisma.newsletterCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "FAILED", sentAt: null },
          });
          failed += 1;
        }
      }

      const counts = await prisma.newsletterCampaignRecipient.groupBy({
        by: ["status"],
        where: { campaignId: id },
        _count: { _all: true },
      });
      const countByStatus = Object.fromEntries(
        counts.map((row) => [row.status, row._count._all]),
      );
      const pending = (countByStatus.PENDING ?? 0) + (countByStatus.SENDING ?? 0);
      const status =
        pending > 0
          ? "QUEUED"
          : (countByStatus.FAILED ?? 0) > 0
            ? "PARTIAL"
            : "SENT";
      await prisma.newsletterCampaign.update({
        where: { id },
        data: { status, ...(pending === 0 ? { sentAt: new Date() } : {}) },
      });

      return NextResponse.json({
        sent,
        failed,
        skipped,
        pending,
        failedTotal: countByStatus.FAILED ?? 0,
        status,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      console.error("POST /api/admin/newsletter/[id]/send failed:", error);
      return NextResponse.json({ error: "Could not send campaign batch" }, { status: 500 });
    }
  },
);

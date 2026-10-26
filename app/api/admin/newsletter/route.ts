import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { createNewsletterToken, hashNewsletterToken } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  bodyMarkdown: z.string().trim().min(1).max(50_000),
});

export const GET = withPermission(PERM.NEWSLETTER_MANAGE)(
  async (_request: NextRequest) => {
    try {
      const [counts, subscribers, campaigns] = await Promise.all([
        prisma.newsletterSubscription.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.newsletterSubscription.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, email: true, status: true, confirmedAt: true, createdAt: true },
        }),
        prisma.newsletterCampaign.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
            sentAt: true,
            _count: { select: { recipients: true } },
          },
        }),
      ]);
      const recipientCounts = campaigns.length
        ? await prisma.newsletterCampaignRecipient.groupBy({
            by: ["campaignId", "status"],
            where: { campaignId: { in: campaigns.map((campaign) => campaign.id) } },
            _count: { _all: true },
          })
        : [];
      const recipientsByCampaign = new Map<
        number,
        Record<string, number>
      >();
      for (const row of recipientCounts) {
        const statusCounts = recipientsByCampaign.get(row.campaignId) ?? {};
        statusCounts[row.status] = row._count._all;
        recipientsByCampaign.set(row.campaignId, statusCounts);
      }
      return NextResponse.json({
        counts: Object.fromEntries(counts.map((row) => [row.status, row._count._all])),
        subscribers,
        campaigns: campaigns.map(({ _count, ...campaign }) => ({
          ...campaign,
          recipientCount: _count.recipients,
          recipientStatusCounts: recipientsByCampaign.get(campaign.id) ?? {},
        })),
      });
    } catch (error) {
      console.error("GET /api/admin/newsletter failed:", error);
      return NextResponse.json({ error: "Could not load newsletter data" }, { status: 500 });
    }
  },
);

export const POST = withPermission(PERM.NEWSLETTER_MANAGE)(
  async (request: NextRequest, { user }) => {
    try {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      const parsed = campaignSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid campaign" },
          { status: 400 },
        );
      }
      const activeSubscribers = await prisma.newsletterSubscription.findMany({
        where: { status: "ACTIVE", confirmedAt: { not: null } },
        select: { id: true, email: true },
      });
      const blockedEmails = new Set(
        (await prisma.emailBlocklist.findMany({
          where: { isActive: true },
          select: { email: true },
        })).map((entry) => entry.email),
      );
      const subscribers = activeSubscribers.filter(
        (subscriber) => !blockedEmails.has(subscriber.email),
      );
      const campaign = await prisma.$transaction(async (tx) => {
        const created = await tx.newsletterCampaign.create({
          data: {
            subject: parsed.data.subject,
            bodyMarkdown: parsed.data.bodyMarkdown,
            createdById: user.id,
            status: subscribers.length ? "QUEUED" : "SENT",
            sentAt: subscribers.length ? null : new Date(),
          },
          select: { id: true, subject: true, status: true },
        });
        if (subscribers.length) {
          await tx.newsletterCampaignRecipient.createMany({
            data: subscribers.map((subscriber) => ({
              campaignId: created.id,
              subscriptionId: subscriber.id,
              unsubscribeTokenHash: hashNewsletterToken(createNewsletterToken()),
            })),
          });
        }
        return created;
      });
      return NextResponse.json(
        { campaign, recipientCount: subscribers.length },
        { status: 201 },
      );
    } catch (error) {
      console.error("POST /api/admin/newsletter failed:", error);
      return NextResponse.json({ error: "Could not create newsletter campaign" }, { status: 500 });
    }
  },
);

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type CoupleUser = {
  id: string;
  name: string;
  imageUrl: string;
};

export type CoupleContext = {
  coupleId: string;
  self: CoupleUser;
  partner: CoupleUser | null; // null while waiting for the second partner to join
};

async function toCoupleUser(userId: string): Promise<CoupleUser> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      user.emailAddresses[0]?.emailAddress ||
      "Your partner";
    return { id: userId, name, imageUrl: user.imageUrl };
  } catch {
    return { id: userId, name: "Someone", imageUrl: "" };
  }
}

// Returns null if the user hasn't created or joined a Couple Space yet.
// This is the single source of truth every page and API route should use
// before touching any Letter - never trust a coupleId from the client.
export async function getCoupleContext(userId: string): Promise<CoupleContext | null> {
  const membership = await prisma.coupleMember.findUnique({ where: { userId } });
  if (!membership) return null;

  const allMembers = await prisma.coupleMember.findMany({ where: { coupleId: membership.coupleId } });
  const partnerMembership = allMembers.find((m) => m.userId !== userId) ?? null;

  const self = await toCoupleUser(userId);
  const partner = partnerMembership ? await toCoupleUser(partnerMembership.userId) : null;

  return { coupleId: membership.coupleId, self, partner };
}

// Throws-free authorization check for API routes: returns the coupleId the
// user belongs to, or null if they don't belong to one (caller should
// respond 403/404). This intentionally never accepts a coupleId as input -
// it always derives it from the authenticated user.
export async function requireCoupleId(userId: string): Promise<string | null> {
  const membership = await prisma.coupleMember.findUnique({ where: { userId } });
  return membership?.coupleId ?? null;
}

// For pages that require a fully-formed couple (write/library/timeline/
// letters): redirects to /space if the user has no couple yet, or is still
// waiting on their partner to join. Call this at the top of the page.
export async function requireCoupleContext(userId: string): Promise<CoupleContext> {
  const context = await getCoupleContext(userId);
  if (!context || !context.partner) {
    redirect("/space");
  }
  return context;
}

// Lazily unlocks any scheduled letters whose time has come. Safe to call on
// every read - it's a cheap indexed updateMany and a no-op most of the
// time. Returns the ids that were just unlocked so callers can show a
// "delivered" notification for them. A real deployment should also hit
// POST /api/cron/unlock-letters on a schedule (see vercel.json) so letters
// unlock on time even if nobody has the app open.
export async function unlockDueLetters(coupleId: string): Promise<string[]> {
  const due = await prisma.letter.findMany({
    where: { coupleId, status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    select: { id: true },
  });
  if (due.length === 0) return [];

  await prisma.letter.updateMany({
    where: { id: { in: due.map((d) => d.id) } },
    data: { status: "SENT", deliveredAt: new Date() },
  });
  return due.map((d) => d.id);
}

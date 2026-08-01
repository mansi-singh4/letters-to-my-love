import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleId, unlockDueLetters } from "@/lib/couple";

const MAX_PHOTOS = 12;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  await unlockDueLetters(coupleId);

  // A member sees: anything delivered to the space (SENT/READ, by either
  // partner), plus their own DRAFT/SCHEDULED letters. A partner's drafts
  // and not-yet-unlocked scheduled letters stay invisible.
  const letters = await prisma.letter.findMany({
    where: {
      coupleId,
      OR: [{ status: { in: ["SENT", "READ"] } }, { authorId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: { media: true },
  });

  return NextResponse.json(letters);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const body = await req.json();
  const { recipient, title, content, mood, date, newMedia } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Letter content is required" }, { status: 400 });
  }

  const media = Array.isArray(newMedia) ? newMedia.slice(0, MAX_PHOTOS) : [];
  const validMedia = media.filter(
    (m: unknown): m is { url: string; publicId: string; caption?: string | null; type?: string } =>
      Boolean(m && typeof m === "object" && "url" in m && "publicId" in m)
  );

  // Always created as a draft - sending is a separate, explicit step via
  // POST /api/letters/[id]/send.
  const letter = await prisma.letter.create({
    data: {
      coupleId,
      authorId: userId,
      recipient: (recipient || "You").trim(),
      title: (title || "Untitled Letter").trim(),
      content,
      mood: mood || "love",
      date: date ? new Date(date) : new Date(),
      status: "DRAFT",
      media: validMedia.length
        ? {
            create: validMedia.map((m) => ({
              uploaderId: userId,
              type: "IMAGE",
              url: m.url,
              publicId: m.publicId,
              caption: m.caption || null,
            })),
          }
        : undefined,
    },
    include: { media: true },
  });

  return NextResponse.json(letter, { status: 201 });
}

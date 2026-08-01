import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { requireCoupleId } from "@/lib/couple";

async function getOwnedLetter(id: string, userId: string, coupleId: string) {
  const letter = await prisma.letter.findUnique({ where: { id } });
  if (!letter || letter.coupleId !== coupleId || letter.authorId !== userId) return null;
  return letter;
}

// Enable sharing: mint a new unguessable token (21 chars, ~126 bits of
// entropy) and store it. The existing token is never reused, so revoking
// and re-enabling always produces a fresh, unlinkable link. Only letters
// that have actually been delivered (SENT/READ) can be shared - a draft or
// still-locked scheduled letter has no business being publicly readable.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await getOwnedLetter(params.id, userId, coupleId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "SENT" && existing.status !== "READ") {
    return NextResponse.json({ error: "Only a delivered letter can be shared" }, { status: 409 });
  }

  const shareId = nanoid(21);
  await prisma.letter.update({ where: { id: params.id }, data: { shareId } });

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return NextResponse.json({ shareId, shareUrl: `${base}/shared/${shareId}` });
}

// Revoke sharing: clear the token so the old link stops resolving.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await getOwnedLetter(params.id, userId, coupleId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.letter.update({ where: { id: params.id }, data: { shareId: null } });
  return NextResponse.json({ ok: true });
}

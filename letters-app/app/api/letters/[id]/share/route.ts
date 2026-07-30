import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

async function getOwnedLetter(id: string, userId: string) {
  const letter = await prisma.letter.findUnique({ where: { id } });
  if (!letter || letter.userId !== userId) return null;
  return letter;
}

// Enable sharing: mint a new unguessable token (21 chars, ~126 bits of
// entropy) and store it. The existing token is never reused, so revoking
// and re-enabling always produces a fresh, unlinkable link.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedLetter(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareId = nanoid(21);
  const updated = await prisma.letter.update({ where: { id: params.id }, data: { shareId } });

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return NextResponse.json({ shareId, shareUrl: `${base}/shared/${shareId}` });
}

// Revoke sharing: clear the token so the old link stops resolving.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedLetter(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.letter.update({ where: { id: params.id }, data: { shareId: null } });
  return NextResponse.json({ ok: true });
}

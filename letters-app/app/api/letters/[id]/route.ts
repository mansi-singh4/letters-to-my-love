import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getOwnedLetter(id: string, userId: string) {
  const letter = await prisma.letter.findUnique({ where: { id } });
  if (!letter || letter.userId !== userId) return null;
  return letter;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const letter = await getOwnedLetter(params.id, userId);
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(letter);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedLetter(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.recipient === "string") data.recipient = body.recipient.trim();
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.mood === "string") data.mood = body.mood;
  if (typeof body.date === "string") data.date = new Date(body.date);
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;

  const updated = await prisma.letter.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedLetter(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.letter.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

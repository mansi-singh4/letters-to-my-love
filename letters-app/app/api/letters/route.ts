import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const letters = await prisma.letter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(letters);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { recipient, title, content, mood, date } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Letter content is required" }, { status: 400 });
  }

  const letter = await prisma.letter.create({
    data: {
      userId,
      recipient: (recipient || "You").trim(),
      title: (title || "Untitled Letter").trim(),
      content,
      mood: mood || "love",
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(letter, { status: 201 });
}

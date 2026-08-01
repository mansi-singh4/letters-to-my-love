import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleId } from "@/lib/couple";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!existing || existing.coupleId !== coupleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already read - idempotent no-op, just return current state.
  if (existing.status === "READ") {
    return NextResponse.json(existing);
  }
  if (existing.status !== "SENT") {
    return NextResponse.json({ error: "This letter hasn't been delivered yet" }, { status: 409 });
  }
  // Only the recipient "opens" a letter; an author viewing their own sent
  // letter shouldn't flip it to read.
  if (existing.authorId === userId) {
    return NextResponse.json(existing);
  }

  const updated = await prisma.letter.update({
    where: { id: params.id },
    data: { status: "READ", openedAt: new Date() },
  });
  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleId } from "@/lib/couple";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!existing || existing.coupleId !== coupleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== userId) {
    return NextResponse.json({ error: "Only the author can send this letter" }, { status: 403 });
  }
  if (existing.status === "SENT" || existing.status === "READ") {
    return NextResponse.json({ error: "This letter has already been sent" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const scheduledFor: string | undefined = body?.scheduledFor;

  let scheduledDate: Date | null = null;
  if (scheduledFor) {
    const parsed = new Date(scheduledFor);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
    }
    // A couple of seconds of slack for form-submit latency.
    if (parsed.getTime() > Date.now() + 5000) {
      scheduledDate = parsed;
    }
  }

  const updated = scheduledDate
    ? await prisma.letter.update({
        where: { id: params.id },
        data: { status: "SCHEDULED", scheduledFor: scheduledDate, deliveredAt: null },
      })
    : await prisma.letter.update({
        where: { id: params.id },
        data: { status: "SENT", scheduledFor: null, deliveredAt: new Date() },
      });

  return NextResponse.json(updated);
}

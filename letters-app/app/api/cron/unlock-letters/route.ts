import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Not behind Clerk (no human ever calls this) - protected by a bearer
// secret instead. Point an external scheduler (Vercel Cron, GitHub
// Actions, cron-job.org, etc.) at this route every few minutes; see
// vercel.json for the Vercel Cron config. This is a supplement to the
// lazy per-request unlock in lib/couple.ts, not a replacement for it - the
// lazy check keeps things correct even if the cron ever misses a run.
async function unlockAllDue() {
  const due = await prisma.letter.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    select: { id: true },
  });
  if (due.length > 0) {
    await prisma.letter.updateMany({
      where: { id: { in: due.map((d) => d.id) } },
      data: { status: "SENT", deliveredAt: new Date() },
    });
  }
  return due.length;
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

// Vercel Cron sends GET and automatically attaches this Bearer header when
// CRON_SECRET is set as an env var on the project.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const unlocked = await unlockAllDue();
  return NextResponse.json({ unlocked });
}

// Also available as POST for other cron providers.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const unlocked = await unlockAllDue();
  return NextResponse.json({ unlocked });
}

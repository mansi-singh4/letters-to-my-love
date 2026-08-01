import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.coupleMember.findUnique({ where: { userId } });
  if (!membership) return NextResponse.json({ error: "Not in a Couple Space" }, { status: 404 });

  const memberCount = await prisma.coupleMember.count({ where: { coupleId: membership.coupleId } });
  if (memberCount >= 2) {
    return NextResponse.json({ error: "This space is already complete" }, { status: 409 });
  }

  const inviteToken = nanoid(24);
  await prisma.couple.update({ where: { id: membership.coupleId }, data: { inviteToken } });

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return NextResponse.json({ inviteUrl: `${base}/invite/${inviteToken}` });
}

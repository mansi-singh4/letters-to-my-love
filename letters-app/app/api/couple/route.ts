import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCoupleContext } from "@/lib/couple";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const context = await getCoupleContext(userId);
  if (!context) return NextResponse.json({ couple: null });

  const couple = await prisma.couple.findUnique({ where: { id: context.coupleId } });
  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  return NextResponse.json({
    couple: {
      id: context.coupleId,
      self: context.self,
      partner: context.partner,
      inviteUrl: !context.partner && couple?.inviteToken ? `${base}/invite/${couple.inviteToken}` : null,
    },
  });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.coupleMember.findUnique({ where: { userId } });
  if (existing) return NextResponse.json({ error: "Already in a Couple Space" }, { status: 409 });

  const inviteToken = nanoid(24);
  const couple = await prisma.couple.create({
    data: {
      inviteToken,
      members: { create: { userId } },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return NextResponse.json(
    { coupleId: couple.id, inviteUrl: `${base}/invite/${inviteToken}` },
    { status: 201 }
  );
}

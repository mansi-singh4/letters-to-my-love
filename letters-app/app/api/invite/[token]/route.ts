import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCoupleContext } from "@/lib/couple";

async function loadInvite(token: string) {
  const couple = await prisma.couple.findUnique({
    where: { inviteToken: token },
    include: { members: true },
  });
  return couple;
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const couple = await loadInvite(params.token);
  if (!couple || couple.members.length >= 2) {
    return NextResponse.json({ error: "This invite link is no longer valid" }, { status: 404 });
  }

  const inviter = couple.members[0];
  if (inviter && inviter.userId === userId) {
    return NextResponse.json({ error: "That's your own invite link" }, { status: 400 });
  }

  const alreadyInACouple = await prisma.coupleMember.findUnique({ where: { userId } });
  if (alreadyInACouple) {
    return NextResponse.json({ error: "You're already linked to a Couple Space" }, { status: 409 });
  }

  const inviterContext = inviter ? await getCoupleContext(inviter.userId) : null;
  return NextResponse.json({ inviterName: inviterContext?.self.name ?? "Someone" });
}

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alreadyInACouple = await prisma.coupleMember.findUnique({ where: { userId } });
  if (alreadyInACouple) {
    return NextResponse.json({ error: "You're already linked to a Couple Space" }, { status: 409 });
  }

  const couple = await loadInvite(params.token);
  if (!couple || couple.members.length >= 2) {
    return NextResponse.json({ error: "This invite link is no longer valid" }, { status: 404 });
  }
  if (couple.members.some((m) => m.userId === userId)) {
    return NextResponse.json({ error: "That's your own invite link" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.couple.findUnique({ where: { id: couple.id }, include: { members: true } });
      if (!fresh || fresh.members.length >= 2) {
        throw new Error("FULL");
      }
      await tx.coupleMember.create({ data: { userId, coupleId: couple.id } });
      await tx.couple.update({ where: { id: couple.id }, data: { inviteToken: null } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return NextResponse.json({ error: "This invite link is no longer valid" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ coupleId: couple.id });
}

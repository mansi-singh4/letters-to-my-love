import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCoupleContext } from "@/lib/couple";
import { CreateOrJoin, WaitingForPartner } from "@/components/CoupleOnboarding";

export default async function SpacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const context = await getCoupleContext(userId);

  if (context?.partner) {
    redirect("/library");
  }

  let inviteUrl: string | null = null;
  if (context) {
    const couple = await prisma.couple.findUnique({ where: { id: context.coupleId } });
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    inviteUrl = couple?.inviteToken ? `${base}/invite/${couple.inviteToken}` : null;
  }

  return (
    <section className="view active">
      <div className="hero" style={{ paddingBottom: 10 }}>
        <div className="hero-envelope" style={{ cursor: "default" }}>
          <div className="seal">&#10084;</div>
          <div className="env-flap" />
          <div className="env-body" />
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>Your Couple Space</h1>
        <p className="sub">A private place for just the two of you.</p>
      </div>

      {context ? <WaitingForPartner inviteUrl={inviteUrl} /> : <CreateOrJoin />}
    </section>
  );
}

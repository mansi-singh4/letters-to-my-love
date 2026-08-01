import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCoupleContext } from "@/lib/couple";
import AcceptInvite from "@/components/AcceptInvite";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/invite/${params.token}`);

  const alreadyInACouple = await prisma.coupleMember.findUnique({ where: { userId } });
  if (alreadyInACouple) {
    return (
      <section className="view active">
        <div className="empty-state" style={{ padding: "90px 20px" }}>
          <div className="ic">&#128140;</div>
          <h3>You&rsquo;re already in a Couple Space</h3>
          <p>Each account can only ever belong to one space.</p>
          <div className="hero-actions" style={{ marginTop: 22 }}>
            <Link href="/library" className="btn btn-primary">
              Go to your library
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const couple = await prisma.couple.findUnique({
    where: { inviteToken: params.token },
    include: { members: true },
  });

  if (!couple || couple.members.length >= 2) {
    return (
      <section className="view active">
        <div className="empty-state" style={{ padding: "90px 20px" }}>
          <div className="ic">&#128140;</div>
          <h3>This invite link isn&rsquo;t valid</h3>
          <p>It may have already been used, or the space may already be complete.</p>
          <div className="hero-actions" style={{ marginTop: 22 }}>
            <Link href="/space" className="btn btn-primary">
              Start your own space
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const inviter = couple.members[0];
  if (inviter.userId === userId) {
    redirect("/space");
  }

  const inviterContext = await getCoupleContext(inviter.userId);
  const inviterName = inviterContext?.self.name ?? "Someone";

  return (
    <section className="view active">
      <div className="hero" style={{ paddingBottom: 10 }}>
        <div className="hero-envelope" style={{ cursor: "default" }}>
          <div className="seal">&#10084;</div>
          <div className="env-flap" />
          <div className="env-body" />
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>You&rsquo;ve been invited</h1>
        <p className="sub">{inviterName} wants to share their letters with you.</p>
        <div className="hero-actions">
          <AcceptInvite token={params.token} inviterName={inviterName} />
        </div>
      </div>
    </section>
  );
}

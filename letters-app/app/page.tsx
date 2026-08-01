import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCoupleContext, unlockDueLetters } from "@/lib/couple";
import { dailyQuote, formatDate, moodOf } from "@/lib/moods";

export default async function LandingPage() {
  const { userId } = await auth();
  const context = userId ? await getCoupleContext(userId) : null;
  const spaceReady = Boolean(context?.partner);

  let onThisDay: Awaited<ReturnType<typeof prisma.letter.findMany>> = [];
  if (context && spaceReady) {
    await unlockDueLetters(context.coupleId);
    const visible = await prisma.letter.findMany({
      where: {
        coupleId: context.coupleId,
        OR: [{ status: { in: ["SENT", "READ"] } }, { authorId: userId! }],
      },
    });
    const now = new Date();
    onThisDay = visible.filter((l) => {
      const d = new Date(l.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getFullYear() < now.getFullYear()
      );
    });
  }

  // Where the hero envelope / primary CTA should send people, depending on
  // where they are in the account -> couple -> writing funnel.
  const primaryHref = !userId ? "/sign-up" : spaceReady ? "/write" : "/space";
  const primaryLabel = !userId ? "Get Started" : spaceReady ? "Write a Letter" : "Start Your Couple Space";

  return (
    <section className="view active">
      <div className="hero">
        <Link href={primaryHref} className="hero-envelope" aria-label={primaryLabel}>
          <div className="seal">&#10084;</div>
          <div className="env-flap" />
          <div className="env-body" />
        </Link>
        <h1>
          Every love deserves
          <br />a place to live forever.
        </h1>
        <p className="sub">
          {userId && context && !spaceReady
            ? "You're almost there \u2014 finish setting up your shared space."
            : "Write your heart. Keep every memory safe."}
        </p>
        <div className="hero-actions">
          <Link href={primaryHref} className="btn btn-primary">
            {primaryLabel}
          </Link>
          {spaceReady && (
            <Link href="/library" className="btn btn-ghost">
              Read Memories
            </Link>
          )}
        </div>
      </div>

      <div className="quote-strip">&#8220;{dailyQuote()}&#8221;</div>

      {onThisDay.length > 0 && (
        <div className="onthisday">
          <h3>On this day</h3>
          <div className="grid">
            {onThisDay.map((l) => (
              <Link key={l.id} href={`/letters/${l.id}`} className="letter-card">
                <div className="lc-top">
                  <div className="lc-mood">{moodOf(l.mood).icon}</div>
                </div>
                <div className="lc-title">{l.title}</div>
                <div className="lc-to">To {l.recipient}</div>
                <div className="lc-date">{formatDate(l.date)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

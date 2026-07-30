import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dailyQuote, formatDate, moodOf } from "@/lib/moods";

export default async function LandingPage() {
  const { userId } = await auth();

  let onThisDay: Awaited<ReturnType<typeof prisma.letter.findMany>> = [];
  if (userId) {
    const all = await prisma.letter.findMany({ where: { userId } });
    const now = new Date();
    onThisDay = all.filter((l) => {
      const d = new Date(l.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getFullYear() < now.getFullYear()
      );
    });
  }

  return (
    <section className="view active">
      <div className="hero">
        <Link href="/write" className="hero-envelope" aria-label="Write a letter">
          <div className="seal">&#10084;</div>
          <div className="env-flap" />
          <div className="env-body" />
        </Link>
        <h1>
          Every love deserves
          <br />a place to live forever.
        </h1>
        <p className="sub">Write your heart. Keep every memory safe.</p>
        <div className="hero-actions">
          <Link href="/write" className="btn btn-primary">
            Write a Letter
          </Link>
          <Link href="/library" className="btn btn-ghost">
            Read Memories
          </Link>
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

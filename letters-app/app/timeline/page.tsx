import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { formatDate, moodOf } from "@/lib/moods";

export default async function TimelinePage() {
  const { userId } = await auth();
  const letters = userId
    ? await prisma.letter.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
    : [];

  return (
    <section className="view active">
      <h2 className="section-title">Memories Timeline</h2>
      <p className="section-sub">Your love story, in order.</p>

      {letters.length === 0 ? (
        <div className="empty-state">
          <div className="ic">&#127807;</div>
          <h3>Your story starts here</h3>
          <p>Every letter you write will appear on this timeline.</p>
        </div>
      ) : (
        <div className="timeline">
          {letters.map((l) => (
            <div className="tl-item" key={l.id}>
              <div className="tl-dot">{moodOf(l.mood).icon}</div>
              <Link href={`/letters/${l.id}`} className="tl-card">
                <div className="tl-date">{formatDate(l.date)}</div>
                <div className="tl-title">{l.title}</div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

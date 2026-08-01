import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleContext } from "@/lib/couple";
import LetterForm from "@/components/LetterForm";
import { MoodKey } from "@/lib/moods";

export default async function EditLetterPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  const context = await requireCoupleContext(userId!);

  const letter = await prisma.letter.findUnique({ where: { id: params.id }, include: { media: true } });
  if (!letter || letter.coupleId !== context.coupleId) notFound();
  if (letter.authorId !== userId) notFound();
  if (letter.status === "SENT" || letter.status === "READ") {
    redirect(`/letters/${letter.id}`);
  }

  return (
    <section className="view active">
      <h2 className="section-title">Edit your letter</h2>
      <p className="section-sub">Changes save the moment you tap save or send.</p>
      <LetterForm
        partnerName={context.partner?.name ?? "your partner"}
        initial={{
          id: letter.id,
          recipient: letter.recipient,
          title: letter.title,
          date: letter.date.toISOString().slice(0, 10),
          mood: letter.mood as MoodKey,
          content: letter.content,
          status: letter.status,
          scheduledFor: letter.scheduledFor ? letter.scheduledFor.toISOString() : null,
          media: letter.media.map((m) => ({ id: m.id, url: m.url, caption: m.caption, type: m.type, duration: m.duration })),
        }}
      />
    </section>
  );
}

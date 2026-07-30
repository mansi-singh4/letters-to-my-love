import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import LetterForm from "@/components/LetterForm";
import { MoodKey } from "@/lib/moods";

export default async function EditLetterPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) notFound();

  const letter = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!letter || letter.userId !== userId) notFound();

  return (
    <section className="view active">
      <h2 className="section-title">Edit your letter</h2>
      <p className="section-sub">Changes save the moment you tap the heart.</p>
      <LetterForm
        initial={{
          id: letter.id,
          recipient: letter.recipient,
          title: letter.title,
          date: letter.date.toISOString().slice(0, 10),
          mood: letter.mood as MoodKey,
          content: letter.content,
        }}
      />
    </section>
  );
}

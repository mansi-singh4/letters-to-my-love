import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SharedReadingView from "@/components/SharedReadingView";

export default async function SharedLetterPage({ params }: { params: { shareId: string } }) {
  const letter = await prisma.letter.findUnique({ where: { shareId: params.shareId } });
  if (!letter) notFound();

  return (
    <section className="view active">
      <SharedReadingView
        letter={{
          title: letter.title,
          recipient: letter.recipient,
          content: letter.content,
          mood: letter.mood,
          date: letter.date.toISOString(),
        }}
      />
    </section>
  );
}

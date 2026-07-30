import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import ReadingView from "@/components/ReadingView";

export default async function LetterPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) notFound();

  const letter = await prisma.letter.findUnique({ where: { id: params.id } });
  if (!letter || letter.userId !== userId) notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <section className="view active">
      <ReadingView
        letter={{
          id: letter.id,
          recipient: letter.recipient,
          title: letter.title,
          content: letter.content,
          mood: letter.mood,
          date: letter.date.toISOString(),
          favorite: letter.favorite,
          shareId: letter.shareId,
        }}
        shareUrl={letter.shareId ? `${base}/shared/${letter.shareId}` : null}
      />
    </section>
  );
}

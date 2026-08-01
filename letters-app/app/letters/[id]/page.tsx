import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleContext } from "@/lib/couple";
import ReadingView from "@/components/ReadingView";

export default async function LetterPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  const context = await requireCoupleContext(userId!);

  const letter = await prisma.letter.findUnique({ where: { id: params.id }, include: { media: true } });
  if (!letter || letter.coupleId !== context.coupleId) notFound();

  const isAuthor = letter.authorId === userId;
  if (!isAuthor && (letter.status === "DRAFT" || letter.status === "SCHEDULED")) {
    // A partner's private draft/scheduled letter doesn't exist as far as
    // anyone else is concerned.
    notFound();
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const author = isAuthor ? context.self : context.partner ?? { id: letter.authorId, name: "Your partner", imageUrl: "" };

  return (
    <section className="view active">
      <ReadingView
        currentUserId={userId!}
        author={author}
        letter={{
          id: letter.id,
          recipient: letter.recipient,
          title: letter.title,
          content: letter.content,
          mood: letter.mood,
          date: letter.date.toISOString(),
          favorite: letter.favorite,
          shareId: letter.shareId,
          authorId: letter.authorId,
          status: letter.status,
          scheduledFor: letter.scheduledFor ? letter.scheduledFor.toISOString() : null,
          deliveredAt: letter.deliveredAt ? letter.deliveredAt.toISOString() : null,
          openedAt: letter.openedAt ? letter.openedAt.toISOString() : null,
          media: letter.media.map((m) => ({ id: m.id, url: m.url, caption: m.caption })),
        }}
        shareUrl={letter.shareId ? `${base}/shared/${letter.shareId}` : null}
      />
    </section>
  );
}

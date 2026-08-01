import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleContext, unlockDueLetters } from "@/lib/couple";
import LibraryGrid from "@/components/LibraryGrid";
import LetterNotifications from "@/components/LetterNotifications";

export default async function LibraryPage() {
  const { userId } = await auth();
  const context = await requireCoupleContext(userId!);

  const justUnlocked = await unlockDueLetters(context.coupleId);

  const letters = await prisma.letter.findMany({
    where: {
      coupleId: context.coupleId,
      OR: [{ status: { in: ["SENT", "READ"] } }, { authorId: userId! }],
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { media: true } } },
  });

  const authors: Record<string, { name: string; imageUrl: string }> = {
    [context.self.id]: context.self,
  };
  if (context.partner) authors[context.partner.id] = context.partner;

  const partnerDelivered = context.partner
    ? letters.filter((l) => l.authorId === context.partner!.id && (l.status === "SENT" || l.status === "READ")).map((l) => ({ id: l.id }))
    : [];

  return (
    <section className="view active">
      <LetterNotifications partnerDelivered={partnerDelivered} justUnlocked={justUnlocked} />
      <h2 className="section-title">Memory Library</h2>
      <p className="section-sub">Every letter between you and {context.partner?.name ?? "your partner"}, safe in one place.</p>
      <LibraryGrid
        currentUserId={userId!}
        authors={authors}
        letters={letters.map((l) => ({
          id: l.id,
          recipient: l.recipient,
          title: l.title,
          content: l.content,
          mood: l.mood,
          date: l.date.toISOString(),
          favorite: l.favorite,
          createdAt: l.createdAt.toISOString(),
          authorId: l.authorId,
          status: l.status,
          scheduledFor: l.scheduledFor ? l.scheduledFor.toISOString() : null,
          deliveredAt: l.deliveredAt ? l.deliveredAt.toISOString() : null,
          openedAt: l.openedAt ? l.openedAt.toISOString() : null,
          photoCount: l._count.media,
        }))}
      />
    </section>
  );
}

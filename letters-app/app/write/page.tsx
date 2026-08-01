import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleContext } from "@/lib/couple";
import LetterForm from "@/components/LetterForm";

export default async function WritePage() {
  const { userId } = await auth();
  const context = await requireCoupleContext(userId!);
  const existingCount = await prisma.letter.count({ where: { coupleId: context.coupleId, authorId: userId! } });

  return (
    <section className="view active">
      <h2 className="section-title">Write from the heart</h2>
      <p className="section-sub">
        Save it as a draft, or send it straight to {context.partner?.name ?? "your partner"}.
      </p>
      <LetterForm isFirstLetter={existingCount === 0} partnerName={context.partner?.name ?? "your partner"} />
    </section>
  );
}

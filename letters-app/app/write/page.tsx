import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import LetterForm from "@/components/LetterForm";

export default async function WritePage() {
  const { userId } = await auth();
  const existingCount = userId ? await prisma.letter.count({ where: { userId } }) : 0;

  return (
    <section className="view active">
      <h2 className="section-title">Write from the heart</h2>
      <p className="section-sub">This letter saves privately to your library the moment you tap save.</p>
      <LetterForm isFirstLetter={existingCount === 0} />
    </section>
  );
}

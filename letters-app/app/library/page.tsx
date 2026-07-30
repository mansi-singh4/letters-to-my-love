import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import LibraryGrid from "@/components/LibraryGrid";

export default async function LibraryPage() {
  const { userId } = await auth();
  const letters = userId
    ? await prisma.letter.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <section className="view active">
      <h2 className="section-title">Memory Library</h2>
      <p className="section-sub">Every letter you&rsquo;ve ever written, safe and private in one place.</p>
      <LibraryGrid
        letters={letters.map((l) => ({
          id: l.id,
          recipient: l.recipient,
          title: l.title,
          content: l.content,
          mood: l.mood,
          date: l.date.toISOString(),
          favorite: l.favorite,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}

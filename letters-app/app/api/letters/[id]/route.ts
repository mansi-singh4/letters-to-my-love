import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireCoupleId } from "@/lib/couple";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { parseIncomingMedia, MAX_ITEMS_PER_LETTER } from "@/lib/media";

async function getVisibleLetter(id: string, userId: string, coupleId: string) {
  const letter = await prisma.letter.findUnique({ where: { id }, include: { media: true } });
  if (!letter || letter.coupleId !== coupleId) return null;
  // A partner's still-private draft/scheduled letter is invisible to
  // anyone but its author, even within the same couple.
  if (letter.authorId !== userId && (letter.status === "DRAFT" || letter.status === "SCHEDULED")) {
    return null;
  }
  return letter;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const letter = await getVisibleLetter(params.id, userId, coupleId);
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(letter);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await prisma.letter.findUnique({ where: { id: params.id }, include: { media: true } });
  if (!existing || existing.coupleId !== coupleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const keys = Object.keys(body);
  const onlyTogglingFavorite = keys.length > 0 && keys.every((k) => k === "favorite");

  if (onlyTogglingFavorite) {
    // Either partner may favorite a letter they can already see.
    if (existing.authorId !== userId && (existing.status === "DRAFT" || existing.status === "SCHEDULED")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.letter.update({
      where: { id: params.id },
      data: { favorite: Boolean(body.favorite) },
      include: { media: true },
    });
    return NextResponse.json(updated);
  }

  // Any other field is a content edit: author-only, and only before delivery.
  if (existing.authorId !== userId) {
    return NextResponse.json({ error: "Only the author can edit this letter" }, { status: 403 });
  }
  if (existing.status === "SENT" || existing.status === "READ") {
    return NextResponse.json({ error: "This letter has already been delivered and can't be edited" }, { status: 409 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.recipient === "string") data.recipient = body.recipient.trim();
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.mood === "string") data.mood = body.mood;
  if (typeof body.date === "string") data.date = new Date(body.date);
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;

  // Photos: removeMediaIds must belong to this letter (never trust the id
  // alone), newMedia is capped the same as on create.
  const removeIds: string[] = Array.isArray(body.removeMediaIds)
    ? body.removeMediaIds.filter((id: unknown) => typeof id === "string")
    : [];
  const ownedRemoveIds = existing.media.filter((m) => removeIds.includes(m.id));

  const rawNewMedia = body.newMedia;
  const roomLeft = MAX_ITEMS_PER_LETTER - (existing.media.length - ownedRemoveIds.length);
  const newMedia = parseIncomingMedia(rawNewMedia, roomLeft);

  if (ownedRemoveIds.length > 0) {
    await prisma.media.deleteMany({ where: { id: { in: ownedRemoveIds.map((m) => m.id) } } });
    await Promise.all(
      ownedRemoveIds.map((m) => destroyCloudinaryAsset(m.publicId, m.type === "IMAGE" ? "image" : "video"))
    );
  }

  const updated = await prisma.letter.update({
    where: { id: params.id },
    data: {
      ...data,
      media: newMedia.length
        ? {
            create: newMedia.map((m) => ({
              uploaderId: userId,
              type: m.type,
              url: m.url,
              publicId: m.publicId,
              caption: m.caption || null,
              duration: m.duration ?? null,
            })),
          }
        : undefined,
    },
    include: { media: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  const existing = await prisma.letter.findUnique({ where: { id: params.id }, include: { media: true } });
  if (!existing || existing.coupleId !== coupleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== userId) {
    return NextResponse.json({ error: "Only the author can delete this letter" }, { status: 403 });
  }

  await prisma.letter.delete({ where: { id: params.id } }); // Media cascades in the DB
  await Promise.all(
    existing.media.map((m) => destroyCloudinaryAsset(m.publicId, m.type === "IMAGE" ? "image" : "video"))
  );
  return NextResponse.json({ ok: true });
}

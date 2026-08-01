-- Baseline migration. Reconstructs the schema as it existed before the
-- Couple Space feature (single-owner letters, no Couple/CoupleMember
-- tables). If you already have a database created via `prisma db push`
-- from before this feature, do NOT run this migration - instead baseline
-- it as already applied:
--
--   npx prisma migrate resolve --applied 0001_init
--
-- Then continue with the migrations that follow it. If you're starting
-- from an empty database, just run `prisma migrate deploy` normally and
-- this one will apply first.

CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "shareId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Letter_shareId_key" ON "Letter"("shareId");
CREATE INDEX "Letter_userId_idx" ON "Letter"("userId");
CREATE INDEX "Letter_userId_favorite_idx" ON "Letter"("userId", "favorite");
CREATE INDEX "Letter_userId_mood_idx" ON "Letter"("userId", "mood");

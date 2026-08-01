-- Couple Space feature. This migration is additive and preserves every
-- existing Letter row:
--   * authorId is backfilled from the old userId, then userId is dropped.
--   * status/deliveredAt/openedAt are backfilled so pre-existing letters
--     keep behaving like they already did (visible, already "read") rather
--     than silently reappearing as unread drafts.
--   * coupleId is added but intentionally left NULLABLE here, because a
--     couple cannot be safely invented for a pre-existing solo letter -
--     that's a product decision, not something a migration should guess.
--     See 0003_letter_couple_required for the follow-up that enforces
--     NOT NULL once you've confirmed every row has a couple.

-- 1. New tables ---------------------------------------------------------

CREATE TABLE "Couple" (
    "id" TEXT NOT NULL,
    "inviteToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Couple_inviteToken_key" ON "Couple"("inviteToken");

CREATE TABLE "CoupleMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoupleMember_userId_key" ON "CoupleMember"("userId");
CREATE INDEX "CoupleMember_coupleId_idx" ON "CoupleMember"("coupleId");

ALTER TABLE "CoupleMember"
  ADD CONSTRAINT "CoupleMember_coupleId_fkey"
  FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Letter status enum --------------------------------------------------

CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'READ');

-- 3. Extend Letter, backfill, then drop what it replaces -----------------

ALTER TABLE "Letter" ADD COLUMN "authorId" TEXT;
UPDATE "Letter" SET "authorId" = "userId";
ALTER TABLE "Letter" ALTER COLUMN "authorId" SET NOT NULL;

ALTER TABLE "Letter" ADD COLUMN "coupleId" TEXT;

ALTER TABLE "Letter" ADD COLUMN "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Letter" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Letter" ADD COLUMN "openedAt" TIMESTAMP(3);
ALTER TABLE "Letter" ADD COLUMN "scheduledFor" TIMESTAMP(3);

-- Pre-existing letters were already visible in a personal library with no
-- send/read concept - treat them as already delivered and already read so
-- nothing that used to be visible disappears or resets to "unread".
UPDATE "Letter"
SET "status" = 'READ', "deliveredAt" = "createdAt", "openedAt" = "createdAt";

ALTER TABLE "Letter" DROP COLUMN "userId";
ALTER TABLE "Letter" DROP COLUMN "isDraft";

DROP INDEX IF EXISTS "Letter_userId_idx";
DROP INDEX IF EXISTS "Letter_userId_favorite_idx";
DROP INDEX IF EXISTS "Letter_userId_mood_idx";

CREATE INDEX "Letter_coupleId_idx" ON "Letter"("coupleId");
CREATE INDEX "Letter_coupleId_status_idx" ON "Letter"("coupleId", "status");
CREATE INDEX "Letter_coupleId_favorite_idx" ON "Letter"("coupleId", "favorite");
CREATE INDEX "Letter_coupleId_mood_idx" ON "Letter"("coupleId", "mood");
CREATE INDEX "Letter_authorId_idx" ON "Letter"("authorId");

-- Note: no foreign key on coupleId yet, and coupleId stays nullable - added
-- in 0003 once you've confirmed no NULLs remain. See that migration's
-- header comment for the one-line backfill query to run first if you have
-- pre-existing letters from before this feature shipped.

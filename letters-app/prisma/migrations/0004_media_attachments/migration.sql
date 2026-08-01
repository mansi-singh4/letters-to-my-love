-- Media attachments (photos now; the enum already reserves AUDIO/VIDEO for
-- the voice-notes and video phases so no further enum migration is needed
-- when those ship). Purely additive - nothing existing is touched.

CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');

CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "caption" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Media_letterId_idx" ON "Media"("letterId");

ALTER TABLE "Media"
  ADD CONSTRAINT "Media_letterId_fkey"
  FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

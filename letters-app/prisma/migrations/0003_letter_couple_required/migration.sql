-- Run this only after confirming every Letter row has a coupleId. On a
-- brand new database (no letters created before the Couple Space feature
-- existed) there's nothing to do here - it's a no-op safety net.
--
-- If you're upgrading a database that had personal letters before this
-- feature shipped, decide what those orphaned rows should become first,
-- e.g. assign them all to their author's new couple:
--
--   UPDATE "Letter" l SET "coupleId" = cm."coupleId"
--   FROM "CoupleMember" cm
--   WHERE l."authorId" = cm."userId" AND l."coupleId" IS NULL;
--
-- Any rows still NULL after that (author never joined a couple) should be
-- exported/handled per your own data retention policy - this migration
-- will fail loudly (NOT NULL violation) rather than silently drop them.

ALTER TABLE "Letter" ALTER COLUMN "coupleId" SET NOT NULL;

ALTER TABLE "Letter"
  ADD CONSTRAINT "Letter_coupleId_fkey"
  FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

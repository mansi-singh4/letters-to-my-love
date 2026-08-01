# Letters to My Love

Next.js 14 (App Router) + TypeScript + Prisma/Postgres + Clerk + Tiptap +
Framer Motion. Same aesthetic as the original design (blush/cream/lavender
palette, Dancing Script/Cormorant Garamond/Quicksand, Moonlight dark mode,
floating hearts, envelope hero) — evolved into a two-person shared space
with a real send/read/schedule workflow and photo attachments.

## What's real here

- **Auth** — Clerk handles sign up / sign in / sign out and session
  management. No passwords touch this codebase.
- **Couple Space** — after signing in, a user creates a space (gets an
  invite link) or joins one via a link. Capped at 2 members, permanently
  linked (`CoupleMember.userId` is unique — no leave/switch flow).
- **Privacy** — every letter belongs to a `coupleId`, not a `userId`.
  Every API route and server component re-derives the caller's couple from
  their session (`lib/couple.ts`) and checks the letter's `coupleId`
  matches — never trusts a client-supplied id. A partner's still-private
  draft or not-yet-unlocked scheduled letter is invisible to the other
  member, enforced server-side (not just hidden in the UI).
- **Send / read / schedule workflow** — `DRAFT → SCHEDULED|SENT → READ`.
  "Save Draft" vs "Send" in the composer; "Deliver: Immediately / Custom
  Date & Time" for future letters. Scheduled letters unlock via a lazy
  per-request check plus a real cron endpoint
  (`/api/cron/unlock-letters` + `vercel.json`), so delivery doesn't depend
  on someone having the app open at the right moment.
- **Photo attachments** — "Add Photos" under the editor. Uploads go
  straight from the browser to Cloudinary using a short-lived signature
  this app issues server-side (`CLOUDINARY_API_SECRET` never reaches the
  client); only metadata (`url`, `publicId`, `caption`) is stored in
  Postgres. Up to 12 photos/letter, 8MB each. Shown as a responsive
  gallery with a lightbox on the reading page and the public share page.
- **Editing** — `/letters/[id]/edit` reuses the same form as "Write."
  Only the author can edit, and only before delivery (`DRAFT`/`SCHEDULED`)
  — enforced in the API, not just hidden in the UI.
- **Secure share links** — "Get share link" on a *delivered* letter mints
  a random 21-character token (`nanoid`, ~125 bits of entropy) and stores
  it as `shareId`. `/shared/[shareId]` is a public, read-only page that
  looks the letter up by that token only. "Revoke" clears the token,
  immediately breaking the old URL.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Postgres database** — [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) both work and give you a connection
   string in under a minute.

3. **Create a Clerk app** at [dashboard.clerk.com](https://dashboard.clerk.com)
   and grab your publishable + secret keys. Enable Google as a sign-in
   method there if you want it (no code change needed on this end).

4. **Create a free Cloudinary account** at
   [console.cloudinary.com](https://console.cloudinary.com) and grab your
   cloud name, API key, and API secret. Photo uploads are disabled with a
   friendly error until these are set — everything else works without
   Cloudinary.

5. **Copy the env file and fill it in**
   ```
   cp .env.example .env
   ```

6. **Run the migrations**
   ```
   npx prisma migrate deploy
   ```
   (If this database already exists from *before* the Couple Space
   feature and was set up via `prisma db push`, baseline it first: `npx
   prisma migrate resolve --applied 0001_init`, then read the comments at
   the top of `0003_letter_couple_required/migration.sql` before running
   the rest.)

7. **Run it**
   ```
   npm run dev
   ```
   Visit http://localhost:3000.

## Project shape

```
app/
  page.tsx                    landing (funnels to /space, /write, or /library)
  space/page.tsx               create/join a Couple Space, waiting screen
  invite/[token]/page.tsx      accept an invite
  write/page.tsx                new letter (draft/send/schedule + photos)
  library/page.tsx              shared library: search/filter/sort/favorite/drafts
  timeline/page.tsx             chronological thread
  letters/[id]/page.tsx         read a letter (author or delivered-to-you)
  letters/[id]/edit/page.tsx    edit your own undelivered letter
  shared/[shareId]/page.tsx     public read-only view, no auth
  api/couple/...                create/inspect couple, regenerate invite
  api/invite/[token]/...        preview/accept an invite
  api/letters/...                CRUD + send/read/share
  api/media/upload-signature/    signed Cloudinary upload authorization
  api/cron/unlock-letters/       cron-callable scheduled-letter unlock
components/                     client components (form, uploader, nav, etc.)
lib/                            prisma client, couple/media/cloudinary helpers
prisma/schema.prisma             Couple, CoupleMember, Letter, Media
prisma/migrations/                0001 baseline → 0002/0003 couple space → 0004 media
middleware.ts                    Clerk route protection
```

## Notes / next steps

- The rich text editor is Tiptap with Bold/Italic/Underline/List/Quote.
- Draft autosave for *new* letters is local-only (browser `localStorage`)
  so you don't lose work on an accidental refresh before your first save.
- `Media.type` already has `AUDIO`/`VIDEO` reserved in the enum for the
  voice-notes and video phases — no further enum migration needed when
  those ship, just new upload UI + a `resource_type` switch in the
  Cloudinary calls.
- There's deliberately no "public feed" — the only way anyone outside the
  couple sees a letter is a share link a member generates themselves.

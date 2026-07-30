# Letters to My Love

Next.js 14 (App Router) + TypeScript + Prisma/Postgres + Clerk + Tiptap.
Same aesthetic as the original design (blush/cream/lavender palette,
Dancing Script/Cormorant Garamond/Quicksand, Moonlight dark mode, floating
hearts, envelope hero) rebuilt as a real multi-user product.

## What's real here

- **Auth** — Clerk handles sign up / sign in / sign out and session
  management. No passwords touch this codebase.
- **Privacy** — every letter row has a `userId`. Every API route and every
  server component re-checks `letter.userId === auth().userId` before
  returning or mutating anything — a user can only ever see their own
  letters (plus whatever someone explicitly shared with them).
- **Editing** — `/letters/[id]/edit` reuses the same form as "Write" to
  update recipient, title, date, mood, and rich content.
- **Secure share links** — "Get share link" on a letter mints a random
  21-character token (`nanoid`, ~125 bits of entropy — not guessable) and
  stores it as `shareId`. `/shared/[shareId]` is a public, read-only page
  that looks the letter up by that token only, with no relation to your
  session. "Revoke share link" clears the token, immediately breaking the
  old URL. Regenerating produces a brand new, unlinked token.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Postgres database.** Anything works — [Neon](https://neon.tech)
   and [Supabase](https://supabase.com) both have a free tier and give you a
   connection string in under a minute.

3. **Create a Clerk app** at [dashboard.clerk.com](https://dashboard.clerk.com)
   and grab your publishable + secret keys.

4. **Copy the env file and fill it in**
   ```
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and
   `CLERK_SECRET_KEY` at minimum.

5. **Push the schema to your database**
   ```
   npx prisma db push
   ```

6. **Run it**
   ```
   npm run dev
   ```
   Visit http://localhost:3000.

## Project shape

```
app/
  page.tsx                 landing (hero, daily quote, "on this day")
  write/page.tsx            new letter
  library/page.tsx          search/filter/sort/favorite grid
  timeline/page.tsx         chronological thread
  letters/[id]/page.tsx     read a letter you own
  letters/[id]/edit/page.tsx edit a letter you own
  shared/[shareId]/page.tsx public read-only view, no auth
  api/letters/...           REST-ish CRUD + share endpoints
components/                 client components (form, editor, nav, etc.)
lib/                        prisma client, mood constants, small helpers
prisma/schema.prisma        the one Letter model
middleware.ts                Clerk route protection
```

## Notes / next steps

- The rich text editor is Tiptap with Bold/Italic/Underline/List/Quote —
  matches the original spec's toolbar. Swap in more `@tiptap` extensions
  (links, headings) if you want more formatting.
- Draft autosave for new letters is local-only (browser `localStorage`)
  so you don't lose work on an accidental refresh before your first save.
- There's deliberately no "public feed" or discovery surface — the only
  way anyone but you sees a letter is a share link you generate and hand
  out yourself.

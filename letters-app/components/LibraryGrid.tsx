"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOODS, formatDate, moodOf, stripHtml } from "@/lib/moods";
import { formatTimestamp } from "@/lib/format";
import { showToast } from "@/lib/toast";

type LetterStatus = "DRAFT" | "SCHEDULED" | "SENT" | "READ";

type Letter = {
  id: string;
  recipient: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  favorite: boolean;
  createdAt: string;
  authorId: string;
  status: LetterStatus;
  scheduledFor: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  photoCount: number;
};

type Author = { name: string; imageUrl: string };

function StatusPill({ letter, isMine }: { letter: Letter; isMine: boolean }) {
  if (letter.status === "DRAFT") return <span className="status-pill draft">Draft</span>;
  if (letter.status === "SCHEDULED") {
    return (
      <span className="status-pill scheduled">
        Arrives {letter.scheduledFor ? formatDate(letter.scheduledFor) : "soon"}
      </span>
    );
  }
  if (letter.status === "READ") {
    return <span className="status-pill read">{isMine ? "Opened" : "Read"}</span>;
  }
  return <span className="status-pill sent">Delivered</span>;
}

export default function LibraryGrid({
  letters: initial,
  authors,
  currentUserId,
}: {
  letters: Letter[];
  authors: Record<string, Author>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [letters, setLetters] = useState(initial);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [favOnly, setFavOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = letters.filter((l) => {
      if (mineOnly) {
        if (l.authorId !== currentUserId || (l.status !== "DRAFT" && l.status !== "SCHEDULED")) return false;
      }
      if (favOnly && !l.favorite) return false;
      if (moodFilter && l.mood !== moodFilter) return false;
      if (search) {
        const hay = (l.title + " " + l.recipient + " " + stripHtml(l.content)).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "oldest"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [letters, search, moodFilter, sort, favOnly, mineOnly, currentUserId]);

  async function toggleFavorite(id: string, next: boolean) {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, favorite: next } : l)));
    try {
      const res = await fetch(`/api/letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, favorite: !next } : l)));
      showToast("Couldn't update favorite \u2014 try again");
    }
  }

  function pickRandom() {
    const readable = letters.filter((l) => l.status === "SENT" || l.status === "READ");
    if (readable.length === 0) {
      showToast("No delivered letters yet");
      return;
    }
    const pick = readable[Math.floor(Math.random() * readable.length)];
    router.push(`/letters/${pick.id}`);
  }

  return (
    <>
      <div className="toolbar">
        <input type="text" placeholder="Search letters..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
          <option value="">All moods</option>
          {MOODS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.icon} {m.label}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button className="btn btn-ghost" onClick={pickRandom} type="button">
          Random letter
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          style={favOnly ? { background: "var(--rose-gold)", color: "var(--warm-white)" } : {}}
        >
          &#9825; Favorites
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          style={mineOnly ? { background: "var(--rose-gold)", color: "var(--warm-white)" } : {}}
        >
          &#9998; Drafts &amp; Scheduled
        </button>
      </div>

      <div className="grid">
        {filtered.length === 0 && letters.length === 0 && (
          <div className="empty-state">
            <div className="ic">&#128140;</div>
            <h3>No memories yet</h3>
            <p>Write your first letter and it&rsquo;ll live here, safe and sound.</p>
          </div>
        )}
        {filtered.length === 0 && letters.length > 0 && (
          <div className="empty-state">
            <div className="ic">&#128269;</div>
            <h3>No letters match</h3>
            <p>Try a different search term, mood, or filter.</p>
          </div>
        )}
        {filtered.map((l) => {
          const preview = stripHtml(l.content).slice(0, 110);
          const m = moodOf(l.mood);
          const author = authors[l.authorId];
          const isMine = l.authorId === currentUserId;
          return (
            <Link key={l.id} href={`/letters/${l.id}`} className="letter-card">
              <div className="lc-top">
                <div className="lc-mood">{m.icon}</div>
                <button
                  className={"fav-btn" + (l.favorite ? " on" : "")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(l.id, !l.favorite);
                  }}
                  aria-label="Toggle favorite"
                >
                  {l.favorite ? "\u2764" : "\u2661"}
                </button>
              </div>
              <div className="lc-title">{l.title}</div>
              <div className="lc-to">To {l.recipient}</div>
              <div className="lc-preview">
                {preview}
                {preview.length >= 110 ? "\u2026" : ""}
              </div>
              {author && (
                <div className="lc-author">
                  {author.imageUrl && <img src={author.imageUrl} alt="" />}
                  <span className="lc-author-name">{isMine ? "You" : author.name}</span>
                </div>
              )}
              <StatusPill letter={l} isMine={isMine} />
              <div className="lc-date">
                {l.openedAt ? formatTimestamp(l.openedAt) : formatDate(l.date)}
                {l.photoCount > 0 && <span> &middot; &#128247; {l.photoCount}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

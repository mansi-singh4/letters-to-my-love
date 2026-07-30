"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOODS, formatDate, moodOf, stripHtml } from "@/lib/moods";
import { showToast } from "@/lib/toast";

type Letter = {
  id: string;
  recipient: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  favorite: boolean;
  createdAt: string;
};

export default function LibraryGrid({ letters: initial }: { letters: Letter[] }) {
  const router = useRouter();
  const [letters, setLetters] = useState(initial);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [favOnly, setFavOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = letters.filter((l) => {
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
  }, [letters, search, moodFilter, sort, favOnly]);

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
    if (letters.length === 0) {
      showToast("Write a letter first");
      return;
    }
    const pick = letters[Math.floor(Math.random() * letters.length)];
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
      </div>

      <div className="grid">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="ic">&#128140;</div>
            <h3>No memories yet</h3>
            <p>Write your first letter and it&rsquo;ll live here, safe and sound.</p>
          </div>
        )}
        {filtered.map((l) => {
          const preview = stripHtml(l.content).slice(0, 110);
          const m = moodOf(l.mood);
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
              <div className="lc-date">{formatDate(l.date)}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

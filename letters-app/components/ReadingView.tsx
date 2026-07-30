"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, moodOf } from "@/lib/moods";
import { showToast } from "@/lib/toast";

type Letter = {
  id: string;
  recipient: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  favorite: boolean;
  shareId: string | null;
};

export default function ReadingView({ letter, shareUrl }: { letter: Letter; shareUrl: string | null }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(letter.favorite);
  const [handwrite, setHandwrite] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [progress, setProgress] = useState(0);
  const [share, setShare] = useState(shareUrl);
  const [shareLoading, setShareLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 100);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    try {
      const res = await fetch(`/api/letters/${letter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavorite(!next);
      showToast("Couldn't update favorite \u2014 try again");
    }
  }

  async function enableShare() {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/letters/${letter.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShare(data.shareUrl);
      await navigator.clipboard.writeText(data.shareUrl).catch(() => {});
      showToast("Share link copied to your clipboard");
    } catch {
      showToast("Couldn't create a share link \u2014 try again");
    } finally {
      setShareLoading(false);
    }
  }

  async function revokeShare() {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/letters/${letter.id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setShare(null);
      showToast("Share link revoked");
    } catch {
      showToast("Couldn't revoke the link \u2014 try again");
    } finally {
      setShareLoading(false);
    }
  }

  async function copyExisting() {
    if (!share) return;
    await navigator.clipboard.writeText(share).catch(() => {});
    showToast("Share link copied to your clipboard");
  }

  async function handleDelete() {
    if (!confirm("Delete this letter? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/letters/${letter.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Letter deleted");
      router.push("/library");
      router.refresh();
    } catch {
      showToast("Couldn't delete right now \u2014 try again");
      setDeleting(false);
    }
  }

  return (
    <div className="reading-wrap">
      <Link href="/library" className="reading-back">
        &#8592; Back to Library
      </Link>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {share && (
        <div className="share-banner">
          This letter is shareable &mdash; anyone with the link can read it.{" "}
          <button className="btn btn-ghost" style={{ padding: "4px 12px", fontSize: 12, marginLeft: 8 }} onClick={copyExisting} type="button">
            Copy link
          </button>
        </div>
      )}

      <div className="paper-sheet">
        <div className="rd-head">
          <div className="lc-mood" style={{ fontSize: 30 }}>
            {moodOf(letter.mood).icon}
          </div>
          <div className="rd-title">{letter.title}</div>
          <div className="rd-meta">
            To {letter.recipient} &middot; {formatDate(letter.date)}
          </div>
        </div>
        <div
          className={"rd-body" + (handwrite ? " handwrite" : "")}
          style={{ fontSize }}
          dangerouslySetInnerHTML={{ __html: letter.content }}
        />
      </div>

      <div className="read-controls">
        <button className={handwrite ? "on" : ""} onClick={() => setHandwrite((v) => !v)} type="button">
          Aa Handwriting
        </button>
        <button onClick={() => setFontSize((s) => Math.max(14, s - 2))} type="button">
          A-
        </button>
        <button onClick={() => setFontSize((s) => Math.min(30, s + 2))} type="button">
          A+
        </button>
        <button className={favorite ? "on" : ""} onClick={toggleFavorite} type="button">
          {favorite ? "\u2764 Favorited" : "\u2661 Favorite"}
        </button>
        <Link href={`/letters/${letter.id}/edit`}>Edit</Link>
        {share ? (
          <button onClick={revokeShare} disabled={shareLoading} type="button">
            Revoke share link
          </button>
        ) : (
          <button onClick={enableShare} disabled={shareLoading} type="button">
            Get share link
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting} type="button">
          Delete
        </button>
      </div>
    </div>
  );
}

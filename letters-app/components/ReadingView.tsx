"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, moodOf } from "@/lib/moods";
import { formatTimestamp } from "@/lib/format";
import { showToast } from "@/lib/toast";
import EnvelopeOpenReveal from "./EnvelopeOpenReveal";

type LetterStatus = "DRAFT" | "SCHEDULED" | "SENT" | "READ";

type Letter = {
  id: string;
  recipient: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  favorite: boolean;
  shareId: string | null;
  authorId: string;
  status: LetterStatus;
  scheduledFor: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  media: { id: string; url: string; caption: string | null; type: "IMAGE" | "AUDIO" | "VIDEO" }[];
};

type Person = { id: string; name: string; imageUrl: string };

export default function ReadingView({
  letter: initialLetter,
  shareUrl,
  currentUserId,
  author,
}: {
  letter: Letter;
  shareUrl: string | null;
  currentUserId: string;
  author: Person;
}) {
  const router = useRouter();
  const [letter, setLetter] = useState(initialLetter);
  const [favorite, setFavorite] = useState(letter.favorite);
  const [handwrite, setHandwrite] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [progress, setProgress] = useState(0);
  const [share, setShare] = useState(shareUrl);
  const [shareLoading, setShareLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const isAuthor = letter.authorId === currentUserId;
  const shouldPlayOpenAnimation = !isAuthor && letter.status === "SENT";

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 100);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function markRead() {
    try {
      const res = await fetch(`/api/letters/${letter.id}/read`, { method: "POST" });
      if (!res.ok) return;
      const updated = await res.json();
      setLetter((prev) => ({ ...prev, status: updated.status, openedAt: updated.openedAt }));
    } catch {
      // Non-critical - the letter still displays either way.
    }
  }

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
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
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
      setConfirmingDelete(false);
    }
  }

  function statusLine(): string {
    if (letter.status === "DRAFT") return "Draft \u2014 only you can see this";
    if (letter.status === "SCHEDULED") {
      return `Scheduled for ${letter.scheduledFor ? formatDate(letter.scheduledFor) : "later"} \u2014 only you can see this until then`;
    }
    if (letter.status === "READ" && letter.openedAt) return `Opened \u2764\uFE0F ${formatTimestamp(letter.openedAt)}`;
    return "Delivered";
  }

  const content = (
    <>
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
            {isAuthor ? "To" : "From"} {isAuthor ? letter.recipient : author.name} &middot; {formatDate(letter.date)}
          </div>
          <div className="lc-author" style={{ justifyContent: "center", marginTop: 8 }}>
            {author.imageUrl && <img src={author.imageUrl} alt="" />}
            <span className="lc-author-name">{isAuthor ? "You wrote this" : `Written by ${author.name}`}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span
              className={
                "status-pill " +
                (letter.status === "DRAFT" ? "draft" : letter.status === "SCHEDULED" ? "scheduled" : letter.status === "READ" ? "read" : "sent")
              }
            >
              {statusLine()}
            </span>
          </div>
        </div>
        <div
          className={"rd-body" + (handwrite ? " handwrite" : "")}
          style={{ fontSize }}
          dangerouslySetInnerHTML={{ __html: letter.content }}
        />
        {letter.media.length > 0 && (
          <div className="letter-gallery">
            {letter.media.map((m) => {
              if (m.type === "IMAGE") {
                return (
                  <figure key={m.id}>
                    <img src={m.url} alt={m.caption || ""} onClick={() => setLightbox(m.url)} />
                    {m.caption && <figcaption>{m.caption}</figcaption>}
                  </figure>
                );
              }
              if (m.type === "VIDEO") {
                return (
                  <figure key={m.id} className="video-figure">
                    <video src={m.url} controls />
                    {m.caption && <figcaption>{m.caption}</figcaption>}
                  </figure>
                );
              }
              return (
                <figure key={m.id} className="audio-figure">
                  <div className="audio-card">
                    <audio src={m.url} controls />
                  </div>
                  {m.caption && <figcaption>{m.caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}

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
        {isAuthor && (letter.status === "DRAFT" || letter.status === "SCHEDULED") && (
          <Link href={`/letters/${letter.id}/edit`}>Edit</Link>
        )}
        {isAuthor && (letter.status === "SENT" || letter.status === "READ") && (
          <>
            {share ? (
              <button onClick={revokeShare} disabled={shareLoading} type="button">
                Revoke share link
              </button>
            ) : (
              <button onClick={enableShare} disabled={shareLoading} type="button">
                Get share link
              </button>
            )}
          </>
        )}
        {isAuthor && (
          <button onClick={handleDelete} disabled={deleting} type="button">
            {confirmingDelete ? "Tap again to confirm" : "Delete"}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="reading-wrap">
      <EnvelopeOpenReveal play={shouldPlayOpenAnimation} onOpened={markRead}>
        {content}
      </EnvelopeOpenReveal>
    </div>
  );
}

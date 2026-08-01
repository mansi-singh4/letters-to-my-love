"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import SendingOverlay from "./SendingOverlay";
import MediaUploader from "./MediaUploader";
import { MOODS, MoodKey, stripHtml } from "@/lib/moods";
import { showToast } from "@/lib/toast";
import { burstConfetti } from "@/lib/confetti";
import { burstHearts } from "@/lib/hearts";
import { PendingMedia } from "@/lib/media";

type LetterInput = {
  id?: string;
  recipient: string;
  title: string;
  date: string;
  mood: MoodKey;
  content: string;
  status?: "DRAFT" | "SCHEDULED" | "SENT" | "READ";
  scheduledFor?: string | null;
  media?: { id: string; url: string; caption: string | null; type: "IMAGE" | "AUDIO" | "VIDEO"; duration: number | null }[];
};

const DRAFT_KEY = "letters-draft-new";

function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) {
    const d = new Date(Date.now() + 60 * 60 * 1000); // default: an hour from now
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function LetterForm({
  initial,
  isFirstLetter = false,
  partnerName = "your partner",
}: {
  initial?: LetterInput;
  isFirstLetter?: boolean;
  partnerName?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<MoodKey>(initial?.mood ?? "love");
  const [content, setContent] = useState(initial?.content ?? "");
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [deliverMode, setDeliverMode] = useState<"now" | "schedule">(initial?.scheduledFor ? "schedule" : "now");
  const [scheduledLocal, setScheduledLocal] = useState(toDatetimeLocal(initial?.scheduledFor));

  const [media, setMedia] = useState<PendingMedia[]>(
    () =>
      initial?.media?.map((m) => ({
        localId: `existing-${m.id}`,
        existingId: m.id,
        kind: m.type,
        url: m.url,
        previewUrl: m.url,
        caption: m.caption ?? "",
        duration: m.duration ?? undefined,
        status: "done" as const,
      })) ?? []
  );

  // Restore an unsaved draft on the "new letter" form only.
  useEffect(() => {
    if (isEdit) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      setRecipient(draft.recipient ?? "");
      setTitle(draft.title ?? "");
      setMood(draft.mood ?? "love");
      setContent(draft.content ?? "");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft locally as the user types (new letters only).
  useEffect(() => {
    if (isEdit) return;
    const handle = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ recipient, title, mood, content }));
    }, 400);
    return () => clearTimeout(handle);
  }, [recipient, title, mood, content, isEdit]);

  const plain = useMemo(() => stripHtml(content), [content]);
  const wordCount = plain.length ? plain.split(/\s+/).length : 0;

  async function persistDraft(): Promise<string | null> {
    if (!plain) {
      showToast("Write a little something first");
      return null;
    }
    if (media.some((m) => m.status === "uploading")) {
      showToast("Hang on \u2014 still uploading your memories");
      return null;
    }

    const newMedia = media
      .filter((m) => m.status === "done" && !m.existingId && m.url && m.publicId)
      .map((m) => ({ url: m.url, publicId: m.publicId, caption: m.caption || null, type: m.kind, duration: m.duration ?? null }));

    const originalIds = initial?.media?.map((m) => m.id) ?? [];
    const keptExistingIds = new Set(media.filter((m) => m.existingId).map((m) => m.existingId));
    const removeMediaIds = originalIds.filter((id) => !keptExistingIds.has(id));

    const payload = { recipient, title, date, mood, content, newMedia, removeMediaIds };
    const res = await fetch(isEdit ? `/api/letters/${initial!.id}` : "/api/letters", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Save failed");
    const saved = await res.json();
    return saved.id as string;
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      const id = await persistDraft();
      if (!id) return;
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);
      showToast("Draft saved");
      router.push(`/letters/${id}`);
      router.refresh();
    } catch {
      showToast("Couldn't save right now \u2014 try again");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSend() {
    if (deliverMode === "schedule" && !scheduledLocal) {
      showToast("Pick a delivery date and time");
      return;
    }
    setSending(true);
    setShowOverlay(true);
    try {
      const id = await persistDraft();
      if (!id) {
        setShowOverlay(false);
        return;
      }
      const scheduledFor = deliverMode === "schedule" ? new Date(scheduledLocal).toISOString() : undefined;
      const res = await fetch(`/api/letters/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Send failed");
      }
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);

      setTimeout(() => {
        setShowOverlay(false);
        if (deliverMode === "schedule") {
          showToast(`Scheduled for ${new Date(scheduledLocal).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`);
        } else {
          burstHearts();
          showToast("Your letter is on its way \uD83D\uDC8C");
          if (isFirstLetter) burstConfetti();
        }
        router.push(`/letters/${id}`);
        router.refresh();
      }, 900);
    } catch (err) {
      setShowOverlay(false);
      showToast(err instanceof Error ? err.message : "Couldn't send right now \u2014 try again");
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    setRecipient("");
    setTitle("");
    setContent("");
    setMood("love");
    localStorage.removeItem(DRAFT_KEY);
  }

  return (
    <div className="write-card">
      <SendingOverlay show={showOverlay} />
      <div className="field-row">
        <div className="field">
          <label>To</label>
          <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Who is this letter for?" />
        </div>
        <div className="field">
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a name" />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--ink-soft)", fontWeight: 600 }}>
        Mood
      </label>
      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={"mood-chip" + (mood === m.key ? " sel" : "")}
            onClick={() => setMood(m.key)}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <RichEditor content={content} onChange={setContent} />

      <div className="write-meta">
        <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
        <span>{plain.length} characters</span>
        {!isEdit && <span>Draft auto-saves as you type</span>}
      </div>

      <MediaUploader media={media} onChange={setMedia} />

      <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--ink-soft)", fontWeight: 600, marginTop: 18, display: "block" }}>
        Deliver
      </label>
      <div className="mood-row">
        <button type="button" className={"mood-chip" + (deliverMode === "now" ? " sel" : "")} onClick={() => setDeliverMode("now")}>
          Immediately
        </button>
        <button type="button" className={"mood-chip" + (deliverMode === "schedule" ? " sel" : "")} onClick={() => setDeliverMode("schedule")}>
          Custom Date &amp; Time
        </button>
      </div>
      {deliverMode === "schedule" && (
        <div className="field" style={{ maxWidth: 260, marginBottom: 6 }}>
          <input
            type="datetime-local"
            value={scheduledLocal}
            onChange={(e) => setScheduledLocal(e.target.value)}
            min={nowLocal()}
          />
        </div>
      )}

      <div className="write-actions">
        <button className="btn btn-ghost" type="button" onClick={handleClear}>
          Clear
        </button>
        <button className="btn btn-ghost" type="button" onClick={handleSaveDraft} disabled={savingDraft || sending || !plain}>
          Save Draft
        </button>
        <button
          className="save-heart"
          type="button"
          onClick={handleSend}
          disabled={savingDraft || sending || !plain}
          title={deliverMode === "schedule" ? "Schedule letter" : "Send letter"}
        >
          <span>&#10084;</span>
        </button>
      </div>
    </div>
  );
}

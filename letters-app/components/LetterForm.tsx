"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import { MOODS, MoodKey, stripHtml } from "@/lib/moods";
import { showToast } from "@/lib/toast";
import { burstConfetti } from "@/lib/confetti";

type LetterInput = {
  id?: string;
  recipient: string;
  title: string;
  date: string;
  mood: MoodKey;
  content: string;
};

const DRAFT_KEY = "letters-draft-new";

export default function LetterForm({
  initial,
  isFirstLetter = false,
}: {
  initial?: LetterInput;
  isFirstLetter?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<MoodKey>(initial?.mood ?? "love");
  const [content, setContent] = useState(initial?.content ?? "");
  const [saving, setSaving] = useState(false);

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

  async function handleSave() {
    if (!plain) {
      showToast("Write a little something first");
      return;
    }
    setSaving(true);
    try {
      const payload = { recipient, title, date, mood, content };
      const res = await fetch(isEdit ? `/api/letters/${initial!.id}` : "/api/letters", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();

      if (!isEdit) {
        localStorage.removeItem(DRAFT_KEY);
        showToast("Letter saved to your library");
        if (isFirstLetter) burstConfetti();
      } else {
        showToast("Letter updated");
      }
      router.push(`/letters/${saved.id}`);
      router.refresh();
    } catch {
      showToast("Couldn't save right now \u2014 try again");
    } finally {
      setSaving(false);
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

      <div className="write-actions">
        <button className="btn btn-ghost" type="button" onClick={handleClear}>
          Clear
        </button>
        <button className="save-heart" type="button" onClick={handleSave} disabled={saving} title="Save letter">
          <span>&#10084;</span>
        </button>
      </div>
    </div>
  );
}

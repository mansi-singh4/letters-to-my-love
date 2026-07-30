"use client";

import { useState } from "react";
import { formatDate, moodOf } from "@/lib/moods";

type Letter = {
  title: string;
  recipient: string;
  content: string;
  mood: string;
  date: string;
};

export default function SharedReadingView({ letter }: { letter: Letter }) {
  const [handwrite, setHandwrite] = useState(false);
  const [fontSize, setFontSize] = useState(20);

  return (
    <div className="reading-wrap">
      <div className="share-banner">You&rsquo;re viewing a letter shared with you. This link is read-only.</div>
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
      </div>
    </div>
  );
}

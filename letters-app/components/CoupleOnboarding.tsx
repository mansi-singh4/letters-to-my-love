"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export function CreateOrJoin() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joinValue, setJoinValue] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/couple", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/space");
      router.refresh();
    } catch {
      showToast("Couldn't create your space \u2014 try again");
      setCreating(false);
    }
  }

  function handleJoin() {
    if (!joinValue.trim()) {
      showToast("Paste your invite link or code first");
      return;
    }
    setJoining(true);
    // Accept either a full URL or a bare token.
    const trimmed = joinValue.trim();
    const token = trimmed.includes("/invite/") ? trimmed.split("/invite/").pop() : trimmed;
    router.push(`/invite/${token}`);
  }

  return (
    <div className="write-card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <h3 className="lc-title" style={{ fontSize: 26, textAlign: "center", marginBottom: 6 }}>
        Start your shared space
      </h3>
      <p className="section-sub" style={{ marginBottom: 22 }}>
        Every letter you and your partner write from here on lives in one private space, just for the two of you.
      </p>

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleCreate} disabled={creating} type="button">
        Create a Couple Space
      </button>

      <div style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: 13, margin: "18px 0" }}>or</div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label>Have an invite link?</label>
        <input
          type="text"
          value={joinValue}
          onChange={(e) => setJoinValue(e.target.value)}
          placeholder="Paste your invite link or code"
        />
      </div>
      <button className="btn btn-ghost" style={{ width: "100%" }} onClick={handleJoin} disabled={joining} type="button">
        Join their space
      </button>
    </div>
  );
}

export function WaitingForPartner({ inviteUrl }: { inviteUrl: string | null }) {
  const [url, setUrl] = useState(inviteUrl);
  const [loading, setLoading] = useState(false);

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => {});
    showToast("Invite link copied to your clipboard");
  }

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/couple/invite", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUrl(data.inviteUrl);
      showToast("New invite link ready");
    } catch {
      showToast("Couldn't refresh the link \u2014 try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="write-card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div className="seal" style={{ position: "static", margin: "0 auto 16px" }}>
        &#10084;
      </div>
      <h3 className="lc-title" style={{ fontSize: 26, marginBottom: 6 }}>
        Waiting for your partner
      </h3>
      <p className="section-sub" style={{ marginBottom: 20 }}>
        Send them this invite link. Once they open it and accept, you&rsquo;ll both land in the same space.
      </p>
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--gold-line)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          wordBreak: "break-all",
          color: "var(--ink-soft)",
          marginBottom: 16,
        }}
      >
        {url}
      </div>
      <div className="hero-actions">
        <button className="btn btn-primary" onClick={copyLink} type="button">
          Copy link
        </button>
        <button className="btn btn-ghost" onClick={regenerate} disabled={loading} type="button">
          Generate new link
        </button>
      </div>
    </div>
  );
}

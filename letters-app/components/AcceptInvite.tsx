"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

export default function AcceptInvite({ token, inviterName }: { token: string; inviterName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join");
      }
      showToast(`You're linked with ${inviterName} now`);
      router.push("/library");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't join \u2014 try again");
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-primary" onClick={accept} disabled={loading} type="button">
      Join {inviterName}&rsquo;s space
    </button>
  );
}

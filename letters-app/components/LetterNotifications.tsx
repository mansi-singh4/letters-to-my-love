"use client";

import { useEffect } from "react";
import { showToast } from "@/lib/toast";

const SEEN_KEY = "letters-notif-seen";
const UNLOCKED_KEY = "letters-notif-unlocked";

function loadSeen(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
function saveSeen(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function LetterNotifications({
  partnerDelivered,
  justUnlocked,
}: {
  // Letters authored by the partner that are currently visible (SENT/READ).
  partnerDelivered: { id: string }[];
  // Ids unlocked by *this* request's lazy check - i.e. really did just happen.
  justUnlocked: string[];
}) {
  useEffect(() => {
    const seen = loadSeen(SEEN_KEY);
    const isFirstRun = seen.size === 0 && !localStorage.getItem(SEEN_KEY);

    if (isFirstRun) {
      // Baseline silently - don't fire a toast for every letter that
      // already existed the first time this component ever mounts.
      partnerDelivered.forEach((l) => seen.add(l.id));
      saveSeen(SEEN_KEY, seen);
    } else {
      const fresh = partnerDelivered.filter((l) => !seen.has(l.id));
      if (fresh.length > 0) {
        showToast(fresh.length === 1 ? "\u2764\uFE0F You received a new letter" : `\u2764\uFE0F You received ${fresh.length} new letters`);
        fresh.forEach((l) => seen.add(l.id));
        saveSeen(SEEN_KEY, seen);
      }
    }

    if (justUnlocked.length > 0) {
      const unlockedSeen = loadSeen(UNLOCKED_KEY);
      const freshUnlocks = justUnlocked.filter((id) => !unlockedSeen.has(id));
      if (freshUnlocks.length > 0) {
        showToast("\uD83D\uDC8C Your scheduled letter has been delivered");
        freshUnlocks.forEach((id) => unlockedSeen.add(id));
        saveSeen(UNLOCKED_KEY, unlockedSeen);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

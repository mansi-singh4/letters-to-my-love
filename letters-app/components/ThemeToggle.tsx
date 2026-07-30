"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isMoon, setIsMoon] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const moon = saved === "moon";
    setIsMoon(moon);
    document.documentElement.setAttribute("data-theme", moon ? "moon" : "light");
  }, []);

  function toggle() {
    const next = !isMoon;
    setIsMoon(next);
    document.documentElement.setAttribute("data-theme", next ? "moon" : "light");
    localStorage.setItem("theme", next ? "moon" : "light");
  }

  return (
    <button className="moon-toggle" onClick={toggle} title="Toggle Moonlight theme" aria-label="Toggle Moonlight theme">
      {isMoon ? "\u2600\uFE0F" : "\u263D"}
    </button>
  );
}

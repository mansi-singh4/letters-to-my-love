"use client";

import { useEffect, useRef } from "react";

const GLYPHS = ["\u2764", "\u2661", "\u2665", "\u2728", "\uD83C\uDF38"];

export default function AmbientHearts() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    function spawn() {
      const el = document.createElement("div");
      el.className = "floaty";
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.style.left = Math.random() * 100 + "vw";
      el.style.setProperty("--drift", Math.random() * 80 - 40 + "px");
      const dur = 10 + Math.random() * 10;
      el.style.animationDuration = dur + "s";
      el.style.fontSize = 12 + Math.random() * 14 + "px";
      container!.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000);
    }

    const interval = setInterval(spawn, 1800);
    for (let i = 0; i < 4; i++) setTimeout(spawn, i * 500);
    return () => clearInterval(interval);
  }, []);

  return <div id="ambient" ref={ref} />;
}

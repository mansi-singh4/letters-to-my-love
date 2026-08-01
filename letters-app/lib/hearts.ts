const HEART_GLYPHS = ["\u2764\uFE0F", "\uD83D\uDC95", "\u2764"];

export function burstHearts() {
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.textContent = HEART_GLYPHS[Math.floor(Math.random() * HEART_GLYPHS.length)];
    p.style.left = 30 + Math.random() * 40 + "vw";
    p.style.fontSize = 16 + Math.random() * 14 + "px";
    p.style.animationDuration = 1.8 + Math.random() * 1.2 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3600);
  }
}

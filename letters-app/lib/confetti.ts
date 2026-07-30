const COLORS = ["#B76E79", "#FCE4EC", "#EDE7F6", "#E8C9C0"];

export function burstConfetti() {
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.width = p.style.height = 6 + Math.random() * 6 + "px";
    p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    p.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

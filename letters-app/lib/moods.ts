export type MoodKey =
  | "love"
  | "missing"
  | "happy"
  | "latenight"
  | "anniversary"
  | "forever";

export const MOODS: { key: MoodKey; label: string; icon: string }[] = [
  { key: "love", label: "In Love", icon: "\u2764\uFE0F" },
  { key: "missing", label: "Missing You", icon: "\uD83C\uDF38" },
  { key: "happy", label: "Happy", icon: "\u2600\uFE0F" },
  { key: "latenight", label: "Late Night Thoughts", icon: "\uD83C\uDF19" },
  { key: "anniversary", label: "Anniversary", icon: "\uD83D\uDC95" },
  { key: "forever", label: "Forever", icon: "\uD83D\uDC8D" },
];

export function moodOf(key: string) {
  return MOODS.find((m) => m.key === key) ?? MOODS[0];
}

export const DAILY_QUOTES = [
  "Love is composed of a single soul inhabiting two bodies.",
  "Whatever our souls are made of, his and mine are the same.",
  "I have found the one whom my soul loves.",
  "You are my today and all of my tomorrows.",
  "In all the world, there is no heart for me like yours.",
  "I love you not only for what you are, but for what I am when I am with you.",
  "Grow old with me, the best is yet to be.",
  "Every love story is beautiful, but ours is my favorite.",
];

export function dailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

export function formatDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

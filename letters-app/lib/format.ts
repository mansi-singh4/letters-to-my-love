export function formatTimestamp(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const time = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const isSameDay = dt.toDateString() === now.toDateString();
  if (isSameDay) return `Today at ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dt.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;

  const dateStr = dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateStr} at ${time}`;
}

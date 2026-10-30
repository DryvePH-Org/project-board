export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function fmtShort(value: string | null | undefined): string {
  if (!value) return "—";
  return parseISO(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeDay(value: string): string {
  const diff = daysBetween(parseISO(value), new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < 0 && diff === -1) return "Tomorrow";
  return fmtShort(value);
}

export function dueLabel(
  value: string | null,
  opts?: { done?: boolean },
): { text: string; tone: string } {
  if (opts?.done) return { text: "Delivered", tone: "muted" };
  if (!value) return { text: "No due date", tone: "muted" };
  const diff = daysBetween(new Date(), parseISO(value));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, tone: "red" };
  if (diff === 0) return { text: "Due today", tone: "red" };
  if (diff === 1) return { text: "Due tomorrow", tone: "amber" };
  if (diff <= 7) return { text: `Due in ${diff}d`, tone: "amber" };
  return { text: `Due ${fmtShort(value)}`, tone: "muted" };
}

export function formatHours(h: number | null | undefined): string {
  if (!h || h <= 0) return "0h";
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}

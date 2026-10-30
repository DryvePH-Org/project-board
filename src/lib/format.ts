export function parseISO(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function fmtShort(value: string | null | undefined): string {
  if (!value) return "—";
  return parseISO(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

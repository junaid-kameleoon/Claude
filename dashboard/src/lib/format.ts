export function fmtInt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function fmtCost(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1) return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(3);
  return "$" + n.toFixed(4);
}

export function fmtTokens(n: number | undefined | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

export function fmtPct(n: number | undefined | null): string {
  if (n == null) return "—";
  return Math.round(n * 100) + "%";
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return String(iso).slice(0, 16);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(String(iso).replace(" ", "T"));
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtLatency(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms >= 1000) return (ms / 1000).toFixed(1) + "s";
  return ms + "ms";
}

export function fmtRange(from: string | null, to: string | null): string {
  if (!from || !to) return "—";
  return fmtDay(from) + " – " + fmtDay(to);
}

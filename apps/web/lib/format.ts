import { RESOLVABILITY_LABEL, RESOLVABILITY_NOTE, type Resolvability } from "@bind/shared";

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "—";

export const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export const resLabel = (r: string) => RESOLVABILITY_LABEL[r as Resolvability] ?? r;
export const resNote = (r: string) => RESOLVABILITY_NOTE[r as Resolvability] ?? "";

export const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Builds an index URL from the current filters with one key changed. Same value toggles off. */
export function withParam(current: Record<string, string | undefined>, key: string, value?: string) {
  const next = { ...current, [key]: current[key] === value ? undefined : value };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

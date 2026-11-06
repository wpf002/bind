import { z } from "zod";
import { groupByPrimaryShape, type PropertyCase, type ShapeGroup } from "./properties.js";

/** The slice of a case the design check reads: a property case plus its property slugs. */
export type CheckCase = PropertyCase & { properties: string[] };

/** What the engineer picked. An empty list leaves that dimension unfiltered. */
export type CheckSelection = { properties: string[]; jurisdictions: string[] };

export const EMPTY_CHECK_SELECTION: CheckSelection = { properties: [], jurisdictions: [] };

const QUERY_SEPARATOR = ",";

/** `?p=a,b&p=c` and `?p=a` both read as a list. Blank entries drop. */
const csvList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) =>
    (Array.isArray(v) ? v : v === undefined ? [] : [v])
      .flatMap((s) => s.split(QUERY_SEPARATOR))
      .map((s) => s.trim())
      .filter(Boolean)
  );

/** The check page's query string: `p` property slugs, `j` jurisdiction codes. */
export const checkQuerySchema = z.object({ p: csvList, j: csvList });

export type CheckQuery = z.infer<typeof checkQuerySchema>;

/** Keeps the values the corpus knows, in corpus order, so two URLs for one selection compare equal. */
export function resolveCheckSelection(q: CheckQuery, known: { properties: string[]; jurisdictions: string[] }): CheckSelection {
  const codes = new Set(q.j.map((c) => c.toUpperCase()));
  const slugs = new Set(q.p);
  return {
    properties: known.properties.filter((slug) => slugs.has(slug)),
    jurisdictions: known.jurisdictions.filter((code) => codes.has(code)),
  };
}

/** A case hits the selection when it has any selected property and any selected jurisdiction. */
export function matchesCheck(c: CheckCase, selection: CheckSelection): boolean {
  const byProperty = !selection.properties.length || c.properties.some((p) => selection.properties.includes(p));
  const byJurisdiction = !selection.jurisdictions.length || c.jurisdictions.some((j) => selection.jurisdictions.includes(j));
  return byProperty && byJurisdiction;
}

/** The shapes a selection hits, each with its matching cases, in shape order. */
export function runCheck<T extends CheckCase>(cases: T[], selection: CheckSelection): ShapeGroup<T>[] {
  return groupByPrimaryShape(cases.filter((c) => matchesCheck(c, selection)));
}

/** The check page URL for a selection. No selection is the bare page. */
export function checkHref(selection: CheckSelection): string {
  const qs = new URLSearchParams();
  if (selection.properties.length) qs.set("p", selection.properties.join(QUERY_SEPARATOR));
  if (selection.jurisdictions.length) qs.set("j", selection.jurisdictions.join(QUERY_SEPARATOR));
  const s = qs.toString();
  return s ? `/check?${decodeURIComponent(s)}` : "/check";
}

/** The selection with one value added or, when already picked, removed. */
export function toggleCheck(selection: CheckSelection, dimension: keyof CheckSelection, value: string): CheckSelection {
  const current = selection[dimension];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { ...selection, [dimension]: next };
}

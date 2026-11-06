import { z } from "zod";

/**
 * Re-checks a verified citation against its source. The stored quote is the passage the case
 * relies on; if it no longer appears in the source text, the provision changed after it was read.
 */

export const SOURCE_CHECK_STATUSES = ["current", "changed", "unreachable"] as const;
export type SourceCheckStatus = (typeof SOURCE_CHECK_STATUSES)[number];

/** What a fetch produced: the source's text, or the reason there isn't one. */
export type FetchedSource = { ok: true; text: string } | { ok: false; reason: string };

export type SourceCheckResult = { status: SourceCheckStatus; detail?: string };

const QUOTE_MARKS = /[‘’‚‛′`´“”„‟″«»"]/g;
const DASHES = /[‐-―−]/g;
const INVISIBLE = /[­​-‍⁠﻿]/g;
/**
 * Text in a stored quote that isn't the source's: an omission ("...", "…") or an editorial
 * insertion in square brackets ("[Art. 33(3)(a):]", a translation). Both split the quote.
 */
const EDITORIAL = /\[[^\]]*\]|\.{3}|…/g;

/** Reason recorded when a quote is missing and this check has never once found it at the URL. */
export const QUOTE_NEVER_FOUND = "quote never found at this URL";

/**
 * Folds differences that don't change what a provision says: Unicode form, quote-mark style,
 * dash style, soft hyphens and all whitespace. Whitespace is removed, not collapsed, because
 * HTML and PDF extraction break lines and split inline tags at arbitrary points.
 */
export function normaliseSourceText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(QUOTE_MARKS, "'")
    .replace(DASHES, "-")
    .replace(/\s+/g, "");
}

/** The parts of a quote that are the source's own words, each of which must appear in it. */
export function quoteSegments(quote: string): string[] {
  return quote
    .split(EDITORIAL)
    .map(normaliseSourceText)
    .filter((segment) => segment.length > 0);
}

/**
 * True when every segment of the quote appears in the text. Order isn't required: one stored
 * quote can join passages from different provisions of the same document.
 */
export function quoteAppearsIn(quote: string, text: string): boolean {
  const haystack = normaliseSourceText(text);
  return quoteSegments(quote).every((segment) => haystack.includes(segment));
}

/**
 * A failed fetch says nothing about the text, so it is "unreachable". A missing quote is
 * "changed" only if this check found it at the same URL before. Without that baseline the page
 * may be a search form or a gate that never showed the text, which is also "unreachable".
 */
export function checkQuote(quote: string, source: FetchedSource, foundBefore: boolean): SourceCheckResult {
  if (!source.ok) return { status: "unreachable", detail: source.reason };
  if (!quoteSegments(quote).length) throw new Error("checkQuote needs a non-empty quote");
  if (quoteAppearsIn(quote, source.text)) return { status: "current" };
  return foundBefore ? { status: "changed" } : { status: "unreachable", detail: QUOTE_NEVER_FOUND };
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "­",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  ndash: "–", mdash: "—", hellip: "…", sect: "§", para: "¶", euro: "€",
};

function decodeEntities(html: string): string {
  return html.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] !== "#") return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    const code = body[1]?.toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

/** Visible text of an HTML document. Script, style and comments are dropped; tags become spaces. */
export function htmlToText(html: string): string {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(visible);
}

export type SourceCheckCounts = Record<SourceCheckStatus, number>;

export function countSourceChecks(statuses: (SourceCheckStatus | null | undefined)[]): SourceCheckCounts {
  const counts: SourceCheckCounts = { current: 0, changed: 0, unreachable: 0 };
  for (const status of statuses) if (status) counts[status]++;
  return counts;
}

/** One check per distinct (url, quote). Citations in several cases that share both share the result. */
const sourceCheckEntrySchema = z.object({
  url: z.string().url(),
  quote: z.string().min(1),
  label: z.string(),
  status: z.enum(SOURCE_CHECK_STATUSES),
  detail: z.string().optional(),
  checkedAt: z.string().datetime(),
  /** Last time the quote was found at the URL. A later miss is "changed" only when this is set. */
  foundAt: z.string().datetime().optional(),
});

/** The file the check script writes and the seed reads, so results survive a reseed. */
export const sourceCheckLedgerSchema = z.object({ checks: z.array(sourceCheckEntrySchema) });

export type SourceCheckEntry = z.infer<typeof sourceCheckEntrySchema>;
export type SourceCheckLedger = z.infer<typeof sourceCheckLedgerSchema>;

/** Identifies a check by the source and the passage, which is all the check depends on. */
export const sourceCheckKey = (url: string, quote: string) => `${url}\n${quote}`;

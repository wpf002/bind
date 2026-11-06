import { z } from "zod";

/**
 * Re-checks a verified citation against its source. The stored quote is the passage the case
 * relies on; if it no longer appears in the source text, the provision changed after it was read.
 */

export const SOURCE_CHECK_STATUSES = ["current", "changed", "blocked", "unreachable"] as const;
export type SourceCheckStatus = (typeof SOURCE_CHECK_STATUSES)[number];

/**
 * What a fetch produced: the source's text, or the reason there isn't one. `blocked` marks a
 * source the publisher keeps from scripts (a bot challenge, a CAPTCHA, a sign-in or a licence step).
 * `capturedAt` is set when the text is the Internet Archive's capture of a blocked source, and
 * is the time the archive read it.
 */
export type FetchedSource = { ok: true; text: string; capturedAt?: string } | { ok: false; reason: string; blocked?: boolean };

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
/** Detail recorded when the text checked was the Internet Archive's capture of a blocked source. */
export const READ_FROM_ARCHIVE = "read from the Internet Archive capture";
/** Reason recorded when a blocked source's archive capture doesn't hold the quote. */
export const ARCHIVE_LACKS_QUOTE = "quote not in the Internet Archive capture";

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
 * A failed fetch says nothing about the text. It is "blocked" when the publisher refuses scripts,
 * which a person with a browser can still read, and "unreachable" otherwise. A missing quote is
 * "changed" only if this check found it at the same URL before. Without that baseline the page
 * may be a search form or a gate that never showed the text, which is also "unreachable".
 * An archive capture stands in for a blocked source only when it holds the quote. A capture
 * without it can be an old or partial copy, so the source stays "blocked".
 */
export function checkQuote(quote: string, source: FetchedSource, foundBefore: boolean): SourceCheckResult {
  if (!source.ok) return { status: source.blocked ? "blocked" : "unreachable", detail: source.reason };
  if (!quoteSegments(quote).length) throw new Error("checkQuote needs a non-empty quote");
  const found = quoteAppearsIn(quote, source.text);
  if (source.capturedAt) return found ? { status: "current", detail: READ_FROM_ARCHIVE } : { status: "blocked", detail: ARCHIVE_LACKS_QUOTE };
  if (found) return { status: "current" };
  return foundBefore ? { status: "changed" } : { status: "unreachable", detail: QUOTE_NEVER_FOUND };
}

/**
 * One source out of the documents a quote draws on. A quote that joins passages from two
 * documents needs both, so the first failure stands for the whole. If any text is an archive
 * capture, the whole is dated by the oldest capture.
 */
export function combineSources(sources: FetchedSource[]): FetchedSource {
  if (!sources.length) throw new Error("combineSources needs at least one source");
  const texts: string[] = [];
  const captures: string[] = [];
  for (const source of sources) {
    if (!source.ok) return source;
    texts.push(source.text);
    if (source.capturedAt) captures.push(source.capturedAt);
  }
  const text = texts.join("\n");
  return captures.length ? { ok: true, text, capturedAt: captures.sort()[0] } : { ok: true, text };
}

const WAYBACK_HOST = "https://web.archive.org";
const WAYBACK_TIMESTAMP = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/;
const HTTP_OK = "200";

/** The Internet Archive availability API's answer for one URL. `closest` is absent when it has no capture. */
const waybackAvailabilitySchema = z.object({
  archived_snapshots: z.object({
    closest: z.object({ available: z.boolean(), status: z.string(), timestamp: z.string().regex(WAYBACK_TIMESTAMP) }).optional(),
  }),
});

export type ArchiveCapture = { url: string; capturedAt: string };

/**
 * The capture the availability API reports for `sourceUrl`, or null when there is no capture of
 * a 200 response. `url` returns the captured bytes without the archive's page frame (`id_`).
 * Throws on a response that isn't the API's shape.
 */
export function archiveCaptureOf(sourceUrl: string, availabilityJson: string): ArchiveCapture | null {
  const closest = waybackAvailabilitySchema.parse(JSON.parse(availabilityJson)).archived_snapshots.closest;
  if (!closest?.available || closest.status !== HTTP_OK) return null;
  const [, year, month, day, hour, minute, second] = closest.timestamp.match(WAYBACK_TIMESTAMP)!;
  return {
    url: `${WAYBACK_HOST}/web/${closest.timestamp}id_/${sourceUrl}`,
    capturedAt: `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`,
  };
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

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === "string") into.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, into);
  else if (value !== null && typeof value === "object") for (const item of Object.values(value)) collectStrings(item, into);
}

/** Visible text of a JSON document: every string value, with any HTML in it reduced to text. Throws on invalid JSON. */
export function jsonToText(json: string): string {
  const strings: string[] = [];
  collectStrings(z.unknown().parse(JSON.parse(json)), strings);
  return strings.map(htmlToText).join("\n");
}

export type SourceCheckCounts = Record<SourceCheckStatus, number>;

export function countSourceChecks(statuses: (SourceCheckStatus | null | undefined)[]): SourceCheckCounts {
  const counts: SourceCheckCounts = { current: 0, changed: 0, blocked: 0, unreachable: 0 };
  for (const status of statuses) if (status) counts[status]++;
  return counts;
}

/** One check per distinct (url, quote). Citations in several cases that share both share the result. */
const sourceCheckEntrySchema = z.object({
  url: z.string().url(),
  /** Second document the quote draws on, fetched with `url`. */
  secondUrl: z.string().url().optional(),
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

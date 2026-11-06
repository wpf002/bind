import { type SourceCheckStatus } from "./sourceCheck.js";
import { isResolvedState } from "./resolutions.js";

/**
 * What changed in the published corpus, as one list of dated events. The Changes page and the
 * Atom feed both read it. Everything comes from data already stored: `Case.publishedAt`, the
 * case's transitions, and the source-check result the ledger wrote to each citation.
 */

export const CHANGE_KINDS = ["case_published", "case_resolved", "case_transition", "source_changed"] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  case_published: "Published",
  case_resolved: "Resolved",
  case_transition: "Transition",
  source_changed: "Source",
};

/** Source-check results the feed reports. A current source is no change. */
export const FLAGGED_SOURCE_STATUSES = ["changed", "blocked", "unreachable"] as const satisfies readonly SourceCheckStatus[];
export type FlaggedSourceStatus = (typeof FLAGGED_SOURCE_STATUSES)[number];

const SOURCE_STATUS_SUMMARY: Record<FlaggedSourceStatus, string> = {
  changed: "The quoted passage is no longer at its source.",
  blocked: "The publisher keeps the source from scripts.",
  unreachable: "The source could not be fetched.",
};

export type ChangeEvent = {
  /** Stable across runs: `kind:slug:occurredAt`, plus the state or source label where a case can have several on one date. */
  id: string;
  kind: ChangeKind;
  /** ISO 8601, UTC. */
  occurredAt: string;
  title: string;
  summary: string;
  /** Site-relative path of the case the event is about. */
  url: string;
};

type CaseStatus = string;

export type ChangeCase = {
  slug: string;
  title: string;
  statement: string;
  status: CaseStatus;
  publishedAt: Date | string | null;
  transitions: { fromState: string; toState: string; trigger: string; occurredAt: Date | string }[];
};

/** A ledger entry (or the Citation row it was applied to) with the case that cites the URL. */
export type ChangeSourceCheck = {
  url: string;
  label: string;
  status: SourceCheckStatus;
  checkedAt: Date | string;
  detail?: string;
  case: { slug: string; title: string; status: CaseStatus };
};

export type ChangeInput = { cases: ChangeCase[]; sourceChecks: ChangeSourceCheck[] };

const PUBLISHED: CaseStatus = "published";

const iso = (date: Date | string) => new Date(date).toISOString();
const casePath = (slug: string) => `/case/${slug}`;
const labelSlug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isFlagged = (status: SourceCheckStatus): status is FlaggedSourceStatus =>
  (FLAGGED_SOURCE_STATUSES as readonly string[]).includes(status);

function publishEvent(c: ChangeCase): ChangeEvent[] {
  if (!c.publishedAt) return [];
  const at = iso(c.publishedAt);
  return [{ id: `case_published:${c.slug}:${at}`, kind: "case_published", occurredAt: at, title: `Published: ${c.title}`, summary: c.statement, url: casePath(c.slug) }];
}

function transitionEvents(c: ChangeCase): ChangeEvent[] {
  return c.transitions.map((t) => {
    const at = iso(t.occurredAt);
    const kind: ChangeKind = isResolvedState(t.toState) ? "case_resolved" : "case_transition";
    return {
      id: `${kind}:${c.slug}:${at}:${t.toState}`,
      kind,
      occurredAt: at,
      title: `${kind === "case_resolved" ? "Resolved" : "Moved"}: ${c.title}`,
      summary: `${t.fromState} → ${t.toState}. ${t.trigger}`,
      url: casePath(c.slug),
    };
  });
}

function sourceEvent(s: ChangeSourceCheck): ChangeEvent[] {
  if (!isFlagged(s.status) || s.case.status !== PUBLISHED) return [];
  const at = iso(s.checkedAt);
  return [
    {
      id: `source_changed:${s.case.slug}:${at}:${labelSlug(s.label)}`,
      kind: "source_changed",
      occurredAt: at,
      title: `Source ${s.status}: ${s.label}`,
      summary: `${SOURCE_STATUS_SUMMARY[s.status]} Cited by ${s.case.title}.${s.detail ? ` ${s.detail}.` : ""}`,
      url: casePath(s.case.slug),
    },
  ];
}

/** Every change to the published corpus, newest first. Held cases and their sources contribute nothing. */
export function changeEvents(input: ChangeInput): ChangeEvent[] {
  const published = input.cases.filter((c) => c.status === PUBLISHED);
  const events = [...published.flatMap(publishEvent), ...published.flatMap(transitionEvents), ...input.sourceChecks.flatMap(sourceEvent)];
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}

const ATOM_NS = "http://www.w3.org/2005/Atom";
const ATOM_TYPE = "application/atom+xml";
/** URN namespace for entry ids, so an id never depends on where the site is hosted. */
const ENTRY_ID_PREFIX = "urn:bind:change:";

export const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

export type AtomFeedOptions = {
  /** Where the site's pages live; event paths are resolved against it. */
  siteUrl: string;
  /** The feed's own address, for `rel="self"`. */
  feedUrl: string;
  title: string;
  /** `updated` when there are no events. */
  generatedAt: Date;
};

/** Atom 1.0 (RFC 4287): one entry per event, `updated` set to the newest event. */
export function atomFeed(events: ChangeEvent[], options: AtomFeedOptions): string {
  const resolve = (path: string) => new URL(path, options.siteUrl).toString();
  const updated = events[0]?.occurredAt ?? options.generatedAt.toISOString();
  const entries = events.map((e) =>
    [
      "  <entry>",
      `    <id>${ENTRY_ID_PREFIX}${escapeXml(e.id)}</id>`,
      `    <title>${escapeXml(e.title)}</title>`,
      `    <updated>${e.occurredAt}</updated>`,
      `    <published>${e.occurredAt}</published>`,
      `    <link rel="alternate" type="text/html" href="${escapeXml(resolve(e.url))}"/>`,
      `    <category term="${e.kind}"/>`,
      `    <summary>${escapeXml(e.summary)}</summary>`,
      "  </entry>",
    ].join("\n")
  );
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<feed xmlns="${ATOM_NS}">`,
    `  <id>${escapeXml(options.feedUrl)}</id>`,
    `  <title>${escapeXml(options.title)}</title>`,
    `  <updated>${updated}</updated>`,
    `  <link rel="self" type="${ATOM_TYPE}" href="${escapeXml(options.feedUrl)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(resolve("/changes"))}"/>`,
    "  <author><name>Bind</name></author>",
    ...entries,
    "</feed>",
    "",
  ].join("\n");
}

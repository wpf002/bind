import { RESOLVABILITY_LABEL, type InstrumentRole, type Resolution } from "@bind/shared";
import type { CheckCase } from "./check.js";
import type { ShapeGroup } from "./properties.js";

/**
 * The design note: a Check selection as GitHub-flavoured Markdown, for a design review that happens
 * off the site. Pure; the API's GET /check.md feeds it the groups runCheck returns.
 */

export type NoteInstrument = { role: InstrumentRole; shortName: string; provision: string; sourceUrl: string | null };

/** A documented workaround and what it gives up. */
export type NoteWorkaround = { technique: string; residual: string };

/** The slice of a case the note prints. Extends CheckCase so runCheck's groups carry it unchanged. */
export type NoteCase = CheckCase & {
  title: string;
  statement: string;
  resolvedBy: string | null;
  instruments: NoteInstrument[];
  workarounds: NoteWorkaround[];
};

export type DesignNoteInput = {
  /** Display names, not slugs: the note reads as prose. Empty means every one. */
  selection: { properties: string[]; jurisdictions: string[] };
  shapes: ShapeGroup<NoteCase>[];
  release: { version: string; releasedAt: Date | string };
  /** Where the case pages live, with or without a trailing slash. */
  siteUrl: string;
};

export const DESIGN_NOTE_TITLE = "Design Check";
export const DESIGN_NOTE_FILENAME = "bind-design-check.md";
const ANY = "All";
const NO_SHAPE_HEADING = "No Shape";
const CASE_PATH = "/case";

const RESOLUTION_LABEL: Record<Exclude<Resolution, "none">, string> = {
  engineering: "engineering",
  legislative: "legislation",
  judicial: "a court",
  abandonment: "abandonment",
};

/** Characters GFM reads as inline markup. A backslash makes each literal. */
const INLINE_MARKUP = /([\\`*_[\]<>~|])/g;
/** Line openers GFM reads as a block: heading, quote, list item, thematic break, or an ordered item. */
const BLOCK_OPENER = /^(#|>|[-+*]\s|\d+[.)]\s|={3,}|-{3,})/;

/** Text that renders as itself inside a heading, a sentence or a list item. */
export function escapeMarkdown(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(INLINE_MARKUP, "\\$1");
}

/** A paragraph of its own: inline-escaped, and a block opener at its start made literal. */
function escapeParagraph(text: string): string {
  const inline = escapeMarkdown(text);
  return BLOCK_OPENER.test(inline) ? `\\${inline}` : inline;
}

const isoDay = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const list = (values: string[]) => (values.length ? values.map(escapeMarkdown).join(", ") : ANY);

function selectionLine(input: DesignNoteInput): string {
  const { properties, jurisdictions } = input.selection;
  const corpus = `Bind corpus ${escapeMarkdown(input.release.version)}, released ${isoDay(input.release.releasedAt)}.`;
  return `Properties: ${list(properties)}. Jurisdictions: ${list(jurisdictions)}. ${corpus}`;
}

function shapeHeading(group: ShapeGroup<NoteCase>): string {
  return group.shape ? `## ${group.shape.ordinal}. ${escapeMarkdown(group.shape.name)}` : `## ${NO_SHAPE_HEADING}`;
}

const citationLine = (i: NoteInstrument) => {
  const source = i.sourceUrl ? `: ${i.sourceUrl}` : "";
  return `- ${escapeMarkdown(`${i.shortName} ${i.provision}`)}, ${i.role}${source}`;
};

/** A workaround and what it gives up; one with nothing recorded against it is just its technique. */
const workaroundLine = (w: NoteWorkaround) => {
  const residual = escapeMarkdown(w.residual);
  return residual ? `- ${escapeMarkdown(w.technique)}: ${residual}` : `- ${escapeMarkdown(w.technique)}`;
};

function outcomeLine(c: NoteCase, url: string): string {
  const resolvability = RESOLVABILITY_LABEL[c.resolvability];
  const resolved =
    c.resolution === "none"
      ? ""
      : ` Resolved by ${RESOLUTION_LABEL[c.resolution]}${c.resolvedBy ? ` (${escapeMarkdown(c.resolvedBy)})` : ""}.`;
  return `Outcome: ${resolvability}.${resolved} [Case page](${url})`;
}

/** The blocks of one case, each already a self-contained Markdown block. */
function caseBlocks(c: NoteCase, siteUrl: string): string[] {
  const url = `${siteUrl}${CASE_PATH}/${c.slug}`;
  const citations = c.instruments.length ? ["Citations:", c.instruments.map(citationLine).join("\n")] : ["Citations: none recorded."];
  const workarounds = c.workarounds.length ? ["Workarounds:", c.workarounds.map(workaroundLine).join("\n")] : ["Workarounds: none recorded."];
  return [
    `### [${escapeMarkdown(`${c.slug} ${c.title}`)}](${url})`,
    escapeParagraph(c.statement),
    `Jurisdictions: ${list(c.jurisdictions)}.`,
    ...citations,
    ...workarounds,
    outcomeLine(c, url),
  ];
}

/** The note. Blocks are joined by one blank line, so every heading and list renders on GitHub. */
export function designNote(input: DesignNoteInput): string {
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  const blocks = [`# ${DESIGN_NOTE_TITLE}`, selectionLine(input)];
  for (const group of input.shapes) {
    blocks.push(shapeHeading(group));
    for (const c of group.cases) blocks.push(...caseBlocks(c, siteUrl));
  }
  return blocks.join("\n\n") + "\n";
}

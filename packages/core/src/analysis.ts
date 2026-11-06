/** Splits stored case analysis into the argument and the provenance notes the seed appends to it. */

export const REVIEW_NOTE_PREFIX = "Review: ";
export const AMENDMENT_NOTE_PREFIX = "Amended from ";

export type AnalysisNote = { kind: "review" | "amendment"; text: string };

const PARAGRAPH_BREAK = /\n{2,}/;

function toNote(paragraph: string): AnalysisNote | null {
  if (paragraph.startsWith(REVIEW_NOTE_PREFIX)) return { kind: "review", text: paragraph.slice(REVIEW_NOTE_PREFIX.length) };
  if (paragraph.startsWith(AMENDMENT_NOTE_PREFIX)) return { kind: "amendment", text: paragraph };
  return null;
}

export function splitAnalysis(analysis: string | null | undefined): { body: string[]; notes: AnalysisNote[] } {
  const body: string[] = [];
  const notes: AnalysisNote[] = [];
  for (const paragraph of (analysis ?? "").split(PARAGRAPH_BREAK).filter(Boolean)) {
    const note = toNote(paragraph);
    if (note) notes.push(note);
    else body.push(paragraph);
  }
  return { body, notes };
}

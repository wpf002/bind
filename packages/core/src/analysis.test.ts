import { describe, expect, it } from "vitest";
import { AMENDMENT_NOTE_PREFIX, REVIEW_NOTE_PREFIX, splitAnalysis } from "./analysis";

describe("splitAnalysis", () => {
  it("returns nothing for a case without analysis", () => {
    expect(splitAnalysis(null)).toEqual({ body: [], notes: [] });
  });

  it("keeps argument paragraphs in order", () => {
    expect(splitAnalysis("First.\n\nSecond.").body).toEqual(["First.", "Second."]);
  });

  it("moves review and amendment paragraphs out of the argument", () => {
    const amendment = `${AMENDMENT_NOTE_PREFIX}v0.1 by a reviewer.\ntitle: "old" reason`;
    const out = splitAnalysis(`Argument.\n\n${REVIEW_NOTE_PREFIX}Checked the final text.\n\n${amendment}`);
    expect(out.body).toEqual(["Argument."]);
    expect(out.notes).toEqual([
      { kind: "review", text: "Checked the final text." },
      { kind: "amendment", text: amendment },
    ]);
  });
});

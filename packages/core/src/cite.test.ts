import { describe, expect, it } from "vitest";
import { bibtexKey, caseTableTeX, caseToBibTeX, shapeTableTeX, sourceToBibTeX, suggestedCitation } from "./cite";

const accessed = new Date("2026-11-05T00:00:00Z");
const sample = { slug: "bind-0007", title: "E2EE vs. breach notification", updatedAt: "2026-11-01T00:00:00Z" };

describe("citations", () => {
  it("falls back to the registry as author", () => {
    expect(suggestedCitation(sample, accessed)).toBe(
      'Bind Registry, "E2EE vs. breach notification", Bind: A Registry of Legal–Architectural Incompatibilities, case bind-0007 (2026). https://bind.registry/case/bind-0007 (accessed 2026-11-05).'
    );
  });

  it("strips the bind- prefix from BibTeX keys", () => {
    expect(bibtexKey("bind-0007")).toBe("bind:0007");
    expect(caseToBibTeX(sample, accessed)).toContain("@misc{bind:0007,");
  });

  it("marks sources with no retrieval date as unverified", () => {
    const tex = sourceToBibTeX({ label: "WhatsApp v. UoI", url: "https://example.org", verificationStatus: "unverified" }, "k");
    expect(tex).toContain("note         = {unverified}");
    expect(tex).not.toContain("urldate");
  });
});

describe("paper tables", () => {
  it("spans both columns for the shapes table and escapes TeX", () => {
    const tex = shapeTableTeX([{ ordinal: 1, name: "Mandate–Mutation", family: "conflict_of_law", cases: 9, verdict: null }]);
    expect(tex).toContain("\\begin{table*}");
    expect(tex).toContain("1 & Mandate--Mutation & conflict of law & 9 & -- \\\\");
  });

  // Regression: titles longer than 56 chars pushed the corpus table past the page margin.
  it("truncates case titles to 56 characters", () => {
    const title = "x".repeat(80);
    const tex = caseTableTeX([{ slug: "bind-0001", corpusRef: "A1", title, shape: "S", resolvability: "resolvable_costly" }]);
    const row = tex.split("\n").find((l) => l.trim().startsWith("A1"))!;
    const cell = row.split(" & ")[1] ?? "";
    expect(cell).toHaveLength(56);
    expect(cell.endsWith("…")).toBe(true);
    expect(row).toContain("resolvable costly");
  });
});

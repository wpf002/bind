import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { groupByPrimaryShape } from "./properties";
import { designNote, escapeMarkdown, type NoteCase } from "./note";

const erasure = { slug: "erasure", name: "Immutability vs Erasure", ordinal: 1 };
const custody = { slug: "custody", name: "Custody vs Access", ordinal: 2 };

const gdpr = { role: "mandating" as const, shortName: "GDPR", provision: "Art. 17(1)", sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj" };
const mifid = { role: "conflicting" as const, shortName: "MiFID II", provision: "Art. 25(5)", sourceUrl: null };

const ledger: NoteCase = {
  slug: "bind-0001",
  title: "Erasure on a public ledger",
  statement: "Erasure is ordered and the ledger cannot erase.",
  resolvability: "unresolvable",
  resolution: "none",
  resolvedBy: null,
  shapes: [erasure],
  jurisdictions: ["EU"],
  properties: ["append-only"],
  instruments: [gdpr, mifid],
  workarounds: [{ technique: "Tombstoning", residual: "The ciphertext stays, and the order covers it." }],
};

/** Primary shape custody, secondary erasure: appears under custody only. */
const keyless: NoteCase = {
  slug: "bind-0004",
  title: "Erasure order against a keyless operator",
  statement: "Erasure is ordered and the operator cannot read what it must erase.",
  resolvability: "resolvable_costly",
  resolution: "engineering",
  resolvedBy: "Operator redesign",
  shapes: [custody, erasure],
  jurisdictions: ["EU", "US"],
  properties: ["e2ee"],
  instruments: [gdpr],
  workarounds: [],
};

const release = { version: "2026.11", releasedAt: "2026-11-01T00:00:00.000Z" };
const siteUrl = "https://bind.example/";

const note = (cases: NoteCase[], selection = { properties: [] as string[], jurisdictions: [] as string[] }) =>
  designNote({ selection, shapes: groupByPrimaryShape(cases), release, siteUrl });

const headings = (md: string, level: number) => md.split("\n").filter((l) => l.startsWith(`${"#".repeat(level)} `));
const countTags = (html: string, tag: string) => html.split(`<${tag}`).length - 1;

describe("designNote", () => {
  it("renders every shape and names the selection, version and date", () => {
    const md = note([ledger, keyless], { properties: ["Append-Only Integrity"], jurisdictions: ["European Union", "United States"] });
    expect(headings(md, 1)).toEqual(["# Design Check"]);
    expect(headings(md, 2)).toEqual(["## 1. Immutability vs Erasure", "## 2. Custody vs Access"]);
    expect(md).toContain("Properties: Append-Only Integrity. Jurisdictions: European Union, United States. Bind corpus 2026.11, released 2026-11-01.");
  });

  it("writes All for an empty selection and still lists every shape", () => {
    const md = note([ledger, keyless]);
    expect(md).toContain("Properties: All. Jurisdictions: All.");
    expect(headings(md, 2)).toHaveLength(2);
  });

  it("prints a case once, under its primary shape", () => {
    const md = note([ledger, keyless]);
    // H3 link text, H3 URL, outcome URL.
    expect(md.split("bind-0004").length - 1).toBe(3);
    expect(headings(md, 3)).toHaveLength(2);
    const custodyAt = md.indexOf("## 2. Custody vs Access");
    expect(md.indexOf("### [bind-0004")).toBeGreaterThan(custodyAt);
  });

  it("lists citations with role and source, workarounds with what they give up, and the outcome with a link", () => {
    const md = note([ledger]);
    expect(md).toContain("- GDPR Art. 17(1), mandating: https://eur-lex.europa.eu/eli/reg/2016/679/oj");
    expect(md).toContain("- MiFID II Art. 25(5), conflicting\n");
    expect(md).toContain("- Tombstoning: The ciphertext stays, and the order covers it.");
    expect(md).toContain("Outcome: Unresolvable. [Case page](https://bind.example/case/bind-0001)");
  });

  it("names the resolution and who resolved it, and says when nothing is recorded", () => {
    const md = note([keyless]);
    expect(md).toContain("Outcome: Resolvable, Costly. Resolved by engineering (Operator redesign). [Case page](https://bind.example/case/bind-0004)");
    expect(md).toContain("Workarounds: none recorded.");
  });

  it("ends with one newline and has no whitespace-only line", () => {
    const md = note([ledger, keyless]);
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
    expect(md.split("\n").filter((l) => l.length && !l.trim())).toEqual([]);
  });

  it("escapes markup in titles so it renders as text", () => {
    const hostile = { ...ledger, title: "Erasure <b>on</b> a *public* [ledger](x) `now` | 100% #1" };
    const md = note([hostile]);
    expect(md).toContain("### [bind-0001 Erasure \\<b\\>on\\</b\\> a \\*public\\* \\[ledger\\](x) \\`now\\` \\| 100% #1]");
    const html = marked.parse(md, { async: false });
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<em>");
    expect(html).not.toContain("<code>");
    expect(countTags(html, "a ")).toBe(3);
  });

  it("keeps a statement that opens like a heading or list as a paragraph", () => {
    const md = note([{ ...ledger, statement: "# not a heading\n- not a list" }]);
    expect(md).toContain("\n\\# not a heading - not a list\n");
    const html = marked.parse(md, { async: false });
    expect(countTags(html, "h1")).toBe(1);
    expect(countTags(html, "ul")).toBe(2);
  });
});

describe("designNote as GitHub renders it", () => {
  it("renders the headings, lists and links the note declares, with no table or raw HTML", () => {
    const md = note([ledger, keyless]);
    const html = marked.parse(md, { async: false, gfm: true });
    expect(countTags(html, "h1")).toBe(1);
    expect(countTags(html, "h2")).toBe(2);
    expect(countTags(html, "h3")).toBe(2);
    // Two H3 links, two outcome links, two bare source URLs autolinked: GDPR cited twice.
    expect(countTags(html, "a ")).toBe(6);
    expect(countTags(html, "ul")).toBe(3);
    expect(html).not.toContain("<table");
    expect(md).not.toMatch(/<[a-z]/);
  });
});

describe("escapeMarkdown", () => {
  it("collapses whitespace and escapes inline markup", () => {
    expect(escapeMarkdown("  a\n\tb  ")).toBe("a b");
    expect(escapeMarkdown("x_y*z~w|v\\u")).toBe("x\\_y\\*z\\~w\\|v\\\\u");
  });
});

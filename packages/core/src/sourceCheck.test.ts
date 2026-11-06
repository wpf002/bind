import { describe, expect, it } from "vitest";
import { QUOTE_NEVER_FOUND, checkQuote, countSourceChecks, htmlToText, normaliseSourceText, quoteAppearsIn, quoteSegments } from "./sourceCheck";

const ART_17 = "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay";

describe("normaliseSourceText", () => {
  it("folds quote marks, dashes and whitespace", () => {
    expect(normaliseSourceText("“legitimate  and\nobjective” factors — the ‘right’")).toBe("'legitimateandobjective'factors-the'right'");
  });

  it("drops soft hyphens and zero-width characters", () => {
    expect(normaliseSourceText("infor­ma​tion")).toBe("information");
  });

  it("treats a non-breaking space as whitespace", () => {
    expect(normaliseSourceText("Article 17")).toBe("Article17");
  });

  it("keeps letter case, digits and punctuation", () => {
    expect(normaliseSourceText("Art. 5(6)")).not.toBe(normaliseSourceText("art. 5(7)"));
  });
});

describe("quoteSegments", () => {
  it("splits on ellipses in either form", () => {
    expect(quoteSegments("first part ... second part … third")).toEqual(["firstpart", "secondpart", "third"]);
  });

  it("drops editorial text in square brackets", () => {
    expect(quoteSegments("affects him or her. [Recital 71:] the data subject [...] should have the right")).toEqual([
      "affectshimorher.",
      "thedatasubject",
      "shouldhavetheright",
    ]);
  });

  it("returns nothing for a quote with no source text", () => {
    expect(quoteSegments("  ... [note] ")).toEqual([]);
  });
});

describe("quoteAppearsIn", () => {
  it("finds a quote across line breaks and typographic quote marks", () => {
    const text = `1. The data subject shall have the right to obtain\n   from the controller the erasure of personal data\n   concerning him or her without undue delay and`;
    expect(quoteAppearsIn(ART_17, text)).toBe(true);
  });

  it("misses a quote when a word in the source changed", () => {
    expect(quoteAppearsIn(ART_17, ART_17.replace("without undue delay", "within one month"))).toBe(false);
  });

  it("needs every segment", () => {
    const quote = "providers may process special categories ... subject to appropriate safeguards";
    expect(quoteAppearsIn(quote, "providers may process special categories of personal data, subject to appropriate safeguards")).toBe(true);
    expect(quoteAppearsIn(quote, "providers may process special categories of personal data")).toBe(false);
  });

  it("accepts segments quoted from provisions in a different order than the document", () => {
    const quote = "[Art. 22(1):] not to be subject to a decision [Recital 71:] should have the right";
    expect(quoteAppearsIn(quote, "(71) The data subject should have the right ... Article 22 1. not to be subject to a decision")).toBe(true);
  });
});

describe("checkQuote", () => {
  it("is current when the quote is still in the source", () => {
    expect(checkQuote(ART_17, { ok: true, text: `Article 17 ${ART_17}.` }, false)).toEqual({ status: "current" });
  });

  it("is changed when a quote that was found before is gone", () => {
    expect(checkQuote(ART_17, { ok: true, text: "Article 17 (deleted)" }, true)).toEqual({ status: "changed" });
  });

  it("is unreachable when the quote is missing and was never found at the URL", () => {
    expect(checkQuote(ART_17, { ok: true, text: "Case Number: Year: Search" }, false)).toEqual({ status: "unreachable", detail: QUOTE_NEVER_FOUND });
  });

  it("is unreachable, not changed, when the fetch failed", () => {
    expect(checkQuote(ART_17, { ok: false, reason: "HTTP 503" }, true)).toEqual({ status: "unreachable", detail: "HTTP 503" });
  });

  it("rejects an empty quote", () => {
    expect(() => checkQuote(" ", { ok: true, text: "anything" }, false)).toThrow();
  });
});

describe("htmlToText", () => {
  it("drops tags, scripts, styles and comments", () => {
    const html = `<html><head><style>p{color:red}</style><script>var erasure = 1;</script></head><body><!-- erasure --><p>right to <i>erasure</i></p></body></html>`;
    const text = htmlToText(html);
    expect(quoteAppearsIn("right to erasure", text)).toBe(true);
    expect(text).not.toContain("color");
    expect(text).not.toContain("var");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("Art.&nbsp;17 &amp; &#8220;erasure&#x201D; &sect;1")).toBe("Art. 17 & “erasure” §1");
  });

  it("leaves unknown entities as written", () => {
    expect(htmlToText("&notanentity;")).toBe("&notanentity;");
  });
});

describe("countSourceChecks", () => {
  it("counts each status and skips citations never checked", () => {
    expect(countSourceChecks(["current", "changed", null, "current", "unreachable", undefined])).toEqual({ current: 2, changed: 1, unreachable: 1 });
  });
});

import { describe, expect, it } from "vitest";
import { ARCHIVE_LACKS_QUOTE, QUOTE_NEVER_FOUND, READ_FROM_ARCHIVE, archiveCaptureOf, checkQuote, combineSources, countSourceChecks, htmlToText, jsonToText, normaliseSourceText, quoteAppearsIn, quoteSegments } from "./sourceCheck";

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

  it("is blocked, not unreachable, when the publisher refuses scripts", () => {
    expect(checkQuote(ART_17, { ok: false, reason: "HTTP 403", blocked: true }, false)).toEqual({ status: "blocked", detail: "HTTP 403" });
  });

  it("is blocked, not changed, when a source that was read before now refuses scripts", () => {
    expect(checkQuote(ART_17, { ok: false, reason: "HTTP 403", blocked: true }, true)).toEqual({ status: "blocked", detail: "HTTP 403" });
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

describe("combineSources", () => {
  const quote = "[Art. 40:] shall store personal information domestically [Art. 37:] shall store it within mainland China";

  it("finds a quote whose passages come from two documents", () => {
    const first = { ok: true as const, text: "Article 40 handlers shall store personal information domestically." };
    const second = { ok: true as const, text: "Article 37 operators shall store it within mainland China." };
    expect(checkQuote(quote, first, false).status).toBe("unreachable");
    expect(checkQuote(quote, combineSources([first, second]), false)).toEqual({ status: "current" });
  });

  it("fails as a whole when one document fails", () => {
    const blocked = { ok: false as const, reason: "HTTP 403", blocked: true };
    expect(combineSources([{ ok: true, text: "Article 40" }, blocked])).toEqual(blocked);
  });

  it("rejects an empty list", () => {
    expect(() => combineSources([])).toThrow();
  });
});

describe("archive captures", () => {
  const sourceUrl = "https://example.gov/code?section=56.101";
  const capturedAt = "2026-01-02T19:57:01.000Z";
  const availability = (closest?: object) => JSON.stringify({ url: sourceUrl, archived_snapshots: closest ? { closest } : {} });

  it("reads the capture time and the raw capture URL from the availability API", () => {
    const json = availability({ status: "200", available: true, url: "http://web.archive.org/web/20260102195701/x", timestamp: "20260102195701" });
    expect(archiveCaptureOf(sourceUrl, json)).toEqual({ url: `https://web.archive.org/web/20260102195701id_/${sourceUrl}`, capturedAt });
  });

  it("has no capture when the archive holds none or holds a failed response", () => {
    expect(archiveCaptureOf(sourceUrl, availability())).toBeNull();
    expect(archiveCaptureOf(sourceUrl, availability({ status: "403", available: true, timestamp: "20260102195701" }))).toBeNull();
  });

  it("throws on a response that isn't the availability API's", () => {
    expect(() => archiveCaptureOf(sourceUrl, "{}")).toThrow();
    expect(() => archiveCaptureOf(sourceUrl, "<html>")).toThrow();
  });

  it("counts a quote found in a capture as current and says where it was read", () => {
    expect(checkQuote("shall segregate", { ok: true, text: "A business shall segregate records.", capturedAt }, false)).toEqual({ status: "current", detail: READ_FROM_ARCHIVE });
  });

  it("keeps the source blocked when the capture lacks the quote, even if found before", () => {
    expect(checkQuote("shall segregate", { ok: true, text: "Just a moment...", capturedAt }, true)).toEqual({ status: "blocked", detail: ARCHIVE_LACKS_QUOTE });
  });

  it("dates combined sources by the oldest capture", () => {
    const combined = combineSources([{ ok: true, text: "a", capturedAt: "2026-10-17T14:32:33.000Z" }, { ok: true, text: "b" }, { ok: true, text: "c", capturedAt }]);
    expect(combined).toEqual({ ok: true, text: "a\nb\nc", capturedAt });
  });
});

describe("jsonToText", () => {
  it("returns string values at any depth with their HTML reduced to text", () => {
    const json = JSON.stringify({ Items: [{ Value: "<p>A notice can be issued only where &#8220;technically feasible&#8221;</p>", Id: 7 }], Title: "Online Safety Bill" });
    const text = jsonToText(json);
    expect(quoteAppearsIn("A notice can be issued only where \"technically feasible\"", text)).toBe(true);
    expect(text).toContain("Online Safety Bill");
    expect(text).not.toContain("<p>");
  });

  it("throws on invalid JSON", () => {
    expect(() => jsonToText("<html>")).toThrow();
  });
});

describe("countSourceChecks", () => {
  it("counts each status and skips citations never checked", () => {
    expect(countSourceChecks(["current", "changed", null, "current", "unreachable", "blocked", undefined])).toEqual({ current: 2, changed: 1, blocked: 1, unreachable: 1 });
  });
});

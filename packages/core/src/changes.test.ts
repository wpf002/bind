import { describe, expect, it } from "vitest";
import { atomFeed, changeEvents, type ChangeCase, type ChangeInput, type ChangeSourceCheck } from "./changes";
import { resolvedState } from "./resolutions";
import { checkQuote, sourceCheckLedgerSchema, type SourceCheckEntry } from "./sourceCheck";

const published: ChangeCase = {
  slug: "bind-0001",
  title: "Erasure on a public ledger",
  statement: "Erasure is ordered and the ledger cannot erase.",
  status: "published",
  publishedAt: new Date("2025-06-01T09:00:00Z"),
  transitions: [
    { fromState: "open", toState: "contested", trigger: "Regulator opinion", occurredAt: new Date("2024-03-01") },
    { fromState: "contested", toState: resolvedState("legislative"), trigger: "Amendment in force", occurredAt: new Date("2025-09-15") },
  ],
};

const draft: ChangeCase = {
  slug: "bind-0002",
  title: "Held draft on key escrow",
  statement: "Escrow is ordered and the protocol holds no keys.",
  status: "draft",
  publishedAt: new Date("2025-07-01"),
  transitions: [{ fromState: "open", toState: resolvedState("judicial"), trigger: "Draft trigger", occurredAt: new Date("2025-10-01") }],
};

const citing = { slug: published.slug, title: published.title, status: "published" };

const flagged: ChangeSourceCheck = {
  url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  label: "GDPR Art. 17(1)",
  status: "changed",
  checkedAt: "2025-11-02T06:00:00.000Z",
  case: citing,
};

const input: ChangeInput = { cases: [published, draft], sourceChecks: [flagged, { ...flagged, label: "Current one", status: "current" }] };

describe("changeEvents", () => {
  const events = changeEvents(input);

  it("orders newest first", () => {
    expect(events.map((e) => e.kind)).toEqual(["source_changed", "case_resolved", "case_published", "case_transition"]);
    expect(events.map((e) => e.occurredAt)).toEqual([...events.map((e) => e.occurredAt)].sort().reverse());
  });

  it("gives every event a stable id built from kind, slug and date", () => {
    expect(events.map((e) => e.id)).toEqual([
      "source_changed:bind-0001:2025-11-02T06:00:00.000Z:gdpr-art-17-1",
      "case_resolved:bind-0001:2025-09-15T00:00:00.000Z:resolved_legislative",
      "case_published:bind-0001:2025-06-01T09:00:00.000Z",
      "case_transition:bind-0001:2024-03-01T00:00:00.000Z:contested",
    ]);
    expect(changeEvents(input)).toEqual(events);
  });

  it("leaves held cases out, including their publish date, transitions and sources", () => {
    expect(events.every((e) => e.url === "/case/bind-0001")).toBe(true);
    const heldSource = changeEvents({ cases: [draft], sourceChecks: [{ ...flagged, case: { ...citing, slug: draft.slug, status: "draft" } }] });
    expect(heldSource).toEqual([]);
  });

  it("reports only sources whose check failed", () => {
    expect(events.filter((e) => e.kind === "source_changed")).toHaveLength(1);
    expect(events[0]).toMatchObject({ title: "Source changed: GDPR Art. 17(1)", summary: expect.stringContaining("no longer at its source") });
  });

  it("skips a case that was never published", () => {
    expect(changeEvents({ cases: [{ ...published, publishedAt: null }], sourceChecks: [] }).map((e) => e.kind)).toEqual(["case_resolved", "case_transition"]);
  });
});

describe("a quote that left its source", () => {
  const target = { url: flagged.url, quote: "the right to obtain from the controller the erasure", label: flagged.label };
  const checkedAt = "2025-11-03T06:00:00.000Z";

  /** The entry check-sources writes when the quote was found before and is gone now. */
  const entry: SourceCheckEntry = { ...target, ...checkQuote(target.quote, { ok: true, text: "Article 17 was repealed." }, true), checkedAt, foundAt: "2025-10-01T06:00:00.000Z" };
  const ledger = sourceCheckLedgerSchema.parse(JSON.parse(JSON.stringify({ checks: [entry] })));

  it("is written as changed", () => expect(ledger.checks[0]?.status).toBe("changed"));

  it("surfaces as one source_changed event dated by the check", () => {
    const events = changeEvents({ cases: [published], sourceChecks: ledger.checks.map((c) => ({ ...c, case: citing })) });
    expect(events.filter((e) => e.kind === "source_changed")).toEqual([
      expect.objectContaining({ id: `source_changed:bind-0001:${checkedAt}:gdpr-art-17-1`, occurredAt: checkedAt, url: "/case/bind-0001" }),
    ]);
  });

  it("does not surface while the quote is still found", () => {
    const current: SourceCheckEntry = { ...target, ...checkQuote(target.quote, { ok: true, text: `… ${target.quote} …` }, true), checkedAt, foundAt: checkedAt };
    expect(changeEvents({ cases: [published], sourceChecks: [{ ...current, case: citing }] }).filter((e) => e.kind === "source_changed")).toEqual([]);
  });
});

describe("atomFeed", () => {
  const options = { siteUrl: "https://bind.example", feedUrl: "https://api.bind.example/changes.atom", title: "Bind Changes", generatedAt: new Date("2025-12-01") };
  const events = changeEvents(input);
  const xml = atomFeed(events, options);

  it("declares the Atom namespace, id, title, self link and updated", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">')).toBe(true);
    expect(xml).toContain("<id>https://api.bind.example/changes.atom</id>");
    expect(xml).toContain("<title>Bind Changes</title>");
    expect(xml).toContain(`<updated>${events[0]?.occurredAt}</updated>`);
    expect(xml).toContain('<link rel="self" type="application/atom+xml" href="https://api.bind.example/changes.atom"/>');
  });

  it("writes one entry per event with an absolute link and a URN id", () => {
    expect(xml.match(/<entry>/g)).toHaveLength(events.length);
    expect(xml).toContain(`<id>urn:bind:change:${events[0]?.id}</id>`);
    expect(xml).toContain('<link rel="alternate" type="text/html" href="https://bind.example/case/bind-0001"/>');
  });

  it("escapes markup in text", () => {
    const hostile = [{ ...events[0]!, title: 'A <b>"bold"</b> & bad title' }];
    expect(atomFeed(hostile, options)).toContain("<title>A &lt;b&gt;&quot;bold&quot;&lt;/b&gt; &amp; bad title</title>");
  });

  it("falls back to the generation time when there are no events", () => {
    expect(atomFeed([], options)).toContain("<updated>2025-12-01T00:00:00.000Z</updated>");
  });
});

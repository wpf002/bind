import { describe, expect, it } from "vitest";
import {
  EMPTY_CHECK_SELECTION,
  checkHref,
  checkQuerySchema,
  matchesCheck,
  resolveCheckSelection,
  runCheck,
  toggleCheck,
  type CheckCase,
} from "./check";

const erasure = { slug: "erasure", name: "Erasure", ordinal: 1 };
const sovereign = { slug: "sovereign", name: "Sovereign", ordinal: 2 };

const cases: CheckCase[] = [
  { slug: "bind-0001", resolvability: "unresolvable", resolution: "none", shapes: [erasure], jurisdictions: ["EU"], properties: ["append-only"] },
  { slug: "bind-0002", resolvability: "tech_gap", resolution: "none", shapes: [sovereign], jurisdictions: ["US"], properties: ["e2ee"] },
  { slug: "bind-0003", resolvability: "unresolvable", resolution: "engineering", shapes: [sovereign, erasure], jurisdictions: ["EU", "US"], properties: ["append-only", "e2ee"] },
];

const known = { properties: ["append-only", "e2ee", "residency"], jurisdictions: ["EU", "UK", "US"] };

describe("checkQuerySchema", () => {
  it("reads a comma list", () => expect(checkQuerySchema.parse({ p: "a,b", j: "EU" })).toEqual({ p: ["a", "b"], j: ["EU"] }));
  it("reads a repeated key", () => expect(checkQuerySchema.parse({ p: ["a", "b,c"] }).p).toEqual(["a", "b", "c"]));
  it("drops blanks", () => expect(checkQuerySchema.parse({ p: " , a, ", j: "" })).toEqual({ p: ["a"], j: [] }));
  it("reads nothing as empty", () => expect(checkQuerySchema.parse({})).toEqual({ p: [], j: [] }));
  it("refuses a non-string", () => expect(checkQuerySchema.safeParse({ p: { a: 1 } }).success).toBe(false));
});

describe("resolveCheckSelection", () => {
  it("keeps known values in corpus order", () =>
    expect(resolveCheckSelection({ p: ["e2ee", "append-only"], j: ["US", "EU"] }, known)).toEqual({
      properties: ["append-only", "e2ee"],
      jurisdictions: ["EU", "US"],
    }));
  it("ignores unknown values", () =>
    expect(resolveCheckSelection({ p: ["nope"], j: ["ZZ"] }, known)).toEqual(EMPTY_CHECK_SELECTION));
  it("upper-cases jurisdiction codes", () => expect(resolveCheckSelection({ p: [], j: ["eu"] }, known).jurisdictions).toEqual(["EU"]));
});

describe("matchesCheck", () => {
  it("matches everything with no selection", () => expect(cases.every((c) => matchesCheck(c, EMPTY_CHECK_SELECTION))).toBe(true));
  it("needs any selected property", () =>
    expect(cases.filter((c) => matchesCheck(c, { properties: ["e2ee"], jurisdictions: [] })).map((c) => c.slug)).toEqual(["bind-0002", "bind-0003"]));
  it("needs any selected jurisdiction", () =>
    expect(cases.filter((c) => matchesCheck(c, { properties: [], jurisdictions: ["EU"] })).map((c) => c.slug)).toEqual(["bind-0001", "bind-0003"]));
  it("needs both when both are picked", () =>
    expect(cases.filter((c) => matchesCheck(c, { properties: ["append-only"], jurisdictions: ["US"] })).map((c) => c.slug)).toEqual(["bind-0003"]));
  it("ors within a dimension", () =>
    expect(cases.filter((c) => matchesCheck(c, { properties: ["append-only", "e2ee"], jurisdictions: ["UK"] }))).toEqual([]));
});

describe("runCheck", () => {
  it("groups matches by primary shape in shape order", () => {
    const g = runCheck(cases, EMPTY_CHECK_SELECTION);
    expect(g.map((x) => x.shape?.slug)).toEqual(["erasure", "sovereign"]);
    expect(g[1]?.cases.map((c) => c.slug)).toEqual(["bind-0002", "bind-0003"]);
  });
  it("drops shapes with no match", () =>
    expect(runCheck(cases, { properties: ["append-only"], jurisdictions: ["US"] }).map((x) => x.shape?.slug)).toEqual(["sovereign"]));
  it("returns no groups for no match", () => expect(runCheck(cases, { properties: ["residency"], jurisdictions: [] })).toEqual([]));
});

describe("checkHref", () => {
  it("is the bare page with no selection", () => expect(checkHref(EMPTY_CHECK_SELECTION)).toBe("/check"));
  it("joins each list with commas", () =>
    expect(checkHref({ properties: ["a", "b"], jurisdictions: ["EU"] })).toBe("/check?p=a,b&j=EU"));
  it("omits an empty dimension", () => expect(checkHref({ properties: [], jurisdictions: ["EU", "US"] })).toBe("/check?j=EU,US"));
  it("round-trips through the schema", () => {
    const selection = { properties: ["append-only", "e2ee"], jurisdictions: ["EU"] };
    const query = Object.fromEntries(new URL(checkHref(selection), "http://x").searchParams);
    expect(resolveCheckSelection(checkQuerySchema.parse(query), known)).toEqual(selection);
  });
});

describe("toggleCheck", () => {
  it("adds a value", () => expect(toggleCheck(EMPTY_CHECK_SELECTION, "jurisdictions", "EU").jurisdictions).toEqual(["EU"]));
  it("removes a picked value", () =>
    expect(toggleCheck({ properties: ["a", "b"], jurisdictions: [] }, "properties", "a").properties).toEqual(["b"]));
  it("leaves the other dimension alone", () =>
    expect(toggleCheck({ properties: ["a"], jurisdictions: ["EU"] }, "jurisdictions", "US")).toEqual({ properties: ["a"], jurisdictions: ["EU", "US"] }));
});

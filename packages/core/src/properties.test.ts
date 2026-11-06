import { describe, expect, it } from "vitest";
import { groupByPrimaryShape, summariseProperty, type PropertyCase } from "./properties";

const erasure = { slug: "erasure", name: "Erasure", ordinal: 1 };
const sovereign = { slug: "sovereign", name: "Sovereign", ordinal: 2 };

const cases: PropertyCase[] = [
  { slug: "bind-0003", resolvability: "unresolvable", resolution: "none", shapes: [sovereign], jurisdictions: ["US", "EU"] },
  { slug: "bind-0001", resolvability: "unresolvable", resolution: "engineering", shapes: [erasure, sovereign], jurisdictions: ["EU"] },
  { slug: "bind-0002", resolvability: "tech_gap", resolution: "none", shapes: [], jurisdictions: [] },
];

describe("summariseProperty", () => {
  const s = summariseProperty(cases);
  it("counts cases", () => expect(s.cases).toBe(3));
  it("lists each shape once, in ordinal order", () => expect(s.shapes.map((x) => x.slug)).toEqual(["erasure", "sovereign"]));
  it("lists jurisdictions once, sorted", () => expect(s.jurisdictions).toEqual(["EU", "US"]));
  it("flags a resolved case", () => expect(s.resolved).toBe(true));
  it("flags none resolved", () => expect(summariseProperty(cases.filter((c) => c.resolution === "none")).resolved).toBe(false));
  it("splits by resolvability", () => expect(s.byResolvability).toEqual({ unresolvable: 2, resolvable_costly: 0, tech_gap: 1 }));
  it("handles no cases", () => expect(summariseProperty([])).toMatchObject({ cases: 0, shapes: [], jurisdictions: [], resolved: false }));
});

describe("groupByPrimaryShape", () => {
  const g = groupByPrimaryShape(cases);
  it("orders groups by shape ordinal", () => expect(g.map((x) => x.shape?.slug ?? null)).toEqual(["erasure", "sovereign", null]));
  it("uses the primary shape only", () => expect(g[1]?.cases.map((c) => c.slug)).toEqual(["bind-0003"]));
  it("omits the unshaped group when every case has a shape", () =>
    expect(groupByPrimaryShape(cases.slice(0, 2)).map((x) => x.shape?.slug)).toEqual(["erasure", "sovereign"]));
});

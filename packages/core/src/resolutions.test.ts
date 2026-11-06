import { describe, expect, it } from "vitest";
import { RESOLUTION_MECHANISMS, resolutionsByYear, resolvedAtFrom, resolvedState, type ResolvedCase } from "./resolutions";

const on = (resolution: ResolvedCase["resolution"], date: string): ResolvedCase => ({ resolution, resolvedAt: new Date(date) });

describe("RESOLUTION_MECHANISMS", () => {
  it("leaves out none", () => expect(RESOLUTION_MECHANISMS).toEqual(["engineering", "legislative", "judicial", "abandonment"]));
});

describe("resolvedAtFrom", () => {
  it("returns the date of the transition into the resolved state", () => {
    const at = resolvedAtFrom([{ to: resolvedState("judicial"), at: "2024-11-26" }], "judicial");
    expect(at?.toISOString().slice(0, 10)).toBe("2024-11-26");
  });
  it("takes the latest when a case was resolved more than once", () => {
    const transitions = [
      { to: resolvedState("legislative"), at: "2022-10-19" },
      { to: "unresolvable", at: "2023-01-01" },
      { to: resolvedState("legislative"), at: "2024-04-11" },
    ];
    expect(resolvedAtFrom(transitions, "legislative")?.toISOString().slice(0, 10)).toBe("2024-04-11");
  });
  it("ignores transitions into another mechanism", () => {
    expect(resolvedAtFrom([{ to: resolvedState("judicial"), at: "2024-11-26" }], "legislative")).toBeNull();
  });
});

describe("resolutionsByYear", () => {
  const cases = [on("legislative", "2022-10-19"), on("abandonment", "2022-06-02"), on("legislative", "2024-04-11"), on("judicial", "2024-11-26")];
  const series = resolutionsByYear(cases, 2025);

  it("runs from the first resolution year through the given year with no gaps", () => {
    expect(series.map((y) => y.year)).toEqual([2022, 2023, 2024, 2025]);
  });
  it("counts what each year added", () => {
    expect(series[0]?.added).toEqual({ engineering: 0, legislative: 1, judicial: 0, abandonment: 1 });
    expect(series[1]?.added).toEqual({ engineering: 0, legislative: 0, judicial: 0, abandonment: 0 });
  });
  it("carries the running total forward", () => {
    expect(series[3]?.cumulative).toEqual({ engineering: 0, legislative: 2, judicial: 1, abandonment: 1 });
  });
  it("uses the UTC year at a year boundary", () => {
    expect(resolutionsByYear([on("judicial", "2024-12-31T23:30:00Z")], 2024)[0]?.added.judicial).toBe(1);
  });
  it("returns nothing when no case is resolved", () => expect(resolutionsByYear([], 2026)).toEqual([]));
});

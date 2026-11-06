import { describe, expect, it } from "vitest";
import { parseCaseSort, sortCases, type SortableCase } from "./sort";

const rows: SortableCase[] = [
  { sortKey: 1, title: "Beta", shapeOrdinal: 2, sourceCount: 3 },
  { sortKey: 2, title: "Alpha", shapeOrdinal: null, sourceCount: 5 },
  { sortKey: 3, title: "Gamma", shapeOrdinal: 1, sourceCount: 3 },
];
const order = (sort: Parameters<typeof sortCases>[1]) => sortCases(rows, sort, (r) => r).map((r) => r.sortKey);

describe("sortCases", () => {
  it("keeps registry order by default", () => expect(order("id")).toEqual([1, 2, 3]));
  it("sorts by title", () => expect(order("title")).toEqual([2, 1, 3]));
  it("puts unassigned cases last when sorting by shape", () => expect(order("shape")).toEqual([3, 1, 2]));
  it("sorts by most sources and breaks ties in registry order", () => expect(order("sources")).toEqual([2, 1, 3]));
  it("does not reorder the input", () => {
    order("title");
    expect(rows.map((r) => r.sortKey)).toEqual([1, 2, 3]);
  });
});

describe("parseCaseSort", () => {
  it("falls back to registry order for unknown values", () => {
    expect(parseCaseSort("nope")).toBe("id");
    expect(parseCaseSort(undefined)).toBe("id");
    expect(parseCaseSort("sources")).toBe("sources");
  });
});

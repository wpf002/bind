/** Orderings for the cases table. The registry order is the default. */

export const CASE_SORTS = ["id", "title", "shape", "sources"] as const;
export type CaseSort = (typeof CASE_SORTS)[number];
export const DEFAULT_CASE_SORT: CaseSort = "id";

export type SortableCase = { sortKey: number; title: string; shapeOrdinal: number | null; sourceCount: number };

const comparators: Record<CaseSort, (a: SortableCase, b: SortableCase) => number> = {
  id: (a, b) => a.sortKey - b.sortKey,
  title: (a, b) => a.title.localeCompare(b.title, "en"),
  // Cases with no shape sort last.
  shape: (a, b) => (a.shapeOrdinal ?? Infinity) - (b.shapeOrdinal ?? Infinity),
  sources: (a, b) => b.sourceCount - a.sourceCount,
};

export function parseCaseSort(value: string | undefined): CaseSort {
  return CASE_SORTS.find((s) => s === value) ?? DEFAULT_CASE_SORT;
}

/** Stable: ties fall back to registry order. */
export function sortCases<T>(rows: T[], sort: CaseSort, key: (row: T) => SortableCase): T[] {
  const keyed = rows.map((row) => ({ row, k: key(row) }));
  keyed.sort((a, b) => comparators[sort](a.k, b.k) || comparators.id(a.k, b.k));
  return keyed.map((x) => x.row);
}

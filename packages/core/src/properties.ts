import { RESOLVABILITY, type Resolvability, type Resolution } from "@bind/shared";

/** The slice of a case a property page needs. */
export type PropertyCase = {
  slug: string;
  resolvability: Resolvability;
  resolution: Resolution;
  shapes: { slug: string; name: string; ordinal: number }[];
  jurisdictions: string[];
};

export type PropertyShape = { slug: string; name: string; ordinal: number };

/** Rolls a property's cases up into what the index shows: count, shapes, jurisdictions, whether any resolved. */
export function summariseProperty<T extends PropertyCase>(cases: T[]) {
  const shapes = new Map<string, PropertyShape>();
  const jurisdictions = new Set<string>();
  for (const c of cases) {
    for (const s of c.shapes) shapes.set(s.slug, s);
    for (const j of c.jurisdictions) jurisdictions.add(j);
  }
  return {
    cases: cases.length,
    shapes: [...shapes.values()].sort((a, b) => a.ordinal - b.ordinal),
    jurisdictions: [...jurisdictions].sort(),
    resolved: cases.some((c) => c.resolution !== "none"),
    byResolvability: Object.fromEntries(RESOLVABILITY.map((r) => [r, cases.filter((c) => c.resolvability === r).length])) as Record<Resolvability, number>,
  };
}

export type ShapeGroup<T> = { shape: PropertyShape | null; cases: T[] };

/** Groups cases by primary shape, in shape order. Cases with no shape form a final group with shape null. */
export function groupByPrimaryShape<T extends PropertyCase>(cases: T[]): ShapeGroup<T>[] {
  const groups = new Map<string, ShapeGroup<T>>();
  const unshaped: T[] = [];
  for (const c of cases) {
    const primary = c.shapes[0];
    if (!primary) {
      unshaped.push(c);
      continue;
    }
    const g = groups.get(primary.slug) ?? { shape: primary, cases: [] };
    g.cases.push(c);
    groups.set(primary.slug, g);
  }
  const ordered = [...groups.values()].sort((a, b) => (a.shape?.ordinal ?? 0) - (b.shape?.ordinal ?? 0));
  return unshaped.length ? [...ordered, { shape: null, cases: unshaped }] : ordered;
}

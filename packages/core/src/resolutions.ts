import { RESOLUTION, type Resolution } from "@bind/shared";

/** A way a case stopped being live. `none` isn't one. */
export type ResolutionMechanism = Exclude<Resolution, "none">;

export const RESOLUTION_MECHANISMS = RESOLUTION.filter((r): r is ResolutionMechanism => r !== "none");

const RESOLVED_STATE_PREFIX = "resolved_";

/** True for the state a resolving transition moves into. */
export const isResolvedState = (state: string) => state.startsWith(RESOLVED_STATE_PREFIX);

/** The transition state a case moves to when a mechanism resolves it. */
export const resolvedState = (mechanism: ResolutionMechanism) => `${RESOLVED_STATE_PREFIX}${mechanism}`;

type DatedTransition = { to: string; at: string };

/** The date a case was resolved: its latest transition into the resolved state for its mechanism. */
export function resolvedAtFrom(transitions: DatedTransition[], mechanism: ResolutionMechanism): Date | null {
  const dates = transitions.filter((t) => t.to === resolvedState(mechanism)).map((t) => new Date(t.at));
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export type ResolvedCase = { resolution: ResolutionMechanism; resolvedAt: Date };
export type MechanismCounts = Record<ResolutionMechanism, number>;
export type ResolutionYear = { year: number; added: MechanismCounts; cumulative: MechanismCounts };

const zeroCounts = (): MechanismCounts =>
  Object.fromEntries(RESOLUTION_MECHANISMS.map((m) => [m, 0])) as MechanismCounts;

/**
 * Resolutions per mechanism for each year from the first resolution through `throughYear`.
 * Years with no resolution are kept so the series has no gaps.
 */
export function resolutionsByYear(cases: ResolvedCase[], throughYear: number): ResolutionYear[] {
  if (!cases.length) return [];
  const firstYear = Math.min(...cases.map((c) => c.resolvedAt.getUTCFullYear()));
  const cumulative = zeroCounts();
  const series: ResolutionYear[] = [];
  for (let year = firstYear; year <= throughYear; year++) {
    const added = zeroCounts();
    for (const c of cases) if (c.resolvedAt.getUTCFullYear() === year) added[c.resolution]++;
    for (const m of RESOLUTION_MECHANISMS) cumulative[m] += added[m];
    series.push({ year, added, cumulative: { ...cumulative } });
  }
  return series;
}

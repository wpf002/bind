/**
 * Corpus versions are `YYYY.MM`, the month of the release. A second release in the same month is
 * `YYYY.MM.2`, a third `YYYY.MM.3`, so a version sorts by date and never needs a semver judgement.
 */

const MONTH_WIDTH = 2;

/** `2026.11` for any day in November 2026, in UTC. */
export function versionMonth(date: Date): string {
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(MONTH_WIDTH, "0")}`;
}

/** True when `version` is `month` or `month.N`. */
const inMonth = (version: string, month: string) => version === month || version.startsWith(`${month}.`);

/** The version a release made `today` gets, given every release so far. Pure. */
export function nextVersion(releases: readonly { version: string }[], today: Date): string {
  const month = versionMonth(today);
  const earlierThisMonth = releases.filter((r) => inMonth(r.version, month)).length;
  if (earlierThisMonth === 0) return month;
  // The first release in a month is bare, so the second is `.2`: one more than the count so far.
  return `${month}.${earlierThisMonth + 1}`;
}

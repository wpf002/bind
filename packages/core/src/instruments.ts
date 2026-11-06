/**
 * Slugs for the Instruments pages. A LegalInstrument row is one provision; its `slug` column is the
 * seed key (`gdpr17`). Rows that share a short name form one instrument (GDPR), whose page slug and
 * each provision's anchor on it are derived here, so the web app, the API and the export agree.
 */

/** Lower-cases and keeps letters and digits; every other run becomes one hyphen. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The instrument page's slug: `GDPR` → `gdpr`, `CLOUD Act` → `cloud-act`. */
export const instrumentSlug = (shortName: string) => slugify(shortName);

/** The provision's anchor on its instrument page: `Art. 17(1)` → `art-17-1`. */
export const provisionAnchor = (provision: string) => slugify(provision);

/** The link from a case page to the provision on its instrument page. */
export const instrumentHref = (row: { shortName: string; provision: string }) =>
  `/instruments/${instrumentSlug(row.shortName)}#${provisionAnchor(row.provision)}`;

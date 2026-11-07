import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { releasesLedgerSchema, type Release, type ReleasesLedger } from "@bind/shared";

/**
 * Appended by `pnpm release` (prisma/release.ts). Committed, so each version shows in the diff.
 * Resolved from import.meta.url, which Next's bundler fills in; import.meta.dirname it leaves undefined.
 */
export const RELEASES_LEDGER_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "ledger", "releases.json");

/** Every release, oldest first. Read on each call, so a bump shows without a restart. */
export async function readReleases(path = RELEASES_LEDGER_PATH): Promise<ReleasesLedger> {
  return releasesLedgerSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

/** The corpus version every export carries: the ledger's last entry. */
export async function currentRelease(path = RELEASES_LEDGER_PATH): Promise<Release> {
  const { releases } = await readReleases(path);
  return releases[releases.length - 1]!;
}

/** The ledger's text: one serialisation, so the release command and a hand edit write the same bytes. */
export const releasesLedgerText = (ledger: ReleasesLedger) => JSON.stringify(ledger, null, 2) + "\n";

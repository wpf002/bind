import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { nextVersion } from "@bind/core";
import { prisma } from "../src/client";
import { RELEASES_LEDGER_PATH, readReleases, releasesLedgerText } from "../src/releases";
import { roundtrip, roundtripSummary } from "./roundtripCheck";
import { writeExports } from "./writeExports";

/**
 * `pnpm release`: appends the next corpus version to ledger/releases.json with today's date and
 * the published case count, then rewrites every export so each names it. Refuses when the
 * roundtrip would fail or corpus files have uncommitted changes, so a version always points at a
 * committed, consistent corpus. `--dry-run` prints the version it would write and stops.
 */
const DRY_RUN_FLAG = "--dry-run";
const root = join(import.meta.dirname, "../../..");
/** Files whose uncommitted edits would make the version point at a corpus that isn't in git. */
const CORPUS_PATHS = ["PARADOX-CORPUS.md", "corpus", "packages/db/prisma"];

function uncommittedCorpusChanges(): string[] {
  const out = execFileSync("git", ["status", "--porcelain", "--", ...CORPUS_PATHS], { cwd: root, encoding: "utf8" });
  return out.split("\n").filter((line) => line.length > 0);
}

async function main() {
  const dryRun = process.argv.includes(DRY_RUN_FLAG);

  const dirty = uncommittedCorpusChanges();
  if (dirty.length) {
    console.error(`refusing: uncommitted corpus changes\n${dirty.join("\n")}`);
    process.exitCode = 1;
    return;
  }

  const check = await roundtrip();
  console.log(roundtripSummary(check));
  if (check.errors.length) {
    for (const e of check.errors) console.log("✗ " + e);
    console.error("refusing: roundtrip mismatches");
    process.exitCode = 1;
    return;
  }

  const ledger = await readReleases();
  const now = new Date();
  const cases = await prisma.case.count({ where: { status: "published" } });
  const release = { version: nextVersion(ledger.releases, now), releasedAt: now.toISOString(), cases };

  if (dryRun) {
    console.log(`dry run: would release ${release.version} (${cases} cases) to ${RELEASES_LEDGER_PATH}`);
    return;
  }

  await writeFile(RELEASES_LEDGER_PATH, releasesLedgerText({ releases: [...ledger.releases, release] }));
  const exported = await writeExports();
  console.log(`released ${release.version}: ${cases} cases; exports rewritten as corpus ${exported.version}`);
  console.log(release.version);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

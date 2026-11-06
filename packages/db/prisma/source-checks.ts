import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sourceCheckKey, sourceCheckLedgerSchema, type SourceCheckEntry } from "@bind/core";

/** Written by check-sources.ts, applied by seed.ts. Committed, so each run's changes show in the diff. */
export const SOURCE_CHECK_LEDGER_PATH = join(import.meta.dirname, "ledger", "source-checks.json");

/** Results of the last check run, keyed by sourceCheckKey. Empty until the check has run once. */
export function readSourceChecks(): Map<string, SourceCheckEntry> {
  let raw: string;
  try {
    raw = readFileSync(SOURCE_CHECK_LEDGER_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw error;
  }
  const ledger = sourceCheckLedgerSchema.parse(JSON.parse(raw));
  return new Map(ledger.checks.map((check) => [sourceCheckKey(check.url, check.quote), check]));
}

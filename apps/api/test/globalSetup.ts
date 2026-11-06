import { execFileSync } from "node:child_process";
import { testDatabaseUrl } from "./database";

const MIGRATE_TIMEOUT_MS = 120_000;

/**
 * Runs once before the suite. `prisma migrate reset` creates the test database if it is missing,
 * drops whatever schema it holds and applies every migration in packages/db/prisma/migrations,
 * so a test database set up before migrations existed still works. --force skips the prompt;
 * testDatabaseUrl has already refused any database but the test one.
 */
export default function setup() {
  execFileSync(
    "pnpm",
    ["--filter", "@bind/db", "exec", "prisma", "migrate", "reset", "--force", "--skip-seed", "--skip-generate"],
    {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
      stdio: "pipe",
      timeout: MIGRATE_TIMEOUT_MS,
    },
  );
}

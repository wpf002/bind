import { execFileSync } from "node:child_process";
import { testDatabaseUrl } from "./database";

const SCHEMA_PUSH_TIMEOUT_MS = 60_000;

/**
 * Runs once before the suite. `prisma db push` creates the test database if it is missing
 * and brings its schema level with schema.prisma. --accept-data-loss lets a schema change
 * drop test columns; testDatabaseUrl has already refused any database but the test one.
 */
export default function setup() {
  execFileSync("pnpm", ["--filter", "@bind/db", "exec", "prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "pipe",
    timeout: SCHEMA_PUSH_TIMEOUT_MS,
  });
}

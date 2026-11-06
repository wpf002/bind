import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

export const TEST_DATABASE_NAME = "bind_test";

const ENV_FILE = fileURLToPath(new URL("../../../.env", import.meta.url));

function databaseName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

/**
 * Throws unless the URL names the test database. Every step that writes calls this first.
 * The message leaves the URL out: it can hold a password.
 */
export function assertTestDatabase(url: string | undefined): string {
  if (!url || databaseName(url) !== TEST_DATABASE_NAME) {
    throw new Error(`Refusing to run: the API tests only write to a database named ${TEST_DATABASE_NAME}`);
  }
  return url;
}

/**
 * TEST_DATABASE_URL if set, else DATABASE_URL with the database name swapped for the test one.
 * Reads the repo's .env as well as the process: turbo doesn't pass either variable through.
 */
export function testDatabaseUrl(): string {
  const env = { ...(existsSync(ENV_FILE) ? parse(readFileSync(ENV_FILE)) : {}), ...process.env };
  if (env.TEST_DATABASE_URL) return assertTestDatabase(env.TEST_DATABASE_URL);
  if (!env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env: the test database URL is derived from it");
  const url = new URL(env.DATABASE_URL);
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return assertTestDatabase(url.toString());
}

import { afterAll, beforeAll, beforeEach } from "vitest";
import { prisma } from "@bind/db";
import { assertTestDatabase, TEST_DATABASE_NAME } from "./database";

assertTestDatabase(process.env.DATABASE_URL);

beforeAll(async () => {
  // Second check, against the connection itself and not the URL string.
  const rows = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  if (rows[0]?.name !== TEST_DATABASE_NAME) throw new Error(`Refusing to run: connected to a database other than ${TEST_DATABASE_NAME}`);
});

beforeEach(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  if (tables.length === 0) return;
  // Identifiers can't be bound as parameters. These come from the catalog, not from input.
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
});

afterAll(() => prisma.$disconnect());

import { prisma } from "../src/client";
import { roundtrip, roundtripSummary } from "./roundtripCheck";

/** Phase 1 gate as a command: prints the summary and every mismatch, exits 1 on any. */
async function main() {
  const result = await roundtrip();
  console.log(roundtripSummary(result));
  for (const e of result.errors) console.log("✗ " + e);
  process.exitCode = result.errors.length ? 1 : 0;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

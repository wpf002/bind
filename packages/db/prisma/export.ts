import { prisma } from "../src/client";
import { writeExports } from "./writeExports";

async function main() {
  const { cases, shapes, version } = await writeExports();
  console.log(`exported ${cases} cases, ${shapes} shapes as corpus ${version}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

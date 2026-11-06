import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/database";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: "./test/globalSetup.ts",
    setupFiles: ["./test/setup.ts"],
    // Every file shares one database and truncates it between tests, so files run one at a time.
    fileParallelism: false,
    env: { DATABASE_URL: testDatabaseUrl(), BIND_PREVIEW_DRAFTS: "0" },
  },
});

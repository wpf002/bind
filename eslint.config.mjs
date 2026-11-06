import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Shared base config. Each package's eslint.config.mjs spreads this and sets
// parserOptions.tsconfigRootDir to its own directory for type-aware rules.
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/generated/**",
      "**/next-env.d.ts",
      "corpus/**",
      "**/*.md",
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },
);

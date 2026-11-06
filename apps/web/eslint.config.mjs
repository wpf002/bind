import nextPlugin from "@next/eslint-plugin-next";
import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];

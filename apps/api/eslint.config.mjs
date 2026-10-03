import path from "node:path";
import { fileURLToPath } from "node:url";

import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const typeScriptFiles = ["src/**/*.{ts,mts,cts}"];

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "dist/**",
    "node_modules/**",
    "*.js",
    "*.mjs",
  ]),
  {
    name: "project/linter-options",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    name: "project/typescript",
    files: typeScriptFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "off",
    },
  },
]);

export default eslintConfig;

import path from "node:path";
import { fileURLToPath } from "node:url";

import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const typeScriptFiles = ["src/**/*.{ts,tsx,mts,cts}"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    name: "project/linter-options",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    name: "project/typescript-strictness",
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
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "no-restricted-syntax": [
        "error",
        {
          message:
            "Avoid explicit `unknown`. Model the real value shape with a named type, validator, or parsed DTO instead.",
          selector: "TSUnknownKeyword",
        },
      ],
    },
  },
  {
    name: "project/architecture/entities",
    files: ["src/entities/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/features/**",
                "@/providers/**",
                "@/server/**",
                "@/store/**",
              ],
              message:
                "Entities should stay as domain-layer primitives. Import only sibling entities or shared utilities.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture/features",
    files: ["src/features/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/providers/**", "@/server/**", "@/store/**"],
              message:
                "Features should not depend on app routes, providers, server-only modules, or the root store.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture/server",
    files: ["src/server/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/features/**", "@/providers/**", "@/store/**"],
              message:
                "Server modules should stay independent from UI routes, features, providers, and the Redux store.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture/shared",
    files: ["src/shared/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/server/**"],
              message:
                "Shared modules must remain reusable across the frontend and should not depend on app routes or server-only code.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture/providers",
    files: ["src/providers/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/server/**"],
              message:
                "Providers belong to the composition layer and should not import app routes or server-only modules.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture/store",
    files: ["src/store/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/providers/**", "@/server/**"],
              message:
                "The root store should only compose reducers and middleware, not app routes, providers, or server code.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "project/architecture-api-routes",
    files: ["src/app/api/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/providers/**", "@/shared/components/**", "@/store/**"],
              message:
                "API routes should stay server-side and must not depend on frontend providers, UI components, or the Redux store.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

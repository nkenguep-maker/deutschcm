import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefacts Vercel local (`vercel build` produit `.vercel/output/`
    // avec des bundles minifiés · non-source).
    ".vercel/**",
    // Artefacts Playwright · reports + traces + screenshots.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;

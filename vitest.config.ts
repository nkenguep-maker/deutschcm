import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/lib/entitlements/__tests__/setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

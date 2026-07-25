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
      // Le paquet "server-only" (marqueur React) est fourni par Next.js à
      // l'exécution mais Vitest tourne hors Next · on l'alias vers le stub
      // vide Next (empty.js · aucun side-effect · sans quoi tout module
      // `import "server-only"` fait échouer le test avec `Cannot find
      // package`).
      "server-only": path.resolve(
        __dirname,
        "node_modules/next/dist/compiled/server-only/empty.js",
      ),
    },
  },
});

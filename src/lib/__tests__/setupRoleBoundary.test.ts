import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("setup-role authentication boundary", () => {
  it("never lists setup-role among public routes", () => {
    const source = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
    const publicRoutes = source.match(/const PUBLIC_ROUTES = \[([\s\S]*?)\n\]/)?.[1];

    expect(publicRoutes).toBeTruthy();
    expect(publicRoutes).not.toContain('"/setup-role"');
    expect(source).toContain('if (canonicalPath === "/setup-role") return response');
  });

  it("describes verified role applications without closed-beta copy", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/[locale]/setup-role/page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("bêta fermée");
    expect(source).not.toContain("closed beta");
    expect(source).toContain("après vérification de la demande");
    expect(source).toContain("after a verified application");
  });
});

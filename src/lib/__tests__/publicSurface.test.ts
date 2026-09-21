import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_SURFACE, isProductionHiddenPath, isPubliclyLinked } from "@/lib/release/publicSurface";

const REPO = resolve(__dirname, "../../..");

describe("YEMA public release surface", () => {
  it("keeps core editorial and pricing pages public", () => {
    expect(PUBLIC_SURFACE.languages.status).toBe("LIVE");
    expect(PUBLIC_SURFACE.method.status).toBe("LIVE");
    expect(PUBLIC_SURFACE.pricing.status).toBe("LIVE");
    expect(isPubliclyLinked("languages")).toBe(true);
    expect(isPubliclyLinked("method")).toBe(true);
    expect(isPubliclyLinked("pricing")).toBe(true);
  });

  it("keeps professional acquisition visible as beta", () => {
    expect(PUBLIC_SURFACE.teachers.status).toBe("BETA");
    expect(PUBLIC_SURFACE.centers.status).toBe("BETA");
    expect(isPubliclyLinked("teachers")).toBe(true);
    expect(isPubliclyLinked("centers")).toBe(true);
  });

  it("canonicalizes legacy center acquisition URLs without exposing the private center app", () => {
    const proxy = readFileSync(resolve(REPO, "src/proxy.ts"), "utf8");
    expect(proxy).toContain('canonicalPath === "/centres"');
    expect(proxy).toContain('canonicalPath === "/centers"');
    expect(proxy).toContain('`/${locale}/landing`');
    expect(proxy).toContain('"/center": ["CENTER", "ADMIN"]');
    expect(proxy).not.toContain('"/center", "/centres"');
  });

  it("keeps QA private", () => {
    expect(PUBLIC_SURFACE.qa.status).toBe("PRIVATE");
    expect(isPubliclyLinked("qa")).toBe(false);
  });

  it("does not hide the commercial pricing subtree", () => {
    expect(isProductionHiddenPath("/pricing")).toBe(false);
    expect(isProductionHiddenPath("/pricing/monde")).toBe(false);
    expect(isProductionHiddenPath("/pricing/racines")).toBe(false);
    expect(isProductionHiddenPath("/methode")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { PUBLIC_SURFACE, isProductionHiddenPath, isPubliclyLinked } from "@/lib/release/publicSurface";

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

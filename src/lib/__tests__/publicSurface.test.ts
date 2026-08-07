import { describe, expect, it } from "vitest";
import {
  PUBLIC_SURFACE,
  isProductionHiddenPath,
  isPubliclyLinked,
} from "@/lib/release/publicSurface";

describe("YEMA public release surface", () => {
  it("keeps the two public editorial pages live", () => {
    expect(PUBLIC_SURFACE.languages.status).toBe("LIVE");
    expect(PUBLIC_SURFACE.method.status).toBe("LIVE");
    expect(isPubliclyLinked("languages")).toBe(true);
    expect(isPubliclyLinked("method")).toBe(true);
  });

  it("keeps teacher entry visible only as beta", () => {
    expect(PUBLIC_SURFACE.teachers.status).toBe("BETA");
    expect(isPubliclyLinked("teachers")).toBe(true);
  });

  it("never promotes private or hidden surfaces", () => {
    expect(PUBLIC_SURFACE.centers.status).toBe("PRIVATE");
    expect(PUBLIC_SURFACE.qa.status).toBe("PRIVATE");
    expect(PUBLIC_SURFACE.pricing.status).toBe("HIDDEN");
    expect(isPubliclyLinked("centers")).toBe(false);
    expect(isPubliclyLinked("qa")).toBe(false);
    expect(isPubliclyLinked("pricing")).toBe(false);
  });

  it("matches the whole pricing subtree as production-hidden", () => {
    expect(isProductionHiddenPath("/pricing")).toBe(true);
    expect(isProductionHiddenPath("/pricing/monde")).toBe(true);
    expect(isProductionHiddenPath("/pricing/racines/checkout")).toBe(true);
    expect(isProductionHiddenPath("/methode")).toBe(false);
  });
});

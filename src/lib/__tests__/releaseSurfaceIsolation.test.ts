import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_SURFACE } from "@/lib/release/publicSurface";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("technical beta surface isolation", () => {
  it("keeps pricing hidden and centers private on the public surface", () => {
    expect(PUBLIC_SURFACE.pricing.status).toBe("HIDDEN");
    expect(PUBLIC_SURFACE.centers.status).toBe("PRIVATE");
  });

  it("does not expose payment navigation in the family dashboard", () => {
    const nav = read("src/features/dashboards/family/nav.ts");
    const dashboard = read("src/features/dashboards/family/FamilyDashboard.tsx");
    expect(nav).not.toContain('key: "payments"');
    expect(nav).not.toContain("#paiements");
    expect(dashboard).not.toContain("FamilyPaymentsSection");
    expect(dashboard).not.toContain('"paiements"');
  });

  it("does not expose billing navigation in the center dashboard", () => {
    const nav = read("src/features/dashboards/center/nav.ts");
    const dashboard = read("src/features/dashboards/center/CenterDashboard.tsx");
    expect(nav).not.toContain('key: "billing"');
    expect(nav).not.toContain("#facturation");
    expect(dashboard).not.toContain('"facturation"');
    expect(dashboard).not.toContain('"factures"');
  });

  it("keeps public registration independent from plan parameters", () => {
    const register = read("src/app/[locale]/register/page.tsx");
    expect(register).not.toContain('searchParams.get("plan")');
    expect(register).not.toContain('searchParams.get("prof")');
    expect(register).not.toContain("PLAN_LABEL_");
    expect(register).not.toContain("avant tout paiement");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_SURFACE } from "@/lib/release/publicSurface";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("open beta public surface", () => {
  it("keeps public offers live and centers explicitly in beta", () => {
    expect(PUBLIC_SURFACE.pricing.status).toBe("LIVE");
    expect(PUBLIC_SURFACE.centers.status).toBe("BETA");
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

  it("carries a selected offer through public registration without payment claims", () => {
    const register = read("src/app/[locale]/register/page.tsx");
    expect(register).toContain('searchParams.get("plan")');
    expect(register).toContain('searchParams.get("prof")');
    expect(register).toContain("selected_plan: selectedPlan");
    expect(register).not.toContain("PLAN_LABEL_");
    expect(register).not.toContain("avant tout paiement");
  });
});

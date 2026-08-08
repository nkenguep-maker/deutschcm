import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("canonical registration → onboarding → persona home funnel", () => {
  it("collects a real adult identity and preserves offer intent through confirmation", () => {
    const register = read("src/app/[locale]/register/page.tsx");
    expect(register).toContain("first_name: first");
    expect(register).toContain("last_name: last");
    expect(register).toContain("selected_plan: selectedPlan");
    expect(register).toContain('selected_addons: rootsSoloSelected ? ["roots-solo"] : []');
    expect(register).toContain("teacher_addon_requested: teacherAddonRequested");
    expect(register).toContain("/onboarding/persona");
    expect(register).toContain("emailRedirectTo");
    expect(register).not.toContain("signUp({ phone:");
  });

  it("offers six public adult personas while keeping Super Admin non-self-service", () => {
    const page = read("src/app/[locale]/onboarding/persona/page.tsx");
    const route = read("src/app/api/onboarding/persona/route.ts");

    for (const persona of ["student_monde", "student_racines", "family", "teacher", "coach", "center_admin"]) {
      expect(page).toContain(`id: "${persona}"`);
    }
    expect(route).toContain('persona === "super_admin"');
    expect(route).toContain('bad("PERSONA_NOT_SELF_SERVICE", 403)');
  });

  it("never self-grants professional access in Production and enables QA-only activation on P-1", () => {
    const route = read("src/app/api/onboarding/persona/route.ts");
    const complete = read("src/app/api/onboarding/complete/route.ts");
    const legacy = read("src/app/api/onboarding/route.ts");

    expect(route).toContain("isInternalTestEnvironment()");
    expect(route).toContain("qaAutoApproved: true");
    expect(route).toContain('status: "PENDING"');
    expect(route).toContain('role: "RACINES_COACH"');
    expect(complete).toContain("hasActiveRole(dbUser.id, requestedRole)");
    expect(complete).toContain('ROLE_NOT_SELF_SERVICE');
    expect(legacy).toContain('hasActiveRole(dbUser.id, "TEACHER")');
    expect(legacy).toContain('hasActiveRole(dbUser.id, "CENTER")');
  });

  it("uses one canonical server resolver for later login and confirmation", () => {
    const login = read("src/app/[locale]/login/page.tsx");
    const callback = read("src/app/auth/callback/route.ts");
    const home = read("src/app/api/auth/home/route.ts");
    const dashboard = read("src/app/[locale]/dashboard/page.tsx");

    expect(login).toContain('/api/auth/home');
    expect(callback).toContain("resolvePersonaRuntime");
    expect(home).toContain("resolvePersonaRuntime");
    expect(dashboard).toContain("resolvePersonaRuntime");
    expect(dashboard).toContain('runtime.persona !== "student_monde"');
    expect(dashboard).toContain('runtime.persona !== "student_racines"');
  });

  it("keeps children email-less and attached to the Family guardian", () => {
    const familyPage = read("src/app/[locale]/onboarding/family/page.tsx");
    const children = read("src/app/api/family/children/route.ts");
    const seats = read("src/lib/family/seats.ts");

    expect(familyPage).toContain("pas une adresse e-mail");
    expect(familyPage).toContain("avatar");
    expect(familyPage).toContain("PIN enfant");
    expect(children).toContain("parentUserId: actor.userId");
    expect(children).not.toContain("body.email");
    expect(seats).toContain("P1_TECHNICAL_BETA_CHILD_WORLD");
    expect(seats).toContain('process.env.VERCEL_ENV === "production"');
  });

  it("lets an existing Monde learner save Roots Solo on the same account without granting access", () => {
    const pricing = read("src/app/[locale]/pricing/monde/page.tsx");
    const intent = read("src/app/api/account/offer-intent/route.ts");

    expect(pricing).toContain('data-addon="roots-solo"');
    expect(pricing).toContain("/api/account/offer-intent");
    expect(pricing).toContain("Ajouter Racines Solo à mon compte");
    expect(intent).toContain('runtime.persona !== "student_monde"');
    expect(intent).toContain('addon !== "roots-solo"');
    expect(intent).toContain("selected_addons");
    expect(intent).toContain("accessGranted: false");
    expect(intent).not.toContain("accessGrant.create");
    expect(intent).not.toContain("order.create");
  });

  it("projects the saved identity into learner, Family, Teacher and Coach dashboards", () => {
    const monde = read("src/features/dashboards/student-monde/StudentMondeDashboard.tsx");
    const racines = read("src/features/dashboards/student-racines/StudentRacinesDashboard.tsx");
    const family = read("src/features/dashboards/family/FamilyDashboard.tsx");
    const teacher = read("src/features/dashboards/teacher/TeacherDashboard.tsx");
    const coach = read("src/features/dashboards/coach-racines/CoachRacinesDashboard.tsx");

    expect(monde).toContain("data.greetingName");
    expect(racines).toContain("data.greetingName");
    expect(family).toContain("data.guardian.fullName");
    expect(teacher).toContain("data.profile.fullName");
    expect(coach).toContain("data.profile.fullName");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("canonical registration → onboarding → persona home funnel", () => {
  it("collects a real adult identity and preserves Monde/Racines offer intent through confirmation", () => {
    const register = read("src/app/[locale]/register/page.tsx");
    expect(register).toContain("first_name: first");
    expect(register).toContain("last_name: last");
    expect(register).toContain("selected_plan: selectedPlan");
    expect(register).toContain('selected_addons: rootsSoloSelected ? ["roots-solo"] : []');
    expect(register).toContain("teacher_addon_requested: teacherAddonRequested");
    expect(register).toContain('"racines-solo"');
    expect(register).toContain('"racines-famille"');
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

  it("keeps commercial intent compatible with the persona selected in onboarding", () => {
    const route = read("src/app/api/onboarding/persona/route.ts");
    expect(route).toContain("function compatibleOfferIntent");
    expect(route).toContain('params.persona === "student_monde"');
    expect(route).toContain('params.persona === "student_racines"');
    expect(route).toContain('params.persona === "family"');
    expect(route).toContain('rawPlan === "racines-solo"');
    expect(route).toContain('rawPlan === "racines-famille"');
    expect(route).toContain('params.rawAddon === "roots-solo"');
    expect(route).toContain("Professional personas never inherit learner/family commercial intent");
    expect(route).toContain("plan: offer.selectedPlan");
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
    const onboarding = read("src/app/[locale]/onboarding/page.tsx");

    expect(login).toContain('/api/auth/home');
    expect(callback).toContain("resolvePersonaRuntime");
    expect(home).toContain("resolvePersonaRuntime");
    expect(dashboard).toContain("resolvePersonaRuntime");
    expect(dashboard).toContain('runtime.persona !== "student_monde"');
    expect(dashboard).toContain('runtime.persona !== "student_racines"');
    expect(onboarding).toContain('dbUser.userRoles[0]?.onboarded === true');
    expect(onboarding).toContain('href: "/dashboard"');
  });

  it("prevents direct dashboard URLs from bypassing incomplete adult onboarding", () => {
    const teacher = read("src/app/[locale]/teacher/page.tsx");
    const center = read("src/app/[locale]/center/page.tsx");
    const coach = read("src/app/[locale]/coach/racines/page.tsx");
    const family = read("src/app/[locale]/family/page.tsx");

    for (const page of [teacher, center, coach, family]) {
      expect(page).toContain("resolvePersonaRuntime");
      expect(page).toContain("!runtime.onboarded");
      expect(page).toContain("runtime.onboardingRoute");
    }
  });

  it("keeps children email-less and attached to the Family guardian", () => {
    const familyPage = read("src/app/[locale]/onboarding/family/page.tsx");
    const children = read("src/app/api/family/children/route.ts");
    const seats = read("src/lib/family/seats.ts");

    expect(familyPage).toContain("pas une adresse e-mail");
    expect(familyPage).toContain("avatar");
    expect(familyPage).toContain("PIN enfant");
    expect(children).toContain("resolveFamilyGuardianActorOrNull");
    expect(children).toContain("parentUserId: guard.parentId");
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

  it("makes Teacher and Center onboarding complete without mocks or fake payment", () => {
    const teacher = read("src/app/[locale]/onboarding/teacher/page.tsx");
    const center = read("src/app/[locale]/onboarding/center/page.tsx");
    const legacyApi = read("src/app/api/onboarding/route.ts");

    expect(teacher).toContain('fetch("/api/me"');
    expect(teacher).toContain('fetch("/api/onboarding"');
    expect(teacher).toContain('fetch("/api/onboarding/complete"');
    expect(teacher).not.toContain("CENTERS =");
    expect(teacher).not.toContain("Institut Goethe Yaoundé");

    expect(center).toContain('fetch("/api/me"');
    expect(center).toContain('fetch("/api/onboarding"');
    expect(center).toContain('fetch("/api/onboarding/complete"');
    expect(center).toContain("Aucun paiement n’est demandé");
    expect(center).not.toContain("PLAN_PRICES");
    expect(center).not.toContain("cardNumber");
    expect(center).not.toContain("transactionId");
    expect(legacyApi).toContain("if (dbUser.centerId)");
    expect(legacyApi).toContain("prisma.languageCenter.update");
    expect(legacyApi).toContain("prisma.languageCenter.create");
  });

  it("prefills confirmed account identity into Family, Teacher and Coach onboarding", () => {
    const family = read("src/app/[locale]/onboarding/family/page.tsx");
    const teacher = read("src/app/[locale]/onboarding/teacher/page.tsx");
    const coach = read("src/app/[locale]/onboarding/coach/page.tsx");

    for (const page of [family, teacher, coach]) {
      expect(page).toContain('fetch("/api/me"');
      expect(page).toContain("firstName");
      expect(page).toContain("lastName");
    }
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

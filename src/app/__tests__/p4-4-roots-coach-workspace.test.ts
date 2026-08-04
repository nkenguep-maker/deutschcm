// P4.4 · Gardes structurelles Coach Racines · aucun mock, aucun CAREER_COACH
// fallback, aucun teacherId/coachId client, aucune sensible column projection.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("P4.4 · resolver Coach Racines · CAREER_COACH refusé", () => {
  const src = read("src/lib/permissions/rootsCoach.ts");
  it("Accepte UNIQUEMENT RACINES_COACH · aucun fallback CAREER_COACH", () => {
    // Le check doit exclusivement porter sur RACINES_COACH.
    expect(src).toMatch(/appRoles\.has\("RACINES_COACH"\)/);
    // Refuse fallback OR CAREER_COACH.
    expect(src).not.toMatch(/appRoles\.has\("RACINES_COACH"\)\s*\|\|\s*appRoles\.has\("CAREER_COACH"\)/);
    expect(src).not.toMatch(/RACINES_COACH\s*\|\|\s*CAREER_COACH/);
  });
  it("Émet ROOTS_COACH_ACCESS_DENIED sur 403", () => {
    expect(src).toMatch(/action:\s*"ROOTS_COACH_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"role_missing"/);
  });
  it("Émet ROOTS_COACH_CIRCLE_ACCESS_DENIED sur circle étranger", () => {
    expect(src).toMatch(/action:\s*"ROOTS_COACH_CIRCLE_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"not_assigned_or_archived"/);
  });
  it("Émet ROOTS_COACH_PROFILE_ACCESS_DENIED sur profil étranger", () => {
    expect(src).toMatch(/action:\s*"ROOTS_COACH_PROFILE_ACCESS_DENIED"/);
    expect(src).toMatch(/reasonCode:\s*"profile_not_in_coach_circle"/);
  });
  it("Aucun coachId/circleId/childProfileId client accepté", () => {
    expect(src).not.toMatch(/searchParams\.get\(["'](coachId|circleId|childProfileId)["']\)/);
    expect(src).not.toMatch(/body\.\s*(coachId|circleId|childProfileId)/);
    expect(src).not.toMatch(/headers\.get\(["']x-(coach|circle|child-profile)-id["']\)/);
  });
  it("Utilise findFirst avec filtre serveur (aucun findFirst arbitraire)", () => {
    // La lecture doit inclure `role: "COACH"` + `status: "ACTIVE"` + circle actif.
    expect(src).toMatch(/role:\s*"COACH"/);
    expect(src).toMatch(/status:\s*"ACTIVE"/);
    expect(src).toMatch(/circle:\s*\{\s*status:\s*"ACTIVE"/);
  });
});

describe("P4.4 · queries · projection minimale enfant", () => {
  const src = read("src/lib/rootsCoach/queries.ts");
  it("Toutes les fonctions requises exportées", () => {
    for (const fn of [
      "getRootsCoachDashboard",
      "getRootsCoachCircles",
      "getRootsCoachCircle",
      "getRootsCoachProfiles",
      "getRootsCoachProfile",
      "getRootsCoachCapacity",
    ]) {
      expect(src).toMatch(new RegExp(`export async function ${fn}\\(`));
    }
    expect(src).toMatch(/export function toAgeBand\(/);
  });
  it("toAgeBand · 5 tranches + unknown", () => {
    expect(src).toMatch(/"4-6"/);
    expect(src).toMatch(/"7-9"/);
    expect(src).toMatch(/"10-12"/);
    expect(src).toMatch(/"13-15"/);
    expect(src).toMatch(/"16-17"/);
    expect(src).toMatch(/"unknown"/);
  });
  it("Aucun email/phone/dateOfBirth/adresse dans les selects", () => {
    expect(src).not.toMatch(/email:\s*true/);
    expect(src).not.toMatch(/phone:\s*true/);
    expect(src).not.toMatch(/dateOfBirth/);
    expect(src).not.toMatch(/address/);
    expect(src).not.toMatch(/schoolName/);
  });
  it("Age n'est jamais projeté brut · uniquement toAgeBand", () => {
    // Aucun `ageBand: something.age` sans passer par toAgeBand.
    // On vérifie que chaque construction de ageBand dérive de toAgeBand.
    const withoutTransform = src.match(/ageBand:\s*[a-z_.]+\.age\b/g);
    expect(withoutTransform).toBeNull();
  });
  it("MAX_PAGE_SIZE = 100", () => {
    expect(src).toMatch(/MAX_PAGE_SIZE = 100/);
  });
});

describe("P4.4 · pages · flag-gated + resolver + zero client authority", () => {
  const pages = [
    "src/app/[locale]/coach/racines/page.tsx",
    "src/app/[locale]/coach/racines/circles/page.tsx",
    "src/app/[locale]/coach/racines/circles/[circleId]/page.tsx",
    "src/app/[locale]/coach/racines/profiles/page.tsx",
    "src/app/[locale]/coach/racines/profiles/[childProfileId]/page.tsx",
    "src/app/[locale]/coach/racines/activities/page.tsx",
    "src/app/[locale]/coach/racines/messages/page.tsx",
    "src/app/[locale]/coach/racines/sessions/page.tsx",
  ];
  it.each(pages)("%s · flag-gated via isRootsCoachWorkspaceActive", (file) => {
    const s = read(file);
    expect(s).toMatch(/isRootsCoachWorkspaceActive\(\)/);
    expect(s).toMatch(/RootsCoachFeaturePlaceholder/);
  });
  it.each(pages)("%s · résout coach serveur · pas de coachId/circleId/childProfileId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveRootsCoachActor/);
    expect(s).not.toMatch(/searchParams\.\s*(coachId|circleId|childProfileId)/);
    expect(s).not.toMatch(/body\.\s*(coachId|circleId|childProfileId)/);
    expect(s).not.toMatch(/searchParams\.get\(["'](coachId|childProfileId)["']\)/);
  });
  it.each(pages)("%s · pas 'use client' au top", (file) => {
    const s = read(file);
    expect(s).not.toMatch(/^"use client"/);
  });
});

describe("P4.4 · APIs · flag-gated + resolver + no client authority", () => {
  const routes = [
    "src/app/api/roots-coach/me/route.ts",
    "src/app/api/roots-coach/dashboard/route.ts",
    "src/app/api/roots-coach/circles/route.ts",
    "src/app/api/roots-coach/circles/[circleId]/route.ts",
    "src/app/api/roots-coach/profiles/route.ts",
    "src/app/api/roots-coach/profiles/[childProfileId]/route.ts",
    "src/app/api/roots-coach/capacity/route.ts",
  ];
  it.each(routes)("%s · isRootsCoachWorkspaceActive gate + 404", (file) => {
    const s = read(file);
    expect(s).toMatch(/isRootsCoachWorkspaceActive\(\)/);
    expect(s).toMatch(/status:\s*404/);
  });
  it.each(routes)("%s · resolveRootsCoachActor · jamais coachId/circleId/childProfileId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveRootsCoachActor/);
    expect(s).not.toMatch(/searchParams\.get\(["'](coachId|childProfileId)["']\)/);
    expect(s).not.toMatch(/body\.\s*(coachId|circleId|childProfileId)/);
    expect(s).not.toMatch(/headers\.get\(["']x-(coach|child-profile)-id["']\)/);
  });
});

describe("P4.4 · feature flags", () => {
  const src = read("src/lib/flags.ts");
  it("COACH_WORKSPACE_ENABLED + ROOTS_COACH_RLS_CONFIRMED + RACINES_COACH_OPERATIONAL déclarés", () => {
    expect(src).toMatch(/"COACH_WORKSPACE_ENABLED"/);
    expect(src).toMatch(/"ROOTS_COACH_RLS_CONFIRMED"/);
    expect(src).toMatch(/"RACINES_COACH_OPERATIONAL"/);
  });
  it("isRootsCoachWorkspaceActive combine les deux flags en prod", () => {
    expect(src).toMatch(/export function isRootsCoachWorkspaceActive/);
    expect(src).toMatch(/NODE_ENV === "production"/);
    expect(src).toMatch(/getFlag\("ROOTS_COACH_RLS_CONFIRMED"\)/);
  });
  it("Aucun NEXT_PUBLIC lu par getFlag/isRootsCoachWorkspaceActive", () => {
    expect(src).not.toMatch(/process\.env\.NEXT_PUBLIC_/);
    expect(src).not.toMatch(/process\.env\[[^\]]*NEXT_PUBLIC/);
  });
});

describe("P4.4 · migration RLS présente", () => {
  const migrationsDir = "prisma/migrations";
  it("Migration p4_4_roots_coach_rls existe", () => {
    const dirs = readdirSync(join(process.cwd(), migrationsDir));
    const match = dirs.find((d) => d.endsWith("p4_4_roots_coach_rls"));
    expect(match, "no migration matching p4_4_roots_coach_rls").toBeTruthy();
    const sqlPath = join(migrationsDir, match!, "migration.sql");
    expect(existsSync(join(process.cwd(), sqlPath))).toBe(true);
    const sql = read(sqlPath);
    // Helpers requis avec SECURITY DEFINER + search_path verrouillé.
    for (const fn of ["is_roots_coach", "is_active_circle_coach", "can_roots_coach_view_child"]) {
      expect(sql).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`));
    }
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public, pg_temp/);
    // Projection function ChildProfile.
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.get_roots_coach_assigned_profiles/);
    expect(sql).toMatch(/age_band/);
    // Aucun bypass is_yema_admin dans les policies P4.4.
    const createPolicies = sql.match(/CREATE POLICY[\s\S]*?USING \([\s\S]*?\);/g) ?? [];
    for (const block of createPolicies) {
      expect(block, `bypass in P4.4 policy: ${block.slice(0, 100)}`).not.toMatch(/is_yema_admin/);
    }
    // Grants minimaux.
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.is_roots_coach\(TEXT\) FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.is_roots_coach\(TEXT\) TO authenticated/);
    // AuditActions values.
    for (const label of [
      "ROOTS_COACH_ACCESS_DENIED",
      "ROOTS_COACH_CIRCLE_ACCESS_DENIED",
      "ROOTS_COACH_PROFILE_ACCESS_DENIED",
      "ROOTS_COACH_CAPACITY_REACHED",
      "ROOTS_COACH_ASSIGNMENT_REVOKED",
      "ROOTS_COACH_SCOPE_AMBIGUOUS",
    ]) {
      expect(sql, `missing enum ${label}`).toMatch(new RegExp(label));
    }
  });
});

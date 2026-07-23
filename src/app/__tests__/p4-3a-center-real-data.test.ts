// P4.3a · Gardes structurelles · aucun mock rendu, resolver strict,
// API gated + centerId scope, projections minimales.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("P4.3a · pages Center · aucun mock rendu", () => {
  const pages = [
    "src/app/[locale]/center/page.tsx",
    "src/app/[locale]/center/teachers/page.tsx",
    "src/app/[locale]/center/classes/page.tsx",
    "src/app/[locale]/center/students/page.tsx",
    "src/app/[locale]/center/stats/page.tsx",
  ];
  it.each(pages)("%s · aucun const MOCK_/STUDENTS/CLASSES hardcoded", (file) => {
    const s = read(file);
    // Aucune constante MOCK_*, TEACHERS = [ ..., STUDENTS = [ ..., CLASSES = [ ...
    expect(s).not.toMatch(/const MOCK_\w+\s*=\s*\[/);
    expect(s).not.toMatch(/^const (STUDENTS|TEACHERS|CLASSES|PENDING|TOP_STUDENTS|TOP_TEACHERS|RETENTION|PROGRESSION|REVENUE)\s*=/m);
    // Aucun nom hardcodé familier des anciens mocks
    for (const name of ["Marie Nguemo", "Sophie Tanda", "Dr. Beatrice", "Fatima", "Alice Fouda", "Jean-Pierre Nkolo",
                        "Olivia Tchamba", "Diane Biya", "Sandrine Kamga"]) {
      expect(s, `${file} · leak "${name}"`).not.toContain(name);
    }
  });
  it.each(pages)("%s · flag-gated via isCenterRealDataActive", (file) => {
    const s = read(file);
    expect(s).toMatch(/isCenterRealDataActive\(\)/);
    expect(s).toMatch(/CenterFeaturePlaceholder/);
  });
  it.each(pages)("%s · résout centre serveur, aucun centerId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveCenterActor/);
    expect(s).not.toMatch(/searchParams\.\s*centerId/);
    expect(s).not.toMatch(/body\.\s*centerId/);
    expect(s).not.toMatch(/searchParams\.get\(["']centerId["']\)/);
  });
});

describe("P4.3a · resolver centre · invariants", () => {
  const src = read("src/lib/permissions/center.ts");
  it("Résout via prisma.teacher.findMany (défensif · take:2)", () => {
    expect(src).toMatch(/prisma\.teacher\.findMany\(/);
    expect(src).toMatch(/take:\s*2/);
    // Interdit · findFirst arbitraire, orderBy en syntaxe Prisma sur teacher.
    expect(src).not.toMatch(/prisma\.teacher\.findFirst\(/);
    expect(src).not.toMatch(/orderBy:\s*\{/);
  });
  it("Refuse quand rôle Center absent (401/403/404)", () => {
    expect(src).toMatch(/center admin role required/);
    expect(src).toMatch(/no center membership resolved/);
  });
  it("Refuse un centre inactif", () => {
    expect(src).toMatch(/center inactive/);
  });
  it("Refuse AMBIGUOUS_BINDING (409 CONFLICT)", () => {
    expect(src).toMatch(/center scope ambiguous/);
    expect(src).toMatch(/"CONFLICT"/);
    // Deux sources d'ambigüité couvertes · multi-Teacher ET User.centerId legacy divergent.
    expect(src).toMatch(/teacherRows\.length > 1/);
    expect(src).toMatch(/dbUser\.centerId && dbUser\.centerId !== teacher\.centerId/);
  });
  it("Jamais de centerId issu de body/query", () => {
    expect(src).not.toMatch(/body\.\s*centerId/);
    expect(src).not.toMatch(/query\.\s*centerId/);
    expect(src).not.toMatch(/searchParams\.get\("centerId"\)/);
  });
});

describe("P4.3a hardening · PermissionError étendu à CONFLICT", () => {
  const perm = read("src/lib/permissions/circle.ts");
  const mapper = read("src/lib/api/circleErrors.ts");
  it("code CONFLICT déclaré", () => {
    expect(perm).toMatch(/"CONFLICT"/);
  });
  it("mapper renvoie 409 sur CONFLICT", () => {
    expect(mapper).toMatch(/"CONFLICT"\s*\?\s*409/);
  });
});

describe("P4.3a hardening · flag production RLS confirmed", () => {
  const src = read("src/lib/flags.ts");
  it("flag CENTER_RLS_CONFIRMED déclaré", () => {
    expect(src).toMatch(/"CENTER_RLS_CONFIRMED"/);
  });
  it("isCenterRealDataActive combine les deux flags en prod", () => {
    expect(src).toMatch(/export function isCenterRealDataActive/);
    expect(src).toMatch(/NODE_ENV === "production"/);
    expect(src).toMatch(/getFlag\("CENTER_RLS_CONFIRMED"\)/);
  });
  it("Aucun NEXT_PUBLIC_ résolu par getFlag ou isCenterRealDataActive", () => {
    // Vérification transverse · un composant client ne peut pas fuiter l'état
    // en lisant NEXT_PUBLIC_YEMA_CENTER_*. On refuse tout accès env vars
    // préfixés NEXT_PUBLIC_YEMA_ dans le module flags.
    expect(src).not.toMatch(/process\.env\[[^\]]*NEXT_PUBLIC/);
    expect(src).not.toMatch(/process\.env\.NEXT_PUBLIC_/);
  });
});

describe("P4.3a hardening · endpoints legacy fermés (404 stable)", () => {
  const legacy = read("src/app/api/center/route.ts");
  const legacyJoin = read("src/app/api/center/join/route.ts");
  it("/api/center · aucun centerId client accepté", () => {
    expect(legacy).not.toMatch(/searchParams\.get\("centerId"\)/);
    expect(legacy).not.toMatch(/body\.centerId/);
    expect(legacy).not.toMatch(/prisma\.languageCenter\.findUnique\(\{[^}]*centerId/);
    expect(legacy).toMatch(/center_endpoint_deprecated/);
    expect(legacy).toMatch(/status:\s*404/);
  });
  it("/api/center/join · désactivé (404 stable)", () => {
    expect(legacyJoin).not.toMatch(/prisma\.user\.update/);
    expect(legacyJoin).not.toMatch(/prisma\.languageCenter\.findUnique/);
    expect(legacyJoin).toMatch(/center_join_deprecated/);
    expect(legacyJoin).toMatch(/status:\s*404/);
  });
});

describe("P4.3a · queries · scope strict + pagination + allowlist", () => {
  const src = read("src/lib/center/queries.ts");
  it("Toutes les fonctions reçoivent centerId serveur", () => {
    for (const fn of [
      "getCenterDashboard",
      "getCenterTeachers",
      "getCenterClasses",
      "getCenterStudents",
      "getCenterPendingEnrollments",
    ]) {
      expect(src, `${fn} accepte centerId`).toMatch(new RegExp(`export async function ${fn}\\(\\s*centerId: string`));
    }
  });
  it("Filtres Prisma incluent centerId (jamais absent)", () => {
    // Teacher WHERE inclut centerId
    expect(src).toMatch(/prisma\.teacher\.(count|findMany)\({[\s\S]*?centerId/);
    // Classroom WHERE inclut centerId
    expect(src).toMatch(/prisma\.classroom\.(count|findMany)\({[\s\S]*?centerId/);
    // ClassroomEnrollment via classroom.centerId
    expect(src).toMatch(/classroom:\s*\{\s*centerId/);
  });
  it("Pagination · pageSize limité à MAX_PAGE_SIZE", () => {
    expect(src).toMatch(/MAX_PAGE_SIZE = 100/);
  });
  it("classId étranger · réponse sûre vide (pas de leak)", () => {
    expect(src).toMatch(/classId étranger[\s\S]*?return \{ items:/);
  });
  it("Projections · aucun email/téléphone/adresse/paiement exposé", () => {
    // Le seam sélectionne uniquement id/fullName/isVerified/classroomCount/etc.
    expect(src).not.toMatch(/email:\s*true/);
    expect(src).not.toMatch(/phone:\s*true/);
    expect(src).not.toMatch(/dateOfBirth/);
    expect(src).not.toMatch(/hourlyRate:\s*true/);
    expect(src).not.toMatch(/address/);
  });
});

describe("P4.3a · APIs · flag-gated + resolver + no client centerId", () => {
  const routes = [
    "src/app/api/center/me/route.ts",
    "src/app/api/center/dashboard/route.ts",
    "src/app/api/center/teachers/route.ts",
    "src/app/api/center/classes/route.ts",
    "src/app/api/center/students/route.ts",
    "src/app/api/center/enrollments/route.ts",
  ];
  it.each(routes)("%s · isCenterRealDataActive gate", (file) => {
    const s = read(file);
    expect(s).toMatch(/isCenterRealDataActive\(\)/);
    expect(s).toMatch(/status:\s*404/);
  });
  it.each(routes)("%s · resolveCenterActor · jamais centerId client", (file) => {
    const s = read(file);
    expect(s).toMatch(/resolveCenterActor/);
    expect(s).not.toMatch(/searchParams\.get\("centerId"\)/);
    expect(s).not.toMatch(/searchParams\.get\('centerId'\)/);
    expect(s).not.toMatch(/body\.\s*centerId/);
    expect(s).not.toMatch(/headers\.get\("x-center-id"\)/);
  });
});

describe("P4.3a · pages Center · doivent utiliser SSR (server components)", () => {
  const pages = [
    "src/app/[locale]/center/page.tsx",
    "src/app/[locale]/center/teachers/page.tsx",
    "src/app/[locale]/center/classes/page.tsx",
    "src/app/[locale]/center/students/page.tsx",
  ];
  it.each(pages)("%s · pas 'use client' au top", (file) => {
    const s = read(file);
    // Les pages doivent être Server Components
    expect(s).not.toMatch(/^"use client"/);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Roots Coach sessions security", () => {
  it("keeps session tables deny-by-default through Supabase Data API", () => {
    const migration = read("prisma/migrations/20260808223000_roots_coach_sessions/migration.sql");
    expect(migration).toContain('ALTER TABLE "roots_coach_sessions" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE "roots_coach_session_notes" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('REVOKE ALL ON TABLE "roots_coach_sessions" FROM anon, authenticated');
    expect(migration).toContain('REVOKE ALL ON TABLE "roots_coach_session_notes" FROM anon, authenticated');
  });

  it("derives coach scope server-side and protects mutations with same-origin", () => {
    const route = read("src/app/api/roots-coach/sessions/route.ts");
    const note = read("src/app/api/roots-coach/sessions/note/route.ts");
    expect(route).toContain("resolveRootsCoachActor");
    expect(route).toContain("assertRootsCoachChildAccess");
    expect(route).toContain("isSameOriginRequest(req)");
    expect(note).toContain("resolveRootsCoachActor");
    expect(note).toContain("isSameOriginRequest(req)");
  });

  it("never exposes private coach notes to Family", () => {
    const queries = read("src/lib/rootsCoach/sessions.ts");
    const familyRoute = read("src/app/api/family/sessions/route.ts");
    expect(queries).toContain('NULL::text AS "note"');
    expect(queries).toContain('c."parentUserId" = ${parentUserId}');
    expect(familyRoute).toContain("resolveFamilyGuardianActorOrNull");
    expect(familyRoute).toContain("listFamilyRootsSessions(actor.userId)");
  });

  it("replaces the three legacy session placeholders with live APIs", () => {
    const coachSessions = read("src/features/dashboards/coach-racines/sections/CoachSessionsSection.tsx");
    const coachNotes = read("src/features/dashboards/coach-racines/sections/CoachSessionNotesSection.tsx");
    const familySessions = read("src/features/dashboards/family/sections/FamilySessionsSection.tsx");
    expect(coachSessions).toContain('/api/roots-coach/sessions');
    expect(coachNotes).toContain('/api/roots-coach/sessions/note');
    expect(familySessions).toContain('/api/family/sessions');
    expect(coachSessions).not.toContain('t("soon")');
    expect(coachNotes).not.toContain('t("soon")');
    expect(familySessions).not.toContain('t("soon")');
  });
});

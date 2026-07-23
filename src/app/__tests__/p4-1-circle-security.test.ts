// P4.1 · Gardes structurelles sur schéma, migration, API, storage.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Prisma schema · P4.1 additions", () => {
  const src = read("prisma/schema.prisma");
  it("adds Circle model with immutable-language contract", () => {
    expect(src).toMatch(/^model Circle \{/m);
    expect(src).toMatch(/@@unique\(\[householdId, language\]\)/);
    // status enum limited to ACTIVE|ARCHIVED|SUSPENDED
    expect(src).toMatch(/enum CircleStatus\s*\{[^}]*ACTIVE[^}]*ARCHIVED[^}]*SUSPENDED[^}]*\}/);
  });
  it("adds CircleMembership with role + status enums", () => {
    expect(src).toMatch(/^model CircleMembership \{/m);
    expect(src).toMatch(/enum CircleRole\s*\{[^}]*OWNER[^}]*ADULT[^}]*CHILD[^}]*COACH[^}]*\}/);
    expect(src).toMatch(/enum CircleMembershipStatus\s*\{[^}]*INVITED[^}]*ACTIVE[^}]*SUSPENDED[^}]*REMOVED[^}]*\}/);
  });
  it("CircleMembership carries userId? XOR childProfileId? (nullable + FK)", () => {
    expect(src).toMatch(/userId\s+String\?/);
    expect(src).toMatch(/childProfileId\s+String\?/);
  });
  it("adds AuditEvent with AuditAction enum incl. cross-tenant + storage denials", () => {
    expect(src).toMatch(/^model AuditEvent \{/m);
    for (const action of [
      "CIRCLE_CREATED",
      "CIRCLE_ARCHIVED",
      "CIRCLE_MEMBERSHIP_INVITED",
      "CIRCLE_MEMBERSHIP_REVOKED",
      "CIRCLE_COACH_ASSIGNED",
      "CIRCLE_COACH_UNASSIGNED",
      "CHILD_ACCESS_DENIED",
      "CROSS_TENANT_ACCESS_DENIED",
      "STORAGE_ACCESS_DENIED",
      "ADMIN_BREAK_GLASS_USED",
    ]) {
      expect(src).toContain(action);
    }
  });
  it("adds StorageObject with private-only purposes", () => {
    expect(src).toMatch(/^model StorageObject \{/m);
    expect(src).toMatch(/enum StorageObjectPurpose\s*\{[^}]*SUBMISSION_AUDIO[^}]*FEEDBACK_AUDIO[^}]*CIRCLE_MESSAGE_AUDIO[^}]*CLASS_MESSAGE_AUDIO[^}]*ATTACHMENT[^}]*\}/);
  });
  it("adds AppRole.RACINES_COACH (distinct from CAREER_COACH)", () => {
    expect(src).toMatch(/AppRole\s*\{[^}]*RACINES_COACH/);
    // CAREER_COACH must still exist (backward compat)
    expect(src).toMatch(/AppRole\s*\{[^}]*CAREER_COACH/);
  });
  it("adds ProductCode.ROOTS_COACH_ADDON", () => {
    expect(src).toMatch(/ProductCode\s*\{[^}]*ROOTS_COACH_ADDON/);
  });
  it("adds child_profiles.householdId with SetNull FK", () => {
    expect(src).toMatch(/householdId\s+String\?/);
    expect(src).toMatch(/Household\?\s+@relation\("HouseholdChildren"[^)]*onDelete:\s*SetNull/);
  });
  it("users have @@index([centerId])", () => {
    expect(src).toMatch(/@@index\(\[centerId\]\)/);
  });
});

describe("Migration SQL · P4.1", () => {
  const sql = read("prisma/migrations/20260723_p4_1_circle_security/migration.sql");
  it("uses ADD VALUE IF NOT EXISTS for enum extensions (idempotent)", () => {
    expect(sql).toMatch(/ALTER TYPE "AppRole" ADD VALUE IF NOT EXISTS 'RACINES_COACH'/);
    expect(sql).toMatch(/ALTER TYPE "ProductCode" ADD VALUE IF NOT EXISTS 'ROOTS_COACH_ADDON'/);
  });
  it("adds CHECK XOR on circle_memberships (user_id XOR child_profile_id)", () => {
    expect(sql).toMatch(/CHECK \(\("userId" IS NULL\) <> \("childProfileId" IS NULL\)\)/);
  });
  it("adds partial unique index limiting active coach to one per circle", () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX "circle_memberships_one_active_coach_per_circle_key"[\s\S]*?WHERE "role" = 'COACH' AND "status" = 'ACTIVE'/);
  });
  it("enables RLS on all 4 new tables", () => {
    for (const table of ["circles", "circle_memberships", "audit_events", "storage_objects"]) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    }
  });
  it("creates helper functions with fixed search_path (SECURITY DEFINER)", () => {
    for (const fn of [
      "current_app_user_id",
      "is_household_member",
      "is_child_parent",
      "is_circle_member",
      "is_circle_owner",
      "is_circle_coach",
      "is_class_member",
      "is_center_admin",
      "is_yema_admin",
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}`));
    }
    expect(sql).toMatch(/SET search_path = public, pg_temp/);
  });
  it("no destructive statements (no DROP TABLE, no DROP COLUMN, no DROP TYPE)", () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/);
    expect(sql).not.toMatch(/\bDROP TYPE\b/);
  });
  it("audit_events select policy limited to yema_admin (never mass-readable)", () => {
    expect(sql).toMatch(/CREATE POLICY "audit_events_select_admin"[\s\S]*is_yema_admin/);
  });
});

describe("API routes · P4.1", () => {
  const createSrc = read("src/app/api/circles/route.ts");
  const getSrc = read("src/app/api/circles/[circleId]/route.ts");
  const archiveSrc = read("src/app/api/circles/[circleId]/archive/route.ts");
  it("POST /api/circles is gated by CIRCLE_ENABLED", () => {
    expect(createSrc).toMatch(/getFlag\("CIRCLE_ENABLED"\)/);
    expect(createSrc).toMatch(/status:\s*404/);
  });
  it("GET /api/circles/[id] is gated by CIRCLE_ENABLED", () => {
    expect(getSrc).toMatch(/getFlag\("CIRCLE_ENABLED"\)/);
  });
  it("archive is OWNER-only", () => {
    expect(archiveSrc).toMatch(/assertCircleOwner/);
  });
  it("POST wraps create+membership+audit in Serializable transaction", () => {
    expect(createSrc).toMatch(/isolationLevel:\s*"Serializable"/);
    expect(createSrc).toMatch(/writeAuditEvent/);
  });
  it("POST validates language against Prisma LanguageCode allowlist", () => {
    expect(createSrc).toMatch(/LANG_CODES/);
  });
  it("no route trusts userId from body/params for authority", () => {
    for (const s of [createSrc, getSrc, archiveSrc]) {
      expect(s).not.toMatch(/body\.\s*userId/);
      expect(s).not.toMatch(/params\.\s*userId/);
    }
  });
});

describe("Storage · P4.1 policies", () => {
  const src = read("src/lib/storage/objects.ts");
  it("short signed URL TTLs (< 15 min)", () => {
    expect(src).toMatch(/SIGNED_UPLOAD_TTL_SECONDS = 300/);
    expect(src).toMatch(/SIGNED_READ_TTL_SECONDS = 600/);
  });
  it("audio max duration 180s (3 min · Q6)", () => {
    expect(src).toMatch(/MAX_AUDIO_DURATION_SECONDS = 180/);
  });
  it("MIME allowlist strict", () => {
    expect(src).toMatch(/AUDIO_MIME_ALLOWLIST/);
    expect(src).toMatch(/ATTACHMENT_MIME_ALLOWLIST/);
  });
  it("Q7 retention · 90 j Circle audio · 12 mois productions/feedbacks", () => {
    expect(src).toMatch(/setDate\(d\.getDate\(\) \+ 90\)/);
    expect(src).toMatch(/setMonth\(d\.getMonth\(\) \+ 12\)/);
  });
  it("storagePathFor never uses client filename directly", () => {
    // Le path est construit à partir de sha256Prefix + rand + ext safe.
    expect(src).toMatch(/sha256Prefix\.replace/);
    expect(src).toMatch(/Math\.random\(\)\.toString\(36\)/);
  });
});

describe("Audit · P4.1 sanitization", () => {
  const src = read("src/lib/audit/events.ts");
  it("blacklist forbids storing body/audioUrl/token/etc.", () => {
    for (const key of ["body", "audioUrl", "signedUrl", "token", "password", "transcription"]) {
      expect(src).toContain(`"${key}"`);
    }
  });
  it("truncates overly long strings (>500 chars) to avoid leaking payloads", () => {
    expect(src).toMatch(/length > 500/);
  });
});

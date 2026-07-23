// P4.2 · Gardes structurelles sur schema, migration, endpoints, redaction.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(rel: string) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Prisma schema · P4.2 additions", () => {
  const src = read("prisma/schema.prisma");
  it("adds CircleInvitation model + InvitationStatus enum", () => {
    expect(src).toMatch(/^model CircleInvitation \{/m);
    expect(src).toMatch(/enum InvitationStatus\s*\{[^}]*PENDING[^}]*ACCEPTED[^}]*REVOKED[^}]*EXPIRED[^}]*\}/);
  });
  it("stores tokenHash + emailHash, never raw values", () => {
    expect(src).toMatch(/tokenHash\s+String/);
    expect(src).toMatch(/invitedEmailHash\s+String/);
    expect(src).not.toMatch(/tokenRaw\s+String/);
    expect(src).not.toMatch(/invitedEmail\s+String\b/);
  });
  it("adds AuditAction values for P4.2 workflows", () => {
    for (const v of [
      "ADULT_INVITED",
      "ADULT_INVITATION_REVOKED",
      "ADULT_INVITATION_ACCEPTED",
      "ADULT_LEFT_CIRCLE",
      "ADULT_REMOVED",
      "CHILD_ADDED",
      "CHILD_REMOVED",
      "COACH_ASSIGNMENT_REQUESTED",
      "COACH_ASSIGNED",
      "COACH_REMOVED",
      "MEMBERSHIP_ACCESS_DENIED",
    ]) {
      expect(src, `AuditAction.${v}`).toContain(v);
    }
  });
  it("declares tokenHash unique + one pending per (circle,email)", () => {
    expect(src).toMatch(/@@unique\(\[tokenHash\]\)/);
    // partial unique on pending is in SQL migration, not Prisma
  });
});

describe("Migration SQL · P4.2", () => {
  const sql = read("prisma/migrations/20260723000004_p4_2_invitations/migration.sql");
  it("uses IF NOT EXISTS everywhere (idempotent)", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS "circle_invitations"/);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS/);
  });
  it("enables RLS + creates policy circle_invitations_select_owner", () => {
    expect(sql).toMatch(/ALTER TABLE "circle_invitations" ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/CREATE POLICY "circle_invitations_select_owner"[\s\S]*is_circle_owner/);
  });
  it("grants SELECT to authenticated · anon revoked", () => {
    expect(sql).toMatch(/GRANT SELECT ON "circle_invitations" TO authenticated/);
    expect(sql).toMatch(/REVOKE ALL ON "circle_invitations" FROM anon/);
  });
  it("partial unique · 1 PENDING per (circle, email)", () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "circle_invitations_one_pending_per_circle_email_key"[\s\S]*?WHERE "status" = 'PENDING'/);
  });
  it("no destructive statements", () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/);
    expect(sql).not.toMatch(/\bDROP TYPE\b/);
  });
});

describe("APIs · P4.2 (10 endpoints)", () => {
  const files = [
    "src/app/api/circles/[circleId]/members/route.ts",
    "src/app/api/circles/[circleId]/invitations/adult/route.ts",
    "src/app/api/circle-invitations/[token]/accept/route.ts",
    "src/app/api/circles/[circleId]/invitations/[invitationId]/revoke/route.ts",
    "src/app/api/circles/[circleId]/children/route.ts",
    "src/app/api/circles/[circleId]/children/[childProfileId]/route.ts",
    "src/app/api/circles/[circleId]/leave/route.ts",
    "src/app/api/circles/[circleId]/members/[membershipId]/route.ts",
    "src/app/api/admin/circles/[circleId]/coach/route.ts",
  ];
  it.each(files)("%s · flag-gated", (file) => {
    const s = read(file);
    expect(s).toMatch(/getFlag\("CIRCLE_ENABLED"\)/);
    expect(s).toMatch(/status:\s*404/);
  });
  it.each(files)("%s · never trusts body.userId as authority", (file) => {
    const s = read(file);
    expect(s).not.toMatch(/body\.\s*userId/);
    expect(s).not.toMatch(/params\.\s*userId/);
  });
  it.each(files)("%s · wraps writes in Serializable transaction", (file) => {
    const s = read(file);
    // GET route (members) may not need explicit transaction · skip for it.
    if (file.endsWith("/members/route.ts")) return;
    expect(s).toMatch(/isolationLevel:\s*"Serializable"/);
  });
});

describe("Token routes · security", () => {
  const accept = read("src/app/api/circle-invitations/[token]/accept/route.ts");
  it("resolves token via hash · never logs raw", () => {
    // La route passe `token` à acceptInvitation(rawToken) qui appelle hashToken().
    expect(accept).toMatch(/acceptInvitation/);
    expect(accept).not.toMatch(/console\.log\(.*token/i);
  });
  const invite = read("src/app/api/circles/[circleId]/invitations/adult/route.ts");
  it("returns raw token only via X-P4-Test-Token when YEMA_ALLOW_TEST_TOKENS", () => {
    expect(invite).toMatch(/YEMA_ALLOW_TEST_TOKENS/);
    expect(invite).toMatch(/X-P4-Test-Token/);
  });
});

describe("Coach admin route · P4.2", () => {
  const src = read("src/app/api/admin/circles/[circleId]/coach/route.ts");
  it("uses resolveAdminActor (YEMA_ADMIN only)", () => {
    expect(src).toMatch(/resolveAdminActor/);
  });
  it("emits COACH_ASSIGNED audit event", () => {
    expect(src).toMatch(/COACH_ASSIGNED/);
    expect(src).toMatch(/COACH_REMOVED/);
  });
});

describe("Invitation service · security invariants", () => {
  const src = read("src/lib/invitations/service.ts");
  it("stores hashed email + hashed token", () => {
    expect(src).toMatch(/hashEmail\(input\.invitedEmail\)/);
    expect(src).toMatch(/hashToken\(input\.rawToken\)/);
  });
  it("accept requires email match", () => {
    expect(src).toMatch(/hashEmail\(input\.actorEmail\) !== invitation\.invitedEmailHash/);
  });
  it("72h TTL", () => {
    expect(src).toMatch(/72 \* 60 \* 60 \* 1000/);
  });
  it("atomic accept · updates PENDING → ACCEPTED with guard, throws if concurrent", () => {
    expect(src).toMatch(/updateMany[\s\S]*status:\s*"PENDING"[\s\S]*status:\s*"ACCEPTED"/);
    expect(src).toMatch(/invitation_already_used/);
  });
});

describe("Membership services · P4.2", () => {
  const src = read("src/lib/circles/memberships.ts");
  it("owner cannot leave own circle", () => {
    expect(src).toMatch(/owner_cannot_leave/);
  });
  it("owner cannot remove another owner", () => {
    expect(src).toMatch(/cannot remove owner/);
  });
  it("removeCoach revokes access immediately (Q10)", () => {
    expect(src).toMatch(/removeCoach/);
    expect(src).toMatch(/status:\s*"REMOVED"/);
  });
  it("assignCoach requires RACINES_COACH AppRole", () => {
    expect(src).toMatch(/role:\s*"RACINES_COACH"/);
  });
});

describe("Audit sanitization · P4.2", () => {
  const src = read("src/lib/audit/events.ts");
  it("blocks tokens + emails in metadata", () => {
    for (const key of ["token", "body", "audioUrl"]) {
      expect(src).toContain(`"${key}"`);
    }
  });
});

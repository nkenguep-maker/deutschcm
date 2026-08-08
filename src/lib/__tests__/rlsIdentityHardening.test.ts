import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260808000001_p4_7_rls_identity_hardening/migration.sql",
  ),
  "utf8",
);
const realtimeInitplanMigration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260808094837_p4_7_realtime_rls_initplan/migration.sql",
  ),
  "utf8",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

describe("P4.7 · RLS identity hardening", () => {
  it("moves internal authorization helpers outside the exposed public schema", () => {
    expect(migration).toContain("CREATE SCHEMA IF NOT EXISTS private");
    expect(migration).toContain("ALTER FUNCTION public.");
    expect(migration).toContain("SET SCHEMA private");
    expect(migration).toContain("REVOKE ALL ON SCHEMA private FROM PUBLIC");
    expect(migration).toContain("GRANT USAGE ON SCHEMA private TO authenticated, service_role");
  });

  it("maps Supabase auth identity to the YEMA application user id", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION private.current_app_user_id()");
    expect(migration).toContain('u."supabaseId" = (SELECT auth.uid())::text');
    expect(migration).toContain("SET search_path = ''");
  });

  it("never uses auth.uid directly as a P4.5 application user id", () => {
    expect(migration).not.toContain('"userId" = auth.uid()::text');
    expect(migration).not.toContain('"parentUserId" = auth.uid()::text');
    expect(migration).not.toContain('"authorCoachUserId" = auth.uid()::text');
    expect(migration).not.toContain('t."userId" = auth.uid()::text');
    expect(migration).toContain('"userId" = private.current_app_user_id()');
    expect(migration).toContain('"parentUserId" = private.current_app_user_id()');
  });

  it("binds Realtime authorization to the actual JWT uid", () => {
    expect(migration).toContain("_supabase_uid = (SELECT auth.uid())");
    expect(migration).toContain("private.messaging_can_access_conversation(");
    expect(migration).toContain("private.messaging_is_inbox_owner(");
    expect(migration).toContain("private.messaging_topic_kind(realtime.topic())");
  });

  it("caches Realtime auth.uid per statement without changing policy scope", () => {
    expect(realtimeInitplanMigration).toContain(
      'DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized"',
    );
    expect(realtimeInitplanMigration).toContain(
      'DROP POLICY IF EXISTS "messaging_realtime_receive_authorized"',
    );
    expect(realtimeInitplanMigration).toContain("(SELECT auth.uid())");
    expect(realtimeInitplanMigration).toContain("private.messaging_can_access_conversation(");
    expect(realtimeInitplanMigration).toContain("private.messaging_is_inbox_owner(");
    expect(realtimeInitplanMigration).toContain("TO authenticated");
    expect(realtimeInitplanMigration).not.toMatch(/(?<!SELECT )auth\.uid\(\)/);
  });

  it("keeps child profiles deny-by-default instead of relying on auth.role", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "child_profiles_service_only"');
    expect(executableSql).not.toContain("auth.role()");
  });
});

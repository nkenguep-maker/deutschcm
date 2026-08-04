import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-B.4 · invariants de la commande verify + rattachement Prisma E2E.

const ROOT = resolve(__dirname, "../..");
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

describe("verify-realtime-authorization.mjs · fail-closed strict", () => {
  const src = readRepo("scripts/verify-realtime-authorization.mjs");

  it("hardcode P-1 ref + blocklist 3 refs interdites", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/"sbjhvlrkbyjckdxujjsk"/);
    expect(src).toMatch(/"mamofhrurksyuuolucea"/);
    expect(src).toMatch(/"qggwvonfumuimjfsgpdz"/);
  });

  it("EXPECTED_FUNCTIONS · 4 fonctions helpers messagerie", () => {
    for (const fn of [
      "messaging_can_access_conversation",
      "messaging_is_inbox_owner",
      "messaging_topic_kind",
      "messaging_topic_id",
    ]) {
      expect(src).toMatch(new RegExp(`"${fn}"`));
    }
  });

  it("EXPECTED_POLICIES · SELECT + Presence INSERT (aucune Broadcast INSERT)", () => {
    expect(src).toMatch(/\["messaging_realtime_receive_authorized",\s*"SELECT"\]/);
    expect(src).toMatch(/\["messaging_realtime_presence_send_authorized",\s*"INSERT"\]/);
    // La map n'a que 2 entrées · vérifié structurellement.
    const mapMatch = src.match(/const EXPECTED_POLICIES = new Map\(\[([\s\S]*?)\]\);/);
    expect(mapMatch).toBeTruthy();
    const entryCount = (mapMatch![1].match(/\["messaging_/g) || []).length;
    expect(entryCount).toBe(2);
  });

  it("FORBIDDEN_POLICY_NAMES contient l'ancien deny_client", () => {
    expect(src).toMatch(/FORBIDDEN_POLICY_NAMES[\s\S]*?"messaging_realtime_send_deny_client"/);
  });

  it("refuse toute policy accessible au rôle anon", () => {
    // P4.6-B.4 · regex renforcé pour matcher exactement '{anon' ou ',anon}'.
    expect(src).toMatch(/anon/);
    expect(src).toMatch(/policy accessible au rôle anon/);
  });

  it("fail(msg) fait process.exit(1) · printFallback exit(2)", () => {
    expect(src).toMatch(/function fail\(msg\)[\s\S]*?process\.exit\(1\)/);
    expect(src).toMatch(/function printFallback[\s\S]*?process\.exit\(2\)/);
  });

  it("PAT jamais loggé", () => {
    // Le PAT est lu via readPAT() mais jamais console.log.
    expect(src).not.toMatch(/console\.(log|error)\([^)]*pat\b/);
  });
});

describe("package.json · commandes P4.6-B.3/B.4", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  it("verify:messaging-realtime:p1 défini", () => {
    expect(pkg.scripts["verify:messaging-realtime:p1"]).toBe(
      "node scripts/verify-realtime-authorization.mjs",
    );
  });
  it("test:messaging-realtime:p1 défini (non-skippable)", () => {
    expect(pkg.scripts["test:messaging-realtime:p1"]).toBe(
      "node scripts/test-messaging-realtime-p1.mjs",
    );
  });
});

describe("messaging-fixtures · rattachement E2E opt-in idempotent", () => {
  const src = readRepo("scripts/test-baseline/messaging-fixtures.mjs");

  it("ensureE2ELinkage lit E2E_TEACHER/STUDENT/OUTSIDER_EMAIL", () => {
    expect(src).toMatch(/E2E_TEACHER_EMAIL/);
    expect(src).toMatch(/E2E_STUDENT_EMAIL/);
    expect(src).toMatch(/E2E_OUTSIDER_EMAIL/);
  });

  it("skip proprement si envs absents (fixtures QA normales continuent)", () => {
    expect(src).toMatch(/if \(!teacherEmail \|\| !studentEmail \|\| !outsiderEmail\)[\s\S]*?skip rattachement/);
  });

  it("Teacher + Student upsertés participants t_em_en (MODERATOR + MEMBER)", () => {
    expect(src).toMatch(/conversationId:\s*conversations\.t_em_en[\s\S]*?participantRole:\s*"MODERATOR"/);
    expect(src).toMatch(/conversationId:\s*conversations\.t_em_en[\s\S]*?participantRole:\s*"MEMBER"/);
  });

  it("Outsider · aucune participation active (leftAt forcé si trouvé)", () => {
    expect(src).toMatch(/outsiderInConv[\s\S]*?leftAt:\s*now/);
    expect(src).toMatch(/outsider avait un participant actif · marqué leftAt/);
  });

  it("resolveSupabaseIdByEmail · via SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(src).toMatch(/\/auth\/v1\/admin\/users\?filter=\$\{encodeURIComponent\(email\)\}/);
  });

  it("ensurePrismaUserForAuth · upsert par email idempotent", () => {
    expect(src).toMatch(/db\.user\.upsert/);
    expect(src).toMatch(/where:\s*\{\s*email\s*\}/);
    expect(src).toMatch(/supabaseId:\s*supId/);
  });

  it("assertNonProduction en tête · Production toujours refusée", () => {
    expect(src).toMatch(/assertNonProduction\(\)/);
  });
});

describe("scripts/sql/p4-6-b-realtime-policies-p1.sql · paste-ready SQL Editor", () => {
  const sql = readRepo("scripts/sql/p4-6-b-realtime-policies-p1.sql");
  const nonComment = sql.replace(/^\s*--.*$/gm, "");

  it("4 fonctions helper + 2 policies + DROP legacy · rien d'autre de structurel", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_can_access_conversation/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_is_inbox_owner/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_topic_kind/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_topic_id/);
    expect(sql).toMatch(/CREATE POLICY "messaging_realtime_receive_authorized"/);
    expect(sql).toMatch(/CREATE POLICY "messaging_realtime_presence_send_authorized"/);
    expect(sql).toMatch(/extension\s*=\s*'presence'/);
  });

  it("aucun ALTER TABLE / ALTER OWNER / SET ROLE (hors commentaires)", () => {
    expect(nonComment).not.toMatch(/ALTER TABLE[^;]*realtime\.messages/);
    expect(nonComment).not.toMatch(/ALTER OWNER/);
    expect(nonComment).not.toMatch(/SET ROLE\s+supabase_realtime_admin/);
    // Aucune commande DDL sur realtime autre que CREATE/DROP POLICY.
    expect(nonComment).not.toMatch(/GRANT\s+.*ON\s+realtime\.messages/);
    expect(nonComment).not.toMatch(/REVOKE\s+.*ON\s+realtime\.messages/);
  });

  it("idempotent · DROP POLICY IF EXISTS pour les 4 noms (legacy + finaux)", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_subscribe"/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_send_deny_client"/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_receive_authorized"/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized"/);
  });

  it("directement collable · aucune référence à un chemin de fichier ni à Prisma", () => {
    expect(sql).not.toMatch(/prisma migrate|npx prisma|node scripts\//);
    expect(sql).not.toMatch(/prisma\/migrations/);
  });
});

describe("verify command · résultats attendus documentés", () => {
  const src = readRepo("scripts/verify-realtime-authorization.mjs");

  it("READONLY_SQL check RLS + fonctions + policies", () => {
    expect(src).toMatch(/relrowsecurity AS rls_enabled/);
    expect(src).toMatch(/FROM pg_proc/);
    expect(src).toMatch(/FROM pg_policies/);
    expect(src).toMatch(/policyname LIKE 'messaging_%'/);
  });

  it("output OK cite RLS=on + compte fonctions + compte policies + audit anon", () => {
    expect(src).toMatch(/RLS=on[\s\S]*?fonctions[\s\S]*?policies attendues[\s\S]*?aucune policy Broadcast[\s\S]*?aucune policy anon/);
  });
});

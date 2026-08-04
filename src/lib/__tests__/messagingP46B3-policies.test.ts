import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-B.3 · invariants finaux d'autorisation Realtime.
//
// Ces tests structurels verrouillent le contenu SQL de la migration +
// le comportement du runbook + la commande obligatoire. Ils empêchent
// une régression qui recréerait une policy Broadcast INSERT permissive.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, "..", rel), "utf-8");
}

const MIGRATION = readRepo("prisma/migrations/20260731000003_p4_6_b_2_realtime_authorization/migration.sql");

describe("Migration SQL · policies séparées (SELECT / Presence-INSERT)", () => {
  it("policy SELECT unique et clairement nommée · messaging_realtime_receive_authorized", () => {
    expect(MIGRATION).toMatch(/CREATE POLICY "messaging_realtime_receive_authorized" ON realtime\.messages/);
    expect(MIGRATION).toMatch(/FOR SELECT\s+TO authenticated/);
  });

  it("policy Presence INSERT sur msg:conv:* uniquement · messaging_realtime_presence_send_authorized", () => {
    expect(MIGRATION).toMatch(/CREATE POLICY "messaging_realtime_presence_send_authorized" ON realtime\.messages/);
    expect(MIGRATION).toMatch(/FOR INSERT\s+TO authenticated/);
    expect(MIGRATION).toMatch(/extension\s*=\s*['"]presence['"]/);
    expect(MIGRATION).toMatch(/messaging_topic_kind\(realtime\.topic\(\)\)\s*=\s*['"]conv['"]/);
    expect(MIGRATION).toMatch(/messaging_can_access_conversation/);
  });

  it("AUCUNE policy Broadcast INSERT permissive · ni deny_client, ni WITH CHECK(false)", () => {
    // La doctrine finale · l'ABSENCE d'une policy permissive INSERT
    // pour extension = 'broadcast' est ce qui refuse l'émission client.
    expect(MIGRATION).not.toMatch(/CREATE POLICY[^;]*messaging_realtime_send_deny_client/);
    expect(MIGRATION).not.toMatch(/extension\s*=\s*['"]broadcast['"]/);
    // Toutes les DROP legacy sont explicites (P4.6-B.2 v1 nettoyage) ·
    // acceptable · elles ne créent aucune policy.
  });

  it("aucune policy INSERT permissive globale · seule Presence est ouverte", () => {
    // Chercher toute policy FOR INSERT qui ne contienne pas
    // extension='presence' · doit être absente.
    const insertPolicies = MIGRATION.match(/CREATE POLICY[\s\S]*?FOR INSERT[\s\S]*?WITH CHECK\s*\([\s\S]*?\);/g) ?? [];
    for (const p of insertPolicies) {
      expect(p).toMatch(/extension\s*=\s*['"]presence['"]/);
    }
    // Au moins 1 policy INSERT présente (Presence)
    expect(insertPolicies.length).toBeGreaterThanOrEqual(1);
  });

  it("msg:inbox:child:* refusé (SELECT retourne false)", () => {
    expect(MIGRATION).toMatch(/WHEN 'inbox_child' THEN[\s\S]*?false/);
  });

  it("helpers messaging_can_access_conversation + messaging_is_inbox_owner présents", () => {
    expect(MIGRATION).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_can_access_conversation/);
    expect(MIGRATION).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_is_inbox_owner/);
    expect(MIGRATION).toMatch(/STABLE\s*\n\s*SECURITY DEFINER/);
  });

  it("idempotent · DROP POLICY IF EXISTS pour les 4 noms (P4.6-B.2 v1 + P4.6-B.3)", () => {
    expect(MIGRATION).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_subscribe"/);
    expect(MIGRATION).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_send_deny_client"/);
    expect(MIGRATION).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_receive_authorized"/);
    expect(MIGRATION).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized"/);
  });

  it("aucun ALTER TABLE / ALTER OWNER / SET ROLE supabase_realtime_admin sur realtime.messages", () => {
    // P4.6-B.4 correction · RLS déjà activée par défaut sur Supabase ·
    // le rôle postgres du pooler ne peut pas modifier realtime.messages
    // (42501 · owner=supabase_realtime_admin). Aucune commande structurelle
    // ne doit apparaître dans la migration (hors commentaires).
    const nonComment = MIGRATION.replace(/^\s*--.*$/gm, "");
    expect(nonComment).not.toMatch(/ALTER TABLE[^;]*realtime\.messages/);
    expect(nonComment).not.toMatch(/ALTER OWNER/);
    expect(nonComment).not.toMatch(/SET ROLE supabase_realtime_admin/);
  });

  it("commentaires de vérification READ-ONLY inclus (runbook inline)", () => {
    expect(MIGRATION).toMatch(/SELECT policyname, cmd, roles, qual, with_check/);
    expect(MIGRATION).toMatch(/SELECT relrowsecurity/);
    expect(MIGRATION).toMatch(/messaging_realtime_receive_authorized\s+\(SELECT\)/);
    expect(MIGRATION).toMatch(/messaging_realtime_presence_send_authorized\s+\(INSERT\)/);
  });
});

describe("Runbook apply-realtime-authorization.mjs · sécurité + verify", () => {
  const src = readRepo("scripts/apply-realtime-authorization.mjs");

  it("refuse toute ref !== P-1 + blocklist 3 refs interdites", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/"sbjhvlrkbyjckdxujjsk"/);
    expect(src).toMatch(/"mamofhrurksyuuolucea"/);
    expect(src).toMatch(/"qggwvonfumuimjfsgpdz"/);
  });

  it("mode --verify · SQL read-only pg_policies + pg_class + pg_proc", () => {
    expect(src).toMatch(/VERIFY_SQL/);
    expect(src).toMatch(/pg_policies/);
    expect(src).toMatch(/relrowsecurity/);
    expect(src).toMatch(/pg_proc/);
  });

  it("PAT jamais loggé · fallback dashboard runbook si 403", () => {
    // Le PAT sbp_* est masqué · l'échec 403 propose le SQL Editor.
    expect(src).toMatch(/MANUAL APPLY REQUIRED[\s·]*Supabase Dashboard SQL Editor/);
    expect(src).not.toMatch(/console\.log\([^)]*pat\)/i);
  });
});

describe("Provisioning script · fail-closed + no password log", () => {
  const src = readRepo("scripts/provision-e2e-realtime-users.mjs");

  it("exige les 6 variables E2E + refuse ref non-P1", () => {
    for (const v of ["E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD", "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD", "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD"]) {
      expect(src).toMatch(new RegExp(`"${v}"`));
    }
    expect(src).toMatch(/assertP1/);
    expect(src).toMatch(/kzzagbojjkivdzzcrmxn/);
  });

  it("aucun hardcode password + aucun console.log(password)", () => {
    // Pas de console.log qui log les passwords · check basique.
    expect(src).not.toMatch(/console\.log\([^)]*password[^)]*\)/i);
    expect(src).not.toMatch(/password:\s*['"]hardcoded/i);
  });

  it("idempotent · check préalable puis fallback create", () => {
    expect(src).toMatch(/filter=\$\{encodeURIComponent\(email\)\}/);
    expect(src).toMatch(/existed:\s*true/);
  });
});

describe("Commande obligatoire test:messaging-realtime:p1", () => {
  const scriptSrc = readRepo("scripts/test-messaging-realtime-p1.mjs");
  const pkg = JSON.parse(readRepo("package.json"));

  it("script vérifie 6 credentials et exit(2) si absent (NON-SKIPPABLE)", () => {
    for (const v of ["E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD", "E2E_STUDENT_EMAIL", "E2E_STUDENT_PASSWORD", "E2E_OUTSIDER_EMAIL", "E2E_OUTSIDER_PASSWORD"]) {
      expect(scriptSrc).toMatch(new RegExp(`"${v}"`));
    }
    expect(scriptSrc).toMatch(/NON-SKIPPABLE/);
    expect(scriptSrc).toMatch(/process\.exit\(code\)/);
  });

  it("refuse Supabase URL non-P1", () => {
    expect(scriptSrc).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(scriptSrc).toMatch(/URL Supabase n'est pas P-1/);
  });

  it("passe par le wrapper P-1 + config Playwright dédiée", () => {
    expect(scriptSrc).toMatch(/scripts\/test-baseline\/run-p4-5-b2-p1\.mjs/);
    expect(scriptSrc).toMatch(/playwright\.p4-6-b-2-realtime\.config\.ts/);
    expect(scriptSrc).toMatch(/--flag[\s"',]+on/);
  });

  it("npm script test:messaging-realtime:p1 défini", () => {
    expect(pkg.scripts["test:messaging-realtime:p1"]).toBeTruthy();
    expect(pkg.scripts["test:messaging-realtime:p1"]).toMatch(/scripts\/test-messaging-realtime-p1\.mjs/);
  });
});

describe("E2E spec P4.6-B.3 · scénarios obligatoires", () => {
  const src = readRepo("tests/e2e/p4-6-b-2-realtime/realtime-two-contexts.spec.ts");

  it("scénario 3 Outsider présent (avec creds OUTSIDER) · pas juste 'redirect login'", () => {
    expect(src).toMatch(/E2E_OUTSIDER_EMAIL/);
    expect(src).toMatch(/Outsider authentifié ne voit AUCUN message/);
  });

  it("mesure latence Teacher → Student loggée", () => {
    expect(src).toMatch(/\[latency\]\s*Teacher\s*→\s*Student/);
  });

  it("mesure latence Student → Teacher loggée", () => {
    expect(src).toMatch(/\[latency\]\s*Student\s*→\s*Teacher/);
  });

  it("mesure latence typing loggée", () => {
    expect(src).toMatch(/\[latency\]\s*typing indicator/);
  });

  it("skip global uniquement si CREDENTIALS_READY=false (fallback dev local)", () => {
    expect(src).toMatch(/test\.skip\(\s*!CREDENTIALS_READY/);
  });
});

describe("Sécurité additionnelle · Broadcast serveur-only vérifiable côté code", () => {
  const publisher = read("lib/messaging/realtimePublisher.ts");
  const hook = read("features/messaging/hooks/useMessagingRealtime.ts");

  it("client ne construit jamais un event broadcast à envoyer", () => {
    // Le hook client ne doit contenir aucun `ch.send({ type: "broadcast" ... })`.
    expect(hook).not.toMatch(/\.send\(\s*\{\s*type:\s*["']broadcast["']/);
  });

  it("publisher utilise SERVICE_ROLE (bypass RLS obligatoire pour émission)", () => {
    expect(publisher).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(publisher).toMatch(/\.send\(\s*\{\s*type:\s*["']broadcast["']/);
  });
});

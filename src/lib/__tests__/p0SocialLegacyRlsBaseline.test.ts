import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

const migration = read(
  "prisma/migrations/20260919000007_p0_7_social_notifications_legacy_rls_baseline/migration.sql",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const TABLES = [
  "notifications",
  "user_connections",
  "threads",
  "messages",
  "badges",
  "user_badges",
];

describe("P0.7 · social/notifications/legacy RLS baseline", () => {
  it("enables RLS on all six target tables", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps direct client table access deny-by-default", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(executableSql).not.toMatch(
        new RegExp(`CREATE\\s+POLICY[\\s\\S]*?ON\\s+public\\.${table}\\b`, "i"),
      );
    }
  });

  it("preserves the trusted Prisma server path", () => {
    expect(executableSql).not.toContain("FORCE ROW LEVEL SECURITY");
    expect(executableSql).not.toMatch(
      /GRANT\s+.+\s+TO\s+(?:anon|authenticated)\b/i,
    );
  });
});

describe("legacy in-app notification authorization", () => {
  const route = read("src/app/api/notifications/inapp/route.ts");

  it("requires same-origin for notification mutations", () => {
    expect(route).toContain("isSameOriginRequest(req)");
    expect(route).toContain('status: 403');
  });

  it("scopes a single notification update to the authenticated owner", () => {
    expect(route).toContain("prisma.notification.updateMany");
    expect(route).toContain("where: { id: notificationId, userId: profile.id }");
    expect(route).not.toContain("prisma.notification.update({");
  });

  it("keeps mark-all scoped to the authenticated owner", () => {
    expect(route).toContain("where: { userId: profile.id, isRead: false }");
  });
});

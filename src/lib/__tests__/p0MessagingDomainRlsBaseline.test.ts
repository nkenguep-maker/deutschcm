import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const migration = readFileSync(
  resolve(
    REPO,
    "prisma/migrations/20260919000006_p0_6_messaging_domain_rls_baseline/migration.sql",
  ),
  "utf8",
);
const executableSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const TABLES = [
  "messaging_conversations",
  "messaging_conversation_participants",
  "messaging_conversation_read_states",
  "messaging_messages",
  "messaging_message_attachments",
  "messaging_message_receipts",
  "messaging_guided_phrases",
  "messaging_moderation_actions",
  "messaging_audio_assets",
];

describe("P0.6 · messaging domain RLS baseline", () => {
  it("enables RLS on all nine public messaging tables", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }
  });

  it("keeps direct public-table client access deny-by-default", () => {
    for (const table of TABLES) {
      expect(executableSql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(executableSql).not.toMatch(
        new RegExp(`CREATE\\s+POLICY[\\s\\S]*?ON\\s+public\\.${table}\\b`, "i"),
      );
    }
  });

  it("does not disturb the separate Realtime authorization layer", () => {
    expect(executableSql).not.toMatch(/realtime\.messages/i);
    expect(executableSql).not.toMatch(/storage\.objects/i);
  });

  it("preserves the trusted Prisma server path", () => {
    expect(executableSql).not.toContain("FORCE ROW LEVEL SECURITY");
    expect(executableSql).not.toMatch(
      /GRANT\s+.+\s+TO\s+(?:anon|authenticated)\b/i,
    );
  });
});

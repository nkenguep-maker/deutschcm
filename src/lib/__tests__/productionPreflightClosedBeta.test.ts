import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const script = resolve(REPO, "scripts/preflight-release-prod.mjs");

const BASE_ENV = {
  ...process.env,
  VERCEL_ENV: "production",
  YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
  YEMA_MESSAGING_ENABLED: "true",
  YEMA_MESSAGE_AUDIO_ENABLED: "true",
  YEMA_COACH_WORKSPACE_ENABLED: "true",
  YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
  YEMA_CHILD_SESSION_SECRET: "ci-only-child-session-secret",
};

function run(extra: Record<string, string | undefined>) {
  const env = { ...BASE_ENV, ...extra } as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) delete env[key];
  }
  return spawnSync(process.execPath, [script], {
    cwd: REPO,
    env,
    encoding: "utf8",
  });
}

describe("production preflight · closed beta", () => {
  it("does not require an invitation secret when closed beta is disabled", () => {
    const result = run({
      YEMA_CLOSED_BETA_ENABLED: "false",
      YEMA_BETA_INVITE_SECRET: undefined,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[preflight-release-prod] OK");
  });

  it("fails closed when beta is enabled without an invitation secret", () => {
    const result = run({
      YEMA_CLOSED_BETA_ENABLED: "true",
      YEMA_BETA_INVITE_SECRET: undefined,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("YEMA_BETA_INVITE_SECRET");
  });

  it("rejects an invitation secret shorter than 32 characters", () => {
    const secret = "short-beta-secret";
    const result = run({
      YEMA_CLOSED_BETA_ENABLED: "true",
      YEMA_BETA_INVITE_SECRET: secret,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("YEMA_BETA_INVITE_SECRET");
    expect(result.stderr).not.toContain(secret);
  });

  it("accepts closed beta with a 32+ character invitation secret", () => {
    const secret = "0123456789abcdef0123456789abcdef";
    const result = run({
      YEMA_CLOSED_BETA_ENABLED: "true",
      YEMA_BETA_INVITE_SECRET: secret,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[preflight-release-prod] OK");
    expect(result.stdout).not.toContain(secret);
    expect(result.stderr).not.toContain(secret);
  });
});

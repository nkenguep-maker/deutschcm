import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const script = resolve(REPO, "scripts/preflight-closed-beta-prod.mjs");
const secret = "0123456789abcdef0123456789abcdef";

const BASE_ENV = {
  ...process.env,
  VERCEL_ENV: "production",
  YEMA_DASHBOARD_REDESIGN_ENABLED: "true",
  YEMA_MESSAGING_ENABLED: "true",
  YEMA_MESSAGE_AUDIO_ENABLED: "true",
  YEMA_COACH_WORKSPACE_ENABLED: "true",
  YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
  YEMA_CHILD_SESSION_SECRET: "ci-only-child-session-secret",
  YEMA_BETA_INVITE_SECRET: secret,
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

describe("closed-beta production activation preflight", () => {
  it("refuses an omitted closed-beta flag", () => {
    const result = run({ YEMA_CLOSED_BETA_ENABLED: undefined });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("YEMA_CLOSED_BETA_ENABLED");
  });

  it("refuses an explicit false closed-beta flag", () => {
    const result = run({ YEMA_CLOSED_BETA_ENABLED: "false" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must be explicitly true");
  });

  it("refuses a missing or weak invite secret without logging its value", () => {
    const weak = "weak-secret";
    const result = run({
      YEMA_CLOSED_BETA_ENABLED: "true",
      YEMA_BETA_INVITE_SECRET: weak,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("YEMA_BETA_INVITE_SECRET");
    expect(result.stderr).not.toContain(weak);
  });

  it("passes only when both the dedicated and generic production gates pass", () => {
    const result = run({ YEMA_CLOSED_BETA_ENABLED: "true" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[preflight-release-prod] OK");
    expect(result.stdout).toContain("[preflight-closed-beta-prod] OK");
    expect(result.stdout).not.toContain(secret);
    expect(result.stderr).not.toContain(secret);
  });
});

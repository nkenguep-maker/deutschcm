import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const entry = readFileSync(resolve(REPO, "scripts/test-personas-p1.mjs"), "utf8");
const safeRunner = readFileSync(resolve(REPO, "scripts/orchestrate-personas-safe-p1.mjs"), "utf8");
const personaRunner = readFileSync(resolve(REPO, "scripts/orchestrate-personas-p1.mjs"), "utf8");
const adultPersonaVerifier = readFileSync(resolve(REPO, "scripts/verify-adult-persona-routes-p1.mjs"), "utf8");
const childRacinesVerifier = readFileSync(resolve(REPO, "scripts/verify-child-racines-session-p1.mjs"), "utf8");
const credentialAligner = readFileSync(resolve(REPO, "scripts/test-baseline/align-yema-qa-passwords-p1.mjs"), "utf8");

describe("P-1 persona QA runner safety", () => {
  it("routes the authenticated gate through the fail-closed fixture wrapper", () => {
    expect(entry).toContain('"node", "scripts/orchestrate-personas-safe-p1.mjs"');
    expect(entry).toContain('"scripts/test-baseline/run-p4-5-b2-p1.mjs"');
    expect(entry).not.toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(safeRunner).toContain("scripts/test-baseline/align-yema-qa-passwords-p1.mjs");
  });

  it("fails before persona execution when fixture provisioning fails", () => {
    expect(safeRunner).toContain("fixture provisioning failed");
    expect(safeRunner).toContain("failed(prep)");
    expect(safeRunner.indexOf("fixture provisioning failed")).toBeLessThan(
      safeRunner.indexOf("authenticated 9-persona QA"),
    );
  });

  it("fails closed if the inner persona runner fixture provisioning fails", () => {
    expect(personaRunner).toContain("const fixturePrep = spawnSync");
    expect(personaRunner).toMatch(/fixturePrep\.error \|\| fixturePrep\.signal \|\| fixturePrep\.status !== 0/);
    expect(personaRunner).toContain("fixture provisioning failed");
    expect(personaRunner.indexOf("fixture provisioning failed")).toBeLessThan(
      personaRunner.indexOf("next start port"),
    );
  });

  it("attempts idempotent fixture recovery after provisioning failure", () => {
    expect(safeRunner).toContain("attemptFixtureRecovery");
    expect(safeRunner).toContain('attemptFixtureRecovery("provisioning failure")');
    expect(safeRunner).toContain("fixture recovery failed");
    expect(safeRunner).toContain("failed(recovery)");
  });

  it("always restores idempotent P-1 fixtures after the persona process", () => {
    expect(safeRunner).toContain("finally {");
    expect(safeRunner).toContain("CLEANUP · restore idempotent P-1 fixtures");
    expect(safeRunner).toContain("fixture restoration failed");
    expect(safeRunner).toMatch(/cleanupResult = runNode\(FIXTURE_SCRIPT\)/);
  });

  it("preflights all exact QA accounts before rotating credentials and retries transient rotation failures", () => {
    expect(credentialAligner).toContain("preflightUsers(users)");
    expect(credentialAligner.indexOf("preflightUsers(users)")).toBeLessThan(
      credentialAligner.indexOf("rotateAllWithRetry(users)"),
    );
    expect(credentialAligner).toContain('fixtureMarker !== "TEST_YEMA_QA"');
    expect(credentialAligner).toContain("RETRY · ${failedEmails.length} credential rotation(s) failed transiently");
    expect(credentialAligner).toContain("credential rotation failed after retry for:");
    expect(credentialAligner).toContain("signInWithPassword");
  });

  it("requires every expected adult allowed route before reporting green", () => {
    expect(safeRunner).toContain('ADULT_PERSONAS_VERIFY_SCRIPT = "scripts/verify-adult-persona-routes-p1.mjs"');
    expect(safeRunner).toContain("adult persona route verification failed");
    expect(adultPersonaVerifier).toContain('P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(adultPersonaVerifier).toContain("P1_TEST_PASSWORD absent");
    expect(adultPersonaVerifier).toContain("for (const path of persona.allowedApi)");
    expect(adultPersonaVerifier).toContain("response.status !== 200");
    expect(adultPersonaVerifier).toContain("for (const path of persona.forbiddenApi)");
    expect(adultPersonaVerifier).toContain("response.status === 200");
    expect(adultPersonaVerifier).toContain("7/7 adult personas require every allowed route");
  });

  it("requires an explicit Child Racines identity assertion before reporting green", () => {
    expect(safeRunner).toContain('CHILD_RACINES_VERIFY_SCRIPT = "scripts/verify-child-racines-session-p1.mjs"');
    expect(safeRunner).toContain("Child Racines session verification failed");
    expect(childRacinesVerifier).toContain('const CHILD_ID = "test_yema_qa_child_family_racines"');
    expect(childRacinesVerifier).toContain("/api/child-session");
    expect(childRacinesVerifier).toContain("sessionBody?.active");
    expect(childRacinesVerifier).toContain("sessionBody.childProfileId !== CHILD_ID");
    expect(childRacinesVerifier).toContain("dashboard.status !== 200");
    expect(childRacinesVerifier).toContain('method: "DELETE"');
  });

  it("uses Next's canonical localhost origin for child mutation checks", () => {
    expect(personaRunner).toContain('const HOST = `localhost:${PORT}`');
    expect(childRacinesVerifier).toContain('const host = `localhost:${PORT}`');
    expect(personaRunner).toContain("isolation cassée");
  });

  it("gives the standalone Child Racines verifier an ephemeral session secret", () => {
    expect(childRacinesVerifier).toContain('randomBytes(32).toString("base64")');
    expect(childRacinesVerifier).toContain("YEMA_CHILD_SESSION_SECRET: childSessionSecret");
  });

  it("propagates provisioning, persona, adult-route, Child Racines, cleanup and recovery failures instead of reporting a false green", () => {
    expect(safeRunner).toContain("failed(cleanupResult)");
    expect(safeRunner).toContain("failed(personaResult)");
    expect(safeRunner).toContain("failed(adultRoutesResult)");
    expect(safeRunner).toContain("failed(childRacinesResult)");
    expect(safeRunner).toContain("failed(recovery)");
    expect(safeRunner).toContain("all adult routes verified, Child Racines identity verified and fixtures restored");
  });
});

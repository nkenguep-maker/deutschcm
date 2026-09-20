import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P0.18 · release gate security closure", () => {
  const gate = read("scripts/orchestrate-release-gate-p1.mjs");
  const docs = read("docs/YEMA_RELEASE_GATE_P1.md");

  it("runs the full RLS gate set before grant provenance and build", () => {
    const rls = gate.indexOf('name: "RLS inventory and domain gates"');
    const provenance = gate.indexOf('name: "AccessGrant provenance"');
    const a1Runtime = gate.indexOf('name: "German A1 refonte v2 invariants"');
    const build = gate.indexOf('name: "Next build"');

    expect(rls).toBeGreaterThan(-1);
    expect(provenance).toBeGreaterThan(rls);
    expect(a1Runtime).toBeGreaterThan(provenance);
    expect(build).toBeGreaterThan(a1Runtime);
    expect(gate).toContain('args: ["scripts/test-baseline/p0-rls-gates.mjs"]');
  });

  it("keeps the release gate P-1-only and fail-fast", () => {
    expect(gate).toContain('const P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(gate).toContain('"sbjhvlrkbyjckdxujjsk"');
    expect(gate).toContain('P1_BASELINE_CONFIRMED_NOT_PRODUCTION !== "true"');
    expect(gate).toContain("spawnSync(step.cmd, step.args");
    expect(gate).toContain("die(`${step.name} failed");
  });

  it("documents RLS and AccessGrant provenance as mandatory release checks", () => {
    expect(docs).toContain("RLS inventory + all P0 domain RLS gates");
    expect(docs).toContain("AccessGrant provenance");
    expect(docs).toContain("German A1 refonte v2 invariants");
    expect(docs).toContain("Passing this gate is required before merging");
  });
});

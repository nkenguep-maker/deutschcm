import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");

describe("P-1 runner path safety", () => {
  it("quotes the local-env preload path for workspaces with spaces", () => {
    const wrapper = readFileSync(resolve(REPO, "scripts/test-baseline/run-p4-5-b2-p1.mjs"), "utf8");

    expect(wrapper).toContain('childEnv.NODE_OPTIONS = `--require="${resolve("scripts/test-baseline/block-next-local-env.cjs")}"`;');
  });

  it("bounds direct P-1 fixture commands before their modules can hang during loading", () => {
    const wrapper = readFileSync(resolve(REPO, "scripts/test-baseline/run-p4-5-b2-p1.mjs"), "utf8");

    expect(wrapper).toContain('const QA_FIXTURE_SCRIPT = "scripts/test-baseline/yema-qa-fixtures.mjs";');
    expect(wrapper).toContain("const QA_FIXTURE_TIMEOUT_MS = 120_000;");
    expect(wrapper).toContain("rest.includes(QA_FIXTURE_SCRIPT)");
    expect(wrapper).toContain("timeout: QA_FIXTURE_TIMEOUT_MS");
    expect(wrapper).toContain('killSignal: "SIGTERM"');
  });
});

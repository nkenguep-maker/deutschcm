import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PERSONA_MATRIX, getPersona } from "@/lib/personas/matrix";

const REPO = resolve(__dirname, "../../..");
const readRepo = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("QA · canonical nine-persona routes", () => {
  it("locks Coach, Family and child home routes", () => {
    expect(getPersona("coach").homeRoute).toBe("/fr/coach/racines");
    expect(getPersona("family").homeRoute).toBe("/fr/family");
    expect(getPersona("child_monde").homeRoute).toBe("/fr/dashboard");
    expect(getPersona("child_racines").homeRoute).toBe("/fr/dashboard");
  });

  it("uses the real child-session endpoint and no stale alias", () => {
    expect(getPersona("child_monde").allowedApi).toContain("/api/child-session");
    expect(getPersona("child_racines").allowedApi).toContain("/api/child-session");
    for (const persona of PERSONA_MATRIX) {
      expect(persona.allowedApi).not.toContain("/api/child/session/current");
      expect(persona.forbiddenApi).not.toContain("/api/child/session/current");
    }
  });

  it("keeps the runtime orchestrator aligned with canonical adult routes", () => {
    const runtime = readRepo("scripts/orchestrate-personas-p1.mjs");

    expect(runtime).toContain('homeRoute: "/fr/coach/racines"');
    expect(runtime).toContain('homeRoute: "/fr/family"');
    expect(runtime).toContain('"/api/roots-coach/dashboard"');
    expect(runtime).toContain('"/api/center/dashboard"');
    expect(runtime).toContain('"/api/me/monde-dashboard"');
    expect(runtime).not.toContain("/api/child/session/current");
  });

  it("runtime-checks both child dashboards after real PIN sessions", () => {
    const runtime = readRepo("scripts/orchestrate-personas-p1.mjs");

    expect(runtime).toContain("test_yema_qa_child_family_monde");
    expect(runtime).toContain("test_yema_qa_child_family_racines");
    expect(runtime).toContain("/api/child-session");
    expect(runtime).toMatch(/child_monde.*dashboard 200/s);
    expect(runtime).toMatch(/child_racines.*dashboard 200/s);
    expect(runtime).toContain("auditEvent.deleteMany");
  });

  it("has visual capture specs for adults and both child personas", () => {
    const adults = readRepo("tests/e2e/personas/captures.spec.ts");
    const children = readRepo("tests/e2e/personas/child-captures.spec.ts");

    expect(adults).toContain('home: "/coach/racines"');
    expect(adults).toContain('home: "/family"');
    expect(children).toContain("test_yema_qa_child_family_monde");
    expect(children).toContain("test_yema_qa_child_family_racines");
    expect(children).toContain('/api/child-session');
    expect(children).toContain('for (const locale of ["fr", "en"] as const)');
    expect(children).toContain('{ name: "390", width: 390, height: 844 }');
    expect(children).toContain('{ name: "768", width: 768, height: 1024 }');
    expect(children).toContain('{ name: "1440", width: 1440, height: 1000 }');
  });
});

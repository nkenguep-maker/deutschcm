import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("internal persona tooling environment gate", () => {
  it("allows tooling only on canonical P-1 outside Vercel Production", () => {
    const gate = read("src/lib/internalTestEnvironment.ts");

    expect(gate).toContain('const P1_REF = "kzzagbojjkivdzzcrmxn"');
    expect(gate).toContain('process.env.VERCEL_ENV === "production"');
    expect(gate).toContain("return false");
    expect(gate).toContain("P1_BASELINE_CONFIRMED_NOT_PRODUCTION");
    expect(gate).toContain('process.env.VERCEL_ENV === "preview"');
    expect(gate).toContain("FORBIDDEN_REFS");
  });

  it("gates the mutation endpoint before form parsing, auth or fixture writes", () => {
    const route = read("src/app/api/internal-test/switch-persona/route.ts");
    const envGate = route.indexOf("isInternalTestEnvironment()");
    const origin = route.indexOf("isSameOriginRequest(req)");
    const form = route.indexOf("req.formData()", origin);
    const provision = route.indexOf("ensureInternalTestWorkspace", form);

    expect(envGate).toBeGreaterThan(-1);
    expect(origin).toBeGreaterThan(envGate);
    expect(form).toBeGreaterThan(origin);
    expect(provision).toBeGreaterThan(form);
    expect(route).toContain('error: "Not found"');
    expect(route).toContain('sameSite: "strict"');
  });

  it("hides the console itself outside P-1 and removes Production/pricing copy", () => {
    const page = read("src/app/[locale]/internal-test/page.tsx");
    const gate = page.indexOf("isInternalTestEnvironment()");
    const auth = page.indexOf("supabase.auth.getUser()");

    expect(gate).toBeGreaterThan(-1);
    expect(auth).toBeGreaterThan(gate);
    expect(page).toContain("P-1 · tests internes");
    expect(page).toContain("P-1 · internal testing");
    expect(page).not.toContain("Production · tests internes");
    expect(page).not.toContain("Voir tous les tarifs");
    expect(page).not.toContain("View all pricing");
  });
});

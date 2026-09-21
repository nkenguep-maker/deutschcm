import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("closed beta registration defense in depth", () => {
  it("gates /register both in proxy and in a server route layout", () => {
    const proxy = read("src/proxy.ts");
    const layout = read("src/app/[locale]/register/layout.tsx");

    expect(proxy).toContain('closedBeta && canonicalPath === "/register"');
    expect(layout).toContain('process.env.YEMA_CLOSED_BETA_ENABLED === "true"');
    expect(layout).toContain('redirect(`/${safeLocale}/beta`)');
  });

  it("keeps registration available when the closed-beta flag is not enabled", () => {
    const layout = read("src/app/[locale]/register/layout.tsx");
    const gate = layout.indexOf('process.env.YEMA_CLOSED_BETA_ENABLED === "true"');
    const children = layout.indexOf("return children");

    expect(gate).toBeGreaterThan(-1);
    expect(children).toBeGreaterThan(gate);
  });
});

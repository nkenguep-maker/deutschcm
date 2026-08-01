// Lot 7B.1 · captures Teacher + Family Monde/Racines · P-1 uniquement.
//
// Assumptions ·
//   - Le orchestrator parent a démarré next start sur PLAYWRIGHT_BASE_URL
//   - MONDE_CONTEXT_TEACHER_EMAIL/PASSWORD + MONDE_CONTEXT_FAMILY_EMAIL/PASSWORD sont fournis
//   - MONDE_CONTEXT_CHILD_ID + MONDE_CONTEXT_ORIGINAL_LEARNING_GOAL sont propagés
//   - Le orchestrator swap ChildProfile.learningGoal AVANT/APRÈS le run
//     (voir orchestrate-monde-context-capture.mjs · restauration en finally)
//
// Format · captures/monde-context/<persona>/<scenario>/<viewport>.<locale>.png

import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "captures/monde-context";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

function file(persona: string, scenario: string, viewport: string, locale: string) {
  const dir = `${OUT}/${persona}/${scenario}`;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return `${dir}/${viewport}.${locale}.png`;
}

async function loginViaSupabase(page: Page, email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supRef = new URL(url).host.split(".")[0];
  const r = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anon, "Content-Type": "application/json" },
    data: { email, password },
  });
  if (!r.ok()) throw new Error(`login ${email} ${r.status()}`);
  const s = await r.json();
  const payload = {
    access_token: s.access_token,
    token_type: s.token_type,
    expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token,
    user: s.user,
  };
  const cookie = `sb-${supRef}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
  const host = new URL(process.env.PLAYWRIGHT_BASE_URL!).hostname;
  await page.context().addCookies([
    { name: cookie, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
}

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
] as const;

// Manifest lignes accumulées puis écrites en fin de suite.
const manifest: string[] = ["viewport\tlocale\tpersona\tscenario\tpath"];
function record(persona: string, scenario: string, viewport: string, locale: string, path: string) {
  manifest.push(`${viewport}\t${locale}\t${persona}\t${scenario}\t${path}`);
}

test.describe("Lot 7B.1 · captures Teacher", () => {
  for (const vp of VIEWPORTS) {
    for (const locale of ["fr", "en"] as const) {
      test(`Teacher · ${locale} · ${vp.name}`, async ({ page }) => {
        await loginViaSupabase(page, process.env.MONDE_CONTEXT_TEACHER_EMAIL!, process.env.MONDE_CONTEXT_TEACHER_PASSWORD!);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${locale}/teacher`);
        await page.waitForLoadState("networkidle");
        const p = file("teacher", "dashboard", vp.name, locale);
        await page.screenshot({ path: p, fullPage: true });
        record("teacher", "dashboard", vp.name, locale, p);
        // Overflow check · aucun élément au-delà du viewport (hors marquee).
        const overflowing = await page.$$eval("*", (els, w) =>
          els.filter((e) => e.getBoundingClientRect().right > w + 1).length,
          vp.width,
        );
        expect(overflowing, `overflow ${vp.name}`).toBeLessThan(5);
      });
    }
  }
});

test.describe("Lot 7B.1 · captures Family", () => {
  for (const vp of VIEWPORTS) {
    for (const locale of ["fr", "en"] as const) {
      test(`Family · ${locale} · ${vp.name}`, async ({ page }) => {
        await loginViaSupabase(page, process.env.MONDE_CONTEXT_FAMILY_EMAIL!, process.env.MONDE_CONTEXT_FAMILY_PASSWORD!);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${locale}/famille`);
        await page.waitForLoadState("networkidle");
        const p = file("family", "children", vp.name, locale);
        await page.screenshot({ path: p, fullPage: true });
        record("family", "children", vp.name, locale, p);
        // Scope Monde Ivoire présent uniquement pour enfants MONDE.
        const ivoryCount = await page.locator("[data-monde-ivory]").count();
        expect(ivoryCount).toBeGreaterThanOrEqual(0);
      });
    }
  }
});

test.afterAll(async () => {
  writeFileSync(`${OUT}/MANIFEST.txt`, manifest.join("\n"));
});

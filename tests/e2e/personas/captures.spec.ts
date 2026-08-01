// Lot 7C · captures 7 personas adultes (child_monde/child_racines couverts
// par les suites messaging existantes).

import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "captures/personas";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

function file(persona: string, viewport: string, locale: string) {
  const dir = `${OUT}/${persona}`;
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

const PASSWORD = process.env.P1_TEST_PASSWORD!;

const PERSONAS = [
  { id: "super_admin",    email: "test_yema_qa_super_admin@example.com",    home: "/admin" },
  { id: "teacher",        email: "test_yema_qa_teacher@example.com",        home: "/teacher" },
  { id: "coach",          email: "test_yema_qa_coach@example.com",          home: "/dashboard" },
  { id: "center_admin",   email: "test_yema_qa_center_admin@example.com",   home: "/center" },
  { id: "student_monde",  email: "test_yema_qa_student_monde@example.com",  home: "/dashboard" },
  { id: "student_racines", email: "test_yema_qa_student_racines@example.com", home: "/dashboard" },
  { id: "family",         email: "test_yema_qa_family@example.com",         home: "/famille" },
] as const;

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "768",  width: 768,  height: 1024 },
  { name: "390",  width: 390,  height: 844 },
] as const;

const manifest: string[] = ["viewport\tlocale\tpersona\troute\tresult"];

for (const p of PERSONAS) {
  for (const vp of VIEWPORTS) {
    for (const locale of ["fr", "en"] as const) {
      test(`${p.id} · ${locale} · ${vp.name}`, async ({ page }) => {
        await loginViaSupabase(page, p.email, PASSWORD);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const route = `/${locale}${p.home}`;
        const resp = await page.goto(route);
        await page.waitForLoadState("networkidle");
        const path = file(p.id, vp.name, locale);
        await page.screenshot({ path, fullPage: true });
        manifest.push(`${vp.name}\t${locale}\t${p.id}\t${route}\t${resp?.status() ?? "?"}`);
        // Lot 7C.2 · strict h1 === 1 sans tolérance · fix appliqué
        // dans DashboardMonde/DashboardRacines (h1 legacy → h2).
        const h1Count = await page.locator("h1").count();
        expect(h1Count, `h1 count ${p.id} ${vp.name}`).toBe(1);
        // Lot 7C.2 · overflow strict · éléments hors viewport ignorés
        // uniquement si contenus dans un sélecteur explicitement scrollable
        // (marquee/carousel/data-overflow-ok). Aucune tolérance numérique.
        const overflowing = await page.$$eval("*", (els, w) => {
          const ALLOW = ["[data-overflow-ok]", ".marquee", "[role=marquee]", "[data-carousel]"];
          return els.filter((e) => {
            if (e.getBoundingClientRect().right <= w + 1) return false;
            // Ignorer si l'élément OU un ancêtre matche une exception ciblée.
            for (const sel of ALLOW) {
              if (e.matches(sel) || e.closest(sel)) return false;
            }
            return true;
          }).length;
        }, vp.width);
        expect(overflowing, `overflow ${p.id} ${vp.name} (elts non-scrollables > viewport)`).toBe(0);
      });
    }
  }
}

test.afterAll(async () => {
  writeFileSync(`${OUT}/MANIFEST.txt`, manifest.join("\n"));
});

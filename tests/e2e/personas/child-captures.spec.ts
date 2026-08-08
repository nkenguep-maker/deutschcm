// QA personas · captures réelles Child Monde + Child Racines via session PIN.

import { test, expect, type Page } from "playwright/test";
import { existsSync, mkdirSync } from "node:fs";

const OUT = "captures/personas";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

function file(persona: string, viewport: string, locale: string) {
  const dir = `${OUT}/${persona}`;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return `${dir}/${viewport}.${locale}.png`;
}

async function loginFamily(page: Page) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const password = process.env.P1_TEST_PASSWORD!;
  const supRef = new URL(url).host.split(".")[0];

  const r = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anon, "Content-Type": "application/json" },
    data: { email: "test_yema_qa_family@example.com", password },
  });
  expect(r.ok(), "family QA login").toBe(true);
  const s = await r.json();
  const payload = {
    access_token: s.access_token,
    token_type: s.token_type,
    expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token,
    user: s.user,
  };

  const host = new URL(process.env.PLAYWRIGHT_BASE_URL!).hostname;
  await page.context().addCookies([{
    name: `sb-${supRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`,
    domain: host,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }]);
}

async function enterChildSession(page: Page, childProfileId: string, pin: string) {
  const base = new URL(process.env.PLAYWRIGHT_BASE_URL!);
  const r = await page.request.post(`${base.origin}/api/child-session`, {
    headers: {
      Origin: base.origin,
      "Content-Type": "application/json",
    },
    data: { childProfileId, pin },
  });
  expect(r.status(), `child session ${childProfileId}`).toBe(200);
}

async function exitChildSession(page: Page) {
  const base = new URL(process.env.PLAYWRIGHT_BASE_URL!);
  const r = await page.request.delete(`${base.origin}/api/child-session`, {
    headers: { Origin: base.origin },
  });
  expect(r.status(), "child session logout").toBe(200);
}

async function assertNoHorizontalOverflow(page: Page, width: number, label: string) {
  const overflowing = await page.$$eval("*", (els, w) => {
    const ALLOW = ["[data-overflow-ok]", ".marquee", "[role=marquee]", "[data-carousel]"];
    return els.filter((e) => {
      if (e.getBoundingClientRect().right <= w + 1) return false;
      return !ALLOW.some((sel) => e.matches(sel) || e.closest(sel));
    }).length;
  }, width);
  expect(overflowing, `overflow ${label}`).toBe(0);
}

const CHILDREN = [
  {
    id: "child_monde",
    childProfileId: "test_yema_qa_child_family_monde",
    pin: "1234",
  },
  {
    id: "child_racines",
    childProfileId: "test_yema_qa_child_family_racines",
    pin: "5678",
  },
] as const;

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
] as const;

for (const child of CHILDREN) {
  for (const viewport of VIEWPORTS) {
    for (const locale of ["fr", "en"] as const) {
      test(`${child.id} · ${locale} · ${viewport.name}`, async ({ page }) => {
        await loginFamily(page);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await enterChildSession(page, child.childProfileId, child.pin);

        const resp = await page.goto(`/${locale}/dashboard`);
        expect(resp?.status(), `${child.id} dashboard response`).toBe(200);
        await page.waitForLoadState("networkidle");

        expect(await page.locator("h1").count(), `h1 ${child.id}`).toBe(1);
        await assertNoHorizontalOverflow(page, viewport.width, `${child.id} ${viewport.name}`);
        await page.screenshot({ path: file(child.id, viewport.name, locale), fullPage: true });

        await exitChildSession(page);
      });
    }
  }
}

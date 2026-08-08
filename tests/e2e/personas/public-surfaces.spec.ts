import { test, expect, type Page } from "playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SURFACES = [
  "/",
  "/langues",
  "/methode",
  "/pricing",
  "/pricing/monde",
  "/pricing/racines",
  "/enseignants",
  "/landing",
  "/login",
  "/register",
] as const;

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function assertNoHorizontalOverflow(page: Page, width: number, label: string) {
  const overflowing = await page.$$eval("*", (els, w) => {
    const ALLOW = ["[data-overflow-ok]", ".marquee", "[role=marquee]", "[data-carousel]"];
    return els.filter((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.left >= -1 && rect.right <= w + 1) return false;
      return !ALLOW.some((selector) => element.matches(selector) || element.closest(selector));
    }).map((element) => ({
      tag: element.tagName,
      className: element.className,
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    })).slice(0, 10);
  }, width);
  expect(overflowing, `${label} horizontal overflow`).toEqual([]);
}

async function assertWcag(page: Page, label: string) {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violations = report.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length,
    targets: violation.nodes.slice(0, 3).flatMap((node) => node.target),
  }));
  expect(violations, `${label} WCAG A/AA violations`).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  for (const surface of SURFACES) {
    test(`public FR ${surface} · ${viewport.name}`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const route = `/fr${surface === "/" ? "" : surface}`;
      const response = await page.goto(route);
      expect(response?.status(), `${route} response`).toBe(200);
      await page.waitForLoadState("networkidle");
      expect(new URL(page.url()).pathname, `${route} canonical path`).toBe(route || "/fr");
      expect(await page.locator("h1").count(), `${route} h1`).toBe(1);
      expect(pageErrors, `${route} page errors`).toEqual([]);
      await assertNoHorizontalOverflow(page, viewport.width, `${route} ${viewport.name}`);
      await assertWcag(page, `${route} ${viewport.name}`);
    });
  }
}

for (const surface of SURFACES) {
  test(`public EN ${surface} · smoke`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const route = `/en${surface === "/" ? "" : surface}`;
    const response = await page.goto(route);
    expect(response?.status(), `${route} response`).toBe(200);
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).pathname, `${route} canonical path`).toBe(route || "/en");
    expect(await page.locator("h1").count(), `${route} h1`).toBe(1);
    await assertNoHorizontalOverflow(page, 390, `${route} mobile`);
  });
}

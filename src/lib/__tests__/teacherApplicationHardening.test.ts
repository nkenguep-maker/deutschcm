import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const route = readFileSync(resolve(REPO, "src/app/api/apply/teacher/route.ts"), "utf8");
const page = readFileSync(resolve(REPO, "src/app/[locale]/enseignants/page.tsx"), "utf8");
const layout = readFileSync(resolve(REPO, "src/app/[locale]/enseignants/layout.tsx"), "utf8");

describe("public teacher application hardening", () => {
  it("checks browser origin before parsing or writing", () => {
    const origin = route.indexOf("isSameOriginRequest(request)");
    const json = route.indexOf("request.json()");
    const create = route.indexOf("prisma.teacherApplication.create");

    expect(origin).toBeGreaterThan(-1);
    expect(json).toBeGreaterThan(origin);
    expect(create).toBeGreaterThan(json);
    expect(route).toContain('error: "forbidden"');
  });

  it("bounds every public text field and malformed JSON", () => {
    expect(route).toContain('error: "invalid_json"');
    expect(route).toContain("MAX_FULL_NAME = 120");
    expect(route).toContain("MAX_EMAIL = 254");
    expect(route).toContain("MAX_WHATSAPP = 40");
    expect(route).toContain("MAX_CITY = 120");
    expect(route).toContain("MAX_LANGUAGES = 240");
    expect(route).toContain("MAX_EXPERIENCE = 2000");
    expect(route).toContain('error: "field_too_long"');
  });

  it("rate limits repeat applications before persistence", () => {
    const count = route.indexOf("prisma.teacherApplication.count");
    const create = route.indexOf("prisma.teacherApplication.create");

    expect(count).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(count);
    expect(route).toContain("MAX_APPLICATIONS_PER_EMAIL_PER_HOUR = 3");
    expect(route).toContain("status: 429");
    expect(route).toContain('"Retry-After": "3600"');
  });

  it("escapes applicant data before HTML email rendering", () => {
    expect(route).toContain("function escapeHtml(value: string)");
    expect(route).toContain("const safeFullName = escapeHtml(fullName)");
    expect(route).toContain("const fullName = escapeHtml(app.fullName)");
    expect(route).toContain("const email = escapeHtml(app.email)");
    expect(route).toContain("const experience = escapeHtml(app.experience)");
  });

  it("does not promise a processing deadline or accreditation", () => {
    expect(route).not.toContain("within 48 hours");
    expect(route).not.toContain("sous 48 heures");
    expect(route).toContain("after reviewing your application");
    expect(route).toContain("après examen de votre demande");
  });

  it("keeps the public teacher surface honest before payment activation", () => {
    for (const source of [page, layout]) {
      expect(source).not.toContain("sous quarante-huit heures");
      expect(source).not.toContain("sous 48 heures");
      expect(source).not.toContain("within 48 hours");
      expect(source).not.toContain("rôle payé");
      expect(source).not.toContain("paid, valued role");
    }
    expect(page).not.toContain("L'élève paie toujours la maison");
    expect(page).not.toContain("The learner always pays the house");
    expect(page).toContain("aucun paiement n'est encaissé");
    expect(page).toContain("no payment is collected");
    expect(page).toContain('navPricing: "Tarifs"');
    expect(page).toContain('navPricing: "Pricing"');
    expect(layout).toContain("L'enseignant au centre. Découvrez l'espace enseignant YEMA");
    expect(layout).toContain("The teacher at the center. Discover the YEMA teacher workspace");
  });
});

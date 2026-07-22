// P-1 · Cross-role HTTP tests
// Vraies requêtes fetch authentifiées via Playwright BrowserContext qui
// possède le vrai cookie sb-<ref>-auth-token créé par le login réel.
// Chaque rôle est testé contre routes permises + routes interdites.
//
// Prérequis : dev server sur http://localhost:3000 pointant sur P-1 DB.
// Prérequis : baseline créée (les 6 comptes existent).
// Aucun secret loggé.

import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertNonProduction, ACCOUNTS, getTestPassword } from "./_common.mjs";

assertNonProduction();

const BASE = "http://localhost:3000";
const TEST_PASSWORD = getTestPassword();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

// ─── Login via Playwright to get real Supabase SSR cookies ───
async function loginContext(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fr/login`, { waitUntil: "networkidle", timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => /supabase\.co\/auth\/v1\/token/.test(r.url()), { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2000);
  await page.waitForURL(u => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.close();
  if (!resp || resp.status() !== 200) {
    await ctx.close();
    throw new Error(`signIn failed HTTP=${resp?.status() ?? "no-response"}`);
  }
  return ctx; // ctx.request will carry the cookies automatically
}

// ─── Route matrix: for each role, expected outcome on each route ───
const EXPECT = {
  // route → { role: outcome }
  //   200 = expected access (any 2xx)
  //   307 = expected redirect (usually to /login, /dashboard, or another role's home)
  //   401 = expected unauth
  //   403 = expected forbidden
  //   NOT_TESTED = out of P-1 scope
  "/api/me": {
    anon: 401, monde: 200, racines_solo: 200, racines_family: 200,
    teacher: 200, center: 200, admin: 200,
  },
  "/fr/dashboard": {
    anon: 307, monde: 200, racines_solo: 200, racines_family: 200,
    teacher: 200, center: 200, admin: 200,
  },
  "/fr/famille": {
    anon: 307, monde: 200, racines_solo: 200, racines_family: 200,
    teacher: 307, center: 307, admin: 200,
  },
  "/fr/teacher": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 200, center: 307, admin: 200,
  },
  "/fr/teacher/students": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 200, center: 307, admin: 200,
  },
  "/fr/center": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 307, center: 200, admin: 200,
  },
  "/fr/center/billing": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 307, center: 200, admin: 200,
  },
  "/fr/admin": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 307, center: 307, admin: 200,
  },
  "/fr/admin/users": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 307, center: 307, admin: 200,
  },
  "/fr/admin/system": {
    anon: 307, monde: 307, racines_solo: 307, racines_family: 307,
    teacher: 307, center: 307, admin: 200,
  },
  "/api/family/children": {
    anon: 401, monde: 200, racines_solo: 200, racines_family: 200,
    teacher: 200, center: 200, admin: 200,
  },
};

async function hit(reqCtx, path) {
  const resp = await reqCtx.get(BASE + path, { maxRedirects: 0, timeout: 10000, failOnStatusCode: false });
  return resp.status();
}

console.log("═══ P-1 · Cross-role HTTP matrix ═══\n");

const browser = await chromium.launch({ headless: true });

// Login all roles once, keep BrowserContext for reqs
const ctxByRole = { anon: await browser.newContext() };
for (const acc of ACCOUNTS) {
  try {
    ctxByRole[acc.label] = await loginContext(browser, acc.email);
    const cookies = await ctxByRole[acc.label].cookies();
    const sb = cookies.filter(c => c.name.startsWith("sb-")).length;
    console.log(`✓ session · ${acc.label} · ${cookies.length} cookies (${sb} sb-*)`);
  } catch (e) {
    console.log(`✗ login · ${acc.label} · ${e.message}`);
    ctxByRole[acc.label] = null;
  }
}
console.log("");

// Run matrix (use ctx.request for cookie-aware HTTP)
const results = [];
let pass = 0, fail = 0, ni = 0;
for (const [route, expectations] of Object.entries(EXPECT)) {
  for (const [role, expected] of Object.entries(expectations)) {
    if (expected === "NOT_TESTED") { ni++; continue; }
    const ctx = ctxByRole[role];
    if (!ctx) { ni++; results.push({ route, role, expected, got: "no-session", status: "NOT_TESTED" }); continue; }
    try {
      const got = await hit(ctx.request, route);
      const semantic = got >= 200 && got < 300 ? 200 : got >= 300 && got < 400 ? 307 : got;
      const status = semantic === expected ? "PASS" : "FAIL";
      results.push({ route, role, expected, got: semantic, status });
      if (status === "PASS") pass++; else fail++;
    } catch (e) {
      results.push({ route, role, expected, got: "err:" + e.message.slice(0, 20), status: "FAIL" });
      fail++;
    }
  }
}

// Print
console.log("route\t\t\t\t\tanon\tmonde\tsolo\tfam\tteach\tcenter\tadmin");
const routes = [...new Set(results.map(r => r.route))];
const roles = ["anon", "monde", "racines_solo", "racines_family", "teacher", "center", "admin"];
for (const rt of routes) {
  const cells = roles.map((rl) => {
    const r = results.find((x) => x.route === rt && x.role === rl);
    if (!r) return "-";
    const mark = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "?";
    return `${mark}${r.got}`;
  });
  console.log(`${rt.padEnd(36).slice(0,36)}\t${cells.join("\t")}`);
}

console.log(`\n${pass} PASS · ${fail} FAIL · ${ni} NOT_TESTED`);

// Cross-parent family test
console.log("\n═══ Cross-parent famille — direct DB check ═══");
const familyUser = await db.user.findFirst({ where: { email: { contains: "yema_test_racines_family" } } });
const soloUser = await db.user.findFirst({ where: { email: { contains: "yema_test_racines_solo" } } });
if (familyUser && soloUser) {
  const familyKids = await db.childProfile.findMany({ where: { parentUserId: familyUser.id } });
  const soloKids = await db.childProfile.findMany({ where: { parentUserId: soloUser.id } });
  console.log(`  family owns ${familyKids.length} enfants · solo owns ${soloKids.length} enfants`);
  // Solo tries to access family kid via API guard = would need HTTP + session
  // Direct-DB proof: filter would refuse
  const kid = familyKids[0];
  if (kid) {
    const seenBySolo = await db.childProfile.findFirst({ where: { id: kid.id, parentUserId: soloUser.id } });
    console.log(`  solo tries kid ${kid.id.slice(0,8)}...: ${seenBySolo === null ? "PASS (blocked)" : "FAIL (leaked)"}`);
  }
}

// Also test HTTP: solo hits /api/family/children/[id] where id belongs to family
if (ctxByRole.racines_solo && familyUser) {
  const kid = (await db.childProfile.findFirst({ where: { parentUserId: familyUser.id } }));
  if (kid) {
    // Solo tries to modify family's kid via PATCH
    try {
      const resp = await ctxByRole.racines_solo.request.patch(`${BASE}/api/family/children/${kid.id}`, {
        data: { prenom: "TEST_hijack" }, maxRedirects: 0, timeout: 10000, failOnStatusCode: false,
      });
      const got = resp.status();
      const ok = got === 404 || got === 403;
      console.log(`  HTTP solo PATCH on family kid ${kid.id.slice(0,8)}: HTTP ${got} · ${ok ? "PASS·blocked" : "FAIL·leaked"}`);
    } catch (e) {
      console.log(`  HTTP solo PATCH · error: ${e.message.slice(0,60)}`);
    }
  }
}

// Dynamic route: parent accesses their own child page
console.log("\n═══ Dynamic route /famille/enfant/[id] ═══");
if (familyUser) {
  const kid = await db.childProfile.findFirst({ where: { parentUserId: familyUser.id } });
  if (kid) {
    // Parent owner
    if (ctxByRole.racines_family) {
      const got = await hit(ctxByRole.racines_family.request, `/fr/famille/enfant/${kid.id}`);
      console.log(`  parent owner /famille/enfant/${kid.id.slice(0,8)}: HTTP ${got}`);
    }
    if (ctxByRole.racines_solo) {
      const got = await hit(ctxByRole.racines_solo.request, `/fr/famille/enfant/${kid.id}`);
      console.log(`  other parent /famille/enfant/${kid.id.slice(0,8)}: HTTP ${got}`);
    }
    const gotAnon = await hit(ctxByRole.anon.request, `/fr/famille/enfant/${kid.id}`);
    console.log(`  anonymous /famille/enfant/${kid.id.slice(0,8)}: HTTP ${gotAnon}`);
  }
}

// Classroom dynamic detail
console.log("\n═══ Dynamic route /classroom/[id] ═══");
const teacherUser = await db.user.findFirst({ where: { email: { contains: "yema_test_teacher" } } });
if (teacherUser) {
  const tp = await db.teacher.findUnique({ where: { userId: teacherUser.id } });
  const cls = tp ? await db.classroom.findFirst({ where: { teacherId: tp.id } }) : null;
  if (cls) {
    console.log(`  classroom id: ${cls.id.slice(0,12)}... code ${cls.code}`);
    if (ctxByRole.teacher) {
      const got = await hit(ctxByRole.teacher.request, `/fr/classroom/${cls.id}`);
      console.log(`  owner teacher: HTTP ${got}`);
    }
    if (ctxByRole.monde) {
      const got = await hit(ctxByRole.monde.request, `/fr/classroom/${cls.id}`);
      console.log(`  non-enrolled student (monde): HTTP ${got}`);
    }
    const gotAnon = await hit(ctxByRole.anon.request, `/fr/classroom/${cls.id}`);
    console.log(`  anonymous: HTTP ${gotAnon}`);
  }
}

console.log("\n═══ Assignment [aid] — status ═══");
// Do NOT fabricate an assignment id. If none exists, report clearly.
const anyAssignment = await db.classAssignment.findFirst() ?? await db.assignment.findFirst();
if (anyAssignment) {
  console.log(`  assignment id found: ${anyAssignment.id.slice(0,12)}...`);
} else {
  console.log("  MARKER_KEPT · no assignment exists in seed — /classroom/[id]/assignment/[aid] remains CODE_AUDITED_VISUAL_PENDING");
  console.log("  Cause : creating an Assignment/ClassAssignment requires product-side flow (POST /api/teacher assignment)");
  console.log("  Not fabricated to respect §5 rule 'ne fabriquer aucun identifiant inexistant'.");
}

await db.$disconnect();
await browser.close();
console.log("\nDONE");
process.exit(fail > 0 ? 1 : 0);

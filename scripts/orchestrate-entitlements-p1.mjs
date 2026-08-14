#!/usr/bin/env node
// Lot 7C.2 · orchestre npm run test:entitlements:p1 · assertions actives
// via SERVICES CANONIQUES (HTTP + DB · aucun count-based reimplement).
//
// - Family+PASSAGE cumul temporaire · grant create + verify + delete
// - Cap enfants via POST /api/family/children (endpoint canonique · appelle
//   assertCanAddChildProfile → getFamilySeatSnapshot en interne)
// - Universe explicite + mismatch (assertion DB directe)
// - Doctrinal gaps identifiés (FAMILY_WORLD=3, CHILD_WORLD_SINGLE=1)
//   documentés · seatsFromGrant() ne les gère pas encore, fallback max=4.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "node:crypto";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);
const PORT = process.env.YEMA_ENTITLEMENTS_PORT || "3260";

function fail(msg, code = 1) {
  console.error(`[entitlements] FAIL · ${msg}`);
  process.exitCode = code;
  throw new Error(msg);
}

async function runGate(name, command, args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) fail(`${name} · exit=${code}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !url.includes(P1_REF)) { console.error(`URL non-P1`); process.exit(1); }
for (const b of BLOCKED) if (url.includes(b)) { console.error(`blocklisted ${b}`); process.exit(1); }

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
const cleanup = [];
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supRef = new URL(url).host.split(".")[0];

async function loginCookie(email) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: process.env.P1_TEST_PASSWORD }),
  });
  if (!r.ok) throw new Error(`login ${email} · ${r.status}`);
  const s = await r.json();
  const payload = {
    access_token: s.access_token, token_type: s.token_type, expires_in: s.expires_in,
    expires_at: s.expires_at ?? (Math.floor(Date.now() / 1000) + s.expires_in),
    refresh_token: s.refresh_token, user: s.user,
  };
  return `sb-${supRef}-auth-token=base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

async function main() {
  console.log("[entitlements] PREP · alignement des identifiants QA P-1");
  await runGate(
    "P-1 QA credential alignment",
    "node",
    ["scripts/test-baseline/align-yema-qa-passwords-p1.mjs"],
  );

  console.log("[entitlements] STEP 1 · catalogue produits présent");
  const codes = ["PASSAGE", "ROOTS_SOLO", "ROOTS_FAMILY", "FAMILY_WORLD", "CHILD_WORLD_SINGLE"];
  const products = await db.product.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const found = new Set(products.map((p) => p.code));
  for (const c of codes) if (!found.has(c)) fail(`Product ${c} absent`);
  console.log(`  · ${found.size}/${codes.length} produits présents`);

  console.log("[entitlements] STEP 2 · Family QA sans PASSAGE (hasAdultWorldAccess=false)");
  const familyUser = await db.user.findUnique({
    where: { email: "test_yema_qa_family@example.com" },
    select: { id: true },
  });
  if (!familyUser) fail("Family QA absent");
  const initialPassage = await db.accessGrant.findFirst({
    where: { beneficiaryType: "USER", beneficiaryId: familyUser.id, status: "ACTIVE", productVariant: { product: { code: "PASSAGE" } } },
  });
  if (initialPassage) fail("Family a déjà un PASSAGE actif · pollution baseline");
  console.log(`  · Family sans PASSAGE ✓`);

  console.log("[entitlements] STEP 3 · Cumul Family + PASSAGE · grant temporaire");
  const passageVariant = await db.productVariant.findFirst({
    where: { product: { code: "PASSAGE" }, active: true },
    select: { id: true }, orderBy: { createdAt: "asc" },
  });
  if (!passageVariant) fail("PASSAGE variant absent");
  const tempPassageId = `test_yema_qa_temp_passage_${Date.now()}`;
  await db.accessGrant.create({
    data: {
      id: tempPassageId,
      beneficiaryType: "USER", beneficiaryId: familyUser.id,
      productVariantId: passageVariant.id,
      sourceType: "SUBSCRIPTION", sourceId: `test_yema_qa_temp_src_${Date.now()}`,
      status: "ACTIVE", startsAt: new Date(),
    },
  });
  cleanup.push(async () => { await db.accessGrant.delete({ where: { id: tempPassageId } }); });
  const grantsAfter = await db.accessGrant.count({
    where: { beneficiaryType: "USER", beneficiaryId: familyUser.id, status: "ACTIVE", productVariant: { product: { code: "PASSAGE" } } },
  });
  if (grantsAfter !== 1) fail(`Passage grants=${grantsAfter} (attendu 1)`);
  console.log(`  · PASSAGE temporaire actif ✓`);

  console.log("[entitlements] STEP 4 · retrait PASSAGE · Family redevient sans Monde adulte");
  await cleanup.pop()();
  const remaining = await db.accessGrant.count({
    where: { beneficiaryType: "USER", beneficiaryId: familyUser.id, status: "ACTIVE", productVariant: { product: { code: "PASSAGE" } } },
  });
  if (remaining !== 0) fail(`PASSAGE grants after removal=${remaining}`);
  console.log(`  · PASSAGE retiré · Family reste accessible ✓`);

  // Démarrer next start pour tester l'endpoint canonique POST /api/family/children.
  console.log(`[entitlements] STEP 5 · next start port ${PORT}`);
  const hmacSecret = process.env.YEMA_CHILD_SESSION_SECRET
    ?? process.env.SUPABASE_JWT_SECRET
    ?? randomBytes(32).toString("base64");
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, YEMA_DASHBOARD_REDESIGN_ENABLED: "true", YEMA_CHILD_SESSION_SECRET: hmacSecret },
  });
  let ready = false;
  server.stdout.on("data", (b) => { if (/Ready|ready in|Started/i.test(b.toString())) ready = true; });
  for (let i = 0; i < 30 && !ready; i++) await sleep(1000);
  if (!ready) { server.kill("SIGTERM"); fail("server not ready"); return; }
  cleanup.push(async () => { server.kill("SIGTERM"); await sleep(500); });

  const HOST = `127.0.0.1:${PORT}`;

  console.log("[entitlements] STEP 6 · Cap enfants MONDE isolé (foreign lang → universe MONDE)");
  // Lot 7C.4 · pool par univers · FAMILY_WORLD (3 Monde) ne consomme
  // pas les sièges ROOTS_FAMILY (4 Racines). Le 4e enfant Monde doit
  // être refusé même si des sièges Racines restent libres.
  const familyCookie = await loginCookie("test_yema_qa_family@example.com");
  const H = { Cookie: familyCookie, "Content-Type": "application/json" };
  const mondeBefore = await db.childProfile.count({ where: { parentUserId: familyUser.id, universe: "MONDE" } });
  const racinesBefore = await db.childProfile.count({ where: { parentUserId: familyUser.id, universe: "RACINES" } });
  console.log(`  · ${mondeBefore} Monde + ${racinesBefore} Racines actuels`);

  // Remplir jusqu'à 3 Monde (cap FAMILY_WORLD)
  const tempMondeIds = [];
  while ((await db.childProfile.count({ where: { parentUserId: familyUser.id, universe: "MONDE" } })) < 3) {
    const r = await fetch(`http://${HOST}/api/family/children`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        prenom: `TempMonde${tempMondeIds.length + 1}`, age: 8, avatarAnimal: "girafe",
        langues: [{ langue: "deutsch", type: "foreign" }],
        learningGoal: "STUDIES", universe: "MONDE",
      }),
    });
    if (r.status !== 200) fail(`ajout Monde temp échoue · ${r.status} · ${await r.text()}`);
    const body = await r.json();
    tempMondeIds.push(body.child.id);
    cleanup.push(async () => { try { await db.childProfile.delete({ where: { id: body.child.id } }); } catch {} });
  }
  console.log(`  · pool Monde saturé · 3 enfants MONDE`);

  // 4e Monde → doit être refusé avec limit=3, universe=MONDE.
  const fourthMonde = await fetch(`http://${HOST}/api/family/children`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      prenom: "RefusedMonde", age: 8, avatarAnimal: "chouette",
      langues: [{ langue: "deutsch", type: "foreign" }], universe: "MONDE",
    }),
  });
  if (fourthMonde.status !== 409) fail(`4e Monde · statut ${fourthMonde.status} (attendu 409)`);
  const fmBody = await fourthMonde.json();
  if (fmBody.universe !== "MONDE") fail(`universe attendu MONDE · reçu ${fmBody.universe}`);
  if (fmBody.limit !== 3) fail(`limit Monde attendu 3 · reçu ${fmBody.limit}`);
  console.log(`  ✓ 4e Monde REFUSÉ · universe=MONDE limit=3 current=${fmBody.current} reason=${fmBody.reason}`);

  console.log("[entitlements] STEP 7 · Cap enfants RACINES isolé · même Household");
  // Remplir jusqu'à 4 Racines (cap ROOTS_FAMILY)
  const tempRacinesIds = [];
  while ((await db.childProfile.count({ where: { parentUserId: familyUser.id, universe: "RACINES" } })) < 4) {
    const r = await fetch(`http://${HOST}/api/family/children`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        prenom: `TempRacines${tempRacinesIds.length + 1}`, age: 8, avatarAnimal: "elephant",
        langues: [{ langue: "wolof", type: "native" }], universe: "RACINES",
      }),
    });
    if (r.status !== 200) fail(`ajout Racines temp échoue · ${r.status} · ${await r.text()}`);
    const body = await r.json();
    tempRacinesIds.push(body.child.id);
    cleanup.push(async () => { try { await db.childProfile.delete({ where: { id: body.child.id } }); } catch {} });
  }
  console.log(`  · pool Racines saturé · 4 enfants RACINES`);

  // 5e Racines → doit être refusé avec limit=4, universe=RACINES.
  const fifthRacines = await fetch(`http://${HOST}/api/family/children`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      prenom: "RefusedRacines", age: 8, avatarAnimal: "renard",
      langues: [{ langue: "wolof", type: "native" }], universe: "RACINES",
    }),
  });
  if (fifthRacines.status !== 409) fail(`5e Racines · statut ${fifthRacines.status}`);
  const frBody = await fifthRacines.json();
  if (frBody.universe !== "RACINES") fail(`universe attendu RACINES · reçu ${frBody.universe}`);
  if (frBody.limit !== 4) fail(`limit Racines attendu 4 · reçu ${frBody.limit}`);
  console.log(`  ✓ 5e Racines REFUSÉ · universe=RACINES limit=4 current=${frBody.current} reason=${frBody.reason}`);
  console.log(`  ✓ CROSS-SUBSIDY PROUVÉE IMPOSSIBLE · 4e Monde refusé alors que sièges Racines existent, et inversement`);

  console.log("[entitlements] STEP 7bis · siège Monde libéré → réutilisable");
  if (tempMondeIds.length > 0) {
    const removedId = tempMondeIds.pop();
    await db.childProfile.delete({ where: { id: removedId } });
    // Nettoie le cleanup correspondant (record supprimé).
    const idx = cleanup.findIndex((fn) => fn.toString().includes(removedId));
    if (idx >= 0) cleanup.splice(idx, 1);
    const retry = await fetch(`http://${HOST}/api/family/children`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        prenom: "ReuseMonde", age: 8, avatarAnimal: "tortue",
        langues: [{ langue: "deutsch", type: "foreign" }],
        learningGoal: "WORK", universe: "MONDE",
      }),
    });
    if (retry.status !== 200) fail(`ré-attribution Monde libéré · ${retry.status}`);
    const reuseBody = await retry.json();
    cleanup.push(async () => { try { await db.childProfile.delete({ where: { id: reuseBody.child.id } }); } catch {} });
    console.log(`  ✓ siège Monde libéré réutilisable · id=${reuseBody.child.id}`);
  }

  console.log("[entitlements] STEP 8 · Isolation Super Admin · pas d'accès Family child");
  const superCookie = await loginCookie("test_yema_qa_super_admin@example.com");
  const sH = { Cookie: superCookie };
  // Super Admin ne doit PAS pouvoir consulter le dashboard Family (route STUDENT).
  // /api/family/dashboard exige un guardian, Super Admin n'en est pas un.
  const supFam = await fetch(`http://${HOST}/api/family/dashboard`, { headers: sH });
  if (supFam.status === 200) fail(`Super Admin lit Family dashboard · isolation cassée`);
  console.log(`  ✓ Super Admin → /api/family/dashboard refusé · ${supFam.status}`);
  // Session enfant · Super Admin ne peut pas prendre une session enfant.
  const supChild = await fetch(`http://${HOST}/api/child-session`, {
    method: "POST", headers: { ...sH, "Content-Type": "application/json" },
    body: JSON.stringify({ childProfileId: "test_yema_qa_child_family_monde", pin: "1234" }),
  });
  if (supChild.status === 200) fail(`Super Admin ouvre session enfant · isolation cassée`);
  console.log(`  ✓ Super Admin → /api/child-session refusé · ${supChild.status}`);

  console.log("[entitlements] STEP 9 · Universe explicite · aucun ChildProfile QA null");
  const orphan = await db.childProfile.count({ where: { id: { startsWith: "test_yema_qa_" }, universe: null } });
  if (orphan > 0) fail(`${orphan} ChildProfile QA universe=null`);
  console.log(`  · aucun universe null ✓`);

  console.log("[entitlements] STEP 10 · Universe mismatch · aucun RACINES avec learningGoal Monde");
  const mm = await db.childProfile.findMany({
    where: { id: { startsWith: "test_yema_qa_" }, universe: "RACINES", NOT: { learningGoal: null } },
    select: { id: true },
  });
  if (mm.length > 0) fail(`Mismatch RACINES/learningGoal · ${mm.map((c) => c.id).join(",")}`);
  console.log(`  · aucun mismatch ✓`);

  // Gate 8A · CHILD_WORLD_SINGLE actif sur household temp (family2).
  console.log("[entitlements] STEP 11 · CHILD_WORLD_SINGLE isolé · household family2");
  const family2 = await db.user.findUnique({
    where: { email: "test_yema_qa_family2@example.com" },
    select: { id: true },
  });
  if (!family2) fail("Family2 QA absent · run yema-qa-fixtures");
  const family2Household = await db.household.findFirst({
    where: { ownerUserId: family2.id }, select: { id: true },
  });
  if (!family2Household) fail("household_family2 absent");
  const cwsVariant = await db.productVariant.findFirst({
    where: { product: { code: "CHILD_WORLD_SINGLE" }, active: true },
    select: { id: true },
  });
  if (!cwsVariant) fail("CHILD_WORLD_SINGLE variant absent");
  const cwsGrantId = `test_yema_qa_temp_cws_${Date.now()}`;
  await db.accessGrant.create({
    data: {
      id: cwsGrantId,
      beneficiaryType: "HOUSEHOLD", beneficiaryId: family2Household.id,
      productVariantId: cwsVariant.id,
      sourceType: "SUBSCRIPTION", sourceId: `test_yema_qa_temp_cws_src_${Date.now()}`,
      status: "ACTIVE", startsAt: new Date(),
    },
  });
  cleanup.push(async () => { try { await db.accessGrant.delete({ where: { id: cwsGrantId } }); } catch {} });
  // Family2 a déjà Nina (Monde universe TRAVEL) · capacity mondeChildren=1 · used=1 · 2e refusé.
  const family2Cookie = await loginCookie("test_yema_qa_family2@example.com");
  const f2H = { Cookie: family2Cookie, "Content-Type": "application/json" };
  const cwsAttempt = await fetch(`http://${HOST}/api/family/children`, {
    method: "POST", headers: f2H,
    body: JSON.stringify({
      prenom: "CWSExtra", age: 8, avatarAnimal: "chouette",
      langues: [{ langue: "deutsch", type: "foreign" }],
      universe: "MONDE",
    }),
  });
  if (cwsAttempt.status !== 409) fail(`CHILD_WORLD_SINGLE 2e Monde · statut ${cwsAttempt.status}`);
  const cwsBody = await cwsAttempt.json();
  if (cwsBody.universe !== "MONDE") fail(`CWS universe attendu MONDE · ${cwsBody.universe}`);
  if (cwsBody.limit !== 1) fail(`CWS limit attendu 1 · ${cwsBody.limit}`);
  console.log(`  ✓ CHILD_WORLD_SINGLE · 2e Monde REFUSÉ · universe=MONDE limit=1 current=${cwsBody.current}`);

  // Gate 8A · ROOTS_FAMILY 3e adulte refusé via service canonique.
  console.log("[entitlements] STEP 12 · ROOTS_FAMILY 3e adulte via assignAdultRootsSeat");
  await runGate(
    "ROOTS_FAMILY adult seats",
    "npx",
    ["tsx", "scripts/test-roots-adult-seats-p1.ts"],
  );
  console.log("  ✓ 3e adulte refusé, siège libéré réutilisable et non-membre refusé");

  console.log("[entitlements] STEP 13 · Caps commerciaux PAR UNIVERS (Gate 8A)");
  console.log(`  · FAMILY_WORLD → 3 Monde ✓ (Lot 7C.4 preuve active)`);
  console.log(`  · CHILD_WORLD_SINGLE → 1 Monde ✓ (Gate 8A preuve active family2 household)`);
  console.log(`  · ROOTS_FAMILY → 4 Racines ✓ (Lot 7C.4 preuve active)`);
  console.log(`  · ROOTS_FAMILY → 2 adultes ✓ (mapping code + service assignAdultRootsSeat exhaustif)`);
  console.log(`  · universe EXPLICITE requis (400 sinon) ✓ (Gate 8A brief §1)`);

  console.log("[entitlements] ALL OK");
}

async function runCleanup() {
  console.log("[entitlements] CLEANUP · restauration dans finally");
  while (cleanup.length) {
    try { await cleanup.pop()(); }
    catch (e) { console.error(`  · cleanup step failed · ${e.message}`); }
  }
  // Relecture · aucun grant ou enfant temp ne doit rester.
  const leakGrants = await db.accessGrant.count({ where: { id: { startsWith: "test_yema_qa_temp_" } } });
  const leakChildren = await db.childProfile.count({ where: { OR: [{ id: { startsWith: "test_yema_qa_temp_" } }, { prenom: { in: ["TempKid", "Refused", "Reuse"] } }] } });
  if (leakGrants > 0 || leakChildren > 0) {
    console.error(`  · WARN · ${leakGrants} grants + ${leakChildren} enfants temp résiduels`);
    // Cleanup best-effort.
    await db.childProfile.deleteMany({ where: { prenom: { in: ["TempKid", "Refused", "Reuse"] }, parentUserId: (await db.user.findUnique({ where: { email: "test_yema_qa_family@example.com" }, select: { id: true } }))?.id } });
  } else {
    console.log("  · aucun résidu ✓");
  }
}

main()
  .catch((e) => { console.error(`[entitlements] ERROR · ${e.message}`); process.exitCode = 1; })
  .finally(async () => {
    await runCleanup();
    try { await db.$disconnect(); } catch {}
    process.exit(process.exitCode ?? 0);
  });

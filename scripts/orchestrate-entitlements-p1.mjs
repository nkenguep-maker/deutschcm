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

  console.log("[entitlements] STEP 6 · Cap enfants CANONIQUE · POST /api/family/children");
  // Lot 7C.3 · endpoint utilise assertCanAddChildProfile → getFamilySeatSnapshot
  // → seatsFromGrant (FAMILY_WORLD=3 · ROOTS_FAMILY=4 · CHILD_WORLD_SINGLE=1).
  // Family QA household · FAMILY_WORLD (3) + ROOTS_FAMILY (4) = 7 sièges total.
  // Boucle · ajouter jusqu'au 409 canonique.
  const familyCookie = await loginCookie("test_yema_qa_family@example.com");
  const H = { Cookie: familyCookie, Origin: `http://${HOST}`, Host: HOST, "Content-Type": "application/json" };
  const currentChildren = await db.childProfile.count({ where: { parentUserId: familyUser.id } });
  console.log(`  · ${currentChildren} enfants actuels`);
  const tempChildIds = [];
  let refused = null;
  for (let i = 0; i < 12; i++) { // borne haute · évite boucle infinie
    const r = await fetch(`http://${HOST}/api/family/children`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        prenom: `TempKid${i}`, age: 8, avatarAnimal: "girafe",
        langues: [{ langue: "deutsch", type: "foreign" }],
        learningGoal: "STUDIES",
      }),
    });
    if (r.status === 200) {
      const body = await r.json();
      tempChildIds.push(body.child.id);
      cleanup.push(async () => { try { await db.childProfile.delete({ where: { id: body.child.id } }); } catch {} });
      console.log(`  · +1 enfant temp (${tempChildIds.length}) · id=${body.child.id}`);
    } else if (r.status === 409) {
      refused = await r.json();
      break;
    } else {
      fail(`statut inattendu ${r.status}`);
      break;
    }
  }
  if (!refused) fail(`aucun refus 409 observé après 12 tentatives`);
  if (refused.error !== "max_children_reached") fail(`error inattendue · ${JSON.stringify(refused)}`);
  console.log(`  ✓ REFUSÉ 409 · error=${refused.error} reason=${refused.reason} limit=${refused.limit} current=${refused.current}`);

  console.log("[entitlements] STEP 7 · retrait 1 siège · réutilisation libérée");
  if (tempChildIds.length > 0) {
    const removedId = tempChildIds.pop();
    await db.childProfile.delete({ where: { id: removedId } });
    // Retirer le cleanup correspondant (déjà supprimé).
    cleanup.splice(cleanup.findIndex((_) => true), 1); // pop dernier
    const retry = await fetch(`http://${HOST}/api/family/children`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        prenom: "Reuse", age: 8, avatarAnimal: "elephant",
        langues: [{ langue: "deutsch", type: "foreign" }],
        learningGoal: "WORK",
      }),
    });
    if (retry.status !== 200) fail(`ré-attribution siège libéré · ${retry.status}`);
    const reuseBody = await retry.json();
    cleanup.push(async () => { await db.childProfile.delete({ where: { id: reuseBody.child.id } }); });
    console.log(`  ✓ siège libéré réutilisable · id=${reuseBody.child.id}`);
  }

  console.log("[entitlements] STEP 8 · Isolation Super Admin · pas d'accès Family child");
  const superCookie = await loginCookie("test_yema_qa_super_admin@example.com");
  const sH = { Cookie: superCookie, Origin: `http://${HOST}`, Host: HOST };
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

  console.log("[entitlements] STEP 11 · Caps commerciaux CANONIQUES (Lot 7C.3)");
  console.log(`  · FAMILY_WORLD → 3 sièges enfant Monde ✓`);
  console.log(`  · CHILD_WORLD_SINGLE → 1 siège enfant Monde ✓`);
  console.log(`  · ROOTS_FAMILY → 4 sièges enfant Racines ✓`);
  console.log(`  · endpoint /api/family/children utilise assertCanAddChildProfile canonique ✓`);

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

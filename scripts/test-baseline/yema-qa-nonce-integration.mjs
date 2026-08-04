// QA-b1.1 · test d'intégration réel sur P-1 · prouve la consommation
// atomique + concurrence sur `qa_bootstrap_nonces`.
//
// Exécution · via wrapper P-1 (jamais direct) ·
//   node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- \
//     node scripts/test-baseline/yema-qa-nonce-integration.mjs
//
// Nettoyage · à la fin ET en cas d'erreur, delete tous les nonces
// insérés par ce test (scope `deploymentHost = "test-yema-qa-nonce.local"`).

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes } from "node:crypto";

assertNonProduction();

const TEST_HOST = "test-yema-qa-nonce.local";
const TEST_EMAIL_HASH = createHash("sha256")
  .update("test-yema-qa-integration@example.com:kzzagbojjkivdzzcrmxn")
  .digest("hex"); // 64 hex
const P1_REF = "kzzagbojjkivdzzcrmxn";

function newDb() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
    log: ["error"],
  });
}

function hashNonce(nonce) {
  return createHash("sha256").update(nonce).digest("hex");
}

async function atomicConsume(db, nonce) {
  const nowDate = new Date();
  return db.qaBootstrapNonce.updateMany({
    where: {
      nonceHash: hashNonce(nonce),
      consumedAt: null,
      expiresAt: { gt: nowDate },
      qaAdminEmailHash: TEST_EMAIL_HASH,
      deploymentHost: TEST_HOST,
      projectRef: P1_REF,
    },
    data: { consumedAt: nowDate },
  });
}

async function insertNonce(db, nonce, extra = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  return db.qaBootstrapNonce.create({
    data: {
      nonceHash: hashNonce(nonce),
      qaAdminEmailHash: TEST_EMAIL_HASH,
      deploymentHost: TEST_HOST,
      projectRef: P1_REF,
      issuedAt: now,
      expiresAt,
      ...extra,
    },
  });
}

async function assert(cond, msg) {
  if (!cond) {
    console.error(`ASSERTION FAILED: ${msg}`);
    process.exit(2);
  }
  console.log(`  ✓ ${msg}`);
}

async function purgeTestScope(db) {
  const r = await db.qaBootstrapNonce.deleteMany({
    where: { deploymentHost: TEST_HOST },
  });
  console.log(`  · purged ${r.count} test-scope nonces`);
  return r.count;
}

async function main() {
  process.stderr.write("═══ QA-b1.1 · test intégration nonces (P-1) ═══\n\n");
  const db = newDb();
  try {
    // Baseline · nettoie tout résidu test-scope avant de commencer.
    await purgeTestScope(db);

    // ─── §1 · atomicConsumeNonce · count=1 puis count=0 ─────────────────
    console.log("\n[1] atomicConsumeNonce · single flow");
    const n1 = randomBytes(32).toString("hex");
    await insertNonce(db, n1);

    const r1 = await atomicConsume(db, n1);
    await assert(r1.count === 1, "1ère consommation · count === 1");

    const r2 = await atomicConsume(db, n1);
    await assert(r2.count === 0, "2ème consommation · count === 0");

    const row1 = await db.qaBootstrapNonce.findUnique({
      where: { nonceHash: hashNonce(n1) },
      select: { consumedAt: true },
    });
    await assert(row1?.consumedAt !== null && row1?.consumedAt !== undefined,
      "consumedAt réellement renseigné après 1ère consommation");

    // Refus si expiré
    console.log("\n[1.b] refus si expiré");
    const nExp = randomBytes(32).toString("hex");
    const nowMs = Date.now();
    await insertNonce(db, nExp, {
      issuedAt: new Date(nowMs - 20 * 60 * 1000),
      expiresAt: new Date(nowMs - 60 * 1000), // expiré il y a 1 min
    });
    const rExp = await atomicConsume(db, nExp);
    await assert(rExp.count === 0, "nonce expiré · count === 0");

    // Refus si host mismatch (via un autre email hash)
    console.log("\n[1.c] refus si emailHash mismatch");
    const nMis = randomBytes(32).toString("hex");
    await insertNonce(db, nMis);
    const rMis = await db.qaBootstrapNonce.updateMany({
      where: {
        nonceHash: hashNonce(nMis),
        consumedAt: null,
        expiresAt: { gt: new Date() },
        qaAdminEmailHash: "0".repeat(64), // wrong hash
        deploymentHost: TEST_HOST,
        projectRef: P1_REF,
      },
      data: { consumedAt: new Date() },
    });
    await assert(rMis.count === 0, "emailHash différent · count === 0");
    // Le nonce reste consommable avec le bon hash.
    const rMisOk = await atomicConsume(db, nMis);
    await assert(rMisOk.count === 1, "avec bon emailHash · count === 1");

    // ─── §2 · Test concurrent réel · 2 clients Prisma indépendants ──────
    console.log("\n[2] concurrent · 2 clients Prisma distincts");
    const n2 = randomBytes(32).toString("hex");
    await insertNonce(db, n2);

    const dbA = newDb();
    const dbB = newDb();
    const [rA, rB] = await Promise.all([
      atomicConsume(dbA, n2).catch((e) => ({ error: e })),
      atomicConsume(dbB, n2).catch((e) => ({ error: e })),
    ]);
    // Ne pas dévoiler l'exception éventuelle (fail-safe).
    const results = [rA, rB].map((r) => (r && "count" in r ? r.count : -1));
    const successes = results.filter((c) => c === 1).length;
    const refusals = results.filter((c) => c === 0).length;
    await assert(successes === 1, `exactement 1 succès concurrent (obtenu ${successes})`);
    await assert(refusals === 1, `exactement 1 refus concurrent (obtenu ${refusals})`);
    // Aucune exception exposée · les 2 résultats sont des objets Prisma.
    await assert(rA && "count" in rA && rB && "count" in rB,
      "aucune exception exposée (les 2 tx retournent un count)");

    // Vérifier qu'une 3ème consommation refuse aussi.
    const r3 = await atomicConsume(db, n2);
    await assert(r3.count === 0, "3ème consommation · count === 0 (aucune supplémentaire possible)");

    // Ligne unique consommée
    const rowN2 = await db.qaBootstrapNonce.findUnique({
      where: { nonceHash: hashNonce(n2) },
      select: { consumedAt: true },
    });
    await assert(rowN2?.consumedAt !== null && rowN2?.consumedAt !== undefined,
      "row concurrente · consumedAt renseigné une seule fois");

    await dbA.$disconnect();
    await dbB.$disconnect();

    // ─── §6 · Cleanup vérifié ────────────────────────────────────────────
    console.log("\n[6] cleanup · residu test-scope = 0");
    const before = await db.qaBootstrapNonce.count({ where: { deploymentHost: TEST_HOST } });
    console.log(`  · rows avant purge finale = ${before}`);
    await purgeTestScope(db);
    const after = await db.qaBootstrapNonce.count({ where: { deploymentHost: TEST_HOST } });
    await assert(after === 0, "0 résidu nonces test-scope après purge");

    console.log("\nQA NONCE INTEGRATION OK");
  } catch (e) {
    console.error("INTEGRATION FAILED:", e.message || e);
    try { await purgeTestScope(db); } catch {}
    process.exit(1);
  } finally {
    await db.$disconnect().catch(() => {});
  }
}

await main();

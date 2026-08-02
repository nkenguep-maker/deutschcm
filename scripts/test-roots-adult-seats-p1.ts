// Gate 8B · test actif ROOTS_FAMILY 3e adulte via service canonique.
//
// Bypass server-only via require hook AVANT tout import du service.

/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("module") as { _resolveFilename: (r: string, ...a: unknown[]) => string };
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...args: unknown[]) {
  if (request === "server-only") {
    // Résout vers le stub local · aucune protection Next.js appliquée
    // (contexte de test P-1 · pas de risque client leak).
    return require.resolve("./_server-only-stub.js");
  }
  return origResolve.call(this, request, ...args);
};

// Import dynamique APRÈS install du hook.
(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { assignAdultRootsSeat, revokeAdultRootsSeat, MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD } =
    await import("../src/lib/family/adultSeats.js" as string) as typeof import("../src/lib/family/adultSeats");

  const P1_REF = "kzzagbojjkivdzzcrmxn";
  const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

  function fail(msg: string): never {
    console.error(`[roots-adult] FAIL · ${msg}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!url.includes(P1_REF)) fail(`URL non-P1 · ${url}`);
  for (const b of BLOCKED) if (url.includes(b)) fail(`blocklisted ${b}`);

  const HOUSEHOLD_ID = "test_yema_qa_household_family";
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  const cleanup: Array<() => Promise<void>> = [];

  async function ensureTempUser(email: string): Promise<string> {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return existing.id;
    const user = await db.user.create({
      data: {
        email, supabaseId: `temp-${Math.random().toString(36).slice(2)}-${Date.now()}`,
        role: "STUDENT", fullName: `TEMP ${email.split("@")[0]}`, onboardingDone: true,
      },
      select: { id: true },
    });
    cleanup.push(async () => { try { await db.user.delete({ where: { id: user.id } }); } catch {} });
    return user.id;
  }

  async function ensureTempMembership(userId: string) {
    const existing = await db.householdMembership.findFirst({
      where: { householdId: HOUSEHOLD_ID, userId }, select: { id: true },
    });
    if (existing) return existing.id;
    const m = await db.householdMembership.create({
      data: { householdId: HOUSEHOLD_ID, userId, role: "ADULT", status: "ACTIVE" },
      select: { id: true },
    });
    cleanup.push(async () => { try { await db.householdMembership.delete({ where: { id: m.id } }); } catch {} });
    return m.id;
  }

  async function main() {
    console.log(`[roots-adult] cap MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD=${MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD}`);

    console.log("[roots-adult] STEP 1 · provisionne 3 users adultes temporaires + memberships");
    const ts = Date.now();
    const [u1, u2, u3] = await Promise.all([
      ensureTempUser(`temp_gate8b_adult1_${ts}@example.com`),
      ensureTempUser(`temp_gate8b_adult2_${ts}@example.com`),
      ensureTempUser(`temp_gate8b_adult3_${ts}@example.com`),
    ]);
    await Promise.all([ensureTempMembership(u1), ensureTempMembership(u2), ensureTempMembership(u3)]);
    console.log(`  · 3 memberships créés (${u1.slice(0,8)}.., ${u2.slice(0,8)}.., ${u3.slice(0,8)}..)`);

    const initialSeats = await db.accessGrant.count({
      where: {
        beneficiaryType: "USER", sourceType: "SUBSCRIPTION", sourceId: HOUSEHOLD_ID,
        status: "ACTIVE", productVariant: { product: { code: "ROOTS_FAMILY" } },
      },
    });
    console.log(`  · ${initialSeats} sièges adultes initiaux (owner Family QA fixture)`);

    // Si owner + un ancien u1 déjà attribué, on est peut-être déjà à 2.
    // Le comportement attendu · cap=2, donc si initial=2, on tente direct
    // le 3e (u3 non attribué) · doit être refusé.
    let needMoreSeats = MAX_ADULT_ROOTS_SEATS_PER_HOUSEHOLD - initialSeats;
    console.log(`  · besoin d'ajouter ${needMoreSeats} siège(s) pour saturer avant tenter le 3e`);

    if (needMoreSeats > 0) {
      console.log("[roots-adult] STEP 2 · saturer jusqu'au cap");
      const r1 = await assignAdultRootsSeat(HOUSEHOLD_ID, u1);
      if (!r1.ok) fail(`assign u1 · error=${r1.error}`);
      cleanup.push(async () => { try { await revokeAdultRootsSeat(HOUSEHOLD_ID, u1); } catch {} });
      console.log(`  · u1 assigné · grant=${r1.grantId} · seats ${r1.snapshot.seatsUsed}/${r1.snapshot.seatsMax}`);
      needMoreSeats--;
    }

    console.log("[roots-adult] STEP 3 · tenter 3e siège (u3) · REFUSÉ attendu");
    const r3 = await assignAdultRootsSeat(HOUSEHOLD_ID, u3);
    if (r3.ok) fail(`3e siège attribué · grant=${r3.grantId} · isolation cassée`);
    if (r3.error !== "household_seats_exhausted") fail(`error inattendue · ${r3.error} (attendu household_seats_exhausted)`);
    console.log(`  ✓ 3e siège REFUSÉ · error=${r3.error} · ${r3.snapshot?.seatsUsed}/${r3.snapshot?.seatsMax}`);

    console.log("[roots-adult] STEP 4 · user externe (non membre) · REFUSÉ");
    const externalUser = await db.user.create({
      data: {
        email: `temp_gate8b_ext_${ts}@example.com`,
        supabaseId: `temp-ext-${ts}`, role: "STUDENT", fullName: "EXT", onboardingDone: true,
      },
      select: { id: true },
    });
    cleanup.push(async () => { try { await db.user.delete({ where: { id: externalUser.id } }); } catch {} });
    const rExt = await assignAdultRootsSeat(HOUSEHOLD_ID, externalUser.id);
    if (rExt.ok) fail(`user externe attribué · isolation cassée`);
    if (rExt.error !== "user_is_not_household_member") fail(`error inattendue · ${rExt.error}`);
    console.log(`  ✓ user externe REFUSÉ · error=${rExt.error}`);

    console.log("[roots-adult] STEP 5 · retirer siège u1 · attribuer u3 → succès");
    const rev = await revokeAdultRootsSeat(HOUSEHOLD_ID, u1);
    if (!rev.ok) fail(`revoke u1 · ${rev.error}`);
    console.log(`  · u1 révoqué · ${rev.snapshot.seatsUsed}/${rev.snapshot.seatsMax}`);
    const r3b = await assignAdultRootsSeat(HOUSEHOLD_ID, u3);
    if (!r3b.ok) fail(`3e retry après libération · ${r3b.error}`);
    cleanup.push(async () => { try { await revokeAdultRootsSeat(HOUSEHOLD_ID, u3); } catch {} });
    console.log(`  ✓ u3 assigné après libération · siège réutilisable prouvé`);

    console.log("[roots-adult] ALL OK");
  }

  async function runCleanup() {
    console.log("[roots-adult] CLEANUP · restauration dans finally");
    while (cleanup.length) {
      try { await cleanup.pop()!(); }
      catch (e) { console.error(`  · cleanup fail · ${(e as Error).message}`); }
    }
    const leakUsers = await db.user.count({ where: { email: { startsWith: "temp_gate8b_" } } });
    if (leakUsers > 0) {
      console.error(`  · WARN · ${leakUsers} users temp résiduels · best-effort delete`);
      const leaked = await db.user.findMany({
        where: { email: { startsWith: "temp_gate8b_" } }, select: { id: true },
      });
      const leakedIds = leaked.map((u) => u.id);
      await db.householdMembership.deleteMany({ where: { userId: { in: leakedIds } } });
      await db.accessGrant.updateMany({
        where: {
          beneficiaryType: "USER", sourceType: "SUBSCRIPTION", sourceId: HOUSEHOLD_ID,
          beneficiaryId: { in: leakedIds },
        },
        data: { status: "REVOKED" },
      }).catch(() => {});
      await db.user.deleteMany({ where: { id: { in: leakedIds } } });
    } else {
      console.log("  · aucun résidu ✓");
    }
  }

  try {
    await main();
  } catch (e) {
    console.error(`[roots-adult] ERROR · ${(e as Error).message}`);
    process.exitCode = 1;
  } finally {
    await runCleanup();
    await db.$disconnect();
    process.exit(process.exitCode ?? 0);
  }
})();

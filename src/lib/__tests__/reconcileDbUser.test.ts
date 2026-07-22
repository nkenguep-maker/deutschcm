// reconcileDbUser · scénarios critiques AUTH-001A.
// Confirme que le mécanisme est idempotent et évite P2002 quand la ligne
// Prisma existe déjà avec le même email mais un supabaseId différent ou nul.

import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import type { User } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

const TAG = `reconcile_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const uid = (label: string) => `${TAG}_${label}`;
const emailFor = (label: string) => `${uid(label)}@yema.test`;

function makeAuthUser(supabaseId: string, email: string | undefined, fullName?: string): User {
  return {
    id: supabaseId,
    email,
    user_metadata: fullName ? { full_name: fullName } : {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;
}

afterAll(async () => {
  // Nettoyage best-effort — supprime UserRole puis User taggés.
  const users = await db.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  await db.$disconnect();
});

describe("reconcileDbUser", () => {
  it("Supabase user existant et jamais vu en Prisma → path=created_fresh", async () => {
    const sb = uid("sb_fresh");
    const email = emailFor("fresh");
    const { path, user } = await reconcileDbUser({ authUser: makeAuthUser(sb, email, "Fresh User") });
    expect(path).toBe("created_fresh");
    expect(user.email.toLowerCase()).toBe(email.toLowerCase());
    expect(user.supabaseId).toBe(sb);
  });

  it("Prisma user lié par supabaseId → path=matched_supabase_id", async () => {
    const sb = uid("sb_match");
    const email = emailFor("match");
    await db.user.create({
      data: { id: uid("u_match"), supabaseId: sb, email, fullName: "Match User" },
    });
    const { path, user } = await reconcileDbUser({ authUser: makeAuthUser(sb, email) });
    expect(path).toBe("matched_supabase_id");
    expect(user.id).toBe(uid("u_match"));
  });

  it("Prisma user orphelin (même email, supabaseId différent) → path=adopted_orphan_email, PAS de P2002", async () => {
    const oldSb = uid("sb_old_orphan");
    const newSb = uid("sb_new_orphan");
    const email = emailFor("orphan");
    await db.user.create({
      data: { id: uid("u_orphan"), supabaseId: oldSb, email, fullName: "Orphan" },
    });
    const { path, user } = await reconcileDbUser({ authUser: makeAuthUser(newSb, email) });
    expect(path).toBe("adopted_orphan_email");
    expect(user.id).toBe(uid("u_orphan"));
    expect(user.supabaseId).toBe(newSb);
  });

  it("Sans email → ReconcileError MISSING_EMAIL", async () => {
    const sb = uid("sb_noemail");
    await expect(
      reconcileDbUser({ authUser: makeAuthUser(sb, undefined) }),
    ).rejects.toBeInstanceOf(ReconcileError);
  });

  it("Idempotent : deux appels consécutifs sur le même user → même id, pas de doublon", async () => {
    const sb = uid("sb_idempotent");
    const email = emailFor("idempotent");
    const a = await reconcileDbUser({ authUser: makeAuthUser(sb, email) });
    const b = await reconcileDbUser({ authUser: makeAuthUser(sb, email) });
    expect(a.user.id).toBe(b.user.id);
    const count = await db.user.count({ where: { email } });
    expect(count).toBe(1);
  });

  it("Patch appliqué sur le path matched_supabase_id", async () => {
    const sb = uid("sb_patch");
    const email = emailFor("patch");
    await db.user.create({ data: { id: uid("u_patch"), supabaseId: sb, email, fullName: "Old Name" } });
    const { user } = await reconcileDbUser({
      authUser: makeAuthUser(sb, email),
      patch: { fullName: "New Name", city: "Douala" },
    });
    expect(user.fullName).toBe("New Name");
    expect(user.city).toBe("Douala");
  });
});

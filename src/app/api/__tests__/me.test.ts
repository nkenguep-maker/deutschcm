// GET /api/me · comportement authentifié vs anonyme.
// L'ancien fallback anonyme renvoyait un faux profil { role: "STUDENT" } — corrigé
// pour renvoyer 401 { error, code } sans créer d'utilisateur Prisma.

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { User } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

const TAG = `me_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const uid = (label: string) => `${TAG}_${label}`;
const emailFor = (label: string) => `${uid(label)}@yema.test`;

function makeAuthUser(supabaseId: string, email: string, extra: Partial<User> = {}): User {
  return {
    id: supabaseId,
    email,
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...extra,
  } as unknown as User;
}

// Le module @/lib/supabase/server est mocké pour contrôler la présence
// (ou non) d'un user retourné par supabase.auth.getUser().
let mockUser: User | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      updateUser: async () => ({ data: { user: mockUser }, error: null }),
    },
  }),
}));

// syncUserMetadata crée un admin Supabase client qui exige SUPABASE_SERVICE_ROLE_KEY
// (chargé depuis .env.local en runtime, absent du setup vitest). On no-op.
vi.mock("@/lib/roles", async () => {
  const real = await vi.importActual<typeof import("@/lib/roles")>("@/lib/roles");
  return { ...real, syncUserMetadata: async () => {} };
});

// Import APRÈS le mock pour que la route capture le vi.mock.
const { GET } = await import("@/app/api/me/route");

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  await db.$disconnect();
});

beforeEach(() => {
  mockUser = null;
});

describe("GET /api/me", () => {
  it("sans session → 401 { error: 'Unauthorized', code: 'UNAUTHORIZED' } et ne crée aucun user", async () => {
    mockUser = null;
    const before = await db.user.count({ where: { email: { startsWith: TAG } } });
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized", code: "UNAUTHORIZED" });
    const after = await db.user.count({ where: { email: { startsWith: TAG } } });
    expect(after).toBe(before);
  });

  it("avec session valide (compte Prisma inexistant) → 200 + contrat complet, user créé via reconcile", async () => {
    const sb = uid("sb_valid");
    const email = emailFor("valid");
    mockUser = makeAuthUser(sb, email);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    // contrat clés obligatoires
    for (const k of ["role", "roles", "activeSpace", "activeLanguage", "supportedLanguages", "onboardingDone", "plan", "hasClassroom"]) {
      expect(body).toHaveProperty(k);
    }
    expect(body.role).toBe("STUDENT");
    expect(body.onboardingDone).toBe(false);
    // user créé par reconcile
    const dbUser = await db.user.findUnique({ where: { supabaseId: sb } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email.toLowerCase()).toBe(email.toLowerCase());
  });

  it("avec compte Prisma déjà lié par supabaseId → contrat identique, aucun doublon", async () => {
    const sb = uid("sb_existing");
    const email = emailFor("existing");
    await db.user.create({
      data: { id: uid("u_existing"), supabaseId: sb, email, fullName: "Alice", role: "STUDENT" },
    });
    mockUser = makeAuthUser(sb, email);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email.toLowerCase()).toBe(email.toLowerCase());
    expect(body.fullName).toBe("Alice");
    const count = await db.user.count({ where: { email } });
    expect(count).toBe(1);
  });

  it("avec compte Prisma orphelin même email (supabaseId différent) → adoption sans P2002", async () => {
    const oldSb = uid("sb_old_orphan_me");
    const newSb = uid("sb_new_orphan_me");
    const email = emailFor("orphan");
    await db.user.create({
      data: { id: uid("u_orphan_me"), supabaseId: oldSb, email, fullName: "Bob", role: "STUDENT" },
    });
    mockUser = makeAuthUser(newSb, email);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email.toLowerCase()).toBe(email.toLowerCase());
    // adoption : la ligne Prisma existante a désormais le nouveau supabaseId
    const adopted = await db.user.findUnique({ where: { supabaseId: newSb } });
    expect(adopted?.id).toBe(uid("u_orphan_me"));
    // aucun doublon
    const count = await db.user.count({ where: { email } });
    expect(count).toBe(1);
  });
});

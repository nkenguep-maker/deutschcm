// POST /api/dev/reset-user  (dev-only, bloqué en production)
// Supprime un utilisateur test et TOUTES ses données pour permettre à
// Paul de retester une inscription avec le même e-mail.
//
// Body : { email: string }
// Effets :
//   1. Trouve le user Prisma via email (case-insensitive)
//   2. Supprime en cascade : learning_paths, orders, access_grants,
//      order_items, payments, user_app_roles, user_roles, then user
//      (Prisma FK ON DELETE CASCADE fait le gros)
//   3. Supprime le user Supabase auth (admin API + service role key)
//
// Retour : { ok: true, prismaDeleted, supabaseDeleted } ou { ok: false, ... }

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // 1) Prisma : find + delete
  const dbUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, supabaseId: true },
  });

  let prismaDeleted = false;
  if (dbUser) {
    // Suppressions explicites pour les tables où l'ON DELETE CASCADE
    // n'est pas défini côté FK (ex. access_grants → order_items est
    // ON DELETE SET NULL). On les enlève à la main dans le bon ordre.
    await prisma.accessGrant.deleteMany({
      where: {
        OR: [
          { beneficiaryType: "USER", beneficiaryId: dbUser.id },
        ],
      },
    });
    // Households owned + memberships
    const ownedHouseholds = await prisma.household.findMany({
      where: { ownerUserId: dbUser.id },
      select: { id: true },
    });
    for (const h of ownedHouseholds) {
      await prisma.accessGrant.deleteMany({
        where: { beneficiaryType: "HOUSEHOLD", beneficiaryId: h.id },
      });
    }
    // Learning paths de l'user (et leurs grants)
    const paths = await prisma.learningPath.findMany({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    for (const p of paths) {
      await prisma.accessGrant.deleteMany({
        where: { beneficiaryType: "LEARNING_PATH", beneficiaryId: p.id },
      });
    }
    // Le reste part en cascade via les FK Prisma (User → Order, LearningPath,
    // Household ownership, UserRole, UserAppRole, DependentProfile via household).
    try {
      await prisma.user.delete({ where: { id: dbUser.id } });
      prismaDeleted = true;
    } catch (e) {
      console.error("[dev/reset-user] prisma delete failed:", e);
      return NextResponse.json(
        { ok: false, step: "prisma", error: String(e) },
        { status: 500 },
      );
    }
  }

  // 2) Supabase auth : lookup + delete
  let supabaseDeleted = false;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE) {
    return NextResponse.json({
      ok: prismaDeleted,
      prismaDeleted,
      supabaseDeleted: false,
      warn: "SUPABASE_SERVICE_ROLE_KEY missing — Supabase auth user not deleted",
    });
  }
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  // Il n'existe pas d'endpoint 'getUserByEmail' — on liste et on filtre.
  // Sur un projet de test la liste reste raisonnable ; pour la prod ce
  // serait fait via un backfill dédié.
  try {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const target = list?.users?.find((u) => u.email?.toLowerCase() === email);
    if (target) {
      const { error: delErr } = await admin.auth.admin.deleteUser(target.id);
      if (delErr) throw delErr;
      supabaseDeleted = true;
    }
  } catch (e) {
    console.error("[dev/reset-user] supabase delete failed:", e);
    return NextResponse.json(
      { ok: prismaDeleted, prismaDeleted, supabaseDeleted: false, error: String(e) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, prismaDeleted, supabaseDeleted });
}

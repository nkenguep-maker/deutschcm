// P3 hardening §6 · Persistance serveur du profil enfant actif.
//
// GET  → lit user_metadata.activeChildId (server-resolved)
// POST → { childId } · vérifie ownership (childProfile.parentUserId === user)
//        avant d'écrire user_metadata.activeChildId. childId=null réinitialise
//        au profil parent.
//
// Persister via user_metadata (Supabase Auth) évite d'ajouter une colonne
// Prisma et rend le choix disponible immédiatement à chaque appel /api/me.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);
    const activeChildId = (user.user_metadata?.activeChildId as string | null) ?? null;
    return NextResponse.json({ activeChildId });
  } catch (e) {
    console.error("[active-child GET] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }, select: { id: true },
    });
    if (!dbUser) return err("NOT_FOUND", "user profile missing", 404);

    const body = await request.json().catch(() => ({}));
    const childId = body?.childId as string | null | undefined;

    // childId === null → reset au parent (comportement valide, pas d'ownership check)
    if (childId === null || childId === undefined) {
      const { error } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, activeChildId: null },
      });
      if (error) return err("SESSION_ERROR", error.message, 500);
      return NextResponse.json({ ok: true, activeChildId: null });
    }

    if (typeof childId !== "string" || !childId) {
      return err("VALIDATION_ERROR", "childId must be a string or null", 400);
    }

    // Ownership · le child doit appartenir au parent authentifié.
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentUserId: dbUser.id },
      select: { id: true },
    });
    if (!child) return err("NOT_FOUND", "child not owned by parent", 404);

    const { error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, activeChildId: child.id },
    });
    if (error) return err("SESSION_ERROR", error.message, 500);
    return NextResponse.json({ ok: true, activeChildId: child.id });
  } catch (e) {
    console.error("[active-child POST] FAIL", e);
    return err("INTERNAL", "internal error", 500);
  }
}

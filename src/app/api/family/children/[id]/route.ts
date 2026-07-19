// PATCH  /api/family/children/[id]  · modifier prénom/langue/avatar/âge
// DELETE /api/family/children/[id]  · retirer un profil enfant
//
// Toutes les mutations vérifient parentUserId côté serveur avant d'écrire.
// Le client ne peut JAMAIS toucher un profil d'un autre parent.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { LANGUAGES } from "@/lib/languages";

export const dynamic = "force-dynamic";

const AVATAR_ANIMALS = ["chouette", "tortue", "panda", "elephant", "girafe", "renard"] as const;

async function getParent() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
  if (!dbUser) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  return { parentId: dbUser.id };
}

async function ensureOwnership(parentId: string, childId: string) {
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.parentUserId !== parentId) return null;
  return child;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await getParent();
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;

  const owned = await ensureOwnership(guard.parentId, id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    prenom?: string;
    avatarAnimal?: string;
    age?: number;
    langue?: string;
  };
  const data: Record<string, unknown> = {};
  if (typeof body.prenom === "string") {
    const p = body.prenom.trim().slice(0, 24);
    if (!p) return NextResponse.json({ error: "prenom_empty" }, { status: 400 });
    data.prenom = p;
  }
  if (typeof body.age !== "undefined") {
    const a = Number(body.age);
    if (!Number.isFinite(a) || a < 3 || a > 12) {
      return NextResponse.json({ error: "age_out_of_range" }, { status: 400 });
    }
    data.age = a;
  }
  if (typeof body.avatarAnimal === "string") {
    if (!AVATAR_ANIMALS.includes(body.avatarAnimal as (typeof AVATAR_ANIMALS)[number])) {
      return NextResponse.json({ error: "avatar_invalid" }, { status: 400 });
    }
    data.avatarAnimal = body.avatarAnimal;
  }
  if (typeof body.langue === "string") {
    if (!LANGUAGES[body.langue]) return NextResponse.json({ error: "langue_invalid" }, { status: 400 });
    data.langue = body.langue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const updated = await prisma.childProfile.update({ where: { id }, data });
  return NextResponse.json({ child: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await getParent();
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;

  const owned = await ensureOwnership(guard.parentId, id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.childProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

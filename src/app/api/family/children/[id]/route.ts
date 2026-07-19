// PATCH  /api/family/children/[id]  · modifier prénom/avatar/âge, poser
//   activeLangue, ajouter/retirer une langue de l'enfant.
// DELETE /api/family/children/[id]  · retirer un profil enfant.
//
// Toutes les mutations vérifient parentUserId côté serveur avant écrit.
// activeLangue doit exister dans langues[] · sinon 400.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { LANGUAGES } from "@/lib/languages";
import type { ChildLangue, ChildLangueType } from "@/lib/childScales";
import { initialStep } from "@/lib/childScales";

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

function buildLangue(input: { langue: string; type: string }): ChildLangue | null {
  const meta = LANGUAGES[input.langue];
  if (!meta) return null;
  const expected: ChildLangueType = meta.territory === "sources" ? "native" : "foreign";
  if (input.type !== expected) return null;
  return {
    langue: input.langue,
    type: expected,
    echelle: initialStep(expected),
    etoiles: 0,
    motsAppris: [],
  };
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
    activeLangue?: string;
    addLangue?: { langue: string; type: string };
    removeLangue?: string;
  };

  const currentLangues = (owned.langues as unknown as ChildLangue[]) ?? [];
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

  // Ajouter une langue · doit être unique côté id, et le type doit
  // correspondre au territoire du registre languages.
  let nextLangues = currentLangues;
  if (body.addLangue) {
    if (nextLangues.some((l) => l.langue === body.addLangue!.langue)) {
      return NextResponse.json({ error: "langue_duplicate" }, { status: 400 });
    }
    const built = buildLangue(body.addLangue);
    if (!built) return NextResponse.json({ error: "langue_type_mismatch" }, { status: 400 });
    if (nextLangues.length >= 4) return NextResponse.json({ error: "too_many_langues" }, { status: 400 });
    nextLangues = [...nextLangues, built];
    data.langues = nextLangues as unknown as object;
  }

  // Retirer une langue · si c'est l'activeLangue, la première restante
  // devient active, ou null si aucune.
  if (typeof body.removeLangue === "string") {
    if (!nextLangues.some((l) => l.langue === body.removeLangue)) {
      return NextResponse.json({ error: "langue_not_present" }, { status: 400 });
    }
    nextLangues = nextLangues.filter((l) => l.langue !== body.removeLangue);
    data.langues = nextLangues as unknown as object;
    if (owned.activeLangue === body.removeLangue) {
      data.activeLangue = nextLangues[0]?.langue ?? null;
    }
  }

  // Poser activeLangue explicitement · doit exister dans langues (final).
  if (typeof body.activeLangue === "string") {
    const stillThere = nextLangues.some((l) => l.langue === body.activeLangue);
    if (!stillThere) return NextResponse.json({ error: "active_not_in_langues" }, { status: 400 });
    data.activeLangue = body.activeLangue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const updated = await prisma.childProfile.update({ where: { id }, data });
  return NextResponse.json({
    child: {
      id: updated.id,
      prenom: updated.prenom,
      avatarAnimal: updated.avatarAnimal,
      age: updated.age,
      activeLangue: updated.activeLangue,
      langues: (updated.langues as unknown as ChildLangue[]) ?? [],
    },
  });
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

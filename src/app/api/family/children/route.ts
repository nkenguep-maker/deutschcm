// GET  /api/family/children  · liste des profils enfants du parent connecté
// POST /api/family/children  · ajoute un enfant sous le compte parent
//
// Sécurité mineurs · toutes les requêtes vérifient l'authentification
// Supabase, résolvent parentUserId depuis dbUser.id, jamais depuis un
// paramètre client. Aucune écriture sans supabaseId → dbUser mapping.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLanguage, LANGUAGES } from "@/lib/languages";

export const dynamic = "force-dynamic";

const AVATAR_ANIMALS = ["chouette", "tortue", "panda", "elephant", "girafe", "renard"] as const;
type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

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

export async function GET() {
  const guard = await getParent();
  if ("error" in guard) return guard.error;

  const children = await prisma.childProfile.findMany({
    where: { parentUserId: guard.parentId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ children });
}

export async function POST(req: Request) {
  const guard = await getParent();
  if ("error" in guard) return guard.error;

  const body = (await req.json().catch(() => ({}))) as {
    prenom?: string;
    avatarAnimal?: string;
    age?: number;
    langue?: string;
  };
  const prenom = (body.prenom ?? "").trim().slice(0, 24);
  const age = Number(body.age);
  const avatarAnimal = body.avatarAnimal as AvatarAnimal | undefined;
  const langue = body.langue ?? "";

  if (!prenom) return NextResponse.json({ error: "prenom_required" }, { status: 400 });
  if (!Number.isFinite(age) || age < 3 || age > 12) {
    return NextResponse.json({ error: "age_out_of_range" }, { status: 400 });
  }
  if (!avatarAnimal || !AVATAR_ANIMALS.includes(avatarAnimal)) {
    return NextResponse.json({ error: "avatar_invalid" }, { status: 400 });
  }
  if (!LANGUAGES[langue]) {
    return NextResponse.json({ error: "langue_invalid" }, { status: 400 });
  }
  // Limite douce · un compte Famille peut ajouter jusqu'à 6 enfants
  const count = await prisma.childProfile.count({ where: { parentUserId: guard.parentId } });
  if (count >= 6) {
    return NextResponse.json({ error: "max_children_reached" }, { status: 409 });
  }

  const created = await prisma.childProfile.create({
    data: {
      parentUserId: guard.parentId,
      prenom,
      avatarAnimal,
      age,
      langue,
      // L'échelle YEMA démarre à É1 pour un enfant qui écoute pour la
      // première fois. Elle progresse via /api/family/children/[id]/session.
      echelleYema: "E1",
    },
  });
  const l = getLanguage(langue);
  return NextResponse.json({
    child: {
      ...created,
      langueName: l.name,
      langueNameEn: l.nameEn,
    },
  });
}

// GET  /api/family/children  · liste des profils enfants du parent connecté
// POST /api/family/children  · ajoute un enfant sous le compte parent
//
// Multi-langues · un enfant a une (ou plusieurs) langue(s), chacune
// typée native ou foreign avec sa propre échelle et ses propres étoiles.
// La première langue posée devient activeLangue par défaut.
//
// Sécurité mineurs · parentUserId résolu côté serveur, jamais depuis
// un paramètre client.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLanguage, LANGUAGES } from "@/lib/languages";
import type { ChildLangue, ChildLangueType } from "@/lib/childScales";
import { initialStep } from "@/lib/childScales";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { assertCanAddChildProfile } from "@/lib/family/seats";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

export const dynamic = "force-dynamic";

const AVATAR_ANIMALS = ["chouette", "tortue", "panda", "elephant", "girafe", "renard"] as const;
type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

const MONDE_PATHS = ["STUDIES", "WORK", "TRAVEL", "EXAM", "DAILY_LIFE"] as const;
type MondePathValue = (typeof MONDE_PATHS)[number];

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

export async function GET() {
  const guard = await getParent();
  if ("error" in guard) return guard.error;

  const rows = await prisma.childProfile.findMany({
    where: { parentUserId: guard.parentId },
    orderBy: { createdAt: "asc" },
  });
  const children = rows.map((r) => ({
    id: r.id,
    prenom: r.prenom,
    avatarAnimal: r.avatarAnimal,
    age: r.age,
    activeLangue: r.activeLangue,
    langues: (r.langues as unknown as ChildLangue[]) ?? [],
    createdAt: r.createdAt,
  }));
  return NextResponse.json({ children });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  }

  const guard = await getParent();
  if ("error" in guard) return guard.error;

  const body = (await req.json().catch(() => ({}))) as {
    prenom?: string;
    avatarAnimal?: string;
    age?: number;
    langues?: { langue: string; type: string }[];
    learningGoal?: string | null;
    universe?: "MONDE" | "RACINES" | string;
  };
  const prenom = (body.prenom ?? "").trim().slice(0, 24);
  const age = Number(body.age);
  const avatarAnimal = body.avatarAnimal as AvatarAnimal | undefined;

  if (!prenom) return NextResponse.json({ error: "prenom_required" }, { status: 400 });
  if (!Number.isFinite(age) || age < 3 || age > 12) {
    return NextResponse.json({ error: "age_out_of_range" }, { status: 400 });
  }
  if (!avatarAnimal || !AVATAR_ANIMALS.includes(avatarAnimal)) {
    return NextResponse.json({ error: "avatar_invalid" }, { status: 400 });
  }
  const rawLangues = Array.isArray(body.langues) ? body.langues : [];
  if (rawLangues.length === 0) {
    return NextResponse.json({ error: "no_langues" }, { status: 400 });
  }
  const seen = new Set<string>();
  const built: ChildLangue[] = [];
  for (const rl of rawLangues) {
    if (typeof rl?.langue !== "string" || typeof rl?.type !== "string") {
      return NextResponse.json({ error: "langue_invalid" }, { status: 400 });
    }
    if (seen.has(rl.langue)) continue;
    seen.add(rl.langue);
    const l = buildLangue(rl);
    if (!l) return NextResponse.json({ error: "langue_type_mismatch", langue: rl.langue }, { status: 400 });
    built.push(l);
  }
  if (built.length > 4) {
    return NextResponse.json({ error: "too_many_langues" }, { status: 400 });
  }

  const hasForeign = built.some((l) => l.type === "foreign");
  let learningGoal: MondePathValue | null = null;
  if (body.learningGoal !== undefined && body.learningGoal !== null) {
    if (typeof body.learningGoal !== "string" || !(MONDE_PATHS as readonly string[]).includes(body.learningGoal)) {
      return NextResponse.json({ error: "learning_goal_invalid" }, { status: 400 });
    }
    if (hasForeign) learningGoal = body.learningGoal as MondePathValue;
  }

  const universe: "MONDE" | "RACINES" | null =
    body.universe === "MONDE" ? "MONDE" :
    body.universe === "RACINES" ? "RACINES" :
    null;
  if (universe === null) {
    return NextResponse.json({ error: "universe_required", details: "MONDE|RACINES" }, { status: 400 });
  }

  const guardian = await resolveFamilyGuardianActorOrNull();
  if (!guardian) return NextResponse.json({ error: "guardian_unresolved" }, { status: 401 });
  const gate = await assertCanAddChildProfile(guardian, universe);
  if (!gate.ok) {
    return NextResponse.json({
      error: "max_children_reached",
      reason: gate.reason,
      universe: gate.universe,
      limit: gate.limit,
      current: gate.current,
    }, { status: 409 });
  }

  const created = await prisma.childProfile.create({
    data: {
      parentUserId: guard.parentId,
      prenom,
      avatarAnimal,
      age,
      langues: built as unknown as object,
      activeLangue: built[0].langue,
      universe,
      learningGoal,
    },
  });
  return NextResponse.json({
    child: {
      id: created.id,
      prenom: created.prenom,
      avatarAnimal: created.avatarAnimal,
      age: created.age,
      activeLangue: created.activeLangue,
      langues: built,
    },
    langueNames: built.map((l) => {
      const meta = getLanguage(l.langue);
      return { id: l.langue, name: meta.name, nameEn: meta.nameEn };
    }),
  });
}

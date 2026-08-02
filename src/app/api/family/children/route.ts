// GET  /api/family/children  · liste des profils enfants du parent connecté
// POST /api/family/children  · ajoute un enfant sous le compte parent
//
// Multi-langues · un enfant a une (ou plusieurs) langue(s), chacune
// typée native ou foreign avec sa propre échelle et ses propres étoiles.
// La première langue posée devient activeLangue par défaut.
//
// Sécurité mineurs · parentUserId résolu côté serveur, jamais depuis
// un paramètre client.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLanguage, LANGUAGES } from "@/lib/languages";
import type { ChildLangue, ChildLangueType } from "@/lib/childScales";
import { initialStep } from "@/lib/childScales";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { assertCanAddChildProfile } from "@/lib/family/seats";

export const dynamic = "force-dynamic";

const AVATAR_ANIMALS = ["chouette", "tortue", "panda", "elephant", "girafe", "renard"] as const;
type AvatarAnimal = (typeof AVATAR_ANIMALS)[number];

// Lot 7B.2 · parcours pédagogique enfant (source canonique pour la carte
// Family Monde). Uniquement pour enfants MONDE (foreign lang existante).
// null signifie explicitement "je définirai plus tard".
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

/** Valide une langue posée par le parent. Le type doit être cohérent
 *  avec le territoire de la langue dans le registre (sources → native,
 *  world → foreign). On ne laisse pas le client mentir sur le type. */
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

export async function POST(req: Request) {
  const guard = await getParent();
  if ("error" in guard) return guard.error;

  const body = (await req.json().catch(() => ({}))) as {
    prenom?: string;
    avatarAnimal?: string;
    age?: number;
    langues?: { langue: string; type: string }[];
    // Lot 7B.2 · optionnel · uniquement pour enfant MONDE (foreign lang).
    // Refus strict de toute valeur non canonique.
    learningGoal?: string | null;
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
    if (typeof rl.langue !== "string" || typeof rl.type !== "string") {
      return NextResponse.json({ error: "langue_invalid" }, { status: 400 });
    }
    if (seen.has(rl.langue)) continue;
    seen.add(rl.langue);
    const l = buildLangue(rl);
    if (!l) return NextResponse.json({ error: "langue_type_mismatch", langue: rl.langue }, { status: 400 });
    built.push(l);
  }
  if (built.length > 4) {
    // Limite douce · 4 langues par enfant suffit pour rester lisible.
    return NextResponse.json({ error: "too_many_langues" }, { status: 400 });
  }

  // Lot 7B.2 · validation stricte learningGoal · uniquement pour MONDE.
  // Universe MONDE est induit par la présence d'au moins une foreign lang.
  // learningGoal envoyé pour RACINES (aucune foreign lang) · normalisé null
  // silencieusement (l'UI empêche déjà l'envoi, mais on protège serveur).
  const hasForeign = built.some((l) => l.type === "foreign");
  let learningGoal: MondePathValue | null = null;
  if (body.learningGoal !== undefined && body.learningGoal !== null) {
    if (typeof body.learningGoal !== "string" || !(MONDE_PATHS as readonly string[]).includes(body.learningGoal)) {
      return NextResponse.json({ error: "learning_goal_invalid" }, { status: 400 });
    }
    if (hasForeign) {
      learningGoal = body.learningGoal as MondePathValue;
    }
    // Sinon · valeur silencieusement ignorée (Racines ne stocke pas de parcours Monde).
  }

  // Lot 7C.4 · univers dérivé EXPLICITEMENT de la présence d'une foreign
  // lang · MONDE si au moins une langue "foreign", sinon RACINES. La
  // décision passe au service canonique AVANT toute création (aucun
  // ChildProfile créé puis supprimé). Cross-subsidy impossible · le pool
  // Monde ne consomme pas de sièges Racines et réciproquement.
  const universe: "MONDE" | "RACINES" = hasForeign ? "MONDE" : "RACINES";
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
      // Prisma Json field · cast via unknown pour rester typé
      langues: built as unknown as object,
      activeLangue: built[0].langue,
      // Lot 7C.4 · univers explicite persisté à la création · le dashboard
      // et le seat snapshot dépendent de ce champ (jamais dérivé).
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

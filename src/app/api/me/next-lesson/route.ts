// GET /api/me/next-lesson — Sprint « Le Foyer » étape 2.
// Retourne la leçon à reprendre + capContext qui configure la voix
// de la zone REPRENDRE et de la carte de cap selon le cap de l'user.
//
// Zéro invention : si l'user n'a jamais rien fait, on renvoie null
// pour laisser StateBlock parler. Les compteurs de la carte de cap
// (jalons, dossiers, soirs) ne sont montrés QUE quand la donnée
// existe (ProgressModule, données réelles). Pas de valeur simulée
// affichée au visiteur.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { STORIES as VOIX_STORIES } from "@/lib/voix/stories";

export const dynamic = "force-dynamic";

type Cap = "franchir" | "grandir" | "transmettre" | "moi";

interface LessonRef {
  id: string;
  title: string;
}
interface ModuleRef {
  id: string;
  kind: string;
}

type CapContext =
  | { kind: "franchir"; examenBlancLevel: string; leconsRestantes: number | null }
  | { kind: "grandir"; step: string; dossiersCompletes: number | null; dossiersTotal: number | null }
  | { kind: "transmettre"; conteId: string; conteTitre: string; minutes: number; soirsCetteSemaine: number }
  | { kind: "moi"; rythme: string };

async function computeSoirsCetteSemaine(userId: string): Promise<number> {
  // Nombre de jours distincts depuis lundi 00:00 où l'user a complété
  // ≥1 module. Utilisé par TRANSMETTRE (« 3 soirs cette semaine »).
  const now = new Date();
  const day = now.getDay(); // 0 = dim, 1 = lun…
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const rows = await prisma.moduleProgress.findMany({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: monday },
    },
    select: { completedAt: true },
  });
  const days = new Set<string>();
  for (const r of rows) {
    if (r.completedAt) days.add(r.completedAt.toISOString().slice(0, 10));
  }
  return days.size;
}

async function nextModuleFor(userId: string): Promise<{ lesson: LessonRef; module: ModuleRef; minutes: number } | null> {
  // Trouve le premier module non complété par l'user dans la première
  // langue de son profil. Pour l'instant : premier module allemand publié.
  const doneIds = (await prisma.moduleProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { moduleId: true },
  })).map((r) => r.moduleId);

  const next = await prisma.module.findFirst({
    where: {
      isPublished: true,
      id: { notIn: doneIds.length ? doneIds : undefined },
    },
    orderBy: [
      { course: { level: "asc" } },
      { sortOrder: "asc" },
    ],
    include: { course: true },
  });
  if (!next) return null;
  return {
    lesson: { id: next.course.id, title: next.course.title },
    module: { id: next.id, kind: next.type },
    minutes: 15, // MVP · durée typique d'un module YEMA
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, germanLevel: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const cap = (user.user_metadata?.cap as Cap | undefined) ?? null;
  const next = await nextModuleFor(dbUser.id);

  // capContext selon le cap.
  let capContext: CapContext | null = null;
  if (cap === "franchir") {
    // Nombre de leçons restantes avant le prochain "examen blanc"
    // (jalon fictif au bout du niveau). Compté depuis la position réelle
    // dans le curriculum : total modules du niveau - modules complétés.
    const level = dbUser.germanLevel ?? "A1";
    const totalCount = await prisma.module.count({
      where: { isPublished: true, course: { level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } },
    });
    const doneCount = await prisma.moduleProgress.count({
      where: {
        userId: dbUser.id,
        status: "COMPLETED",
        module: { course: { level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } },
      },
    });
    const remaining = Math.max(0, totalCount - doneCount);
    capContext = {
      kind: "franchir",
      examenBlancLevel: level,
      leconsRestantes: totalCount > 0 ? remaining : null,
    };
  } else if (cap === "grandir") {
    // Pas de vraie donnée « procédure » pour l'instant. On retourne
    // le kind avec compteurs null pour que la carte affiche un
    // StateBlock inviting à raconter son parcours.
    capContext = {
      kind: "grandir",
      step: "en préparation",
      dossiersCompletes: null,
      dossiersTotal: null,
    };
  } else if (cap === "transmettre") {
    // Le conte du soir : on prend le premier récit sources du recueil.
    const conte = VOIX_STORIES.find((s) => s.territory === "sources");
    const soirs = await computeSoirsCetteSemaine(dbUser.id);
    if (conte) {
      capContext = {
        kind: "transmettre",
        conteId: conte.id,
        conteTitre: conte.title,
        minutes: Math.ceil(conte.duration / 60),
        soirsCetteSemaine: soirs,
      };
    }
  } else if (cap === "moi") {
    capContext = {
      kind: "moi",
      rythme: "libre",
    };
  }

  return NextResponse.json({
    cap,
    lesson: next?.lesson ?? null,
    module: next?.module ?? null,
    minutes: next?.minutes ?? 0,
    capContext,
  });
}

// GET /api/me/foyer · Sprint « Le Foyer » — refonte premium.
// L'unique endpoint qui alimente le foyer élève. Renvoie tout ce dont
// l'écran a besoin en une seule requête :
//   · prénom, cap, personalGoal
//   · langues supportées + activeLangue (avec territoire + échelle)
//   · niveau réel + spine visible (aucune invention)
//   · braise (jours consécutifs + activité du jour)
//   · classe si l'user y est inscrit
//   · nextLesson (leçon à reprendre) + pct (progression réelle du niveau)
//   · capContext (jalon Franchir / procédure Grandir / rituel Transmettre
//     / rythme Moi) — configuré par le cap du profil
//
// Doctrine : zéro placeholder mensonger. Toute zone vide arrive à
// `null` et le composant client rend un StateBlock. La braise reste
// éteinte si aucune activité — jamais de compteur inventé.
//
// Étape 1 · squelette + états vides. Les copies éditoriales du hero
// et de la cap-card sont figées côté client (les compteurs viennent
// d'ici, la voix vient de là).
// Étape 2 · alimentera vraiment le capContext pour les 4 caps.
// Étape 3 · seed Jacob (allemand B1, 12 jours de braise) pour tester
// les 4 profils en donnée réelle.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLanguage } from "@/lib/languages";
import { STORIES as VOIX_STORIES } from "@/lib/voix/stories";

export const dynamic = "force-dynamic";

type Cap = "franchir" | "grandir" | "transmettre" | "moi";

interface FoyerLangue {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  territory: "world" | "sources";
  scale: "cefr" | "yema";
  level: string | null;
  levels: readonly string[];
}
interface FoyerBraise {
  jours: number;
  activeAujourdhui: boolean;
}
interface FoyerClasse {
  name: string;
  teacherName: string;
}
interface FoyerLessonRef {
  id: string;
  title: string;
}
interface FoyerModuleRef {
  id: string;
  kind: string;
}

type CapContext =
  | { kind: "franchir"; examenBlancLevel: string; leconsRestantes: number | null }
  | { kind: "grandir"; step: string; dossiersCompletes: number | null; dossiersTotal: number | null }
  | { kind: "transmettre"; conteId: string; conteTitre: string; minutes: number; soirsCetteSemaine: number }
  | { kind: "moi"; rythme: string };

interface FoyerNextLesson {
  lesson: FoyerLessonRef | null;
  module: FoyerModuleRef | null;
  minutes: number;
  /** Progression 0-100 du niveau actif (modules complétés / total du niveau). */
  pct: number | null;
  capContext: CapContext | null;
}

/** Jours consécutifs avec ≥1 module complété (jusqu'à aujourd'hui inclus).
 *  Zéro invention : si l'user n'a jamais fini un module, renvoie 0. */
async function computeBraise(userId: string): Promise<FoyerBraise> {
  const progress = await prisma.moduleProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 500,
  });
  if (progress.length === 0) return { jours: 0, activeAujourdhui: false };

  const days = new Set<string>();
  for (const p of progress) {
    if (!p.completedAt) continue;
    days.add(p.completedAt.toISOString().slice(0, 10));
  }
  const daysList = Array.from(days).sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const activeAujourdhui = daysList[0] === today;

  const cursor = new Date(daysList[0]);
  let jours = 0;
  for (const day of daysList) {
    const d = new Date(day);
    if (d.toISOString().slice(0, 10) === cursor.toISOString().slice(0, 10)) {
      jours += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return { jours, activeAujourdhui };
}

/** Trouve le premier module non complété par l'user. MVP allemand. */
async function nextModuleFor(userId: string): Promise<{ lesson: FoyerLessonRef; module: FoyerModuleRef; minutes: number } | null> {
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
    minutes: 15,
  };
}

/** Progression 0-100 dans le niveau actif. null si le niveau n'a
 *  encore aucun module publié (rien à mesurer). */
async function computeLevelPct(userId: string, level: string): Promise<number | null> {
  const totalCount = await prisma.module.count({
    where: {
      isPublished: true,
      course: { level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" },
    },
  });
  if (totalCount === 0) return null;
  const doneCount = await prisma.moduleProgress.count({
    where: {
      userId,
      status: "COMPLETED",
      module: { course: { level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } },
    },
  });
  return Math.round((doneCount / totalCount) * 100);
}

async function computeSoirsCetteSemaine(userId: string): Promise<number> {
  const now = new Date();
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const rows = await prisma.moduleProgress.findMany({
    where: { userId, status: "COMPLETED", completedAt: { gte: monday } },
    select: { completedAt: true },
  });
  const days = new Set<string>();
  for (const r of rows) {
    if (r.completedAt) days.add(r.completedAt.toISOString().slice(0, 10));
  }
  return days.size;
}

async function buildCapContext(userId: string, cap: Cap | null, level: string | null): Promise<CapContext | null> {
  if (!cap) return null;
  if (cap === "franchir") {
    const lv = level ?? "A1";
    const totalCount = await prisma.module.count({
      where: { isPublished: true, course: { level: lv as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } },
    });
    const doneCount = await prisma.moduleProgress.count({
      where: {
        userId,
        status: "COMPLETED",
        module: { course: { level: lv as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } },
      },
    });
    const remaining = Math.max(0, totalCount - doneCount);
    return {
      kind: "franchir",
      examenBlancLevel: lv,
      leconsRestantes: totalCount > 0 ? remaining : null,
    };
  }
  if (cap === "grandir") {
    // Étape 2 branchera les vraies dossiers (immigration/visa).
    return { kind: "grandir", step: "en préparation", dossiersCompletes: null, dossiersTotal: null };
  }
  if (cap === "transmettre") {
    const conte = VOIX_STORIES.find((s) => s.territory === "sources");
    const soirs = await computeSoirsCetteSemaine(userId);
    if (!conte) return null;
    return {
      kind: "transmettre",
      conteId: conte.id,
      conteTitre: conte.title,
      minutes: Math.ceil(conte.duration / 60),
      soirsCetteSemaine: soirs,
    };
  }
  return { kind: "moi", rythme: "libre" };
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
    include: {
      classroomEnrollments: {
        where: { isActive: true },
        include: { classroom: { include: { teacher: { include: { user: true } } } } },
        take: 1,
      },
    },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const prenom = (dbUser.fullName ?? user.email ?? "").split(/[ @]/)[0] || "";
  const avatarUrl = (metadata.avatar_url as string | undefined) ?? (dbUser.avatarUrl ?? null);
  const cap = ((metadata.cap as string | undefined) ?? null) as Cap | null;
  const personalGoal = (metadata.personalGoal as string | undefined) ?? null;

  const activeLanguageId = (metadata.activeLanguage as string | undefined) ?? "deutsch";
  const supportedIds = Array.isArray(metadata.supportedLanguages)
    ? (metadata.supportedLanguages as string[])
    : [activeLanguageId];

  const langues: FoyerLangue[] = supportedIds.map((id) => {
    const l = getLanguage(id);
    const isDeutsch = l.id === "deutsch";
    const level = isDeutsch ? (dbUser.germanLevel ?? null) : null;
    return {
      id: l.id,
      code: l.code,
      name: l.name,
      nameEn: l.nameEn,
      territory: l.territory,
      scale: l.scale,
      level,
      levels: l.levels,
    };
  });
  const activeLangue = langues.find((l) => l.id === activeLanguageId) ?? langues[0];

  const braise = await computeBraise(dbUser.id);

  const enrolled = dbUser.classroomEnrollments[0];
  const classe: FoyerClasse | null = enrolled?.classroom
    ? {
        name: enrolled.classroom.name,
        teacherName: enrolled.classroom.teacher?.user?.fullName ?? "",
      }
    : null;

  const next = await nextModuleFor(dbUser.id);
  const pct = activeLangue.level ? await computeLevelPct(dbUser.id, activeLangue.level) : null;
  const capContext = await buildCapContext(dbUser.id, cap, activeLangue.level);

  const nextLesson: FoyerNextLesson = {
    lesson: next?.lesson ?? null,
    module: next?.module ?? null,
    minutes: next?.minutes ?? 0,
    pct,
    capContext,
  };

  return NextResponse.json({
    prenom,
    avatarUrl,
    cap,
    personalGoal,
    langues,
    activeLangue,
    braise,
    classe,
    nextLesson,
  });
}

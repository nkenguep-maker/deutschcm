// GET /api/me/foyer — l'unique endpoint qui alimente le foyer élève.
// Renvoie tout ce dont l'écran a besoin : prénom, cap, langues actives
// avec niveau + spine, braise (jours consécutifs), classe si inscrit·e.
// Aucun compte à rebours en jours, aucune invention — les zones vides
// arrivent via null pour laisser StateBlock parler.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";

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

/** Calcule les jours consécutifs (jusqu'à aujourd'hui inclus) avec ≥1
 *  module complété. Zéro invention : si l'utilisateur n'a jamais fini
 *  un module, on retourne 0. */
async function computeBraise(userId: string): Promise<FoyerBraise> {
  const progress = await prisma.moduleProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 500,
  });
  if (progress.length === 0) return { jours: 0, activeAujourdhui: false };

  // Distinct days (YYYY-MM-DD in UTC) — évite les doublons du même jour.
  const days = new Set<string>();
  for (const p of progress) {
    if (!p.completedAt) continue;
    const iso = p.completedAt.toISOString().slice(0, 10);
    days.add(iso);
  }
  const daysList = Array.from(days).sort().reverse(); // du plus récent

  const today = new Date().toISOString().slice(0, 10);
  const activeAujourdhui = daysList[0] === today;

  // Compter consécutif à partir du plus récent (aujourd'hui ou hier).
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
  // Si la dernière activité n'était pas aujourd'hui ni hier, la braise
  // s'est assoupie — on remonte le compteur au dernier streak connu.
  if (!activeAujourdhui) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yiso = yesterday.toISOString().slice(0, 10);
    if (daysList[0] !== yiso) {
      // Assoupie depuis plus d'un jour : compteur figé au streak d'avant.
      // On retourne la longueur mais activeAujourdhui reste false.
    }
  }
  return { jours, activeAujourdhui };
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
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      classroomEnrollments: {
        where: { isActive: true },
        include: {
          classroom: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
        take: 1,
      },
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const prenom = (dbUser.fullName ?? user.email ?? "").split(/[ @]/)[0] || "";
  const cap = (metadata.cap as string | undefined) ?? null;
  const personalGoal = (metadata.personalGoal as string | undefined) ?? null;

  const activeLanguageId = (metadata.activeLanguage as string | undefined) ?? "deutsch";
  const supportedIds = Array.isArray(metadata.supportedLanguages)
    ? (metadata.supportedLanguages as string[])
    : [activeLanguageId];

  // Récupère les métas de chaque langue supportée.
  const langues: FoyerLangue[] = supportedIds.map((id) => {
    const l = getLanguage(id);
    const isDeutsch = l.id === "deutsch";
    // Niveau : germanLevel legacy pour l'allemand, sinon premier palier
    // en attendant le model UserLanguage.
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

  return NextResponse.json({
    prenom,
    cap,
    personalGoal,
    langues,
    activeLangue,
    braise,
    classe,
  });
}

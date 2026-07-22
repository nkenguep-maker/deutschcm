// P1 · /decouverte/[n] · leçon N de découverte (server component + client form).
//
// N ∈ {1,2,3,4}. Lit le LearningPath actif de l'user, sélectionne le contenu
// depuis src/lib/discovery.ts (deutsch active). Persiste la complétion via
// PATCH /api/funnel. Aucune IA, aucun audio inventé.

import { notFound } from "next/navigation";
import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getDiscoveryLesson, isLanguageActive, prismaLangToId } from "@/lib/discovery";
import { readAnswers } from "@/lib/funnel-state";
import { DiscoveryLessonClient } from "./DiscoveryLessonClient";

interface Props {
  params: Promise<{ locale: string; n: string }>;
}

export default async function DiscoveryLessonPage({ params }: Props) {
  const { locale, n } = await params;
  const num = Number.parseInt(n, 10);
  if (![1, 2, 3, 4].includes(num)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!lp) { redirect({ href: "/onboarding", locale }); return null; }

  const langId = prismaLangToId(lp.language);
  if (!langId || !isLanguageActive(langId)) {
    redirect({ href: "/decouverte/attente", locale });
    return null;
  }

  const lesson = getDiscoveryLesson(langId, num as 1 | 2 | 3 | 4);
  if (!lesson) { notFound(); }

  // Narrowing après notFound (throw) — TS ne le sait pas toujours.
  const safeLesson = lesson!;
  const answers = readAnswers(lp);
  const completed = new Set(answers.discoveryProgress ?? []);
  const isAlreadyDone = completed.has(num);

  return (
    <DiscoveryLessonClient
      langId={langId}
      lesson={safeLesson}
      alreadyDone={isAlreadyDone}
      currentLevel={lp.currentLevel ?? answers.cefrSelfAssessed ?? null}
      progress={Array.from(completed).sort((a, b) => a - b)}
      locale={locale === "en" ? "en" : "fr"}
    />
  );
}

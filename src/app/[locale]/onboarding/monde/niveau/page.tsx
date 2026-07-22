// P1 hardening · Auto-évaluation Monde · 5 options CECR.
// Server component + client form. Router /onboarding envoie ici quand
// LANGUAGE_SELECTED (formulaire d'univers fini) et selfAssessmentAnswer manquant.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { readAnswers } from "@/lib/funnel-state";
import { NiveauForm } from "./NiveauForm";

interface Props { params: Promise<{ locale: string }> }

export default async function NiveauMondePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE", universe: "MONDE" },
    orderBy: { createdAt: "desc" },
  });
  if (!lp) { redirect({ href: "/onboarding/monde", locale }); return null; }

  const answers = readAnswers(lp);
  const currentAnswer = answers.selfAssessmentAnswer ?? null;
  const currentLevel = (answers.declaredLevel ?? lp.currentLevel ?? null) as string | null;

  return <NiveauForm universe="MONDE" locale={locale === "en" ? "en" : "fr"} currentAnswer={currentAnswer} currentLevel={currentLevel} />;
}

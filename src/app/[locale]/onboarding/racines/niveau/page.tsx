// P1 hardening · Auto-évaluation Racines · 5 options É1-É5.
// Server component + client form (partagé avec Monde).

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { readAnswers } from "@/lib/funnel-state";
import { NiveauForm } from "../../monde/niveau/NiveauForm";

interface Props { params: Promise<{ locale: string }> }

export default async function NiveauRacinesPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE", universe: "RACINES" },
    orderBy: { createdAt: "desc" },
  });
  if (!lp) { redirect({ href: "/onboarding/racines", locale }); return null; }

  const answers = readAnswers(lp);
  const currentAnswer = answers.selfAssessmentAnswer ?? null;
  const currentLevel = (answers.declaredLevel ?? null) as string | null;

  return <NiveauForm universe="RACINES" locale={locale === "en" ? "en" : "fr"} currentAnswer={currentAnswer} currentLevel={currentLevel} />;
}

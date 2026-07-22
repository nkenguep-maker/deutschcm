// P1 · /activation-intent · sélection d'une offre en fin de découverte.
// Doctrine §19-21 : aucun paiement, aucun entitlement accordé. On persiste
// uniquement le choix commercial pour préparer P5.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { readAnswers } from "@/lib/funnel-state";
import { ActivationIntentClient } from "./ActivationIntentClient";

interface Props { params: Promise<{ locale: string }> }

export default async function ActivationIntentPage({ params }: Props) {
  const { locale } = await params;
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

  const answers = readAnswers(lp);
  const universe: "MONDE" | "RACINES" = lp.universe;
  const suggestedLevel = lp.currentLevel ?? answers.cefrSelfAssessed ?? "A1";

  return (
    <ActivationIntentClient
      locale={locale === "en" ? "en" : "fr"}
      universe={universe}
      suggestedLevel={suggestedLevel}
      existingIntent={answers.activationIntent ?? null}
    />
  );
}

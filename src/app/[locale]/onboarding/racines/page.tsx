// /onboarding/racines · Server Component wrapper.
// Vérifie la session AVANT de rendre le formulaire (voir monde/page.tsx
// pour la doctrine). Si l'user a déjà un LP RACINES actif ET est marqué
// onboarded pour son rôle, on renvoie sur /dashboard · évite la boucle
// onboarding ↔ dashboard sur accès direct après complétion.

import { redirect } from "@/navigation";
import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { OnboardingRacinesForm } from "./OnboardingRacinesForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingRacinesPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireSession({ locale, returnTo: "/onboarding/racines" });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (dbUser) {
    const lp = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE", universe: "RACINES" },
      select: { id: true },
    });
    const studentRole = await prisma.userRole.findFirst({
      where: { userId: dbUser.id, role: "STUDENT", onboarded: true },
      select: { id: true },
    });
    if (lp && studentRole) {
      redirect({ href: "/dashboard", locale });
    }
  }

  return <OnboardingRacinesForm />;
}

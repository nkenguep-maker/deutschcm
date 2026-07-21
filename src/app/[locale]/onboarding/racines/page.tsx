// /onboarding/racines · Server Component wrapper.
// Vérifie la session AVANT de rendre le formulaire (voir monde/page.tsx
// pour la doctrine).

import { requireSession } from "@/lib/requireSession";
import { OnboardingRacinesForm } from "./OnboardingRacinesForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingRacinesPage({ params }: Props) {
  const { locale } = await params;
  await requireSession({ locale, returnTo: "/onboarding/racines" });
  return <OnboardingRacinesForm />;
}

// /onboarding/monde · Server Component wrapper.
// Vérifie la session AVANT de rendre le formulaire. Si absente/invalide :
// redirect immédiat vers /login?next=/{locale}/onboarding/monde. Aucun
// flash, aucun formulaire rempli pour rien.

import { requireSession } from "@/lib/requireSession";
import { OnboardingMondeForm } from "./OnboardingMondeForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingMondePage({ params }: Props) {
  const { locale } = await params;
  await requireSession({ locale, returnTo: "/onboarding/monde" });
  return <OnboardingMondeForm />;
}

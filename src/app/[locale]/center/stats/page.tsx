// P4.3a · Center stats · SSR · scope strict centerId.
// Les agrégats détaillés (rétention, top students, revenu, distribution niveaux)
// ne sont pas calculables depuis la base actuelle · voir §8 spec P4.3a.
// La page affiche uniquement les chiffres réels du dashboard et déclare
// honnêtement les métriques indisponibles. Zéro nom fictif, zéro chiffre inventé.

import { redirect } from "next/navigation";
import { getFlag } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterDashboard } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterDashboardView from "@/components/center/CenterDashboardView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!getFlag("CENTER_REAL_DATA_ENABLED")) {
    return <CenterFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const stats = await getCenterDashboard(actor.centerId);
  return (
    <CenterDashboardView
      locale={locale}
      center={actor.center}
      stats={stats}
    />
  );
}

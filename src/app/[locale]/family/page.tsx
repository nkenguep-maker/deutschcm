// P4.6 Lot 4A · Dashboard Famille YEMA (redesign) · route locale-aware neuve.
// Legacy /famille reste intact (français-only) et non touché par ce lot.

import { redirect } from "next/navigation";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { FamilyDashboard } from "@/features/dashboards/family";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const actor = await resolveFamilyGuardianActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  return <FamilyDashboard locale={loc} />;
}

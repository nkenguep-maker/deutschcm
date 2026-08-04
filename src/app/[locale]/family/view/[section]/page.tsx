import { redirect } from "next/navigation";
import { resolveFamilyGuardianActorOrNull } from "@/lib/family/actor";
import { FamilyDashboard } from "@/features/dashboards/family";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";

export const dynamic = "force-dynamic";

export default async function FamilyPersonaSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["family"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={section} />;
  const actor = await resolveFamilyGuardianActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  return <FamilyDashboard locale={loc} activeSectionId={section} />;
}

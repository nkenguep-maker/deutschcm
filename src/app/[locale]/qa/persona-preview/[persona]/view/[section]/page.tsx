import { notFound } from "next/navigation";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";
import { isInternalPersonaId } from "@/lib/internalPersona";

export const dynamic = "force-dynamic";

export default async function QaPersonaSectionPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; persona: string; section: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();

  const { locale, persona, section } = await params;
  if (!isInternalPersonaId(persona)) notFound();
  if (!INTERNAL_PERSONA_UI_CONTRACTS[persona].sections.some((item) => item.id === section)) notFound();

  const loc = locale === "en" ? "en" : "fr";
  return (
    <InternalPersonaDashboard
      persona={persona}
      locale={loc}
      activeSectionId={section}
      baseHrefOverride={`/${loc}/qa/persona-preview/${persona}`}
    />
  );
}

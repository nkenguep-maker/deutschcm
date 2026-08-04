import { notFound } from "next/navigation";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { isInternalPersonaId } from "@/lib/internalPersona";

export const dynamic = "force-dynamic";

export default async function QaPersonaPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; persona: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();

  const { locale, persona } = await params;
  if (!isInternalPersonaId(persona)) notFound();

  const loc = locale === "en" ? "en" : "fr";
  return (
    <InternalPersonaDashboard
      persona={persona}
      locale={loc}
      baseHrefOverride={`/${loc}/qa/persona-preview/${persona}`}
    />
  );
}

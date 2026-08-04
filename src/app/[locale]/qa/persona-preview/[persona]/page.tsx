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

  return (
    <InternalPersonaDashboard
      persona={persona}
      locale={locale === "en" ? "en" : "fr"}
    />
  );
}

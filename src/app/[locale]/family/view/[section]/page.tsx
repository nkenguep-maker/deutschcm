import { InternalPersonaSectionRoute } from "@/features/dashboards/internal-test/InternalPersonaSectionRoute";

export const dynamic = "force-dynamic";

export default async function FamilyPersonaSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  return <InternalPersonaSectionRoute accepted={["family"]} locale={locale} sectionId={section} />;
}

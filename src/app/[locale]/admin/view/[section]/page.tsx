import { InternalPersonaSectionRoute } from "@/features/dashboards/internal-test/InternalPersonaSectionRoute";

export const dynamic = "force-dynamic";

export default async function AdminPersonaSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  return <InternalPersonaSectionRoute accepted={["super_admin"]} locale={locale} sectionId={section} />;
}

import { InternalPersonaSectionRoute } from "@/features/dashboards/internal-test/InternalPersonaSectionRoute";

export const dynamic = "force-dynamic";

export default async function TeacherPersonaSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  return <InternalPersonaSectionRoute accepted={["teacher"]} locale={locale} sectionId={section} />;
}

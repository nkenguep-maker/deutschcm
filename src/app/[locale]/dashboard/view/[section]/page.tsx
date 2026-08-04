import { InternalPersonaSectionRoute } from "@/features/dashboards/internal-test/InternalPersonaSectionRoute";

export const dynamic = "force-dynamic";

export default async function PersonaDashboardSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  return (
    <InternalPersonaSectionRoute
      accepted={["student_monde", "student_racines", "child_monde", "child_racines"]}
      locale={locale}
      sectionId={section}
    />
  );
}

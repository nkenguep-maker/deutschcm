import { LiveStudentSectionRoute } from "@/features/dashboards/live/LiveStudentSectionRoute";

export const dynamic = "force-dynamic";

export default async function PersonaDashboardSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  return <LiveStudentSectionRoute locale={locale} sectionId={section} />;
}

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import { TeacherDashboard } from "@/features/dashboards/teacher";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";

export const dynamic = "force-dynamic";

export default async function TeacherPersonaSectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["teacher"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={section} />;
  if (!isTeacherWorkspaceActive()) return <TeacherFeaturePlaceholder locale={locale} />;
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  if (!isYemaDashboardRedesignActive()) redirect(`/${locale}/teacher`);
  return <TeacherDashboard locale={loc} activeSectionId={section} />;
}

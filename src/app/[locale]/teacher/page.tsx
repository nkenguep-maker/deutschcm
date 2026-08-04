// P4.3b · Teacher dashboard · SSR · scope strict teacherId.

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import { getTeacherDashboard } from "@/lib/teacher/queries";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherDashboardView from "@/components/teacher/TeacherDashboardView";
import { TeacherDashboard } from "@/features/dashboards/teacher";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isTeacherWorkspaceActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  // P4.6 · redesign flag. Legacy gate reste autoritaire ; redesign remplace
  // uniquement la vue rendue quand flag=true. Aucun changement de resolver.
  if (isYemaDashboardRedesignActive()) {
    const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
    return <TeacherDashboard locale={loc} />;
  }

  const stats = await getTeacherDashboard(actor.teacherId);
  return (
    <TeacherDashboardView
      locale={locale}
      teacher={{ id: actor.teacher.id, isVerified: actor.teacher.isVerified }}
      center={actor.center}
      stats={stats}
    />
  );
}

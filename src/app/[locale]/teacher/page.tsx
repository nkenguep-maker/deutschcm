// P4.3b · Teacher dashboard · SSR · scope strict teacherId.

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import { getTeacherDashboard } from "@/lib/teacher/queries";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherDashboardView from "@/components/teacher/TeacherDashboardView";
import { TeacherDashboard } from "@/features/dashboards/teacher";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const internalPersona = await resolveActiveInternalPersona(["teacher"]);
  if (internalPersona) {
    return <InternalPersonaDashboard persona={internalPersona} locale={loc} />;
  }

  if (!isTeacherWorkspaceActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  if (isYemaDashboardRedesignActive()) {
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

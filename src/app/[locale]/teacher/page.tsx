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
import { createClient } from "@/lib/supabase/server";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (runtime.persona && runtime.persona !== "teacher") {
    redirect(`/${locale}${runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute}`);
  }
  if (runtime.persona === "teacher" && !runtime.onboarded) {
    redirect(`/${locale}${runtime.onboardingRoute}`);
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

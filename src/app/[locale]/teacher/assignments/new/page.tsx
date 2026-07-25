// P4.5-B2b3b-a · Formulaire création assignment Teacher · server wrapper.

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isAssignmentsActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherAssignmentCreateView from "@/components/teacher/TeacherAssignmentCreateView";
import { getTeacherClasses } from "@/lib/teacher/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classroomId?: string }>;
}) {
  const { locale } = await params;
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const { items: classrooms } = await getTeacherClasses(actor.teacherId, { pageSize: 100 });
  const sp = await searchParams;
  return (
    <TeacherAssignmentCreateView
      locale={locale}
      classrooms={classrooms}
      presetClassroomId={sp?.classroomId ?? null}
    />
  );
}

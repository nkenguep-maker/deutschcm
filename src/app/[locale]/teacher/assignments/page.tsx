// P4.5-B2b3b-a Gate UI Teacher · liste assignments Teacher.
// Résolution 4 états (feature off / anonymous / role absent / OK) via
// pageResolver. Data via adapter (délégué services B1).

import { redirect } from "next/navigation";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherRoleAbsentPlaceholder from "@/components/teacher/TeacherRoleAbsentPlaceholder";
import TeacherAssignmentsView from "@/components/teacher/TeacherAssignmentsView";
import { resolveTeacherPage } from "@/lib/teacher/pageResolver";
import { loadTeacherAssignmentsForClassroom } from "@/lib/teacher/assignmentsAdapter";
import { getTeacherClasses } from "@/lib/teacher/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classroomId?: string }>;
}) {
  const { locale } = await params;
  const resolution = await resolveTeacherPage();
  if (resolution.kind === "feature_off") return <TeacherFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <TeacherRoleAbsentPlaceholder locale={locale} />;

  const { items: classrooms } = await getTeacherClasses(resolution.actor.teacherId, { pageSize: 100 });
  const sp = await searchParams;
  const selectedClassroomId = sp?.classroomId ?? (classrooms[0]?.id ?? null);
  const assignments = selectedClassroomId
    ? (await loadTeacherAssignmentsForClassroom(resolution.actor, selectedClassroomId)) ?? []
    : [];
  return (
    <TeacherAssignmentsView
      locale={locale}
      classrooms={classrooms}
      selectedClassroomId={selectedClassroomId}
      assignments={assignments}
    />
  );
}

// P4.5-B2b3b-a Gate UI Teacher · création assignment.

import { redirect } from "next/navigation";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherRoleAbsentPlaceholder from "@/components/teacher/TeacherRoleAbsentPlaceholder";
import TeacherAssignmentCreateView from "@/components/teacher/TeacherAssignmentCreateView";
import { resolveTeacherPage } from "@/lib/teacher/pageResolver";
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
  return (
    <TeacherAssignmentCreateView
      locale={locale}
      classrooms={classrooms}
      presetClassroomId={sp?.classroomId ?? null}
    />
  );
}

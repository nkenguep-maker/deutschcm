// P4.3b · Teacher class detail · SSR · scope strict teacherId.

import { notFound, redirect } from "next/navigation";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import {
  resolveTeacherActorOrNull,
  assertTeacherOwnsClassroom,
} from "@/lib/permissions/teacher";
import {
  getTeacherClass,
  getTeacherClassStudents,
} from "@/lib/teacher/queries";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherClassDetailView from "@/components/teacher/TeacherClassDetailView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; classroomId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale, classroomId }, sp] = await Promise.all([params, searchParams]);
  if (!isTeacherWorkspaceActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);

  try {
    await assertTeacherOwnsClassroom(actor, classroomId);
  } catch {
    notFound();
  }
  const classroom = await getTeacherClass(actor.teacherId, classroomId);
  if (!classroom) notFound();
  const page = Number(sp.page ?? 1);
  const students = await getTeacherClassStudents(actor.teacherId, classroomId, { page });
  return (
    <TeacherClassDetailView
      locale={locale}
      classroom={classroom}
      students={students.items}
      total={students.total}
      page={students.page}
      pageSize={students.pageSize}
    />
  );
}

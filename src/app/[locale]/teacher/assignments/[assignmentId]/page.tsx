// P4.5-B2b3b-a · Détail assignment Teacher · server wrapper.

import { notFound, redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isAssignmentsActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherAssignmentDetailView from "@/components/teacher/TeacherAssignmentDetailView";
import {
  getTeacherAssignmentDetail,
  getTeacherAssignmentSubmissions,
} from "@/lib/teacher/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>;
}) {
  const { locale, assignmentId } = await params;
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const assignment = await getTeacherAssignmentDetail(actor.teacherId, assignmentId);
  if (!assignment) notFound();
  const submissions = assignment.status === "PUBLISHED" || assignment.status === "CLOSED"
    ? await getTeacherAssignmentSubmissions(actor.teacherId, assignmentId)
    : [];
  return (
    <TeacherAssignmentDetailView
      locale={locale}
      assignment={assignment}
      submissions={submissions}
    />
  );
}

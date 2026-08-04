// P4.5-B2b3b-a Gate UI Teacher · détail assignment.

import { notFound, redirect } from "next/navigation";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherRoleAbsentPlaceholder from "@/components/teacher/TeacherRoleAbsentPlaceholder";
import TeacherAssignmentDetailView from "@/components/teacher/TeacherAssignmentDetailView";
import { resolveTeacherPage } from "@/lib/teacher/pageResolver";
import {
  loadTeacherAssignment,
  loadTeacherAssignmentSubmissions,
} from "@/lib/teacher/assignmentsAdapter";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>;
}) {
  const { locale, assignmentId } = await params;
  const resolution = await resolveTeacherPage();
  if (resolution.kind === "feature_off") return <TeacherFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <TeacherRoleAbsentPlaceholder locale={locale} />;

  const assignment = await loadTeacherAssignment(resolution.actor, assignmentId);
  if (!assignment) notFound();
  const submissions = assignment.status === "PUBLISHED" || assignment.status === "CLOSED"
    ? (await loadTeacherAssignmentSubmissions(resolution.actor, assignmentId)) ?? []
    : [];
  return (
    <TeacherAssignmentDetailView
      locale={locale}
      assignment={assignment}
      submissions={submissions}
    />
  );
}

// P4.5-B2b3b-b1 Student UI · détail d'un devoir + versions du Student.

import { notFound, redirect } from "next/navigation";
import StudentFeaturePlaceholder from "@/components/student/StudentFeaturePlaceholder";
import StudentRoleAbsentPlaceholder from "@/components/student/StudentRoleAbsentPlaceholder";
import StudentAssignmentDetailView from "@/components/student/StudentAssignmentDetailView";
import { resolveStudentPage } from "@/lib/student/pageResolver";
import { loadStudentAssignmentDetail } from "@/lib/student/assignmentsAdapter";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>;
}) {
  const { locale, assignmentId } = await params;
  const resolution = await resolveStudentPage();
  if (resolution.kind === "feature_disabled") return <StudentFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <StudentRoleAbsentPlaceholder locale={locale} />;

  const assignment = await loadStudentAssignmentDetail(resolution.actor, assignmentId);
  if (!assignment) notFound();
  return <StudentAssignmentDetailView locale={locale} assignment={assignment} />;
}

// P4.5-B2b3b-b1 Student UI · détail d'une submission du Student courant
// avec feedbacks PUBLISHED/ADDENDUM uniquement.

import { notFound, redirect } from "next/navigation";
import StudentFeaturePlaceholder from "@/components/student/StudentFeaturePlaceholder";
import StudentRoleAbsentPlaceholder from "@/components/student/StudentRoleAbsentPlaceholder";
import StudentSubmissionView from "@/components/student/StudentSubmissionView";
import { resolveStudentPage } from "@/lib/student/pageResolver";
import { loadStudentSubmissionDetail } from "@/lib/student/assignmentsAdapter";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; submissionId: string }>;
}) {
  const { locale, submissionId } = await params;
  const resolution = await resolveStudentPage();
  if (resolution.kind === "feature_disabled") return <StudentFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <StudentRoleAbsentPlaceholder locale={locale} />;

  const submission = await loadStudentSubmissionDetail(resolution.actor, submissionId);
  if (!submission) notFound();
  return <StudentSubmissionView locale={locale} submission={submission} />;
}

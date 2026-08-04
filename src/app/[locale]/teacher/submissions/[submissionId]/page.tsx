// P4.5-B2b3b-a Gate UI Teacher · détail submission.

import { notFound, redirect } from "next/navigation";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherRoleAbsentPlaceholder from "@/components/teacher/TeacherRoleAbsentPlaceholder";
import TeacherSubmissionDetailView from "@/components/teacher/TeacherSubmissionDetailView";
import { resolveTeacherPage } from "@/lib/teacher/pageResolver";
import { loadTeacherSubmissionDetail } from "@/lib/teacher/assignmentsAdapter";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; submissionId: string }>;
}) {
  const { locale, submissionId } = await params;
  const resolution = await resolveTeacherPage();
  if (resolution.kind === "feature_off") return <TeacherFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <TeacherRoleAbsentPlaceholder locale={locale} />;

  const submission = await loadTeacherSubmissionDetail(resolution.actor, submissionId);
  if (!submission) notFound();
  return <TeacherSubmissionDetailView locale={locale} submission={submission} />;
}

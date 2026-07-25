// P4.5-B2b3b-a · Détail submission Teacher · server wrapper.

import { notFound, redirect } from "next/navigation";
import { isTeacherWorkspaceActive, isAssignmentsActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherSubmissionDetailView from "@/components/teacher/TeacherSubmissionDetailView";
import { getTeacherSubmissionDetail } from "@/lib/teacher/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; submissionId: string }>;
}) {
  const { locale, submissionId } = await params;
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const submission = await getTeacherSubmissionDetail(actor.teacherId, submissionId);
  if (!submission) notFound();
  return <TeacherSubmissionDetailView locale={locale} submission={submission} />;
}

// P4.5-B2b3b-b1 Student UI · liste des devoirs du Student courant.
// Résolution 4 états (feature_disabled / anonymous / role_absent / enabled)
// via `resolveStudentPage`. Data via adapter (délégué services B1).

import { redirect } from "next/navigation";
import StudentFeaturePlaceholder from "@/components/student/StudentFeaturePlaceholder";
import StudentRoleAbsentPlaceholder from "@/components/student/StudentRoleAbsentPlaceholder";
import StudentAssignmentsView from "@/components/student/StudentAssignmentsView";
import { resolveStudentPage } from "@/lib/student/pageResolver";
import { loadStudentAssignments } from "@/lib/student/assignmentsAdapter";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolution = await resolveStudentPage();
  if (resolution.kind === "feature_disabled") return <StudentFeaturePlaceholder locale={locale} />;
  if (resolution.kind === "anonymous") redirect(`/${locale}/login`);
  if (resolution.kind === "role_absent") return <StudentRoleAbsentPlaceholder locale={locale} />;

  const assignments = (await loadStudentAssignments(resolution.actor)) ?? [];
  return <StudentAssignmentsView locale={locale} assignments={assignments} />;
}

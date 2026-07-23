// P4.3b · Teacher assignments · LOCK_HONESTLY (P4.5 dependency).

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherLockedView from "@/components/teacher/TeacherLockedView";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: "Devoirs",
    body: "La création et le suivi des activités seront disponibles dans une prochaine étape.",
  },
  en: {
    title: "Assignments",
    body: "Creating and tracking activities will be available in a later step.",
  },
} as const;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isTeacherWorkspaceActive()) {
    return <TeacherFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveTeacherActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const c = locale === "en" ? COPY.en : COPY.fr;
  return <TeacherLockedView locale={locale} title={c.title} body={c.body} />;
}

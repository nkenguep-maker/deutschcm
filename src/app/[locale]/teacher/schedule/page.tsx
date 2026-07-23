// P4.3b · Teacher schedule · SSR · LOCK_HONESTLY.
//
// Aucun modèle de planning fiable en base actuelle · pas d'invention d'horaires.

import { redirect } from "next/navigation";
import { isTeacherWorkspaceActive } from "@/lib/flags";
import { resolveTeacherActorOrNull } from "@/lib/permissions/teacher";
import TeacherFeaturePlaceholder from "@/components/teacher/TeacherFeaturePlaceholder";
import TeacherLockedView from "@/components/teacher/TeacherLockedView";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: "Planning",
    body: "Le planning détaillé sera bientôt disponible.",
  },
  en: {
    title: "Schedule",
    body: "The detailed schedule will be available soon.",
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

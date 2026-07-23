// P4.4 · Sessions · LOCK_HONESTLY · workflow réservation à venir.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachLockedView from "@/components/rootsCoach/RootsCoachLockedView";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: "Sessions",
    body: "La réservation et le suivi des sessions mensuelles seront disponibles dans une prochaine étape.",
  },
  en: {
    title: "Sessions",
    body: "Monthly session booking and tracking will be available in a later step.",
  },
} as const;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const c = locale === "en" ? COPY.en : COPY.fr;
  return <RootsCoachLockedView locale={locale} active="sessions" title={c.title} body={c.body} />;
}

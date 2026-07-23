// P4.4 · Activities · LOCK_HONESTLY P4.5.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachLockedView from "@/components/rootsCoach/RootsCoachLockedView";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: "Activités",
    body: "La création et le suivi des activités seront disponibles dans une prochaine étape.",
  },
  en: {
    title: "Activities",
    body: "Creating and tracking activities will be available in a later step.",
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
  return <RootsCoachLockedView locale={locale} active="activities" title={c.title} body={c.body} />;
}

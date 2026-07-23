// P4.4 · Messages · LOCK_HONESTLY P4.6 · aucune messagerie coach-enfant.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachLockedView from "@/components/rootsCoach/RootsCoachLockedView";

export const dynamic = "force-dynamic";

const COPY = {
  fr: {
    title: "Messages",
    body: "La messagerie coach-parent-enfant sera disponible dans une prochaine étape. Aucune conversation privée coach-enfant.",
  },
  en: {
    title: "Messages",
    body: "Coach-parent-child messaging will be available in a later step. No private coach-child conversations.",
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
  return <RootsCoachLockedView locale={locale} active="messages" title={c.title} body={c.body} />;
}

// P4.4 · Profils suivis · SSR · scope strict coach.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import { getRootsCoachProfiles } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachProfilesView from "@/components/rootsCoach/RootsCoachProfilesView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const page = Number(sp.page ?? 1);
  const query = typeof sp.query === "string" ? sp.query : "";
  const result = await getRootsCoachProfiles(actor.userId, { page, query });
  return (
    <RootsCoachProfilesView
      locale={locale}
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={query}
    />
  );
}

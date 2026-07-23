// P4.4 · Circles list · SSR · scope strict coach.

import { redirect } from "next/navigation";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActorOrNull } from "@/lib/permissions/rootsCoach";
import { getRootsCoachCircles } from "@/lib/rootsCoach/queries";
import RootsCoachFeaturePlaceholder from "@/components/rootsCoach/RootsCoachFeaturePlaceholder";
import RootsCoachCirclesView from "@/components/rootsCoach/RootsCoachCirclesView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!isRootsCoachWorkspaceActive()) {
    return <RootsCoachFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveRootsCoachActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const page = Number(sp.page ?? 1);
  const result = await getRootsCoachCircles(actor.userId, { page });
  return (
    <RootsCoachCirclesView
      locale={locale}
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
    />
  );
}

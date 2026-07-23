// P4.3a · Center classes · SSR · scope strict centerId.

import { redirect } from "next/navigation";
import { getFlag } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterClasses } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterClassesView from "@/components/center/CenterClassesView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!getFlag("CENTER_REAL_DATA_ENABLED")) {
    return <CenterFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const page = Number(sp.page ?? 1);
  const query = typeof sp.query === "string" ? sp.query : "";
  const result = await getCenterClasses(actor.centerId, { page, query });
  return (
    <CenterClassesView
      locale={locale}
      center={actor.center}
      items={result.items}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      query={query}
    />
  );
}

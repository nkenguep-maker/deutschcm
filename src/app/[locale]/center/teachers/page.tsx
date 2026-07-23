// P4.3a · Center teachers · SSR · scope strict centerId.

import { redirect } from "next/navigation";
import { getFlag } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterTeachers } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterTeachersView from "@/components/center/CenterTeachersView";

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
  const result = await getCenterTeachers(actor.centerId, { page, query });
  return (
    <CenterTeachersView
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

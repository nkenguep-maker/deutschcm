// P4.3a · Center students · SSR · scope strict centerId.
// Sépare étudiants actifs et inscriptions en attente. Aucune donnée famille
// ou Racines. Aucun mock.

import { redirect } from "next/navigation";
import { getFlag } from "@/lib/flags";
import { resolveCenterActorOrNull } from "@/lib/permissions/center";
import { getCenterStudents, getCenterPendingEnrollments } from "@/lib/center/queries";
import CenterFeaturePlaceholder from "@/components/center/CenterFeaturePlaceholder";
import CenterStudentsView from "@/components/center/CenterStudentsView";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; query?: string; classId?: string; tab?: "active" | "pending" }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!getFlag("CENTER_REAL_DATA_ENABLED")) {
    return <CenterFeaturePlaceholder locale={locale} />;
  }
  const actor = await resolveCenterActorOrNull();
  if (!actor) redirect(`/${locale}/login`);
  const page = Number(sp.page ?? 1);
  const query = typeof sp.query === "string" ? sp.query : "";
  const classId = typeof sp.classId === "string" && sp.classId.length >= 4 ? sp.classId : null;
  const tab = sp.tab === "pending" ? "pending" : "active";

  const [active, pending] = await Promise.all([
    getCenterStudents(actor.centerId, { page, query, classId }),
    getCenterPendingEnrollments(actor.centerId, { page: 1, pageSize: 25 }),
  ]);
  return (
    <CenterStudentsView
      locale={locale}
      center={actor.center}
      active={active}
      pending={pending}
      tab={tab}
      query={query}
      classId={classId}
    />
  );
}

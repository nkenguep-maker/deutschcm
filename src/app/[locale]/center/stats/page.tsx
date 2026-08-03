// Legacy route /[locale]/center/stats · redirect permanent vers /[locale]/center.
// Le nouveau CenterDashboard consolide les compteurs (teacher/classroom/
// student/pending) et les métriques indisponibles sont déclarées côté vue
// unifiée · plus de dépendance inconditionnelle à CenterDashboardView.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/center`);
}

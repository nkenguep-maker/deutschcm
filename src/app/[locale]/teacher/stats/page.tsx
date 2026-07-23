// P4.3b · Teacher stats · redirige vers le dashboard réel.
// Les agrégats avancés (rétention, skills breakdown, weekly demo) sont
// LOCK_HONESTLY · aucune donnée persistée fiable en P4.3b.

import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/teacher`);
}

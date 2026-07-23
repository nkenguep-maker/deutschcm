// P4.3b · Le détail étudiant (progression fine, historique de sessions) n'est
// pas calculable en P4.3b · aucune donnée persistée fiable côté schéma.
// Redirect vers la liste agrégée · élimine 638 lignes de mock (charts fictifs,
// données Racines/Household jamais exposables à un Teacher, faux noms).

import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/teacher/students`);
}

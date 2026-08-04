// P4.6 Lot 4B · Admin dispatch server-side.
//
// Flag YEMA_DASHBOARD_REDESIGN_ENABLED gate le rendu :
//   false → LegacyAdminDashboard (client component byte-identique au
//           legacy antérieur — le contenu original est déplacé dans
//           LegacyAdminDashboard.tsx sans modification fonctionnelle,
//           seule la fonction est renommée pour éviter la collision).
//   true  → AdminDashboard YEMA (server-first, données résolvées via
//           src/lib/admin/consoleData.ts, aucune fetch client, aucun
//           secret rendu).

import { isYemaDashboardRedesignActive } from "@/lib/flags";
import { AdminDashboard } from "@/features/dashboards/admin";
import {
  getAdminEnvSummary,
  getAdminPersonas,
  getAdminRecentAudit,
} from "@/lib/admin/consoleData";
import LegacyAdminDashboard from "./LegacyAdminDashboard";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isYemaDashboardRedesignActive()) {
    return <LegacyAdminDashboard />;
  }

  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const [personas, audit, env] = await Promise.all([
    Promise.resolve(getAdminPersonas(loc)),
    getAdminRecentAudit(20),
    Promise.resolve(getAdminEnvSummary()),
  ]);

  return <AdminDashboard locale={loc} personas={personas} audit={audit} env={env} />;
}

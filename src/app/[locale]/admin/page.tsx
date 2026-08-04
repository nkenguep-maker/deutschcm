// P4.6 Lot 4B · Admin dispatch server-side.

import { isYemaDashboardRedesignActive } from "@/lib/flags";
import { AdminDashboard } from "@/features/dashboards/admin";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
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
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const internalPersona = await resolveActiveInternalPersona(["super_admin"]);
  if (internalPersona) {
    return <InternalPersonaDashboard persona={internalPersona} locale={loc} />;
  }

  if (!isYemaDashboardRedesignActive()) {
    return <LegacyAdminDashboard />;
  }

  const [personas, audit, env] = await Promise.all([
    Promise.resolve(getAdminPersonas(loc)),
    getAdminRecentAudit(20),
    Promise.resolve(getAdminEnvSummary()),
  ]);

  return <AdminDashboard locale={loc} personas={personas} audit={audit} env={env} />;
}

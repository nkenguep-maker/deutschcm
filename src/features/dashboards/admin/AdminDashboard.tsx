"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildAdminNav, buildAdminMobileTabs } from "./nav";
import type { AdminAuditRow, AdminEnvSummary, AdminPersonaRow } from "./types";

type Props = { locale: "fr" | "en"; personas: AdminPersonaRow[]; audit: AdminAuditRow[]; env: AdminEnvSummary; activeSectionId?: string };
const ALLOWED = new Set(["console", "comptes", "audit", "environnement"]);

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function AdminDashboard({ locale, personas, audit, env, activeSectionId = "console" }: Props) {
  const t = useTranslations("yemaDashboards.admin");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "console";
  const baseHref = `/${currentLocale ?? locale}/admin`;
  const activeHref = sectionPageHref(baseHref, activeSection, "console");
  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const navGroups = routeSectionNav(buildAdminNav({ console: t("nav.console"), accounts: t("nav.accounts"), audit: t("nav.audit"), environment: t("nav.environment"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "console");
  const mobileTabs = routeSectionTabs(buildAdminMobileTabs({ console: t("mobileNav.console"), accounts: t("mobileNav.accounts"), audit: t("mobileNav.audit"), environment: t("mobileNav.environment") }, baseHref), baseHref, "console");
  const activeTab = ({ console: "console", comptes: "accounts", audit: "audit", environnement: "environment" } as Record<string, string>)[activeSection];
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;

  const consoleSection = (
    <section id="console" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("console.title")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <DashboardCard><div className="yema-mono">{t("console.envLabel")}</div><div style={{ marginTop: 8, fontWeight: 600 }}>{env.nodeEnv ?? t("console.envUnknown")}</div></DashboardCard>
        <DashboardCard><div className="yema-mono">{t("console.qaStatus")}</div><div style={{ marginTop: 8 }}><DashboardStatusChip tone={env.qaModeEnabled ? "success" : "muted"}>{env.qaModeEnabled ? t("console.qaActive") : t("console.qaInactive")}</DashboardStatusChip></div></DashboardCard>
        <DashboardCard tone="gold"><div style={{ fontWeight: 600 }}>{t("console.productionIntact")}</div><div style={{ marginTop: 6, color: "var(--yema-text-muted)" }}>{t("console.productionIntactHelp")}</div></DashboardCard>
      </div>
    </section>
  );

  const accountsSection = (
    <section id="comptes" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("accounts.title")} description={t("accounts.description")} actions={<DashboardStatusChip tone="muted">{t("accounts.personasCount", { count: personas.length })}</DashboardStatusChip>} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {personas.map((persona) => <li key={persona.id}><DashboardCard><div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{persona.label}</div><div className="yema-mono" style={{ marginTop: 4, color: "var(--yema-text-muted)" }}>{t("accounts.roleLabel")} · {persona.role}</div></div>{persona.available ? <Link href={persona.destination} style={{ color: "var(--yema-gold-light)", textDecoration: "none" }}>{t("accounts.openPersona")}</Link> : <DashboardStatusChip tone="alert">{t("accounts.unavailable")}</DashboardStatusChip>}</div></DashboardCard></li>)}
      </ul>
    </section>
  );

  const auditSection = (
    <section id="audit" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("audit.title")} description={t("audit.description")} />
      {audit.length === 0 ? <DashboardCard><DashboardEmptyState title={t("audit.empty")} /></DashboardCard> : <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>{audit.map((row) => <li key={row.id}><DashboardCard tone="surface-2"><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><div style={{ flex: 1 }}><div className="yema-mono" style={{ color: "var(--yema-gold-light)" }}>{row.action}</div><div style={{ marginTop: 2, color: "var(--yema-text-muted)" }}>{row.targetType}{row.actorRole ? ` · ${row.actorRole}` : ""}{row.actorHash ? ` · ${row.actorHash}` : ` · ${t("audit.actorAnonymous")}`}</div></div><div className="yema-mono">{formatDate(row.createdAt, currentLocale ?? locale)}</div></div></DashboardCard></li>)}</ul>}
    </section>
  );

  const environmentSection = (
    <section id="environnement" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("environment.title")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <DashboardCard><div className="yema-mono">{t("environment.projectRef")}</div><div className="yema-mono" style={{ marginTop: 8 }}>{env.projectRef ?? "—"}</div></DashboardCard>
        <DashboardCard><div className="yema-mono">{t("environment.qaSessionTitle")}</div><div className="yema-mono" style={{ marginTop: 8 }}>{t("environment.qaSessionMinutes", { minutes: env.qaSessionMaxMinutes })}</div></DashboardCard>
      </div>
      <DashboardCard><h3>{t("environment.flagsTitle")}</h3><ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>{env.flags.map((flag) => <li key={flag.key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span className="yema-mono">{flag.key}</span><DashboardStatusChip tone={flag.enabled ? "success" : "muted"}>{flag.enabled ? "on" : "off"}</DashboardStatusChip></li>)}</ul></DashboardCard>
    </section>
  );

  const content: Record<string, React.ReactNode> = { console: consoleSection, comptes: accountsSection, audit: auditSection, environnement: environmentSection };
  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={<DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />}
        header={<DashboardHeader title={personaLabel} subtitle={personaSubtitle} meta={<DashboardStatusChip tone={env.qaModeEnabled ? "gold" : "muted"}>{env.qaModeEnabled ? t("console.qaActive") : t("console.qaInactive")}</DashboardStatusChip>} />}
      >
        <div data-live-persona-section={activeSection}>{content[activeSection]}</div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}

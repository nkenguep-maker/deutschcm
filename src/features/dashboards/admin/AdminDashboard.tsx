"use client";

// AdminDashboard · Lot 4B · console YEMA server-first. Les données (personas,
// audit, env) sont résolues côté serveur (voir src/lib/admin/consoleData.ts)
// et passées en props. Aucune fetch client, aucun secret.

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
import { buildAdminNav, buildAdminMobileTabs } from "./nav";
import type { AdminAuditRow, AdminEnvSummary, AdminPersonaRow } from "./types";

type Props = {
  locale: "fr" | "en";
  personas: AdminPersonaRow[];
  audit: AdminAuditRow[];
  env: AdminEnvSummary;
};

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminDashboard({ locale, personas, audit, env }: Props) {
  const t = useTranslations("yemaDashboards.admin");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();

  const baseHref = `/${currentLocale ?? locale}/admin`;

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const navGroups = buildAdminNav(
    {
      console: t("nav.console"),
      accounts: t("nav.accounts"),
      audit: t("nav.audit"),
      environment: t("nav.environment"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const mobileTabs = buildAdminMobileTabs(
    {
      console: t("mobileNav.console"),
      accounts: t("mobileNav.accounts"),
      audit: t("mobileNav.audit"),
      environment: t("mobileNav.environment"),
    },
    baseHref,
  );

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={baseHref}
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
      previewBadge={tCommon("previewBadge")}
    />
  );

  const mobileHeader = (
    <DashboardMobileHeader
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
    />
  );

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={<DashboardTabBar tabs={mobileTabs} activeKey="console" />}
        header={
          <DashboardHeader
            title={personaLabel}
            subtitle={personaSubtitle}
            meta={
              env.qaModeEnabled ? (
                <DashboardStatusChip tone="gold">{t("console.qaActive")}</DashboardStatusChip>
              ) : (
                <DashboardStatusChip tone="muted">{t("console.qaInactive")}</DashboardStatusChip>
              )
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Console */}
          <section id="console" aria-labelledby="console-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="console-title">{t("console.title")}</span>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <DashboardCard>
                <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
                  {t("console.envLabel")}
                </div>
                <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: "var(--yema-text)" }}>
                  {env.nodeEnv ?? t("console.envUnknown")}
                </div>
              </DashboardCard>
              <DashboardCard>
                <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
                  {t("console.qaStatus")}
                </div>
                <div style={{ marginTop: 8 }}>
                  <DashboardStatusChip tone={env.qaModeEnabled ? "success" : "muted"}>
                    {env.qaModeEnabled ? t("console.qaActive") : t("console.qaInactive")}
                  </DashboardStatusChip>
                </div>
              </DashboardCard>
              <DashboardCard tone="gold">
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>
                  {t("console.productionIntact")}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--yema-text-muted)" }}>
                  {t("console.productionIntactHelp")}
                </div>
              </DashboardCard>
            </div>
          </section>

          {/* Comptes */}
          <section id="comptes" aria-labelledby="comptes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="comptes-title">{t("accounts.title")}</span>}
              description={t("accounts.description")}
              actions={<DashboardStatusChip tone="muted">{t("accounts.personasCount", { count: personas.length })}</DashboardStatusChip>}
            />
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {personas.map((p) => (
                <li key={p.id}>
                  <DashboardCard>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>{p.label}</div>
                        <div className="yema-mono" style={{ marginTop: 4, fontSize: 11, color: "var(--yema-text-muted)" }}>
                          {t("accounts.roleLabel")} · {p.role}
                        </div>
                      </div>
                      {p.available ? (
                        <Link
                          href={p.destination}
                          style={{
                            fontSize: 12,
                            color: "var(--yema-gold-light)",
                            textDecoration: "none",
                            padding: "6px 12px",
                            borderRadius: "var(--yema-r-pill)",
                            border: "1px solid var(--yema-gold-edge)",
                            minHeight: 32,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {t("accounts.openPersona")}
                        </Link>
                      ) : (
                        <DashboardStatusChip tone="alert">{t("accounts.unavailable")}</DashboardStatusChip>
                      )}
                    </div>
                  </DashboardCard>
                </li>
              ))}
            </ul>
          </section>

          {/* Audit */}
          <section id="audit" aria-labelledby="audit-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="audit-title">{t("audit.title")}</span>}
              description={t("audit.description")}
            />
            {audit.length === 0 ? (
              <DashboardCard><DashboardEmptyState title={t("audit.empty")} /></DashboardCard>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                {audit.map((row) => (
                  <li key={row.id}>
                    <DashboardCard tone="surface-2">
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="yema-mono" style={{ fontSize: 12, color: "var(--yema-gold-light)" }}>
                            {row.action}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 12, color: "var(--yema-text-muted)" }}>
                            {row.targetType}
                            {row.actorRole ? ` · ${row.actorRole}` : ""}
                            {row.actorHash ? ` · ${row.actorHash}` : ` · ${t("audit.actorAnonymous")}`}
                          </div>
                        </div>
                        <div className="yema-mono" style={{ fontSize: 11, color: "var(--yema-text-faint)", flexShrink: 0 }}>
                          {formatDate(row.createdAt, currentLocale ?? locale)}
                        </div>
                      </div>
                    </DashboardCard>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Environnement */}
          <section id="environnement" aria-labelledby="environnement-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="environnement-title">{t("environment.title")}</span>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <DashboardCard>
                <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
                  {t("environment.projectRef")}
                </div>
                <div className="yema-mono" style={{ marginTop: 8, fontSize: 12, color: "var(--yema-text)" }}>
                  {env.projectRef ?? "—"}
                </div>
              </DashboardCard>
              <DashboardCard>
                <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
                  {t("environment.qaSessionTitle")}
                </div>
                <div className="yema-mono" style={{ marginTop: 8, fontSize: 12, color: "var(--yema-text)" }}>
                  {t("environment.qaSessionMinutes", { minutes: env.qaSessionMaxMinutes })}
                </div>
              </DashboardCard>
            </div>
            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>
                {t("environment.flagsTitle")}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                {env.flags.map((f) => (
                  <li key={f.key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span className="yema-mono" style={{ fontSize: 11, color: "var(--yema-text)" }}>{f.key}</span>
                    <DashboardStatusChip tone={f.enabled ? "success" : "muted"}>
                      {f.enabled ? "on" : "off"}
                    </DashboardStatusChip>
                  </li>
                ))}
              </ul>
            </DashboardCard>
            <div style={{ fontSize: 11, color: "var(--yema-text-faint)", textAlign: "center" }}>
              {t("environment.noSecretsHelp")}
            </div>
          </section>
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}

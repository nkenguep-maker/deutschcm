"use client";

// ChildRacinesDashboard · Lot 5 · rendu quand le cookie enfant est actif
// pour un profil dont l'univers dérivé est RACINES. Universe="racines"
// sur le shell → surfaces bordeaux. Étape É1-É5 lue depuis
// ChildLangue.echelle réelle. Aucune fausse messagerie ni faux audio.

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardButton,
  DashboardButtonLink,
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
import { buildChildRacinesNav, buildChildRacinesMobileTabs } from "./nav";
import type { ChildData } from "@/features/dashboards/child-monde/types";

type Props = {
  locale: "fr" | "en";
  child: ChildData;
};

function stepFromEchelle(echelle: number): "E1" | "E2" | "E3" | "E4" | "E5" | null {
  // ChildLangue.echelle croît de 0 à 8 (voir src/lib/childScales.ts). On
  // remappe grossièrement en étapes doctrinales É1..É5 · à raffiner quand
  // le journal oral détaillé sera branché.
  if (!Number.isFinite(echelle) || echelle < 0) return null;
  if (echelle < 2) return "E1";
  if (echelle < 4) return "E2";
  if (echelle < 6) return "E3";
  if (echelle < 8) return "E4";
  return "E5";
}

export function ChildRacinesDashboard({ locale, child }: Props) {
  const t = useTranslations("yemaDashboards.childRacines");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const baseHref = `/${currentLocale ?? locale}/dashboard`;
  const [exiting, setExiting] = useState(false);

  const activeLang = child.langues.find((l) => l.langue === child.activeLangue) ?? child.langues[0] ?? null;
  const step = activeLang ? stepFromEchelle(activeLang.echelle) : null;
  const languageLabel = activeLang?.langue ?? child.activeLangue ?? "—";

  const exitChildMode = async () => {
    setExiting(true);
    try {
      await fetch("/api/child-session", { method: "DELETE" });
    } finally {
      window.location.href = `/${currentLocale ?? locale}/login`;
    }
  };

  const navGroups = buildChildRacinesNav(
    {
      home: t("nav.home"),
      tales: t("nav.tales"),
      songs: t("nav.songs"),
      badges: t("nav.badges"),
      oralProgress: t("nav.oralProgress"),
      familyActivities: t("nav.familyActivities"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const mobileTabs = buildChildRacinesMobileTabs(
    { home: t("mobileNav.home"), tales: t("mobileNav.tales"), songs: t("mobileNav.songs"), badges: t("mobileNav.badges") },
    baseHref,
  );

  const personaLabel = t("personaLabel");

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={baseHref}
      personaLabel={personaLabel}
      personaSubtitle={t("sidebarSection")}
      brandHref={`/${currentLocale ?? locale}`}
      previewBadge={tCommon("previewBadge")}
    />
  );

  const mobileHeader = (
    <DashboardMobileHeader
      personaLabel={personaLabel}
      personaSubtitle={t("sidebarSection")}
      brandHref={`/${currentLocale ?? locale}`}
    />
  );

  const messagesHref = `/${currentLocale ?? locale}/messages`;
  const headerActions = (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <DashboardButtonLink
        href={messagesHref}
        variant="secondary"
        size="sm"
        data-testid="child-messages-cta"
        style={{ minHeight: 44 }}
      >
        {t("openMessages")}
      </DashboardButtonLink>
      <DashboardButton variant="secondary" size="sm" onClick={exitChildMode} disabled={exiting}>
        {t("exitChildMode")}
      </DashboardButton>
    </div>
  );

  return (
    <DashboardPageBoundary>
      <DashboardShell
        universe="racines"
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={<DashboardTabBar tabs={mobileTabs} activeKey="home" />}
        header={
          <DashboardHeader
            title={t("home.title", { prenom: child.prenom })}
            subtitle={step ? t("meta", { language: languageLabel, step }) : t("metaMinimal")}
            actions={headerActions}
            meta={step ? <DashboardStatusChip tone="gold">{step}</DashboardStatusChip> : undefined}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <section id="case" aria-labelledby="case-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="case-title">{t("home.title", { prenom: child.prenom })}</span>} />
            <DashboardCard tone="gold">
              <div style={{ fontSize: 14, color: "var(--yema-text)" }}>{t("home.welcomeHint")}</div>
            </DashboardCard>
            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>{t("home.stepTitle")}</h3>
              {step ? (
                <div style={{ fontSize: 13, color: "var(--yema-text)" }}>
                  <DashboardStatusChip tone="gold">{step}</DashboardStatusChip>
                </div>
              ) : (
                <DashboardEmptyState title={t("home.stepEmpty")} />
              )}
            </DashboardCard>
            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>{t("home.nextListenTitle")}</h3>
              <DashboardEmptyState title={t("home.nextListenEmpty")} />
            </DashboardCard>
            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>{t("home.coachTitle")}</h3>
              <DashboardEmptyState title={t("home.coachEmpty")} />
            </DashboardCard>
          </section>

          <section id="contes" aria-labelledby="contes-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="contes-title">{t("tales.title")}</span>}
              description={t("tales.description")}
            />
            <DashboardCard><DashboardEmptyState title={t("tales.empty")} /></DashboardCard>
          </section>

          <section id="chansons" aria-labelledby="chansons-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="chansons-title">{t("songs.title")}</span>}
              description={t("songs.description")}
            />
            <DashboardCard><DashboardEmptyState title={t("songs.empty")} /></DashboardCard>
          </section>

          <section id="badges" aria-labelledby="badges-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="badges-title">{t("badges.title")}</span>}
              description={t("badges.description")}
            />
            <DashboardCard><DashboardEmptyState title={t("badges.empty")} description={t("badges.notPersistedNotice")} /></DashboardCard>
          </section>

          <section id="oral" aria-labelledby="oral-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="oral-title">{t("oralProgress.title")}</span>}
              description={t("oralProgress.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("oralProgress.notWiredNotice")} description={t("voiceRecordingSoon")} />
            </DashboardCard>
          </section>

          <section id="famille" aria-labelledby="famille-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="famille-title">{t("familyActivities.title")}</span>}
              description={t("familyActivities.description")}
            />
            <DashboardCard><DashboardEmptyState title={t("familyActivities.empty")} /></DashboardCard>
          </section>
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}

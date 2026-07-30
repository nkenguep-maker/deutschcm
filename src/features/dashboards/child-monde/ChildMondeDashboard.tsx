"use client";

// ChildMondeDashboard · Lot 5 · rendu quand le cookie enfant est actif
// pour un profil dont l'univers dérivé est MONDE. Données réelles
// exclusives (etoiles réellement gagnées via ChildLangue.etoiles). Aucun
// XP fictif, aucune histoire inventée, aucune messagerie. Bouton "Quitter
// le mode enfant" DELETE /api/child-session.

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardButton,
  DashboardCard,
  DashboardEmptyState,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardProgress,
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import { buildChildMondeNav, buildChildMondeMobileTabs } from "./nav";
import type { ChildData } from "./types";

type Props = {
  locale: "fr" | "en";
  child: ChildData;
};

export function ChildMondeDashboard({ locale, child }: Props) {
  const t = useTranslations("yemaDashboards.childMonde");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const baseHref = `/${currentLocale ?? locale}/dashboard`;
  const [exiting, setExiting] = useState(false);

  const totalStars = child.langues.reduce((n, l) => n + (l.etoiles ?? 0), 0);

  const exitChildMode = async () => {
    setExiting(true);
    try {
      await fetch("/api/child-session", { method: "DELETE" });
    } finally {
      window.location.href = `/${currentLocale ?? locale}/login`;
    }
  };

  const navGroups = buildChildMondeNav(
    {
      home: t("nav.home"),
      games: t("nav.games"),
      stories: t("nav.stories"),
      badges: t("nav.badges"),
      progression: t("nav.progression"),
      adultActivities: t("nav.adultActivities"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const mobileTabs = buildChildMondeMobileTabs(
    { home: t("mobileNav.home"), games: t("mobileNav.games"), stories: t("mobileNav.stories"), badges: t("mobileNav.badges") },
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

  const exitCta = (
    <DashboardButton variant="secondary" size="sm" onClick={exitChildMode} disabled={exiting}>
      {t("exitChildMode")}
    </DashboardButton>
  );

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={<DashboardTabBar tabs={mobileTabs} activeKey="home" />}
        header={
          <DashboardHeader
            title={t("home.title", { prenom: child.prenom })}
            subtitle={totalStars > 0 ? t("meta", { stars: totalStars }) : t("metaMinimal")}
            actions={exitCta}
            meta={
              child.activeLangue ? (
                <DashboardStatusChip tone="gold">{child.activeLangue}</DashboardStatusChip>
              ) : undefined
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <section id="accueil" aria-labelledby="accueil-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader title={<span id="accueil-title">{t("home.title", { prenom: child.prenom })}</span>} />
            <DashboardCard tone="gold">
              <div style={{ fontSize: 14, color: "var(--yema-text)" }}>{t("home.welcomeHint")}</div>
            </DashboardCard>

            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
                {t("home.starsTitle")}
              </h3>
              {totalStars > 0 ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--yema-text-muted)", marginBottom: 8 }}>
                    {t("home.starsCount", { stars: totalStars })}
                  </div>
                  <DashboardProgress value={Math.min(totalStars, 20)} max={20} ariaLabel={t("home.starsTitle")} />
                </>
              ) : (
                <DashboardEmptyState title={t("home.starsEmpty")} />
              )}
            </DashboardCard>

            <DashboardCard>
              <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: "var(--yema-text)" }}>
                {t("home.nextActivityTitle")}
              </h3>
              <DashboardEmptyState title={t("home.nextActivityEmpty")} />
            </DashboardCard>
          </section>

          <section id="jeux" aria-labelledby="jeux-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="jeux-title">{t("games.title")}</span>}
              description={t("games.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("games.empty")} />
            </DashboardCard>
          </section>

          <section id="histoires" aria-labelledby="histoires-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="histoires-title">{t("stories.title")}</span>}
              description={t("stories.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("stories.empty")} />
            </DashboardCard>
          </section>

          <section id="badges" aria-labelledby="badges-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="badges-title">{t("badges.title")}</span>}
              description={t("badges.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("badges.empty")} description={t("badges.notPersistedNotice")} />
            </DashboardCard>
          </section>

          <section id="progression" aria-labelledby="progression-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="progression-title">{t("progression.title")}</span>}
              description={t("progression.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("progression.notWiredNotice")} />
            </DashboardCard>
          </section>

          <section id="adulte" aria-labelledby="adulte-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DashboardSectionHeader
              title={<span id="adulte-title">{t("adultActivities.title")}</span>}
              description={t("adultActivities.description")}
            />
            <DashboardCard>
              <DashboardEmptyState title={t("adultActivities.empty")} />
            </DashboardCard>
          </section>
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}

"use client";

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
  DashboardProgress,
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildChildMondeNav, buildChildMondeMobileTabs } from "./nav";
import type { ChildData } from "./types";

type Props = { locale: "fr" | "en"; child: ChildData; activeSectionId?: string };
const ALLOWED = new Set(["maison", "quete", "chemin", "missions", "recompense", "jeux", "histoires", "badges", "progression", "avec-adulte"]);

export function ChildMondeDashboard({ locale, child, activeSectionId = "maison" }: Props) {
  const t = useTranslations("yemaDashboards.childMonde");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const baseHref = `/${currentLocale ?? locale}/dashboard`;
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "maison";
  const activeHref = sectionPageHref(baseHref, activeSection, "maison");
  const [exiting, setExiting] = useState(false);
  const totalStars = child.langues.reduce((total, language) => total + (language.etoiles ?? 0), 0);

  const exitChildMode = async () => {
    setExiting(true);
    try { await fetch("/api/child-session", { method: "DELETE" }); }
    finally { window.location.href = `/${currentLocale ?? locale}/login`; }
  };

  const navGroups = routeSectionNav(buildChildMondeNav({ home: t("nav.home"), games: t("nav.games"), stories: t("nav.stories"), badges: t("nav.badges"), progression: t("nav.progression"), adultActivities: t("nav.adultActivities"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "maison");
  const mobileTabs = routeSectionTabs(buildChildMondeMobileTabs({ home: t("mobileNav.home"), games: t("mobileNav.games"), stories: t("mobileNav.stories"), badges: t("mobileNav.badges") }, baseHref), baseHref, "maison");
  const activeTab = ({ maison: "home", quete: "home", chemin: "home", missions: "home", recompense: "home", jeux: "games", histoires: "stories", badges: "badges", progression: "home", "avec-adulte": "home" } as Record<string, string>)[activeSection];
  const personaLabel = t("personaLabel");
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={t("sidebarSection")} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={t("sidebarSection")} brandHref={`/${currentLocale ?? locale}`} />;
  const headerActions = <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><DashboardButtonLink href={`/${currentLocale ?? locale}/messages`} variant="secondary" size="sm" style={{ minHeight: 44 }}>{t("openMessages")}</DashboardButtonLink><DashboardButton variant="secondary" size="sm" onClick={exitChildMode} disabled={exiting}>{t("exitChildMode")}</DashboardButton></div>;

  const home = (
    <section id="maison" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("home.title", { prenom: child.prenom })} />
      <DashboardCard tone="gold"><div>{t("home.welcomeHint")}</div></DashboardCard>
      <DashboardCard><h3>{t("home.starsTitle")}</h3>{totalStars > 0 ? <><div style={{ marginBottom: 8 }}>{t("home.starsCount", { stars: totalStars })}</div><DashboardProgress value={Math.min(totalStars, 20)} max={20} ariaLabel={t("home.starsTitle")} /></> : <DashboardEmptyState title={t("home.starsEmpty")} />}</DashboardCard>
      <DashboardCard><h3>{t("home.nextActivityTitle")}</h3><DashboardEmptyState title={t("home.nextActivityEmpty")} /></DashboardCard>
    </section>
  );
  const emptySection = (id: string, title: string, description: string, empty: string, notice?: string) => <section id={id} style={{ display: "grid", gap: 12 }}><DashboardSectionHeader title={title} description={description} /><DashboardCard><DashboardEmptyState title={empty} description={notice} /></DashboardCard></section>;
  const content: Record<string, React.ReactNode> = {
    maison: home, quete: home, chemin: home, missions: home, recompense: home,
    jeux: emptySection("jeux", t("games.title"), t("games.description"), t("games.empty")),
    histoires: emptySection("histoires", t("stories.title"), t("stories.description"), t("stories.empty")),
    badges: emptySection("badges", t("badges.title"), t("badges.description"), t("badges.empty"), t("badges.notPersistedNotice")),
    progression: emptySection("progression", t("progression.title"), t("progression.description"), t("progression.notWiredNotice")),
    "avec-adulte": emptySection("avec-adulte", t("adultActivities.title"), t("adultActivities.description"), t("adultActivities.empty")),
  };

  return <DashboardPageBoundary><DashboardShell sidebar={sidebar} mobileHeader={mobileHeader} tabBar={<DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />} header={<DashboardHeader title={t("home.title", { prenom: child.prenom })} subtitle={totalStars > 0 ? t("meta", { stars: totalStars }) : t("metaMinimal")} actions={headerActions} meta={child.activeLangue ? <DashboardStatusChip tone="gold">{child.activeLangue}</DashboardStatusChip> : undefined} />}><div data-live-persona-section={activeSection}>{content[activeSection]}</div></DashboardShell></DashboardPageBoundary>;
}

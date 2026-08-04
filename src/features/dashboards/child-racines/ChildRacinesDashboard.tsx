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
  DashboardSectionHeader,
  DashboardShell,
  DashboardSidebar,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildChildRacinesNav, buildChildRacinesMobileTabs } from "./nav";
import type { ChildData } from "@/features/dashboards/child-monde/types";

type Props = { locale: "fr" | "en"; child: ChildData; activeSectionId?: string };
const ALLOWED = new Set(["case", "quete", "chemin", "missions", "contes", "chansons", "badges", "progression", "famille"]);

function stepFromEchelle(echelle: number): "E1" | "E2" | "E3" | "E4" | "E5" | null {
  if (!Number.isFinite(echelle) || echelle < 0) return null;
  if (echelle < 2) return "E1";
  if (echelle < 4) return "E2";
  if (echelle < 6) return "E3";
  if (echelle < 8) return "E4";
  return "E5";
}

export function ChildRacinesDashboard({ locale, child, activeSectionId = "case" }: Props) {
  const t = useTranslations("yemaDashboards.childRacines");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const baseHref = `/${currentLocale ?? locale}/dashboard`;
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "case";
  const activeHref = sectionPageHref(baseHref, activeSection, "case");
  const [exiting, setExiting] = useState(false);
  const activeLang = child.langues.find((language) => language.langue === child.activeLangue) ?? child.langues[0] ?? null;
  const step = activeLang ? stepFromEchelle(activeLang.echelle) : null;
  const languageLabel = activeLang?.langue ?? child.activeLangue ?? "—";

  const exitChildMode = async () => {
    setExiting(true);
    try { await fetch("/api/child-session", { method: "DELETE" }); }
    finally { window.location.href = `/${currentLocale ?? locale}/login`; }
  };

  const navGroups = routeSectionNav(buildChildRacinesNav({ home: t("nav.home"), tales: t("nav.tales"), songs: t("nav.songs"), badges: t("nav.badges"), oralProgress: t("nav.oralProgress"), familyActivities: t("nav.familyActivities"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "case");
  const mobileTabs = routeSectionTabs(buildChildRacinesMobileTabs({ home: t("mobileNav.home"), tales: t("mobileNav.tales"), songs: t("mobileNav.songs"), badges: t("mobileNav.badges") }, baseHref), baseHref, "case");
  const activeTab = ({ case: "home", quete: "home", chemin: "home", missions: "home", contes: "tales", chansons: "songs", badges: "badges", progression: "home", famille: "home" } as Record<string, string>)[activeSection];
  const personaLabel = t("personaLabel");
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={t("sidebarSection")} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={t("sidebarSection")} brandHref={`/${currentLocale ?? locale}`} />;
  const headerActions = <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><DashboardButtonLink href={`/${currentLocale ?? locale}/messages`} variant="secondary" size="sm" style={{ minHeight: 44 }}>{t("openMessages")}</DashboardButtonLink><DashboardButton variant="secondary" size="sm" onClick={exitChildMode} disabled={exiting}>{t("exitChildMode")}</DashboardButton></div>;

  const home = (
    <section id="case" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader title={t("home.title", { prenom: child.prenom })} />
      <DashboardCard tone="gold"><div>{t("home.welcomeHint")}</div></DashboardCard>
      <DashboardCard><h3>{t("home.stepTitle")}</h3>{step ? <DashboardStatusChip tone="gold">{step}</DashboardStatusChip> : <DashboardEmptyState title={t("home.stepEmpty")} />}</DashboardCard>
      <DashboardCard><h3>{t("home.nextListenTitle")}</h3><DashboardEmptyState title={t("home.nextListenEmpty")} /></DashboardCard>
      <DashboardCard><h3>{t("home.coachTitle")}</h3><DashboardEmptyState title={t("home.coachEmpty")} /></DashboardCard>
    </section>
  );
  const emptySection = (id: string, title: string, description: string, empty: string, notice?: string) => <section id={id} style={{ display: "grid", gap: 12 }}><DashboardSectionHeader title={title} description={description} /><DashboardCard><DashboardEmptyState title={empty} description={notice} /></DashboardCard></section>;
  const content: Record<string, React.ReactNode> = {
    case: home, quete: home, chemin: home, missions: home,
    contes: emptySection("contes", t("tales.title"), t("tales.description"), t("tales.empty")),
    chansons: emptySection("chansons", t("songs.title"), t("songs.description"), t("songs.empty")),
    badges: emptySection("badges", t("badges.title"), t("badges.description"), t("badges.empty"), t("badges.notPersistedNotice")),
    progression: emptySection("progression", t("oralProgress.title"), t("oralProgress.description"), t("oralProgress.notWiredNotice"), t("voiceRecordingSoon")),
    famille: emptySection("famille", t("familyActivities.title"), t("familyActivities.description"), t("familyActivities.empty")),
  };

  return <DashboardPageBoundary><DashboardShell universe="racines" sidebar={sidebar} mobileHeader={mobileHeader} tabBar={<DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />} header={<DashboardHeader title={t("home.title", { prenom: child.prenom })} subtitle={step ? t("meta", { language: languageLabel, step }) : t("metaMinimal")} actions={headerActions} meta={step ? <DashboardStatusChip tone="gold">{step}</DashboardStatusChip> : undefined} />}><div data-live-persona-section={activeSection}>{content[activeSection]}</div></DashboardShell></DashboardPageBoundary>;
}

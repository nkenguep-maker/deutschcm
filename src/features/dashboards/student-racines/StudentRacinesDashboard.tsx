"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardShell,
  DashboardSidebar,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardPageBoundary,
  DashboardSkeleton,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import type { DashboardTab } from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildRacinesNav } from "./nav";
import { OverviewSection } from "./sections/OverviewSection";
import { StepsSection } from "./sections/StepsSection";
import { ListensSection } from "./sections/ListensSection";
import { CoachSection } from "./sections/CoachSection";
import { CircleSection } from "./sections/CircleSection";
import { ChildrenSection } from "./sections/ChildrenSection";
import { MessagesPlaceholderSection } from "./sections/MessagesPlaceholderSection";
import type { RacinesDashboardData } from "./types";

async function loadDashboard(): Promise<RacinesDashboardData> {
  const res = await fetch("/api/me/racines-dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as RacinesDashboardData;
}

type LoadState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: RacinesDashboardData };
type Props = { locale: "fr" | "en"; activeSectionId?: string };
const ALLOWED = new Set(["accueil", "mot-du-jour", "mes-etapes", "ecoutes", "mon-coach", "cercle", "messages"]);

export function StudentRacinesDashboard({ locale, activeSectionId = "accueil" }: Props) {
  const t = useTranslations("yemaDashboards");
  const tCommon = useTranslations("yemaDashboards.common");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "accueil";
  const dashboardHref = `/${currentLocale ?? locale}/dashboard`;
  const activeHref = sectionPageHref(dashboardHref, activeSection, "accueil");

  const load = () => {
    setState({ kind: "loading" });
    loadDashboard().then((data) => setState({ kind: "ready", data })).catch(() => setState({ kind: "error" }));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navGroups = routeSectionNav(buildRacinesNav({
    overview: t("studentRacines.nav.overview"),
    steps: t("studentRacines.nav.steps"),
    listens: t("studentRacines.nav.listens"),
    coach: t("studentRacines.nav.coach"),
    circle: t("studentRacines.nav.circle"),
    messages: t("studentRacines.nav.messages"),
    sectionLabel: t("studentRacines.sidebarSection"),
  }, dashboardHref), dashboardHref, "accueil");

  const personaLabel = t("studentRacines.personaLabel");
  const personaSubtitle = t("studentRacines.personaSubtitle");
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;
  const rawTabs: DashboardTab[] = [
    { key: "overview", label: t("studentRacines.mobileNav.overview"), href: dashboardHref },
    { key: "steps", label: t("studentRacines.mobileNav.steps"), href: `${dashboardHref}#mes-etapes` },
    { key: "listens", label: t("studentRacines.mobileNav.listens"), href: `${dashboardHref}#ecoutes` },
    { key: "coach", label: t("studentRacines.mobileNav.coach"), href: `${dashboardHref}#mon-coach` },
    { key: "circle", label: t("studentRacines.mobileNav.circle"), href: `${dashboardHref}#cercle` },
  ];
  const tabs = routeSectionTabs(rawTabs, dashboardHref, "accueil");
  const activeTab = ({ accueil: "overview", "mot-du-jour": "overview", "mes-etapes": "steps", ecoutes: "listens", "mon-coach": "coach", cercle: "circle", messages: "overview" } as Record<string, string>)[activeSection];
  const tabBar = <DashboardTabBar tabs={tabs} activeKey={activeTab} />;
  const shell = (body: React.ReactNode, header: React.ReactNode) => <DashboardPageBoundary><DashboardShell universe="racines" sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell></DashboardPageBoundary>;

  if (state.kind === "loading") return shell(<div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={140} rounded={18} /><DashboardSkeleton height={220} rounded={18} /></div>, <DashboardHeader title={personaLabel} subtitle={tCommon("loading")} />);
  if (state.kind === "error") return shell(<DashboardErrorState title={tCommon("error")} action={<button type="button" onClick={load}>{tCommon("retry")}</button>} />, <DashboardHeader title={personaLabel} />);

  const { data } = state;
  if (!data.hasLearningPath) return shell(<DashboardCard><DashboardEmptyState title={t("studentRacines.overview.noAccessTitle")} description={t("studentRacines.overview.noAccessBody")} /></DashboardCard>, <DashboardHeader title={personaLabel} />);

  const greeting = data.greetingName?.split(" ")[0] ?? t("studentRacines.greetingFallback");
  const meta = data.racinesStep ? t("studentRacines.metaLanguageStep", { step: data.racinesStep }) : t("studentRacines.metaLanguageOnly");
  const modeLabel = data.mode === "SOLO" ? t("studentRacines.mode.solo") : data.mode === "FAMILY" ? t("studentRacines.mode.family") : data.mode === "NO_ACCESS" ? t("studentRacines.mode.noAccess") : t("studentRacines.mode.unknown");
  const overview = <OverviewSection data={data} />;
  const content: Record<string, React.ReactNode> = {
    accueil: overview,
    "mot-du-jour": overview,
    "mes-etapes": <><StepsSection steps={data.steps} currentStep={data.racinesStep} />{data.mode === "FAMILY" && data.household.childrenCount > 0 ? <ChildrenSection profiles={data.children} /> : null}</>,
    ecoutes: <ListensSection anyLanguageReady={data.anyLanguageReady} />,
    "mon-coach": <CoachSection />,
    cercle: <CircleSection />,
    messages: <MessagesPlaceholderSection />,
  };

  return shell(<div data-live-persona-section={activeSection}>{content[activeSection]}</div>, <DashboardHeader title={greeting} subtitle={meta} meta={<DashboardStatusChip tone="neutral">{modeLabel}</DashboardStatusChip>} />);
}

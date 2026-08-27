"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardErrorState,
  DashboardHeader,
  DashboardMobileHeader,
  DashboardPageBoundary,
  DashboardShell,
  DashboardSidebar,
  DashboardSkeleton,
  DashboardStatusChip,
  DashboardTabBar,
} from "@/features/dashboards/shared";
import type { DashboardTab } from "@/features/dashboards/shared";
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildCoachRacinesNav } from "./nav";
import { CoachOverviewSection } from "./sections/CoachOverviewSection";
import { CoachLearnersSection } from "./sections/CoachLearnersSection";
import { CoachSessionsSection } from "./sections/CoachSessionsSection";
import { CoachMessagesSection } from "./sections/CoachMessagesSection";
import { CoachSessionNotesSection } from "./sections/CoachSessionNotesSection";
import type { CoachChildProfileRow, CoachDashboardResponse, CoachProfilesResponse } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

type LoadState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: CoachDashboardResponse; learners: CoachChildProfileRow[] };
type Props = { locale: "fr" | "en"; activeSectionId?: string };
const ALLOWED = new Set(["accueil", "seances-du-jour", "apprenants", "seances", "messages", "notes"]);

export function CoachRacinesDashboard({ locale, activeSectionId = "accueil" }: Props) {
  const t = useTranslations("yemaDashboards.coachRacines");
  const tRoot = useTranslations("yemaDashboards");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "accueil";
  const baseHref = `/${currentLocale ?? locale}/coach/racines`;
  const activeHref = sectionPageHref(baseHref, activeSection, "accueil");

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<CoachDashboardResponse>("/api/roots-coach/dashboard"),
      fetchJson<CoachProfilesResponse>("/api/roots-coach/profiles?pageSize=50"),
    ]).then(([data, profiles]) => setState({ kind: "ready", data, learners: profiles.items ?? [] })).catch(() => setState({ kind: "error" }));
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = routeSectionNav(buildCoachRacinesNav({ overview: t("nav.overview"), learners: t("nav.learners"), sessions: t("nav.sessions"), messages: t("nav.messages"), sessionNotes: t("nav.sessionNotes"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "accueil");
  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tRoot("common.previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;
  const rawTabs: DashboardTab[] = [
    { key: "overview", label: t("mobileNav.overview"), href: baseHref },
    { key: "learners", label: t("mobileNav.learners"), href: `${baseHref}#apprenants` },
    { key: "sessions", label: t("mobileNav.sessions"), href: `${baseHref}#seances` },
    { key: "messages", label: t("mobileNav.messages"), href: `${baseHref}#messages` },
    { key: "sessionNotes", label: t("mobileNav.sessionNotes"), href: `${baseHref}#notes` },
  ];
  const tabs = routeSectionTabs(rawTabs, baseHref, "accueil");
  const activeTab = ({ accueil: "overview", "seances-du-jour": "sessions", apprenants: "learners", seances: "sessions", messages: "messages", notes: "sessionNotes" } as Record<string, string>)[activeSection];
  const tabBar = <DashboardTabBar tabs={tabs} activeKey={activeTab} />;
  const shell = (body: React.ReactNode, header: React.ReactNode) => <DashboardPageBoundary><DashboardShell universe="racines" sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell></DashboardPageBoundary>;

  if (state.kind === "loading") return shell(<div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={120} rounded={18} /><DashboardSkeleton height={220} rounded={18} /></div>, <DashboardHeader title={personaLabel} subtitle={t("loading")} />);
  if (state.kind === "error") return shell(<DashboardErrorState title={t("error")} action={<button type="button" onClick={load}>{t("retry")}</button>} />, <DashboardHeader title={personaLabel} />);

  const { data, learners } = state;
  const counts = t("meta", { activeCircles: data.stats.activeCircleCount, activeChildren: data.stats.activeChildProfileCount });
  const greeting = data.profile.fullName?.trim().split(/\s+/)[0] || personaLabel;
  const meta = data.profile.city ? `${counts} · ${data.profile.city}` : counts;
  const overview = <CoachOverviewSection stats={data.stats} />;
  const sessions = <CoachSessionsSection learners={learners} />;
  const content: Record<string, React.ReactNode> = {
    accueil: overview,
    "seances-du-jour": sessions,
    apprenants: <CoachLearnersSection learners={learners} loading={false} baseHref={baseHref} />,
    seances: sessions,
    messages: <CoachMessagesSection />,
    notes: <CoachSessionNotesSection />,
  };

  return shell(
    <div data-live-persona-section={activeSection}>{content[activeSection]}</div>,
    <DashboardHeader title={greeting} subtitle={meta} meta={<DashboardStatusChip tone="neutral">{data.actorRole}</DashboardStatusChip>} />,
  );
}

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
import { routeSectionNav, routeSectionTabs, sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import { buildFamilyNav, buildFamilyMobileTabs } from "./nav";
import { FamilyOverviewSection } from "./sections/FamilyOverviewSection";
import { FamilyChildrenSection } from "./sections/FamilyChildrenSection";
import { FamilyProgressionSection } from "./sections/FamilyProgressionSection";
import { FamilySessionsSection } from "./sections/FamilySessionsSection";
import { FamilyMessagesSection } from "./sections/FamilyMessagesSection";
import { FamilyPaymentsSection } from "./sections/FamilyPaymentsSection";
import { FamilySettingsSection } from "./sections/FamilySettingsSection";
import type { FamilyDashboardResponse } from "./types";
import type { FamilyChildActionsCopy } from "./FamilyChildActions";

async function fetchDashboard(): Promise<FamilyDashboardResponse> {
  const res = await fetch("/api/family/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as FamilyDashboardResponse;
}

type LoadState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: FamilyDashboardResponse };
type Props = { locale: "fr" | "en"; activeSectionId?: string };
const ALLOWED = new Set(["accueil", "enfants", "progression", "activite-prioritaire", "histoires-jeux", "seances", "paiements", "messages", "parametres"]);

export function FamilyDashboard({ locale, activeSectionId = "accueil" }: Props) {
  const t = useTranslations("yemaDashboards.family");
  const tCommon = useTranslations("yemaDashboards.common");
  const tActions = useTranslations("yemaDashboards.family.actions");
  const tAdd = useTranslations("yemaDashboards.family.addDialog");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "accueil";
  const baseHref = `/${currentLocale ?? locale}/family`;
  const activeHref = sectionPageHref(baseHref, activeSection, "accueil");

  const actionsCopy: FamilyChildActionsCopy = {
    openChildSpace: tActions("openChildSpace"), addChild: tActions("addChild"), childPinTitle: tActions("childPinTitle"), childPinLabel: tActions("childPinLabel"), childPinPlaceholder: tActions("childPinPlaceholder"), childPinSubmit: tActions("childPinSubmit"), childPinCancel: tActions("childPinCancel"), childPinErrGeneric: tActions("childPinErrGeneric"),
    addDialog: {
      step: tAdd("step"), prenomLbl: tAdd("prenomLbl"), ageLbl: tAdd("ageLbl"), animalLbl: tAdd("animalLbl"), universeLbl: tAdd("universeLbl"), universeMondeLabel: tAdd("universeMondeLabel"), universeMondeDesc: tAdd("universeMondeDesc"), universeRacinesLabel: tAdd("universeRacinesLabel"), universeRacinesDesc: tAdd("universeRacinesDesc"), languesLbl: tAdd("languesLbl"), languesHelp: tAdd("languesHelp"), nativeLbl: tAdd("nativeLbl"), foreignLbl: tAdd("foreignLbl"), goalLbl: tAdd("goalLbl"), goalHelp: tAdd("goalHelp"),
      goalOpts: { STUDIES: tAdd("goalOpts.STUDIES"), WORK: tAdd("goalOpts.WORK"), TRAVEL: tAdd("goalOpts.TRAVEL"), EXAM: tAdd("goalOpts.EXAM"), DAILY_LIFE: tAdd("goalOpts.DAILY_LIFE"), LATER: tAdd("goalOpts.LATER") },
      cancel: tAdd("cancel"), create: tAdd("create"), errName: tAdd("errName"), errAge: tAdd("errAge"), errAnimal: tAdd("errAnimal"), errLang: tAdd("errLang"), errUniverse: tAdd("errUniverse"), errServer: tAdd("errServer"),
    },
  };

  const load = () => {
    setState({ kind: "loading" });
    fetchDashboard().then((data) => setState({ kind: "ready", data })).catch(() => setState({ kind: "error" }));
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");
  const navGroups = routeSectionNav(buildFamilyNav({ overview: t("nav.overview"), children: t("nav.children"), progression: t("nav.progression"), sessions: t("nav.sessions"), messages: t("nav.messages"), payments: t("nav.payments"), settings: t("nav.settings"), sectionLabel: t("sidebarSection") }, baseHref), baseHref, "accueil");
  const mobileTabs = routeSectionTabs(buildFamilyMobileTabs({ overview: t("mobileNav.overview"), children: t("mobileNav.children"), progression: t("mobileNav.progression"), payments: t("mobileNav.payments"), messages: t("mobileNav.messages") }, baseHref), baseHref, "accueil");
  const activeTab = ({ accueil: "overview", enfants: "children", progression: "progression", "activite-prioritaire": "progression", "histoires-jeux": "progression", seances: "overview", paiements: "payments", messages: "messages", parametres: "overview" } as Record<string, string>)[activeSection];
  const sidebar = <DashboardSidebar groups={navGroups} activeHref={activeHref} personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} previewBadge={tCommon("previewBadge")} />;
  const mobileHeader = <DashboardMobileHeader personaLabel={personaLabel} personaSubtitle={personaSubtitle} brandHref={`/${currentLocale ?? locale}`} />;
  const tabBar = <DashboardTabBar tabs={mobileTabs} activeKey={activeTab} />;
  const shell = (body: React.ReactNode, header: React.ReactNode) => <DashboardPageBoundary><DashboardShell sidebar={sidebar} mobileHeader={mobileHeader} tabBar={tabBar} header={header}>{body}</DashboardShell></DashboardPageBoundary>;

  if (state.kind === "loading") return shell(<div style={{ display: "grid", gap: 16 }}><DashboardSkeleton height={110} rounded={18} /><DashboardSkeleton height={220} rounded={18} /></div>, <DashboardHeader title={personaLabel} subtitle={t("loading")} />);
  if (state.kind === "error") return shell(<DashboardErrorState title={t("error")} action={<button type="button" onClick={load}>{t("retry")}</button>} />, <DashboardHeader title={personaLabel} />);

  const { data } = state;
  const progression = <FamilyProgressionSection profiles={data.children} />;
  const content: Record<string, React.ReactNode> = {
    accueil: <FamilyOverviewSection data={data} />,
    enfants: <FamilyChildrenSection data={data} baseHref={baseHref} locale={locale} actionsCopy={actionsCopy} />,
    progression,
    "activite-prioritaire": progression,
    "histoires-jeux": progression,
    seances: <FamilySessionsSection />,
    messages: <FamilyMessagesSection />,
    paiements: <FamilyPaymentsSection seats={data.seats} />,
    parametres: <FamilySettingsSection />,
  };
  const metaText = t("meta", { count: data.totalChildrenLinked });
  const accessMeta = data.adultAccess.hasAnyAdultAccess ? <DashboardStatusChip tone="gold">{[data.adultAccess.monde ? "Monde" : null, data.adultAccess.racines ? "Racines" : null].filter(Boolean).join(" · ")}</DashboardStatusChip> : undefined;
  return shell(<div data-live-persona-section={activeSection}>{content[activeSection]}</div>, <DashboardHeader title={personaLabel} subtitle={metaText} meta={accessMeta} />);
}

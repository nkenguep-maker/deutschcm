"use client";

// TeacherDashboard · Lot 3 P4.6.
// Réutilise strictement les APIs existantes /api/teacher/dashboard et
// /api/teacher/classes — aucun resolver dupliqué. Assignments sont chargés
// lazily par classe (endpoint /api/teacher/classes/[classroomId]/assignments)
// pour respecter le scope existant (jamais d'agrégation cross-classe non
// autorisée). Aucun classroomId brut rendu dans le HTML.

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardEmptyState,
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
import { buildTeacherNav } from "./nav";
import { TeacherOverviewSection } from "./sections/TeacherOverviewSection";
import { TeacherClassesSection } from "./sections/TeacherClassesSection";
import { TeacherAssignmentsSection } from "./sections/TeacherAssignmentsSection";
import { TeacherCorrectionsSection } from "./sections/TeacherCorrectionsSection";
import { TeacherMondeContextSection } from "./sections/TeacherMondeContextSection";
import { TeacherResourcesSection } from "./sections/TeacherResourcesSection";
import { TeacherMessagesSection } from "./sections/TeacherMessagesSection";
import type {
  TeacherAssignmentRow,
  TeacherClassRow,
  TeacherClassesResponse,
  TeacherDashboardResponse,
} from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | {
      kind: "ready";
      data: TeacherDashboardResponse;
      classes: TeacherClassRow[];
      assignments: TeacherAssignmentRow[];
      assignmentsError: boolean;
    };

export function TeacherDashboard({ locale }: { locale: "fr" | "en" }) {
  const t = useTranslations("yemaDashboards.teacher");
  const tRoot = useTranslations("yemaDashboards");
  const currentLocale = useLocale();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const baseHref = `/${currentLocale ?? locale}/teacher`;

  const load = () => {
    setState({ kind: "loading" });
    Promise.all([
      fetchJson<TeacherDashboardResponse>("/api/teacher/dashboard"),
      fetchJson<TeacherClassesResponse>("/api/teacher/classes?pageSize=50"),
    ])
      .then(async ([data, classesResp]) => {
        // Devoirs · on charge en parallèle jusqu'à 3 premières classes pour
        // éviter d'exploser en N appels. Erreurs partielles absorbées.
        const targets = classesResp.items.slice(0, 3);
        const results = await Promise.allSettled(
          targets.map((c) =>
            fetchJson<{ items: TeacherAssignmentRow[] }>(
              `/api/teacher/classes/${c.id}/assignments`,
            ),
          ),
        );
        const assignments: TeacherAssignmentRow[] = [];
        let assignmentsError = false;
        for (const r of results) {
          if (r.status === "fulfilled") assignments.push(...(r.value.items ?? []));
          else assignmentsError = true;
        }
        // Tri : DRAFT en premier, puis PUBLISHED récents, puis autres.
        assignments.sort((a, b) => {
          const order: Record<string, number> = { DRAFT: 0, PUBLISHED: 1, CLOSED: 2, ARCHIVED: 3 };
          const da = order[a.status] ?? 9;
          const db = order[b.status] ?? 9;
          if (da !== db) return da - db;
          return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
        });
        setState({
          kind: "ready",
          data,
          classes: classesResp.items,
          assignments: assignments.slice(0, 20),
          assignmentsError,
        });
      })
      .catch(() => setState({ kind: "error" }));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const navGroups = buildTeacherNav(
    {
      overview: t("nav.overview"),
      classes: t("nav.classes"),
      assignments: t("nav.assignments"),
      corrections: t("nav.corrections"),
      resources: t("nav.resources"),
      messages: t("nav.messages"),
      sectionLabel: t("sidebarSection"),
    },
    baseHref,
  );

  const personaLabel = t("personaLabel");
  const personaSubtitle = t("personaSubtitle");

  const sidebar = (
    <DashboardSidebar
      groups={navGroups}
      activeHref={baseHref}
      personaLabel={personaLabel}
      personaSubtitle={personaSubtitle}
      brandHref={`/${currentLocale ?? locale}`}
      previewBadge={tRoot("common.previewBadge")}
    />
  );

  const mobileHeader = (
    <DashboardMobileHeader
      personaLabel={personaLabel}
      personaSubtitle={t("meta", { center: "" }).replace("Centre ", "") || undefined}
      brandHref={`/${currentLocale ?? locale}`}
    />
  );

  // Compteurs réels uniquement (aucune donnée fictive) : les corrections et
  // messages n'ayant pas d'endpoint d'agrégation dans ce lot, leur badge
  // reste absent (badgeCount omis).
  const buildTabs = (correctionsCount?: number | null): DashboardTab[] => [
    { key: "overview", label: t("mobileNav.overview"), href: baseHref },
    { key: "classes", label: t("mobileNav.classes"), href: `${baseHref}#mes-classes` },
    { key: "corrections", label: t("mobileNav.corrections"), href: `${baseHref}#corrections`, badgeCount: correctionsCount ?? null },
    { key: "assignments", label: t("mobileNav.assignments"), href: `${baseHref}#devoirs` },
    { key: "messages", label: t("mobileNav.messages"), href: `${baseHref}#messages` },
  ];

  if (state.kind === "loading") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={<DashboardTabBar tabs={buildTabs(null)} activeKey="overview" />}
          header={<DashboardHeader title={personaLabel} subtitle={t("loading")} />}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <DashboardSkeleton height={110} rounded={18} />
              <DashboardSkeleton height={110} rounded={18} />
              <DashboardSkeleton height={110} rounded={18} />
            </div>
            <DashboardSkeleton height={220} rounded={18} />
            <DashboardSkeleton height={220} rounded={18} />
          </div>
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  if (state.kind === "error") {
    return (
      <DashboardPageBoundary>
        <DashboardShell
          sidebar={sidebar}
          mobileHeader={mobileHeader}
          tabBar={<DashboardTabBar tabs={buildTabs(null)} activeKey="overview" />}
          header={<DashboardHeader title={personaLabel} />}
        >
          <DashboardErrorState
            title={t("error")}
            action={
              <button
                type="button"
                onClick={load}
                style={{
                  marginTop: 8,
                  padding: "10px 18px",
                  minHeight: 40,
                  borderRadius: "var(--yema-r-pill)",
                  background: "transparent",
                  border: "1px solid var(--yema-gold-edge)",
                  color: "var(--yema-gold-light)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("retry")}
              </button>
            }
          />
        </DashboardShell>
      </DashboardPageBoundary>
    );
  }

  const { data, classes, assignments, assignmentsError } = state;
  const centerName = data.center?.name ?? null;
  const meta = centerName ? t("meta", { center: centerName }) : t("metaWithoutCenter");

  return (
    <DashboardPageBoundary>
      <DashboardShell
        sidebar={sidebar}
        mobileHeader={mobileHeader}
        tabBar={<DashboardTabBar tabs={buildTabs(null)} activeKey="overview" />}
        header={
          <DashboardHeader
            title={personaLabel}
            subtitle={meta}
            meta={
              !data.teacher.isVerified ? (
                <DashboardStatusChip tone="alert">{t("unverifiedBadge")}</DashboardStatusChip>
              ) : undefined
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <TeacherOverviewSection data={data} />
          <TeacherClassesSection classes={classes} loading={false} baseHref={baseHref} />
          <TeacherAssignmentsSection
            assignments={assignments}
            loading={false}
            loadError={assignmentsError && assignments.length === 0}
            baseHref={baseHref}
          />
          <TeacherCorrectionsSection />
          {/* Lot 7B · contexte parcours Monde · distribution + preview
              file avec PathwayMetaChip · réutilise /api/teacher/students. */}
          <TeacherMondeContextSection />
          <TeacherResourcesSection />
          <TeacherMessagesSection />
          {classes.length === 0 && assignments.length === 0 && data.stats.activeStudentCount === 0 ? (
            <DashboardCard>
              <DashboardEmptyState title={t("overview.kpisEmptyHelp")} />
            </DashboardCard>
          ) : null}
        </div>
      </DashboardShell>
    </DashboardPageBoundary>
  );
}

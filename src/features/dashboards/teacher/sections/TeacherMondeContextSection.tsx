"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import "@/features/dashboards/student-monde/ivory/tokens.css";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import {
  distributePathways,
  type PathwayDistributionRow,
} from "@/features/dashboards/student-monde/ivory";
import {
  PathwayDistributionCard,
  PathwayMetaChip,
} from "@/features/dashboards/monde-context";
import type { TeacherStudentRow, TeacherStudentsResponse } from "../types";

// Lot 7B · contexte parcours Monde côté Teacher · brief §4-7.
//
// UNE SEULE section · pas de tab de sélection de parcours. Le parcours
// est dérivé côté client via resolveMondePath (source unique).
// Réutilise la file /api/teacher/students existante · aucune nouvelle API.

async function fetchStudents(): Promise<TeacherStudentsResponse | null> {
  try {
    const r = await fetch("/api/teacher/students?pageSize=100", { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as TeacherStudentsResponse;
  } catch {
    return null;
  }
}

export function TeacherMondeContextSection() {
  const t = useTranslations("yemaDashboards.mondeContext.teacher");
  const [students, setStudents] = useState<TeacherStudentRow[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchStudents().then((res) => {
      setStudents(res?.items ?? []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const rows: readonly PathwayDistributionRow[] = distributePathways(students ?? []);
  const totalStudents = students?.length ?? 0;

  return (
    <section
      id="monde-context"
      aria-labelledby="monde-context-title"
      data-monde-ivory
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <DashboardSectionHeader
        title={<span id="monde-context-title">{t("title")}</span>}
        description={t("description")}
      />
      {totalStudents === 0 ? (
        <DashboardCard>
          <DashboardEmptyState title={t("empty.title")} description={t("empty.description")} />
        </DashboardCard>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <PathwayDistributionCard rows={rows} />
          {/* Preview de la file · 5 premières lignes · chaque ligne
              affiche nom + niveau + PathwayMetaChip discret. */}
          <section
            style={{
              padding: 16,
              background: "var(--monde-surface)",
              border: "1px solid var(--monde-border)",
              borderRadius: "var(--monde-r-card)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--monde-ink)" }}>
              {t("learnersPreviewTitle")}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
              {(students ?? []).slice(0, 5).map((s, i) => (
                <li
                  key={s.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--monde-border)",
                    minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--monde-ink)", fontWeight: 500 }}>
                    {s.fullName ?? t("anonymousLearner")}
                  </span>
                  <PathwayMetaChip learningGoal={s.learningGoal} level={s.level} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}

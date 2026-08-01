"use client";

import { useTranslations } from "next-intl";
import "@/features/dashboards/student-monde/ivory/tokens.css";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import { PathwayMetaChip } from "@/features/dashboards/monde-context";
import type { TeacherStudentRow } from "../types";

// Lot 7B.1 · corrections · file d'apprenants avec contexte parcours intégré.
//
// L'agrégation cross-classroom des submissions non-corrigées n'a toujours
// pas d'endpoint dédié (LOCK_HONESTLY brief §4). Le compromis honnête ·
// afficher la file des apprenants scopés Teacher avec, sur chaque ligne,
// le PathwayMetaChip (parcours + niveau + objectif court). Ainsi le
// Teacher voit qui attend une correction sans fausse liste de devoirs.
//
// Aucun bouton nouveau, aucune action de correction inventée · les
// submissions individuelles restent accessibles via les endpoints
// existants /api/teacher/assignments/[id]/submissions.
//
// Les students sont fournis par TeacherDashboard (source unique).

type Props = {
  students: TeacherStudentRow[];
  loadError?: boolean;
};

export function TeacherCorrectionsSection({ students, loadError = false }: Props) {
  const t = useTranslations("yemaDashboards.teacher.corrections");

  return (
    <section id="corrections" aria-labelledby="corrections-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="corrections-title">{t("title")}</span>}
        description={t("description")}
      />
      <DashboardCard>
        {loadError && students.length === 0 ? (
          <DashboardEmptyState
            title={t("empty")}
            description={t("invisibleUntilPublished")}
          />
        ) : students.length === 0 ? (
          <DashboardEmptyState
            title={t("empty")}
            description={t("invisibleUntilPublished")}
          />
        ) : (
          <div data-monde-ivory>
            <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--yema-text-muted)" }}>
              {t("queueContextNote")}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {students.map((s, i) => (
                <li
                  key={s.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--monde-border)",
                    minHeight: 44,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--monde-ink)",
                        fontWeight: 500,
                      }}
                    >
                      {s.fullName ?? t("anonymousLearner")}
                    </span>
                    <span
                      className="monde-mono"
                      style={{
                        color: "var(--monde-text-muted)",
                        fontSize: 11,
                      }}
                    >
                      {t("awaitingReview")}
                    </span>
                  </div>
                  <PathwayMetaChip learningGoal={s.learningGoal} level={s.level} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </DashboardCard>
    </section>
  );
}

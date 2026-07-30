"use client";

import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/features/dashboards/shared";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type Level = (typeof LEVELS)[number];

type Props = {
  currentLevel: string | null;
};

function normalizeLevel(raw: string | null): Level | null {
  if (!raw) return null;
  const u = raw.toUpperCase();
  return (LEVELS as readonly string[]).includes(u) ? (u as Level) : null;
}

export function JourneySection({ currentLevel }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.journey");
  const level = normalizeLevel(currentLevel);
  const currentIndex = level ? LEVELS.indexOf(level) : -1;

  return (
    <section id="mon-parcours" aria-labelledby="mon-parcours-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="mon-parcours-title">{t("title")}</span>}
        description={t("description")}
      />
      {!level ? (
        <DashboardCard>
          <div style={{ color: "var(--yema-text-muted)", fontSize: 13 }}>{t("empty")}</div>
        </DashboardCard>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {LEVELS.map((lvl, i) => {
            const isCurrent = i === currentIndex;
            const isLocked = i > currentIndex;
            return (
              <li key={lvl}>
                <DashboardCard tone={isCurrent ? "gold" : "surface"} style={{ opacity: isLocked ? 0.55 : 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span
                      aria-hidden="true"
                      className="yema-mono"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isCurrent ? "var(--yema-gold)" : "var(--yema-surface-2)",
                        color: isCurrent ? "#1a1108" : "var(--yema-text-muted)",
                        border: `1px solid ${isCurrent ? "var(--yema-gold-dark)" : "var(--yema-border)"}`,
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {lvl}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, color: "var(--yema-text)" }}>
                      {t(`levels.${lvl}`)}
                    </span>
                    {isCurrent ? (
                      <DashboardStatusChip tone="gold">{t("current")}</DashboardStatusChip>
                    ) : null}
                  </div>
                </DashboardCard>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

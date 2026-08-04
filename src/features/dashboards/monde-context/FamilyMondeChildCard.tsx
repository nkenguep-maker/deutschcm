"use client";

import "@/features/dashboards/student-monde/ivory/tokens.css";
import { useTranslations } from "next-intl";
import { resolveMondePath } from "@/features/dashboards/student-monde/ivory";

// Lot 7B · carte enfant Monde côté Family · brief §10-13.
//
// Activée UNIQUEMENT quand ChildProfile.universe === "MONDE". Le
// dashboard Family Racines existant reste inchangé.
//
// Le parent voit · parcours actif · progression · activité prioritaire ·
// recommandation. Le parent NE PEUT PAS · modifier la progression, noter,
// valider un devoir, se faire passer pour l'enfant.

type Props = {
  child: {
    id: string;
    prenom: string;
    avatarAnimal: string;
    learningGoal?: string | null;
    level?: string | null;
    progressPct?: number | null;
    minutesThisWeek?: number | null;
  };
};

export function FamilyMondeChildCard({ child }: Props) {
  const t = useTranslations("yemaDashboards.mondeContext");
  const path = resolveMondePath({ learningGoal: child.learningGoal ?? null });

  return (
    <div
      data-monde-ivory
      style={{
        marginTop: 16,
        padding: 20,
        background: "var(--monde-surface)",
        border: "1px solid var(--monde-border)",
        borderRadius: "var(--monde-r-card)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Signalétique + niveau */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className="monde-mono" style={{ color: "var(--monde-gold)" }}>
          {path ? t(`pathwayLabel.${path}`) : t("fallback.unknown_short")}
        </span>
        {child.level ? (
          <span className="monde-mono" style={{ color: "var(--monde-text-muted)" }}>
            {t("family.level", { level: child.level })}
          </span>
        ) : null}
      </div>

      {/* Progression · lecture seule */}
      {typeof child.progressPct === "number" ? (
        <div>
          <div
            role="progressbar"
            aria-valuenow={child.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("family.progress_label", { pct: child.progressPct })}
            style={{ height: 4, background: "var(--monde-border)", borderRadius: 2, overflow: "hidden" }}
          >
            <div style={{ height: "100%", width: `${child.progressPct}%`, background: "var(--monde-ink)" }} />
          </div>
          <div className="monde-mono" style={{ marginTop: 6, color: "var(--monde-text-muted)" }}>
            {t("family.progress_pct", { pct: child.progressPct })}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "var(--monde-text-muted)" }}>
          {t("family.empty.no_progress")}
        </p>
      )}

      {/* Temps (uniquement si mesuré) */}
      {typeof child.minutesThisWeek === "number" && child.minutesThisWeek > 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--monde-text-secondary)" }}>
          {t("family.minutes_this_week", { count: child.minutesThisWeek })}
        </p>
      ) : null}

      {/* Recommandation calme · lecture seule */}
      <div style={{ borderTop: "1px solid var(--monde-border)", paddingTop: 12 }}>
        <div className="monde-mono" style={{ color: "var(--monde-text-muted)", marginBottom: 4 }}>
          {t("family.recommendation_label")}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--monde-ink)" }}>
          {t(`family.recommendation.${path ?? "unknown"}`)}
        </p>
      </div>
    </div>
  );
}

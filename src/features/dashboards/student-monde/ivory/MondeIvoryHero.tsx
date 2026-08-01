"use client";

import { useTranslations } from "next-intl";
import type { PathStatus } from "./mondePath";
import { getPathConfig } from "./mondePathConfig";

// Lot 7A · Hero éditorial Monde Ivory · posé directement sur le papier.
// AUCUNE grande carte contenant tout · un seul h1 · CTA principal en encre.

type Props = {
  status: PathStatus;
  level: string | null;
  onPrimaryAction: () => void;      // reprend l'unité pédagogique existante
  onEditGoal: () => void;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.max(0, Math.ceil((d - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function MondeIvoryHero({ status, level, onPrimaryAction, onEditGoal }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.ivory");
  const path = status.path;

  // Signalétique · dépend du parcours.
  let signalLabel: string;
  if (!path) {
    signalLabel = t("signal.no_pathway");
  } else {
    const cfg = getPathConfig(path);
    if (cfg.signalLabelKey === "signal.travel_countdown") {
      const n = daysUntil(status.targetDate);
      signalLabel = n === null
        ? t("signal.travel_no_date")
        : t("signal.travel_countdown", { days: n });
    } else if (cfg.signalLabelKey === "signal.exam_countdown") {
      const n = daysUntil(status.targetDate);
      signalLabel = n === null
        ? t("signal.exam_no_date")
        : t("signal.exam_countdown", { days: n });
    } else {
      signalLabel = t("signal.next_stop");
    }
  }

  // Titre + sous-titre.
  const title = path
    ? t(`hero.title.${path}` as const)
    : t("hero.title.no_pathway");
  const subtitle = path
    ? t(`hero.subtitle.${path}` as const)
    : t("hero.subtitle.no_pathway");

  const languageLine = level
    ? t("hero.language_level", { level })
    : t("hero.language_no_level");

  const primaryLabel = path ? t("cta.resume") : t("cta.define_goal");

  return (
    <section
      aria-labelledby="monde-ivory-hero-title"
      style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}
    >
      {/* Signalétique · mono chip · pas de troncature (white-space: nowrap · flex: none) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span className="monde-mono" style={{ color: "var(--monde-gold)" }}>{signalLabel}</span>
        <span className="monde-mono" style={{ color: "var(--monde-text-muted)" }}>{languageLine}</span>
      </div>

      {/* h1 unique · text-wrap pretty via CSS. */}
      <h2 id="monde-ivory-hero-title" className="monde-hero-title">{title}</h2>

      {/* Sous-titre concret. */}
      <p style={{ margin: 0, fontSize: 16, color: "var(--monde-text-secondary)", maxWidth: 640 }}>
        {subtitle}
      </p>

      {/* Progression · brief §16. */}
      <div>
        <div
          role="progressbar"
          aria-valuenow={status.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("hero.progress_label", { pct: status.progressPct })}
          style={{ height: 4, background: "var(--monde-border)", borderRadius: 2, overflow: "hidden" }}
        >
          <div
            style={{
              height: "100%",
              width: `${status.progressPct}%`,
              background: "var(--monde-ink)",
            }}
          />
        </div>
        <div className="monde-mono" style={{ marginTop: 6, color: "var(--monde-text-muted)" }}>
          {t("hero.progress_pct", { pct: status.progressPct })}
        </div>
      </div>

      {/* Actions · CTA encre + lien secondaire discret. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          className="monde-cta-primary"
          onClick={onPrimaryAction}
          aria-label={primaryLabel}
        >
          {primaryLabel}
        </button>
        {path ? (
          <button
            type="button"
            className="monde-cta-secondary"
            onClick={onEditGoal}
            aria-label={t("cta.edit_goal")}
          >
            {t("cta.edit_goal")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

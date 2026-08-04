"use client";

import { useTranslations } from "next-intl";
import type { PathwayDistributionRow } from "@/features/dashboards/student-monde/ivory";

// Lot 7B · distribution des parcours dans un résumé Teacher · brief §7.
//
// Lignes simples, aucun graphique lourd, aucun camembert. Or uniquement
// sur la ligne majoritaire (élément prioritaire). Tons neutres sinon.

type Props = { rows: readonly PathwayDistributionRow[] };

export function PathwayDistributionCard({ rows }: Props) {
  const t = useTranslations("yemaDashboards.mondeContext");

  const total = rows.reduce((s, r) => s + r.count, 0);
  const dominantIndex = rows.reduce(
    (best, r, i) => (r.count > (rows[best]?.count ?? 0) ? i : best),
    0,
  );

  return (
    <section
      aria-labelledby="pathway-distribution-title"
      style={{
        padding: 16,
        background: "var(--monde-surface, #FBF8F2)",
        border: "1px solid var(--monde-border, #DED5C6)",
        borderRadius: 16,
      }}
    >
      <h3
        id="pathway-distribution-title"
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: "var(--monde-ink, #1C1712)",
        }}
      >
        {t("distribution.title")}
      </h3>
      <p style={{ margin: "6px 0 12px", fontSize: 12, color: "var(--monde-text-muted, #9C9184)" }}>
        {t("distribution.subtitle", { count: total })}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map((r, i) => {
          const isDominant = i === dominantIndex && r.count > 0;
          const labelKey = r.path === "UNKNOWN" ? "fallback.unknown_short" : `pathwayLabel.${r.path}`;
          return (
            <li
              key={r.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--monde-border, #DED5C6)",
                minHeight: 40,
              }}
            >
              <span
                className="monde-mono"
                style={{
                  fontFamily: "var(--monde-font-mono, ui-monospace, monospace)",
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  whiteSpace: "nowrap",
                  flex: "none",
                  color: isDominant ? "var(--monde-gold, #A87423)" : "var(--monde-text-muted, #9C9184)",
                  minWidth: 140,
                }}
              >
                {t(labelKey)}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "var(--monde-ink, #1C1712)",
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                }}
              >
                {r.count}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

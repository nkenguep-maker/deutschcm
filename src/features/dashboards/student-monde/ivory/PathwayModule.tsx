"use client";

import { useTranslations } from "next-intl";
import type { MondePath } from "./mondePath";
import { getPathConfig } from "./mondePathConfig";

// Lot 7A · module central du parcours · UN SEUL rendu à la fois via
// discriminated union `moduleKind`. Aucun if/else dispersé ailleurs.

type Props = { path: MondePath };

// Chaque module rend une liste sobre (border-top 1px, pas de grille de
// cartes). Contenu i18n · aucun texte hardcodé.

export function PathwayModule({ path }: Props) {
  const cfg = getPathConfig(path);
  const t = useTranslations("yemaDashboards.studentMonde.ivory.modules");

  const items = t.raw(`${cfg.moduleKind}.items`) as string[] | undefined;
  const list = Array.isArray(items) ? items : [];

  return (
    <section aria-labelledby={`monde-module-${path}-title`}
      style={{
        marginTop: 24,
        padding: 20,
        background: "var(--monde-surface)",
        border: "1px solid var(--monde-border)",
        borderRadius: "var(--monde-r-card)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="monde-mono" style={{ color: "var(--monde-gold)" }}>{t(`${cfg.moduleKind}.eyebrow`)}</span>
      </div>
      <h2 id={`monde-module-${path}-title`}>{t(`${cfg.moduleKind}.title`)}</h2>
      <p style={{ margin: "8px 0 16px", color: "var(--monde-text-secondary)", fontSize: 14 }}>
        {t(`${cfg.moduleKind}.subtitle`)}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {list.map((label, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderTop: idx === 0 ? "none" : "1px solid var(--monde-border)",
              minHeight: 44,
            }}
          >
            <span className="monde-mono" style={{ color: "var(--monde-text-muted)", minWidth: 56 }}>
              {cfg.stepLabel} {String(idx + 1).padStart(2, "0")}
            </span>
            <span style={{ flex: 1, color: "var(--monde-ink)", fontSize: 14, textWrap: "pretty" as const }}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

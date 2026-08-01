"use client";

import { useTranslations } from "next-intl";

// Lot 7A · EmptyState Monde Ivory · brief §13.
// Bordure pointillée, label mono, phrase affirmative, au plus une action.

type Props = {
  labelKey: string;         // studentMonde.ivory.empty.<key>.label
  titleKey: string;
  descriptionKey?: string;
  actionKey?: string;
  onAction?: () => void;
};

export function MondeIvoryEmptyState({ labelKey, titleKey, descriptionKey, actionKey, onAction }: Props) {
  const t = useTranslations("yemaDashboards.studentMonde.ivory");
  return (
    <section
      style={{
        background: "var(--monde-surface)",
        border: "1px dashed var(--monde-border-strong)",
        borderRadius: "var(--monde-r-card)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span className="monde-mono" style={{ color: "var(--monde-text-muted)" }}>
        {t(labelKey)}
      </span>
      <h3 style={{ color: "var(--monde-ink)" }}>{t(titleKey)}</h3>
      {descriptionKey ? (
        <p style={{ margin: 0, color: "var(--monde-text-secondary)", fontSize: 14 }}>
          {t(descriptionKey)}
        </p>
      ) : null}
      {actionKey && onAction ? (
        <div style={{ marginTop: 8 }}>
          <button type="button" className="monde-cta-secondary" onClick={onAction}>
            {t(actionKey)}
          </button>
        </div>
      ) : null}
    </section>
  );
}

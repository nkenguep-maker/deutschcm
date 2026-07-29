import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  code?: string;
};

export function DashboardErrorState({ title, description, action, code }: Props) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "18px 20px",
        borderRadius: "var(--yema-r-card)",
        border: "1px solid rgba(229, 140, 114, 0.32)",
        background: "rgba(229, 140, 114, 0.08)",
        color: "var(--yema-alert)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title ?? "Impossible d'afficher ce contenu"}</div>
        {code ? (
          <span
            className="yema-mono"
            style={{ fontSize: 11, opacity: 0.7 }}
          >
            {code}
          </span>
        ) : null}
      </div>
      {description ? (
        <div style={{ fontSize: 13.5, color: "var(--yema-text)" }}>{description}</div>
      ) : null}
      {action}
    </div>
  );
}

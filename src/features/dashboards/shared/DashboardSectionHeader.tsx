import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
};

export function DashboardSectionHeader({ title, description, actions, eyebrow }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {eyebrow ? (
          <div
            className="yema-mono"
            style={{
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--yema-text-muted)",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--yema-text)" }}>
          {title}
        </h2>
        {description ? (
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--yema-text-muted)" }}>
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
    </div>
  );
}

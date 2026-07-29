import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function DashboardHeader({ title, subtitle, actions, meta }: Props) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.2,
            color: "var(--yema-text)",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <div style={{ marginTop: 4, fontSize: 13.5, color: "var(--yema-text-muted)" }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {meta ? (
        <div
          className="yema-mono"
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "var(--yema-text-muted)",
          }}
        >
          {meta}
        </div>
      ) : null}
      {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
    </div>
  );
}

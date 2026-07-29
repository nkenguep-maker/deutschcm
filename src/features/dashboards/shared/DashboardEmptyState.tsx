import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
};

export function DashboardEmptyState({ title, description, action, icon }: Props) {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 20px",
        gap: 10,
        color: "var(--yema-text-muted)",
      }}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>{title}</div>
      {description ? (
        <div style={{ fontSize: 13.5, maxWidth: 340 }}>{description}</div>
      ) : null}
      {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
    </div>
  );
}

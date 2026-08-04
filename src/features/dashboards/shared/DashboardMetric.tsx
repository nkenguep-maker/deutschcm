import type { ReactNode } from "react";
import { DashboardCard } from "./DashboardCard";

type Props = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  trend?: ReactNode;
};

export function DashboardMetric({ label, value, hint, trend }: Props) {
  return (
    <DashboardCard tone="surface" ariaLabel={typeof label === "string" ? label : undefined}>
      <div
        className="yema-mono"
        style={{
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "var(--yema-text-muted)",
        }}
      >
        {label}
      </div>
      <div
        className="yema-mono"
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 600,
          color: "var(--yema-gold-light)",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--yema-text-muted)" }}>{hint}</div>
      ) : null}
      {trend ? <div style={{ marginTop: 8 }}>{trend}</div> : null}
    </DashboardCard>
  );
}

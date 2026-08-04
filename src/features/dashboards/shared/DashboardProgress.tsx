import type { ReactNode } from "react";

type Props = {
  value: number;
  max?: number;
  label?: ReactNode;
  hint?: ReactNode;
  ariaLabel?: string;
};

export function DashboardProgress({ value, max = 100, label, hint, ariaLabel }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label || hint ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          {label ? (
            <span style={{ fontSize: 13, color: "var(--yema-text)" }}>{label}</span>
          ) : (
            <span />
          )}
          {hint ? (
            <span
              className="yema-mono"
              style={{
                fontSize: 12,
                color: "var(--yema-text-muted)",
              }}
            >
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
        style={{
          height: 6,
          borderRadius: "var(--yema-r-pill)",
          background: "var(--yema-surface-2)",
          border: "1px solid var(--yema-border)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--yema-gold), var(--yema-gold-light))",
            transition: "width var(--yema-dur-move) var(--yema-ease-glide)",
          }}
        />
      </div>
    </div>
  );
}

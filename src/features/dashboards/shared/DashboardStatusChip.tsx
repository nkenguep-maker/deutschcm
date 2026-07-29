import type { ReactNode } from "react";
import type { StatusTone } from "./types";

type Props = {
  children: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
};

function palette(tone: StatusTone) {
  switch (tone) {
    case "gold":
      return { bg: "var(--yema-gold-glow)", border: "var(--yema-gold-edge)", color: "var(--yema-gold-light)" };
    case "success":
      return { bg: "rgba(143, 203, 158, 0.14)", border: "rgba(143, 203, 158, 0.32)", color: "var(--yema-success)" };
    case "alert":
      return { bg: "rgba(229, 140, 114, 0.14)", border: "rgba(229, 140, 114, 0.32)", color: "var(--yema-alert)" };
    case "muted":
      return { bg: "transparent", border: "var(--yema-border-strong)", color: "var(--yema-text-muted)" };
    default:
      return { bg: "var(--yema-surface-2)", border: "var(--yema-border)", color: "var(--yema-text)" };
  }
}

export function DashboardStatusChip({ children, tone = "neutral", icon }: Props) {
  const c = palette(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--yema-r-pill)",
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

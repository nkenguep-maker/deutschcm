import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: "div" | "section" | "article";
  padded?: boolean;
  tone?: "surface" | "surface-2" | "gold";
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

export function DashboardCard({
  children,
  as: Tag = "section",
  padded = true,
  tone = "surface",
  className,
  style,
  ariaLabel,
}: Props) {
  const bg =
    tone === "gold"
      ? "var(--yema-gold-glow)"
      : tone === "surface-2"
        ? "var(--yema-surface-2)"
        : "var(--yema-surface)";
  const border = tone === "gold" ? "var(--yema-gold-edge)" : "var(--yema-border)";
  return (
    <Tag
      className={className}
      aria-label={ariaLabel}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--yema-r-card)",
        padding: padded ? 20 : 0,
        boxShadow: "0 1px 0 rgba(0,0,0,0.25)",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

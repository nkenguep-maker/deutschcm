import type { CSSProperties } from "react";

type Props = {
  size?: number;
  withLabel?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Le logo YEMA : un V doré tracé en SVG + le mot-symbole en mono espacé.
export function YemaWordmark({
  size = 22,
  withLabel = true,
  className,
  style,
}: Props) {
  const width = Math.round(size * (26 / 24));
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        color: "var(--yema-gold)",
        ...style,
      }}
    >
      <svg
        width={width}
        height={size}
        viewBox="0 0 26 24"
        aria-hidden={withLabel ? "true" : "false"}
        role={withLabel ? undefined : "img"}
        aria-label={withLabel ? undefined : "YEMA"}
      >
        <path
          d="M3 2 L13 22 L23 2"
          fill="none"
          stroke="var(--yema-gold)"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel ? (
        <span className="yema-wordmark" style={{ fontSize: Math.round(size * 0.68) }}>
          YEMA
        </span>
      ) : null}
    </span>
  );
}

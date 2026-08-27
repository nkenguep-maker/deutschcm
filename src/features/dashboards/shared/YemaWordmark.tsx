import type { CSSProperties } from "react";
import { BrandY } from "@/components/brand/BrandY";

type Props = {
  size?: number;
  withLabel?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Lockup YEMA canonique : BrandY + mot-symbole YEMA.
export function YemaWordmark({
  size = 22,
  withLabel = true,
  className,
  style,
}: Props) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color: "var(--yema-gold)",
        ...style,
      }}
    >
      <BrandY
        variant="world"
        state="static"
        size={Math.max(24, Math.round(size * 1.35))}
        ariaLabel={withLabel ? undefined : "YEMA"}
      />
      {withLabel ? (
        <span
          className="yema-wordmark"
          style={{
            fontSize: Math.round(size * 0.68),
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          YEMA
        </span>
      ) : null}
    </span>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { YemaWordmark } from "./YemaWordmark";

type Props = {
  personaLabel: string;
  personaSubtitle?: string;
  brandHref?: string;
  right?: ReactNode;
};

// Mobile header compact (spec PDF §2.1) : logo V + wordmark YEMA + identité
// persona. Reste dans le shell mobile sous 900px.
export function DashboardMobileHeader({
  personaLabel,
  personaSubtitle,
  brandHref = "/",
  right,
}: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Link
        href={brandHref}
        style={{ textDecoration: "none", color: "inherit", display: "inline-flex" }}
      >
        <YemaWordmark size={18} />
      </Link>
      <div style={{ minWidth: 0, flex: 1, marginLeft: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--yema-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {personaLabel}
        </div>
        {personaSubtitle ? (
          <div
            className="yema-mono"
            style={{
              fontSize: 10,
              color: "var(--yema-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {personaSubtitle}
          </div>
        ) : null}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

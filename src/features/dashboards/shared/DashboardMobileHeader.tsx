import type { ReactNode } from "react";
import Link from "next/link";
import { YemaWordmark } from "./YemaWordmark";

type Props = {
  personaLabel: string;
  personaSubtitle?: string;
  brandHref?: string;
  right?: ReactNode;
};

export function DashboardMobileHeader({
  personaLabel,
  personaSubtitle,
  brandHref = "/",
  right,
}: Props) {
  const isChildPersona = /enfant|child/i.test(personaLabel);
  const localeBase = brandHref === "/" ? "" : brandHref.replace(/\/$/, "");
  const offersHref = `${localeBase}/offers` || "/offers";
  const offersLabel = brandHref.startsWith("/en") ? "Offers" : "Offres";

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
      {!isChildPersona ? (
        <Link
          href={offersHref}
          style={{
            minHeight: 36,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 10px",
            borderRadius: 999,
            border: "1px solid var(--yema-gold-edge)",
            background: "var(--yema-gold-glow)",
            color: "var(--yema-gold-light)",
            textDecoration: "none",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {offersLabel}
        </Link>
      ) : null}
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export type DashboardTab = {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  // Badge affiché uniquement si count est un nombre > 0 (jamais fictif).
  badgeCount?: number | null;
};

type Props = {
  tabs: DashboardTab[];
  activeKey: string;
  ariaLabel?: string;
};

// DashboardTabBar · sticky bottom, spec PDF §2.4.
// Visible uniquement sous 900px via classe yema-tab-bar (media query dans le
// shell). Indicateur or 22×3 sur l'onglet actif. aria-current="page" sur l'actif.
export function DashboardTabBar({ tabs, activeKey, ariaLabel = "Navigation" }: Props) {
  return (
    <nav
      className="yema-tab-bar"
      aria-label={ariaLabel}
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: "rgba(15, 11, 7, 0.96)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: "1px solid var(--yema-border)",
        padding: "8px 6px 14px",
        display: "flex",
        gap: 2,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const showBadge = typeof tab.badgeCount === "number" && tab.badgeCount > 0;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              minHeight: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "6px 4px",
              textDecoration: "none",
              color: active ? "var(--yema-gold-light)" : "var(--yema-text-soft, var(--yema-text-muted))",
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              lineHeight: 1.15,
              textAlign: "center",
              position: "relative",
              transition: "color var(--yema-dur-touch) var(--yema-ease-glide)",
            }}
          >
            {tab.icon ? (
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
                {tab.icon}
              </span>
            ) : null}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {tab.label}
              {showBadge ? (
                <span
                  className="yema-mono"
                  aria-label={`${tab.badgeCount}`}
                  style={{
                    minWidth: 16,
                    height: 16,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--yema-gold)",
                    color: "#1a1108",
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {tab.badgeCount! > 99 ? "99+" : tab.badgeCount}
                </span>
              ) : null}
            </span>
            {active ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  width: 22,
                  height: 3,
                  borderRadius: 3,
                  background: "var(--yema-gold)",
                }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

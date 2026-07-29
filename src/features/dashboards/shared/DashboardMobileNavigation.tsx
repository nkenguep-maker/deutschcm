"use client";

import { useState } from "react";
import Link from "next/link";
import { YemaWordmark } from "./YemaWordmark";
import type { NavGroup } from "./types";

type Props = {
  groups: NavGroup[];
  activeHref: string;
  personaLabel?: string;
};

// Navigation compacte affichée sous 900px de large. Panneau plié par défaut,
// s'ouvre au tap.
export function DashboardMobileNavigation({ groups, activeHref, personaLabel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--yema-border)",
        background: "var(--yema-sidebar)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
        }}
      >
        <YemaWordmark size={18} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="yema-mobile-drawer"
          style={{
            minHeight: 44,
            minWidth: 44,
            padding: "10px 14px",
            borderRadius: "var(--yema-r-pill)",
            border: "1px solid var(--yema-gold-edge)",
            background: "transparent",
            color: "var(--yema-gold)",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav
          id="yema-mobile-drawer"
          aria-label="Navigation mobile"
          style={{
            padding: "8px 12px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderTop: "1px solid var(--yema-border)",
          }}
        >
          {personaLabel ? (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--yema-text-muted)",
              }}
            >
              {personaLabel}
            </div>
          ) : null}
          {groups.map((group) => (
            <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {group.label ? (
                <div
                  className="yema-mono"
                  style={{
                    padding: "0 12px",
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "var(--yema-text-muted)",
                  }}
                >
                  {group.label}
                </div>
              ) : null}
              {group.items.map((item) => {
                const active = item.href === activeHref || activeHref.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      minHeight: 44,
                      borderRadius: "var(--yema-r-chip)",
                      background: active ? "var(--yema-gold-glow)" : "transparent",
                      color: active ? "var(--yema-text)" : "var(--yema-text-muted)",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
                    {item.badge}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

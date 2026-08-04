import type { ReactNode } from "react";
import Link from "next/link";
import { YemaWordmark } from "./YemaWordmark";
import type { NavGroup } from "./types";

type Props = {
  groups: NavGroup[];
  activeHref: string;
  footer?: ReactNode;
  personaLabel?: string;
  personaSubtitle?: string;
  personaAvatar?: ReactNode;
  brandHref?: string;
  previewBadge?: ReactNode;
};

function isActive(itemHref: string, activeHref: string): boolean {
  if (itemHref === activeHref) return true;
  return activeHref.startsWith(itemHref + "/");
}

export function DashboardSidebar({
  groups,
  activeHref,
  footer,
  personaLabel,
  personaSubtitle,
  personaAvatar,
  brandHref = "/",
  previewBadge,
}: Props) {
  return (
    <nav
      aria-label="Navigation principale"
      style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}
    >
      <Link
        href={brandHref}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <YemaWordmark size={22} />
      </Link>

      {personaLabel ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            background: "var(--yema-surface)",
            border: "1px solid var(--yema-border)",
            borderRadius: "var(--yema-r-card)",
            padding: "12px 14px",
          }}
        >
          {personaAvatar ? (
            <span aria-hidden="true">{personaAvatar}</span>
          ) : (
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: "999px",
                background: "var(--yema-gold-glow)",
                border: "1px solid var(--yema-gold-edge)",
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>
              {personaLabel}
            </div>
            {personaSubtitle ? (
              <div style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>
                {personaSubtitle}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {groups.map((group) => (
          <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {group.label ? (
              <div
                className="yema-mono"
                style={{
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "var(--yema-text-muted)",
                  padding: "6px 10px",
                }}
              >
                {group.label}
              </div>
            ) : null}
            {group.items.map((item) => {
              const active = isActive(item.href, activeHref);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: "var(--yema-r-chip)",
                    color: active ? "var(--yema-text)" : "var(--yema-text-muted)",
                    background: active ? "var(--yema-gold-glow)" : "transparent",
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    transition: `color var(--yema-dur-touch) var(--yema-ease-glide), background var(--yema-dur-touch) var(--yema-ease-glide)`,
                  }}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 6,
                        bottom: 6,
                        width: 3,
                        borderRadius: 3,
                        background: "var(--yema-gold)",
                      }}
                    />
                  ) : null}
                  {item.icon ? (
                    <span aria-hidden="true" style={{ width: 18, height: 18, display: "inline-flex" }}>
                      {item.icon}
                    </span>
                  ) : null}
                  <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
                  {item.badge}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {previewBadge ? (
        <div
          style={{
            fontSize: 11,
            color: "var(--yema-text-faint)",
            padding: "10px 12px",
            border: "1px dashed var(--yema-border-strong)",
            borderRadius: "var(--yema-r-chip)",
          }}
        >
          {previewBadge}
        </div>
      ) : null}

      {footer}
    </nav>
  );
}

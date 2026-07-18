"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { frTypo } from "@/components/landing/typo";

export type SpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";

interface Props {
  roles: SpaceRole[];
  activeSpace: SpaceRole;
}

const ROUTE: Record<SpaceRole, string> = {
  STUDENT: "/dashboard",
  TEACHER: "/teacher",
  CENTER: "/center",
  ADMIN: "/admin",
};

const DOT_TOKEN: Record<SpaceRole, string> = {
  STUDENT: "var(--brass)",
  TEACHER: "var(--brass)",
  CENTER: "var(--brass)",
  ADMIN: "var(--oxblood)",
};

export function SpaceSwitcher({ roles, activeSpace }: Props) {
  const t = useTranslations("space");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<SpaceRole | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (roles.length < 2) return null;

  const label = (r: SpaceRole) => {
    const raw = t(`role.${r}`);
    return locale === "fr" ? frTypo(raw) : raw;
  };

  const switchTo = async (role: SpaceRole) => {
    if (role === activeSpace) {
      setOpen(false);
      return;
    }
    setSwitching(role);
    try {
      const res = await fetch("/api/space/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      // Le serveur choisit l'URL de redirection (onboarding si nécessaire)
      const dest = (data.redirectTo as string | undefined) ?? `/${locale}${ROUTE[role]}`;
      // HARD navigation — le layout wrapper (Layout / TeacherLayout /
      // CenterLayout) diffère selon l'espace. router.push conserve le
      // layout Next.js partagé et peut laisser l'ancien sidebar monté
      // pendant l'hydratation du nouveau. window.location.assign force
      // un teardown complet, chaque espace est repeint proprement.
      window.location.assign(dest);
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="space-switcher">
      <button
        type="button"
        className="space-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("switchAria")}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="space-switcher-dot"
          aria-hidden="true"
          style={{ background: DOT_TOKEN[activeSpace] }}
        />
        <span className="space-switcher-lbl">{label(activeSpace)}</span>
        <svg
          className="space-switcher-chevron"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            d="M2 4 L5 7 L8 4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul className="space-switcher-menu" role="listbox" aria-label={t("menuAria")}>
          {roles.map((r) => {
            const isActive = r === activeSpace;
            const isSwitching = switching === r;
            return (
              <li key={r} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`space-switcher-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                  disabled={switching !== null}
                  onClick={() => switchTo(r)}
                >
                  <span
                    className="space-switcher-dot"
                    aria-hidden="true"
                    style={{ background: DOT_TOKEN[r] }}
                  />
                  <span className="space-switcher-item-lbl">{label(r)}</span>
                  {isActive ? (
                    <svg
                      className="space-switcher-check"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 7l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isSwitching ? (
                    <span className="space-switcher-spin" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

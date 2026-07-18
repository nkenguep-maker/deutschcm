"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import type { SpaceRole } from "@/components/SpaceSwitcher";

// TestSpaceBar · barre horizontale en haut de l'app, quatre chips
// Apprenant / Enseignant / Centre / Admin pour bascule rapide entre
// espaces. Self-gated : n'apparaît QUE si l'utilisateur a les 4 rôles
// actifs (typiquement un compte test avec tout accordé). Aucune
// pollution pour les vrais users mono-rôle — ils voient rien.
//
// Utile pour tester les différents dashboards sans passer par le
// SpaceSwitcher (dropdown). Ici c'est une vraie tab-bar visible.

const SPACES: Array<{
  role: SpaceRole;
  route: string;
  labelFR: string;
  labelEN: string;
}> = [
  { role: "STUDENT", route: "/dashboard", labelFR: "Apprenant·e",  labelEN: "Learner" },
  { role: "TEACHER", route: "/teacher",   labelFR: "Enseignant·e", labelEN: "Teacher" },
  { role: "CENTER",  route: "/center",    labelFR: "Centre",       labelEN: "Center" },
  { role: "ADMIN",   route: "/admin",     labelFR: "Admin",        labelEN: "Admin" },
];

export function TestSpaceBar() {
  const [roles, setRoles] = useState<SpaceRole[] | null>(null);
  const [active, setActive] = useState<SpaceRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setRoles([]);
          return;
        }
        const list = Array.isArray(d.roles) ? (d.roles as SpaceRole[]) : [];
        setRoles(list);
        if (d.activeSpace) setActive(d.activeSpace as SpaceRole);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset active guess based on current pathname
  useEffect(() => {
    const noLocale = pathname.replace(/^\/(fr|en)/, "");
    let next: SpaceRole | null = null;
    if (noLocale.startsWith("/admin")) next = "ADMIN";
    else if (noLocale.startsWith("/teacher")) next = "TEACHER";
    else if (noLocale.startsWith("/center")) next = "CENTER";
    else if (
      noLocale.startsWith("/dashboard") ||
      noLocale.startsWith("/courses") ||
      noLocale.startsWith("/progress") ||
      noLocale.startsWith("/simulateur")
    ) {
      next = "STUDENT";
    }
    if (next) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(next);
    }
  }, [pathname]);

  // Gate : au moins les 4 rôles présents. Sinon rien.
  if (!roles || roles.length < 4) return null;

  const switchTo = async (role: SpaceRole, route: string) => {
    setActive(role);
    try {
      await fetch("/api/space/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
    } catch {}
    router.push(`/${locale}${route}`);
  };

  return (
    <div
      className="test-space-bar"
      role="tablist"
      aria-label={locale === "en" ? "Test space switcher (dev)" : "Bascule espace (test)"}
    >
      <span className="test-space-bar-eye">
        {locale === "en" ? "Test · multi-space" : "Test · multi-espaces"}
      </span>
      <div className="test-space-bar-tabs">
        {SPACES.map((sp) => {
          const isActive = active === sp.role;
          return (
            <button
              key={sp.role}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`test-space-bar-tab ${isActive ? "on" : ""}`}
              onClick={() => switchTo(sp.role, sp.route)}
            >
              {locale === "en" ? sp.labelEN : sp.labelFR}
            </button>
          );
        })}
      </div>
    </div>
  );
}

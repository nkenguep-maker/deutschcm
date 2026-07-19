"use client";

// FoyerSidebar · sidebar adaptative pilotée par le cap.
// Rend l'entière colonne latérale de l'app pour un compte STUDENT :
//   · Brand Confluent + libellé d'espace (Apprenant·e / Transmission)
//   · Sélecteur de langue en tête (si 2+ langues actives)
//   · Sélecteur d'espace (rôles) si 2+ rôles — distinct du switch langue
//   · Navigation adaptative issue de NAV_BY_CAP[cap], filtrée par
//     canAccess(item, { cap, hasClassroom, paidPlan })
//   · Pied de sidebar · avatar, prénom, mail, logout
//
// Aucun if éparpillé — la config est déclarative dans nav.ts.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandY } from "@/components/brand/BrandY";
import { SpaceSwitcher, type SpaceRole } from "@/components/SpaceSwitcher";
import { IconLogout } from "@/components/landing/icons";
import { frTypo } from "@/components/landing/typo";
import { getLanguage } from "@/lib/languages";
import { createClient } from "@/lib/supabase/client";
import type { Cap } from "@/components/foyer/types";
import { canAccess, getNavConfig } from "@/components/foyer/nav";

interface FoyerSidebarProps {
  locale: string;
  loc: "fr" | "en";
  cap: Cap | null;
  activeLanguage: string;
  supportedLanguages: string[];
  activeLangueLevel: string | null;
  roles: SpaceRole[];
  activeSpace: SpaceRole;
  hasClassroom: boolean;
  paidPlan: boolean;
  userName: string;
  userEmail: string;
  open: boolean;
  onClose: () => void;
}

/** Attribut CSS supplémentaire posé sur .app-shell pour forcer la
 *  terre en cap Transmettre (le foyer prime sur la langue). */
export function foyerShellClass(cap: Cap | null, territory: "world" | "sources"): string {
  const isTransmettre = cap === "transmettre";
  const eff = isTransmettre ? "sources" : territory;
  return `territory-${eff} foyer-cap-${cap ?? "none"}`;
}

async function switchLanguage(languageId: string) {
  if (typeof document !== "undefined") {
    document.body.classList.add("foyer-switching");
  }
  try {
    await fetch("/api/language/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ languageId }),
    });
  } catch {
    if (typeof document !== "undefined") {
      document.body.classList.remove("foyer-switching");
    }
    return;
  }
  window.setTimeout(() => window.location.reload(), 240);
}

export function FoyerSidebar({
  locale,
  loc,
  cap,
  activeLanguage,
  supportedLanguages,
  activeLangueLevel,
  roles,
  activeSpace,
  hasClassroom,
  paidPlan,
  userName,
  userEmail,
  open,
  onClose,
}: FoyerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const config = getNavConfig(cap);
  const active = getLanguage(activeLanguage);
  const others = supportedLanguages.filter((id) => id !== activeLanguage);
  const showLangSwitch = supportedLanguages.length >= 2;
  const spaceLabel = loc === "en" ? config.spaceLabelEn : config.spaceLabelFr;
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "Y";
  const langName = loc === "en" ? active.nameEn : active.name;
  const activeLevel = activeLangueLevel ?? active.levels[0];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/goodbye`);
  };

  return (
    <aside className={`app-sidebar foyer-sidebar ${open ? "open" : ""}`} aria-label={t("Navigation")}>
      <Link href={`/${locale}/dashboard`} className="app-sidebar-brand" onClick={onClose}>
        <BrandY variant={cap === "transmettre" ? "sources" : "world"} state="static" size={34} />
        <span className="foyer-sidebar-brand-lbl">Yema</span>
      </Link>

      <p className="app-sidebar-space-lbl foyer-sidebar-space-lbl">{spaceLabel.toUpperCase()}</p>

      {/* Sélecteur de langue · en tête, si 2+ langues actives. Affiche
          « {LANGUE} · {niveau} » en pastille. Un clic ouvre la liste,
          un clic sur une autre langue → POST /api/language/switch +
          couture 240ms. */}
      {showLangSwitch ? (
        <div className="foyer-sidebar-langs">
          <button
            type="button"
            className="foyer-sidebar-lang-chip"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((o) => !o)}
          >
            <span className="foyer-sidebar-lang-name">{langName}</span>
            <span className="foyer-sidebar-lang-sep" aria-hidden="true">·</span>
            <span className="foyer-sidebar-lang-level">{activeLevel}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" className="foyer-sidebar-lang-swap" aria-hidden="true">
              <path d="M2 3h6l-2-2M8 7H2l2 2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {langOpen ? (
            <ul className="foyer-sidebar-lang-menu" role="listbox" aria-label={t("Choisir une langue")}>
              {others.map((id) => {
                const l = getLanguage(id);
                return (
                  <li key={id} role="option">
                    <button
                      type="button"
                      className="foyer-sidebar-lang-item"
                      onClick={() => switchLanguage(id)}
                    >
                      <span className="foyer-sidebar-lang-code">{l.code}</span>
                      <span className="foyer-sidebar-lang-item-name">{loc === "en" ? l.nameEn : l.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {/* « Mon autre voix » · pont rapide vers la seconde langue,
              affiché sous la pastille pour montrer que la maison sait
              qu'il y en a une autre — pas juste un dropdown caché. */}
          {others.length >= 1 ? (
            <button
              type="button"
              className="foyer-sidebar-other-voice"
              onClick={() => switchLanguage(others[0])}
            >
              {loc === "en" ? "My other voice →" : "Mon autre voix →"}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Sélecteur d'espace (rôles) · uniquement si 2+ rôles. */}
      {roles.length >= 2 ? (
        <div className="foyer-sidebar-space-switch">
          <SpaceSwitcher roles={roles} activeSpace={activeSpace} />
        </div>
      ) : null}

      <nav className="app-nav" aria-label={t("Navigation principale")}>
        {config.sections.map((section) => {
          const items = section.items.filter((it) =>
            canAccess(it, { cap, hasClassroom, paidPlan }),
          );
          if (items.length === 0) return null;
          const label = loc === "en" ? section.labelEn : section.labelFr;
          return (
            <div key={section.key} className="app-nav-section">
              {label ? <p className="app-nav-section-label">{t(label).toUpperCase()}</p> : null}
              {items.map((item) => {
                const href = `/${locale}${item.href}`;
                const exact = item.href === "/dashboard";
                const isActive = exact
                  ? pathname === href
                  : pathname === href || (item.href !== "/" && pathname.startsWith(href));
                const label = loc === "en" ? item.labelEn : item.labelFr;
                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={`app-nav-link ${isActive ? "active" : ""}`}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="app-nav-icon" aria-hidden="true"><item.Icon size={18} /></span>
                    <span>{t(label)}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="app-sidebar-user">
        <div className="app-sidebar-avatar" aria-hidden="true">{initials}</div>
        <div className="app-sidebar-user-info">
          <p className="app-sidebar-user-name">{userName}</p>
          <p className="app-sidebar-user-mail">{userEmail}</p>
        </div>
        <button
          type="button"
          className="app-sidebar-logout"
          onClick={handleLogout}
          aria-label={loc === "en" ? "Sign out" : "Se déconnecter"}
        >
          <IconLogout size={16} />
        </button>
      </div>
    </aside>
  );
}

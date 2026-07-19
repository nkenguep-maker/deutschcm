"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingBrand } from "./LandingBrand";

type NavLabels = {
  features: string;    // "Langues"
  levels: string;      // "Méthode"
  /** legacy — pointait vers /manifeste, désormais non rendu (nav = Langues · Méthode · Histoires · Tarifs) */
  pricing?: string;
  centers: string;
  login: string;
  register: string;
  methode?: string;
  histoires?: string;
  /** "Tarifs" — item final de la nav */
  tarifs?: string;
};

// LandingNav — mécanique client (scroll → .solid). Le locale-switch
// préserve le pathname : /fr/... ↔ /en/...
function switchLocale(target: "fr" | "en", current: string) {
  if (target === current) return;
  document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
  const path = window.location.pathname.replace(/^\/(fr|en)/, `/${target}`);
  window.location.assign(path + window.location.hash);
}

export function LandingNav({
  locale,
  labels,
  isMobile = false,
}: {
  locale: string;
  labels: NavLabels;
  isMobile?: boolean;
}) {
  const [solid, setSolid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nav finale : Langues · Méthode · La Veillée · Tarifs.
  // Enseignants/Centres vivent dans le footer (les portes). Le
  // manifeste est parqué (fichier conservé pour réactivation).
  // /histoires est redirigé 308 vers /veillee via next.config.
  const navItems = [
    { label: labels.features,                                                       href: `/${locale}/langues` },
    { label: labels.methode ?? labels.levels,                                       href: `/${locale}/methode` },
    { label: labels.histoires ?? (locale === "en" ? "The Veillée" : "La Veillée"), href: `/${locale}/veillee` },
    { label: labels.tarifs ?? (locale === "en" ? "Pricing" : "Tarifs"),             href: `/${locale}/pricing` },
  ];

  return (
    <nav className={`lnav${solid ? " solid" : ""}`}>
      <Link href={`/${locale}`} className="lnav-brand">
        <LandingBrand />
      </Link>

      {!isMobile ? (
        <div className="lnav-links">
          {navItems.map((it) => (
            <a key={it.href} href={it.href}>
              {it.label}
            </a>
          ))}
        </div>
      ) : null}

      <div className="lnav-right">
        <button
          type="button"
          className="lnav-btn-ghost"
          onClick={() => router.push(`/${locale}/login`)}
        >
          {labels.login}
        </button>
        <button
          type="button"
          className="lnav-btn-primary"
          onClick={() => router.push(`/${locale}/register`)}
        >
          {labels.register}
        </button>
        {/* Sélecteur de langue · JetBrains Mono discret, aligné
            après les CTA. Persistance via cookie NEXT_LOCALE + hard
            nav pour recharger le contexte serveur. */}
        <div className="lnav-locale" role="group" aria-label={locale === "en" ? "Interface language" : "Langue de l'interface"}>
          <button
            type="button"
            className={`lnav-locale-btn ${locale === "fr" ? "active" : ""}`}
            onClick={() => switchLocale("fr", locale)}
            aria-pressed={locale === "fr"}
          >
            FR
          </button>
          <button
            type="button"
            className={`lnav-locale-btn ${locale === "en" ? "active" : ""}`}
            onClick={() => switchLocale("en", locale)}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
        </div>
      </div>
    </nav>
  );
}

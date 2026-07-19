"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingBrand } from "./LandingBrand";

type NavLabels = {
  features: string;    // "Langues"
  levels: string;      // "Méthode"
  pricing: string;     // "Manifeste"
  centers: string;
  login: string;
  register: string;
  methode?: string;
  histoires?: string;
  /** "Tarifs" — nouveau item nav (Sprint « Les mots ») */
  tarifs?: string;
};

// LandingNav — mécanique client (scroll → .solid). Le locale-switch
// préserve le pathname : /fr/... ↔ /en/...
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

  // Sprint « Les mots » · nav = Langues · Méthode · Histoires · Manifeste
  // · Tarifs. Enseignants/Centres vivent dans le footer (les portes).
  const navItems = [
    { label: labels.features,                                       href: `/${locale}/langues` },
    { label: labels.methode ?? labels.levels,                       href: `/${locale}/methode` },
    { label: labels.histoires ?? (locale === "en" ? "Stories" : "Histoires"), href: `/${locale}/histoires` },
    { label: labels.pricing,                                        href: `/${locale}/manifeste` },
    { label: labels.tarifs ?? (locale === "en" ? "Pricing" : "Tarifs"),       href: `/${locale}/pricing` },
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
        {/* Le sélecteur de langue vit sur le Seuil (top-right), pas
            deux fois — la nav reste dédiée à la navigation. */}
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
      </div>
    </nav>
  );
}

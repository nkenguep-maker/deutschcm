"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingBrand } from "./LandingBrand";

type NavLabels = {
  features: string;    // "Langues" — nom du hub multi-langues
  levels: string;      // "Méthode"
  pricing: string;     // "Manifeste"
  centers: string;
  login: string;
  register: string;
  methode?: string;
  histoires?: string;
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
  const pathname = usePathname() ?? `/${locale}`;

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const otherLocale = locale === "fr" ? "en" : "fr";
  const switchedHref = pathname.startsWith(`/${locale}`)
    ? `/${otherLocale}${pathname.slice(3)}`
    : `/${otherLocale}`;

  // Nav items : ordre = Langues · Méthode · Histoires · Manifeste.
  // Toutes pointent vers des pages dédiées (pas d'ancre landing).
  const navItems = [
    {
      label: labels.features, // "Langues"
      href: `/${locale}/langues`,
    },
    {
      label: labels.methode ?? labels.levels, // "Méthode"
      href: `/${locale}/methode`,
    },
    {
      label: labels.histoires ?? (locale === "en" ? "Journeys" : "Histoires"),
      href: `/${locale}/histoires`,
    },
    {
      label: labels.pricing, // "Manifeste"
      href: `/${locale}/manifeste`,
    },
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
        <Link
          className="lnav-locale"
          href={switchedHref}
          hrefLang={otherLocale}
          rel="alternate"
          aria-label={otherLocale.toUpperCase()}
          title={otherLocale === "fr" ? "Français" : "English"}
        >
          {otherLocale.toUpperCase()}
        </Link>
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

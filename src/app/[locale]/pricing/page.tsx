"use client";

// /pricing · le SEUIL · deux portes, un Confluent entre elles.
// Aucun prix ici — la page est brève. On choisit une posture, pas
// un pack. Le Confluent (BrandY) sur la ligne de bascule devient
// l'articulation visuelle du choix.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import { PRICING_COPY } from "@/lib/pricing";

const FOOTER_FR = {
  tagline: "L’Afrique parle. Toutes ses langues, enfin un lieu.",
  made: "L’Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  legal: "Mentions légales",
  terms: "CGU",
  privacy: "Confidentialité",
  contact: "Contact",
  disclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde, et indépendante pour les langues africaines. N’est affiliée à aucun organisme officiel d’examen.",
};
const FOOTER_EN = {
  tagline: "Africa speaks. All its languages, at last one place.",
  made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  legal: "Legal",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  disclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages, and independent for African languages. Not affiliated with any official examination institute.",
};

export default function PricingChoicePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: loc === "en" ? "Languages" : "Langues",
          levels: loc === "en" ? "Method" : "Méthode",
          centers: loc === "en" ? "Centers" : "Centres",
          login: loc === "en" ? "Log in" : "Se connecter",
          register: loc === "en" ? "Start" : "Commencer",
        }}
      />

      <main className="pricing-page pricing-seuil">
        {/* Kicker + question · asymétrique, respiration à gauche */}
        <section className="pricing-seuil-head">
          <div className="maison-container">
            <p className="pricing-seuil-kicker">{t(c.doorsKicker).toUpperCase()}</p>
            <h1 className="pricing-seuil-h">{t(c.doorsTitle)}</h1>
            <p className="pricing-seuil-lede">{t(c.doorsSub)}</p>
          </div>
        </section>

        {/* Deux portes avec le Confluent sur la ligne de bascule ·
            desktop: BrandY absolu au centre, chevauche les deux cartes;
            mobile: stack vertical, BrandY en séparateur horizontal. */}
        <section className="pricing-seuil-doors-wrap">
          <div className="maison-container">
            <div className="pricing-seuil-doors">
              <Link
                href={`/${locale}/pricing/monde`}
                className="pricing-door pricing-door-monde"
                aria-label={`${c.doorMonde.title} · ${c.doorMonde.cta}`}
              >
                <p className="pricing-door-kicker">{t(c.doorMonde.kicker)}</p>
                <h2 className="pricing-door-title">{t(c.doorMonde.title)}</h2>
                <p className="pricing-door-lede">{t(c.doorMonde.lede)}</p>
                <p className="pricing-door-langs">{t(c.doorMonde.langs)}</p>
                <span className="pricing-door-cta">
                  {t(c.doorMonde.cta)} <span aria-hidden="true">→</span>
                </span>
              </Link>

              {/* Le Confluent · seule audace visuelle · signe l'articulation */}
              <div className="pricing-seuil-y" aria-hidden="true">
                <BrandY variant="mono" state="static" size={64} />
              </div>

              <Link
                href={`/${locale}/pricing/racines`}
                className="pricing-door pricing-door-racines"
                aria-label={`${c.doorRacines.title} · ${c.doorRacines.cta}`}
              >
                <p className="pricing-door-kicker">{t(c.doorRacines.kicker)}</p>
                <h2 className="pricing-door-title">{t(c.doorRacines.title)}</h2>
                <p className="pricing-door-lede">{t(c.doorRacines.lede)}</p>
                <p className="pricing-door-langs">{t(c.doorRacines.langs)}</p>
                <span className="pricing-door-cta">
                  {t(c.doorRacines.cta)} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter
        locale={locale}
        labels={loc === "en" ? FOOTER_EN : FOOTER_FR}
      />
    </div>
  );
}

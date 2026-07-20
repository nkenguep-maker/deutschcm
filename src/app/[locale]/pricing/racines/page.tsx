"use client";

// /pricing/racines · univers 2 · les langues africaines.
// Bloc 0 · L'entrée (gratuit, identique à /pricing/monde).
// Bloc 1 · Solo (une personne, une langue).
// Bloc 2 · Famille (2 adultes + 4 enfants max, profils nominatifs).
// Bloc 3 · Rappel discret · pack prof aussi disponible ici.
//
// Un seul rail visible à la fois. Aucune comparaison avec les langues
// du monde sur cette page — les prix des deux univers ne se
// rencontrent jamais.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import {
  PRICING_COPY,
  AFRICAN_SOLO,
  AFRICAN_FAMILY,
  detectDefaultRail,
  fmtPrice,
  type Rail,
} from "@/lib/pricing";

const FOOTER_FR = {
  tagline: "L'Afrique parle. Toutes ses langues, enfin un lieu.",
  made: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  legal: "Mentions légales",
  terms: "CGU",
  privacy: "Confidentialité",
  contact: "Contact",
  disclaimer: "YEMA Languages est une plateforme pan-africaine, indépendante pour les langues africaines. N'est affiliée à aucun organisme officiel d'examen.",
};
const FOOTER_EN = {
  tagline: "Africa speaks. All its languages, at last one place.",
  made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  legal: "Legal",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  disclaimer: "YEMA Languages is a pan-African platform, independent for African languages. Not affiliated with any official examination institute.",
};

export default function PricingRacinesPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRail(detectDefaultRail());
    return () => window.removeEventListener("resize", check);
  }, []);

  const railSymbol = rail === "fcfa" ? "FCFA" : "€";
  const solo = AFRICAN_SOLO[rail];
  const family = AFRICAN_FAMILY[rail];

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

      <main className="pricing-page pricing-universe pricing-universe-racines">
        <section className="pricing-universe-topbar">
          <div className="maison-container pricing-universe-topbar-inner">
            <Link href={`/${locale}/pricing`} className="pricing-universe-back">
              {t(c.back)}
            </Link>
            <div className="pricing-rail-tabs" role="tablist" aria-label={loc === "en" ? "Payment rail" : "Rail de paiement"}>
              <button
                type="button"
                role="tab"
                aria-selected={rail === "fcfa"}
                className={`pricing-rail-tab ${rail === "fcfa" ? "on" : ""}`}
                onClick={() => setRail("fcfa")}
              >
                {c.railFcfa}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rail === "eur"}
                className={`pricing-rail-tab ${rail === "eur" ? "on" : ""}`}
                onClick={() => setRail("eur")}
              >
                {c.railEur}
              </button>
            </div>
          </div>
        </section>

        <section className="pricing-choice-head" style={{ position: "relative" }}>
          <div className="pricing-universe-hero-brand" aria-hidden="true">
            <BrandY variant="sources" state="static" size={180} />
          </div>
          <div className="maison-container">
            <p className="maison-kicker">{t(c.doorRacines.kicker).toUpperCase()}</p>
            <h1 className="maison-h">{t(c.racinesTitle)}</h1>
            <p className="maison-lede">{t(c.racinesSub)}</p>
          </div>
        </section>

        {/* Bloc 0 · L'entrée (gratuit) — même bloc que /monde */}
        <section className="pricing-entry-free" aria-labelledby="entry-h">
          <div className="maison-container pricing-entry-free-inner">
            <div className="pricing-entry-free-body">
              <p className="maison-kicker">{t(c.entryKicker).toUpperCase()}</p>
              <h2 id="entry-h" className="pricing-entry-free-title">{t(c.entryTitle)}</h2>
              <p className="pricing-entry-free-sub">{t(c.entrySub)}</p>
              <ul className="pricing-entry-free-list">
                {c.entryFeatures.map((f) => <li key={f}>{t(f)}</li>)}
              </ul>
              <Link href={`/${locale}/register`} className="pricing-plan-cta ghost">
                {t(c.entryCta)}
              </Link>
            </div>
          </div>
        </section>

        {/* Deux offres côte à côte · Solo · Famille */}
        <section className="pricing-grid-section">
          <div className="maison-container">
            <div className="pricing-grid pricing-grid-2">
              <article className="pricing-plan" aria-labelledby="solo-h">
                <h3 id="solo-h" className="pricing-plan-name">{t(c.soloName)}</h3>
                <p className="pricing-plan-audience">{t(c.soloSub)}</p>
                <div className="pricing-plan-price">
                  <span className="pricing-plan-price-num">
                    {fmtPrice(solo.month, rail)} <span className="pricing-plan-price-symbol">{railSymbol}</span>
                  </span>
                  <span className="pricing-plan-price-unit">
                    {t(c.soloMonth)} · {t(c.soloOr)} {fmtPrice(solo.year, rail)} {railSymbol} {t(c.soloYear)}
                  </span>
                </div>
                <ul className="pricing-plan-features">
                  <li>{loc === "en" ? "One person, one language" : "Une personne, une langue"}</li>
                  <li>{loc === "en" ? "All African stories, songs, tales" : "Tous les contes, chansons, récits"}</li>
                  <li>{loc === "en" ? "Full YEMA scale access É1 → É5" : "Accès complet à l'échelle YEMA É1 → É5"}</li>
                  <li>{loc === "en" ? "Cancel any time" : "Résiliable à tout moment"}</li>
                </ul>
                <Link href={`/${locale}/register?plan=racines-solo`} className="pricing-plan-cta">
                  {t(c.soloCta)} →
                </Link>
              </article>

              <article className="pricing-plan pricing-plan-hero" aria-labelledby="family-h">
                <span className="pricing-plan-badge">{loc === "en" ? "For the whole home" : "Pour tout le foyer"}</span>
                <h3 id="family-h" className="pricing-plan-name">{t(c.familyName)}</h3>
                <p className="pricing-plan-audience">{t(c.familySub)}</p>
                <div className="pricing-plan-price">
                  <span className="pricing-plan-price-num">
                    {fmtPrice(family.month, rail)} <span className="pricing-plan-price-symbol">{railSymbol}</span>
                  </span>
                  <span className="pricing-plan-price-unit">
                    {t(c.familyMonth)} · {t(c.familyOr)} {fmtPrice(family.year, rail)} {railSymbol} {t(c.familyYear)}
                  </span>
                </div>
                <ul className="pricing-plan-features">
                  <li>{loc === "en" ? "Two adults, up to four children" : "Deux adultes, quatre enfants maximum"}</li>
                  <li>{loc === "en" ? "Each profile has its own progress" : "Un profil nominatif par personne"}</li>
                  <li>{loc === "en" ? "African stories, songs, games for kids" : "Contes, chansons, jeux pour enfants"}</li>
                  <li>{loc === "en" ? "Parent controls · screen limit" : "Contrôle parental · limite de temps d'écran"}</li>
                </ul>
                <Link href={`/${locale}/register?plan=racines-famille`} className="pricing-plan-cta hero">
                  {t(c.familyCta)} →
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* Rappel discret · pack prof aussi disponible ici */}
        <section className="pricing-prof-reminder">
          <div className="maison-container">
            <div className="pricing-prof-reminder-inner">
              <p className="maison-kicker">{t(c.profReminderTitle).toUpperCase()}</p>
              <p className="pricing-prof-reminder-sub">{t(c.profReminderSub)}</p>
              <Link href={`/${locale}/pricing/monde#teacher-h`} className="pricing-prof-reminder-cta">
                {t(c.profReminderCta)} →
              </Link>
            </div>
          </div>
        </section>

        <section className="pricing-footer-band">
          <div className="maison-container pricing-footer-band-inner">
            <p className="pricing-footer-band-line">{t(c.foundersLine)}</p>
            <p className="pricing-footer-band-sep">·</p>
            <p className="pricing-footer-band-line">{t(c.guaranteeLine)}</p>
            <p className="pricing-footer-band-sep">·</p>
            <p className="pricing-footer-band-line">
              {rail === "fcfa" ? t(c.railNoteFcfa) : t(c.railNoteEur)}
            </p>
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

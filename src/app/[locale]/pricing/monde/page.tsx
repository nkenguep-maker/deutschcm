"use client";

// /pricing/monde · univers 1 · Le voyage.
// Composition asymétrique · 3 formes différentes délibérément :
//   1. Niveaux · rangée de puces mono compactes
//   2. Le Passage · carte éditoriale hero
//   3. Le prof · encadré pointillé indenté, distinct visuellement
// Un seul rail visible. IntersectionObserver reveal sur la carte Passage.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import {
  PRICING_COPY,
  LEVELS,
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  detectDefaultRail,
  fmtPrice,
  type LevelId,
  type Rail,
} from "@/lib/pricing";

const FOOTER_FR = {
  tagline: "L’Afrique parle. Toutes ses langues, enfin un lieu.",
  made: "L’Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  legal: "Mentions légales", terms: "CGU", privacy: "Confidentialité", contact: "Contact",
  disclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde. N’est affiliée à aucun organisme officiel d’examen.",
};
const FOOTER_EN = {
  tagline: "Africa speaks. All its languages, at last one place.",
  made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  legal: "Legal", terms: "Terms", privacy: "Privacy", contact: "Contact",
  disclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages. Not affiliated with any official examination institute.",
};

export default function PricingMondePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");
  const [level, setLevel] = useState<LevelId>("B1");
  const [passageInView, setPassageInView] = useState(false);
  const passageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRail(detectDefaultRail());
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reveal · unique, à l'entrée dans le viewport.
  useEffect(() => {
    if (!passageRef.current) return;
    const el = passageRef.current;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setPassageInView(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const passagePrice = WORLD_PASSAGE_PRICES[level][rail];
  const teacherPrice = WORLD_TEACHER_ADD[level][rail];
  const railSymbol = rail === "fcfa" ? "FCFA" : "€";

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

      <main className="pricing-page pricing-universe pricing-universe-monde">
        {/* Topbar · retour + toggle rail */}
        <section className="pricing-universe-topbar">
          <div className="maison-container pricing-universe-topbar-inner">
            <Link href={`/${locale}/pricing`} className="pricing-universe-back">
              {t(c.back)}
            </Link>
            <div className="pricing-rail-tabs" role="tablist" aria-label={loc === "en" ? "Payment rail" : "Rail de paiement"}>
              <button type="button" role="tab" aria-selected={rail === "fcfa"}
                className={`pricing-rail-tab ${rail === "fcfa" ? "on" : ""}`}
                onClick={() => setRail("fcfa")}>{c.railFcfa}</button>
              <button type="button" role="tab" aria-selected={rail === "eur"}
                className={`pricing-rail-tab ${rail === "eur" ? "on" : ""}`}
                onClick={() => setRail("eur")}>{c.railEur}</button>
            </div>
          </div>
        </section>

        {/* Hero · asymétrique · BrandY en filigrane haut-droite */}
        <section className="pricing-universe-hero">
          <div className="pricing-universe-hero-brand" aria-hidden="true">
            <BrandY variant="world" state="static" size={220} />
          </div>
          <div className="maison-container pricing-universe-hero-grid">
            <div className="pricing-universe-hero-body">
              <p className="pricing-seuil-kicker">{t(c.mondeKicker).toUpperCase()}</p>
              <h1 className="pricing-universe-h">{t(c.mondeTitle)}</h1>
              <p className="pricing-universe-sub">{t(c.mondeSub)}</p>
            </div>
          </div>
        </section>

        {/* L'entrée · une vraie leçon */}
        <section className="pricing-entry" aria-labelledby="entry-h">
          <div className="maison-container pricing-entry-grid">
            <div className="pricing-entry-side">
              <p className="pricing-seuil-kicker">{t(c.entryKicker).toUpperCase()}</p>
              <h2 id="entry-h" className="pricing-entry-h">{t(c.entryTitle)}</h2>
              <p className="pricing-entry-sub">{t(c.entrySub)}</p>
            </div>
            <div className="pricing-entry-body">
              <ul className="pricing-entry-list">
                {c.entryFeatures.map((f) => <li key={f}>{t(f)}</li>)}
              </ul>
              <Link href={`/${locale}/register`} className="pricing-cta pricing-cta-ghost">
                {t(c.entryCta)} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* LE PASSAGE · trois formes différentes (puces / carte / encadré) */}
        <section ref={passageRef} className={`pricing-passage ${passageInView ? "in-view" : ""}`} aria-labelledby="passage-h">
          <div className="maison-container pricing-passage-grid">
            {/* Colonne 1 · éditoriale · kicker + titre + intro */}
            <div className="pricing-passage-intro">
              <p className="pricing-seuil-kicker">{t(c.passageStepLabel).toUpperCase()}</p>
              <h2 id="passage-h" className="pricing-passage-h">{t(c.passageIntro)}</h2>

              {/* Forme 1 · rangée de puces niveaux · mono, compact */}
              <div className="pricing-levels" role="tablist" aria-label={t("Niveaux CECRL")}>
                {LEVELS.map((lvl) => {
                  const active = lvl === level;
                  return (
                    <button key={lvl} type="button" role="tab" aria-selected={active}
                      className={`pricing-level ${active ? "on" : ""}`}
                      onClick={() => setLevel(lvl)}>
                      <span className="pricing-level-code">{lvl}</span>
                      <span className="pricing-level-price">
                        <span className="pricing-level-price-val">{fmtPrice(WORLD_PASSAGE_PRICES[lvl][rail], rail)}</span>
                        <span className="pricing-level-price-cur">{railSymbol}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colonne 2 · Forme 2 · carte Passage (éditoriale, laiton) */}
            <article className="pricing-passage-card" aria-labelledby="passage-card-h">
              <div className="pricing-passage-card-head">
                <span className="pricing-passage-card-badge">{level}</span>
                <h3 id="passage-card-h" className="pricing-passage-card-h">{t(c.passageStepLabel)}</h3>
              </div>
              <div className="pricing-passage-card-price">
                <span className="pricing-price-num">{fmtPrice(passagePrice, rail)}</span>
                <span className="pricing-price-cur">{railSymbol}</span>
                <span className="pricing-price-per">{t(c.passagePer)}</span>
              </div>
              <ul className="pricing-passage-card-list">
                {c.passageIncludes.map((f) => <li key={f}>{t(f)}</li>)}
              </ul>
              <Link href={`/${locale}/register?plan=passage-${level.toLowerCase()}`} className="pricing-cta pricing-cta-primary">
                {t(c.passageCta(level))} <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>

          {/* Forme 3 · encadré prof · pointillé, indenté, badge fort */}
          <div className="maison-container pricing-teacher-wrap">
            <div className="pricing-teacher-hinge" aria-hidden="true">
              <span className="pricing-teacher-plus">+</span>
            </div>
            <aside className="pricing-teacher" aria-labelledby="teacher-h">
              <span className="pricing-teacher-badge">{t(c.teacherBadge).toUpperCase()}</span>
              <h3 id="teacher-h" className="pricing-teacher-h">{t(c.teacherStepLabel)}</h3>
              <p className="pricing-teacher-lede">{t(c.teacherLede)}</p>
              <ul className="pricing-teacher-list">
                {c.teacherIncludes.map((f) => <li key={f}>{t(f)}</li>)}
              </ul>
              <div className="pricing-teacher-price">
                <span className="pricing-price-sign">+</span>
                <span className="pricing-price-num">{fmtPrice(teacherPrice, rail)}</span>
                <span className="pricing-price-cur">{railSymbol}</span>
                <span className="pricing-price-per">{t(c.teacherPer)} · {level}</span>
              </div>
              <Link href={`/${locale}/register?plan=passage-${level.toLowerCase()}&prof=1`} className="pricing-cta pricing-cta-ghost">
                {t(c.teacherCta)} <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </div>
        </section>

        {/* Réassurance · 4 lignes sobres, jamais une FAQ */}
        <section className="pricing-trust">
          <div className="maison-container pricing-trust-grid">
            {c.trust.map((line) => <p key={line} className="pricing-trust-line">{t(line)}</p>)}
          </div>
          <div className="maison-container">
            <p className="pricing-founders">{t(c.foundersLine)}</p>
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

"use client";

// /pricing/monde · univers 1 · les langues du monde.
// Bloc 1 · L'entrée (gratuit).
// Bloc 2 · Le Passage (5 niveaux A1→C1, par niveau, autonomie).
// Bloc 3 · Pack professeur en SUPPLÉMENT (jamais un produit parallèle).
//
// Un seul rail visible à la fois · toggle discret FCFA/€ en haut-droite,
// détection auto au mount (Africa/* → FCFA, sinon EUR).
// Rien de mixte avec /pricing/racines — les prix des deux univers ne
// se rencontrent jamais sur le même écran.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
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
  tagline: "L'Afrique parle. Toutes ses langues, enfin un lieu.",
  made: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  legal: "Mentions légales",
  terms: "CGU",
  privacy: "Confidentialité",
  contact: "Contact",
  disclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde. N'est affiliée à aucun organisme officiel d'examen.",
};
const FOOTER_EN = {
  tagline: "Africa speaks. All its languages, at last one place.",
  made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  legal: "Legal",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  disclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages. Not affiliated with any official examination institute.",
};

export default function PricingMondePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");
  const [selectedLevel, setSelectedLevel] = useState<LevelId>("B1");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRail(detectDefaultRail());
    return () => window.removeEventListener("resize", check);
  }, []);

  const passagePrice = WORLD_PASSAGE_PRICES[selectedLevel][rail];
  const teacherPrice = WORLD_TEACHER_ADD[selectedLevel][rail];
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
        {/* Retour au choix + toggle rail */}
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

        {/* En-tête univers */}
        <section className="pricing-choice-head">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.doorMonde.kicker).toUpperCase()}</p>
            <h1 className="maison-h">{t(c.mondeTitle)}</h1>
            <p className="maison-lede">{t(c.mondeSub)}</p>
          </div>
        </section>

        {/* Bloc 0 · L'entrée (gratuit) */}
        <section className="pricing-entry-free" aria-labelledby="entry-h">
          <div className="maison-container pricing-entry-free-inner">
            <div className="pricing-entry-free-body">
              <p className="maison-kicker">{t(c.entryKicker).toUpperCase()}</p>
              <h2 id="entry-h" className="pricing-entry-free-title">
                {t(c.entryTitle)}
              </h2>
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

        {/* Bloc 1 · Le Passage · sélecteur de niveau + carte prix */}
        <section className="pricing-step" aria-labelledby="passage-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.passageKicker).toUpperCase()}</p>
            <h2 id="passage-h" className="pricing-step-h">{t(c.passageTitle)}</h2>
            <p className="pricing-step-sub">{t(c.passageSub)}</p>

            <div className="pricing-level-grid" role="tablist" aria-label={c.passageLevel}>
              {LEVELS.map((lvl) => {
                const active = lvl === selectedLevel;
                const price = WORLD_PASSAGE_PRICES[lvl][rail];
                return (
                  <button
                    key={lvl}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`pricing-level ${active ? "on" : ""}`}
                    onClick={() => setSelectedLevel(lvl)}
                  >
                    <span className="pricing-level-code">{lvl}</span>
                    <span className="pricing-level-price">
                      {fmtPrice(price, rail)} <span className="pricing-level-price-unit">{railSymbol}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <article className="pricing-plan pricing-plan-hero pricing-passage-card" aria-live="polite">
              <span className="pricing-plan-badge">{t(c.passagePrice(selectedLevel))}</span>
              <h3 className="pricing-plan-name">
                {t(c.passageTitle)}
              </h3>
              <p className="pricing-plan-audience">{t(c.passageSub)}</p>
              <div className="pricing-plan-price">
                <span className="pricing-plan-price-num">
                  {fmtPrice(passagePrice, rail)} <span className="pricing-plan-price-symbol">{railSymbol}</span>
                </span>
                <span className="pricing-plan-price-unit">{t(c.passagePer)}</span>
              </div>
              <Link href={`/${locale}/register?plan=passage-${selectedLevel.toLowerCase()}`} className="pricing-plan-cta hero">
                {t(c.passageCta)} →
              </Link>
            </article>

            {/* + visuel gros et clair entre les deux étapes */}
            <div className="pricing-step-plus" aria-hidden="true">+</div>

            {/* Bloc 2 · Pack prof · SUPPLÉMENT (bordure pointillée) */}
            <p className="maison-kicker pricing-teacher-kicker">{t(c.teacherKicker).toUpperCase()}</p>
            <p className="pricing-teacher-lede">{t(c.teacherLede)}</p>

            <article className="pricing-teacher-supplement" aria-labelledby="teacher-h">
              <span className="pricing-teacher-badge">{t(c.teacherBadge)}</span>
              <h3 id="teacher-h" className="pricing-plan-name">{t(c.teacherTitle)}</h3>
              <p className="pricing-plan-audience">{t(c.teacherSub)}</p>
              <div className="pricing-plan-price">
                <span className="pricing-plan-price-num pricing-teacher-add">
                  +{fmtPrice(teacherPrice, rail)} <span className="pricing-plan-price-symbol">{railSymbol}</span>
                </span>
                <span className="pricing-plan-price-unit">
                  {t(c.teacherAdd)} · {selectedLevel}
                </span>
              </div>
              <Link href={`/${locale}/register?plan=passage-${selectedLevel.toLowerCase()}&prof=1`} className="pricing-plan-cta">
                {t(c.teacherCta)} →
              </Link>
            </article>
          </div>
        </section>

        {/* Bas de page · mentions transverses */}
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

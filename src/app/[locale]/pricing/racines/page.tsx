"use client";

// /pricing/racines · univers 2 · Les racines.
// Fond terre effectif · Solo · Famille (2 offres uniquement).
// Périodicité par défaut adaptée au rail · mensuel FCFA, annuel EUR.
// L'autre reste visible d'un tap. Zéro comparaison avec /monde.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import {
  PRICING_COPY,
  AFRICAN_SOLO,
  AFRICAN_FAMILY,
  detectDefaultRail,
  defaultPeriodFor,
  fmtPrice,
  type Rail,
  type Period,
} from "@/lib/pricing";

const FOOTER_FR = {
  tagline: "L’Afrique parle. Toutes ses langues, enfin un lieu.",
  made: "L’Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  legal: "Mentions légales", terms: "CGU", privacy: "Confidentialité", contact: "Contact",
  disclaimer: "YEMA Languages est une plateforme pan-africaine, indépendante pour les langues africaines. N’est affiliée à aucun organisme officiel d’examen.",
};
const FOOTER_EN = {
  tagline: "Africa speaks. All its languages, at last one place.",
  made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  legal: "Legal", terms: "Terms", privacy: "Privacy", contact: "Contact",
  disclaimer: "YEMA Languages is a pan-African platform, independent for African languages. Not affiliated with any official examination institute.",
};

export default function PricingRacinesPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");
  const [period, setPeriod] = useState<Period>("year");
  const [pricesInView, setPricesInView] = useState(false);
  const pricesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    const detected = detectDefaultRail();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRail(detected);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPeriod(defaultPeriodFor(detected));
    return () => window.removeEventListener("resize", check);
  }, []);

  // Quand le rail change, la périodicité par défaut suit (sauf si
  // l'utilisateur a déjà choisi manuellement — on garde son choix).
  const switchRail = (next: Rail) => {
    setRail(next);
    setPeriod(defaultPeriodFor(next));
  };

  useEffect(() => {
    if (!pricesRef.current) return;
    const el = pricesRef.current;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setPricesInView(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const railSymbol = rail === "fcfa" ? "FCFA" : "€";
  const solo = AFRICAN_SOLO[rail][period];
  const family = AFRICAN_FAMILY[rail][period];
  const perLabel = period === "month" ? c.railPeriodMonthShort : c.railPeriodYearShort;
  const otherPeriod: Period = period === "month" ? "year" : "month";
  const otherPerLabel = otherPeriod === "month" ? c.railPeriodMonth : c.railPeriodYear;

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
              <button type="button" role="tab" aria-selected={rail === "fcfa"}
                className={`pricing-rail-tab ${rail === "fcfa" ? "on" : ""}`}
                onClick={() => switchRail("fcfa")}>{c.railFcfa}</button>
              <button type="button" role="tab" aria-selected={rail === "eur"}
                className={`pricing-rail-tab ${rail === "eur" ? "on" : ""}`}
                onClick={() => switchRail("eur")}>{c.railEur}</button>
            </div>
          </div>
        </section>

        <section className="pricing-universe-hero">
          <div className="pricing-universe-hero-brand" aria-hidden="true">
            <BrandY variant="sources" state="static" size={220} />
          </div>
          <div className="maison-container pricing-universe-hero-grid">
            <div className="pricing-universe-hero-body">
              <p className="pricing-seuil-kicker">{t(c.racinesKicker).toUpperCase()}</p>
              <h1 className="pricing-universe-h">
                {t(c.racinesTitle)} <em>{t(c.racinesTitleEm)}</em>
              </h1>
              <p className="pricing-universe-sub">{t(c.racinesSub)}</p>
            </div>
          </div>
        </section>

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

        {/* Toggle périodicité + deux offres */}
        <section ref={pricesRef} className={`pricing-racines-offers ${pricesInView ? "in-view" : ""}`}>
          <div className="maison-container">
            <div className="pricing-period-toggle" role="tablist" aria-label={loc === "en" ? "Billing period" : "Périodicité"}>
              <button type="button" role="tab" aria-selected={period === "month"}
                className={`pricing-period-tab ${period === "month" ? "on" : ""}`}
                onClick={() => setPeriod("month")}>{c.railPeriodMonth}</button>
              <button type="button" role="tab" aria-selected={period === "year"}
                className={`pricing-period-tab ${period === "year" ? "on" : ""}`}
                onClick={() => setPeriod("year")}>{c.railPeriodYear}</button>
            </div>

            <div className="pricing-racines-grid">
              <article className="pricing-offer pricing-offer-solo" aria-labelledby="solo-h">
                <h3 id="solo-h" className="pricing-offer-h">{t(c.soloName)}</h3>
                <p className="pricing-offer-lede">{t(c.soloLede)}</p>
                <div className="pricing-offer-price">
                  <span className="pricing-price-num">{fmtPrice(solo, rail)}</span>
                  <span className="pricing-price-cur">{railSymbol}</span>
                  <span className="pricing-price-per">{t(perLabel)}</span>
                </div>
                <p className="pricing-offer-alt">
                  {loc === "en" ? "or " : "ou "}
                  <button type="button" className="pricing-offer-alt-btn"
                    onClick={() => setPeriod(otherPeriod)}>
                    {fmtPrice(AFRICAN_SOLO[rail][otherPeriod], rail)} {railSymbol} {t(otherPerLabel).toLowerCase()}
                  </button>
                </p>
                <ul className="pricing-offer-list">
                  {c.soloIncludes.map((f) => <li key={f}>{t(f)}</li>)}
                </ul>
                <Link href={`/${locale}/register?plan=racines-solo`} className="pricing-cta pricing-cta-ghost">
                  {t(c.soloCta)} <span aria-hidden="true">→</span>
                </Link>
              </article>

              <article className="pricing-offer pricing-offer-family" aria-labelledby="family-h">
                <span className="pricing-offer-badge">{t(c.familyBadge).toUpperCase()}</span>
                <h3 id="family-h" className="pricing-offer-h">{t(c.familyName)}</h3>
                <p className="pricing-offer-lede">{t(c.familyLede)}</p>
                <div className="pricing-offer-price">
                  <span className="pricing-price-num">{fmtPrice(family, rail)}</span>
                  <span className="pricing-price-cur">{railSymbol}</span>
                  <span className="pricing-price-per">{t(perLabel)}</span>
                </div>
                <p className="pricing-offer-alt">
                  {loc === "en" ? "or " : "ou "}
                  <button type="button" className="pricing-offer-alt-btn"
                    onClick={() => setPeriod(otherPeriod)}>
                    {fmtPrice(AFRICAN_FAMILY[rail][otherPeriod], rail)} {railSymbol} {t(otherPerLabel).toLowerCase()}
                  </button>
                </p>
                <ul className="pricing-offer-list">
                  {c.familyIncludes.map((f) => <li key={f}>{t(f)}</li>)}
                </ul>
                <Link href={`/${locale}/register?plan=racines-famille`} className="pricing-cta pricing-cta-primary">
                  {t(c.familyCta)} <span aria-hidden="true">→</span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* Rappel prof · sobre, lien vers /monde */}
        <section className="pricing-prof-reminder">
          <div className="maison-container">
            <div className="pricing-prof-reminder-inner">
              <h3 className="pricing-prof-reminder-h">{t(c.profReminderTitle)}</h3>
              <p className="pricing-prof-reminder-sub">{t(c.profReminderSub)}</p>
              <Link href={`/${locale}/pricing/monde#teacher-h`} className="pricing-prof-reminder-cta">
                {t(c.profReminderCta)} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

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

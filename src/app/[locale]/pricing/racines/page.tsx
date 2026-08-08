"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";
import {
  AFRICAN_FAMILY,
  AFRICAN_SOLO,
  PRICING_COPY,
  RACINES_COACH_ADDON,
  detectDefaultRail,
  defaultPeriodFor,
  fmtPriceUnit,
  type Period,
  type Rail,
} from "@/lib/pricing";

const FOOTER_FR = { tagline: "L’Afrique parle. Toutes ses langues, enfin un lieu.", made: "L’Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.", legal: "Mentions légales", terms: "CGU", privacy: "Confidentialité", contact: "Contact", disclaimer: "YEMA Languages est une plateforme pan-africaine indépendante pour les langues africaines. N’est affiliée à aucun organisme officiel d’examen." };
const FOOTER_EN = { tagline: "Africa speaks. All its languages, at last one place.", made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.", legal: "Legal", terms: "Terms", privacy: "Privacy", contact: "Contact", disclaimer: "YEMA Languages is an independent pan-African platform for African languages. Not affiliated with any official examination institute." };

export default function PricingRacinesPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => loc === "fr" ? frTypo(s) : s;
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");
  const [period, setPeriod] = useState<Period>("year");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    const r = detectDefaultRail();
    setRail(r);
    setPeriod(defaultPeriodFor(r));
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const periodLabel = period === "month" ? c.railPeriodMonthShort : c.railPeriodYearShort;

  const Offer = ({ family = false }: { family?: boolean }) => {
    const offer = family ? AFRICAN_FAMILY : AFRICAN_SOLO;
    const name = family ? c.familyName : c.soloName;
    const lede = family ? c.familyLede : c.soloLede;
    const features = family ? c.familyIncludes : c.soloIncludes;
    const plan = family ? "racines-famille" : "racines-solo";
    return (
      <article className={`pricing-offer ${family ? "pricing-offer-family" : "pricing-offer-solo"}`}>
        {family ? <span className="pricing-offer-badge">{t(c.familyBadge).toUpperCase()}</span> : null}
        <h2 className="pricing-offer-h">{t(name)}</h2>
        <p className="pricing-offer-lede">{t(lede)}</p>
        <div className="pricing-offer-price">
          <span className="pricing-price-num">{fmtPriceUnit(offer[rail][period], rail)}</span>
          <span className="pricing-price-per">{t(periodLabel)}</span>
        </div>
        <ul className="pricing-offer-list">{features.map((f) => <li key={f}>{t(f)}</li>)}</ul>
        <Link href={`/${locale}/register?universe=racines&plan=${plan}`} className={`pricing-cta ${family ? "pricing-cta-primary" : "pricing-cta-ghost"}`}>
          {family ? t(c.familyCta) : t(c.soloCta)} <span aria-hidden="true">→</span>
        </Link>
      </article>
    );
  };

  return (
    <div className="landing">
      <LandingNav locale={locale} isMobile={isMobile} labels={{ features: loc === "en" ? "Languages" : "Langues", levels: loc === "en" ? "Method" : "Méthode", centers: loc === "en" ? "Centers" : "Centres", login: loc === "en" ? "Log in" : "Se connecter", register: loc === "en" ? "Start" : "Commencer" }} />
      <main className="pricing-page pricing-universe pricing-universe-racines">
        <section className="pricing-universe-topbar">
          <div className="maison-container pricing-universe-topbar-inner">
            <Link href={`/${locale}/pricing`} className="pricing-universe-back">{t(c.back)}</Link>
            <div className="pricing-rail-tabs" role="tablist" aria-label={loc === "fr" ? "Devise" : "Currency"}>
              <button type="button" role="tab" aria-selected={rail === "fcfa"} className={`pricing-rail-tab ${rail === "fcfa" ? "on" : ""}`} onClick={() => { setRail("fcfa"); setPeriod(defaultPeriodFor("fcfa")); }}>FCFA</button>
              <button type="button" role="tab" aria-selected={rail === "eur"} className={`pricing-rail-tab ${rail === "eur" ? "on" : ""}`} onClick={() => { setRail("eur"); setPeriod(defaultPeriodFor("eur")); }}>€</button>
            </div>
          </div>
        </section>

        <section className="pricing-universe-hero">
          <div className="maison-container pricing-universe-hero-grid">
            <div className="pricing-universe-hero-body">
              <p className="pricing-seuil-kicker">{t(c.racinesKicker).toUpperCase()}</p>
              <h1 className="pricing-universe-h">{t(c.racinesTitle)} <em>{t(c.racinesTitleEm)}</em></h1>
              <p className="pricing-universe-sub">{t(c.racinesSub)}</p>
            </div>
          </div>
        </section>

        <section className="pricing-racines-offers">
          <div className="maison-container">
            <div className="pricing-period-toggle" role="tablist" aria-label={loc === "fr" ? "Périodicité" : "Billing period"}>
              <button type="button" role="tab" aria-selected={period === "month"} className={`pricing-period-tab ${period === "month" ? "on" : ""}`} onClick={() => setPeriod("month")}>{c.railPeriodMonth}</button>
              <button type="button" role="tab" aria-selected={period === "year"} className={`pricing-period-tab ${period === "year" ? "on" : ""}`} onClick={() => setPeriod("year")}>{c.railPeriodYear}</button>
            </div>
            <div className="pricing-racines-grid"><Offer /><Offer family /></div>
          </div>
        </section>

        <section className="pricing-prof-reminder">
          <div className="maison-container">
            <div className="pricing-prof-reminder-inner">
              <p className="pricing-eyebrow">{loc === "fr" ? "ACCOMPAGNEMENT HUMAIN" : "HUMAN SUPPORT"}</p>
              <h3 className="pricing-prof-reminder-h">{loc === "fr" ? "Coach de langue Racines" : "Racines language coach"}</h3>
              <div className="pricing-offer-price">
                <span className="pricing-price-num">{fmtPriceUnit(RACINES_COACH_ADDON[rail], rail)}</span>
                <span className="pricing-price-per">{loc === "fr" ? "/ mois · par personne" : "/ month · per person"}</span>
              </div>
              <p className="pricing-prof-reminder-sub">
                {loc === "fr"
                  ? "Corrections humaines et accompagnement individuel. Vous pouvez enregistrer votre intérêt dès maintenant ; aucun paiement n’est déclenché avant l’activation des moyens de paiement."
                  : "Human corrections and individual support. You can record your interest now; no payment is triggered before payment methods are activated."}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Link href={`/${locale}/register?universe=racines&plan=racines-solo&addon=roots-coach`} className="pricing-cta pricing-cta-ghost">
                  {loc === "fr" ? "Solo + coach" : "Solo + coach"} <span aria-hidden="true">→</span>
                </Link>
                <Link href={`/${locale}/register?universe=racines&plan=racines-famille&addon=roots-coach`} className="pricing-cta pricing-cta-primary">
                  {loc === "fr" ? "Famille + coach" : "Family + coach"} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="pricing-trust">
          <div className="maison-container">
            <p className="pricing-founders">
              {loc === "fr"
                ? "Votre choix d’offre est conservé à l’inscription. Aucun paiement n’est déclenché aujourd’hui ; les moyens de paiement seront connectés ultérieurement."
                : "Your offer choice is carried into registration. No payment is triggered today; payment methods will be connected later."}
            </p>
          </div>
        </section>
      </main>
      <LandingFooter locale={locale} labels={loc === "en" ? FOOTER_EN : FOOTER_FR} />
    </div>
  );
}

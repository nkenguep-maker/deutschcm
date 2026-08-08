"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";
import { LEVELS, PRICING_COPY, WORLD_PASSAGE_PRICES, WORLD_TEACHER_ADD, detectDefaultRail, fmtPriceUnit, type LevelId, type Rail } from "@/lib/pricing";

const FOOTER_FR = { tagline: "L’Afrique parle. Toutes ses langues, enfin un lieu.", made: "L’Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.", legal: "Mentions légales", terms: "CGU", privacy: "Confidentialité", contact: "Contact", disclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde. N’est affiliée à aucun organisme officiel d’examen." };
const FOOTER_EN = { tagline: "Africa speaks. All its languages, at last one place.", made: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.", legal: "Legal", terms: "Terms", privacy: "Privacy", contact: "Contact", disclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages. Not affiliated with any official examination institute." };

export default function PricingMondePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = PRICING_COPY[loc];
  const t = (s: string) => loc === "fr" ? frTypo(s) : s;
  const [isMobile, setIsMobile] = useState(false);
  const [rail, setRail] = useState<Rail>("eur");
  const [level, setLevel] = useState<LevelId>("B1");
  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); setRail(detectDefaultRail()); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []);

  return <div className="landing">
    <LandingNav locale={locale} isMobile={isMobile} labels={{ features: loc === "en" ? "Languages" : "Langues", levels: loc === "en" ? "Method" : "Méthode", centers: loc === "en" ? "Centers" : "Centres", login: loc === "en" ? "Log in" : "Se connecter", register: loc === "en" ? "Start" : "Commencer" }} />
    <main className="pricing-page pricing-universe pricing-universe-monde">
      <section className="pricing-universe-topbar"><div className="maison-container pricing-universe-topbar-inner"><Link href={`/${locale}/pricing`} className="pricing-universe-back">{t(c.back)}</Link><div className="pricing-rail-tabs" role="tablist" aria-label={loc === "fr" ? "Devise" : "Currency"}><button type="button" role="tab" aria-selected={rail === "fcfa"} className={`pricing-rail-tab ${rail === "fcfa" ? "on" : ""}`} onClick={() => setRail("fcfa")}>FCFA</button><button type="button" role="tab" aria-selected={rail === "eur"} className={`pricing-rail-tab ${rail === "eur" ? "on" : ""}`} onClick={() => setRail("eur")}>€</button></div></div></section>
      <section className="pricing-universe-hero"><div className="maison-container pricing-universe-hero-grid"><div className="pricing-universe-hero-body"><p className="pricing-seuil-kicker">{t(c.mondeKicker).toUpperCase()}</p><h1 className="pricing-universe-h">{t(c.mondeTitle)}</h1><p className="pricing-universe-sub">{t(c.mondeSub)}</p></div></div></section>
      <section className="pricing-passage"><div className="maison-container pricing-passage-grid"><div className="pricing-passage-intro"><p className="pricing-seuil-kicker">{t(c.passageStepLabel).toUpperCase()}</p><h2 className="pricing-passage-h">{t(c.passageIntro)}</h2><div className="pricing-levels" role="tablist" aria-label={loc === "fr" ? "Niveaux CECRL" : "CEFR levels"}>{LEVELS.map(lvl => <button key={lvl} type="button" role="tab" aria-selected={level === lvl} className={`pricing-level ${level === lvl ? "on" : ""}`} onClick={() => setLevel(lvl)}><span className="pricing-level-code">{lvl}</span><span className="pricing-level-price">{fmtPriceUnit(WORLD_PASSAGE_PRICES[lvl][rail], rail)}</span></button>)}</div></div><article className="pricing-passage-card"><div className="pricing-passage-card-head"><span className="pricing-passage-card-badge">{level}</span><h3 className="pricing-passage-card-h">{t(c.passageStepLabel)}</h3></div><div className="pricing-passage-card-price"><span className="pricing-price-num">{fmtPriceUnit(WORLD_PASSAGE_PRICES[level][rail], rail)}</span><span className="pricing-price-per">{t(c.passagePer)}</span></div><ul className="pricing-passage-card-list">{c.passageIncludes.map(f => <li key={f}>{t(f)}</li>)}</ul><Link href={`/${locale}/register?universe=monde&plan=passage-${level.toLowerCase()}`} className="pricing-cta pricing-cta-primary">{loc === "fr" ? `Choisir ${level}` : `Choose ${level}`} <span aria-hidden="true">→</span></Link></article></div>
      <div className="maison-container pricing-teacher-wrap"><aside className="pricing-teacher"><span className="pricing-teacher-badge">{t(c.teacherBadge).toUpperCase()}</span><h3 className="pricing-teacher-h">{t(c.teacherStepLabel)}</h3><p className="pricing-teacher-lede">{t(c.teacherLede)}</p><ul className="pricing-teacher-list">{c.teacherIncludes.map(f => <li key={f}>{t(f)}</li>)}</ul><div className="pricing-teacher-price"><span className="pricing-price-sign">+</span><span className="pricing-price-num">{fmtPriceUnit(WORLD_TEACHER_ADD[level][rail], rail)}</span><span className="pricing-price-per">{t(c.teacherPer)}</span></div><Link href={`/${locale}/register?universe=monde&plan=passage-${level.toLowerCase()}&prof=1`} className="pricing-cta pricing-cta-ghost">{t(c.teacherCta)} <span aria-hidden="true">→</span></Link></aside></div></section>
      <section className="pricing-trust"><div className="maison-container"><p className="pricing-founders">{loc === "fr" ? "Votre choix d’offre est conservé à l’inscription. Le paiement en ligne sera activé séparément ; aucun débit n’est effectué aujourd’hui." : "Your offer choice is carried into registration. Online payment will be activated separately; no charge is made today."}</p></div></section>
    </main>
    <LandingFooter locale={locale} labels={loc === "en" ? FOOTER_EN : FOOTER_FR} />
  </div>;
}

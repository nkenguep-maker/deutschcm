"use client";

// /pricing · REFONTE COMPLÈTE — « le niveau s'achète, la maison s'habite ».
//
// Quatre produits, rôles distincts (anti-cannibalisation) :
//   · L'entrée      · 0                       · goûter la maison
//   · La Braise     · 4900 FCFA · 9,90 €/mois · habiter, entretenir
//   · Le Passage    · 49k FCFA · 89 €/niveau  · un niveau étranger
//                                               complet, Braise 4 mois incluse
//   · La Grande Maison · 149k FCFA · 249 €/an · tous les niveaux
//   · La Famille    · EUR only 99 €/an        · foyer entier (cap Transmettre)
//
// Un seul rail visible à la fois, détection locale/Accept-Language.
// Sélecteur de cap → 3 cartes maxi (jamais 4), héros par cap × rail.
// Zéro « Klaus » (coach vocal non présent au lancement).
// Zéro nom d'organisme d'examen officiel.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";

type Rail = "fcfa" | "eur";
type Cap = "franchir" | "grandir" | "transmettre" | "moi";
type ProductId = "entree" | "braise" | "passage" | "grande" | "famille";

interface Product {
  id: ProductId;
  name: string;
  audience: string;
  price: string;
  priceUnit: string;
  features: readonly string[];
  cta: string;
  href: string;
  ghost?: boolean;
}

// ─── PRODUITS · RAIL FCFA ────────────────────────────────────────
const PRODUITS_FCFA_FR: Record<ProductId, Product> = {
  entree: {
    id: "entree", name: "L'entrée", audience: "Pour goûter la maison.",
    price: "0", priceUnit: "FCFA",
    features: [
      "La première leçon complète (langue au choix)",
      "Un récit de la Veillée, avec ses mots",
      "La cérémonie de fin de leçon",
    ],
    cta: "Commencer gratuitement", href: "/register", ghost: true,
  },
  braise: {
    id: "braise", name: "La Braise", audience: "Habiter la maison, entretenir le feu.",
    price: "4 900", priceUnit: "FCFA / mois",
    features: [
      "La Veillée complète — toutes les voix",
      "Toutes les langues natales · É1 → É5",
      "Révisions des niveaux déjà acquis",
      "Pratique quotidienne, écrit relu",
    ],
    cta: "Entretenir ma braise", href: "/register?plan=braise",
  },
  passage: {
    id: "passage", name: "Le Passage", audience: "Un niveau complet, pour un projet précis.",
    price: "49 000", priceUnit: "FCFA / niveau · 4 mois",
    features: [
      "Une langue étrangère · niveau entier",
      "Examens blancs corrigés",
      "Votre écrit relu et expliqué",
      "Attestation de fin de niveau",
      "La Braise incluse pendant les 4 mois",
    ],
    cta: "Prendre mon Passage", href: "/register?plan=passage",
  },
  grande: {
    id: "grande", name: "La Grande Maison", audience: "Tous les niveaux de votre année.",
    price: "149 000", priceUnit: "FCFA / an",
    features: [
      "Passages illimités sur l'année",
      "La Braise permanente incluse",
      "Toutes les langues · CECRL + YEMA",
      "Rentable dès deux niveaux dans l'année",
    ],
    cta: "Ouvrir la Grande Maison", href: "/register?plan=grande",
  },
  famille: {
    id: "famille", name: "La Famille", audience: "La Braise du foyer entier.",
    price: "—", priceUnit: "—",
    features: [],
    cta: "—", href: "#",
  },
};

// ─── PRODUITS · RAIL EUR ─────────────────────────────────────────
const PRODUITS_EUR_FR: Record<ProductId, Product> = {
  entree: {
    id: "entree", name: "L'entrée", audience: "Pour goûter la maison.",
    price: "0", priceUnit: "€",
    features: [
      "La première leçon complète (langue au choix)",
      "Un récit de la Veillée, avec ses mots",
      "La cérémonie de fin de leçon",
    ],
    cta: "Commencer gratuitement", href: "/register", ghost: true,
  },
  braise: {
    id: "braise", name: "La Braise", audience: "Habiter la maison, entretenir le feu.",
    price: "9,90", priceUnit: "€ / mois · 79 / an",
    features: [
      "La Veillée complète — toutes les voix",
      "Toutes les langues natales · É1 → É5",
      "Révisions des niveaux déjà acquis",
      "Pratique quotidienne, écrit relu",
    ],
    cta: "Entretenir ma braise", href: "/register?plan=braise",
  },
  passage: {
    id: "passage", name: "Le Passage", audience: "Un niveau complet, pour un projet précis.",
    price: "89", priceUnit: "€ / niveau · 4 mois",
    features: [
      "Une langue étrangère · niveau entier",
      "Examens blancs corrigés",
      "Votre écrit relu et expliqué",
      "Attestation de fin de niveau",
      "La Braise incluse pendant les 4 mois",
    ],
    cta: "Prendre mon Passage", href: "/register?plan=passage",
  },
  grande: {
    id: "grande", name: "La Grande Maison", audience: "Tous les niveaux de votre année.",
    price: "249", priceUnit: "€ / an",
    features: [
      "Passages illimités sur l'année",
      "La Braise permanente incluse",
      "Toutes les langues · CECRL + YEMA",
      "Rentable dès deux niveaux dans l'année",
    ],
    cta: "Ouvrir la Grande Maison", href: "/register?plan=grande",
  },
  famille: {
    id: "famille", name: "La Famille", audience: "La Braise du foyer entier.",
    price: "99", priceUnit: "€ / an · tarif fondateur",
    features: [
      "Profils enfants + parent",
      "Toutes les langues de la maison, natales comme étrangères, pour les enfants",
      "Contes, chansons, jeux parent-enfant",
      "La Veillée pour tous",
    ],
    cta: "Rejoindre la Famille", href: "/register?plan=famille",
  },
};

// Traductions EN (d'intention).
const PRODUITS_FCFA_EN: Record<ProductId, Product> = Object.fromEntries(
  Object.entries(PRODUITS_FCFA_FR).map(([k, p]) => [k, {
    ...p,
    name: p.name.replace("L'entrée", "The Entrance")
              .replace("La Braise", "The Ember")
              .replace("Le Passage", "The Passage")
              .replace("La Grande Maison", "The Great House")
              .replace("La Famille", "The Family"),
    audience: p.audience
      .replace("Pour goûter la maison.", "To taste the house.")
      .replace("Habiter la maison, entretenir le feu.", "Live in, tend the fire.")
      .replace("Un niveau complet, pour un projet précis.", "A full level, for a precise project.")
      .replace("Tous les niveaux de votre année.", "All the levels of your year.")
      .replace("La Braise du foyer entier.", "The Ember for the whole home."),
    priceUnit: p.priceUnit.replace("mois", "month").replace("niveau", "level").replace("an", "year"),
    cta: p.cta
      .replace("Commencer gratuitement", "Start free")
      .replace("Entretenir ma braise", "Tend my ember")
      .replace("Prendre mon Passage", "Take my Passage")
      .replace("Ouvrir la Grande Maison", "Open the Great House")
      .replace("Rejoindre la Famille", "Join the Family"),
    features: p.features.map((f) => f
      .replace("Toutes les langues de la maison, natales comme étrangères, pour les enfants",
               "All the house languages — native and foreign — for the children")
      .replace("Profils enfants + parent", "Child + parent profiles")
      .replace("Contes, chansons, jeux parent-enfant", "Tales, songs, parent-child games")
      .replace("Toutes les natales · YEMA", "All native languages · YEMA")
      .replace("La Veillée pour tous", "The Veillée for everyone")),
  }]),
) as unknown as Record<ProductId, Product>;

const PRODUITS_EUR_EN: Record<ProductId, Product> = Object.fromEntries(
  Object.entries(PRODUITS_EUR_FR).map(([k, p]) => [k, {
    ...PRODUITS_FCFA_EN[k as ProductId],
    price: p.price,
    priceUnit: p.priceUnit.replace("mois", "month").replace("niveau", "level").replace("an", "year").replace("tarif fondateur", "founder rate"),
  }]),
) as Record<ProductId, Product>;

// ─── ORDRE DES 3 CARTES + HÉROS par cap × rail ────────────────────
interface Slot { ids: readonly ProductId[]; hero: ProductId }
const SLOTS_FCFA: Record<Cap, Slot> = {
  franchir:    { ids: ["entree", "passage", "grande"],     hero: "passage" },
  grandir:     { ids: ["entree", "passage", "grande"],     hero: "grande"  },
  transmettre: { ids: ["entree", "braise", "grande"],      hero: "braise"  },
  moi:         { ids: ["entree", "braise", "passage"],     hero: "braise"  },
};
const SLOTS_EUR: Record<Cap, Slot> = {
  franchir:    { ids: ["entree", "passage", "grande"],     hero: "passage" },
  grandir:     { ids: ["entree", "passage", "grande"],     hero: "grande"  },
  transmettre: { ids: ["entree", "famille", "grande"],     hero: "famille" },
  moi:         { ids: ["entree", "braise", "passage"],     hero: "braise"  },
};

// ─── LIGNES D'ANCRAGE (Fraunces italique, une seule par cap × rail) ─
const ANCHORS_FR: Record<Rail, Partial<Record<Cap, string>>> = {
  fcfa: {
    franchir:    "Le niveau complet, à moins de la moitié d'un institut — l'examen blanc inclus.",
    grandir:     "Tous les niveaux que votre année peut porter — la maison ne ferme jamais.",
    transmettre: "Habiter la maison, entretenir le feu — pour le prix d'un repas par mois.",
    moi:         "Habiter la maison, entretenir le feu — à votre rythme, sans projet imposé.",
  },
  eur: {
    franchir:    "Un institut facture le niveau au prix d'un loyer. Ici, il tient dans une main.",
    grandir:     "Six mois chez vous coûtent moins qu'un mois de cours du soir — préparations incluses.",
    transmettre: "Moins de 3 € par personne et par mois — pour que la langue de la maison reste dans la maison.",
    moi:         "Habiter la maison, entretenir le feu — à votre rythme, sans projet imposé.",
  },
};
const ANCHORS_EN: Record<Rail, Partial<Record<Cap, string>>> = {
  fcfa: {
    franchir:    "The full level, for less than half of an institute — mock exam included.",
    grandir:     "As many levels as your year can carry — the house never closes.",
    transmettre: "Live in, tend the fire — for the price of one meal a month.",
    moi:         "Live in, tend the fire — your pace, no imposed project.",
  },
  eur: {
    franchir:    "An institute charges a level like rent. Here, it fits in one hand.",
    grandir:     "Six months at home cost less than one month of evening classes — exam prep included.",
    transmettre: "Less than €3 per person per month — so the language of the house stays in the house.",
    moi:         "Live in, tend the fire — your pace, no imposed project.",
  },
};

// ─── TABLEAU comparatif · lignes ──────────────────────────────────
interface ComparisonRow {
  label: string;
  entree: string;
  braise: string;
  passage: string;
  grande: string;
}
const COMPARISON_FR: readonly ComparisonRow[] = [
  { label: "Nouveaux niveaux étrangers (cours complets)",
    entree: "—", braise: "—", passage: "1 langue", grande: "illimités" },
  { label: "Langues natales · É1 → É5",
    entree: "1 récit", braise: "toutes", passage: "toutes", grande: "toutes" },
  { label: "Examens blancs corrigés",
    entree: "—", braise: "—", passage: "✓", grande: "✓" },
  { label: "Attestation de fin de niveau",
    entree: "—", braise: "—", passage: "✓", grande: "✓" },
  { label: "La Veillée — récits et voix",
    entree: "1 récit", braise: "complète", passage: "complète", grande: "complète" },
  { label: "Révisions des niveaux acquis",
    entree: "—", braise: "✓", passage: "✓", grande: "✓" },
  { label: "Pratique quotidienne + écrit relu",
    entree: "leçon 1", braise: "✓", passage: "✓", grande: "✓" },
];
const COMPARISON_EN: readonly ComparisonRow[] = [
  { label: "New foreign levels (full courses)",
    entree: "—", braise: "—", passage: "1 language", grande: "unlimited" },
  { label: "Native languages · É1 → É5",
    entree: "1 tale", braise: "all", passage: "all", grande: "all" },
  { label: "Corrected mock exams",
    entree: "—", braise: "—", passage: "✓", grande: "✓" },
  { label: "End-of-level certificate",
    entree: "—", braise: "—", passage: "✓", grande: "✓" },
  { label: "The Vigil — tales and voices",
    entree: "1 tale", braise: "full", passage: "full", grande: "full" },
  { label: "Reviews of acquired levels",
    entree: "—", braise: "✓", passage: "✓", grande: "✓" },
  { label: "Daily practice + written feedback",
    entree: "lesson 1", braise: "✓", passage: "✓", grande: "✓" },
];

// ─── COPY page ────────────────────────────────────────────────────
interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  capLabel: string;
  caps: readonly { id: Cap; label: string }[];
  railLabel: string;
  railFcfa: string;
  railEur: string;
  railNote: string;
  heroBadge: string;
  compareTitle: string;
  compareEntreeLbl: string;
  compareBraiseLbl: string;
  comparePassageLbl: string;
  compareGrandeLbl: string;
  footerFondateurs: string;
  footerGuarantee: string;
  footerPay: string;
  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
}

const COPY_FR: Copy = {
  kicker: "Nos formules",
  title: "Un prix simple.",
  titleEm: "Pour un but précis.",
  lede: "Choisissez votre cap — la maison fait ressortir la formule pensée pour vous.",
  capLabel: "Votre cap",
  caps: [
    { id: "franchir",    label: "Réussir mon examen, partir" },
    { id: "grandir",     label: "Progresser là où je vis" },
    { id: "transmettre", label: "Transmettre à mes enfants" },
    { id: "moi",         label: "Apprendre pour moi" },
  ],
  railLabel: "Devise",
  railFcfa: "FCFA",
  railEur: "€",
  railNote: "Les prix locaux suivent le coût de la vie et les taxes de chaque région.",
  heroBadge: "Pensé pour votre cap",
  compareTitle: "Ce que chaque tarif comprend",
  compareEntreeLbl: "Entrée",
  compareBraiseLbl: "Braise",
  comparePassageLbl: "Passage",
  compareGrandeLbl: "Grande Maison",
  footerFondateurs: "Cercle des Fondateurs · 500 places numérotées · tarif verrouillé à vie.",
  footerGuarantee: "14 jours satisfait-ou-remboursé · Passage et annuels.",
  footerPay: "Mobile Money ou carte.",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  kicker: "Our plans",
  title: "One simple price.",
  titleEm: "For one precise goal.",
  lede: "Pick your cap — the house highlights the plan built for you.",
  capLabel: "Your cap",
  caps: [
    { id: "franchir",    label: "Pass my exam, leave" },
    { id: "grandir",     label: "Grow where I live" },
    { id: "transmettre", label: "Pass on to my children" },
    { id: "moi",         label: "Learn for me" },
  ],
  railLabel: "Currency",
  railFcfa: "FCFA",
  railEur: "€",
  railNote: "Local prices reflect the cost of living and taxes of each region.",
  heroBadge: "Built for your cap",
  compareTitle: "What each plan includes",
  compareEntreeLbl: "Entrance",
  compareBraiseLbl: "Ember",
  comparePassageLbl: "Passage",
  compareGrandeLbl: "Great House",
  footerFondateurs: "Founders circle · 500 numbered seats · price locked for life.",
  footerGuarantee: "14 days money-back · Passage and annual plans.",
  footerPay: "Mobile Money or card.",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
};

// ─── Détection rail par défaut selon locale/région ────────────────
// Simple heuristique client-side · si navigator.language commence par
// une locale africaine francophone connue, on default à FCFA. Sinon EUR.
function detectDefaultRail(): Rail {
  if (typeof navigator === "undefined") return "eur";
  const lang = (navigator.language ?? "").toLowerCase();
  // Codes ISO régionaux qui utilisent FCFA (BEAC + BCEAO) ou Afrique
  // subsaharienne francophone majoritairement.
  const african = /-(cm|sn|ci|bf|ml|ne|td|cg|cf|ga|bj|tg|gq)$/i;
  if (african.test(lang)) return "fcfa";
  // Fallback timezone si dispo (indicatif seulement)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /africa\/(douala|dakar|abidjan|libreville|brazzaville|bangui|niamey|bamako|ouagadougou|lome|cotonou)/i.test(tz)) {
      return "fcfa";
    }
  } catch {}
  return "eur";
}

export default function PricingPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const [cap, setCap] = useState<Cap>("franchir");
  const [rail, setRail] = useState<Rail>("fcfa");
  const searchParams = useSearchParams();
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Détection initiale du rail par région
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRail(detectDefaultRail());
  }, []);

  // Pré-sélection cap · query param > /api/me > défaut
  useEffect(() => {
    const qCap = searchParams.get("cap");
    if (qCap && (["franchir", "grandir", "transmettre", "moi"] as const).includes(qCap as Cap)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCap(qCap as Cap);
      return;
    }
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const uCap = d?.cap as Cap | undefined;
        if (uCap && (["franchir", "grandir", "transmettre", "moi"] as const).includes(uCap)) {
          setCap(uCap);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const products = rail === "fcfa"
    ? (loc === "en" ? PRODUITS_FCFA_EN : PRODUITS_FCFA_FR)
    : (loc === "en" ? PRODUITS_EUR_EN : PRODUITS_EUR_FR);
  const slot = rail === "fcfa" ? SLOTS_FCFA[cap] : SLOTS_EUR[cap];
  const visibleIds = slot.ids;
  const heroId = slot.hero;
  const anchor = (loc === "en" ? ANCHORS_EN : ANCHORS_FR)[rail][cap];
  const comparison = loc === "en" ? COMPARISON_EN : COMPARISON_FR;

  const capsToShow = useMemo(() => c.caps, [c.caps]);

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: c.navFeatures,
          levels: c.navLevels,
          pricing: c.navPricing,
          centers: c.navCenters,
          login: c.navLogin,
          register: c.navRegister,
        }}
      />

      <main className="pricing-page">
        <section className="pricing-head">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.kicker)}</p>
            <h1 className="maison-h">
              {t(c.title)} <em>{t(c.titleEm)}</em>
            </h1>
            <p className="maison-lede">{t(c.lede)}</p>
          </div>
        </section>

        {/* Toggle rail discret · haut-droite */}
        <section className="pricing-rail" aria-label={c.railLabel}>
          <div className="maison-container pricing-rail-inner">
            <div className="pricing-rail-tabs" role="tablist">
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
            <p className="pricing-rail-note">{t(c.railNote)}</p>
          </div>
        </section>

        {/* Sélecteur de cap · 4 pills */}
        <section className="pricing-selector" aria-label={c.capLabel}>
          <div className="maison-container">
            <p className="pricing-selector-lbl">{c.capLabel}</p>
            <div className="pricing-caps" role="tablist">
              {capsToShow.map((k) => {
                const active = cap === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`pricing-cap ${active ? "on" : ""}`}
                    onClick={() => setCap(k.id)}
                  >
                    {t(k.label)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Ligne d'ancrage · Fraunces italique laiton */}
        {anchor ? (
          <section className="pricing-anchor" aria-live="polite">
            <div className="maison-container">
              <p><em>{t(anchor)}</em></p>
            </div>
          </section>
        ) : null}

        {/* Grille · 3 cartes CÔTE À CÔTE (jamais 4) */}
        <section className="pricing-grid-section">
          <div className="maison-container">
            <div className="pricing-grid pricing-grid-3">
              {visibleIds.map((pid) => {
                const p = products[pid];
                const isHero = pid === heroId;
                return (
                  <article
                    key={pid}
                    className={`pricing-plan ${isHero ? "pricing-plan-hero" : ""}`}
                    aria-labelledby={`plan-${pid}-h`}
                  >
                    {isHero ? (
                      <span className="pricing-plan-badge">{t(c.heroBadge)}</span>
                    ) : null}
                    <h3 id={`plan-${pid}-h`} className="pricing-plan-name">
                      {t(p.name)}
                    </h3>
                    <p className="pricing-plan-audience">{t(p.audience)}</p>
                    <div className="pricing-plan-price">
                      <span className="pricing-plan-price-num">{p.price}</span>
                      <span className="pricing-plan-price-unit">{p.priceUnit}</span>
                    </div>
                    <ul className="pricing-plan-features">
                      {p.features.map((f) => (
                        <li key={f}>{t(f)}</li>
                      ))}
                    </ul>
                    <Link
                      href={`/${locale}${p.href}`}
                      className={`pricing-plan-cta ${isHero ? "hero" : ""} ${p.ghost ? "ghost" : ""}`}
                    >
                      {t(p.cta)}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tableau comparatif · 4 colonnes, 7 lignes */}
        <section className="pricing-compare" aria-labelledby="pricing-compare-h">
          <div className="maison-container">
            <h2 id="pricing-compare-h" className="pricing-compare-title">
              {t(c.compareTitle)}
            </h2>
            <div className="pricing-compare-wrap">
              <table className="pricing-compare-table">
                <thead>
                  <tr>
                    <th scope="col" className="pricing-compare-th-label" aria-label="feature"></th>
                    <th scope="col">{c.compareEntreeLbl}</th>
                    <th scope="col">{c.compareBraiseLbl}</th>
                    <th scope="col">{c.comparePassageLbl}</th>
                    <th scope="col">{c.compareGrandeLbl}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i}>
                      <th scope="row">{t(row.label)}</th>
                      <td className={row.entree === "—" ? "off" : ""}>{row.entree}</td>
                      <td className={row.braise === "—" ? "off" : ""}>{row.braise}</td>
                      <td className={row.passage === "—" ? "off" : ""}>{row.passage}</td>
                      <td className={row.grande === "—" ? "off" : ""}>{row.grande}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pied · Fondateurs · 14 jours · Mobile Money ou carte */}
        <section className="pricing-footer-band">
          <div className="maison-container pricing-footer-band-inner">
            <p className="pricing-footer-band-line">{t(c.footerFondateurs)}</p>
            <p className="pricing-footer-band-sep">·</p>
            <p className="pricing-footer-band-line">{t(c.footerGuarantee)}</p>
            <p className="pricing-footer-band-sep">·</p>
            <p className="pricing-footer-band-line">{t(c.footerPay)}</p>
          </div>
        </section>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline: c.footerTagline,
          made: c.footerMade,
          legal: c.footerLegal,
          terms: c.footerTerms,
          privacy: c.footerPrivacy,
          contact: c.footerContact,
          disclaimer: c.footerDisclaimer,
        }}
      />
    </div>
  );
}

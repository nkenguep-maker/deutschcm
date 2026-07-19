"use client";

// /pricing · Sprint 6 « Par but ».
// Sélecteur de cap en tête · grille FIXE · deux rails (Mobile Money XAF
// et Carte €). Le moyen de paiement choisit la devise — pas de sélecteur
// visible. Le cap déplace la carte héros + description + ligne d'ancrage.
// Aucun nom d'organisme d'examen officiel (compliance CEFR).

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";

type Rail = "mobile" | "card";
type Cap = "franchir" | "grandir" | "transmettre" | "moi";

interface Plan {
  id: string;
  name: string;
  audience: string;
  price: string;
  priceUnit: string;
  features: readonly string[];
  cta: string;
  href: string;
}

interface CapConfig {
  id: Cap;
  label: string;
  labelEn: string;
}

const CAPS: readonly CapConfig[] = [
  { id: "franchir",    label: "Réussir mon examen, partir",   labelEn: "Pass my exam, leave" },
  { id: "grandir",     label: "Progresser là où je vis",      labelEn: "Grow where I live" },
  { id: "transmettre", label: "Transmettre à mes enfants",    labelEn: "Pass on to my children" },
  { id: "moi",         label: "Apprendre pour moi",           labelEn: "Learn for me" },
];

// ─── Rail Mobile Money · XAF ──────────────────────────────────────
const RAIL_MOBILE_FR: readonly Plan[] = [
  {
    id: "entree",
    name: "L'entrée",
    audience: "Découvrir la maison",
    price: "0",
    priceUnit: "XAF",
    features: [
      "La première leçon complète",
      "Un dialogue Klaus",
      "Aucune carte requise",
    ],
    cta: "Commencer, gratuitement",
    href: "/register",
  },
  {
    id: "passage",
    name: "Le Passage",
    audience: "Un niveau complet, examen blanc, attestation",
    price: "49 000",
    priceUnit: "XAF / niveau · 4 mois",
    features: [
      "Le niveau entier (A1, A2, B1…)",
      "Examen blanc en fin de parcours",
      "Attestation YEMA reconnue",
      "Correction assistée + prof accrédité·e",
    ],
    cta: "Choisir Le Passage",
    href: "/register?plan=passage",
  },
  {
    id: "solo",
    name: "Solo",
    audience: "Mon rythme, une langue à la fois",
    price: "9 900",
    priceUnit: "XAF / mois",
    features: [
      "Une langue de votre choix",
      "Klaus illimité",
      "Correction de l'écrit incluse",
    ],
    cta: "Choisir Solo",
    href: "/register?plan=solo",
  },
  {
    id: "maison",
    name: "La Maison",
    audience: "Toutes les langues ouvertes, chez vous",
    price: "14 900",
    priceUnit: "XAF / mois · 99 000 / an",
    features: [
      "Toutes les langues étrangères + natales",
      "Klaus illimité",
      "Correction · prof · examens blancs",
      "Contes et modules famille",
    ],
    cta: "Choisir La Maison",
    href: "/register?plan=maison",
  },
];
const RAIL_MOBILE_EN: readonly Plan[] = RAIL_MOBILE_FR.map((p) => ({
  ...p,
  name: p.name === "L'entrée" ? "The entrance"
       : p.name === "Le Passage" ? "The Passage"
       : p.name === "La Maison" ? "The House"
       : p.name,
  audience: p.audience === "Découvrir la maison" ? "Discover the house"
          : p.audience === "Un niveau complet, examen blanc, attestation" ? "A full level, mock exam, certificate"
          : p.audience === "Mon rythme, une langue à la fois" ? "My pace, one language at a time"
          : p.audience === "Toutes les langues ouvertes, chez vous" ? "All languages open, at home"
          : p.audience,
  priceUnit: p.priceUnit.replace("mois", "month").replace("niveau", "level").replace("an", "year"),
  cta: p.cta.replace("Commencer, gratuitement", "Start, free")
             .replace("Choisir ", "Choose ")
             .replace("Le Passage", "The Passage")
             .replace("Solo", "Solo")
             .replace("La Maison", "The House"),
  features: p.features.map((f) => f),
}));

// ─── Rail Carte · € ───────────────────────────────────────────────
const RAIL_CARD_FR: readonly Plan[] = [
  {
    id: "entree",
    name: "L'entrée",
    audience: "Découvrir la maison",
    price: "0",
    priceUnit: "€",
    features: [
      "La première leçon complète",
      "Un dialogue Klaus",
      "Aucune carte requise",
    ],
    cta: "Commencer, gratuitement",
    href: "/register",
  },
  {
    id: "passage",
    name: "Le Passage",
    audience: "Un niveau complet, examen blanc, attestation",
    price: "89",
    priceUnit: "€ / niveau",
    features: [
      "Le niveau entier",
      "Examen blanc + attestation",
      "Correction assistée + prof accrédité·e",
    ],
    cta: "Choisir Le Passage",
    href: "/register?plan=passage",
  },
  {
    id: "solo",
    name: "Solo",
    audience: "Une langue à la fois",
    price: "19",
    priceUnit: "€ / mois · 190 / an",
    features: [
      "Une langue de votre choix",
      "Klaus illimité",
      "Correction de l'écrit incluse",
    ],
    cta: "Choisir Solo",
    href: "/register?plan=solo",
  },
  {
    id: "maison",
    name: "La Maison",
    audience: "Toutes les langues, chez vous",
    price: "29",
    priceUnit: "€ / mois · 290 / an",
    features: [
      "Toutes les langues étrangères + natales",
      "Préparations d'examens et de procédures incluses",
      "Klaus illimité · correction · prof",
    ],
    cta: "Choisir La Maison",
    href: "/register?plan=maison",
  },
  {
    id: "racines",
    name: "Solo racines",
    audience: "Une langue natale, à mon rythme",
    price: "9,90",
    priceUnit: "€ / mois · 79 / an",
    features: [
      "Une langue natale de votre choix",
      "Contes, chants, ancrages culturels",
      "Progression YEMA É1 → É5",
    ],
    cta: "Choisir Solo racines",
    href: "/register?plan=racines",
  },
  {
    id: "famille",
    name: "Famille",
    audience: "Profils enfants, contes, chansons, jeux",
    price: "99",
    priceUnit: "€ / an · tarif fondateur",
    features: [
      "Toutes les natales",
      "Profils enfants + parent",
      "Contes, chansons, jeux parent-enfant",
    ],
    cta: "Choisir Famille",
    href: "/register?plan=famille",
  },
];
const RAIL_CARD_EN: readonly Plan[] = RAIL_CARD_FR.map((p) => ({
  ...p,
  name: p.name === "L'entrée" ? "The entrance"
       : p.name === "Le Passage" ? "The Passage"
       : p.name === "La Maison" ? "The House"
       : p.name === "Solo racines" ? "Solo roots"
       : p.name === "Famille" ? "Family"
       : p.name,
  audience: p.audience === "Découvrir la maison" ? "Discover the house"
          : p.audience === "Un niveau complet, examen blanc, attestation" ? "A full level, mock exam, certificate"
          : p.audience === "Une langue à la fois" ? "One language at a time"
          : p.audience === "Toutes les langues, chez vous" ? "All languages, at home"
          : p.audience === "Une langue natale, à mon rythme" ? "One native language, my pace"
          : p.audience === "Profils enfants, contes, chansons, jeux" ? "Kids profiles, tales, songs, games"
          : p.audience,
  priceUnit: p.priceUnit.replace("mois", "month").replace("niveau", "level").replace("an", "year").replace("tarif fondateur", "founder rate"),
  cta: p.cta.replace("Commencer, gratuitement", "Start, free")
             .replace("Choisir ", "Choose ")
             .replace("Le Passage", "The Passage")
             .replace("La Maison", "The House")
             .replace("Solo racines", "Solo roots")
             .replace("Famille", "Family"),
}));

// ─── Héros par cap et par rail ────────────────────────────────────
// La grille reste FIXE. Le cap déplace le badge « Pensé pour votre
// cap » + met en avant une carte, et déclenche une ligne d'ancrage.

const HERO_MAP: Record<Rail, Partial<Record<Cap, string>>> = {
  mobile: {
    franchir:    "passage", // Franchir → Passage
    grandir:     "solo",    // Grandir → Solo
    transmettre: "maison",  // Transmettre → Maison (pas de push racines XAF)
    moi:         "solo",
  },
  card: {
    franchir:    "passage",
    grandir:     "maison",  // Grandir € → Maison (incluses prépas)
    transmettre: "famille", // Transmettre € → Famille
    moi:         "solo",
  },
};

// ─── Lignes d'ancrage (une seule à la fois) ─────────────────────
const ANCHORS_FR: Record<Rail, Partial<Record<Cap, string>>> = {
  mobile: {
    franchir:    "Le niveau complet — à moins de la moitié d'un institut, l'examen blanc inclus.",
    grandir:     "Toute l'année, pour le prix d'un seul niveau en institut — toute la maison.",
    transmettre: "Toute la maison — pour que la langue reste dans la maison.",
    moi:         "Un rythme à vous, sans engagement long — vous partez quand vous voulez.",
  },
  card: {
    franchir:    "Un institut facture le niveau au prix d'un loyer. La maison entière coûte moins qu'un dîner par mois.",
    grandir:     "Six mois chez vous coûtent moins qu'un seul mois de cours du soir — préparations d'examens incluses.",
    transmettre: "Moins de trois euros par personne et par mois — pour que la langue de la maison reste dans la maison.",
    moi:         "Un rythme à vous, sans engagement long.",
  },
};
const ANCHORS_EN: Record<Rail, Partial<Record<Cap, string>>> = {
  mobile: {
    franchir:    "The full level — for less than half of an institute, mock exam included.",
    grandir:     "The whole year, for the price of a single level at an institute — the whole house.",
    transmettre: "The whole house — so the language stays in the house.",
    moi:         "Your pace, no long commitment.",
  },
  card: {
    franchir:    "An institute charges a level like rent. The whole house costs less than one dinner a month.",
    grandir:     "Six months at home cost less than one month of evening classes — exam preparation included.",
    transmettre: "Less than three euros per person per month — so the language of the house stays in the house.",
    moi:         "Your pace, no long commitment.",
  },
};

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  capLabel: string;
  railLabel: string;
  railMobile: string;
  railCard: string;
  heroBadge: string;
  footerFondateurs: string;
  footerGuarantee: string;
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
  title: "Un prix.",
  titleEm: "Trois vitrines.",
  lede: "Choisissez d'abord votre cap — la maison fait ressortir la formule pensée pour vous.",
  capLabel: "Votre cap",
  railLabel: "Devise",
  railMobile: "Mobile Money · XAF",
  railCard: "Carte · €",
  heroBadge: "Pensé pour votre cap",
  footerFondateurs: "Cercle des Fondateurs · 500 places numérotées · tarif verrouillé à vie.",
  footerGuarantee: "14 jours satisfait-ou-remboursé · Passage et annuels.",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "Construit au Cameroun, pour le continent et le monde",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  kicker: "Our plans",
  title: "One price.",
  titleEm: "Three windows.",
  lede: "Pick your cap first — the house highlights the plan built for you.",
  capLabel: "Your cap",
  railLabel: "Currency",
  railMobile: "Mobile Money · XAF",
  railCard: "Card · €",
  heroBadge: "Built for your cap",
  footerFondateurs: "Founders circle · 500 numbered seats · price locked for life.",
  footerGuarantee: "14 days money-back · Passage and annual plans.",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Built in Cameroon, for the continent and the world",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
};

export default function PricingPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const [cap, setCap] = useState<Cap>("franchir");
  const [rail, setRail] = useState<Rail>("mobile");
  const searchParams = useSearchParams();
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Pré-selection du cap · priorité au query param (?cap=grandir depuis
  // un CTA sponsor), sinon /api/me/user_metadata.cap (utilisateur
  // connecté après onboarding), sinon défaut "franchir".
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

  const plans = rail === "mobile"
    ? (loc === "en" ? RAIL_MOBILE_EN : RAIL_MOBILE_FR)
    : (loc === "en" ? RAIL_CARD_EN : RAIL_CARD_FR);
  const heroId = HERO_MAP[rail][cap];
  const anchor = (loc === "en" ? ANCHORS_EN : ANCHORS_FR)[rail][cap];

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

        {/* Sélecteur de cap */}
        <section className="pricing-selector" aria-label={c.capLabel}>
          <div className="maison-container">
            <p className="pricing-selector-lbl">{c.capLabel}</p>
            <div className="pricing-caps" role="tablist">
              {CAPS.map((k) => {
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
                    {loc === "en" ? k.labelEn : t(k.label)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Rail sélecteur (visible) — la doctrine dit « le moyen de paiement
            choisit la devise » ; on rend le choix explicite parce que le
            visiteur non connecté ne sait pas encore comment il payera. */}
        <section className="pricing-rail" aria-label={c.railLabel}>
          <div className="maison-container">
            <div className="pricing-rail-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={rail === "mobile"}
                className={`pricing-rail-tab ${rail === "mobile" ? "on" : ""}`}
                onClick={() => setRail("mobile")}
              >
                {c.railMobile}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rail === "card"}
                className={`pricing-rail-tab ${rail === "card" ? "on" : ""}`}
                onClick={() => setRail("card")}
              >
                {c.railCard}
              </button>
            </div>
          </div>
        </section>

        {/* Ligne d'ancrage — une phrase Fraunces italique laiton */}
        {anchor ? (
          <section className="pricing-anchor" aria-live="polite">
            <div className="maison-container">
              <p><em>{t(anchor)}</em></p>
            </div>
          </section>
        ) : null}

        {/* Grille · 3 cartes visibles max */}
        <section className="pricing-grid-section">
          <div className="maison-container">
            <div className="pricing-grid">
              {plans.map((p) => {
                const isHero = p.id === heroId;
                return (
                  <article
                    key={p.id}
                    className={`pricing-plan ${isHero ? "pricing-plan-hero" : ""}`}
                    aria-labelledby={`plan-${p.id}-h`}
                  >
                    {isHero ? (
                      <span className="pricing-plan-badge">{t(c.heroBadge)}</span>
                    ) : null}
                    <h3 id={`plan-${p.id}-h`} className="pricing-plan-name">
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
                    <Link href={`/${locale}${p.href}`} className={`pricing-plan-cta ${isHero ? "hero" : ""}`}>
                      {t(p.cta)}
                    </Link>
                  </article>
                );
              })}
            </div>

            <div className="pricing-footer-band">
              <p className="pricing-footer-band-line">{t(c.footerFondateurs)}</p>
              <p className="pricing-footer-band-sep">·</p>
              <p className="pricing-footer-band-line">{t(c.footerGuarantee)}</p>
            </div>
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

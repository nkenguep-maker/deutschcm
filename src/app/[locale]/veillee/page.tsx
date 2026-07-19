"use client";

// /veillee · page pleine · La Veillée (ancienne /histoires).
// Zéro persona, zéro témoignage inventé. Seuls les récits audio réels
// et validés (voix native confirmée) s'affichent. Si peu de récits au
// lancement, on en montre peu. Jamais de remplissage.
//
// Réutilise <VeilleeVoix> déjà présent sur la home — pas de duplication.
// La home garde un aperçu (limit=3) qui renvoie ici pour toute la Veillée.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Teaser } from "@/components/maison/Teaser";
import { VeilleeVoix } from "@/components/voix/VeilleeVoix";
import { frTypo } from "@/components/landing/typo";
import { STORIES } from "@/lib/voix/stories";

interface Copy {
  navFeatures: string;
  navLevels: string;
  navHistoires: string;
  navTarifs: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  catsKicker: string;
  cats: readonly { key: "conte" | "proverbe" | "quotidien" | "apprenant"; name: string; note: string }[];
  ctaTitle: string;
  ctaBtn: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
}

const COPY_FR: Copy = {
  navFeatures: "Langues",
  navLevels: "Méthode",
  navHistoires: "La Veillée",
  navTarifs: "Tarifs",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  kicker: "La Veillée",
  title: "Des histoires racontées —",
  titleEm: "et d'autres qu'on n'a jamais dites.",
  lede: "Choisissez une langue. Écoutez quelqu'un vous parler. On s'assied, on écoute.",
  catsKicker: "Ce qu'on écoute ici",
  cats: [
    { key: "conte",      name: "Les contes",              note: "Récits transmis, dits comme au village." },
    { key: "proverbe",   name: "Les proverbes",           note: "Un banc où s'asseoir avant le chemin." },
    { key: "quotidien",  name: "Les récits du quotidien", note: "Une voix qui raconte sa journée, sa langue." },
    { key: "apprenant",  name: "Les voix de nos apprenants", note: "Bientôt — dès qu'un vrai témoignage arrive." },
  ],
  ctaTitle: "D'autres voix rejoindront la Veillée.",
  ctaBtn: "Commencer",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  navFeatures: "Languages",
  navLevels: "Method",
  navHistoires: "The Veillée",
  navTarifs: "Pricing",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  kicker: "The Veillée",
  title: "Stories told —",
  titleEm: "and others never spoken.",
  lede: "Pick a language. Listen to someone speak. Sit down, listen.",
  catsKicker: "What we listen to here",
  cats: [
    { key: "conte",     name: "Tales",                 note: "Stories passed on, told as at home." },
    { key: "proverbe",  name: "Proverbs",              note: "A bench to sit on before the road." },
    { key: "quotidien", name: "Everyday stories",      note: "A voice telling of a day, of a tongue." },
    { key: "apprenant", name: "Our learners' voices",  note: "Coming soon — when a real testimonial lands." },
  ],
  ctaTitle: "More voices will join the Veillée.",
  ctaBtn: "Start",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
};

export default function VeilleePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Compte les récits réellement validés par catégorie (pour ne pas
  // survendre les zones vides). Un rendu honnête sur la profondeur.
  const countBy = (key: string) =>
    STORIES.filter((s) => s.validated === true && s.category === key).length;

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: c.navFeatures,
          levels: c.navLevels,
          histoires: c.navHistoires,
          tarifs: c.navTarifs,
          pricing: c.navPricing,
          centers: c.navCenters,
          login: c.navLogin,
          register: c.navRegister,
        }}
      />

      <main className="veillee-page">
        <section className="veillee-hero maison-container" aria-labelledby="veillee-h">
          <p className="maison-kicker">{t(c.kicker)}</p>
          <h1 id="veillee-h" className="maison-h">
            {t(c.title)} <em>{t(c.titleEm)}</em>
          </h1>
          <p className="maison-lede">{t(c.lede)}</p>
        </section>

        <section className="veillee-player maison-container" aria-label={loc === "en" ? "Voice player" : "Lecteur de voix"}>
          <VeilleeVoix locale={loc} />
        </section>

        <section className="veillee-cats maison-container" aria-labelledby="veillee-cats-h">
          <p id="veillee-cats-h" className="maison-kicker">{t(c.catsKicker)}</p>
          <ul className="veillee-cats-list">
            {c.cats.map((cat) => {
              const n = countBy(cat.key);
              return (
                <li key={cat.key} className={`veillee-cat ${n === 0 ? "veillee-cat-empty" : ""}`}>
                  <span className="veillee-cat-name">{t(cat.name)}</span>
                  <span className="veillee-cat-note">{t(cat.note)}</span>
                  {n > 0 ? (
                    <span className="veillee-cat-count">{n}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <Teaser
          locale={loc}
          line1={t(c.ctaTitle)}
          line2={loc === "en" ? "One is being recorded right now." : "L'une s'enregistre en ce moment."}
        />

        <div className="veillee-cta">
          <Link href={`/${locale}/register`} className="maison-porte-cta">
            {t(c.ctaBtn)} →
          </Link>
        </div>
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

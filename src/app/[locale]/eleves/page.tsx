"use client";

// /eleves · Sprint 5 « Les chemins ».
// Page émotionnelle, projection. Une langue vous sépare de votre
// rêve — on la met à portée. Deux chemins (world / sources), l'échelle
// interactive, quatre outils, une histoire mise en avant. Aucune techno
// citée en argument frontal ; jamais "IA" en trigger émotionnel.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Seam } from "@/components/design/Seam";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { PortraitSpeaking } from "@/components/PortraitSpeaking";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  heroKicker: string;
  heroTitle: string;
  heroTitleEm: string;
  heroLede: string;
  ctaPrimary: string;
  ctaSecondary: string;

  cheminsKicker: string;
  cheminsTitle: string;
  cheminsTitleEm: string;
  worldKicker: string;
  worldTitle: string;
  worldPhrase: string;
  worldItems: readonly string[];
  sourcesKicker: string;
  sourcesTitle: string;
  sourcesPhrase: string;
  sourcesItems: readonly string[];

  echelleKicker: string;
  echelleTitle: string;
  echelleTitleEm: string;
  echelleLede: string;

  outilsKicker: string;
  outilsTitle: string;
  outilsTitleEm: string;
  outils: readonly { title: string; body: string }[];

  histKicker: string;
  histTitle: string;
  histTitleEm: string;
  histQuote: string;

  ctaClose: string;
  ctaCloseEm: string;
  ctaCloseBtn: string;

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
  ariaSeam: string;
  seamLabel: string;
}

const COPY_FR: Copy = {
  heroKicker: "Apprenant·e·s",
  heroTitle: "Une langue vous sépare de votre but.",
  heroTitleEm: "On la met à portée.",
  heroLede: "Que le but soit ailleurs ou chez vous, la langue est le dernier verrou. La maison YEMA vous en donne la clé.",
  ctaPrimary: "Commencer gratuitement",
  ctaSecondary: "Passer le test",

  cheminsKicker: "Les deux chemins",
  cheminsTitle: "Le monde qui ouvre.",
  cheminsTitleEm: "La maison qui reste.",
  worldKicker: "Voyage vers le monde",
  worldTitle: "Partir. Étudier. Travailler.",
  worldPhrase: "L'allemand pour un master, l'anglais pour un poste, le français pour une famille, l'espagnol pour un continent. L'échelle CECRL structure le chemin.",
  worldItems: [
    "Préparer un visa, un dossier universitaire",
    "Passer un entretien technique ou administratif",
    "Comprendre les documents officiels",
    "Se sentir chez soi dans un pays d'accueil",
  ],
  sourcesKicker: "Retour aux sources",
  sourcesTitle: "Rester. Transmettre. Rejoindre.",
  sourcesPhrase: "Le wolof que la grand-mère parle. Le bassa que le père garde. Le lingala qui traverse les générations. L'échelle YEMA (É1 Écoute → É5 Foyer) trace ce retour.",
  sourcesItems: [
    "Comprendre les histoires du foyer",
    "Répondre à un aîné dans sa langue",
    "Enseigner un mot à ses enfants",
    "Rejoindre la conversation familiale",
  ],

  echelleKicker: "L'échelle",
  echelleTitle: "Un palier.",
  echelleTitleEm: "Une compétence.",
  echelleLede: "Passez sur un niveau — la maison vous montre ce que vous saurez faire.",

  outilsKicker: "Les outils",
  outilsTitle: "Quatre pièces.",
  outilsTitleEm: "Un seul apprentissage.",
  outils: [
    { title: "Votre écrit, relu et expliqué", body: "Chaque texte est lu, corrigé, expliqué. Pas un score — une lecture attentive de ce que vous vouliez dire." },
    { title: "Des voix réelles à écouter", body: "Voix réelles, scénarios réels. Café, banque, entretien, aînée — vous vous entendez parler avant d'y être." },
    { title: "Des questions à votre niveau", body: "Le quiz révise ce que vous oubliez. Il passe ce que vous savez. Il ne perd pas votre temps." },
    { title: "Un enseignant accrédité, si vous le souhaitez", body: "Accrédité·e par la maison. Humain·e. Il ou elle décide de ce qui compte pour votre parcours." },
  ],

  histKicker: "Une histoire",
  histTitle: "Fatima, Francfort.",
  histTitleEm: "Grandir sur place.",
  histQuote: "Le passeport, on ne l'obtient pas avec l'accent. Alors j'apprends chaque soir.",

  ctaClose: "Votre première leçon est gratuite.",
  ctaCloseEm: "Aujourd'hui.",
  ctaCloseBtn: "Commencer maintenant",

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
  ariaSeam: "Transition vers le territoire des sources",
  seamLabel: "La couture entre les deux chemins",
};

const COPY_EN: Copy = {
  heroKicker: "Learners",
  heroTitle: "One language stands between you and your goal.",
  heroTitleEm: "We put it within reach.",
  heroLede: "Whether the goal is far or at home, the language is the last lock. The YEMA house gives you the key.",
  ctaPrimary: "Start, free",
  ctaSecondary: "Take the test",

  cheminsKicker: "The two paths",
  cheminsTitle: "The world that opens.",
  cheminsTitleEm: "The home that stays.",
  worldKicker: "A journey outward",
  worldTitle: "Leave. Study. Work.",
  worldPhrase: "German for a master's, English for a role, French for a family, Spanish for a continent. The CEFR scale structures the path.",
  worldItems: [
    "Prepare a visa, a university file",
    "Pass a technical or administrative interview",
    "Understand official documents",
    "Feel at home in a host country",
  ],
  sourcesKicker: "A return to the source",
  sourcesTitle: "Stay. Pass on. Return.",
  sourcesPhrase: "The Wolof the grandmother speaks. The Bassa the father keeps. The Lingala that crosses generations. The YEMA scale (É1 Listen → É5 Home) traces this return.",
  sourcesItems: [
    "Understand the stories of the home",
    "Answer an elder in their language",
    "Teach a word to your children",
    "Join the family conversation",
  ],

  echelleKicker: "The scale",
  echelleTitle: "One stage.",
  echelleTitleEm: "One skill.",
  echelleLede: "Hover over a level — the house shows you what you'll be able to do.",

  outilsKicker: "The tools",
  outilsTitle: "Four rooms.",
  outilsTitleEm: "One learning.",
  outils: [
    { title: "Your writing, read and explained", body: "Each text is read, corrected, explained. Not a score — a careful reading of what you meant." },
    { title: "Real voices to listen to", body: "Real voices, real scenarios. Café, bank, interview, elder — you hear yourself speak before you're there." },
    { title: "Questions at your level", body: "The quiz reviews what you forget. Skips what you know. Doesn't waste your time." },
    { title: "An accredited teacher, if you wish", body: "Accredited by the house. Human. They decide what matters for your path." },
  ],

  histKicker: "A story",
  histTitle: "Fatima, Frankfurt.",
  histTitleEm: "Growing on place.",
  histQuote: "You don't get the passport with an accent. So I learn every evening.",

  ctaClose: "Your first lesson is free.",
  ctaCloseEm: "Today.",
  ctaCloseBtn: "Start now",

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
  ariaSeam: "Transition to the sources territory",
  seamLabel: "The seam between the two paths",
};

export default function ElevesPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

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
          features: c.navFeatures,
          levels: c.navLevels,
          pricing: c.navPricing,
          centers: c.navCenters,
          login: c.navLogin,
          register: c.navRegister,
        }}
      />

      <main className="chemin-page">
        {/* HERO */}
        <section className="chemin-hero" aria-labelledby="chemin-hero-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.heroKicker)}</p>
            <h1 id="chemin-hero-h" className="chemin-hero-h">
              {t(c.heroTitle)} <em>{t(c.heroTitleEm)}</em>
            </h1>
            <p className="chemin-hero-lede">{t(c.heroLede)}</p>
            <div className="chemin-hero-ctas">
              <Link href={`/${locale}/register`} className="maison-porte-cta">
                {t(c.ctaPrimary)}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                     strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
              <Link href={`/${locale}/test-niveau`} className="maison-link-strong">
                {t(c.ctaSecondary)}
              </Link>
            </div>
          </div>
        </section>

        {/* LES DEUX CHEMINS */}
        <section className="chemin-paths" aria-labelledby="chemin-paths-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.cheminsKicker)}</p>
              <h2 id="chemin-paths-h" className="maison-h">
                {t(c.cheminsTitle)} <em>{t(c.cheminsTitleEm)}</em>
              </h2>
            </div>
          </div>

          <div className="chemin-paths-blocks">
            <div className="chemin-path chemin-path-world">
              <div className="maison-container">
                <p className="maison-kicker">{t(c.worldKicker)}</p>
                <h3 className="chemin-path-h">{t(c.worldTitle)}</h3>
                <p className="chemin-path-phrase">{t(c.worldPhrase)}</p>
                <ul className="chemin-path-list">
                  {c.worldItems.map((it) => (
                    <li key={it}>{t(it)}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Seam ariaLabel={c.ariaSeam} />

            <div className="chemin-path chemin-path-sources">
              <div className="maison-container">
                <p className="maison-kicker">{t(c.sourcesKicker)}</p>
                <h3 className="chemin-path-h">{t(c.sourcesTitle)}</h3>
                <p className="chemin-path-phrase">{t(c.sourcesPhrase)}</p>
                <ul className="chemin-path-list">
                  {c.sourcesItems.map((it) => (
                    <li key={it}>{t(it)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* L'ÉCHELLE INTERACTIVE */}
        <section className="chemin-echelle" aria-labelledby="chemin-echelle-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.echelleKicker)}</p>
              <h2 id="chemin-echelle-h" className="maison-h">
                {t(c.echelleTitle)} <em>{t(c.echelleTitleEm)}</em>
              </h2>
              <p className="maison-lede">{t(c.echelleLede)}</p>
            </div>
            <div className="chemin-echelle-holder">
              <CefrSpine current="A1" locale={loc} />
            </div>
          </div>
        </section>

        {/* LES OUTILS · 4 cartes */}
        <section className="chemin-outils" aria-labelledby="chemin-outils-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.outilsKicker)}</p>
              <h2 id="chemin-outils-h" className="maison-h">
                {t(c.outilsTitle)} <em>{t(c.outilsTitleEm)}</em>
              </h2>
            </div>
            <div className="chemin-outils-grid">
              {c.outils.map((o, i) => (
                <article key={i} className="chemin-outil">
                  <div className="chemin-outil-icon" aria-hidden="true">
                    <ToolIcon idx={i} />
                  </div>
                  <h3 className="chemin-outil-h">{t(o.title)}</h3>
                  <p className="chemin-outil-p">{t(o.body)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* UNE HISTOIRE */}
        <section className="chemin-histoire" aria-labelledby="chemin-histoire-h">
          <div className="maison-container chemin-histoire-inner">
            <div className="chemin-histoire-portrait">
              <PortraitSpeaking
                name="Fatima"
                variant="world"
                size="lg"
                lang={loc === "en" ? "German" : "allemand"}
                audioSrc="/audio/voix/fatima-allemand.mp3"
                transcript={c.histQuote}
                mono="F"
                listenLabel={loc === "en" ? "Listen" : "Écouter"}
                src="/portraits/fatima.avif"
              />
            </div>
            <div className="chemin-histoire-body">
              <p className="maison-kicker">{t(c.histKicker)}</p>
              <h2 id="chemin-histoire-h" className="maison-h">
                {t(c.histTitle)} <em>{t(c.histTitleEm)}</em>
              </h2>
              <blockquote className="chemin-histoire-quote">
                <p>« {t(c.histQuote)} »</p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="chemin-cta-close">
          <div className="maison-container maison-porte-inner">
            <h2 className="maison-porte-h">
              {t(c.ctaClose)} <em>{t(c.ctaCloseEm)}</em>
            </h2>
            <Link href={`/${locale}/register`} className="maison-porte-cta">
              {t(c.ctaCloseBtn)}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
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

// Icônes mono-trait laiton pour les 4 outils.
function ToolIcon({ idx }: { idx: number }) {
  const stroke = "currentColor";
  const props = { width: 26, height: 26, viewBox: "0 0 26 26", fill: "none", stroke, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (idx === 0) return <svg {...props}><path d="M4 6h14M4 11h18M4 16h12M18 20l3-3M18 20l3 3" /></svg>;
  if (idx === 1) return <svg {...props}><circle cx="13" cy="13" r="9" /><path d="M13 6v14M9 9v8M17 9v8M5 12v2M21 12v2" /></svg>;
  if (idx === 2) return <svg {...props}><path d="M4 5h18v14H4z" /><path d="M8 10h10M8 14h6" /><circle cx="19" cy="19" r="3" /><path d="M17.5 19.2l1 1 2-2.2" /></svg>;
  return <svg {...props}><circle cx="13" cy="9" r="4" /><path d="M6 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /></svg>;
}

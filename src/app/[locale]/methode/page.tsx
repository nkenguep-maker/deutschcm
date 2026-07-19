"use client";

// /methode · Sprint 4 « Les fondations ».
// Six principes au présent. Quand un principe se prête aux deux
// territoires, il porte deux exemples : un world (allemand) et un
// sources (natale). Le 6e principe pose l'enseignant au centre —
// la machine prépare et corrige le répétitif, la prof décide et
// transmet.
// Clôture : Teaser « Chaque langue apportera ses propres règles à
// cette méthode. *Certaines s'écrivent en ce moment.* »

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Teaser } from "@/components/maison/Teaser";
import { frTypo } from "@/components/landing/typo";

interface Example {
  cap: string;
  quote: string;
  gloss: string;
}
interface Principle {
  tag: string;
  title: string;
  body: string;
  world?: Example;
  sources?: Example;
}

const PRINCIPLES_FR: readonly Principle[] = [
  {
    tag: "Principe 01 · Contexte",
    title: "Un mot vit dans une scène — pas dans une liste.",
    body: "On n'apprend pas « der Bäcker » comme un mot isolé — on l'apprend en poussant la porte d'une boulangerie de Berlin à sept heures du matin. La règle vaut partout : le wolof s'apprend à Sandaga, le bassa s'entend à Édéa, le swahili se déploie sur la côte est. Chaque module part d'une scène.",
    world: {
      cap: "Allemand · A1",
      quote: "Zwei Brötchen, bitte.",
      gloss: "Deux petits pains, s'il vous plaît.",
    },
    sources: {
      cap: "Wolof · É1",
      quote: "Na nga def ?",
      gloss: "Comment vas-tu ?",
    },
  },
  {
    tag: "Principe 02 · Structure",
    title: "Comprendre pourquoi — avant de mémoriser comment.",
    body: "Chaque langue a ses règles claires. Une règle par leçon, appliquée trois fois dans trois contextes. Répétition espacée, pas bourrage. En allemand la déclinaison, en bassa les tons, en wolof la classe nominale — même méthode : rendre la règle utile avant qu'elle soit belle.",
    world: {
      cap: "Allemand · A2",
      quote: "Ich bin nach Berlin gefahren.",
      gloss: "Auxiliaire « sein » quand on change de lieu — pas « haben ».",
    },
    sources: {
      cap: "Bassa · É2",
      quote: "Mə́ nlámbá ndap.",
      gloss: "Le ton bas ouvre la phrase — le sens change avec la mélodie.",
    },
  },
  {
    tag: "Principe 03 · Oral",
    title: "Parler tôt — se tromper vite, se corriger précis.",
    body: "Attendre B1 (ou É3 en YEMA) pour parler est un piège. Dès la première leçon, le coach IA entraîne dans des scénarios réels : commander un café en allemand, saluer une aînée en bassa, prendre un rendez-vous en anglais. Correction immédiate sur trois axes — grammaire, vocabulaire, pertinence culturelle.",
    world: {
      cap: "Allemand · A1",
      quote: "Guten Tag, ich hätte gern einen Termin.",
      gloss: "Bonjour, je souhaiterais un rendez-vous.",
    },
    sources: {
      cap: "Lingala · É1",
      quote: "Mbote — nakoki kolobana na yo ?",
      gloss: "Bonjour — puis-je te parler ?",
    },
  },
  {
    tag: "Principe 04 · Écrit",
    title: "Écrire — c'est structurer sa pensée dans la langue.",
    body: "L'écrit n'est pas un supplément d'oral. C'est une compétence à part qui organise la langue. Modules Schreiben en allemand du A2 au C1. La correction ne donne pas seulement un score — elle explique.",
    world: {
      cap: "Allemand · B1",
      quote: "Sehr geehrte Frau Schmidt,",
      gloss: "Formule d'ouverture d'une lettre formelle — jamais « Hallo ».",
    },
    sources: {
      cap: "Wolof · É3",
      quote: "Kaaraange — laa tudd Bintou.",
      gloss: "Je suis, je m'appelle Bintou — l'écrit s'ouvre à partir du récit.",
    },
  },
  {
    tag: "Principe 05 · Culture",
    title: "Une langue vit dans une culture. On l'enseigne aussi.",
    body: "Comprendre le « Feierabend » (fin de journée sacrée en Allemagne), savoir que le tutoiement se demande, connaître le « teranga » wolof (l'accueil comme devoir) — ces détails font la différence entre parler et parler comme un locuteur. Chaque module accueille une note culturelle courte.",
    world: {
      cap: "Allemand · culture",
      quote: "Schönen Feierabend !",
      gloss: "Ce qu'on dit à un collègue le soir. Sacré.",
    },
    sources: {
      cap: "Wolof · culture",
      quote: "Teranga.",
      gloss: "L'accueil comme devoir — pas comme faveur.",
    },
  },
  {
    tag: "Principe 06 · L'humain",
    title: "L'enseignant au cœur. L'outil à ses côtés.",
    body: "La machine prépare, corrige le répétitif, signale. L'enseignant décide, encourage, transmet. Cet ordre ne s'inversera jamais.",
    world: {
      cap: "Ce que l'outil fait",
      quote: "Il propose. Il corrige. Il alerte quand un·e élève décroche.",
      gloss: "L'enseignant·e décide, intervient, transmet.",
    },
  },
];

const PRINCIPLES_EN: readonly Principle[] = [
  {
    tag: "Principle 01 · Context",
    title: "A word lives in a scene — not a list.",
    body: "You don't learn \"der Bäcker\" as an isolated word — you learn it pushing open a Berlin bakery door at seven in the morning. The rule holds everywhere: Wolof learns at Sandaga, Bassa carries at Édéa, Swahili spreads along the east coast. Every module starts with a scene.",
    world: {
      cap: "German · A1",
      quote: "Zwei Brötchen, bitte.",
      gloss: "Two rolls, please.",
    },
    sources: {
      cap: "Wolof · É1",
      quote: "Na nga def?",
      gloss: "How are you?",
    },
  },
  {
    tag: "Principle 02 · Structure",
    title: "Understand why — before memorizing how.",
    body: "Every language has clear rules. One rule per lesson, applied three times in three contexts. Spaced repetition, not cramming. German declension, Bassa tones, Wolof noun class — same method: make the rule useful before it becomes beautiful.",
    world: {
      cap: "German · A2",
      quote: "Ich bin nach Berlin gefahren.",
      gloss: "\"Sein\" when the place changes — never \"haben\".",
    },
    sources: {
      cap: "Bassa · É2",
      quote: "Mə́ nlámbá ndap.",
      gloss: "The low tone opens the sentence — meaning shifts with melody.",
    },
  },
  {
    tag: "Principle 03 · Oral",
    title: "Speak early — mistakes fast, corrections precise.",
    body: "Waiting for B1 (or É3 at YEMA) to speak is a trap. From the first lesson, the AI coach trains through real scenarios: order a coffee in German, greet an elder in Bassa, book an appointment in English. Immediate correction on three axes — grammar, vocabulary, cultural fit.",
    world: {
      cap: "German · A1",
      quote: "Guten Tag, ich hätte gern einen Termin.",
      gloss: "Hello, I would like an appointment.",
    },
    sources: {
      cap: "Lingala · É1",
      quote: "Mbote — nakoki kolobana na yo?",
      gloss: "Hello — may I speak with you?",
    },
  },
  {
    tag: "Principle 04 · Written",
    title: "Writing — is thinking, structured in the language.",
    body: "Writing isn't a supplement to speech. It's a distinct skill that organizes the language. Schreiben modules in German from A2 to C1. Correction doesn't just give a score — it explains.",
    world: {
      cap: "German · B1",
      quote: "Sehr geehrte Frau Schmidt,",
      gloss: "Formal letter opening — never \"Hallo\".",
    },
    sources: {
      cap: "Wolof · É3",
      quote: "Kaaraange — laa tudd Bintou.",
      gloss: "I am, I'm called Bintou — writing opens from the narrative.",
    },
  },
  {
    tag: "Principle 05 · Culture",
    title: "A language lives inside a culture. We teach that too.",
    body: "Understanding \"Feierabend\" (sacred end-of-day in Germany), knowing informal address is asked for, recognizing Wolof \"teranga\" (hospitality as a duty) — these details make the difference between speaking and speaking like a local. Every module carries a short cultural note.",
    world: {
      cap: "German · culture",
      quote: "Schönen Feierabend!",
      gloss: "What you say to a colleague at day's end. Sacred.",
    },
    sources: {
      cap: "Wolof · culture",
      quote: "Teranga.",
      gloss: "Hospitality as a duty — not as a favor.",
    },
  },
  {
    tag: "Principle 06 · The human",
    title: "The teacher at the heart. The tool at their side.",
    body: "The machine prepares, handles the repetitive corrections, flags. The teacher decides, encourages, transmits. This order will never reverse.",
    world: {
      cap: "What the tool does",
      quote: "It proposes. It corrects. It alerts when a learner slips.",
      gloss: "The teacher decides, steps in, passes on.",
    },
  },
];

interface Copy {
  eye: string;
  title: string;
  titleEm: string;
  lede: string;
  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  cta: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
}

const COPY_FR: Copy = {
  eye: "La méthode",
  title: "Six principes.",
  titleEm: "Toutes les langues.",
  lede: "Les mêmes six principes guident chaque module publié — que la langue soit étrangère ou natale. Chaque principe se démontre par la scène.",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  cta: "Ouvrir une leçon",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "Construit au Cameroun, pour le continent et le monde",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  eye: "The method",
  title: "Six principles.",
  titleEm: "All languages.",
  lede: "The same six principles guide every module we publish — whether the language is foreign or native. Each principle proves itself through the scene.",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  cta: "Open a lesson",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Built in Cameroon, for the continent and the world",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
};

export default function MethodePage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const principles = loc === "en" ? PRINCIPLES_EN : PRINCIPLES_FR;
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

      <main className="methode-page">
        <section className="methode-head" aria-labelledby="methode-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.eye)}</p>
            <h1 id="methode-h" className="maison-h">
              {t(c.title)} <em>{t(c.titleEm)}</em>
            </h1>
            <p className="maison-lede">{t(c.lede)}</p>
          </div>
        </section>

        <div className="methode-principles">
          {principles.map((p, i) => (
            <section key={i} className="methode-principle">
              <div className="maison-container methode-principle-grid">
                <div className="methode-principle-tag">
                  <span className="methode-principle-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="methode-principle-lbl">{p.tag}</span>
                </div>
                <div className="methode-principle-body">
                  <h2 className="methode-principle-h">{t(p.title)}</h2>
                  <p className="methode-principle-p">{t(p.body)}</p>
                  <div className="methode-examples">
                    {p.world ? (
                      <div className="methode-example methode-example-world">
                        <p className="methode-example-cap">{p.world.cap}</p>
                        <p className="methode-example-quote">{p.world.quote}</p>
                        <p className="methode-example-gloss">{t(p.world.gloss)}</p>
                      </div>
                    ) : null}
                    {p.sources ? (
                      <div className="methode-example methode-example-sources">
                        <p className="methode-example-cap">{p.sources.cap}</p>
                        <p className="methode-example-quote">{p.sources.quote}</p>
                        <p className="methode-example-gloss">{t(p.sources.gloss)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <Teaser
          locale={loc}
          line1={loc === "en" ? "Every language will bring its own rules to this method." : "Chaque langue apportera ses propres règles à cette méthode."}
          line2={loc === "en" ? "Some are being written right now." : "Certaines s'écrivent en ce moment."}
        />

        <div className="methode-cta">
          <a href={`/${locale}/register`} className="maison-porte-cta">
            {t(c.cta)}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
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

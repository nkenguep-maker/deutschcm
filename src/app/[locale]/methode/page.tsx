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
  /** Uniquement les phrases natales · validated=true après relecture
   *  par un locuteur natif (tons, orthographe, sens). Non validée →
   *  l'exemple est masqué en prod, seul le world reste. Aucune phrase
   *  native non validée ne doit atteindre l'audience finale. */
  validated?: boolean;
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
    title: "Le mot vit dans une scène.",
    body: "On n'apprend pas « der Bäcker » comme un mot d'une liste. On l'apprend en poussant la porte d'une boulangerie de Berlin, à sept heures du matin. C'est vrai partout. Le wolof se travaille au marché Sandaga. Le bassa s'entend à Édéa. Le swahili se parle sur la côte est. Chaque module démarre par une scène.",
    world: {
      cap: "Allemand · A1",
      quote: "Zwei Brötchen, bitte.",
      gloss: "Deux petits pains, s'il vous plaît.",
    },
    sources: {
      cap: "Wolof · É1",
      quote: "Na nga def ?",
      gloss: "Comment vas-tu ?",
      validated: false,
    },
  },
  {
    tag: "Principe 02 · Structure",
    title: "Le pourquoi d'abord.",
    body: "Chaque langue a ses règles. On en prend une par leçon, et on la rejoue dans plusieurs contextes différents, à quelques jours d'intervalle. Pas de bourrage. Que ce soit la déclinaison en allemand ou les tons en bassa, la méthode reste la même. On veut que la règle serve.",
    world: {
      cap: "Allemand · A2",
      quote: "Ich bin nach Berlin gefahren.",
      gloss: "Auxiliaire « sein » quand on change de lieu. Jamais « haben ».",
    },
    sources: {
      cap: "Bassa · É2",
      quote: "Mə́ nlámbá ndap.",
      gloss: "Le ton bas ouvre la phrase — le sens change avec la mélodie.",
      validated: false,
    },
  },
  {
    tag: "Principe 03 · Oral",
    title: "Parler tôt, quitte à se tromper.",
    body: "Attendre B1 pour parler est un piège. Dès la première leçon, vous jouez des scènes. Un café à commander en allemand. Une aînée à saluer en bassa. Un rendez-vous à prendre en anglais. La correction arrive tout de suite : la grammaire, le vocabulaire, et ce qui se dit vraiment dans la culture.",
    world: {
      cap: "Allemand · A1",
      quote: "Guten Tag, ich hätte gern einen Termin.",
      gloss: "Bonjour, je souhaiterais un rendez-vous.",
    },
    sources: {
      cap: "Lingala · É1",
      quote: "Mbote — nakoki kolobana na yo ?",
      gloss: "Bonjour — puis-je te parler ?",
      validated: false,
    },
  },
  {
    tag: "Principe 04 · Écrit",
    title: "Écrire, c'est structurer sa pensée.",
    body: "L'écrit n'est pas juste de l'oral qu'on pose sur papier. C'est une compétence en soi, qui structure la langue. On la travaille avec les modules Schreiben, en allemand, du A2 jusqu'au C1. Quand la correction arrive, elle ne se contente pas de noter. Elle explique pourquoi.",
    world: {
      cap: "Allemand · B1",
      quote: "Sehr geehrte Frau Schmidt,",
      gloss: "Formule d'ouverture d'une lettre formelle. Jamais « Hallo ».",
    },
    sources: {
      cap: "Wolof · É3",
      quote: "Kaaraange — laa tudd Bintou.",
      gloss: "Je suis, je m'appelle Bintou — l'écrit s'ouvre à partir du récit.",
      validated: false,
    },
  },
  {
    tag: "Principe 05 · Culture",
    title: "Une langue vit dans une culture. On l'enseigne aussi.",
    body: "Certaines choses ne s'apprennent pas dans une grammaire. Le « Feierabend » allemand, cette fin de journée qu'on ne dérange pas. Le tutoiement, qui se demande d'abord. Le « teranga » wolof, qui fait de l'accueil un devoir. Ces petits détails changent tout. Chaque module glisse une note culturelle, très courte.",
    world: {
      cap: "Allemand · culture",
      quote: "Schönen Feierabend !",
      gloss: "Ce qu'on dit à un collègue le soir. Sacré.",
    },
    sources: {
      cap: "Wolof · culture",
      quote: "Teranga.",
      gloss: "L'accueil comme devoir — pas comme faveur.",
      validated: false,
    },
  },
  {
    tag: "Principe 06 · L'humain",
    title: "L'enseignant au cœur.",
    body: "La machine prépare le matériel. Elle corrige les fautes évidentes et repère quand quelqu'un décroche. Le reste, c'est l'enseignant. Il décide, il encourage, il transmet. Cet ordre ne s'inversera jamais.",
    world: {
      cap: "Ce que l'outil fait",
      quote: "Il propose des exercices et corrige le répétitif. Il signale aussi quand quelqu'un décroche.",
      gloss: "L'enseignant garde la main.",
    },
  },
];

const PRINCIPLES_EN: readonly Principle[] = [
  {
    tag: "Principle 01 · Context",
    title: "Words live in scenes.",
    body: "You don't learn \"der Bäcker\" as a word from a list. You learn it pushing open a Berlin bakery door, at seven in the morning. The same is true everywhere. Wolof lives in the Sandaga market. Bassa carries at Édéa. Swahili is spoken along the east coast. Every module starts with a scene.",
    world: {
      cap: "German · A1",
      quote: "Zwei Brötchen, bitte.",
      gloss: "Two rolls, please.",
    },
    sources: {
      cap: "Wolof · É1",
      quote: "Na nga def?",
      gloss: "How are you?",
      validated: false,
    },
  },
  {
    tag: "Principle 02 · Structure",
    title: "The why comes first.",
    body: "Every language has rules. We take one per lesson, and we replay it in different contexts, a few days apart. No cramming. Whether it's German declension or Bassa tones, the approach stays the same. We want the rule to be useful.",
    world: {
      cap: "German · A2",
      quote: "Ich bin nach Berlin gefahren.",
      gloss: "\"Sein\" when the place changes. Never \"haben\".",
    },
    sources: {
      cap: "Bassa · É2",
      quote: "Mə́ nlámbá ndap.",
      gloss: "The low tone opens the sentence — meaning shifts with melody.",
      validated: false,
    },
  },
  {
    tag: "Principle 03 · Oral",
    title: "Speak early, mistakes allowed.",
    body: "Waiting for B1 to speak is a trap. From the first lesson, you play scenes. A coffee to order in German. An elder to greet in Bassa. An appointment to book in English. The correction comes right away: grammar, vocabulary, and what's actually said in the culture.",
    world: {
      cap: "German · A1",
      quote: "Guten Tag, ich hätte gern einen Termin.",
      gloss: "Hello, I would like an appointment.",
    },
    sources: {
      cap: "Lingala · É1",
      quote: "Mbote — nakoki kolobana na yo?",
      gloss: "Hello — may I speak with you?",
      validated: false,
    },
  },
  {
    tag: "Principle 04 · Written",
    title: "Writing structures thought.",
    body: "Writing isn't spoken language put on paper. It's a skill of its own, one that structures the language. You work on it through the Schreiben modules, in German, from A2 up to C1. When the correction lands, it doesn't just give a score. It tells you why.",
    world: {
      cap: "German · B1",
      quote: "Sehr geehrte Frau Schmidt,",
      gloss: "Formal letter opening. Never \"Hallo\".",
    },
    sources: {
      cap: "Wolof · É3",
      quote: "Kaaraange — laa tudd Bintou.",
      gloss: "I am, I'm called Bintou — writing opens from the narrative.",
      validated: false,
    },
  },
  {
    tag: "Principle 05 · Culture",
    title: "A language lives inside a culture. We teach that too.",
    body: "Some things aren't in the grammar. The German \"Feierabend\", that end-of-day you don't interrupt. Informal address, which is asked for first. The Wolof \"teranga\", which turns hospitality into a duty. Those small things change everything. Every module carries a short cultural note.",
    world: {
      cap: "German · culture",
      quote: "Schönen Feierabend!",
      gloss: "What you say to a colleague at day's end. Sacred.",
    },
    sources: {
      cap: "Wolof · culture",
      quote: "Teranga.",
      gloss: "Hospitality as a duty — not as a favor.",
      validated: false,
    },
  },
  {
    tag: "Principle 06 · The human",
    title: "The teacher at the heart.",
    body: "The machine prepares the material. It handles the obvious corrections and flags when someone slips. The rest is the teacher's job. They decide, they encourage, they pass on. This order will never reverse.",
    world: {
      cap: "What the tool does",
      quote: "It offers exercises and corrects the repetitive. It also flags when someone slips.",
      gloss: "The teacher keeps the lead.",
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
  lede: "Ces six principes guident chaque module qu'on publie, en langue étrangère comme en natale. On ne les récite pas. On les montre dans une scène.",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  cta: "Ouvrir une leçon",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
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
  lede: "These six principles guide every module we publish, in foreign languages as in native ones. We don't recite them. We show them in a scene.",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  cta: "Open a lesson",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
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
                    {/* Gate technique · un exemple natal apparaît
                        uniquement quand validated !== false. Toute
                        phrase (tons, orthographe, sens) doit être
                        relue par un locuteur natif avant prod ; en
                        attendant, seul l'exemple world reste — le
                        principe garde son sens sans transiger sur
                        la justesse de la langue natale. */}
                    {p.sources && p.sources.validated !== false ? (
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

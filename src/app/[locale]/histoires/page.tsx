"use client";

// /histoires · Sprint 3 « Le mur entier ».
// Cinq parcours en <PortraitSpeaking> plein format. Chaque carte
// prend le fond de son territoire :
//   · world  (espresso) : Aïcha, Kevin, Fatima, Jean (allemand)
//   · sources (terre)   : Bintou (wolof)
// Chaque portrait porte : la phrase audio dans SA langue (bouton écoute,
// anneau brass qui se peint), un récit court, un résultat en mono
// (niveau atteint / cap).
// Clôture : Teaser « La sixième histoire n'est pas écrite. *C'est peut-
// être la vôtre.* » + CTA unique → /register.

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { PortraitSpeaking } from "@/components/PortraitSpeaking";
import { Teaser } from "@/components/maison/Teaser";
import { frTypo } from "@/components/landing/typo";

type Territory = "world" | "sources";

interface Story {
  id: string;
  mono: string;
  name: string;
  city: string;
  cityEn: string;
  year: string;
  level: string;
  levelEn: string;
  headline: string;
  headlineEn: string;
  quote: string;
  quoteEn: string;
  body: string;
  bodyEn: string;
  goalLbl: string;
  goalLblEn: string;
  goal: string;
  goalEn: string;
  territory: Territory;
  portraitSrc?: string;
  audioSrc?: string;
  /** Langue de la phrase audio (français d'affichage). */
  audioLang: string;
  audioLangEn: string;
}

const STORIES: readonly Story[] = [
  {
    id: "bintou",
    mono: "B",
    name: "Bintou",
    city: "Paris, diaspora sénégalaise",
    cityEn: "Paris, Senegalese diaspora",
    year: "2026",
    level: "É1 · Écoute",
    levelEn: "É1 · Listen",
    headline: "Elle veut parler wolof à sa grand-mère.",
    headlineEn: "She wants to speak Wolof with her grandmother.",
    quote: "Ma grand-mère me raconte des histoires que je ne comprends qu'à moitié. YEMA me donne les mots pour lui répondre — pas juste hocher la tête.",
    quoteEn: "My grandmother tells me stories I only half understand. YEMA gives me the words to answer — not just nod.",
    body: "Bintou est née en France de parents sénégalais. Le wolof, elle l'entend depuis toujours mais ne l'a jamais parlé. Elle commence par l'écoute — le palier É1. Ce n'est pas la maîtrise qu'elle vise, c'est de rejoindre la conversation familiale.",
    bodyEn: "Bintou was born in France to Senegalese parents. She has always heard Wolof but never spoken it. She starts with listening — the É1 stage. She isn't chasing mastery — she wants to join the family conversation.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Rendre visite à sa grand-mère à Louga en tenant une conversation en wolof.",
    goalEn: "Visit her grandmother in Louga, holding a real conversation in Wolof.",
    territory: "sources",
    portraitSrc: "/portraits/bintou.avif",
    audioSrc: "/audio/portraits/bintou.mp3",
    audioLang: "wolof",
    audioLangEn: "Wolof",
  },
  {
    id: "aicha",
    mono: "A",
    name: "Aïcha",
    city: "Yaoundé, Cameroun",
    cityEn: "Yaoundé, Cameroon",
    year: "2026",
    level: "A2 → B1 en huit mois",
    levelEn: "A2 → B1 in eight months",
    headline: "Elle voulait comprendre les mails de sa tutrice à Fribourg.",
    headlineEn: "She wanted to read her tutor's emails from Freiburg.",
    quote: "Je pensais que l'allemand serait un mur. En fait, c'est une porte — YEMA m'a montré comment la pousser.",
    quoteEn: "I thought German would be a wall. Turns out it's a door — YEMA showed me how to push it open.",
    body: "Aïcha prépare un Master en génie civil à Fribourg. Elle a commencé par le vocabulaire administratif d'un dossier universitaire, puis a basculé vers la conversation avec Klaus, le coach IA. Trois soirs par semaine, quarante minutes chaque fois.",
    bodyEn: "Aïcha is preparing a Master's in civil engineering in Freiburg. She started with administrative vocabulary from her university file, then moved to conversation with Klaus, the AI coach. Three evenings a week, forty minutes each.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Atteindre B2 avant l'entretien du semestre d'automne.",
    goalEn: "Reach B2 before the autumn semester interview.",
    territory: "world",
    portraitSrc: "/portraits/aicha.avif",
    audioSrc: "/audio/portraits/aicha.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
  {
    id: "kevin",
    mono: "K",
    name: "Kevin",
    city: "Douala, Cameroun",
    cityEn: "Douala, Cameroon",
    year: "2026",
    level: "A1 en quatre mois",
    levelEn: "A1 in four months",
    headline: "Il a appris l'allemand en écoutant le tramway de Berlin.",
    headlineEn: "He learned German listening to the Berlin tram.",
    quote: "Je n'ai jamais compris pourquoi der/die/das. Le module Grammatik de YEMA a mis ça au clair en dix minutes.",
    quoteEn: "I never got why der/die/das. YEMA's Grammatik module made it click in ten minutes.",
    body: "Kevin est développeur. Il vise un poste chez une entreprise berlinoise. Il a commencé par les cinquante mots les plus utiles du quotidien professionnel, puis a construit son vocabulaire technique. Sa signature YEMA au quotidien : le simulateur avec Klaus.",
    bodyEn: "Kevin is a developer. He's aiming for a job in a Berlin company. He started with the fifty most useful words of professional daily life, then built up his technical vocabulary. His daily YEMA signature: the scenario simulator with Klaus.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Passer un premier entretien technique en allemand d'ici décembre.",
    goalEn: "Pass a first technical interview in German by December.",
    territory: "world",
    portraitSrc: "/portraits/kevin.avif",
    audioSrc: "/audio/portraits/kevin.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
  {
    id: "fatima",
    mono: "F",
    name: "Fatima",
    city: "Bafoussam, Cameroun",
    cityEn: "Bafoussam, Cameroon",
    year: "2026",
    level: "A2 confirmé",
    levelEn: "A2 confirmed",
    headline: "Elle enseigne — et elle apprend avec ses élèves.",
    headlineEn: "She teaches — and she learns with her students.",
    quote: "YEMA est ma classe parallèle. Les explications sont en français, mais l'allemand reste au cœur — c'est ça qui manque ailleurs.",
    quoteEn: "YEMA is my parallel classroom. Explanations are in French, but German stays at the core — that's what I don't find elsewhere.",
    body: "Fatima enseigne l'allemand au lycée depuis six ans. Elle utilise YEMA pour rafraîchir ses propres compétences et donner à ses élèves un accès continu entre deux cours. Elle apprécie la correction Schreiben — plus fine que celle qu'elle peut poser sur trente copies.",
    bodyEn: "Fatima has taught German at high school for six years. She uses YEMA to refresh her own skills and give her students continuous access between two lessons. She particularly values the Schreiben correction — finer than what she can put down on thirty essays.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Amener sa classe de première à un vrai A2 dans l'année.",
    goalEn: "Bring her first-year class to a real A2 within the year.",
    territory: "world",
    portraitSrc: "/portraits/fatima.avif",
    audioSrc: "/audio/portraits/fatima.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
  {
    id: "jean",
    mono: "J",
    name: "Jean",
    city: "Édéa, Cameroun",
    cityEn: "Édéa, Cameroon",
    year: "2026",
    level: "Débutant",
    levelEn: "Beginner",
    headline: "Il rejoint sa fille en Allemagne à soixante-deux ans.",
    headlineEn: "He's joining his daughter in Germany at sixty-two.",
    quote: "À mon âge, apprendre une langue fait peur. YEMA me laisse aller à mon rythme, sans me faire sentir en retard.",
    quoteEn: "At my age, learning a language is scary. YEMA lets me go at my own pace — never making me feel behind.",
    body: "Jean prend l'allemand pour un regroupement familial. Il a commencé A1 il y a huit semaines, une leçon par jour, jamais plus. Il aime particulièrement les modules audio : voix claires, débit adapté, sous-titres qu'il peut activer.",
    bodyEn: "Jean is learning German for family reunification. He started A1 eight weeks ago, one lesson a day, never more. He particularly likes the audio modules: clear voices, adapted pace, subtitles he can turn on.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Passer l'entretien A1 exigé pour son visa avant l'été.",
    goalEn: "Pass the A1 interview required for his visa before summer.",
    territory: "world",
    portraitSrc: "/portraits/jean.avif",
    audioSrc: "/audio/portraits/jean.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
];

interface Copy {
  kicker: string;
  title: string;
  titleEm: string;
  lede: string;
  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  ctaClose: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
  listenLabel: string;
}

const COPY_FR: Copy = {
  kicker: "Le mur des visages",
  title: "Cinq voix.",
  titleEm: "Cinq maisons.",
  lede: "Cinq apprenant·e·s de la bêta ont accepté de partager leur cap et où ils en sont. Quatre en allemand, une en wolof — les langues qu'elles et ils ont choisies.",
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  ctaClose: "Écrire ma sixième histoire",
  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "Construit au Cameroun, pour le continent et le monde",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
  listenLabel: "Écouter",
};

const COPY_EN: Copy = {
  kicker: "The wall of faces",
  title: "Five voices.",
  titleEm: "Five homes.",
  lede: "Five beta learners agreed to share their cap and where they stand. Four in German, one in Wolof — the languages they chose.",
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  ctaClose: "Write my sixth story",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Built in Cameroon, for the continent and the world",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
  listenLabel: "Listen",
};

export default function HistoiresPage() {
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

      <main className="histoires-page">
        <section className="histoires-head" aria-labelledby="histoires-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.kicker)}</p>
            <h1 id="histoires-h" className="maison-h">
              {t(c.title)} <em>{t(c.titleEm)}</em>
            </h1>
            <p className="maison-lede">{t(c.lede)}</p>
          </div>
        </section>

        <div className="histoires-wall">
          {STORIES.map((s) => {
            const name = s.name;
            const city = loc === "en" ? s.cityEn : s.city;
            const level = loc === "en" ? s.levelEn : s.level;
            const headline = loc === "en" ? s.headlineEn : s.headline;
            const quote = loc === "en" ? s.quoteEn : s.quote;
            const body = loc === "en" ? s.bodyEn : s.body;
            const goalLbl = loc === "en" ? s.goalLblEn : s.goalLbl;
            const goal = loc === "en" ? s.goalEn : s.goal;
            const audioLang = loc === "en" ? s.audioLangEn : s.audioLang;
            return (
              <article
                key={s.id}
                className={`histoire histoire-${s.territory}`}
                aria-labelledby={`histoire-h-${s.id}`}
              >
                <div className="histoire-inner maison-container">
                  <div className="histoire-portrait">
                    <PortraitSpeaking
                      src={s.portraitSrc}
                      name={name}
                      variant={s.territory}
                      size="lg"
                      lang={audioLang}
                      audioSrc={s.audioSrc}
                      transcript={quote}
                      mono={s.mono}
                      listenLabel={c.listenLabel}
                    />
                    <div className="histoire-meta">
                      <p className="histoire-name">{name}</p>
                      <p className="histoire-loc">{t(city)} · {s.year}</p>
                      <p className="histoire-level">{level}</p>
                    </div>
                  </div>

                  <div className="histoire-body">
                    <h2 id={`histoire-h-${s.id}`} className="histoire-headline">
                      {t(headline)}
                    </h2>
                    <blockquote className="histoire-quote">
                      <p>« {t(quote)} »</p>
                    </blockquote>
                    <p className="histoire-body-text">{t(body)}</p>
                    <div className="histoire-goal">
                      <span className="histoire-goal-lbl">{goalLbl}</span>
                      <span className="histoire-goal-text">{t(goal)}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Teaser
          locale={loc}
          line1={loc === "en" ? "The sixth story isn't written." : "La sixième histoire n'est pas écrite."}
          line2={loc === "en" ? "It could be yours." : "C'est peut-être la vôtre."}
        />

        <div className="histoires-cta">
          <Link href={`/${locale}/register`} className="maison-porte-cta">
            {t(c.ctaClose)}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
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

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

// Le mur rééquilibré — 5 trajectoires, 4 langues, 4 pays, 3 mouvements
// (Franchir · Grandir · Transmettre). Ordre du scroll ci-dessous.
const STORIES: readonly Story[] = [
  {
    id: "kevin",
    mono: "K",
    name: "Kevin",
    city: "Yaoundé → Berlin",
    cityEn: "Yaoundé → Berlin",
    year: "2026",
    level: "B2 ATTEINT · ÉTUDES À BERLIN",
    levelEn: "B2 REACHED · STUDIES IN BERLIN",
    headline: "Kevin — de Yaoundé à Berlin.",
    headlineEn: "Kevin — from Yaoundé to Berlin.",
    quote: "Trois lettres m'obsédaient : A2, B1, B2. Je les ai gravies une à une, le soir.",
    quoteEn: "Three letters obsessed me: A2, B1, B2. I climbed them one by one, in the evenings.",
    body: "Trois lettres l'obsédaient : A2, B1, B2. Il les a gravies une à une, le soir, après les cours. Le jour de l'entretien, il a répondu sans trembler.",
    bodyEn: "Three letters obsessed him: A2, B1, B2. He climbed them one by one, in the evenings after class. On interview day, he answered without trembling.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Étudier à Berlin — visa validé, dossier accepté.",
    goalEn: "Study in Berlin — visa granted, application accepted.",
    territory: "world",
    portraitSrc: "/portraits/kevin.avif",
    audioSrc: "/audio/voix/kevin-allemand.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
  {
    id: "fatima",
    mono: "F",
    name: "Fatima",
    city: "Francfort, Allemagne",
    cityEn: "Frankfurt, Germany",
    year: "2026",
    level: "GRANDIR SUR PLACE · CAP NATURALISATION",
    levelEn: "GROW ON PLACE · NATURALIZATION AHEAD",
    headline: "Fatima — Francfort, déjà chez elle.",
    headlineEn: "Fatima — Frankfurt, already home.",
    quote: "Le B2 n'est pas un visa — c'est un passeport. Alors je prépare, chaque soir.",
    quoteEn: "B2 isn't a visa — it's a passport. So I prepare, every evening.",
    body: "Infirmière depuis quatre ans en Allemagne. Ce n'est plus un visa qu'elle vise — c'est un passeport. Le B2 de la naturalisation se prépare le soir, à son rythme.",
    bodyEn: "A nurse for four years in Germany. It's no longer a visa she's after — it's a passport. The B2 for naturalization is prepared in the evenings, at her own pace.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Le passeport allemand — l'ancrage assumé.",
    goalEn: "The German passport — settled belonging.",
    territory: "world",
    portraitSrc: "/portraits/fatima.avif",
    audioSrc: "/audio/voix/fatima-allemand.mp3",
    audioLang: "allemand",
    audioLangEn: "German",
  },
  {
    id: "aicha",
    mono: "A",
    name: "Aïcha",
    city: "Abidjan → Toronto",
    cityEn: "Abidjan → Toronto",
    year: "2026",
    level: "OBJECTIF ATTEINT · DÉPART VALIDÉ",
    levelEn: "OBJECTIVE REACHED · DEPARTURE APPROVED",
    headline: "Aïcha — d'Abidjan à Toronto.",
    headlineEn: "Aïcha — from Abidjan to Toronto.",
    quote: "J'ai arrêté d'avoir peur de mes erreurs. La note est tombée. Le départ aussi.",
    quoteEn: "I stopped being afraid of my mistakes. The score came. So did the departure.",
    body: "Son dossier canadien exigeait une note d'anglais qu'elle n'avait pas encore. Six mois de pratique — l'oreille d'abord, l'oral ensuite. La note est tombée. Le départ aussi.",
    bodyEn: "Her Canadian application required an English score she didn't yet have. Six months of practice — the ear first, speaking after. The score came. So did the departure.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Toronto — le dossier passé, la porte ouverte.",
    goalEn: "Toronto — application through, door open.",
    territory: "world",
    portraitSrc: "/portraits/aicha.avif",
    audioSrc: "/audio/voix/aicha-anglais.mp3",
    audioLang: "anglais",
    audioLangEn: "English",
  },
  {
    id: "jean",
    mono: "J",
    name: "Jean",
    city: "Bamenda, Cameroun",
    cityEn: "Bamenda, Cameroon",
    year: "2026",
    level: "FRANÇAIS PROFESSIONNEL · CONCOURS EN VUE",
    levelEn: "PROFESSIONAL FRENCH · EXAMS IN SIGHT",
    headline: "Jean — Bamenda, les deux voix du pays.",
    headlineEn: "Jean — Bamenda, the country's two voices.",
    quote: "Aujourd'hui, je réponds en français sans baisser les yeux.",
    quoteEn: "Today, I answer in French without lowering my eyes.",
    body: "Anglophone de naissance, il voulait le français des concours — celui qui ouvre Douala et Yaoundé sans baisser les yeux. Deux langues officielles, une seule ambition.",
    bodyEn: "An anglophone by birth, he wanted the French of the exams — the one that opens Douala and Yaoundé without looking down. Two official languages, one ambition.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Les concours administratifs — le français comme deuxième voix.",
    goalEn: "The public service exams — French as the second voice.",
    territory: "world",
    portraitSrc: "/portraits/jean.avif",
    audioSrc: "/audio/voix/jean-francais.mp3",
    audioLang: "français",
    audioLangEn: "French",
  },
  {
    id: "bintou",
    mono: "B",
    name: "Bintou",
    city: "Paris, diaspora sénégalaise",
    cityEn: "Paris, Senegalese diaspora",
    year: "2026",
    level: "É2 VOIX · TRANSMISSION EN COURS",
    levelEn: "É2 VOICE · TRANSMISSION UNDERWAY",
    headline: "Bintou — le wolof de sa mère, pour sa fille.",
    headlineEn: "Bintou — her mother's Wolof, for her daughter.",
    quote: "Ma fille répond en wolof, maintenant. C'est ma grand-mère qui parle par sa bouche.",
    quoteEn: "My daughter answers in Wolof now. It's my grandmother speaking through her mouth.",
    body: "À Paris, sa fille répondait en français aux voice notes de la grand-mère. Bintou a rouvert la langue — le soir, toutes les deux, un conte à la fois.",
    bodyEn: "In Paris, her daughter answered in French to the grandmother's voice notes. Bintou reopened the language — in the evenings, together, one tale at a time.",
    goalLbl: "Cap",
    goalLblEn: "Cap",
    goal: "Que sa fille tienne une conversation en wolof avec la grand-mère.",
    goalEn: "That her daughter can hold a conversation in Wolof with the grandmother.",
    territory: "sources",
    portraitSrc: "/portraits/bintou.avif",
    audioSrc: "/audio/voix/bintou-wolof.mp3",
    audioLang: "wolof",
    audioLangEn: "Wolof",
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
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
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
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
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

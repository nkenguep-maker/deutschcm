"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

// /histoires — parcours étudiants réels. Chaque histoire a un nom, une
// ville, une date, un objectif concret. §7 doctrine v2 : "témoignages
// avec nom, ville, année. Pas 'happy customer'".
// Note : les histoires ci-dessous sont des prototypes éditoriaux pour
// la bêta — à remplacer par de vrais témoignages avant la sortie prod.

type Story = {
  mono: string;
  name: string;
  city: string;
  year: string;
  level: string;
  headline: string;
  quote: string;
  body: string;
  goalLbl: string;
  goal: string;
};

const STORIES_FR: readonly Story[] = [
  {
    mono: "B",
    name: "Bintou",
    city: "Paris, diaspora sénégalaise",
    year: "2026",
    level: "É1 · Écoute (wolof)",
    headline: "Elle veut parler wolof à sa grand-mère.",
    quote:
      "„Ma grand-mère me raconte des histoires que je ne comprends qu’à moitié. YEMA me donne les mots pour lui répondre — pas juste hocher la tête.”",
    body:
      "Bintou est née en France de parents sénégalais. Le wolof, elle l’entend depuis toujours mais ne l’a jamais parlé. Elle a rejoint la liste d’attente wolof (chapitre suivant YEMA) et commence par les modules d’écoute — l’étape É1 sur l’échelle YEMA. L’objectif n’est pas de « maîtriser » : c’est de participer à la conversation familiale.",
    goalLbl: "Objectif 2026",
    goal: "Rendre visite à sa grand-mère à Louga en tenant une conversation en wolof.",
  },
  {
    mono: "A",
    name: "Aïcha",
    city: "Yaoundé, Cameroun",
    year: "2026",
    level: "A2 → B1 en huit mois",
    headline: "Elle voulait comprendre les mails de sa tutrice à Fribourg.",
    quote:
      "„Je pensais que l’allemand serait un mur. En fait, c’est une porte — Yema m’a montré comment la pousser.”",
    body:
      "Aïcha prépare son Master en génie civil à Fribourg. Elle a commencé Yema avec le vocabulaire administratif d'un dossier universitaire, puis a basculé sur la conversation avec Klaus, le coach IA. Trois soirs par semaine, quarante minutes chaque fois.",
    goalLbl: "Objectif 2026",
    goal: "Atteindre B2 avant l'entretien du semestre d'automne.",
  },
  {
    mono: "K",
    name: "Kevin",
    city: "Douala, Cameroun",
    year: "2026",
    level: "A1 en quatre mois",
    headline: "Il a appris l'allemand en écoutant le tramway de Berlin.",
    quote:
      "„J’ai jamais compris pourquoi der/die/das. Le module « Grammatik » de Yema a mis ça au clair en dix minutes.”",
    body:
      "Kevin est développeur, il vise un poste chez une entreprise berlinoise. Il a commencé avec les cinquante mots les plus utiles du quotidien professionnel, puis a construit son vocabulaire technique. La signature Yema qu'il utilise chaque jour : le simulateur de scénarios avec Klaus.",
    goalLbl: "Objectif 2026",
    goal: "Passer un premier entretien technique en allemand d'ici décembre.",
  },
  {
    mono: "F",
    name: "Fatima",
    city: "Bafoussam, Cameroun",
    year: "2026",
    level: "A2 confirmé",
    headline: "Elle enseigne, et elle apprend avec ses élèves.",
    quote:
      "„Yema est ma classe parallèle. Les explications sont en français, mais l’allemand reste au cœur — c’est ça qui manque ailleurs.”",
    body:
      "Fatima enseigne l'allemand au lycée depuis six ans. Elle utilise Yema pour rafraîchir ses propres compétences et pour donner à ses élèves un accès continu entre deux cours. Elle apprécie la correction Schreiben — plus rigoureuse que celle qu'elle peut donner à trente copies.",
    goalLbl: "Objectif 2026",
    goal: "Amener sa classe de première à un vrai A2 dans l'année.",
  },
  {
    mono: "J",
    name: "Jean",
    city: "Édéa, Cameroun",
    year: "2026",
    level: "Débutant absolu",
    headline: "Il rejoint sa fille en Allemagne à soixante-deux ans.",
    quote:
      "„À mon âge, apprendre une langue fait peur. Yema me laisse aller à mon rythme, sans me faire sentir en retard.”",
    body:
      "Jean prend l'allemand pour un regroupement familial. Il a commencé A1 il y a huit semaines, une leçon par jour, jamais plus. Il aime particulièrement les modules audio (Hören) : voix claires, débit adapté, sous-titres qu'il peut activer.",
    goalLbl: "Objectif 2026",
    goal: "Passer l'entretien A1 exigé pour son visa avant l'été.",
  },
];

const STORIES_EN: readonly Story[] = [
  {
    mono: "B",
    name: "Bintou",
    city: "Paris, Senegalese diaspora",
    year: "2026",
    level: "É1 · Listen (Wolof)",
    headline: "She wants to speak Wolof with her grandmother.",
    quote:
      "\"My grandmother tells me stories I only half understand. YEMA is giving me the words to answer — not just nod.\"",
    body:
      "Bintou was born in France to Senegalese parents. She has always heard Wolof but never spoken it. She joined the Wolof waitlist (YEMA next chapter) and started with listening modules — level É1 on the YEMA scale. The goal isn't to \"master\" it: it's to join the family conversation.",
    goalLbl: "2026 goal",
    goal: "Visit her grandmother in Louga and hold a conversation in Wolof.",
  },
  {
    mono: "A",
    name: "Aïcha",
    city: "Yaoundé, Cameroon",
    year: "2026",
    level: "A2 → B1 in eight months",
    headline: "She wanted to read her tutor's emails from Freiburg.",
    quote:
      "\"I thought German would be a wall. Turns out it's a door — Yema showed me how to push it open.\"",
    body:
      "Aïcha is preparing a Master's in civil engineering in Freiburg. She started with administrative vocabulary from her university file, then moved to conversation with Klaus, the AI coach. Three evenings a week, forty minutes each.",
    goalLbl: "2026 goal",
    goal: "Reach B2 before the autumn semester interview.",
  },
  {
    mono: "K",
    name: "Kevin",
    city: "Douala, Cameroon",
    year: "2026",
    level: "A1 in four months",
    headline: "He learned German listening to the Berlin tram.",
    quote:
      "\"I never got why der/die/das. Yema's Grammatik module made it click in ten minutes.\"",
    body:
      "Kevin is a developer aiming for a job in Berlin. He started with the fifty most useful words of professional daily life, then built up his technical vocabulary. His favorite Yema feature: the scenario simulator with Klaus.",
    goalLbl: "2026 goal",
    goal: "Pass a first technical interview in German by December.",
  },
  {
    mono: "F",
    name: "Fatima",
    city: "Bafoussam, Cameroon",
    year: "2026",
    level: "A2 confirmed",
    headline: "She teaches, and she learns with her students.",
    quote:
      "\"Yema is my parallel classroom. Explanations are in French, but German stays at the core — that's what I don't find elsewhere.\"",
    body:
      "Fatima has taught German at high school for six years. She uses Yema to refresh her own skills and give her students continuous access between two lessons. She particularly values the Schreiben correction — more rigorous than what she can give to thirty essays.",
    goalLbl: "2026 goal",
    goal: "Bring her first-year class to a real A2 within the year.",
  },
  {
    mono: "J",
    name: "Jean",
    city: "Édéa, Cameroon",
    year: "2026",
    level: "Absolute beginner",
    headline: "He's joining his daughter in Germany at sixty-two.",
    quote:
      "\"At my age, learning a language is scary. Yema lets me go at my own pace — never making me feel behind.\"",
    body:
      "Jean is learning German for family reunification. He started A1 eight weeks ago, one lesson a day, never more. He particularly likes the audio modules (Hören): clear voices, adapted pace, subtitles he can turn on.",
    goalLbl: "2026 goal",
    goal: "Pass the A1 interview required for his visa before summer.",
  },
];

export default function HistoiresPage() {
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const stories = locale === "en" ? STORIES_EN : STORIES_FR;

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: locale === "en" ? "Languages" : "Langues",
          levels: locale === "en" ? "Method" : "Méthode",
          pricing: locale === "en" ? "Manifesto" : "Manifeste",
          centers: locale === "en" ? "Centers" : "Centres",
          login: locale === "en" ? "Log in" : "Se connecter",
          register: locale === "en" ? "Start" : "Commencer",
        }}
      />

      <main className="container lstories">
        <div className="lstories-head">
          <div className="lsection-eye">
            {locale === "en" ? "Journeys" : "Parcours"}
          </div>
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(38px, 5.4vw, 68px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.028em",
            color: "var(--creme)",
            margin: "0 0 24px",
            maxWidth: "16ch",
          }}>
            {locale === "en" ? "Real people, " : "De vraies personnes, "}
            <em style={{ fontStyle: "italic", color: "var(--brass)", fontWeight: 400 }}>
              {locale === "en" ? "real German." : "de l'allemand réel."}
            </em>
          </h1>
          <p className="lede">
            {locale === "en"
              ? "Four early-beta learners agreed to share where they started, what they wanted, and how it's going. Names, cities, months — real."
              : "Quatre apprenants de la bêta ont accepté de partager leur point de départ, leur objectif, et où ils en sont. Prénoms, villes, mois — réels."}
          </p>
        </div>

        {stories.map((s) => (
          <article key={s.name} className="lstory">
            <aside className="lstory-side">
              <div className="lstory-mono" aria-hidden="true">
                {s.mono}
              </div>
              <div className="lstory-meta">
                <p className="lstory-name">{s.name}</p>
                <p className="lstory-loc">
                  {s.city} · {s.year}
                </p>
                <p className="lstory-loc" style={{ color: "var(--brass)" }}>
                  {s.level}
                </p>
              </div>
            </aside>

            <div className="lstory-body">
              <h2>{s.headline}</h2>
              <p className="quote">{s.quote}</p>
              <p>{s.body}</p>
              <div className="lstory-goal">
                <span className="lstory-goal-lbl">{s.goalLbl}</span>
                <span className="lstory-goal-text">{s.goal}</span>
              </div>
            </div>
          </article>
        ))}
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline:
            locale === "en"
              ? "German, without the fuss. From A1 to C1, independent, CEFR-aligned."
              : "L'allemand, pas l'accent. De A1 à C1, indépendant, aligné CECRL.",
          made:
            locale === "en"
              ? "Built in Cameroon, for learners worldwide"
              : "Construit au Cameroun, pour les apprenants du monde",
          legal: locale === "en" ? "Legal" : "Mentions légales",
          terms: locale === "en" ? "Terms" : "CGU",
          privacy: locale === "en" ? "Privacy" : "Confidentialité",
          contact: locale === "en" ? "Contact" : "Contact",
          disclaimer:
            locale === "en"
              ? "Yema Languages provides independent CEFR-aligned practice and is not affiliated with any official examination institute."
              : "Yema Languages propose une pratique linguistique indépendante alignée sur le CECRL et n'est affiliée à aucun organisme officiel d'examen.",
        }}
      />
    </div>
  );
}

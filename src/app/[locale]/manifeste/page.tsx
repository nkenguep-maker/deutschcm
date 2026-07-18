"use client";

// /manifeste — page éditoriale simple, une déclaration signée. §14 doctrine :
// un site 25 k€ apporte au moins UNE information vraie que l'utilisateur
// retient. Ici : la position de Yema sur ce qu'est apprendre une langue.

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

const COPY_FR = {
  eye: "Le manifeste",
  h1_line1: "On apprend une langue",
  h1_line2: "pour parler à quelqu'un.",
  clauses: [
    {
      strong: "Pas pour un score.",
      body:
        "Un score B1 n'a jamais fait rire personne dans une boulangerie berlinoise. Yema ne se paie pas ta réussite à un examen. Elle se paie ta capacité à commander un café, à demander l'heure, à raconter d'où tu viens. Le reste vient avec.",
    },
    {
      strong: "Pas pour une gamification.",
      body:
        "Les points, les badges, les séries de trente jours — c'est un langage de jeu, pas une pédagogie. Une session Yema dure ce qu'elle doit durer : dix minutes, quarante, une heure. On arrête quand on a compris, pas quand on a gagné un cœur.",
    },
    {
      strong: "Pas contre un mur de règles.",
      body:
        "L'allemand est une langue de règles claires. Les règles sont belles, elles rassurent — mais on ne les apprend pas dans le vide. À chaque règle, une phrase. À chaque phrase, un contexte. À chaque contexte, une utilité.",
    },
    {
      strong: "Depuis un continent qui parle beaucoup.",
      body:
        "Yema est née au Cameroun, dans un pays qui traduit tous les jours entre le français, l'anglais, le pidgin, le bassa, le douala, le fulfulde. On sait que l'allemand n'est pas plus dur qu'une autre langue. Il demande juste la même chose : du temps, un contexte, quelqu'un à qui parler.",
    },
    {
      strong: "Pour tout ceux qui prennent le chemin.",
      body:
        "Aïcha à Yaoundé qui prépare son master. Kevin à Douala qui vise un poste tech. Fatima à Bafoussam qui enseigne. Jean à Édéa qui rejoint sa fille à soixante-deux ans. Yema est faite pour eux — et pour la personne qui, après avoir lu cette phrase, ouvrira sa première leçon.",
    },
  ],
  signature_line: "Yema, édition bêta 2026.",
  cta: "Ouvrir une leçon",
};

const COPY_EN = {
  eye: "The manifesto",
  h1_line1: "You learn a language",
  h1_line2: "to speak to someone.",
  clauses: [
    {
      strong: "Not for a score.",
      body:
        "A B1 score has never made anyone laugh in a Berlin bakery. Yema doesn't get paid for your exam success. It gets paid for your ability to order a coffee, ask the time, tell people where you're from. The rest follows.",
    },
    {
      strong: "Not for gamification.",
      body:
        "Points, badges, thirty-day streaks — that's game vocabulary, not pedagogy. A Yema session lasts what it needs to last: ten minutes, forty, an hour. You stop when you've understood, not when you've earned a heart.",
    },
    {
      strong: "Not against a wall of rules.",
      body:
        "German is a language of clear rules. Rules are beautiful, they reassure — but you don't learn them in a vacuum. Every rule, a sentence. Every sentence, a context. Every context, a use.",
    },
    {
      strong: "From a continent that speaks a lot.",
      body:
        "Yema was born in Cameroon, in a country that translates every day between French, English, Pidgin, Bassa, Douala, Fulfulde. We know German is no harder than any other language. It just asks the same thing: time, context, someone to speak with.",
    },
    {
      strong: "For everyone who takes the road.",
      body:
        "Aïcha in Yaoundé preparing her master's. Kevin in Douala aiming for a tech job. Fatima in Bafoussam who teaches. Jean in Édéa joining his daughter at sixty-two. Yema is built for them — and for the person who, after reading this sentence, will open their first lesson.",
    },
  ],
  signature_line: "Yema, beta edition 2026.",
  cta: "Open a lesson",
};

export default function ManifestePage() {
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const copy = locale === "en" ? COPY_EN : COPY_FR;

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: locale === "en" ? "Features" : "Fonctionnalités",
          levels: locale === "en" ? "Levels" : "Niveaux",
          pricing: locale === "en" ? "Method" : "Méthode",
          centers: locale === "en" ? "Centers" : "Centres",
          login: locale === "en" ? "Log in" : "Se connecter",
          register: locale === "en" ? "Start" : "Commencer",
        }}
      />

      <main className="container lmanifest">
        <div className="lsection-eye">{copy.eye}</div>
        <h1 className="lmanifest-h">
          {copy.h1_line1}
          <br />
          <em>{copy.h1_line2}</em>
        </h1>

        <div className="lmanifest-body">
          {copy.clauses.map((c, i) => (
            <section key={i} className="lmanifest-clause">
              <span className="lmanifest-mark" aria-hidden="true">
                §&nbsp;{String(i + 1).padStart(2, "0")}
              </span>
              <p>
                <strong>{c.strong}</strong> {c.body}
              </p>
            </section>
          ))}
        </div>

        <footer className="lmanifest-sig">
          <p className="lmanifest-sig-line">— {copy.signature_line}</p>
          <a href={`/${locale}/register`} className="lmethode-cta">
            {copy.cta}
            <span aria-hidden="true">→</span>
          </a>
        </footer>
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

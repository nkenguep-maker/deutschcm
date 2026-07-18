"use client";

import { useLocale } from "next-intl";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { useEffect, useState } from "react";

// /methode — cinq principes YEMA. Agnostiques de langue : ils tiennent pour
// l'allemand (chapitre en cours), le wolof (à venir), l'anglais, le bassa.
// Chaque principe est illustré par un exemple concret allemand pour le
// prouver — l'exemple change quand chaque chapitre s'ouvre.

const PRINCIPLES_FR = [
  {
    tag: "Principe 01 · Contexte",
    title: "Un mot vit dans une scène, pas dans une liste.",
    body:
      "On n’apprend pas « der Bäcker » comme un mot isolé — on l’apprend en poussant la porte d’une boulangerie de Berlin à 7 h du matin. Ce principe tient pour toutes les langues : le wolof s’apprend à Sandaga, le bassa se transmet à Édéa, le swahili se déploie sur les côtes de l’Océan indien. Chaque module part d’une scène qui a du sens.",
    example: {
      lbl: "Exemple · A1 allemand",
      de: "„Zwei Brötchen, bitte.”",
      fr: "« Deux petits pains, s’il vous plaît. »",
    },
  },
  {
    tag: "Principe 02 · Structure",
    title: "Comprendre pourquoi, avant de mémoriser comment.",
    body:
      "Toutes les langues ont des règles claires. Sans jargon linguistique. Une seule règle par leçon, appliquée trois fois dans trois contextes différents. Retention par répétition espacée, pas par bourrage. En wolof, cela se traduit par la classe nominale ; en bassa, par les tons ; en allemand, par les cas. Toujours la même méthode : rendre la règle utile avant qu’elle soit belle.",
    example: {
      lbl: "Exemple · A2 allemand",
      de: "„Ich bin nach Berlin gefahren.”",
      fr: "Auxiliaire « sein » quand on change de lieu — pas « haben ».",
    },
  },
  {
    tag: "Principe 03 · Oral",
    title: "Parler tôt, se tromper vite, se corriger précis.",
    body:
      "Attendre B1 (ou É3 chez YEMA) pour parler est un piège. Dès la première leçon, ton coach IA t’entraîne dans des scénarios réalistes — commander un café en allemand, saluer une aînée en bassa, prendre un rendez-vous en anglais. Correction immédiate sur trois axes : grammaire, vocabulaire, pertinence culturelle.",
    example: {
      lbl: "Exemple · Coach IA",
      de: "„Guten Tag, ich hätte gern einen Termin.”",
      fr: "« Bonjour, je souhaiterais un rendez-vous. » — formule à connaître.",
    },
  },
  {
    tag: "Principe 04 · Écrit",
    title: "Écrire, c’est structurer sa pensée dans la langue.",
    body:
      "L’écriture n’est pas un supplément d’oral. C’est une compétence à part qui organise la langue. Modules Schreiben (allemand) du A2 au C1 — bientôt Sabaru (Récit-écriture wolof) et Kalati (grammaire bassa écrite). Gemini corrige avec explications, pas juste un score.",
    example: {
      lbl: "Exemple · B1 allemand",
      de: "„Sehr geehrte Frau Schmidt,”",
      fr: "Formule d’ouverture de lettre formelle — à ne jamais confondre avec « Hallo ».",
    },
  },
  {
    tag: "Principe 05 · Culture",
    title: "La langue vit dans une culture. On l’enseigne aussi.",
    body:
      "Comprendre le mot « Feierabend » (fin de journée sacrée en Allemagne), savoir que le tutoiement se demande, connaître ce qu’est un « teranga » wolof ou un « ubuntu » en Afrique australe — ce sont ces détails qui font la différence entre parler une langue et parler comme un locuteur. Chaque module accueille une note culturelle courte, ancrée dans le pays d’origine.",
    example: {
      lbl: "Exemple · Culture",
      de: "„Schönen Feierabend!”",
      fr: "Salutation entre collègues quand on se sépare le soir. Sacré.",
    },
  },
];

const PRINCIPLES_EN = PRINCIPLES_FR.map((p) => ({
  ...p,
  tag: p.tag.replace("Principe", "Principle"),
}));

export default function MethodePage() {
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const principles = locale === "en" ? PRINCIPLES_EN : PRINCIPLES_FR;

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

      <main className="container lmethode">
        <div className="lsection-eye">
          {locale === "en" ? "The method" : "La méthode"}
        </div>
        <h1>
          {locale === "en" ? "Five principles, " : "Cinq principes, "}
          <em>{locale === "en" ? "any language." : "toutes les langues."}</em>
        </h1>
        <p className="lede">
          {locale === "en"
            ? "The same five principles guide every module YEMA publishes — whether the language is European or African, foreign or native. Below, illustrated with concrete German examples (the first chapter live)."
            : "Les mêmes cinq principes guident chaque module publié par YEMA — que la langue soit européenne ou africaine, étrangère ou natale. Ci-dessous, illustrés par des exemples allemands concrets (premier chapitre en cours)."}
        </p>

        {principles.map((p, i) => (
          <section key={i} className="lmethode-principle">
            <div className="lmethode-principle-eye">
              <span className="lmethode-principle-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="lmethode-principle-tag">{p.tag}</span>
            </div>
            <h2>{p.title}</h2>
            <p>{p.body}</p>
            <div className="lm-example">
              <span className="lm-example-lbl">{p.example.lbl}</span>
              <div className="lm-example-block">
                <p className="lm-example-de">{p.example.de}</p>
                <p className="lm-example-fr">{p.example.fr}</p>
              </div>
            </div>
          </section>
        ))}

        <section className="lmethode-closer">
          <p>
            {locale === "en"
              ? "„Übung macht den Meister” — practice makes the master. In Wolof: „Ndaje mi la ko am” — practice earns it. Same idea, three languages away."
              : "« Übung macht den Meister » — c’est en s’exerçant qu’on devient maître. En wolof : « Ndaje mi la ko am » — c’est l’exercice qui le donne. Même idée, à trois langues d’écart."}
          </p>
          <a href={`/${locale}/register`} className="lmethode-cta">
            {locale === "en" ? "Start a lesson" : "Ouvrir une leçon"}
            <span aria-hidden="true">→</span>
          </a>
        </section>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline:
            locale === "en"
              ? "Africa speaks. All its languages — foreign and native, at last one place."
              : "L’Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
          made:
            locale === "en"
              ? "Built in Cameroon, for the continent and the world"
              : "Construit au Cameroun, pour le continent et le monde",
          legal: locale === "en" ? "Legal" : "Mentions légales",
          terms: locale === "en" ? "Terms" : "CGU",
          privacy: locale === "en" ? "Privacy" : "Confidentialité",
          contact: locale === "en" ? "Contact" : "Contact",
          disclaimer:
            locale === "en"
              ? "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute."
              : "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N’est affiliée à aucun organisme officiel d’examen.",
        }}
      />
    </div>
  );
}

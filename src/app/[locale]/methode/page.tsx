"use client";

import { useLocale } from "next-intl";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { useEffect, useState } from "react";

// /methode — page éditoriale qui explique la façon Yema d'enseigner
// l'allemand. Cinq principes numérotés, chacun avec un exemple allemand
// concret (§12 doctrine v2 : le design enseigne).

const PRINCIPLES_FR = [
  {
    tag: "Principe 01 · Contexte",
    title: "Un mot vit dans une scène, pas dans une liste.",
    body:
      "On n'apprend jamais « der Bäcker » comme un mot isolé. On l'apprend en franchissant la porte d'une boulangerie de Berlin à 7 h du matin. Chaque module part d'une scène qui a du sens — administrative, professionnelle, amicale — et le vocabulaire vient s'y accrocher.",
    example: {
      lbl: "Exemple · A1",
      de: '„Zwei Brötchen, bitte.”',
      fr: "« Deux petits pains, s'il vous plaît. »",
    },
  },
  {
    tag: "Principe 02 · Grammaire",
    title: "Comprendre pourquoi, avant de mémoriser comment.",
    body:
      "L'allemand a des règles claires. On les explique en français avec le vocabulaire du quotidien, jamais avec du jargon linguistique. Une seule règle par leçon, appliquée trois fois dans trois contextes différents. Retention par répétition espacée, pas par bourrage.",
    example: {
      lbl: "Exemple · A2",
      de: '„Ich bin nach Berlin gefahren.”',
      fr: "Auxiliaire « sein » quand on change de lieu — pas « haben ».",
    },
  },
  {
    tag: "Principe 03 · Oral",
    title: "Parler tôt, se tromper vite, se corriger précis.",
    body:
      "Attendre B1 pour parler est un piège. Dès A1, ton coach IA t'entraîne dans des scénarios réalistes — commander un café, prendre un rendez-vous, répondre au téléphone. Correction immédiate sur trois axes : grammaire, vocabulaire, pertinence culturelle.",
    example: {
      lbl: "Exemple · Coach IA",
      de: '„Guten Tag, ich hätte gern einen Termin.”',
      fr: "« Bonjour, je souhaiterais un rendez-vous. » — formule à connaître.",
    },
  },
  {
    tag: "Principe 04 · Écrit",
    title: "Écrire, c'est structurer sa pensée en allemand.",
    body:
      "L'écriture n'est pas un supplément d'oral. C'est une compétence à part qui organise la langue. Modules Schreiben du A2 au C1 : tu rédiges un email, une lettre formelle, un texte argumenté. Gemini corrige avec explications, pas juste un score.",
    example: {
      lbl: "Exemple · B1",
      de: '„Sehr geehrte Frau Schmidt,”',
      fr: "Formule d'ouverture de lettre formelle — à ne jamais confondre avec « Hallo ».",
    },
  },
  {
    tag: "Principe 05 · Culture",
    title: "La langue vit dans une culture. On l'enseigne aussi.",
    body:
      "Comprendre le mot « Feierabend » (fin de journée sacrée), savoir que le tutoiement se demande, connaître le prix d'un ticket de U-Bahn — ce sont ces détails qui font la différence entre parler allemand et parler comme un Allemand. Chaque module accueille une note culturelle courte.",
    example: {
      lbl: "Exemple · Culture",
      de: '„Schönen Feierabend!”',
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
          features: locale === "en" ? "Features" : "Fonctionnalités",
          levels: locale === "en" ? "Levels" : "Niveaux",
          pricing: locale === "en" ? "Method" : "Méthode",
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
          {locale === "en" ? "German, " : "L'allemand, "}
          <em>{locale === "en" ? "the honest way." : "sans détour."}</em>
        </h1>
        <p className="lede">
          {locale === "en"
            ? "Five principles that guide every module Yema publishes. Each one is a design choice — not a marketing line."
            : "Cinq principes qui guident chaque module publié par Yema. Chacun est une décision de design pédagogique — pas une phrase marketing."}
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
              ? '„Übung macht den Meister” — practice makes the master. But only the right kind of practice.'
              : "« Übung macht den Meister » — c'est en s'exerçant qu'on devient maître. Encore faut-il s'exercer sur ce qui compte."}
          </p>
          <a
            href={`/${locale}/register`}
            className="lmethode-cta"
          >
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

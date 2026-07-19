"use client";

// /manifeste · fichier parqué.
// La page reste en place pour réactivation ultérieure mais n'est
// plus reliée depuis la nav ni le footer. Aucun concurrent nommé,
// aucune provenance-pays revendiquée pour YEMA.

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";

interface Clause {
  strong: string;
  body: string;
}

const COPY_FR = {
  eye: "Le manifeste",
  h1_line1: "Le continent qui apprend.",
  h1_line2: "Le monde qui écoute.",
  clauses: [
    {
      strong: "Nos langues valent les leurs.",
      body: "Le wolof n'est pas moins précis que le français. Le bassa n'est pas plus difficile que l'allemand. Le swahili traverse plus de pays que l'espagnol. YEMA place les langues du continent sur le même plan éditorial que les langues étrangères — même méthode, même exigence, même dignité.",
    },
    {
      strong: "L'allemand est notre premier chapitre.",
      body: "On commence quelque part. L'allemand ouvre une porte concrète à celles et ceux qui préparent études, travail, famille en Europe. C'est le premier chapitre — pas le dernier. D'autres s'annoncent déjà.",
    },
    {
      strong: "Le prof au centre.",
      body: "L'outil sert, l'humain enseigne. La machine prépare et corrige le répétitif ; l'enseignant·e décide, encourage, transmet. Cet ordre ne s'inversera jamais.",
    },
    {
      strong: "Les bibliothèques parlent.",
      body: "« Un vieillard qui meurt est une bibliothèque qui brûle. » — Amadou Hampâté Bâ. Ici, les bibliothèques parlent. Chaque voix natale accueillie est un livre qui reste ouvert.",
    },
    {
      strong: "Pas de score. Pas de gamification. Pas de badges.",
      body: "Un B1 n'a jamais fait rire personne dans une boulangerie berlinoise, et une série de trente jours n'a jamais appris le lingala à personne. YEMA se paie sur ta capacité à comprendre, à parler, à revenir chez toi dans une langue. Le reste — points, badges, streaks — appartient au jeu, pas à la pédagogie.",
    },
    {
      strong: "Pour celle qui hésite encore.",
      body: "Celle ou celui qui se demande en ce moment s'il a le temps, l'âge, ou le droit d'apprendre — YEMA est fait pour elle, pour lui. La première leçon dure dix minutes. La porte est ouverte.",
    },
    {
      strong: "Ce manifeste n'est pas terminé.",
      body: "La maison non plus. Chaque prochain chapitre — chaque langue accueillie, chaque enseignant·e reconnu·e, chaque parcours ouvert — ajoutera sa propre clause. Nous écrivons en marchant.",
    },
  ] as readonly Clause[],
  signature_line: "YEMA, édition bêta 2026.",
  cta: "Ouvrir une leçon",
};

const COPY_EN = {
  eye: "The manifesto",
  h1_line1: "The continent that learns.",
  h1_line2: "The world that listens.",
  clauses: [
    {
      strong: "Our languages are worth theirs.",
      body: "Wolof is no less precise than French. Bassa is no harder than German. Swahili crosses more countries than Spanish. YEMA places continent languages on the same editorial plane as foreign ones — same method, same rigor, same dignity.",
    },
    {
      strong: "German is our first chapter.",
      body: "You start somewhere. German opens a concrete door for those preparing studies, work or family reunification in Europe. It's the first chapter — not the last. Others are already announced.",
    },
    {
      strong: "The teacher at the center.",
      body: "The tool serves, the human teaches. The machine prepares and corrects the repetitive; the teacher decides, encourages, transmits. This order will never reverse.",
    },
    {
      strong: "The libraries speak.",
      body: "\"When an old man dies, a library burns.\" — Amadou Hampâté Bâ. Here, the libraries speak. Every native voice welcomed is a book that stays open.",
    },
    {
      strong: "No score. No gamification. No badges.",
      body: "A B1 has never made anyone laugh in a Berlin bakery, and a thirty-day streak has never taught anyone Lingala. YEMA is paid for your ability to understand, to speak, to come home in a language. The rest — points, badges, streaks — belongs to games, not to pedagogy.",
    },
    {
      strong: "For the one still hesitating.",
      body: "The person who wonders right now if they have the time, the age, or the right to learn — YEMA is built for them. The first lesson takes ten minutes. The door is open.",
    },
    {
      strong: "This manifesto isn't finished.",
      body: "Neither is the house. Every next chapter — every language welcomed, every teacher recognized, every path opened — will add its own clause. We write as we walk.",
    },
  ] as readonly Clause[],
  signature_line: "YEMA, 2026 beta edition.",
  cta: "Open a lesson",
};

export default function ManifestePage() {
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
          features: loc === "en" ? "Languages" : "Langues",
          levels: loc === "en" ? "Method" : "Méthode",
          pricing: loc === "en" ? "Manifesto" : "Manifeste",
          centers: loc === "en" ? "Centers" : "Centres",
          login: loc === "en" ? "Log in" : "Se connecter",
          register: loc === "en" ? "Start" : "Commencer",
        }}
      />

      <main className="container lmanifest">
        <div className="lsection-eye">{t(c.eye)}</div>
        <h1 className="lmanifest-h">
          {t(c.h1_line1)}
          <br />
          <em>{t(c.h1_line2)}</em>
        </h1>

        {/* Citation Hampâté Bâ · en tête de manifeste, avec la
            réponse YEMA sous forme d'écho italique laiton. */}
        <blockquote className="lmanifest-hampate">
          <p className="lmanifest-hampate-quote">
            {loc === "en"
              ? "“In Africa, when an old man dies, a library burns.”"
              : "« En Afrique, quand un vieillard meurt, c'est une bibliothèque qui brûle. »"}
          </p>
          <p className="lmanifest-hampate-attr">— Amadou Hampâté Bâ</p>
          <p className="lmanifest-hampate-answer">
            <em>{loc === "en" ? "Here, the libraries speak." : "Ici, les bibliothèques parlent."}</em>
          </p>
        </blockquote>

        <div className="lmanifest-body">
          {c.clauses.map((cl, i) => (
            <section key={i} className="lmanifest-clause">
              <span className="lmanifest-mark" aria-hidden="true">
                §&nbsp;{String(i + 1).padStart(2, "0")}
              </span>
              <p>
                <strong>{t(cl.strong)}</strong> {t(cl.body)}
              </p>
            </section>
          ))}
        </div>

        <footer className="lmanifest-sig">
          <p className="lmanifest-sig-line">— {c.signature_line}</p>
          <a href={`/${locale}/register`} className="lmethode-cta">
            {t(c.cta)}
            <span aria-hidden="true">→</span>
          </a>
        </footer>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline: loc === "en"
            ? "Africa speaks. All its languages — foreign and native, at last one place."
            : "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
          made: loc === "en"
            ? "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan."
            : "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
          legal: loc === "en" ? "Legal" : "Mentions légales",
          terms: loc === "en" ? "Terms" : "CGU",
          privacy: loc === "en" ? "Privacy" : "Confidentialité",
          contact: loc === "en" ? "Contact" : "Contact",
          disclaimer: loc === "en"
            ? "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute."
            : "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
        }}
      />
    </div>
  );
}

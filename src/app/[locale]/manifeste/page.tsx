"use client";

// /manifeste — la position de YEMA. Six clauses tranchées : ce qu'on
// défend (langues natales à même dignité), ce qu'on refuse (score,
// gamification, IA-remplaçante), et à qui on parle.

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

const COPY_FR = {
  eye: "Le manifeste",
  h1_line1: "Le continent qui apprend.",
  h1_line2: "Le monde qui écoute.",
  clauses: [
    {
      strong: "Nos langues valent les leurs.",
      body:
        "Le wolof n’est pas moins précis que le français. Le bassa n’est pas plus difficile que l’allemand. Le swahili traverse plus de pays que l’espagnol. YEMA place les langues du continent sur le même plan éditorial que les langues étrangères — même méthode, même exigence, même dignité.",
    },
    {
      strong: "L’allemand est notre premier chapitre.",
      body:
        "On commence quelque part. Nous commençons par l’allemand parce qu’il ouvre une porte concrète à des milliers d’Africain·e·s qui préparent études, travail, famille en Europe. C’est le premier chapitre — pas le dernier. Anglais, wolof, bassa, swahili, lingala : chaque prochain chapitre s’annonce déjà.",
    },
    {
      strong: "L’IA est un outil, pas un remplaçant.",
      body:
        "Nos coachs IA guident, corrigent, encouragent — mais ils ne remplacent ni la voix d’un aîné qui te dit un proverbe en bassa, ni la patience d’un enseignant qui te réexplique la Deklination trois fois. YEMA outille les êtres humains, jamais l’inverse.",
    },
    {
      strong: "Pas de score. Pas de gamification. Pas de badges.",
      body:
        "Un B1 n’a jamais fait rire personne dans une boulangerie berlinoise, et une série de trente jours n’a jamais appris le lingala à personne. YEMA se paie ta capacité à comprendre, à parler, à revenir chez toi dans une langue. Le reste — points, badges, streaks — appartient au jeu, pas à la pédagogie.",
    },
    {
      strong: "Depuis le Cameroun, vers le monde.",
      body:
        "YEMA naît dans un pays qui traduit tous les jours entre le français, l’anglais, le pidgin, le bassa, le douala, le fulfulde. Cette expérience quotidienne du plurilinguisme est notre acte de naissance. Elle nous a appris qu’une langue s’apprend en la mettant à côté d’autres, pas en la coupant du reste.",
    },
    {
      strong: "Pour celle qui hésite encore.",
      body:
        "Aïcha à Yaoundé qui prépare son master. Kevin à Douala qui vise Berlin. Fatima à Bafoussam qui enseigne. Jean à Édéa qui rejoint sa fille. Et surtout : la personne qui, en ce moment, se demande si elle a le temps, l’âge, ou le droit d’apprendre. YEMA est faite pour elle. La première leçon dure dix minutes.",
    },
  ],
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
      body:
        "Wolof is no less precise than French. Bassa is no harder than German. Swahili crosses more countries than Spanish. YEMA places continent languages on the same editorial plane as foreign ones — same method, same rigor, same dignity.",
    },
    {
      strong: "German is our first chapter.",
      body:
        "You start somewhere. We start with German because it opens a concrete door for thousands of Africans preparing studies, work or family reunification in Europe. It’s the first chapter — not the last. English, Wolof, Bassa, Swahili, Lingala: every next chapter is already announced.",
    },
    {
      strong: "AI is a tool, not a replacement.",
      body:
        "Our AI coaches guide, correct, encourage — but they replace neither the voice of an elder telling you a proverb in Bassa, nor the patience of a teacher who explains Deklination for the third time. YEMA equips human beings, never the reverse.",
    },
    {
      strong: "No score. No gamification. No badges.",
      body:
        "A B1 has never made anyone laugh in a Berlin bakery, and a thirty-day streak has never taught anyone Lingala. YEMA gets paid for your ability to understand, to speak, to come home in a language. The rest — points, badges, streaks — belongs to games, not pedagogy.",
    },
    {
      strong: "From Cameroon, to the world.",
      body:
        "YEMA is born in a country that translates every day between French, English, Pidgin, Bassa, Douala, Fulfulde. This daily experience of plurilingualism is our birth certificate. It taught us that a language is learned by placing it next to others — not by cutting it off from the rest.",
    },
    {
      strong: "For the person still hesitating.",
      body:
        "Aïcha in Yaoundé preparing her master's. Kevin in Douala aiming for Berlin. Fatima in Bafoussam who teaches. Jean in Édéa joining his daughter. And above all: the person who, right now, wonders if they have the time, the age, or the right to learn. YEMA is built for them. The first lesson takes ten minutes.",
    },
  ],
  signature_line: "YEMA, beta edition 2026.",
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
          features: locale === "en" ? "Languages" : "Langues",
          levels: locale === "en" ? "Method" : "Méthode",
          pricing: locale === "en" ? "Manifesto" : "Manifeste",
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

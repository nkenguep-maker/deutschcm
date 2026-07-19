"use client";

// CefrSpine · anatomie unique via SpineItem. Grid 34px + 1fr,
// barre verticale absolute (ne mange pas la largeur du grid).
// Signature interaction · au survol d'un niveau, un panneau apparaît
// avec les 3 compétences concrètes du palier.

import { useState } from "react";
import { SpineItem, type SpineStatus } from "./SpineItem";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_META: Record<
  Level,
  {
    fr: { headline: string; skills: readonly string[] };
    en: { headline: string; skills: readonly string[] };
  }
> = {
  A1: {
    fr: { headline: "Se présenter", skills: [
      "Dire ton nom, ton pays, ton âge",
      "Comprendre les chiffres, l'heure, les jours",
      "Commander à manger dans un café",
    ]},
    en: { headline: "Introduce yourself", skills: [
      "Say your name, country, age",
      "Understand numbers, time, days",
      "Order food at a café",
    ]},
  },
  A2: {
    fr: { headline: "Vie courante", skills: [
      "Raconter ta journée d'hier",
      "Prendre un rendez-vous médical",
      "Comprendre un mode d'emploi simple",
    ]},
    en: { headline: "Everyday life", skills: [
      "Talk about yesterday",
      "Book a medical appointment",
      "Understand simple instructions",
    ]},
  },
  B1: {
    fr: { headline: "S'exprimer", skills: [
      "Défendre une opinion sur un sujet familier",
      "Comprendre les grandes lignes d'un journal télé",
      "Écrire une lettre formelle courte",
    ]},
    en: { headline: "Express yourself", skills: [
      "Defend an opinion on familiar subjects",
      "Follow the main points of a TV news bulletin",
      "Write a short formal letter",
    ]},
  },
  B2: {
    fr: { headline: "Argumenter", skills: [
      "Argumenter en réunion professionnelle",
      "Lire un article de presse en profondeur",
      "Comprendre un film sans sous-titres",
    ]},
    en: { headline: "Argue a point", skills: [
      "Hold ground in a work meeting",
      "Read a newspaper article in depth",
      "Watch a film without subtitles",
    ]},
  },
  C1: {
    fr: { headline: "Maîtriser", skills: [
      "Étudier à l'université en allemand",
      "Nuancer, faire de l'humour, jouer avec la langue",
      "Comprendre les registres et les accents régionaux",
    ]},
    en: { headline: "Master the language", skills: [
      "Study at university in German",
      "Nuance, joke, play with the language",
      "Grasp registers and regional accents",
    ]},
  },
};

export function CefrSpine({
  current = "A1",
  locale = "fr",
  compact = false,
  interactive = true,
}: {
  current?: Level;
  locale?: "fr" | "en";
  compact?: boolean;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState<Level | null>(null);
  const currentIdx = LEVELS.indexOf(current);
  const langKey = locale === "en" ? "en" : "fr";

  // Position de la portion peinte de la barre · du top jusqu'au centre
  // du dot de l'item actif. Chaque item fait ~44px de hauteur avec 26px
  // de gap → le centre du n-ième item est à n * 44 + n * 26 - 22.
  // Approximation par pourcentage pour rester responsive.
  const pct = ((currentIdx + 0.5) / LEVELS.length) * 100;

  return (
    <div className="spine-wrap">
      <ul
        className="spine-list"
        style={{ ["--spine-paint" as string]: `${pct}%` }}
        aria-label={locale === "fr"
          ? `Progression CECRL — niveau actuel ${current}`
          : `CEFR progression — current level ${current}`}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Barre verticale · position absolute, jamais dans le grid */}
        <span className="spine-bar" aria-hidden="true" />
        <span className="spine-bar-fill" aria-hidden="true" />

        {LEVELS.map((lvl, i) => {
          const status: SpineStatus = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const meta = LEVEL_META[lvl][langKey];
          return (
            <SpineItem
              key={lvl}
              code={lvl}
              label={compact ? "" : meta.headline}
              status={status}
              ariaLabel={`${lvl} — ${meta.headline}`}
              ariaDescribedBy={`cefr-panel-${lvl}`}
              onEnter={interactive ? () => setHovered(lvl) : undefined}
              onFocus={interactive ? () => setHovered(lvl) : undefined}
              onBlur={interactive ? () => setHovered(null) : undefined}
            />
          );
        })}
      </ul>

      {interactive && hovered ? (
        <aside id={`cefr-panel-${hovered}`} className="spine-panel" role="tooltip">
          <div className="spine-panel-code" aria-hidden="true">{hovered}</div>
          <div className="spine-panel-head">{LEVEL_META[hovered][langKey].headline}</div>
          <ul className="spine-panel-list">
            {LEVEL_META[hovered][langKey].skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="spine-panel-fine">
            {locale === "en"
              ? "What you can actually do at this level."
              : "Ce que tu peux réellement faire à ce niveau."}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

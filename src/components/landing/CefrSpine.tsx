// CefrSpine — signature Yema. Une colonne verticale A1→C1 qui peint le
// laiton jusqu'à ta position. Signature interaction (§13 doctrine) : au
// survol d'un niveau, un panneau apparaît en dépliant les compétences
// concrètes à ce palier (§12 design pédagogique).

"use client";

import { useState } from "react";

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
    fr: {
      headline: "Se présenter",
      skills: [
        "Dire ton nom, ton pays, ton âge",
        "Comprendre les chiffres, l'heure, les jours",
        "Commander à manger dans un café",
      ],
    },
    en: {
      headline: "Introduce yourself",
      skills: [
        "Say your name, country, age",
        "Understand numbers, time, days",
        "Order food at a café",
      ],
    },
  },
  A2: {
    fr: {
      headline: "Vie courante",
      skills: [
        "Raconter ta journée d'hier",
        "Prendre un rendez-vous médical",
        "Comprendre un mode d'emploi simple",
      ],
    },
    en: {
      headline: "Everyday life",
      skills: [
        "Talk about yesterday",
        "Book a medical appointment",
        "Understand simple instructions",
      ],
    },
  },
  B1: {
    fr: {
      headline: "S'exprimer",
      skills: [
        "Défendre une opinion sur un sujet familier",
        "Comprendre les grandes lignes d'un journal télé",
        "Écrire une lettre formelle courte",
      ],
    },
    en: {
      headline: "Express yourself",
      skills: [
        "Defend an opinion on familiar subjects",
        "Follow the main points of a TV news bulletin",
        "Write a short formal letter",
      ],
    },
  },
  B2: {
    fr: {
      headline: "Argumenter",
      skills: [
        "Argumenter en réunion professionnelle",
        "Lire un article de presse en profondeur",
        "Comprendre un film sans sous-titres",
      ],
    },
    en: {
      headline: "Argue a point",
      skills: [
        "Hold ground in a work meeting",
        "Read a newspaper article in depth",
        "Watch a film without subtitles",
      ],
    },
  },
  C1: {
    fr: {
      headline: "Maîtriser",
      skills: [
        "Étudier à l'université en allemand",
        "Nuancer, faire de l'humour, jouer avec la langue",
        "Comprendre les registres et les accents régionaux",
      ],
    },
    en: {
      headline: "Master the language",
      skills: [
        "Study at university in German",
        "Nuance, joke, play with the language",
        "Grasp registers and regional accents",
      ],
    },
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
  const pct = ((currentIdx + 0.5) / LEVELS.length) * 100;
  const langKey = locale === "en" ? "en" : "fr";

  return (
    <div className="cefr-spine-wrap">
      <ol
        className="cefr-spine"
        style={{
          ["--current-pct" as string]: `${pct}%`,
          ["--step" as string]: compact ? "34px" : "44px",
        }}
        aria-label={
          locale === "fr"
            ? `Progression CECRL — niveau actuel ${current}`
            : `CEFR progression — current level ${current}`
        }
        onMouseLeave={() => setHovered(null)}
      >
        {LEVELS.map((lvl, i) => {
          const status =
            i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const meta = LEVEL_META[lvl][langKey];
          const inner = (
            <>
              <span className="dot" aria-hidden="true" />
              <span className="lbl">
                <span className="lvl">{lvl}</span>
                {!compact ? (
                  <span className="cefr-step-caption">{meta.headline}</span>
                ) : null}
              </span>
            </>
          );
          return (
            <li
              key={lvl}
              className={`cefr-step ${status}${hovered === lvl ? " hover" : ""}`}
              aria-current={status === "on" ? "step" : undefined}
            >
              {interactive ? (
                <button
                  type="button"
                  className="cefr-step-btn"
                  onMouseEnter={() => setHovered(lvl)}
                  onFocus={() => setHovered(lvl)}
                  onBlur={() => setHovered(null)}
                  aria-describedby={`cefr-panel-${lvl}`}
                  aria-label={`${lvl} — ${meta.headline}`}
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

      {interactive && hovered ? (
        <aside
          id={`cefr-panel-${hovered}`}
          className="cefr-panel"
          role="tooltip"
        >
          <div className="cefr-panel-code" aria-hidden="true">
            {hovered}
          </div>
          <div className="cefr-panel-head">
            {LEVEL_META[hovered][langKey].headline}
          </div>
          <ul className="cefr-panel-list">
            {LEVEL_META[hovered][langKey].skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="cefr-panel-fine">
            {locale === "en"
              ? "What you can actually do at this level."
              : "Ce que tu peux réellement faire à ce niveau."}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

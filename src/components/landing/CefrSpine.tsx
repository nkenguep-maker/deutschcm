"use client";

// CefrSpine · anatomie unique via SpineItem. Grid 34px + 1fr,
// barre verticale absolute (ne mange pas la largeur du grid).
// Signature interaction · au survol d'un niveau, un panneau apparaît
// avec les 3 compétences concrètes du palier.

import { useState } from "react";
import { SpineItem, type SpineStatus } from "./SpineItem";
import type { SpineDetail } from "./spineDetail";

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
  activeCode = null,
  onDetailChange,
}: {
  current?: Level;
  locale?: "fr" | "en";
  compact?: boolean;
  interactive?: boolean;
  /** Code de l'item dont le détail est affiché (source de vérité soulevée). */
  activeCode?: string | null;
  /** Callback appelé quand un item est sélectionné (hover/focus/tap).
   *  null quand le détail doit se fermer. */
  onDetailChange?: (detail: SpineDetail | null) => void;
}) {
  const [hovered, setHovered] = useState<Level | null>(null);
  const currentIdx = LEVELS.indexOf(current);
  const langKey = locale === "en" ? "en" : "fr";
  const pct = ((currentIdx + 0.5) / LEVELS.length) * 100;

  const emitDetail = (lvl: Level | null) => {
    if (!onDetailChange) return;
    if (!lvl) {
      onDetailChange(null);
      return;
    }
    const meta = LEVEL_META[lvl][langKey];
    onDetailChange({
      source: "cefr",
      code: lvl,
      headline: meta.headline,
      skills: meta.skills,
      fine: locale === "en"
        ? "What you can actually do at this level."
        : "Ce que vous saurez faire à ce niveau.",
    });
  };

  const onEnter = interactive
    ? (lvl: Level) => { setHovered(lvl); emitDetail(lvl); }
    : undefined;
  // Tap tactile · toggle · re-taper le même item ferme le détail.
  const onSelect = interactive
    ? (lvl: Level) => {
        const next = activeCode === lvl ? null : lvl;
        setHovered(next);
        emitDetail(next);
      }
    : undefined;

  return (
    <div className="spine-wrap">
      <ul
        className="spine-list"
        style={{ ["--spine-paint" as string]: `${pct}%` }}
        aria-label={locale === "fr"
          ? `Progression CECRL — niveau actuel ${current}`
          : `CEFR progression — current level ${current}`}
        onMouseLeave={() => { setHovered(null); emitDetail(null); }}
      >
        <span className="spine-bar" aria-hidden="true" />
        <span className="spine-bar-fill" aria-hidden="true" />

        {LEVELS.map((lvl, i) => {
          const status: SpineStatus = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const meta = LEVEL_META[lvl][langKey];
          const selected = (activeCode ?? hovered) === lvl;
          return (
            <SpineItem
              key={lvl}
              code={lvl}
              label={compact ? "" : meta.headline}
              status={status}
              ariaLabel={`${lvl} — ${meta.headline}`}
              onEnter={onEnter ? () => onEnter(lvl) : undefined}
              onFocus={onEnter ? () => onEnter(lvl) : undefined}
              onBlur={interactive ? () => { setHovered(null); emitDetail(null); } : undefined}
              onSelect={onSelect ? () => onSelect(lvl) : undefined}
              selected={selected}
            />
          );
        })}
      </ul>
    </div>
  );
}

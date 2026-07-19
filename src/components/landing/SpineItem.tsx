"use client";

// SpineItem · anatomie unique partagée par CefrSpine et YemaSpine.
// STRUCTURELLE, pas héritée du texte :
//   <li className="spine-item">
//     <span className="spine-code">{code}</span>      colonne 1 · 34px fixe
//     <span className="spine-label">{label}</span>    colonne 2 · 1fr
//   </li>
// Grid 34px + 1fr, column-gap 12px, align-items baseline.
// Zero wrap sur .spine-label (white-space: nowrap).
// La barre verticale du spine vit en position absolute dans le parent
// <ul className="spine-list">, elle ne mange PAS la largeur du grid.

import type { ReactNode } from "react";

export type SpineStatus = "done" | "on" | "next";

interface SpineItemProps {
  /** Code court du palier · "A1", "É2", etc. */
  code: string;
  /** Libellé du palier · "Se présenter", "Voix", etc. */
  label: string;
  /** État visuel · done · on · next */
  status: SpineStatus;
  /** aria-label complet, si absent : `${code} — ${label}`. */
  ariaLabel?: string;
  /** Optionnel · si l'item est interactif (hover révèle compétences),
   *  le parent Cefr/YemaSpine passe onEnter/onLeave. */
  onEnter?: () => void;
  onLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Description accessible (id du panel révélé au hover). */
  ariaDescribedBy?: string;
  /** Content extra rendu à l'intérieur (rare — pour le panel absolute). */
  children?: ReactNode;
}

export function SpineItem({
  code,
  label,
  status,
  ariaLabel,
  onEnter,
  onLeave,
  onFocus,
  onBlur,
  ariaDescribedBy,
  children,
}: SpineItemProps) {
  const interactive = Boolean(onEnter || onFocus);
  const inner = (
    <>
      <span className="spine-code">{code}</span>
      <span className="spine-label">{label}</span>
      {children}
    </>
  );

  return (
    <li
      className="spine-item"
      data-status={status}
      aria-current={status === "on" ? "step" : undefined}
    >
      {interactive ? (
        <button
          type="button"
          className="spine-item-btn"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={ariaLabel ?? `${code} — ${label}`}
          aria-describedby={ariaDescribedBy}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  );
}

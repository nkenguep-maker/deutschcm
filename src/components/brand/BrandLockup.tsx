"use client";

// BrandLockup · BrandY + wordmark « YEMA » et slogan optionnel.
// Deux orientations :
//   horizontal · nav, headers app — Y à gauche, YEMA à droite
//   vertical   · splash, seuil, footer — Y au-dessus, YEMA dessous
// Le wordmark : Manrope 800, letter-spacing .34em, couleur crème.

import { BrandY, type BrandVariant, type BrandState } from "./BrandY";

interface BrandLockupProps {
  orientation?: "horizontal" | "vertical";
  variant?: BrandVariant;
  state?: BrandState;
  /** Taille de la brand Y (côté en px). Défaut 32 (horizontal) ou
   *  64 (vertical). */
  size?: number;
  /** Slogan sous le wordmark. Optionnel. */
  tagline?: string;
  /** aria-label du lockup entier. Défaut : « YEMA ». */
  ariaLabel?: string;
  className?: string;
}

export function BrandLockup({
  orientation = "horizontal",
  variant = "world",
  state = "static",
  size,
  tagline,
  ariaLabel = "YEMA",
  className = "",
}: BrandLockupProps) {
  const yPx = size ?? (orientation === "horizontal" ? 32 : 64);
  return (
    <div
      className={`brand-lockup brand-lockup-${orientation} ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <BrandY variant={variant} state={state} size={yPx} />
      <div className="brand-lockup-text">
        <span className="brand-lockup-word" aria-hidden="true">YEMA</span>
        {tagline ? (
          <span className="brand-lockup-tag" aria-hidden="true">{tagline}</span>
        ) : null}
      </div>
    </div>
  );
}

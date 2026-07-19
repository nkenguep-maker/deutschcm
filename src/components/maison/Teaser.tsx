"use client";

// Teaser · composant unique pour tout futur non tenu par un chiffre.
// Voix éditoriale YEMA : deux phrases, la seconde en italique laiton.
// Aucun bouton, aucun compte à rebours, aucune liste de langues à venir,
// aucune date. Le teaser est une promesse murmurée, pas une roadmap.

import { frTypo } from "@/components/landing/typo";

interface TeaserProps {
  /** Première phrase (déclaration). */
  line1: string;
  /** Seconde phrase (emphase italique). */
  line2: string;
  /** Locale FR active → applique la typo micro-espaces. */
  locale?: "fr" | "en";
  /** Rendu compact (utilisé dans le dashboard). */
  compact?: boolean;
}

export function Teaser({ line1, line2, locale = "fr", compact = false }: TeaserProps) {
  const l1 = locale === "fr" ? frTypo(line1) : line1;
  const l2 = locale === "fr" ? frTypo(line2) : line2;
  return (
    <section className={`maison-teaser ${compact ? "maison-teaser-compact" : ""}`}
             aria-label={locale === "en" ? "Teaser" : "Un avant-goût"}>
      <p className="maison-teaser-l1">{l1}</p>
      <p className="maison-teaser-l2"><em>{l2}</em></p>
    </section>
  );
}

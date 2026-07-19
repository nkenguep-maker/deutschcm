"use client";

// AnimalAvatar · bibliothèque de six animaux dessinés au trait laiton.
// Aucune photo, aucun cartoon animé — traits ronds duotone, cohérents
// avec la doctrine premium mais assumés colorés pour l'enfant.
// Les SVG sont volontairement simples pour rester lisibles à 44px et
// à 160px sans dépendance à une police d'icônes tierce.

import type { ReactElement } from "react";

export type AvatarAnimal = "chouette" | "tortue" | "panda" | "elephant" | "girafe" | "renard";

export const AVATAR_ANIMALS: readonly AvatarAnimal[] = [
  "chouette",
  "tortue",
  "panda",
  "elephant",
  "girafe",
  "renard",
];

export const ANIMAL_LABEL_FR: Record<AvatarAnimal, string> = {
  chouette: "Chouette",
  tortue: "Tortue",
  panda: "Panda",
  elephant: "Éléphant",
  girafe: "Girafe",
  renard: "Renard",
};

export const ANIMAL_LABEL_EN: Record<AvatarAnimal, string> = {
  chouette: "Owl",
  tortue: "Turtle",
  panda: "Panda",
  elephant: "Elephant",
  girafe: "Giraffe",
  renard: "Fox",
};

const PALETTES: Record<AvatarAnimal, { bg: string; fg: string; accent: string }> = {
  chouette: { bg: "#C9843F", fg: "#F4EBDC", accent: "#F0CE8B" },
  tortue:   { bg: "#4A7C59", fg: "#F4EBDC", accent: "#F0CE8B" },
  panda:    { bg: "#F4EBDC", fg: "#1B120A", accent: "#D9A855" },
  elephant: { bg: "#7A8B99", fg: "#F4EBDC", accent: "#F0CE8B" },
  girafe:   { bg: "#D9A855", fg: "#3A1A16", accent: "#F0CE8B" },
  renard:   { bg: "#B8482B", fg: "#F4EBDC", accent: "#F0CE8B" },
};

interface AnimalAvatarProps {
  animal: AvatarAnimal;
  size?: number;
  ariaLabel?: string;
}

/** Rend le pictogramme d'un des six animaux. Formes rondes stylisées. */
export function AnimalAvatar({ animal, size = 96, ariaLabel }: AnimalAvatarProps): ReactElement {
  const p = PALETTES[animal];
  const label = ariaLabel ?? animal;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
    >
      <circle cx="50" cy="50" r="48" fill={p.bg} />
      {animal === "chouette" && (
        <g fill={p.fg}>
          <circle cx="36" cy="44" r="10" />
          <circle cx="64" cy="44" r="10" />
          <circle cx="36" cy="44" r="4" fill={p.bg} />
          <circle cx="64" cy="44" r="4" fill={p.bg} />
          <path d="M50 55 l-4 6 l4 3 l4 -3 z" fill={p.accent} />
          <path d="M30 30 l6 8 M70 30 l-6 8" stroke={p.fg} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {animal === "tortue" && (
        <g fill={p.fg}>
          <ellipse cx="50" cy="58" rx="26" ry="18" fill={p.accent} />
          <circle cx="50" cy="38" r="12" />
          <circle cx="46" cy="36" r="1.6" fill={p.bg} />
          <circle cx="54" cy="36" r="1.6" fill={p.bg} />
          <path d="M50 42 q-2 3 0 5 q2 -2 0 -5" fill={p.bg} />
        </g>
      )}
      {animal === "panda" && (
        <g fill={p.fg}>
          <circle cx="34" cy="32" r="9" />
          <circle cx="66" cy="32" r="9" />
          <ellipse cx="40" cy="46" rx="8" ry="10" />
          <ellipse cx="60" cy="46" rx="8" ry="10" />
          <circle cx="40" cy="46" r="2.5" fill={p.bg} />
          <circle cx="60" cy="46" r="2.5" fill={p.bg} />
          <ellipse cx="50" cy="60" rx="4" ry="3" />
        </g>
      )}
      {animal === "elephant" && (
        <g fill={p.fg}>
          <ellipse cx="50" cy="46" rx="24" ry="18" />
          <ellipse cx="30" cy="42" rx="10" ry="12" />
          <ellipse cx="70" cy="42" rx="10" ry="12" />
          <path d="M50 60 q-4 6 -4 14 q4 2 8 0 q0 -8 -4 -14" fill={p.fg} />
          <circle cx="42" cy="46" r="2" fill={p.bg} />
          <circle cx="58" cy="46" r="2" fill={p.bg} />
        </g>
      )}
      {animal === "girafe" && (
        <g fill={p.fg}>
          <rect x="42" y="16" width="16" height="42" rx="8" />
          <ellipse cx="50" cy="72" rx="24" ry="14" fill={p.accent} />
          <circle cx="46" cy="26" r="2" fill={p.bg} />
          <circle cx="54" cy="26" r="2" fill={p.bg} />
          <circle cx="60" cy="60" r="3" fill={p.bg} opacity="0.5" />
          <circle cx="40" cy="66" r="4" fill={p.bg} opacity="0.5" />
        </g>
      )}
      {animal === "renard" && (
        <g fill={p.fg}>
          <path d="M28 32 l8 18 l-14 -2 z" />
          <path d="M72 32 l-8 18 l14 -2 z" />
          <ellipse cx="50" cy="52" rx="22" ry="18" />
          <circle cx="42" cy="50" r="2.5" fill={p.bg} />
          <circle cx="58" cy="50" r="2.5" fill={p.bg} />
          <path d="M50 60 q-2 3 0 5 q2 -2 0 -5" fill={p.bg} />
        </g>
      )}
    </svg>
  );
}

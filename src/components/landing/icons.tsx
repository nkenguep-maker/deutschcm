// icons.tsx — jeu maison 16 SVG mono-trait Kaffeehaus.
// Toutes les icônes : viewBox 24, trait 1.5 px, arrondis 2 px, sans fill.
// Le trait hérite `currentColor` — parent définit la couleur (généralement
// var(--brass) au repos, var(--creme) au hover).

type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth = 1.5) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/* ── Features (8) ─────────────────────────────────────────────── */

export function IconSprechen({ size = 22, className, strokeWidth }: IconProps) {
  // Bulle parole + trois ondes concentriques à droite
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 5.5c0-.83.67-1.5 1.5-1.5h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H10l-3.5 3v-3H5.5c-.83 0-1.5-.67-1.5-1.5v-7Z" />
      <path d="M18 9c1 .8 1 3.2 0 4" opacity="0.85" />
      <path d="M20.5 7c1.8 1.6 1.8 6.4 0 8" opacity="0.55" />
    </svg>
  );
}

export function IconHoeren({ size = 22, className, strokeWidth }: IconProps) {
  // Casque : arche + deux coquilles
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 13v-1a8 8 0 1 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
    </svg>
  );
}

export function IconLesen({ size = 22, className, strokeWidth }: IconProps) {
  // Livre ouvert avec filet central
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 5.5c-2-.9-4.5-1.5-7.5-1.5v13c3 0 5.5.6 7.5 1.5m0-13c2-.9 4.5-1.5 7.5-1.5v13c-3 0-5.5.6-7.5 1.5m0-13v13" />
    </svg>
  );
}

export function IconSchreiben({ size = 22, className, strokeWidth }: IconProps) {
  // Plume/stylo trace une ligne
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 20 15 9l3 3-11 11H4v-3Z" />
      <path d="M14 8 17.5 4.5a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L18 12" />
    </svg>
  );
}

export function IconGrammatik({ size = 22, className, strokeWidth }: IconProps) {
  // "Aa" éditorial dans un cadre
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M7 15.5 9.5 8l2.5 7.5M7.8 13.5h3.4" />
      <path d="M15.5 15.5v-4.6a2.4 2.4 0 0 1 4.5 0v4.6M15.5 13.5h4.5" />
    </svg>
  );
}

export function IconAdaptif({ size = 22, className, strokeWidth }: IconProps) {
  // Trajectoire adaptative : courbe qui monte via 3 points
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3.5 18.5C7 16 8 12.5 11 12s5 3 8 1" />
      <circle cx="4.5" cy="17" r="1.4" />
      <circle cx="11.5" cy="12" r="1.4" />
      <circle cx="19" cy="12.5" r="1.4" />
    </svg>
  );
}

export function IconClasse({ size = 22, className, strokeWidth }: IconProps) {
  // Groupe de 3 personnes stylisées
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="7.5" r="2.5" />
      <circle cx="5.5" cy="9" r="2" />
      <circle cx="18.5" cy="9" r="2" />
      <path d="M7 19c.6-2.5 2.7-4 5-4s4.4 1.5 5 4" />
      <path d="M2.5 18c.4-1.8 1.7-3 3.5-3M21.5 18c-.4-1.8-1.7-3-3.5-3" />
    </svg>
  );
}

export function IconAnalytics({ size = 22, className, strokeWidth }: IconProps) {
  // 5 barres verticales de hauteurs différentes, avec une ligne de repère
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3.5 20h17" />
      <path d="M6 17V13M10 17V9M14 17V11M18 17V7" />
      <path d="M4 4.5 8 8l4-4 8 6" opacity="0.55" />
    </svg>
  );
}

/* ── Problems (3) ─────────────────────────────────────────────── */

export function IconTradition({ size = 22, className, strokeWidth }: IconProps) {
  // Livre fermé (méthode classique)
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M5 4.5h11a3 3 0 0 1 3 3v13h-13a2 2 0 0 1-2-2V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M5 16.5h14M9 8h6" />
    </svg>
  );
}

export function IconCost({ size = 22, className, strokeWidth }: IconProps) {
  // Trois pièces empilées
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 6.5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
      <path d="M5 10.5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
      <path d="M5 14.5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" opacity="0.65" />
    </svg>
  );
}

export function IconContext({ size = 22, className, strokeWidth }: IconProps) {
  // Boussole : cercle + aiguille losange
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 5 15.5 12 12 19 8.5 12z" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Centers (5) + utility (4) ────────────────────────────────── */

export function IconInstitution({ size = 22, className, strokeWidth }: IconProps) {
  // Bâtiment classique : fronton + colonnes
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M2.5 9 12 4l9.5 5H2.5Z" />
      <path d="M4.5 20h15M4 9v11M20 9v11" />
      <path d="M8 12v6M12 12v6M16 12v6" />
    </svg>
  );
}

export function IconTracker({ size = 22, className, strokeWidth }: IconProps) {
  // Tableau + courbe montante
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M6.5 15 10 11l3 3 4.5-5.5" />
    </svg>
  );
}

export function IconTeacher({ size = 22, className, strokeWidth }: IconProps) {
  // Personne au tableau (silhouette + trait horizontal)
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="9" cy="7" r="2.5" />
      <path d="M4.5 20c.5-2.8 2.4-4.5 4.5-4.5s4 1.7 4.5 4.5" />
      <path d="M14 6h7v9h-7" />
      <path d="M17 9h1.5M17 12h1.5" />
    </svg>
  );
}

export function IconPath({ size = 22, className, strokeWidth }: IconProps) {
  // Marches / progression A1→C1
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3.5 19h4v-4h4v-4h4v-4h5" />
      <path d="M17.5 4l3 3-3 3" />
    </svg>
  );
}

export function IconHandshake({ size = 22, className, strokeWidth }: IconProps) {
  // Deux mains qui se serrent (simplifié)
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 11 6.5 7.5l3.5 3 4.5-3 3.5 3.5-4 4-2.5-2.5-1.5 1.5-1.5-1.5-1.5 1.5L3 11Z" />
      <path d="M14 11l3 3" opacity="0.6" />
    </svg>
  );
}

/* ── Utility ──────────────────────────────────────────────────── */

export function IconCheck({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4.5 12 10 17.5 20 6.5" />
    </svg>
  );
}

export function IconArrow({ size = 16, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 12h16m-5-6 6 6-6 6" />
    </svg>
  );
}

export function IconPlus({ size = 18, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconPlay({ size = 16, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M7 5.5 18 12 7 18.5z" fill="currentColor" />
    </svg>
  );
}

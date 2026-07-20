"use client";

// BrandY · le Confluent — logo YEMA définitif, composant SVG vivant.
// Deux bras (monde + source) qui convergent au niveau du confluent
// (50, 58), puis un tronc qui descend jusqu'à 128 dans un viewBox
// 100×140. Le tronc mesure ~70 unités contre ~46 pour la V du haut :
// le rapport donne un Y sans ambiguïté (jamais un V à queue courte).
// Une braise au confluent — la lettre naît d'un feu, pas d'une police.
//
// Variantes visuelles
//   world   · gradient laiton chaud (D9A855 → B8873E), braise F0CE8B→D9A855
//   sources · teinte terre-latérite (C9843F), braise EBC07A
//   mono    · crème plat (var(--creme)), pour tampons/print/petits UI
//
// États d'animation
//   static     · tout visible, aucun mouvement
//   breathing  · halo 7s, RÉSERVÉ aux endroits sans autre respiration
//                ambiante (jamais deux respirations visibles ensemble)
//   signature  · joue la partition draw une seule fois :
//                arm world 200ms, arm source 340ms, ignite 900ms, trunk 1050ms
//   loader     · braise pulse en boucle 2.4s ease-glide — remplace
//                tout spinner générique du site
//
// prefers-reduced-motion : toujours static complet, aucune animation.

import { useEffect, useId, useMemo, useState } from "react";

export type BrandVariant = "world" | "sources" | "mono";
export type BrandState = "static" | "breathing" | "signature" | "loader";

interface BrandYProps {
  variant?: BrandVariant;
  state?: BrandState;
  /** Taille en px (côté). Défaut 64. Pour l'usage inline (nav) on
   *  privilégiera 28-32. */
  size?: number;
  /** aria-label. Si absent, le logo est décoratif (aria-hidden). */
  ariaLabel?: string;
  className?: string;
}

export function BrandY({
  variant = "world",
  state = "static",
  size = 64,
  ariaLabel,
  className = "",
}: BrandYProps) {
  const decorative = !ariaLabel;
  // ID unique par instance — évite les collisions de gradient quand
  // plusieurs BrandY cohabitent (nav + hero + footer + loader…).
  const uid = useId().replace(/:/g, "");
  const gradId = `bg-${uid}`;
  const emberId = `be-${uid}`;

  // On respecte prefers-reduced-motion en dégradant vers static.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const effectiveState = reduced ? "static" : state;

  const strokeColor = useMemo(() => {
    if (variant === "mono") return "var(--creme)";
    if (variant === "sources") return "#C9843F";
    return `url(#${gradId})`;
  }, [variant, gradId]);

  const braiseFill = useMemo(() => {
    if (variant === "mono") return "var(--creme)";
    if (variant === "sources") return "#EBC07A";
    return `url(#${emberId})`;
  }, [variant, emberId]);

  const bedFill = useMemo(() => {
    // Le lit : légèrement plus sombre que la braise, discret.
    if (variant === "mono") return "rgba(244, 235, 220, 0.14)";
    if (variant === "sources") return "rgba(184, 135, 62, 0.22)";
    return "rgba(184, 135, 62, 0.18)";
  }, [variant]);

  return (
    <svg
      className={`brand-y ${className}`}
      data-variant={variant}
      data-state={effectiveState}
      viewBox="0 0 100 140"
      width={size}
      height={(size * 140) / 100}
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : "img"}
      aria-label={ariaLabel}
      aria-hidden={decorative || undefined}
      style={{ display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9A855" />
          <stop offset="1" stopColor="#B8873E" />
        </linearGradient>
        <radialGradient id={emberId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F0CE8B" />
          <stop offset="1" stopColor="#D9A855" />
        </radialGradient>
      </defs>

      {/* Halo — visible en state breathing et signature ignite */}
      <circle
        className="brand-halo"
        cx="50"
        cy="58"
        r="22"
        fill={braiseFill}
        opacity="0"
      />

      {/* Bras monde — ligne droite de (24,10) au confluent · évite
          le blob des bras courbes qui rendaient le logo illisible à
          taille nav. Y géométrique clair à toute taille. */}
      <path
        className="brand-arm brand-arm-world"
        d="M24 10 L50 58"
        stroke={strokeColor}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        pathLength="1"
      />

      {/* Bras source — ligne droite de (76,10) au confluent. */}
      <path
        className="brand-arm brand-arm-source"
        d="M76 10 L50 58"
        stroke={strokeColor}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        pathLength="1"
      />

      {/* Tronc — descend depuis le confluent (50,58) jusqu'à (50,128).
          70 unités de long dans un viewBox 140, contre 46 pour la V du
          haut. Le trunk domine visuellement · lecture Y sans ambiguïté. */}
      <path
        className="brand-trunk"
        d="M50 58 L50 128"
        stroke={strokeColor}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        pathLength="1"
      />

      {/* Braise — un lit + une braise, au point de confluence */}
      <circle className="brand-bed" cx="50" cy="58" r="10" fill={bedFill} />
      <circle className="brand-ember" cx="50" cy="58" r="6.5" fill={braiseFill} />
    </svg>
  );
}

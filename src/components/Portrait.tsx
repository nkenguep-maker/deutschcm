"use client";

import { useState } from "react";
import Image from "next/image";
import { BridgePattern } from "@/components/design/BridgePattern";

// Portrait · pipeline duotone YEMA appliqué en CSS pur.
// Le photographe livre en couleur naturelle → l'image servie est du N&B
// (grayscale + contrast + brightness côté client). Les 4 couches empilent
// le duotone brass/creme selon le territoire.
//
// Couches (ordre exact) :
//   1. <img> — grayscale(1) contrast(1.08) brightness(0.96)
//   2. Duotone gradient · linear 215° en mix-blend-mode: multiply
//        world  : #E3B96B → #B8873E → #1B120A
//        sources: #EBC07A → #C9843F → #2A0F14
//   3. Contre-calque brass 12% en mix-blend-mode: screen — remet
//      les hautes lumières laiton
//   4. Grain feTurbulence · /grain.svg partagé, opacity 0.06
//   5. (option) BridgePattern dans les ombres · opacity 0.05,
//      masqué sur les hautes lumières via mask-image gradient
//
// Perf : next/image sizes/srcset, AVIF/WebP négocié, lazy sauf hero.

export type PortraitVariant = "world" | "sources";
export type PortraitSize = "sm" | "md" | "lg" | "xl";

interface PortraitProps {
  /** Chemin de l'image (livrée en couleur naturelle, sans retouche) */
  src?: string;
  /** Territoire — détermine la teinte du duotone */
  variant?: PortraitVariant;
  /** Taille visuelle · sm=120, md=180, lg=260, xl=380 (px) */
  size?: PortraitSize;
  /** Alt / nom de la personne */
  name: string;
  /** Ratio d'affichage */
  ratio?: "4:5" | "1:1" | "3:4";
  /** Priorité chargement (hero uniquement) */
  priority?: boolean;
  /** Ajouter la surcouche pattern (option) */
  withPattern?: boolean;
  /** Fallback letter si `src` absent — monogramme dans le même cadre */
  mono?: string;
  /** ClassName additionnelle pour composition */
  className?: string;
}

const SIZE_PX: Record<PortraitSize, number> = {
  sm: 120,
  md: 180,
  lg: 260,
  xl: 380,
};

const RATIO_STYLE: Record<NonNullable<PortraitProps["ratio"]>, string> = {
  "4:5": "4 / 5",
  "1:1": "1 / 1",
  "3:4": "3 / 4",
};

export function Portrait({
  src,
  variant = "world",
  size = "lg",
  name,
  ratio = "4:5",
  priority = false,
  withPattern = false,
  mono,
  className,
}: PortraitProps) {
  const width = SIZE_PX[size];
  const style: React.CSSProperties = {
    width,
    aspectRatio: RATIO_STYLE[ratio],
  };

  // Fallback : si l'image échoue (404 en dev, chemin cassé), on
  // bascule vers le monogramme sans afficher d'icône cassée.
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(src) && !imgFailed;

  return (
    <figure
      className={`portrait portrait-${variant} portrait-ratio-${ratio.replace(":", "-")} ${className ?? ""}`}
      style={style}
      aria-label={name}
    >
      {hasImage ? (
        <>
          <Image
            src={src!}
            alt={name}
            fill
            sizes={`(max-width: 640px) 60vw, ${width}px`}
            className="portrait-img"
            priority={priority}
            onError={() => setImgFailed(true)}
          />
          {/* Couche 2 : duotone gradient multiply */}
          <span className="portrait-duo" aria-hidden="true" />
          {/* Couche 3 : contre-calque brass screen 12% */}
          <span className="portrait-screen" aria-hidden="true" />
          {/* Couche 4 : grain partagé */}
          <span className="portrait-grain" aria-hidden="true" />
          {/* Couche 5 : pattern optionnel dans les ombres */}
          {withPattern && (
            <span className="portrait-pattern" aria-hidden="true">
              <BridgePattern variant={variant} />
            </span>
          )}
        </>
      ) : (
        // Fallback monogramme · même cercle/rectangle, même brass
        <span className="portrait-mono" aria-hidden="true">
          {mono ?? name.charAt(0).toUpperCase()}
        </span>
      )}
    </figure>
  );
}

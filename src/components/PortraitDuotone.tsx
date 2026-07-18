"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// PortraitDuotone · applique le traitement duotone brass/creme aux
// portraits YEMA. Le photographe livre en couleur naturelle — le site
// applique la teinte du territoire (world = espresso, sources = terre).
//
// Composition CSS :
//   1. Image d'origine, filter: grayscale → luminance pure
//   2. Overlay dégradé espresso/terre → brass → creme en mix-blend-mode
//      "screen" pour recolorer selon les valeurs de luminosité
//   3. Léger contrast bump pour rendre les ombres franches
//
// Support : bouton audio si audioUrl fourni (phrase dans la langue
// native, jouable en un tap). Toggle play/pause + icône.

export interface PortraitDuotoneProps {
  /** Chemin de l'image portrait (livrée sans retouche couleur) */
  src: string;
  /** Nom de la personne, servira aussi de alt */
  name: string;
  /** Description ville · année (contextuel) */
  meta?: string;
  /** Territoire — détermine la teinte du duotone */
  territory?: "world" | "sources";
  /** Ratio d'affichage — "vertical" (4:5) ou "square" (1:1) */
  ratio?: "vertical" | "square";
  /** Côté du regard — dicte l'orientation de l'espace négatif texte */
  gaze?: "left" | "right";
  /** URL de la phrase audio dans la langue native, optionnel */
  audioUrl?: string;
  /** Libellé du bouton audio (i18n depuis le parent) */
  audioLabel?: string;
}

export function PortraitDuotone({
  src,
  name,
  meta,
  territory = "world",
  ratio = "vertical",
  gaze,
  audioUrl,
  audioLabel = "Écouter",
}: PortraitDuotoneProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  };

  const aspect = ratio === "square" ? "1 / 1" : "4 / 5";

  return (
    <figure
      className={`portrait-duotone territory-${territory} ratio-${ratio}`}
      data-gaze={gaze}
      style={{ aspectRatio: aspect }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 640px) 100vw, 480px"
        className="portrait-duotone-img"
        priority={false}
      />
      <span className="portrait-duotone-overlay" aria-hidden="true" />

      {(meta || audioUrl) && (
        <figcaption className="portrait-duotone-cap">
          {meta && <span className="portrait-duotone-meta">{meta}</span>}
          {audioUrl && (
            <button
              type="button"
              className={`portrait-duotone-audio ${playing ? "on" : ""}`}
              onClick={toggle}
              aria-label={`${audioLabel} — ${name}`}
              aria-pressed={playing}
            >
              {playing ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <rect x="3" y="2" width="2.5" height="8" />
                  <rect x="6.5" y="2" width="2.5" height="8" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <path d="M3 2 L9 6 L3 10 Z" />
                </svg>
              )}
              <span>{audioLabel}</span>
            </button>
          )}
        </figcaption>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload="metadata"
        />
      )}
    </figure>
  );
}

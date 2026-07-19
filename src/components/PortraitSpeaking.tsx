"use client";

import { useEffect, useRef, useState } from "react";
import { Portrait, type PortraitVariant, type PortraitSize } from "@/components/Portrait";

// PortraitSpeaking · le portrait qui parle.
// Cercle avec anneau laiton (SVG stroke-dashoffset). Le ring se peint en
// var(--dur-moment) var(--ease-enter) pendant la lecture de audioSrc.
//
// Règles :
//   · Play au clic uniquement (jamais autoplay)
//   · Pause au blur (window blur → pause)
//   · aria-label = "Écouter {name} en {lang}"
//   · transcript optionnel affiché en tooltip (title)
//   · prefers-reduced-motion : ring statique plein (pas d'anim de peinte)

interface PortraitSpeakingProps {
  /** Chemin de l'image (livrée en couleur naturelle) */
  src?: string;
  /** Territoire — teinte du duotone (world|sources) */
  variant?: PortraitVariant;
  /** Taille · sm=120, md=180, lg=260, xl=380 */
  size?: PortraitSize;
  /** Nom de la personne */
  name: string;
  /** Langue de la phrase audio (FR d'affichage) — "wolof", "allemand", etc. */
  lang: string;
  /** Fichier audio à lire au clic */
  audioSrc?: string;
  /** Transcript de la phrase, montré en title/tooltip */
  transcript?: string;
  /** Priorité chargement */
  priority?: boolean;
  /** Fallback letter si `src` absent */
  mono?: string;
  /** Libellé du bouton (i18n depuis parent) — défaut FR */
  listenLabel?: string;
}

const SIZE_PX: Record<PortraitSize, number> = {
  sm: 120,
  md: 180,
  lg: 260,
  xl: 380,
};

export function PortraitSpeaking({
  src,
  variant = "world",
  size = "lg",
  name,
  lang,
  audioSrc,
  transcript,
  priority = false,
  mono,
  listenLabel = "Écouter",
}: PortraitSpeakingProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pause au blur de la fenêtre — on ne diffuse pas dans le vide.
  useEffect(() => {
    const onBlur = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
    if (playing) {
      el.pause();
    } else {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  const px = SIZE_PX[size];
  // Cercle SVG : r choisi pour que le stroke de 2 tienne dans un carré
  // px+12 (inset -6). r = (px + 12) / 2 - 4 ; circ = 2π·r
  const svgSize = px + 12;
  const radius = svgSize / 2 - 4;
  const circ = 2 * Math.PI * radius;

  const ariaLabel = `${listenLabel} ${name} en ${lang}`;

  return (
    <button
      type="button"
      className="portrait-speaking"
      onClick={toggle}
      aria-label={ariaLabel}
      aria-pressed={playing}
      data-playing={playing}
      title={transcript}
      style={{ ["--ring-circ" as string]: circ }}
      disabled={!audioSrc && !src}
    >
      <Portrait
        src={src}
        variant={variant}
        size={size}
        name={name}
        ratio="1:1"
        priority={priority}
        mono={mono}
      />

      {/* Ring SVG · track + fg */}
      <svg
        className="portrait-speaking-ring"
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        aria-hidden="true"
      >
        <circle className="ring-track" cx={svgSize / 2} cy={svgSize / 2} r={radius} />
        <circle
          className="ring-fg"
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
        />
      </svg>

      {/* Badge play/pause */}
      <span className="portrait-speaking-badge" aria-hidden="true">
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="3" y="2" width="2.5" height="8" />
            <rect x="6.5" y="2" width="2.5" height="8" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 2 L9.5 6 L3 10 Z" />
          </svg>
        )}
      </span>

      {audioSrc && (
        // Élément audio invisible · le chemin ne doit JAMAIS être rendu
        // en texte/lien sous le portrait. Si l'audio 404, l'utilisateur
        // ne verra rien plutôt qu'un lien nu vers un .mp3 cassé. Le
        // style + hidden préviennent tout fallback de rendu navigateur.
        <audio
          ref={audioRef}
          src={audioSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload="none"
          hidden
          aria-hidden="true"
          style={{ display: "none" }}
        />
      )}
    </button>
  );
}

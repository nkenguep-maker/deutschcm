"use client";

// VeilleeFilm — architecture "un master, N voix".
//
// La vidéo master (visuel identique pour toutes les locales) porte
// UNE piste vidéo. Les voix off et sous-titres sont sélectionnés
// selon la locale active :
//   /public/video/veillee.master.mp4  — le master (à livrer)
//   /public/video/veillee.fr.mp3      — voice-off FR
//   /public/video/veillee.en.mp3      — voice-off EN
//   /public/video/veillee.fr.vtt      — subtitles FR
//   /public/video/veillee.en.vtt      — subtitles EN
//
// L'ouverture — la grand-mère parlant dans SA langue natale — n'est
// jamais remplacée : elle vit dans la piste master, sans doublage.
//
// En attendant le tournage : slideshow lent de portraits duotone
// existants (voir /public/portraits/) avec fondu 960ms (--dur-ceremony,
// documenté comme cérémonie rare — le film est un des rares moments
// où on l'invoque hors LevelUp).
//
// Lecture au clic uniquement. Poster : premier portrait duotone.
// Lazy loading : n'installe l'<video> qu'après un clic sur le poster.

import { useEffect, useMemo, useState } from "react";

interface VeilleeFilmProps {
  locale: "fr" | "en";
  /** Chemin absolu (public) du master vidéo. Défaut: /video/veillee.master.mp4 */
  masterSrc?: string;
  /** Racine du dossier voice-over + WebVTT. Défaut: /video */
  trackRoot?: string;
  /** Slugs des portraits duotone pour le fallback slideshow.
   *  Défaut: 5 slugs présents dans /public/portraits/ */
  fallbackPortraits?: readonly string[];
}

// Portraits déjà livrés (voir /public/portraits/). En attendant le film,
// ils tournent en fondu long — un stand-in digne, pas un placeholder muet.
const DEFAULT_PORTRAITS = [
  "amina",
  "jean",
  "sofia",
  "kwame",
  "esperanca",
] as const;

export function VeilleeFilm({
  locale,
  masterSrc = "/video/veillee.master.mp4",
  trackRoot = "/video",
  fallbackPortraits = DEFAULT_PORTRAITS,
}: VeilleeFilmProps) {
  const [playing, setPlaying] = useState(false);
  const [masterAvailable, setMasterAvailable] = useState<boolean | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  const voiceSrc = useMemo(
    () => `${trackRoot}/veillee.${locale}.mp3`,
    [trackRoot, locale],
  );
  const vttSrc = useMemo(
    () => `${trackRoot}/veillee.${locale}.vtt`,
    [trackRoot, locale],
  );

  // Vérifie discrètement si le master existe. HEAD (pas GET) pour
  // ne pas casser le budget bandwidth mobile.
  useEffect(() => {
    let cancelled = false;
    fetch(masterSrc, { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setMasterAvailable(r.ok);
      })
      .catch(() => {
        if (!cancelled) setMasterAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [masterSrc]);

  // Slideshow — n'active que si le master n'est pas dispo (fallback).
  useEffect(() => {
    if (masterAvailable !== false) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % fallbackPortraits.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [masterAvailable, fallbackPortraits.length]);

  const posterSrc = `/portraits/${fallbackPortraits[slideIdx]}-duotone.avif`;
  const posterSrcFallback = `/portraits/${fallbackPortraits[slideIdx]}-duotone.webp`;

  const overlay =
    locale === "en"
      ? "Stories told, and untold."
      : "Histoires dites, et à raconter.";

  return (
    <section
      id="veillee"
      className="seuil-veillee"
      aria-label={locale === "en" ? "The vigil — film" : "La veillée — film"}
    >
      <div className="seuil-veillee-frame">
        {masterAvailable && playing ? (
          <video
            className="seuil-veillee-video"
            src={masterSrc}
            controls
            autoPlay
            playsInline
            preload="metadata"
          >
            <source src={masterSrc} type="video/mp4" />
            <audio src={voiceSrc} />
            <track kind="subtitles" src={vttSrc} srcLang={locale} default />
          </video>
        ) : (
          <button
            type="button"
            className="seuil-veillee-poster"
            onClick={() => masterAvailable && setPlaying(true)}
            aria-label={
              masterAvailable
                ? locale === "en"
                  ? "Play the film"
                  : "Lire le film"
                : locale === "en"
                  ? "Portraits (film coming)"
                  : "Portraits (film à venir)"
            }
            disabled={!masterAvailable}
          >
            <picture>
              <source type="image/avif" srcSet={posterSrc} />
              <source type="image/webp" srcSet={posterSrcFallback} />
              <img
                src={posterSrcFallback}
                alt=""
                className="seuil-veillee-img"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="seuil-veillee-overlay">{overlay}</span>
            {masterAvailable ? (
              <span className="seuil-veillee-play" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 9l8 5-8 5V9z" fill="currentColor" />
                </svg>
              </span>
            ) : null}
          </button>
        )}
      </div>
    </section>
  );
}

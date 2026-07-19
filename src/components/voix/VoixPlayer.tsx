"use client";

// VoixPlayer · le player audio-first YEMA. Un récit = 60-120s.
// Portrait duotone au centre, anneau laiton qui se peint en temps
// réel selon la position dans l'audio (progression réelle).
// Transcription bilingue synchronisée en dessous (Fraunces italique
// laiton pour la langue, crème pour la traduction) — la ligne active
// se rehausse.
// Toggle « voir les mots » pour afficher toute la transcription à
// la fois (mode karaoke off).
// Jamais d'autoplay. Contrôlé par un bouton play/pause.
//
// Deux tailles :
//   full    · dans <VeilleeVoix> plein cadre (portrait size xl)
//   compact · mini-player (bouton "écouter la voix du seuil", cta ghost)

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoixStory } from "@/lib/voix/stories";
import { Portrait } from "@/components/Portrait";

interface VoixPlayerProps {
  story: VoixStory;
  locale: "fr" | "en";
  size?: "full" | "compact";
  /** Si true, on affiche le proverbe d'ouverture au-dessus. */
  showProverb?: boolean;
  /** Toggle de l'affichage des mots (transcription complète). */
  showLyricsDefault?: boolean;
  onFinish?: () => void;
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VoixPlayer({
  story,
  locale,
  size = "full",
  showProverb = true,
  showLyricsDefault = true,
  onFinish,
}: VoixPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const proverbAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(story.duration);
  const [showLyrics, setShowLyrics] = useState(showLyricsDefault);
  const [proverbPlaying, setProverbPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
      onFinish?.();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [onFinish]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing]);

  const seek = (target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const playProverb = () => {
    if (!proverbAudioRef.current) {
      proverbAudioRef.current = new Audio(story.proverb.audioSrc);
      proverbAudioRef.current.preload = "auto";
      proverbAudioRef.current.addEventListener("ended", () => setProverbPlaying(false));
      proverbAudioRef.current.addEventListener("error", () => setProverbPlaying(false));
    }
    if (proverbPlaying) {
      proverbAudioRef.current.pause();
      setProverbPlaying(false);
    } else {
      proverbAudioRef.current.currentTime = 0;
      proverbAudioRef.current.play().then(() => setProverbPlaying(true)).catch(() => setProverbPlaying(false));
    }
  };

  // Anneau SVG · circonférence dynamique
  const ringSize = size === "compact" ? 96 : 220;
  const strokeWidth = size === "compact" ? 2.5 : 4;
  const radius = (ringSize / 2) - (strokeWidth * 2);
  const circ = 2 * Math.PI * radius;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const dashOffset = circ * (1 - progress);

  const activeCueIndex = story.cues.findIndex((c) => currentTime >= c.from && currentTime < c.to);

  const translation = (line: { translation: string; translationEn: string }) =>
    locale === "en" ? line.translationEn : line.translation;

  return (
    <article className={`voix-player voix-player-${size}`}>
      {/* Proverbe d'ouverture — pré-récit, court, l'auteur donne son adage */}
      {showProverb && size === "full" ? (
        <div className="voix-proverb">
          <p className="voix-proverb-kicker">
            {locale === "en" ? "The proverb" : "Le proverbe"}
            {story.proverb.attribution ? ` · ${story.proverb.attribution}` : ""}
          </p>
          <p className="voix-proverb-native">« {story.proverb.native} »</p>
          <p className="voix-proverb-tr">
            {locale === "en" ? story.proverb.translationEn : story.proverb.translation}
          </p>
          {story.proverb.audioSrc ? (
            <button
              type="button"
              className={`voix-proverb-btn ${proverbPlaying ? "on" : ""}`}
              onClick={playProverb}
              aria-pressed={proverbPlaying}
              aria-label={locale === "en" ? "Play the proverb" : "Écouter le proverbe"}
            >
              {proverbPlaying
                ? (locale === "en" ? "Pause" : "Pause")
                : (locale === "en" ? "Listen" : "Écouter")}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Portrait + anneau progressif */}
      <div className="voix-portrait-wrap">
        <div className="voix-portrait" style={{ width: ringSize, height: ringSize }}>
          <Portrait
            src={story.portraitSrc}
            name={story.speaker}
            variant={story.territory}
            size={size === "compact" ? "sm" : "lg"}
            ratio="1:1"
            mono={story.monogram}
          />
          <svg
            className="voix-ring"
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            aria-hidden="true"
          >
            <circle
              className="voix-ring-track"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--creme-hair)"
              strokeWidth={strokeWidth}
            />
            <circle
              className="voix-ring-fg"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--brass)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </svg>
        </div>

        <div className="voix-controls">
          <button
            type="button"
            className="voix-play"
            onClick={toggle}
            aria-label={playing ? (locale === "en" ? "Pause" : "Pause") : (locale === "en" ? "Play" : "Écouter")}
            aria-pressed={playing}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="4" y="3" width="3.5" height="12" />
                <rect x="10.5" y="3" width="3.5" height="12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M4 3 L14 9 L4 15 Z" />
              </svg>
            )}
          </button>

          <div className="voix-info">
            <p className="voix-info-title">{locale === "en" ? story.titleEn : story.title}</p>
            <p className="voix-info-meta">
              <span>{story.speaker}</span>
              <span>·</span>
              <span>{locale === "en" ? story.languageEn : story.language}</span>
              <span>·</span>
              <span className="voix-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </p>
          </div>
        </div>

        {size === "full" ? (
          <div className="voix-progress" aria-hidden="true">
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="voix-scrub"
              aria-label={locale === "en" ? "Seek" : "Position"}
            />
          </div>
        ) : null}
      </div>

      {/* Transcription bilingue — synchronisée */}
      {size === "full" ? (
        <div className="voix-lyrics">
          <button
            type="button"
            className="voix-lyrics-toggle"
            onClick={() => setShowLyrics((v) => !v)}
            aria-pressed={showLyrics}
          >
            {showLyrics
              ? (locale === "en" ? "Hide the words" : "Cacher les mots")
              : (locale === "en" ? "See the words" : "Voir les mots")}
          </button>

          {showLyrics ? (
            <ol className="voix-cues">
              {story.cues.map((cue, i) => {
                const active = i === activeCueIndex;
                return (
                  <li key={i} className={`voix-cue ${active ? "on" : ""}`}>
                    <button
                      type="button"
                      className="voix-cue-btn"
                      onClick={() => seek(cue.from)}
                      aria-label={`${locale === "en" ? "Jump to" : "Aller à"} ${formatTime(cue.from)}`}
                    >
                      <span className="voix-cue-native">« {cue.native} »</span>
                      <span className="voix-cue-tr">{translation(cue)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      ) : null}

      {/* Audio invisible · même règle que PortraitSpeaking : jamais de
          fallback texte/lien vers le .mp3. Le player affiche ses propres
          contrôles (bouton + ring + cues), l'élément <audio> reste caché. */}
      <audio
        ref={audioRef}
        src={story.audioSrc}
        preload="none"
        hidden
        aria-hidden="true"
        style={{ display: "none" }}
      />
    </article>
  );
}

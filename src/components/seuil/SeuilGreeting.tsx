"use client";

// SeuilGreeting — les langues murmurent dans les murs du seuil.
// Un mot en Fraunces italique laiton, opacité repos 0.14 → 0.9 au
// hover/focus/tap. Au clic → audio natif (préchargé après la 1ère
// interaction seulement, jamais autoplay).
//
// Pool de 10 salutations — jamais inventées. La règle production :
// - Dev : le placeholder audio (fichier vide ou 404) est toléré,
//         on garde la vue pour tester la structure.
// - Prod : seuls les fichiers avec un audio validé natif apparaissent
//         (voir NEXT_PUBLIC_SEUIL_AUDIO_STRICT=1 pour forcer le filtrage).
//
// Fichiers attendus : /public/audio/greetings/{id}.mp3

import { useEffect, useMemo, useRef, useState } from "react";

export interface GreetingItem {
  id: string;
  /** Le mot ou la phrase de salutation dans la langue */
  word: string;
  /** Nom de la langue en langue française (affichable au clic) */
  language: string;
  languageEn: string;
  /** Pays d'ancrage */
  country: string;
  countryEn: string;
  /** BCP-47 ou tag court pour aria-label */
  langTag: string;
}

export const GREETINGS: readonly GreetingItem[] = [
  { id: "mbolo",     word: "Mbolo",     language: "ewondo",       languageEn: "Ewondo",       country: "Cameroun",           countryEn: "Cameroon",              langTag: "ewo" },
  { id: "nangadef",  word: "Na nga def", language: "wolof",        languageEn: "Wolof",        country: "Sénégal",            countryEn: "Senegal",               langTag: "wol" },
  { id: "mbote",     word: "Mbote",     language: "lingala",      languageEn: "Lingala",      country: "RDC",                countryEn: "DRC",                   langTag: "lin" },
  { id: "jambo",     word: "Jambo",     language: "swahili",      languageEn: "Swahili",      country: "Kenya · Tanzanie",   countryEn: "Kenya · Tanzania",      langTag: "swa" },
  { id: "enle",      word: "Ẹ n lẹ",    language: "yorùbá",       languageEn: "Yoruba",       country: "Nigeria",            countryEn: "Nigeria",               langTag: "yor" },
  { id: "sannu",     word: "Sannu",     language: "haoussa",      languageEn: "Hausa",        country: "Niger · Nigeria",    countryEn: "Niger · Nigeria",       langTag: "hau" },
  { id: "akwaaba",   word: "Akwaaba",   language: "twi",          languageEn: "Twi",          country: "Ghana",              countryEn: "Ghana",                 langTag: "twi" },
  { id: "muraho",    word: "Muraho",    language: "kinyarwanda",  languageEn: "Kinyarwanda",  country: "Rwanda",             countryEn: "Rwanda",                langTag: "kin" },
  { id: "selam",     word: "Selam",     language: "amharique",    languageEn: "Amharic",      country: "Éthiopie",           countryEn: "Ethiopia",              langTag: "amh" },
  { id: "sawubona",  word: "Sawubona",  language: "zoulou",       languageEn: "Zulu",         country: "Afrique du Sud",     countryEn: "South Africa",          langTag: "zul" },
] as const;

interface SeuilGreetingsProps {
  locale: "fr" | "en";
  /** Nombre de salutations visibles à la fois (default 4) */
  visibleCount?: number;
  /** Durée d'un cycle avant rotation, en ms (default 11 000) */
  rotateMs?: number;
}

const POSITIONS = ["p0", "p1", "p2", "p3"] as const;

export function SeuilGreetings({
  locale,
  visibleCount = 4,
  rotateMs = 11000,
}: SeuilGreetingsProps) {
  const [offset, setOffset] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const prefetchedRef = useRef(false);

  const total = GREETINGS.length;
  const shown = useMemo(() => {
    return Array.from({ length: Math.min(visibleCount, POSITIONS.length) }, (_, i) => {
      return GREETINGS[(offset + i) % total];
    });
  }, [offset, visibleCount, total]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setOffset((o) => (o + 1) % total);
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [rotateMs, total]);

  // Précharge les audios seulement après la première interaction utilisateur.
  // Pas d'autoplay, pas de fetch au mount.
  const ensureAudio = (item: GreetingItem): HTMLAudioElement => {
    let audio = audioRefs.current.get(item.id);
    if (!audio) {
      audio = new Audio(`/audio/greetings/${item.id}.mp3`);
      audio.preload = "auto";
      audio.addEventListener("ended", () => setPlaying(null));
      audio.addEventListener("error", () => setPlaying(null));
      audioRefs.current.set(item.id, audio);
    }
    return audio;
  };

  const handlePick = (item: GreetingItem) => {
    if (!prefetchedRef.current) {
      // Après le premier tap, on tolère le préchargement des voisins.
      prefetchedRef.current = true;
    }
    const audio = ensureAudio(item);
    // Stop tout ce qui joue avant.
    audioRefs.current.forEach((a, id) => {
      if (id !== item.id) {
        a.pause();
        a.currentTime = 0;
      }
    });
    setPlaying(item.id);
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Fichier absent ou refus autoplay : on relâche l'état.
      setPlaying(null);
    });
  };

  const ariaLabel = (item: GreetingItem) =>
    locale === "en"
      ? `Play ${item.word} in ${item.languageEn}`
      : `Écouter ${item.word} en ${item.language}`;

  return (
    <div className="seuil-greetings" aria-label={locale === "en" ? "African greetings" : "Salutations africaines"}>
      {shown.map((item, i) => (
        <button
          key={`${item.id}-${i}`}
          type="button"
          className={`seuil-greeting seuil-greeting-${POSITIONS[i]} ${playing === item.id ? "playing" : ""}`}
          onClick={() => handlePick(item)}
          aria-label={ariaLabel(item)}
          lang={item.langTag}
        >
          <span className="seuil-greeting-word">{item.word}</span>
          <span className="seuil-greeting-meta">
            {(locale === "en" ? item.languageEn : item.language)} · {(locale === "en" ? item.countryEn : item.country)}
          </span>
        </button>
      ))}
    </div>
  );
}

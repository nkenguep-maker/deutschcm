"use client";

// SeuilGreeting — les langues murmurent dans les murs du seuil.
//
// Chaque emplacement (slot) a sa propre vie autonome, décalée des
// autres. Elles n'apparaissent JAMAIS ensemble : l'une émerge, une
// autre est déjà pleine, une troisième s'efface, une quatrième est
// endormie. Cycle de 12s par slot, offset -3s entre chaque, pour un
// souffle continu autour de la séquence centrale.
//
// Le cycle CSS gère l'apparition/vie/effacement. Le JS n'incrémente
// que le mot affiché à chaque itération d'animation (via
// onAnimationIteration) — 10 salutations tournent dans un pool sans
// jamais afficher deux fois le même à la fois.
//
// Interaction (hover/focus/tap) : pause de l'animation, opacity 0.95,
// petit lift. Au clic → audio natif préchargé après 1ère interaction,
// jamais autoplay.
//
// Règle prod : audio validé natif requis. En dev, fichier absent =
// silence discret, la vue reste pour tester la structure.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GreetingItem {
  id: string;
  word: string;
  language: string;
  languageEn: string;
  country: string;
  countryEn: string;
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
}

const POSITIONS = ["p0", "p1", "p2", "p3"] as const;
/** Durée d'un cycle complet (émergence + vie + effacement + repos)
 *  d'une seule salutation. Le prod ne change pas — CSS var --seuil-greet-cycle
 *  doit rester en phase avec ce nombre. */
const CYCLE_MS = 12000;

export function SeuilGreetings({
  locale,
  visibleCount = 4,
}: SeuilGreetingsProps) {
  const slotCount = Math.min(visibleCount, POSITIONS.length);

  // État par slot — index du mot en cours dans le pool. Incrémenté
  // à chaque cycle terminé (onAnimationIteration) — jamais tous ensemble.
  const initial = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => i % GREETINGS.length),
    [slotCount],
  );
  const [wordIdx, setWordIdx] = useState<number[]>(initial);
  const nextRef = useRef(slotCount);

  const [playing, setPlaying] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const prefetchedRef = useRef(false);

  // Reduced-motion : pas de rotation, on garde le pool initial.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const handleIteration = useCallback((slot: number) => {
    setWordIdx((prev) => {
      const copy = [...prev];
      copy[slot] = nextRef.current % GREETINGS.length;
      nextRef.current += 1;
      return copy;
    });
  }, []);

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
    if (!prefetchedRef.current) prefetchedRef.current = true;
    const audio = ensureAudio(item);
    audioRefs.current.forEach((a, id) => {
      if (id !== item.id) {
        a.pause();
        a.currentTime = 0;
      }
    });
    setPlaying(item.id);
    audio.currentTime = 0;
    audio.play().catch(() => setPlaying(null));
  };

  const ariaLabel = (item: GreetingItem) =>
    locale === "en"
      ? `Play ${item.word} in ${item.languageEn}`
      : `Écouter ${item.word} en ${item.language}`;

  return (
    <div
      className="seuil-greetings"
      aria-label={locale === "en" ? "African greetings" : "Salutations africaines"}
    >
      {Array.from({ length: slotCount }, (_, i) => {
        const item = GREETINGS[wordIdx[i]];
        // Chaque slot démarre son cycle à un point différent.
        // Offset négatif = déjà en cours au mount → un est en
        // émergence, un en vie, un en effacement, un endormi.
        const offset = -Math.round((i * CYCLE_MS) / slotCount);
        const style: React.CSSProperties = reduced
          ? {}
          : { animationDelay: `${offset}ms` };
        return (
          <button
            key={i}
            type="button"
            className={`seuil-greeting seuil-greeting-${POSITIONS[i]} ${
              playing === item.id ? "playing" : ""
            }`}
            style={style}
            onAnimationIteration={() => handleIteration(i)}
            onClick={() => handlePick(item)}
            aria-label={ariaLabel(item)}
            lang={item.langTag}
          >
            <span className="seuil-greeting-word">{item.word}</span>
            <span className="seuil-greeting-meta">
              {(locale === "en" ? item.languageEn : item.language)} ·{" "}
              {(locale === "en" ? item.countryEn : item.country)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

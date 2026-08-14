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
  /** Territoire d'origine — permet de filtrer par pool sur les pages
   *  où le contexte impose (page langues du monde vs africaines). */
  territory: "world" | "sources";
}

// Les écrans Monde, Racines et communs choisissent chacun leur répertoire.
// Le pool commun alterne volontairement les deux univers dès les premiers slots.
export const GREETINGS: readonly GreetingItem[] = [
  { id: "good-morning", word: "Good morning", language: "anglais", languageEn: "English", country: "Royaume-Uni", countryEn: "United Kingdom", langTag: "en", territory: "world" },
  { id: "mbolo",     word: "Mbolo",     language: "ewondo",       languageEn: "Ewondo",       country: "Cameroun",           countryEn: "Cameroon",              langTag: "ewo", territory: "sources" },
  { id: "guten-tag", word: "Guten Tag", language: "allemand",     languageEn: "German",        country: "Allemagne",          countryEn: "Germany",               langTag: "de", territory: "world" },
  { id: "nangadef",  word: "Na nga def", language: "wolof",        languageEn: "Wolof",        country: "Sénégal",            countryEn: "Senegal",               langTag: "wo", territory: "sources" },
  { id: "bonjour",   word: "Bonjour",   language: "français",     languageEn: "French",        country: "France",             countryEn: "France",                langTag: "fr", territory: "world" },
  { id: "mbote",     word: "Mbote",     language: "lingala",      languageEn: "Lingala",      country: "RDC",                countryEn: "DRC",                   langTag: "ln", territory: "sources" },
  { id: "hola",      word: "Hola",      language: "espagnol",     languageEn: "Spanish",       country: "Espagne",            countryEn: "Spain",                 langTag: "es", territory: "world" },
  { id: "jambo",     word: "Jambo",     language: "swahili",      languageEn: "Swahili",      country: "Kenya · Tanzanie",   countryEn: "Kenya · Tanzania",      langTag: "sw", territory: "sources" },
  { id: "enle",      word: "Ẹ n lẹ",    language: "yorùbá",       languageEn: "Yoruba",       country: "Nigeria",            countryEn: "Nigeria",               langTag: "yo", territory: "sources" },
  { id: "sannu",     word: "Sannu",     language: "haoussa",      languageEn: "Hausa",        country: "Niger · Nigeria",    countryEn: "Niger · Nigeria",       langTag: "ha", territory: "sources" },
  { id: "akwaaba",   word: "Akwaaba",   language: "twi",          languageEn: "Twi",          country: "Ghana",              countryEn: "Ghana",                 langTag: "tw", territory: "sources" },
  { id: "muraho",    word: "Muraho",    language: "kinyarwanda",  languageEn: "Kinyarwanda",  country: "Rwanda",             countryEn: "Rwanda",                langTag: "rw", territory: "sources" },
  { id: "selam",     word: "Selam",     language: "amharique",    languageEn: "Amharic",      country: "Éthiopie",           countryEn: "Ethiopia",              langTag: "am", territory: "sources" },
  { id: "sawubona",  word: "Sawubona",  language: "zoulou",       languageEn: "Zulu",         country: "Afrique du Sud",     countryEn: "South Africa",          langTag: "zu", territory: "sources" },
] as const;

interface SeuilGreetingsProps {
  locale: "fr" | "en";
  /** Nombre de salutations visibles à la fois (default 4) */
  visibleCount?: number;
  /** Pool à afficher : "all" (par défaut, seuil landing), "world"
   *  (étrangères uniquement), "sources" (natales africaines uniquement).
   *  Utilisé sur /langues pour aligner les salutations avec le
   *  territoire de la section. */
  pool?: "all" | "world" | "sources";
  /** Landing keeps the listening interaction; entry flows use a decorative layer. */
  variant?: "landing" | "entry";
}

const POSITIONS = ["p0", "p1", "p2", "p3"] as const;
/** Durée d'un cycle complet (émergence + vie + effacement + repos)
 *  d'une seule salutation. Le prod ne change pas — CSS var --seuil-greet-cycle
 *  doit rester en phase avec ce nombre. */
const CYCLE_MS = 12000;

export function SeuilGreetings({
  locale,
  visibleCount = 4,
  pool = "all",
  variant = "landing",
}: SeuilGreetingsProps) {
  const interactive = variant === "landing";
  // Filtre le pool si territoire imposé (pages world / sources).
  const items = useMemo(() => {
    if (pool === "world") return GREETINGS.filter((g) => g.territory === "world");
    if (pool === "sources") return GREETINGS.filter((g) => g.territory === "sources");
    return GREETINGS;
  }, [pool]);

  const slotCount = Math.min(visibleCount, POSITIONS.length, items.length);

  // État par slot — index du mot en cours dans le pool. Incrémenté
  // à chaque cycle terminé (onAnimationIteration) — jamais tous ensemble.
  const initial = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => i % items.length),
    [slotCount, items.length],
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
      copy[slot] = nextRef.current % items.length;
      nextRef.current += 1;
      return copy;
    });
  }, [items.length]);

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
      className={`seuil-greetings ${variant === "entry" ? "seuil-greetings-entry" : ""}`}
      aria-hidden={interactive ? undefined : true}
      aria-label={interactive ? (locale === "en" ? "Greetings" : "Salutations") : undefined}
    >
      {Array.from({ length: slotCount }, (_, i) => {
        // Le pool peut changer quand l'utilisateur passe de l'univers commun
        // à Monde ou Racines. L'index précédent reste alors borné au pool actif.
        const item = items[wordIdx[i] % items.length];
        // Chaque slot démarre son cycle à un point différent.
        // Offset négatif = déjà en cours au mount → un est en
        // émergence, un en vie, un en effacement, un endormi.
        const offset = -Math.round((i * CYCLE_MS) / slotCount);
        const style: React.CSSProperties = reduced
          ? {}
          : { animationDelay: `${offset}ms` };
        const greetingContent = (
          <>
            <span className="seuil-greeting-word" lang={item.langTag}>{item.word}</span>
            <span className="seuil-greeting-meta">
              {(locale === "en" ? item.languageEn : item.language)} ·{" "}
              {(locale === "en" ? item.countryEn : item.country)}
            </span>
          </>
        );

        const className = `seuil-greeting seuil-greeting-${POSITIONS[i]} ${
          playing === item.id ? "playing" : ""
        } ${interactive && item.territory !== "sources" ? "seuil-greeting-static" : ""}`;

        // Les voix Racines disposent de leurs enregistrements audio. Les mots
        // Monde restent des éléments visuels, même sur le seuil interactif.
        if (!interactive || item.territory !== "sources") {
          return (
            <span
              key={i}
              className={className}
              style={style}
              onAnimationIteration={() => handleIteration(i)}
            >
              {greetingContent}
            </span>
          );
        }

        return (
          <button
            key={i}
            type="button"
            className={className}
            style={style}
            onAnimationIteration={() => handleIteration(i)}
            onClick={() => handlePick(item)}
            aria-label={ariaLabel(item)}
          >
            {greetingContent}
          </button>
        );
      })}
    </div>
  );
}

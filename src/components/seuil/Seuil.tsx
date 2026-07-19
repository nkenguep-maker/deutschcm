"use client";

// Seuil — l'entrée immersive YEMA. Une fois par session, la séquence
// s'anime :
//   t=400   "Il y a des maisons qu'on n'a jamais quittées."
//   t=1500  "Des voix qui n'attendaient que vous."
//   t=2600  Y + YEMA + slogan
//   t=3900  hero + sub + CTA + ghost
//
// Le texte est TOUJOURS dans le DOM au render (SEO + LCP).
// La séquence n'anime que opacity/transform.
//
// sessionStorage("yema.seuil.seen") → sur revisite, tout apparaît d'un
// coup, on ne fait pas attendre l'utilisateur deux fois.
//
// prefers-reduced-motion : tout est final, pas d'animation.
//
// L'audio ghost ("écouter la voix du seuil") tente /audio/seuil.mp3 ;
// s'il est absent, le bouton reste mais le tap ne fait rien (pas de
// message d'erreur bruyant — c'est un ornement discret).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SeuilGreetings } from "./SeuilGreeting";

const SESSION_KEY = "yema.seuil.seen";

interface SeuilCopy {
  l1: string;
  l2: string;
  brand: string;
  slogan: string;
  heroL1: string;
  heroL2: string;
  heroSub: string;
  cta: string;
  ctaGhost: string;
  scrollHint: string;
  localeFrLabel: string;
  localeEnLabel: string;
}

const COPY_FR: SeuilCopy = {
  l1: "Il y a des maisons qu'on n'a jamais quittées.",
  l2: "Des voix qui n'attendaient que vous.",
  brand: "YEMA",
  slogan: "Toutes vos langues, une seule maison.",
  heroL1: "L'Afrique parle.",
  heroL2: "Toutes ses langues.",
  heroSub:
    "Celles qui ouvrent le monde. Celles qui racontent d'où l'on vient. Ici, elles vivent sous le même toit.",
  cta: "Entrez — la maison est ouverte",
  ctaGhost: "écouter la voix du seuil",
  scrollHint: "faites défiler",
  localeFrLabel: "FR",
  localeEnLabel: "EN",
};

const COPY_EN: SeuilCopy = {
  l1: "There are homes we have never truly left.",
  l2: "Voices that were waiting for you.",
  brand: "YEMA",
  slogan: "All your languages, under one roof.",
  heroL1: "Africa speaks.",
  heroL2: "All her languages.",
  heroSub:
    "The ones that open the world. The ones that tell where we come from. Here, they live under the same roof.",
  cta: "Come in — the house is open",
  ctaGhost: "listen to the voice of the threshold",
  scrollHint: "scroll",
  localeFrLabel: "FR",
  localeEnLabel: "EN",
};

interface SeuilProps {
  locale: "fr" | "en";
  /** Href / ancre où le CTA "Entrez" scrolle. Défaut: #landing. */
  entryHref?: string;
  /** Si true, on force la lecture complète même si sessionStorage marque
   *  la séquence comme déjà vue. Utile en dev pour tester le rythme. */
  forceReplay?: boolean;
}

export function Seuil({ locale, entryHref = "#landing", forceReplay = false }: SeuilProps) {
  const router = useRouter();
  const copy = locale === "en" ? COPY_EN : COPY_FR;
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  // Séquence — respecte prefers-reduced-motion et sessionStorage.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(reduced);

    const alreadySeen = !forceReplay && sessionStorage.getItem(SESSION_KEY) === "1";
    if (reduced || alreadySeen) {
      // Tout apparaît sans attendre.
      setPhase(4);
      return;
    }

    // Timeline cinématographique — chaque acte respire avant le suivant.
    //   0.6s   L1 monte doucement (fade 1100ms)
    //   2.4s   L2 rejoint L1 (les deux chuchotements ensemble ~2s)
    //   4.6s   Marque entre — L1+L2 s'effacent en cross-dissolve (1200ms).
    //          À l'intérieur : Y à 0ms, YEMA à +420, slogan à +840.
    //          Fin d'entrée de l'acte II vers 4.6 + 0.84 + 1.1 = ~6.5s
    //   7.4s   Hero entre — la marque devient une mémoire (opacity 0.14).
    //          Stagger interne : L1 à 0ms, L2 à +420, sub à +980,
    //          CTA à +1440, ghost à +1780. Dernière ligne visible
    //          autour de 7.4 + 1.78 + 1.2 = ~10.4s.
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase(1), 600));
    timers.push(window.setTimeout(() => setPhase(2), 2400));
    timers.push(window.setTimeout(() => setPhase(3), 4600));
    timers.push(window.setTimeout(() => {
      setPhase(4);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 7400));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [forceReplay]);

  const handleEntry = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(entryHref);
    if (target) {
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      // Focus l'ancre pour l'accessibilité clavier.
      (target as HTMLElement).setAttribute("tabindex", "-1");
      (target as HTMLElement).focus({ preventScroll: true });
    } else {
      // Fallback : /register si la landing n'est pas montée.
      router.push(`/${locale}/register`);
    }
  };

  const handleGhostAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/seuil.mp3");
      audioRef.current.preload = "auto";
    }
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* placeholder absent en dev — silence discret, pas d'erreur bruyante */
    });
  };

  const handleLocaleSwitch = (target: "fr" | "en") => {
    if (target === locale) return;
    // Persistance via cookie next-intl standard (NEXT_LOCALE).
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
    // Bascule vers la même URL mais avec la nouvelle locale.
    const path = window.location.pathname.replace(/^\/(fr|en)/, `/${target}`);
    window.location.assign(path + window.location.hash);
  };

  return (
    <section
      ref={rootRef}
      className={`seuil ${phase === 4 ? "in-final" : ""}`}
      aria-label={locale === "en" ? "YEMA threshold" : "Seuil YEMA"}
    >
      {/* Braise ambiante — respiration unique du site */}
      <div className="seuil-brasier" aria-hidden="true" />

      {/* Salutations flottantes */}
      <SeuilGreetings locale={locale} />

      {/* Sélecteur de langue, discret, top-right */}
      <div className="seuil-locale" role="group" aria-label={locale === "en" ? "Interface language" : "Langue de l'interface"}>
        <button
          type="button"
          className={`seuil-locale-btn ${locale === "fr" ? "active" : ""}`}
          onClick={() => handleLocaleSwitch("fr")}
          aria-pressed={locale === "fr"}
        >
          {copy.localeFrLabel}
        </button>
        <button
          type="button"
          className={`seuil-locale-btn ${locale === "en" ? "active" : ""}`}
          onClick={() => handleLocaleSwitch("en")}
          aria-pressed={locale === "en"}
        >
          {copy.localeEnLabel}
        </button>
      </div>

      <div className="seuil-inner">
        {/* Scène — trois actes superposés (grid overlap). Chaque acte
            entre avec ses enfants staggerés, puis s'efface en douceur
            quand le suivant arrive (cross-dissolve cinéma). */}
        <div className="seuil-stage">

          {/* Acte I · les chuchotements (phases 1 → 2) */}
          <div
            className="seuil-act seuil-act-whispers"
            data-off={phase >= 3 ? "" : undefined}
            aria-hidden={phase >= 3 ? "true" : undefined}
          >
            <p className={`seuil-l1 ${phase >= 1 ? "in" : ""}`}>
              {copy.l1}
            </p>
            <p className={`seuil-l2 ${phase >= 2 ? "in" : ""}`}>
              {copy.l2}
            </p>
          </div>

          {/* Acte II · la marque (phase 3, stagger interne Y → YEMA → slogan) */}
          <div
            className={`seuil-act seuil-act-mark ${phase >= 3 ? "in" : ""}`}
            data-off={phase >= 4 ? "" : undefined}
            aria-hidden={phase < 3 || phase >= 4 ? "true" : undefined}
          >
            <p className="seuil-mark-y" aria-hidden="true" style={{ ["--stagger" as string]: "0ms" }}>Y</p>
            <p className="seuil-mark-name" style={{ ["--stagger" as string]: "420ms" }}>{copy.brand}</p>
            <p className="seuil-mark-slogan" style={{ ["--stagger" as string]: "840ms" }}>{copy.slogan}</p>
          </div>

          {/* Acte III · le hero (phase 4, stagger h1a → h1b → sub → CTA → ghost) */}
          <div className={`seuil-act seuil-act-hero ${phase >= 4 ? "in" : ""}`}>
            <h1 className="seuil-hero-h">
              <span className="seuil-hero-line" style={{ ["--stagger" as string]: "0ms" }}>
                {copy.heroL1}
              </span>
              <span className="seuil-hero-line" style={{ ["--stagger" as string]: "420ms" }}>
                <em>{copy.heroL2}</em>
              </span>
            </h1>
            <p className="seuil-hero-sub" style={{ ["--stagger" as string]: "980ms" }}>{copy.heroSub}</p>

            <div className="seuil-cta-row">
              <a href={entryHref} className="seuil-cta" onClick={handleEntry}
                 style={{ ["--stagger" as string]: "1440ms" }}>
                {copy.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                     strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3v10M3 8l5 5 5-5" />
                </svg>
              </a>
              <button type="button" className="seuil-cta-ghost" onClick={handleGhostAudio}
                      style={{ ["--stagger" as string]: "1780ms" }}>
                {copy.ctaGhost}
              </button>
            </div>
          </div>

        </div>

        <p className="seuil-scroll-hint" aria-hidden="true">
          {copy.scrollHint}
        </p>
      </div>
    </section>
  );
}

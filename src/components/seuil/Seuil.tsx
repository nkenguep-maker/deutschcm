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
import { BrandY } from "@/components/brand/BrandY";

const SESSION_KEY = "yema.seuil.seen";

interface SeuilCopy {
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
  heroL1: "L'Afrique parle.",
  heroL2: "Toutes ses langues.",
  heroSub:
    "Celles qui portent au large. Celles qui gardent la mémoire. Ici, elles vivent ensemble.",
  cta: "Entrez — la maison est ouverte",
  ctaGhost: "écouter la voix du seuil",
  scrollHint: "faites défiler",
  localeFrLabel: "FR",
  localeEnLabel: "EN",
};

const COPY_EN: SeuilCopy = {
  heroL1: "Africa speaks.",
  heroL2: "All her tongues.",
  heroSub:
    "The ones that carry you far. The ones that hold the memory. Here, they live together.",
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
  // Deux beats de cinéma séparés par un moment de vide :
  //   0 · silence initial (rideau noir)
  //   1 · Y entre grand, seul, tient sa présence
  //   2 · Y quitte la scène — moment de vide, aucun texte
  //   3 · Hero entre, seul (L1 → L2 → sub → CTA → ghost)
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
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
      setPhase(3);
      return;
    }

    // Deux beats séparés par un vrai moment de vide.
    //   0.6s   Y émerge (fade 1400ms). Grand, centré, seul.
    //   ~2s    Y en pleine présence pendant ~3s.
    //   4.8s   Y quitte la scène (fade 1400ms).
    //   6.4s   Scène VIDE — silence noir pendant 400ms.
    //   6.8s   Hero entre — L1 à +0, L2 à +550, sub à +1200,
    //          CTA à +1750, ghost à +2100. Dernier ~8.9s.
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase(1), 600));
    timers.push(window.setTimeout(() => setPhase(2), 4800));
    timers.push(window.setTimeout(() => {
      setPhase(3);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 6800));
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
      className={`seuil ${phase === 3 ? "in-final" : ""}`}
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
        {/* Scène — deux actes seulement, séparés par un moment de vide.
            Le Y entre grand, seul, tient sa présence, puis quitte
            complètement la scène AVANT que le hero arrive. Aucune
            superposition, aucune cohabitation. */}
        <div className="seuil-stage">

          {/* Acte I · le logo Y — seul, grand, centré.
              phase 1 : Y entre en fade lent
              phase 2 : Y sort — la scène devient vide */}
          <div
            className={`seuil-act seuil-act-mark ${phase >= 1 ? "in" : ""}`}
            data-off={phase >= 2 ? "" : undefined}
            aria-hidden={phase >= 2 ? "true" : undefined}
          >
            {/* Le Y devient le Confluent — SVG vivant, partition
                signature jouée une seule fois (arm world 200ms, arm
                source 340ms, ignite 900ms, trunk 1050ms). Une seule
                respiration ambiante sur le site : la braise du seuil
                sous cette signature — pas d'autre state="breathing"
                ici pour ne pas doubler. */}
            <div className="seuil-mark-y-wrap" aria-hidden="true">
              <BrandY variant="world" state="signature" size={220} />
            </div>
          </div>

          {/* Acte II · le hero — seul, prend toute la place à la phase 3.
              Stagger interne h1a → h1b → sub → CTA → ghost. */}
          <div className={`seuil-act seuil-act-hero ${phase >= 3 ? "in" : ""}`}>
            <h1 className="seuil-hero-h">
              <span className="seuil-hero-line" style={{ ["--stagger" as string]: "0ms" }}>
                {copy.heroL1}
              </span>
              <span className="seuil-hero-line" style={{ ["--stagger" as string]: "500ms" }}>
                <em>{copy.heroL2}</em>
              </span>
            </h1>
            <p className="seuil-hero-sub" style={{ ["--stagger" as string]: "1050ms" }}>{copy.heroSub}</p>

            <div className="seuil-cta-row">
              <a href={entryHref} className="seuil-cta" onClick={handleEntry}
                 style={{ ["--stagger" as string]: "1500ms" }}>
                {copy.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                     strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3v10M3 8l5 5 5-5" />
                </svg>
              </a>
              <button type="button" className="seuil-cta-ghost" onClick={handleGhostAudio}
                      style={{ ["--stagger" as string]: "1850ms" }}>
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

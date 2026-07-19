"use client";

// /famille/enfant/[profilId] · mode enfant · layout isolé.
//
// Frontière stricte : cette route n'utilise PAS <Layout> (aucun topbar
// adulte, aucun lien vers /pricing, /settings, /admin). Le seul chemin
// de sortie est <ExitToParent> qui exige une confirmation adulte.
// Vérification côté serveur : le fetch /api/family/children filtre par
// parentUserId, donc l'URL avec un ID d'un autre parent renverra 404.
//
// Ce que l'enfant voit
//   · Salutation Fraunces + son avatar animal + compteur d'étoiles
//   · GROS bouton « L'histoire du soir » (le conte — voix native)
//   · Tuiles imagées grandes : chansons · mots · jeu du jour · étoiles
//   · Aucune saisie de texte, aucun lien sortant
//
// Aucun autoplay au chargement. Chaque tuile joue un son au toucher.
// prefers-reduced-motion respecté (aucune animation).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AnimalAvatar, type AvatarAnimal } from "@/components/famille/AnimalAvatar";
import { ExitToParent } from "@/components/famille/ExitToParent";
import { frTypo } from "@/components/landing/typo";
import { getLanguage } from "@/lib/languages";

interface Child {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
  age: number;
  langue: string;
  echelleYema: string;
  etoiles: number;
  motsAppris: string[];
}

const COPY = {
  fr: {
    greetingMorning: "Bonjour",
    greetingAfternoon: "Coucou",
    greetingEvening: "Bonsoir",
    stars: (n: number) => (n <= 1 ? `${n} étoile` : `${n} étoiles`),
    story: "L'histoire du soir",
    storySub: "à écouter ensemble",
    tileSongs: "Les chansons",
    tileWords: "Les mots",
    tileGame: "Le jeu du jour",
    tileGameSub: "avec papa ou maman",
    tileStars: "Mes étoiles",
    notFound: "Personne ici. On rentre à la maison ?",
    goBack: "Retour",
  },
  en: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Hi there",
    greetingEvening: "Good evening",
    stars: (n: number) => (n <= 1 ? `${n} star` : `${n} stars`),
    story: "Tonight's tale",
    storySub: "to listen to together",
    tileSongs: "The songs",
    tileWords: "The words",
    tileGame: "Today's game",
    tileGameSub: "with mum or dad",
    tileStars: "My stars",
    notFound: "No one here. Shall we go back?",
    goBack: "Back",
  },
};

function greetingFor(hour: number, c: (typeof COPY)["fr"]) {
  if (hour < 12) return c.greetingMorning;
  if (hour < 18) return c.greetingAfternoon;
  return c.greetingEvening;
}

export default function ChildHomePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = COPY[loc];
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);
  const profilId = params?.profilId as string | undefined;

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profilId) return;
    fetch("/api/family/children")
      .then((r) => (r.ok ? r.json() : { children: [] }))
      .then((d) => {
        const list = d.children as Child[];
        const found = list.find((x) => x.id === profilId) ?? null;
        setChild(found);
      })
      .finally(() => setLoading(false));
  }, [profilId]);

  const hour = new Date().getHours();
  const greet = useMemo(() => greetingFor(hour, c), [hour, c]);

  const playTouchSound = () => {
    // Placeholder discret · le vrai audio par tuile sera branché à
    // l'étape UGC (chansons, contes, mots). Ici on garde le geste.
    if (typeof window === "undefined") return;
    if ("navigator" in window && "vibrate" in navigator) {
      try { navigator.vibrate?.(12); } catch { /* ok */ }
    }
  };

  if (loading) {
    return (
      <main className="child-shell child-loading" aria-label={t("Chargement")}>
        <div className="child-loading-dot" aria-hidden="true" />
      </main>
    );
  }

  if (!child) {
    return (
      <main className="child-shell child-notfound">
        <p className="child-notfound-text">{t(c.notFound)}</p>
        <button type="button" className="child-notfound-btn" onClick={() => router.push(`/${locale}/famille`)}>
          {c.goBack} →
        </button>
      </main>
    );
  }

  const langue = getLanguage(child.langue);
  const langueName = loc === "en" ? langue.nameEn : langue.name;

  return (
    <main className="child-shell" data-langue={child.langue}>
      <header className="child-head">
        <div className="child-head-avatar">
          <AnimalAvatar animal={child.avatarAnimal} size={80} ariaLabel={child.prenom} />
        </div>
        <div className="child-head-text">
          <p className="child-greeting">
            {t(greet)}, <em>{child.prenom}.</em>
          </p>
          <p className="child-stars" aria-label={c.stars(child.etoiles)}>
            <span aria-hidden="true" className="child-stars-glyph">✦</span>
            <span className="child-stars-num">{child.etoiles}</span>
          </p>
        </div>
      </header>

      {/* GROS bouton · l'histoire du soir. Route vers /hoeren en
          transmettant childId pour que la lecture logue les mots
          appris (branché à l'étape suivante). */}
      <Link
        href={`/${locale}/hoeren?child=${child.id}&langue=${child.langue}`}
        className="child-story"
        onClick={playTouchSound}
      >
        <span className="child-story-h">{t(c.story)}</span>
        <span className="child-story-sub">{t(c.storySub)} — {langueName}</span>
        <span className="child-story-arrow" aria-hidden="true">▸</span>
      </Link>

      {/* Grandes tuiles imagées, ≥44px tactile, aucun texte long. */}
      <ul className="child-tiles">
        <li>
          <Link
            href={`/${locale}/hoeren?child=${child.id}&type=songs`}
            className="child-tile child-tile-songs"
            onClick={playTouchSound}
          >
            <span className="child-tile-glyph" aria-hidden="true">♪</span>
            <span className="child-tile-h">{t(c.tileSongs)}</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/hoeren?child=${child.id}&type=words`}
            className="child-tile child-tile-words"
            onClick={playTouchSound}
          >
            <span className="child-tile-glyph" aria-hidden="true">✎</span>
            <span className="child-tile-h">{t(c.tileWords)}</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/quiz?child=${child.id}&mode=parent-child`}
            className="child-tile child-tile-game"
            onClick={playTouchSound}
          >
            <span className="child-tile-glyph" aria-hidden="true">◈</span>
            <span className="child-tile-h">{t(c.tileGame)}</span>
            <span className="child-tile-sub">{t(c.tileGameSub)}</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            className="child-tile child-tile-stars"
            onClick={playTouchSound}
            aria-label={c.tileStars}
          >
            <span className="child-tile-glyph" aria-hidden="true">✦</span>
            <span className="child-tile-h">{t(c.tileStars)}</span>
            <span className="child-tile-count">{child.etoiles}</span>
          </button>
        </li>
      </ul>

      <ExitToParent locale={locale} loc={loc} />
    </main>
  );
}

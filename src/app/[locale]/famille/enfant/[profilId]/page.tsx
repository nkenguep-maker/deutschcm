"use client";

// /famille/enfant/[profilId] · mode enfant · layout isolé.
//
// Multi-langues · en tête, si l'enfant a 2+ langues, un sélecteur
// d'univers (pastilles rondes imagées, tactiles, PAS de menu texte).
// Toucher = bascule activeLangue. Chaque langue garde ses étoiles et
// ses mots. La distinction natale/étrangère n'est PAS visible côté
// enfant — seul le contenu change (contes vs comptines).
//
// Frontière stricte : aucun topbar adulte, aucun lien vers pricing/
// settings/compte. Sortie exclusivement via <ExitToParent>.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AnimalAvatar, type AvatarAnimal } from "@/components/famille/AnimalAvatar";
import { ExitToParent } from "@/components/famille/ExitToParent";
import { frTypo } from "@/components/landing/typo";
import { getLanguage } from "@/lib/languages";
import type { ChildLangue } from "@/lib/childScales";

interface Child {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
  age: number;
  activeLangue: string | null;
  langues: ChildLangue[];
}

// Palette par langue pour les pastilles du sélecteur d'univers · un
// duotone doux par langue, jamais chargé, pour rester lisibles à 44px.
// La correspondance langue → couleur est déterministe (hash simple)
// pour rester stable entre sessions.
const UNIVERSE_PALETTES = [
  { bg: "#C9843F", accent: "#F0CE8B" }, // orange terre
  { bg: "#4A7C59", accent: "#F0CE8B" }, // vert forêt
  { bg: "#B8482B", accent: "#F4EBDC" }, // renard
  { bg: "#7A8B99", accent: "#F0CE8B" }, // bleu-gris
  { bg: "#8E6BC3", accent: "#F4EBDC" }, // améthyste douce
  { bg: "#D9A855", accent: "#3A1A16" }, // laiton
];
function paletteFor(langueId: string) {
  let hash = 0;
  for (let i = 0; i < langueId.length; i++) hash = (hash * 31 + langueId.charCodeAt(i)) | 0;
  return UNIVERSE_PALETTES[Math.abs(hash) % UNIVERSE_PALETTES.length];
}

const COPY = {
  fr: {
    greetingMorning: "Bonjour",
    greetingAfternoon: "Coucou",
    greetingEvening: "Bonsoir",
    stars: (n: number) => (n <= 1 ? `${n} étoile` : `${n} étoiles`),
    story: "L'histoire du soir",
    storySub: "à écouter ensemble",
    rhyme: "Une comptine ce soir",
    rhymeSub: "à répéter ensemble",
    tileSongs: "Les chansons",
    tileWords: "Les mots",
    tileGame: "Le jeu du jour",
    tileGameSub: "avec papa ou maman",
    tileStars: "Mes étoiles",
    notFound: "Personne ici. On rentre à la maison ?",
    goBack: "Retour",
    universeAria: "Choisir une langue",
  },
  en: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Hi there",
    greetingEvening: "Good evening",
    stars: (n: number) => (n <= 1 ? `${n} star` : `${n} stars`),
    story: "Tonight's tale",
    storySub: "to listen to together",
    rhyme: "A rhyme tonight",
    rhymeSub: "to repeat together",
    tileSongs: "The songs",
    tileWords: "The words",
    tileGame: "Today's game",
    tileGameSub: "with mum or dad",
    tileStars: "My stars",
    notFound: "No one here. Shall we go back?",
    goBack: "Back",
    universeAria: "Choose a language",
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
  const [switching, setSwitching] = useState(false);

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
    if (typeof window === "undefined") return;
    if ("vibrate" in navigator) {
      try { navigator.vibrate?.(12); } catch { /* ok */ }
    }
  };

  const switchUniverse = async (langueId: string) => {
    if (!child || child.activeLangue === langueId) return;
    setSwitching(true);
    playTouchSound();
    try {
      const res = await fetch(`/api/family/children/${child.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activeLangue: langueId }),
      });
      if (res.ok) {
        const d = await res.json();
        setChild(d.child as Child);
      }
    } finally {
      setSwitching(false);
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

  const activeLangue = child.langues.find((l) => l.langue === child.activeLangue) ?? child.langues[0] ?? null;
  const isNative = activeLangue?.type === "native";
  const langueMeta = activeLangue ? getLanguage(activeLangue.langue) : null;
  const langueName = langueMeta ? (loc === "en" ? langueMeta.nameEn : langueMeta.name) : "";

  const heroTitle = isNative ? c.story : c.rhyme;
  const heroSub = isNative ? c.storySub : c.rhymeSub;
  const heroHref = isNative
    ? `/${locale}/hoeren?child=${child.id}&langue=${activeLangue?.langue}`
    : `/${locale}/hoeren?child=${child.id}&langue=${activeLangue?.langue}&type=rhyme`;

  return (
    <main className={`child-shell ${switching ? "child-switching" : ""}`} data-langue={activeLangue?.langue}>
      {/* Sélecteur d'univers · pastilles rondes tactiles, sans texte de
          menu. Une pastille par langue de l'enfant. Toucher = bascule. */}
      {child.langues.length >= 2 && activeLangue ? (
        <nav className="child-universe" aria-label={c.universeAria}>
          {child.langues.map((l) => {
            const p = paletteFor(l.langue);
            const meta = getLanguage(l.langue);
            const active = l.langue === activeLangue.langue;
            return (
              <button
                key={l.langue}
                type="button"
                className={`child-universe-pastel ${active ? "active" : ""}`}
                onClick={() => switchUniverse(l.langue)}
                style={{ background: p.bg, borderColor: active ? p.accent : "transparent" }}
                aria-label={loc === "en" ? meta.nameEn : meta.name}
                aria-pressed={active}
              >
                <span className="child-universe-code" style={{ color: p.accent }}>
                  {meta.code}
                </span>
              </button>
            );
          })}
        </nav>
      ) : null}

      <header className="child-head">
        <div className="child-head-avatar">
          <AnimalAvatar animal={child.avatarAnimal} size={80} ariaLabel={child.prenom} />
        </div>
        <div className="child-head-text">
          <p className="child-greeting">
            {t(greet)}, <em>{child.prenom}.</em>
          </p>
          <p className="child-stars" aria-label={c.stars(activeLangue?.etoiles ?? 0)}>
            <span aria-hidden="true" className="child-stars-glyph">✦</span>
            <span className="child-stars-num">{activeLangue?.etoiles ?? 0}</span>
          </p>
        </div>
      </header>

      {activeLangue ? (
        <Link
          href={heroHref}
          className="child-story"
          onClick={playTouchSound}
        >
          <span className="child-story-h">{t(heroTitle)}</span>
          <span className="child-story-sub">{t(heroSub)} — {langueName}</span>
          <span className="child-story-arrow" aria-hidden="true">▸</span>
        </Link>
      ) : null}

      <ul className="child-tiles">
        <li>
          <Link
            href={`/${locale}/hoeren?child=${child.id}&type=songs${activeLangue ? `&langue=${activeLangue.langue}` : ""}`}
            className="child-tile child-tile-songs"
            onClick={playTouchSound}
          >
            <span className="child-tile-glyph" aria-hidden="true">♪</span>
            <span className="child-tile-h">{t(c.tileSongs)}</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/hoeren?child=${child.id}&type=words${activeLangue ? `&langue=${activeLangue.langue}` : ""}`}
            className="child-tile child-tile-words"
            onClick={playTouchSound}
          >
            <span className="child-tile-glyph" aria-hidden="true">✎</span>
            <span className="child-tile-h">{t(c.tileWords)}</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/quiz?child=${child.id}&mode=parent-child${activeLangue ? `&langue=${activeLangue.langue}` : ""}`}
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
            <span className="child-tile-count">{activeLangue?.etoiles ?? 0}</span>
          </button>
        </li>
      </ul>

      <ExitToParent locale={locale} loc={loc} />
    </main>
  );
}

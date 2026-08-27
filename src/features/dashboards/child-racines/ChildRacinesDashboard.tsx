"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import type { ChildData } from "@/features/dashboards/child-monde/types";
import game from "@/features/dashboards/child-game/ChildGameDashboard.module.css";

type Props = { locale: "fr" | "en"; child: ChildData; activeSectionId?: string };
type LocalProgress = { completedLessonIds: string[]; xp: number };

const ALLOWED = new Set(["case", "quete", "chemin", "missions", "contes", "chansons", "badges", "progression", "famille"]);

function stepFromEchelle(echelle: number): "E1" | "E2" | "E3" | "E4" | "E5" | null {
  if (!Number.isFinite(echelle) || echelle < 0) return null;
  if (echelle < 2) return "E1";
  if (echelle < 4) return "E2";
  if (echelle < 6) return "E3";
  if (echelle < 8) return "E4";
  return "E5";
}

function courseIdFor(language: string | null | undefined) {
  const value = (language ?? "").toLowerCase();
  if (value.includes("lingala")) return "racines-child-ln-e1";
  if (value.includes("medumba") || value.includes("bangang") || value.includes("byv")) return "racines-child-byv-e1";
  return null;
}

function readProgress(courseId: string | null): LocalProgress {
  if (!courseId) return { completedLessonIds: [], xp: 0 };
  try {
    const raw = window.localStorage.getItem(`yema.prod.child.${courseId}`);
    if (!raw) return { completedLessonIds: [], xp: 0 };
    const parsed = JSON.parse(raw) as Partial<LocalProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string") : [],
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
    };
  } catch {
    return { completedLessonIds: [], xp: 0 };
  }
}

function avatarEmoji(animal: string) {
  const value = animal.toLowerCase();
  if (value.includes("lion")) return "🦁";
  if (value.includes("éléphant") || value.includes("elephant")) return "🐘";
  if (value.includes("singe") || value.includes("monkey")) return "🐒";
  if (value.includes("girafe")) return "🦒";
  return "🌿";
}

export function ChildRacinesDashboard({ locale, child, activeSectionId = "case" }: Props) {
  const t = useTranslations("yemaDashboards.childRacines");
  const currentLocale = useLocale() || locale;
  const baseHref = `/${currentLocale}/dashboard`;
  const messagesHref = `/${currentLocale}/messages`;
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "case";
  const [exiting, setExiting] = useState(false);
  const activeLang = child.langues.find((language) => language.langue === child.activeLangue) ?? child.langues[0] ?? null;
  const step = activeLang ? stepFromEchelle(activeLang.echelle) : null;
  const languageLabel = activeLang?.langue ?? child.activeLangue ?? "Racines";
  const courseId = courseIdFor(languageLabel);
  const courseHref = courseId ? `/${currentLocale}/qa/child-course-preview/${courseId}` : `/${currentLocale}/qa/child-course-preview`;
  const [progress, setProgress] = useState<LocalProgress>({ completedLessonIds: [], xp: 0 });
  const completedCount = progress.completedLessonIds.length;
  const completedUnits = Math.floor(completedCount / 4);
  const progressPct = Math.min(100, Math.round((completedCount / 32) * 100));
  const totalStars = child.langues.reduce((total, language) => total + (language.etoiles ?? 0), 0);
  const isFr = currentLocale === "fr";

  useEffect(() => setProgress(readProgress(courseId)), [courseId]);

  const copy = useMemo(() => isFr ? {
    kicker: "TA VOIX DU JOUR",
    hero: `On y va, ${child.prenom} !`,
    heroText: `${languageLabel} se réveille avec ta voix : écoute, reconnais, répète puis réponds.`,
    quest: completedCount ? "Reprends ta quête orale" : "Ta première quête orale",
    questText: completedCount ? `Tu as déjà traversé ${completedCount} petites étapes. Continue sans te presser.` : "Écoute d’abord. Tu peux répéter autant de fois que tu veux. Ici, on apprend en parlant.",
    play: completedCount ? "Continuer la quête" : "Commencer la quête",
    path: "Le chemin de ta voix",
    pathSub: `${completedUnits}/8 missions vécues`,
    tales: "Contes",
    songs: "Chansons",
    badges: "Trésors",
    family: "En famille",
    progress: "Ma voix grandit",
    comingText: "Cette zone s’ouvrira avec de nouvelles voix, chansons et histoires. Ton parcours principal est déjà jouable.",
    familyText: "Choisis une phrase du parcours et partage-la avec quelqu’un de ta famille.",
    badgeText: totalStars ? `${totalStars} étoiles brillent déjà dans ta case.` : "Tes premiers trésors arriveront au fil des écoutes.",
  } : {
    kicker: "YOUR VOICE TODAY",
    hero: `Let's go, ${child.prenom}!`,
    heroText: `${languageLabel} wakes up through your voice: listen, recognise, repeat, then answer.`,
    quest: completedCount ? "Continue your speaking quest" : "Your first speaking quest",
    questText: completedCount ? `You already crossed ${completedCount} small steps. Keep going at your pace.` : "Listen first. Repeat as many times as you need. Here, you learn by speaking.",
    play: completedCount ? "Continue quest" : "Start quest",
    path: "Your voice path",
    pathSub: `${completedUnits}/8 missions lived`,
    tales: "Tales",
    songs: "Songs",
    badges: "Treasures",
    family: "With family",
    progress: "My voice grows",
    comingText: "This zone will open with new voices, songs and stories. Your main path is already playable.",
    familyText: "Pick one phrase from your path and share it with someone in your family.",
    badgeText: totalStars ? `${totalStars} stars already shine in your home.` : "Your first treasures will arrive as you listen and speak.",
  }, [child.prenom, completedCount, completedUnits, isFr, languageLabel, totalStars]);

  const exitChildMode = async () => {
    setExiting(true);
    try { await fetch("/api/child-session", { method: "DELETE" }); }
    finally { window.location.href = `/${currentLocale}/login`; }
  };

  const href = (section: string) => sectionPageHref(baseHref, section, "case");

  const home = (
    <>
      <section className={game.hero}>
        <div>
          <p className={game.kicker}>{copy.kicker}</p>
          <h1>{copy.hero}</h1>
          <p className={game.heroText}>{copy.heroText}</p>
        </div>
        <div className={game.mascot} aria-label={child.avatarAnimal || "YEMA"}>
          <span className={game.mascotStar}>{avatarEmoji(child.avatarAnimal)}</span>
          <span className={game.mascotMouth} />
        </div>
      </section>

      <section className={game.quest}>
        <div className={game.questHead}>
          <div>
            <p className={game.kicker}>🎙️ {isFr ? "QUÊTE ORALE" : "VOICE QUEST"}</p>
            <h2 className={game.questTitle}>{copy.quest}</h2>
            <p className={game.questText}>{copy.questText}</p>
          </div>
          <div className={game.reward}>+ 🌟</div>
        </div>
        <div className={game.progressTrack}><span className={game.progressFill} style={{ width: `${progressPct}%` }} /></div>
        <Link className={game.cta} href={courseHref}>{copy.play} →</Link>
      </section>

      <section className={game.section}>
        <div className={game.sectionHeader}><h2>{copy.path}</h2><span>{copy.pathSub}</span></div>
        <div className={game.path}>
          {Array.from({ length: 8 }, (_, index) => {
            const unit = index + 1;
            const done = completedUnits >= unit;
            return <Link key={unit} className={`${game.pathNode} ${done ? game.pathNodeDone : ""}`} href={courseHref}>{done ? "✓" : unit}<span className={game.pathLabel}>{isFr ? `Mission ${unit}` : `Mission ${unit}`}</span></Link>;
          })}
        </div>
      </section>

      <section className={game.section}>
        <div className={game.menuGrid}>
          <Link className={game.menuCard} href={href("contes")}><span className={game.menuIcon}>🔥</span><strong>{copy.tales}</strong><span>{isFr ? "Écouter, imaginer, raconter" : "Listen, imagine, retell"}</span></Link>
          <Link className={game.menuCard} href={href("chansons")}><span className={game.menuIcon}>🎵</span><strong>{copy.songs}</strong><span>{isFr ? "Rythme, voix et répétition" : "Rhythm, voice and repetition"}</span></Link>
          <Link className={game.menuCard} href={href("badges")}><span className={game.menuIcon}>🏆</span><strong>{copy.badges}</strong><span>{copy.badgeText}</span></Link>
          <Link className={game.menuCard} href={href("famille")}><span className={game.menuIcon}>👨‍👩‍👧</span><strong>{copy.family}</strong><span>{copy.familyText}</span></Link>
        </div>
      </section>
    </>
  );

  const emptyGame = (icon: string, title: string, body: string) => (
    <section className={game.emptyGame}><div><div className={game.emptyIcon}>{icon}</div><h2>{title}</h2><p>{body}</p><Link className={game.cta} href={courseHref}>{copy.play} →</Link></div></section>
  );

  const content: Record<string, React.ReactNode> = {
    case: home, quete: home, chemin: home, missions: home,
    contes: emptyGame("🔥", t("tales.title"), copy.comingText),
    chansons: emptyGame("🎵", t("songs.title"), copy.comingText),
    badges: emptyGame("🏆", t("badges.title"), copy.badgeText),
    progression: emptyGame("🎙️", copy.progress, `${completedCount}/32 · ${progress.xp} XP · ${step ?? "E1"}`),
    famille: emptyGame("👨‍👩‍👧", t("familyActivities.title"), copy.familyText),
  };

  const nav = [
    { id: "case", icon: "🏡", label: t("mobileNav.home") },
    { id: "contes", icon: "🔥", label: t("mobileNav.tales") },
    { id: "chansons", icon: "🎵", label: t("mobileNav.songs") },
    { id: "badges", icon: "🏆", label: t("mobileNav.badges") },
  ];

  return (
    <main className={game.page} data-universe="racines">
      <div className={game.shell}>
        <header className={game.topbar}>
          <Link className={game.brand} href={`/${currentLocale}`}><span className={game.brandMark}>Y</span> YEMA KIDS</Link>
          <Link data-testid="child-messages-cta" href={messagesHref} style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>{t("openMessages")}</Link>
          <button className={game.exit} type="button" onClick={exitChildMode} disabled={exiting}>{exiting ? "…" : isFr ? "Sortir" : "Exit"}</button>
        </header>
        <div className={game.statusRow}>
          <div className={game.statusPill}>🌟 {totalStars}</div>
          <div className={game.statusPill}>🎙️ {step ?? "E1"}</div>
          <div className={game.statusPill}>🗺️ {completedUnits}/8</div>
        </div>
        <div data-live-persona-section={activeSection}>{content[activeSection]}</div>
      </div>
      <nav className={game.bottomNav} aria-label={t("personaLabel")}>
        {nav.map((item) => <Link key={item.id} href={href(item.id)} className={`${game.navItem} ${activeSection === item.id || (item.id === "case" && ["quete","chemin","missions"].includes(activeSection)) ? game.navActive : ""}`}><b>{item.icon}</b><span>{item.label}</span></Link>)}
      </nav>
    </main>
  );
}

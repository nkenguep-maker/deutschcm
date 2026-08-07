"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sectionPageHref } from "@/features/dashboards/shared/sectionRouting";
import type { ChildData } from "./types";
import game from "@/features/dashboards/child-game/ChildGameDashboard.module.css";

type Props = { locale: "fr" | "en"; child: ChildData; activeSectionId?: string };
type LocalProgress = { completedLessonIds: string[]; xp: number };

const COURSE_ID = "monde-child-de-a1";
const ALLOWED = new Set(["maison", "quete", "chemin", "missions", "recompense", "jeux", "histoires", "badges", "progression", "avec-adulte"]);

function readProgress(): LocalProgress {
  try {
    const raw = window.localStorage.getItem(`yema.prod.child.${COURSE_ID}`);
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
  if (value.includes("chat") || value.includes("cat")) return "🐱";
  if (value.includes("chien") || value.includes("dog")) return "🐶";
  return "⭐";
}

export function ChildMondeDashboard({ locale, child, activeSectionId = "maison" }: Props) {
  const t = useTranslations("yemaDashboards.childMonde");
  const currentLocale = useLocale() || locale;
  const baseHref = `/${currentLocale}/dashboard`;
  const courseHref = `/${currentLocale}/qa/child-course-preview/${COURSE_ID}`;
  const activeSection = ALLOWED.has(activeSectionId) ? activeSectionId : "maison";
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState<LocalProgress>({ completedLessonIds: [], xp: 0 });
  const totalStars = child.langues.reduce((total, language) => total + (language.etoiles ?? 0), 0);
  const completedCount = progress.completedLessonIds.length;
  const progressPct = Math.min(100, Math.round((completedCount / 32) * 100));
  const completedUnits = Math.floor(completedCount / 4);
  const isFr = currentLocale === "fr";

  useEffect(() => setProgress(readProgress()), []);

  const copy = useMemo(() => isFr ? {
    kicker: "TON AVENTURE DU JOUR",
    hero: `Salut ${child.prenom} !`,
    heroText: "Une petite mission, quelques minutes, et ton allemand grandit.",
    quest: completedCount ? "Continue ton aventure" : "Ta première aventure t’attend",
    questText: completedCount ? `Tu as déjà terminé ${completedCount} activités de leçon. Repars exactement où tu veux.` : "Commence avec les salutations. Écoute, touche, répète et gagne tes premières étoiles.",
    play: completedCount ? "Continuer à jouer" : "Jouer maintenant",
    path: "Ton chemin",
    pathSub: `${completedUnits}/8 missions traversées`,
    games: "Mini-jeux",
    stories: "Histoires",
    badges: "Trésors",
    adult: "Avec un adulte",
    progress: "Mon progrès",
    comingTitle: "Cette zone se prépare !",
    comingText: "Ton aventure principale est déjà jouable. Les nouveaux jeux arrivent ici au fil des prochaines missions.",
    badgeText: totalStars ? `Tu as ${totalStars} étoiles dans ton profil.` : "Tes premiers trésors apparaîtront après tes missions.",
    adultText: "Choisis une petite mission et montre à un adulte ce que tu sais dire.",
  } : {
    kicker: "TODAY'S ADVENTURE",
    hero: `Hi ${child.prenom}!`,
    heroText: "One short quest, a few minutes, and your German grows.",
    quest: completedCount ? "Continue your adventure" : "Your first adventure is waiting",
    questText: completedCount ? `You already finished ${completedCount} lesson activities. Jump back in whenever you like.` : "Start with greetings. Listen, tap, repeat and earn your first stars.",
    play: completedCount ? "Keep playing" : "Play now",
    path: "Your path",
    pathSub: `${completedUnits}/8 missions cleared`,
    games: "Mini-games",
    stories: "Stories",
    badges: "Treasures",
    adult: "With an adult",
    progress: "My progress",
    comingTitle: "This zone is getting ready!",
    comingText: "Your main adventure is already playable. New games will appear here with future missions.",
    badgeText: totalStars ? `You have ${totalStars} stars on your profile.` : "Your first treasures will appear after your missions.",
    adultText: "Pick a short mission and show an adult what you can say.",
  }, [child.prenom, completedCount, completedUnits, isFr, totalStars]);

  const exitChildMode = async () => {
    setExiting(true);
    try { await fetch("/api/child-session", { method: "DELETE" }); }
    finally { window.location.href = `/${currentLocale}/login`; }
  };

  const href = (section: string) => sectionPageHref(baseHref, section, "maison");

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
            <p className={game.kicker}>⚡ {isFr ? "QUÊTE" : "QUEST"}</p>
            <h2 className={game.questTitle}>{copy.quest}</h2>
            <p className={game.questText}>{copy.questText}</p>
          </div>
          <div className={game.reward}>+ ⭐</div>
        </div>
        <div className={game.progressTrack} aria-label={copy.progress}><span className={game.progressFill} style={{ width: `${progressPct}%` }} /></div>
        <Link className={game.cta} href={courseHref}>{copy.play} →</Link>
      </section>

      <section className={game.section}>
        <div className={game.sectionHeader}><h2>{copy.path}</h2><span>{copy.pathSub}</span></div>
        <div className={game.path}>
          {Array.from({ length: 8 }, (_, index) => {
            const unit = index + 1;
            const done = completedUnits >= unit;
            return (
              <Link key={unit} className={`${game.pathNode} ${done ? game.pathNodeDone : ""}`} href={`${courseHref}/de-child-a1-u${unit}`}>
                {done ? "✓" : unit}
                <span className={game.pathLabel}>{isFr ? `Mission ${unit}` : `Mission ${unit}`}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={game.section}>
        <div className={game.menuGrid}>
          <Link className={game.menuCard} href={href("jeux")}><span className={game.menuIcon}>🎮</span><strong>{copy.games}</strong><span>{isFr ? "Courtes activités à rejouer" : "Short activities to replay"}</span></Link>
          <Link className={game.menuCard} href={href("histoires")}><span className={game.menuIcon}>📚</span><strong>{copy.stories}</strong><span>{isFr ? "Écoute et reconnais les mots" : "Listen and spot familiar words"}</span></Link>
          <Link className={game.menuCard} href={href("badges")}><span className={game.menuIcon}>🏆</span><strong>{copy.badges}</strong><span>{copy.badgeText}</span></Link>
          <Link className={game.menuCard} href={href("avec-adulte")}><span className={game.menuIcon}>🤝</span><strong>{copy.adult}</strong><span>{copy.adultText}</span></Link>
        </div>
      </section>
    </>
  );

  const emptyGame = (icon: string, title: string, body: string) => (
    <section className={game.emptyGame}><div><div className={game.emptyIcon}>{icon}</div><h2>{title}</h2><p>{body}</p><Link className={game.cta} href={courseHref}>{copy.play} →</Link></div></section>
  );

  const content: Record<string, React.ReactNode> = {
    maison: home, quete: home, chemin: home, missions: home, recompense: home,
    jeux: emptyGame("🎮", t("games.title"), copy.comingText),
    histoires: emptyGame("📚", t("stories.title"), copy.comingText),
    badges: emptyGame("🏆", t("badges.title"), copy.badgeText),
    progression: emptyGame("🚀", copy.progress, `${completedCount}/32 · ${progress.xp} XP · ${progressPct}%`),
    "avec-adulte": emptyGame("🤝", t("adultActivities.title"), copy.adultText),
  };

  const nav = [
    { id: "maison", icon: "🏠", label: t("mobileNav.home") },
    { id: "jeux", icon: "🎮", label: t("mobileNav.games") },
    { id: "histoires", icon: "📚", label: t("mobileNav.stories") },
    { id: "badges", icon: "🏆", label: t("mobileNav.badges") },
  ];

  return (
    <main className={game.page} data-universe="monde">
      <div className={game.shell}>
        <header className={game.topbar}>
          <Link className={game.brand} href={`/${currentLocale}`}><span className={game.brandMark}>Y</span> YEMA KIDS</Link>
          <button className={game.exit} type="button" onClick={exitChildMode} disabled={exiting}>{exiting ? "…" : isFr ? "Sortir" : "Exit"}</button>
        </header>
        <div className={game.statusRow}>
          <div className={game.statusPill}>⭐ {totalStars}</div>
          <div className={game.statusPill}>⚡ {progress.xp} XP</div>
          <div className={game.statusPill}>🗺️ {completedUnits}/8</div>
        </div>
        <div data-live-persona-section={activeSection}>{content[activeSection]}</div>
      </div>
      <nav className={game.bottomNav} aria-label={t("personaLabel")}>
        {nav.map((item) => <Link key={item.id} href={href(item.id)} className={`${game.navItem} ${activeSection === item.id || (item.id === "maison" && ["quete","chemin","missions","recompense"].includes(activeSection)) ? game.navActive : ""}`}><b>{item.icon}</b><span>{item.label}</span></Link>)}
      </nav>
    </main>
  );
}

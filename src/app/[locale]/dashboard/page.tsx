"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import Layout from "@/components/Layout";
import { CefrSpine } from "@/components/landing/CefrSpine";
import { YemaSpine } from "@/components/landing/YemaSpine";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { getYemaLevel } from "@/lib/yemaScale";
import { Teaser } from "@/components/maison/Teaser";
import {
  IconMic,
  IconBook,
  IconContext,
  IconFlame,
  IconSpark,
  IconChart,
  IconCheck,
} from "@/components/landing/icons";

// Dashboard étudiant · Kaffeehaus. Focus continuité d'apprentissage.
// Hero "Ta prochaine étape" · streak/XP bande secondaire · 3 quick actions.

interface UserData {
  fullName?: string;
  germanLevel?: string | null;
  xpTotal: number;
  streakDays: number;
  isValidated?: boolean;
  studentType?: string | null;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof LEVELS)[number];

interface Copy {
  eye: string;
  greet: (name: string) => string;
  h1a: string;
  h1b: string;
  subNoLevel: string;
  subLevel: (level: string) => string;
  ctaTest: string;
  ctaContinue: string;
  hint: string;
  statStreak: string;
  statStreakSub: (n: number) => string;
  statXp: string;
  statXpSub: string;
  statLevel: string;
  statLevelSub: string;
  statNext: string;
  statNextSub: string;
  exploreEye: string;
  exploreH: string;
  simTitle: string;
  simDesc: string;
  simCta: string;
  discTitle: string;
  discDesc: string;
  discCta: string;
  courseTitle: string;
  courseDesc: string;
  courseCta: string;
  spineAria: string;
}

const FR: Copy = {
  eye: "Tableau de bord",
  greet: (name) => `Bonjour, ${name}.`,
  h1a: "Ta prochaine ",
  h1b: "étape.",
  subNoLevel:
    "Commence par un test de niveau — dix minutes qui décident du chapitre à ouvrir.",
  subLevel: (level) =>
    `Tu es au niveau ${level}. Reprends là où tu t'es arrêté·e, même quelques minutes.`,
  ctaTest: "Tester mon niveau",
  ctaContinue: "Continuer ma leçon",
  hint: "Cinq minutes par jour valent mieux qu'une heure une fois par semaine.",
  statStreak: "Série",
  statStreakSub: (n) => (n === 0 ? "Commence aujourd'hui" : n === 1 ? "1 jour d'affilée" : `${n} jours d'affilée`),
  statXp: "XP cumulés",
  statXpSub: "Progression totale",
  statLevel: "Niveau",
  statLevelSub: "CECRL A1 → C1",
  statNext: "Prochain palier",
  statNextSub: "Continuité",
  exploreEye: "Explorer",
  exploreH: "Trois portes ouvertes.",
  simTitle: "Simulateur",
  simDesc: "Une conversation avec Klaus, ton coach IA. Scénarios réels, correction en direct.",
  simCta: "Ouvrir",
  discTitle: "Découvrir",
  discDesc: "Trouve d'autres apprenant·e·s, partage ton parcours, entraîne-toi ensemble.",
  discCta: "Explorer",
  courseTitle: "Cours",
  courseDesc: "Le catalogue complet des leçons alignées CECRL, du A1 au C1. Rythme libre.",
  courseCta: "Voir",
  spineAria: "Ton parcours CECRL",
};

const EN: Copy = {
  eye: "Dashboard",
  greet: (name) => `Hello, ${name}.`,
  h1a: "Your next ",
  h1b: "step.",
  subNoLevel:
    "Start with a level test — ten minutes that decide which chapter to open.",
  subLevel: (level) =>
    `You're at level ${level}. Pick up where you left off, even for a few minutes.`,
  ctaTest: "Take the level test",
  ctaContinue: "Resume my lesson",
  hint: "Five minutes a day beats one hour once a week.",
  statStreak: "Streak",
  statStreakSub: (n) => (n === 0 ? "Start today" : n === 1 ? "1 day" : `${n} days in a row`),
  statXp: "XP earned",
  statXpSub: "Total progress",
  statLevel: "Level",
  statLevelSub: "CEFR A1 → C1",
  statNext: "Next step",
  statNextSub: "Continuity",
  exploreEye: "Explore",
  exploreH: "Three open doors.",
  simTitle: "Simulator",
  simDesc: "A conversation with Klaus, your AI coach. Real scenarios, instant correction.",
  simCta: "Open",
  discTitle: "Discover",
  discDesc: "Find fellow learners, share your journey, practice together.",
  discCta: "Explore",
  courseTitle: "Courses",
  courseDesc: "The full CEFR-aligned catalog, from A1 to C1. Free pacing.",
  courseCta: "Browse",
  spineAria: "Your CEFR journey",
};

function nextLevel(current: Level | null): Level | "C2" {
  if (!current) return "A1";
  const idx = LEVELS.indexOf(current);
  if (idx === -1 || idx === LEVELS.length - 1) return "C2";
  return LEVELS[idx + 1];
}

// Palier suivant dans une échelle arbitraire (CECRL ou YEMA).
// Le dernier palier reste sur lui-même — pas de "C2" fictif pour YEMA.
function nextInScale(current: string | null, levels: readonly string[]): string {
  if (!current) return levels[0];
  const idx = levels.indexOf(current);
  if (idx === -1 || idx === levels.length - 1) return levels[levels.length - 1];
  return levels[idx + 1];
}

export default function StudentDashboard() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const { language: activeLang } = useActiveLanguage();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setData({
            fullName: d.fullName,
            germanLevel: d.germanLevel,
            xpTotal: d.xpTotal ?? 0,
            streakDays: d.streakDays ?? 0,
            isValidated: d.isValidated,
            studentType: d.studentType,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = (data?.fullName ?? "").split(" ")[0] || (locale === "en" ? "you" : "toi");

  // Niveau adapté à la langue active. Pour l'allemand → germanLevel
  // legacy. Pour les autres langues → premier palier de l'échelle
  // (en attendant le model UserLanguage). Le hero et le spine
  // reflètent tous deux la langue active.
  const isGerman = activeLang.id === "deutsch";
  const isYema = activeLang.scale === "yema";
  const levelsArray = activeLang.levels;
  const rawLevel = isGerman ? (data?.germanLevel ?? null) : levelsArray[0];
  const level = rawLevel && levelsArray.includes(rawLevel) ? rawLevel : null;
  const hasLevel = !!level;
  // Spine display : pour foreign on affiche le niveau CECRL réel (fallback A1),
  // pour native on affiche le palier YEMA (É1 par défaut, en attendant
  // le model UserLanguage qui portera un niveau par langue).
  const currentSpineCefr = (isGerman && hasLevel ? level : "A1") as Level;
  const currentSpineYema = level ?? levelsArray[0];

  // Palier + nom éditorial YEMA (Écoute, Voix, Récit, Palabre, Foyer).
  // Utilisé pour enrichir le hero sub et l'aria du spine.
  const yemaMeta = isYema && hasLevel ? getYemaLevel(level as string) : null;
  const yemaName = yemaMeta ? (locale === "en" ? yemaMeta.nameEn : yemaMeta.name) : null;

  // Copy language-aware. On surcharge les libellés qui parlent explicitement
  // de CECRL quand l'apprenant·e est sur une langue natale.
  const spineAria = isYema
    ? (locale === "en" ? "Your YEMA journey" : "Ton parcours YEMA")
    : t.spineAria;
  const courseDesc = isYema
    ? (locale === "en"
        ? "Modules built for oral tradition — greeting, marketplace, story, palaver, home. Free pacing."
        : "Modules pensés pour l'oralité — salut, marché, récit, palabre, foyer. Rythme libre.")
    : t.courseDesc;
  const testHref = isYema ? "/courses" : "/test-niveau";
  const testLabel = isYema
    ? (locale === "en" ? "Open the first stage" : "Ouvrir le premier palier")
    : t.ctaTest;

  const ctaHref = hasLevel ? "/courses" : testHref;
  const ctaLabel = hasLevel ? t.ctaContinue : testLabel;
  // Sub level enrichi pour YEMA : "Tu es au palier É1 · Écoute" au lieu de "É1"
  const subLevelText = hasLevel
    ? (yemaName
        ? (locale === "en"
            ? `You're at stage ${level} · ${yemaName}. Come back to it, even briefly.`
            : `Tu es au palier ${level} · ${yemaName}. Reviens-y, même brièvement.`)
        : t.subLevel(level as string))
    : t.subNoLevel;

  return (
    <Layout title={t.eye}>
      <section className="dash" aria-labelledby="dash-h1">
        <header style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <p className="dash-eye" style={{ margin: 0 }}>{t.greet(firstName)}</p>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: 999,
            border: "1px solid var(--brass-edge)",
            background: "var(--brass-glow)",
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--brass)",
          }}>
            <span style={{
              width: 20, height: 20,
              borderRadius: 5,
              background: "var(--brass)",
              color: "var(--espresso)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9.5, fontWeight: 700, letterSpacing: 0,
            }} aria-hidden="true">{activeLang.code}</span>
            <span style={{ textTransform: "uppercase" }}>
              {locale === "en" ? activeLang.nameEn : activeLang.name} · {activeLang.scale === "yema" ? "YEMA" : "CECRL"}
            </span>
          </span>
        </header>

        <article className="dash-hero">
          <div>
            <h1 id="dash-h1" className="dash-hero-h">
              {t.h1a}
              <em>{t.h1b}</em>
            </h1>
            <p className="dash-hero-sub">{subLevelText}</p>
            <Link href={ctaHref} className="dash-hero-cta">
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <p style={{
              marginTop: 18,
              color: "var(--creme-mute)",
              fontSize: 12.5,
              fontFamily: "var(--font-jetbrains, monospace)",
              letterSpacing: "0.04em",
            }}>
              {t.hint}
            </p>
          </div>
          <div className="dash-hero-side" aria-label={spineAria}>
            {isYema ? (
              <YemaSpine
                current={currentSpineYema}
                locale={locale === "en" ? "en" : "fr"}
                compact
              />
            ) : (
              <CefrSpine current={currentSpineCefr} locale={locale === "en" ? "en" : "fr"} compact />
            )}
          </div>
        </article>

        <section aria-label={t.exploreEye} className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconFlame size={13} /></span>
              {t.statStreak}
            </p>
            <p className="dash-stat-val">{loading ? "—" : data?.streakDays ?? 0}</p>
            <p className="dash-stat-sub">{t.statStreakSub(data?.streakDays ?? 0)}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconSpark size={13} /></span>
              {t.statXp}
            </p>
            <p className="dash-stat-val">{loading ? "—" : (data?.xpTotal ?? 0).toLocaleString()}</p>
            <p className="dash-stat-sub">{t.statXpSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconCheck size={13} /></span>
              {t.statLevel}
            </p>
            <p className="dash-stat-val">{hasLevel ? level : "—"}</p>
            <p className="dash-stat-sub">
              {activeLang.scale === "yema"
                ? "É1 → É5"
                : `${activeLang.levels[0]} → ${activeLang.levels[activeLang.levels.length - 1]}`}
            </p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconChart size={13} /></span>
              {t.statNext}
            </p>
            <p className="dash-stat-val">
              {isYema
                ? nextInScale(hasLevel ? (level as string) : null, levelsArray)
                : nextLevel(hasLevel ? (level as Level) : null)}
            </p>
            <p className="dash-stat-sub">{t.statNextSub}</p>
          </div>
        </section>

        <section aria-labelledby="dash-explore-h">
          <p className="dash-eye">{t.exploreEye}</p>
          <h2 id="dash-explore-h" className="dash-block-h">{t.exploreH}</h2>
          <div className="dash-actions">
            <Link href="/simulateur" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconMic size={18} /></span>
              <h3 className="dash-action-title">{t.simTitle}</h3>
              <p className="dash-action-desc">{t.simDesc}</p>
              <p className="dash-action-cta">{t.simCta} →</p>
            </Link>
            <Link href="/discover" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconContext size={18} /></span>
              <h3 className="dash-action-title">{t.discTitle}</h3>
              <p className="dash-action-desc">{t.discDesc}</p>
              <p className="dash-action-cta">{t.discCta} →</p>
            </Link>
            <Link href="/courses" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconBook size={18} /></span>
              <h3 className="dash-action-title">{t.courseTitle}</h3>
              <p className="dash-action-desc">{courseDesc}</p>
              <p className="dash-action-cta">{t.courseCta} →</p>
            </Link>
          </div>
        </section>

        {/* Teaser dashboard · discret, sans bouton — le seul teaser connecté */}
        <div style={{ marginTop: 40 }}>
          <Teaser
            locale={locale === "en" ? "en" : "fr"}
            compact
            line1={locale === "en" ? "A new language is settling in." : "Une nouvelle langue s'installe."}
            line2={locale === "en" ? "The house grows a little every week." : "La maison grandit un peu chaque semaine."}
          />
        </div>
      </section>
    </Layout>
  );
}

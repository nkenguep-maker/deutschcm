"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/navigation";
import { usePathname } from "next/navigation";
import Layout from "@/components/Layout";
import { YEMA_LESSON_META } from "@/data/courses/index";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { YEMA_LEVELS } from "@/lib/yemaScale";
import { YemaSpine } from "@/components/landing/YemaSpine";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
type Filter = "all" | Level;
type Locale = "fr" | "en";

interface Course {
  id: string;
  titleDE: string;
  titleFR: string;
  titleEN: string;
  icon: string;
  level: Level;
  lektionen: string;
  modules: number;
  progress: number;
  locked: boolean;
  comingSoon?: boolean;
  firstModuleId?: string;
}

// ─── Locale text ──────────────────────────────────────────────────────────────

const T = {
  fr: {
    layoutTitle: "Mon parcours",
    pageTitle: "Mon parcours de langue",
    pageSubtitle: "Commencez par les bases, progressez étape par étape et préparez-vous à utiliser l'allemand dans des situations réelles.",
    pageBadge: "Allemand · Première destination : Allemagne",
    filterAll: "Tous",
    noResults: "Aucun cours trouvé",
    noResultsSub: "Essayez un autre filtre ou modifiez votre recherche.",
    coursesDone: (done: number, total: number) => `${done}/${total} cours complétés`,
    journeyTitle: "Apprendre aujourd'hui, se préparer pour demain",
    journeyText: "Chaque leçon vous aide à construire vos bases, pratiquer des situations concrètes et avancer vers votre projet international.",
    pillar1: "Apprendre : vocabulaire, grammaire et compréhension",
    pillar2: "Se préparer : oral, situations réelles et confiance",
    pillar3: "S'intégrer : culture, quotidien et communication utile",
    statusNotStarted: "Non commencé",
    statusCompleted: "Terminé",
    statusPct: (n: number) => `${n}% complété`,
    unlockHint: "Terminez les bases A1 pour accéder à la suite.",
    comingSoonHint: "Bientôt disponible.",
    modulesLabel: "modules",
    levelBadge: "Parcours aligné CECRL",
    disclaimer: "Yema Languages propose une pratique linguistique indépendante alignée sur le CECRL et n'est affiliée à aucun organisme officiel d'examen.",
    levels: {
      A1: { title: "Yema A1 — Premiers pas",          subtitle: "Se présenter, parler de sa famille, comprendre des phrases simples et gérer des situations de base.",    status: "Disponible en bêta",   recommended: true  },
      A2: { title: "Yema A2 — Vie réelle",             subtitle: "Communiquer dans des situations courantes, expliquer ses besoins et se préparer à la vie quotidienne.", status: "Disponible",            recommended: false },
      B1: { title: "Yema B1 — Autonomie",             subtitle: "Échanger avec plus d'assurance dans la vie personnelle, professionnelle et administrative.",            status: "En préparation",       recommended: false },
      B2: { title: "Yema B2 — Communication avancée", subtitle: "Exprimer des opinions, expliquer des projets et comprendre des contenus plus complexes.",              status: "Bientôt disponible",   recommended: false },
      C1: { title: "Yema C1 — Intégration avancée",   subtitle: "Communiquer avec aisance dans un contexte académique, professionnel ou d'intégration avancée.",       status: "Bientôt disponible",   recommended: false },
    },
  },
  en: {
    layoutTitle: "My path",
    pageTitle: "My language path",
    pageSubtitle: "Start with the basics, progress step by step and prepare to use German in real-life situations.",
    pageBadge: "German · First destination: Germany",
    filterAll: "All",
    noResults: "No courses found",
    noResultsSub: "Try a different filter or adjust your search.",
    coursesDone: (done: number, total: number) => `${done}/${total} courses completed`,
    journeyTitle: "Learn today, prepare for tomorrow",
    journeyText: "Each lesson helps you build your foundation, practice real situations and move forward in your international journey.",
    pillar1: "Learn: vocabulary, grammar and comprehension",
    pillar2: "Prepare: speaking, real situations and confidence",
    pillar3: "Belong: culture, daily life and useful communication",
    statusNotStarted: "Not started",
    statusCompleted: "Completed",
    statusPct: (n: number) => `${n}% completed`,
    unlockHint: "Complete the A1 foundations to access the next steps.",
    comingSoonHint: "Coming soon.",
    modulesLabel: "modules",
    levelBadge: "CEFR-aligned path",
    disclaimer: "Yema Languages provides independent CEFR-aligned language practice and is not affiliated with any official examination institute.",
    levels: {
      A1: { title: "Yema A1 — First steps",             subtitle: "Introduce yourself, talk about your family, understand simple sentences and handle basic situations.", status: "Available in beta", recommended: true  },
      A2: { title: "Yema A2 — Real-life situations",    subtitle: "Communicate in routine situations, explain needs and prepare for everyday life.",                    status: "Available",        recommended: false },
      B1: { title: "Yema B1 — Independence",            subtitle: "Communicate with more confidence in personal, professional and administrative situations.",          status: "In preparation",   recommended: false },
      B2: { title: "Yema B2 — Advanced communication",  subtitle: "Express opinions, explain projects and understand more complex content.",                            status: "Coming soon",      recommended: false },
      C1: { title: "Yema C1 — Advanced integration",    subtitle: "Communicate with ease in academic, professional or advanced integration contexts.",                  status: "Coming soon",      recommended: false },
    },
  },
};

// ─── Level style config ───────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; glow: string }> = {
  A1: { color: "var(--brass)", bg: "var(--brass-glow)", border: "var(--brass-edge)", glow: "var(--brass-glow)" },
  A2: { color: "#14b8a6", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.2)", glow: "rgba(20,184,166,0.06)" },
  B1: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.06)" },
  B2: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", glow: "rgba(139,92,246,0.06)" },
  C1: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.06)" },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const COURSES: Course[] = [
  // ── A1 Beta Track ─────────────────────────────────────────────────────────
  { id: "a1-beta-1", titleDE: "Willkommen!",        titleFR: "Salutations et premières présentations", titleEN: "Greetings and first introductions",   icon: "👋",    level: "A1", lektionen: "Beta · Leçon 1",  modules: 5, progress: 0, locked: false, firstModuleId: "a1-beta-1-lesen" },
  { id: "a1-beta-2", titleDE: "Meine Familie",       titleFR: "Famille et informations personnelles",   titleEN: "Family and personal information",     icon: "👨‍👩‍👧", level: "A1", lektionen: "Beta · Leçon 2",  modules: 5, progress: 0, locked: false, firstModuleId: "a1-beta-2-lesen" },
  { id: "a1-beta-3", titleDE: "Mein Alltag",         titleFR: "Routine quotidienne et chiffres",        titleEN: "Daily routine and numbers",           icon: "🕐",    level: "A1", lektionen: "Beta · Leçon 3",  modules: 5, progress: 0, locked: false, firstModuleId: "a1-beta-3-lesen" },
  { id: "a1-beta-4", titleDE: "Einkaufen & Essen",   titleFR: "Achats, nourriture et rendez-vous",      titleEN: "Shopping, food and appointments",     icon: "🛒",    level: "A1", lektionen: "Beta · Leçon 4",  modules: 5, progress: 0, locked: false, firstModuleId: "a1-beta-4-lesen" },
  { id: "a1-beta-5", titleDE: "Deutschland-Reise",   titleFR: "Situations utiles pour l'Allemagne",     titleEN: "Useful situations for Germany",       icon: "✈️",    level: "A1", lektionen: "Beta · Leçon 5",  modules: 5, progress: 0, locked: false, firstModuleId: "a1-beta-5-lesen" },
  // ── A1 — full 12-lesson curriculum (from static seed) ────────────────────
  ...YEMA_LESSON_META.filter(l => l.level === "A1").map((l, i) => ({
    id: l.id,
    titleDE: l.titleDE,
    titleFR: l.descriptionFR,
    titleEN: l.descriptionEN,
    icon: ["👋","👨‍👩‍👧","🕐","🛒","🗺️","📅","🏠","🏥","📚","💼","🎉","🔁"][i] ?? "📖",
    level: "A1" as Level,
    lektionen: `A1 · Lektion ${l.order}`,
    modules: l.moduleCount,
    progress: 0,
    locked: false,
    firstModuleId: l.firstModuleId,
  })),
  // ── A2 — full 12-lesson curriculum (from static seed) ────────────────────
  ...YEMA_LESSON_META.filter(l => l.level === "A2").map((l, i) => ({
    id: l.id,
    titleDE: l.titleDE,
    titleFR: l.descriptionFR,
    titleEN: l.descriptionEN,
    icon: ["🔄","📋","💼","🎓","🏥","🏘️","🚇","💳","🤝","🌱","💬","🔁"][i] ?? "📖",
    level: "A2" as Level,
    lektionen: `A2 · Lektion ${l.order}`,
    modules: l.moduleCount,
    progress: 0,
    locked: false,
    firstModuleId: l.firstModuleId,
  })),
  // ── B1 — locked ───────────────────────────────────────────────────────────
  { id: "b1-1", titleDE: "Menschen und Begegnungen",     titleFR: "Personnes et rencontres",  titleEN: "People and encounters",      icon: "🤝",    level: "B1", lektionen: "Lektion 1-2",   modules: 5, progress: 0, locked: true, comingSoon: true },
  { id: "b1-2", titleDE: "Arbeitswelt",                  titleFR: "Monde du travail",         titleEN: "The working world",          icon: "🏢",    level: "B1", lektionen: "Lektion 3-4",   modules: 5, progress: 0, locked: true, comingSoon: true },
  { id: "b1-3", titleDE: "Natur und Umwelt",             titleFR: "Nature et environnement",  titleEN: "Nature and environment",     icon: "🌿",    level: "B1", lektionen: "Lektion 5-6",   modules: 5, progress: 0, locked: true, comingSoon: true },
  { id: "b1-4", titleDE: "Kultur und Gesellschaft",      titleFR: "Culture et société",       titleEN: "Culture and society",        icon: "🎭",    level: "B1", lektionen: "Lektion 7-8",   modules: 5, progress: 0, locked: true, comingSoon: true },
  { id: "b1-5", titleDE: "Sprache und Kommunikation",    titleFR: "Langue et communication",  titleEN: "Language and communication", icon: "💬",    level: "B1", lektionen: "Lektion 9-10",  modules: 5, progress: 0, locked: true, comingSoon: true },
  { id: "b1-6", titleDE: "Zukunft und Träume",           titleFR: "Avenir et rêves",          titleEN: "Future and dreams",          icon: "🌟",    level: "B1", lektionen: "Lektion 11-12", modules: 5, progress: 0, locked: true, comingSoon: true },
  // ── B2 — locked ───────────────────────────────────────────────────────────
  { id: "b2-1", titleDE: "Werte und Normen",             titleFR: "Valeurs et normes",        titleEN: "Values and norms",           icon: "⚖️",   level: "B2", lektionen: "Kapitel 1-2",   modules: 6, progress: 0, locked: true, comingSoon: true },
  { id: "b2-2", titleDE: "Wissenschaft und Technik",     titleFR: "Science et technologie",   titleEN: "Science and technology",     icon: "🔬",    level: "B2", lektionen: "Kapitel 3-4",   modules: 6, progress: 0, locked: true, comingSoon: true },
  { id: "b2-3", titleDE: "Wirtschaft und Finanzen",      titleFR: "Économie et finances",     titleEN: "Economy and finance",        icon: "📊",    level: "B2", lektionen: "Kapitel 5-6",   modules: 6, progress: 0, locked: true, comingSoon: true },
  { id: "b2-4", titleDE: "Geschichte und Politik",       titleFR: "Histoire et politique",    titleEN: "History and politics",       icon: "🏛️",   level: "B2", lektionen: "Kapitel 7-8",   modules: 6, progress: 0, locked: true, comingSoon: true },
  { id: "b2-5", titleDE: "Kunst und Literatur",          titleFR: "Art et littérature",       titleEN: "Art and literature",         icon: "🎨",    level: "B2", lektionen: "Kapitel 9-10",  modules: 6, progress: 0, locked: true, comingSoon: true },
  // ── C1 — locked ───────────────────────────────────────────────────────────
  { id: "c1-1", titleDE: "Sprache und Identität",        titleFR: "Langue et identité",       titleEN: "Language and identity",      icon: "🗣️",   level: "C1", lektionen: "Kapitel 1-2",   modules: 7, progress: 0, locked: true, comingSoon: true },
  { id: "c1-2", titleDE: "Globalisierung",               titleFR: "Mondialisation",           titleEN: "Globalisation",              icon: "🌍",    level: "C1", lektionen: "Kapitel 3-4",   modules: 7, progress: 0, locked: true, comingSoon: true },
  { id: "c1-3", titleDE: "Philosophie und Ethik",        titleFR: "Philosophie et éthique",   titleEN: "Philosophy and ethics",      icon: "🧠",    level: "C1", lektionen: "Kapitel 5-6",   modules: 7, progress: 0, locked: true, comingSoon: true },
  { id: "c1-4", titleDE: "Medien und Gesellschaft",      titleFR: "Médias et société",        titleEN: "Media and society",          icon: "📰",    level: "C1", lektionen: "Kapitel 7-8",   modules: 7, progress: 0, locked: true, comingSoon: true },
  { id: "c1-5", titleDE: "Beruf und Karriere",           titleFR: "Profession et carrière",   titleEN: "Career and professional growth", icon: "🚀", level: "C1", lektionen: "Kapitel 9-10", modules: 7, progress: 0, locked: true, comingSoon: true },
];

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];

function localizeTag(tag: string, locale: Locale): string {
  if (locale === "en") return tag.replace("Leçon", "Lesson");
  return tag;
}

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course, locale, t }: { course: Course; locale: Locale; t: typeof T["fr"] }) {
  const cfg = LEVEL_CONFIG[course.level];
  const description = locale === "fr" ? course.titleFR : course.titleEN;
  const tag = localizeTag(course.lektionen, locale);

  return (
    <div style={{
      borderRadius: 16, padding: "16px",
      background: course.locked
        ? "rgba(244, 235, 220, 0.02)"
        : `linear-gradient(135deg, ${cfg.glow}, rgba(244, 235, 220, 0.02))`,
      border: `1px solid ${course.locked ? "var(--creme-hair)" : cfg.border}`,
      opacity: course.locked ? 0.55 : 1,
      display: "flex", flexDirection: "column", gap: 12,
      transition: "all var(--dur-touch) var(--ease-enter)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
          background: course.locked ? "rgba(244, 235, 220, 0.04)" : cfg.bg,
          border: `1px solid ${course.locked ? "var(--creme-hair)" : cfg.border}`,
        }}>
          {course.locked ? "🔒" : course.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, color: "white", fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 700, fontSize: "0.85rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {course.titleDE}
            {course.progress === 100 && <span style={{ color: "var(--brass)", marginLeft: 6 }}>✓</span>}
          </p>
          <p style={{ margin: "3px 0 0", color: "var(--creme-soft)", fontSize: "0.85rem" }}>
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: "0.75rem", padding: "2px 8px", borderRadius: 6,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}>
          {course.level}
        </span>
        <span style={{
          fontSize: "0.75rem", padding: "2px 8px", borderRadius: 6,
          background: "var(--creme-hair)", color: "var(--creme-soft)",
        }}>
          {tag}
        </span>
        <span style={{
          fontSize: "0.75rem", padding: "2px 8px", borderRadius: 6,
          background: "var(--creme-hair)", color: "var(--creme-soft)",
        }}>
          {course.modules} {t.modulesLabel}
        </span>
      </div>

      {!course.locked ? (
        <div>
          <div style={{ height: 5, borderRadius: 99, overflow: "hidden", background: "var(--creme-hair)" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${course.progress}%`,
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              boxShadow: course.progress > 0 ? `0 0 8px ${cfg.color}55` : "none",
            }} />
          </div>
          <p style={{ margin: "5px 0 0", color: "var(--creme-soft)", fontSize: "0.82rem" }}>
            {course.progress === 0
              ? t.statusNotStarted
              : course.progress === 100
              ? `${t.statusCompleted} ✓`
              : t.statusPct(course.progress)}
          </p>
        </div>
      ) : (
        <p style={{ margin: 0, color: "var(--creme-soft)", fontSize: "0.82rem" }}>
          {course.comingSoon ? t.comingSoonHint : t.unlockHint}
        </p>
      )}
    </div>
  );
}

// ─── Level section ────────────────────────────────────────────────────────────

function LevelSection({ level, courses, isMobile, locale, t }: {
  level: Level; courses: Course[]; isMobile: boolean; locale: Locale; t: typeof T["fr"];
}) {
  const cfg = LEVEL_CONFIG[level];
  const isLocked = courses.every(c => c.locked);
  const done = courses.filter(c => c.progress === 100).length;
  const meta = t.levels[level];

  return (
    <div style={{ marginBottom: 44 }}>
      {/* Section header */}
      <div style={{ marginBottom: 14, padding: "18px 20px", borderRadius: 16, background: isLocked ? "rgba(244, 235, 220, 0.02)" : `${cfg.glow}`, border: `1px solid ${isLocked ? "var(--creme-hair)" : cfg.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 800, fontSize: "0.9rem",
            color: isLocked ? "var(--creme-hair)" : cfg.color,
            background: isLocked ? "rgba(244, 235, 220, 0.04)" : cfg.bg,
            border: `1px solid ${isLocked ? "var(--creme-hair)" : cfg.border}`,
          }}>
            {isLocked ? "🔒" : level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <p style={{ margin: 0, color: isLocked ? "var(--creme-mute)" : "white", fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 700, fontSize: "1rem" }}>
                {meta.title}
              </p>
              {meta.recommended && (
                <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 99, background: "var(--brass-glow)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--brass)", fontWeight: 700, letterSpacing: "0.06em" }}>
                  ✦ Beta
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 8px", color: "var(--creme-soft)", fontSize: "0.86rem", lineHeight: 1.5 }}>
              {meta.subtitle}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: "0.75rem", padding: "2px 10px", borderRadius: 6,
                background: isLocked ? "rgba(244, 235, 220, 0.04)" : cfg.bg,
                color: isLocked ? "var(--creme-mute)" : cfg.color,
                border: `1px solid ${isLocked ? "var(--creme-hair)" : cfg.border}`,
                fontWeight: 600,
              }}>
                {meta.status}
              </span>
              {!isLocked && (
                <span style={{ color: "var(--creme-soft)", fontSize: "0.82rem" }}>
                  {done}/{courses.length} · {t.levelBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 14 }}>
        {courses.map(course =>
          course.locked ? (
            <CourseCard key={course.id} course={course} locale={locale} t={t} />
          ) : (
            <Link key={course.id} href={`/courses/${course.id}/modules/${course.firstModuleId ?? "m1"}`} style={{ textDecoration: "none" }}>
              <CourseCard course={course} locale={locale} t={t} />
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ─── Learn / Prepare / Belong block ──────────────────────────────────────────

function JourneyBlock({ t }: { t: typeof T["fr"] }) {
  const pillars = [
    { text: t.pillar1, color: "var(--brass)" },
    { text: t.pillar2, color: "var(--brass)" },
    { text: t.pillar3, color: "#f59e0b" },
  ];
  return (
    <div className="fade-up card-delay-1" style={{
      marginBottom: 32, padding: "20px 24px", borderRadius: 16,
      background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)",
    }}>
      <p style={{ margin: "0 0 6px", color: "white", fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 700, fontSize: "0.95rem" }}>
        {t.journeyTitle}
      </p>
      <p style={{ margin: "0 0 14px", color: "var(--creme-soft)", fontSize: "0.88rem", lineHeight: 1.6 }}>
        {t.journeyText}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {pillars.map((p, i) => (
          <span key={i} style={{
            fontSize: "0.78rem", padding: "4px 12px", borderRadius: 8,
            background: `${p.color}08`, border: `1px solid ${p.color}20`,
            color: "var(--creme-soft)",
          }}>
            <span style={{ color: p.color, fontWeight: 700, marginRight: 4 }}>✦</span>
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = T[locale];
  const { language: activeLang, loading: langLoading } = useActiveLanguage();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => {
        if (!d.fallback && d.courses?.length > 0) {
          const mapped: Course[] = d.courses.map((c: {
            id: string; titleDE: string; titleFR: string; titleEN?: string; icon: string;
            level: string; lektionen: string; modules: number; locked: boolean;
            progress: number; firstModuleId: string;
          }) => ({
            id: c.id,
            titleDE: c.titleDE,
            titleFR: c.titleFR,
            titleEN: c.titleEN ?? c.titleFR,
            icon: c.icon,
            level: c.level as Level,
            lektionen: c.lektionen,
            modules: c.modules,
            progress: c.progress,
            locked: c.locked,
            firstModuleId: c.firstModuleId,
          }));
          setDbCourses(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const allCourses = useMemo<Course[]>(() => {
    if (dbCourses.length === 0) return COURSES;
    const levelsInDB = new Set(dbCourses.map(c => c.level));
    const staticFallback = COURSES.filter(c => !levelsInDB.has(c.level));
    return [...dbCourses, ...staticFallback];
  }, [dbCourses]);

  const filtered = useMemo(() => allCourses.filter(c => {
    const matchLevel = filter === "all" || c.level === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.titleDE.toLowerCase().includes(q) || c.titleFR.toLowerCase().includes(q) || c.titleEN.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  }), [allCourses, filter, search]);

  const visibleLevels = useMemo<Level[]>(() =>
    (filter === "all" ? LEVELS : [filter] as Level[]).filter(l => filtered.some(c => c.level === l)),
    [filter, filtered]
  );

  const totalUnlocked = allCourses.filter(c => !c.locked).length;
  const done = allCourses.filter(c => c.progress === 100).length;

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: t.filterAll },
    ...LEVELS.map(l => ({ key: l as Filter, label: l })),
  ];

  // Langue natale (échelle YEMA) : les contenus dédiés ne sont pas encore
  // en ligne, on affiche une préparation éditoriale avec l'échelle YEMA
  // et les cinq paliers (Écoute · Voix · Récit · Palabre · Foyer) pour
  // que l'apprenant·e sache déjà ce qu'il va rencontrer. Aucun contenu
  // CECRL n'est exposé.
  if (!langLoading && activeLang.scale === "yema") {
    const langName = locale === "en" ? activeLang.nameEn : activeLang.name;
    return (
      <Layout title={t.layoutTitle}>
        <section className="dash" aria-labelledby="courses-native-h" style={{ maxWidth: 960 }}>
          <p className="dash-eye" style={{ margin: 0 }}>
            {locale === "en" ? "Native path · YEMA scale" : "Parcours natal · échelle YEMA"}
          </p>
          <h1 id="courses-native-h" className="dash-hero-h" style={{ marginTop: 12 }}>
            {locale === "en" ? "Learning " : "Apprendre le "}
            <em>{langName}.</em>
          </h1>
          <p className="dash-hero-sub" style={{ maxWidth: 640 }}>
            {locale === "en"
              ? "Modules for oral tradition languages are being prepared. Five stages, each anchored in a lived moment — the greeting, the marketplace, the story, the palaver, the home."
              : "Les modules pour les langues à tradition orale sont en préparation. Cinq paliers, chacun ancré dans un moment de vie — la salutation, le marché, le récit, la palabre, le foyer."}
          </p>

          <div className="dash-hero" style={{ marginTop: 32, alignItems: "flex-start" }}>
            <div>
              <h2 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 24, color: "var(--creme)", margin: "0 0 20px",
              }}>
                {locale === "en" ? "The five stages" : "Les cinq paliers"}
              </h2>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 22 }}>
                {YEMA_LEVELS.map((lvl) => (
                  <li key={lvl.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 16 }}>
                    <span aria-hidden="true" style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 44, height: 44, borderRadius: 12,
                      background: "var(--brass-glow)", border: "1px solid var(--brass-edge)",
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontStyle: "italic", fontSize: 18, color: "var(--brass)",
                    }}>{lvl.code}</span>
                    <div>
                      <p style={{
                        margin: 0, fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 18, color: "var(--creme)", fontStyle: "italic",
                      }}>
                        {locale === "en" ? lvl.nameEn : lvl.name}
                        <span style={{
                          marginLeft: 10, fontFamily: "var(--font-jetbrains, monospace)",
                          fontSize: 10, fontStyle: "normal", color: "var(--brass)",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                        }}>{lvl.actfl}</span>
                      </p>
                      <p style={{
                        margin: "4px 0 6px", color: "var(--creme-soft)", fontSize: 14,
                        fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic",
                      }}>
                        {locale === "en" ? lvl.anchorEn : lvl.anchor}
                      </p>
                      <ul style={{
                        margin: 0, paddingLeft: 18, color: "var(--creme-mute)",
                        fontSize: 13.5, lineHeight: 1.6,
                      }}>
                        {(locale === "en" ? lvl.canDoEn : lvl.canDo).map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="dash-hero-side" aria-label={locale === "en" ? "YEMA scale" : "Échelle YEMA"}>
              <YemaSpine current={activeLang.levels[0]} locale={locale} compact />
            </div>
          </div>

          <div style={{
            marginTop: 40, padding: "14px 20px", borderRadius: 12,
            background: "rgba(244, 235, 220, 0.02)",
            border: "1px solid var(--creme-hair)",
          }}>
            <p style={{ color: "var(--creme-mute)", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
              {locale === "en"
                ? "The YEMA scale is inspired by ACTFL and Peace Corps proficiency frameworks, adapted for oral-tradition African languages. Independent of any official examination institute."
                : "L'échelle YEMA s'inspire des cadres ACTFL et Peace Corps, adaptés aux langues africaines à tradition orale. Indépendante de tout organisme officiel d'examen."}
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout title={t.layoutTitle} searchQuery={search} onSearchChange={setSearch}>

      {/* ── Page header ── */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 12px", borderRadius: 8, marginBottom: 10,
              background: "var(--brass-glow)", border: "1px solid var(--brass-edge)",
              color: "#34d399", fontSize: "0.82rem",
            }}>
              🎓 {t.pageBadge}
            </div>
            <h2 style={{ margin: 0, color: "white", fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 800, fontSize: "1.7rem" }}>
              {t.pageTitle}
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--creme-soft)", fontSize: "0.88rem" }}>
              {t.coursesDone(done, totalUnlocked)}
            </p>
          </div>

          {/* Level stat pills */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 10 }}>
              {LEVELS.map(l => {
                const cfg = LEVEL_CONFIG[l];
                const lvlDone = allCourses.filter(c => c.level === l && c.progress === 100).length;
                const lvlTotal = allCourses.filter(c => c.level === l).length;
                return (
                  <div key={l} style={{
                    padding: "8px 14px", borderRadius: 12, textAlign: "center",
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    opacity: allCourses.filter(c => c.level === l && !c.locked).length === 0 ? 0.4 : 1,
                  }}>
                    <p style={{ margin: 0, color: cfg.color, fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 800, fontSize: "1rem" }}>{l}</p>
                    <p style={{ margin: "2px 0 0", color: "var(--creme-soft)", fontSize: "0.75rem" }}>{lvlDone}/{lvlTotal}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Learn / Prepare / Belong block ── */}
      <JourneyBlock t={t} />

      {/* ── Filters ── */}
      <div className="fade-up card-delay-2" style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {filters.map(({ key, label }) => {
          const active = filter === key;
          const cfg = key !== "all" ? LEVEL_CONFIG[key as Level] : null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 600, fontSize: "0.8rem",
                background: active ? (cfg ? cfg.bg : "var(--creme-hair)") : "rgba(244, 235, 220, 0.04)",
                color: active ? (cfg ? cfg.color : "white") : "var(--creme-soft)",
                border: active ? `1px solid ${cfg ? cfg.border : "var(--creme-hair)"}` : "1px solid var(--creme-hair)",
                transition: "all var(--dur-touch) var(--ease-enter)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Level sections ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</p>
          <p style={{ color: "var(--creme-soft)", fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "0.95rem", margin: "0 0 6px" }}>
            {t.noResults}
          </p>
          <p style={{ color: "var(--creme-soft)", fontSize: "0.86rem", margin: 0 }}>
            {t.noResultsSub}
          </p>
        </div>
      ) : (
        visibleLevels.map(level => (
          <LevelSection
            key={level}
            level={level}
            courses={filtered.filter(c => c.level === level)}
            isMobile={isMobile}
            locale={locale}
            t={t}
          />
        ))
      )}

      {/* ── Disclaimer ── */}
      <div style={{ marginTop: 48, padding: "14px 20px", borderRadius: 12, background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)", textAlign: "center" }}>
        <p style={{ color: "var(--creme-soft)", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
          {t.disclaimer}
        </p>
      </div>
    </Layout>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/navigation";
import { usePathname } from "next/navigation";
import Layout from "@/components/Layout";

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
    modulesLabel: "modules",
    levelBadge: "Parcours aligné CECRL",
    disclaimer: "Yema Languages propose une pratique linguistique indépendante alignée sur le CECRL et n'est affiliée à aucun organisme officiel d'examen.",
    levels: {
      A1: { title: "Yema A1 — Premiers pas",          subtitle: "Se présenter, parler de sa famille, comprendre des phrases simples et gérer des situations de base.",    status: "Disponible en bêta",   recommended: true  },
      A2: { title: "Yema A2 — Vie quotidienne",       subtitle: "Communiquer dans les situations courantes : achats, rendez-vous, santé, transport et logement.",        status: "En préparation",       recommended: false },
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
    modulesLabel: "modules",
    levelBadge: "CEFR-aligned path",
    disclaimer: "Yema Languages provides independent CEFR-aligned language practice and is not affiliated with any official examination institute.",
    levels: {
      A1: { title: "Yema A1 — First steps",             subtitle: "Introduce yourself, talk about your family, understand simple sentences and handle basic situations.", status: "Available in beta", recommended: true  },
      A2: { title: "Yema A2 — Everyday life",           subtitle: "Communicate in common situations: shopping, appointments, health, transport and housing.",            status: "In preparation",   recommended: false },
      B1: { title: "Yema B1 — Independence",            subtitle: "Communicate with more confidence in personal, professional and administrative situations.",          status: "In preparation",   recommended: false },
      B2: { title: "Yema B2 — Advanced communication",  subtitle: "Express opinions, explain projects and understand more complex content.",                            status: "Coming soon",      recommended: false },
      C1: { title: "Yema C1 — Advanced integration",    subtitle: "Communicate with ease in academic, professional or advanced integration contexts.",                  status: "Coming soon",      recommended: false },
    },
  },
};

// ─── Level style config ───────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; glow: string }> = {
  A1: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.06)" },
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
  // ── A1 ────────────────────────────────────────────────────────────────────
  { id: "a1-1", titleDE: "Guten Tag!",              titleFR: "Salutations",           titleEN: "Greetings",               icon: "👋",    level: "A1", lektionen: "Lektion 1-2",   modules: 4, progress: 100, locked: false },
  { id: "a1-2", titleDE: "Familie und Freunde",     titleFR: "Famille et amis",       titleEN: "Family and friends",      icon: "👨‍👩‍👧", level: "A1", lektionen: "Lektion 3-4",   modules: 4, progress: 75,  locked: false },
  { id: "a1-3", titleDE: "Essen und Trinken",       titleFR: "Manger et boire",       titleEN: "Food and drinks",         icon: "🍽️",   level: "A1", lektionen: "Lektion 5-6",   modules: 4, progress: 50,  locked: false },
  { id: "a1-4", titleDE: "Wohnen",                  titleFR: "Habiter",               titleEN: "Housing and living",      icon: "🏠",    level: "A1", lektionen: "Lektion 7-8",   modules: 4, progress: 0,   locked: false },
  { id: "a1-5", titleDE: "Alltag und Freizeit",     titleFR: "Quotidien et loisirs",  titleEN: "Daily life and leisure",  icon: "⏰",    level: "A1", lektionen: "Lektion 9-10",  modules: 4, progress: 0,   locked: false },
  { id: "a1-6", titleDE: "Mein Tag",                titleFR: "Ma journée",            titleEN: "My day",                  icon: "📅",    level: "A1", lektionen: "Lektion 11-12", modules: 4, progress: 0,   locked: false },
  // ── A2 ────────────────────────────────────────────────────────────────────
  { id: "a2-1", titleDE: "Arbeit und Beruf",             titleFR: "Travail et profession",    titleEN: "Work and profession",        icon: "💼",    level: "A2", lektionen: "Lektion 1-2",   modules: 4, progress: 0, locked: false },
  { id: "a2-2", titleDE: "Gesundheit",                   titleFR: "Santé",                    titleEN: "Health",                     icon: "🏥",    level: "A2", lektionen: "Lektion 3-4",   modules: 4, progress: 0, locked: false },
  { id: "a2-3", titleDE: "Reisen und Verkehr",           titleFR: "Voyages et transport",     titleEN: "Travel and transport",       icon: "✈️",    level: "A2", lektionen: "Lektion 5-6",   modules: 4, progress: 0, locked: false },
  { id: "a2-4", titleDE: "Einkaufen und Mode",           titleFR: "Shopping et mode",         titleEN: "Shopping and fashion",       icon: "🛒",    level: "A2", lektionen: "Lektion 7-8",   modules: 4, progress: 0, locked: false },
  { id: "a2-5", titleDE: "Medien und Kommunikation",     titleFR: "Médias et communication",  titleEN: "Media and communication",    icon: "📱",    level: "A2", lektionen: "Lektion 9-10",  modules: 4, progress: 0, locked: false },
  { id: "a2-6", titleDE: "Feste und Feiern",             titleFR: "Fêtes et célébrations",    titleEN: "Celebrations and holidays",  icon: "🎉",    level: "A2", lektionen: "Lektion 11-12", modules: 4, progress: 0, locked: false },
  // ── B1 ────────────────────────────────────────────────────────────────────
  { id: "b1-1", titleDE: "Menschen und Begegnungen",     titleFR: "Personnes et rencontres",  titleEN: "People and encounters",      icon: "🤝",    level: "B1", lektionen: "Lektion 1-2",   modules: 5, progress: 0, locked: false },
  { id: "b1-2", titleDE: "Arbeitswelt",                  titleFR: "Monde du travail",         titleEN: "The working world",          icon: "🏢",    level: "B1", lektionen: "Lektion 3-4",   modules: 5, progress: 0, locked: false },
  { id: "b1-3", titleDE: "Natur und Umwelt",             titleFR: "Nature et environnement",  titleEN: "Nature and environment",     icon: "🌿",    level: "B1", lektionen: "Lektion 5-6",   modules: 5, progress: 0, locked: false },
  { id: "b1-4", titleDE: "Kultur und Gesellschaft",      titleFR: "Culture et société",       titleEN: "Culture and society",        icon: "🎭",    level: "B1", lektionen: "Lektion 7-8",   modules: 5, progress: 0, locked: false },
  { id: "b1-5", titleDE: "Sprache und Kommunikation",    titleFR: "Langue et communication",  titleEN: "Language and communication", icon: "💬",    level: "B1", lektionen: "Lektion 9-10",  modules: 5, progress: 0, locked: false },
  { id: "b1-6", titleDE: "Zukunft und Träume",           titleFR: "Avenir et rêves",          titleEN: "Future and dreams",          icon: "🌟",    level: "B1", lektionen: "Lektion 11-12", modules: 5, progress: 0, locked: false },
  // ── B2 — locked ───────────────────────────────────────────────────────────
  { id: "b2-1", titleDE: "Werte und Normen",             titleFR: "Valeurs et normes",        titleEN: "Values and norms",           icon: "⚖️",   level: "B2", lektionen: "Kapitel 1-2",   modules: 6, progress: 0, locked: true  },
  { id: "b2-2", titleDE: "Wissenschaft und Technik",     titleFR: "Science et technologie",   titleEN: "Science and technology",     icon: "🔬",    level: "B2", lektionen: "Kapitel 3-4",   modules: 6, progress: 0, locked: true  },
  { id: "b2-3", titleDE: "Wirtschaft und Finanzen",      titleFR: "Économie et finances",     titleEN: "Economy and finance",        icon: "📊",    level: "B2", lektionen: "Kapitel 5-6",   modules: 6, progress: 0, locked: true  },
  { id: "b2-4", titleDE: "Geschichte und Politik",       titleFR: "Histoire et politique",    titleEN: "History and politics",       icon: "🏛️",   level: "B2", lektionen: "Kapitel 7-8",   modules: 6, progress: 0, locked: true  },
  { id: "b2-5", titleDE: "Kunst und Literatur",          titleFR: "Art et littérature",       titleEN: "Art and literature",         icon: "🎨",    level: "B2", lektionen: "Kapitel 9-10",  modules: 6, progress: 0, locked: true  },
  // ── C1 — locked ───────────────────────────────────────────────────────────
  { id: "c1-1", titleDE: "Sprache und Identität",        titleFR: "Langue et identité",       titleEN: "Language and identity",      icon: "🗣️",   level: "C1", lektionen: "Kapitel 1-2",   modules: 7, progress: 0, locked: true  },
  { id: "c1-2", titleDE: "Globalisierung",               titleFR: "Mondialisation",           titleEN: "Globalisation",              icon: "🌍",    level: "C1", lektionen: "Kapitel 3-4",   modules: 7, progress: 0, locked: true  },
  { id: "c1-3", titleDE: "Philosophie und Ethik",        titleFR: "Philosophie et éthique",   titleEN: "Philosophy and ethics",      icon: "🧠",    level: "C1", lektionen: "Kapitel 5-6",   modules: 7, progress: 0, locked: true  },
  { id: "c1-4", titleDE: "Medien und Gesellschaft",      titleFR: "Médias et société",        titleEN: "Media and society",          icon: "📰",    level: "C1", lektionen: "Kapitel 7-8",   modules: 7, progress: 0, locked: true  },
  { id: "c1-5", titleDE: "Beruf und Karriere",           titleFR: "Profession et carrière",   titleEN: "Career and professional growth", icon: "🚀", level: "C1", lektionen: "Kapitel 9-10", modules: 7, progress: 0, locked: true  },
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
        ? "rgba(255,255,255,0.02)"
        : `linear-gradient(135deg, ${cfg.glow}, rgba(255,255,255,0.02))`,
      border: `1px solid ${course.locked ? "rgba(255,255,255,0.06)" : cfg.border}`,
      opacity: course.locked ? 0.55 : 1,
      display: "flex", flexDirection: "column", gap: 12,
      transition: "all 0.15s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
          background: course.locked ? "rgba(255,255,255,0.04)" : cfg.bg,
          border: `1px solid ${course.locked ? "rgba(255,255,255,0.07)" : cfg.border}`,
        }}>
          {course.locked ? "🔒" : course.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, color: "white", fontFamily: "'Syne', sans-serif",
            fontWeight: 700, fontSize: "0.85rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {course.titleDE}
            {course.progress === 100 && <span style={{ color: "#10b981", marginLeft: 6 }}>✓</span>}
          </p>
          <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.72)", fontSize: "0.85rem" }}>
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
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)",
        }}>
          {tag}
        </span>
        <span style={{
          fontSize: "0.75rem", padding: "2px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)",
        }}>
          {course.modules} {t.modulesLabel}
        </span>
      </div>

      {!course.locked ? (
        <div>
          <div style={{ height: 5, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${course.progress}%`,
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
              boxShadow: course.progress > 0 ? `0 0 8px ${cfg.color}55` : "none",
            }} />
          </div>
          <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
            {course.progress === 0
              ? t.statusNotStarted
              : course.progress === 100
              ? `${t.statusCompleted} ✓`
              : t.statusPct(course.progress)}
          </p>
        </div>
      ) : (
        <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
          {t.unlockHint}
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
      <div style={{ marginBottom: 14, padding: "18px 20px", borderRadius: 16, background: isLocked ? "rgba(255,255,255,0.02)" : `${cfg.glow}`, border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : cfg.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.9rem",
            color: isLocked ? "rgba(255,255,255,0.2)" : cfg.color,
            background: isLocked ? "rgba(255,255,255,0.04)" : cfg.bg,
            border: `1px solid ${isLocked ? "rgba(255,255,255,0.07)" : cfg.border}`,
          }}>
            {isLocked ? "🔒" : level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <p style={{ margin: 0, color: isLocked ? "rgba(255,255,255,0.3)" : "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {meta.title}
              </p>
              {meta.recommended && (
                <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 99, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 700, letterSpacing: "0.06em" }}>
                  ✦ Beta
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.78)", fontSize: "0.86rem", lineHeight: 1.5 }}>
              {meta.subtitle}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontSize: "0.75rem", padding: "2px 10px", borderRadius: 6,
                background: isLocked ? "rgba(255,255,255,0.04)" : cfg.bg,
                color: isLocked ? "rgba(255,255,255,0.25)" : cfg.color,
                border: `1px solid ${isLocked ? "rgba(255,255,255,0.07)" : cfg.border}`,
                fontWeight: 600,
              }}>
                {meta.status}
              </span>
              {!isLocked && (
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
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
    { text: t.pillar1, color: "#10b981" },
    { text: t.pillar2, color: "#6366f1" },
    { text: t.pillar3, color: "#f59e0b" },
  ];
  return (
    <div className="fade-up card-delay-1" style={{
      marginBottom: 32, padding: "20px 24px", borderRadius: 16,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <p style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
        {t.journeyTitle}
      </p>
      <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.78)", fontSize: "0.88rem", lineHeight: 1.6 }}>
        {t.journeyText}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {pillars.map((p, i) => (
          <span key={i} style={{
            fontSize: "0.78rem", padding: "4px 12px", borderRadius: 8,
            background: `${p.color}08`, border: `1px solid ${p.color}20`,
            color: "rgba(255,255,255,0.72)",
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

  return (
    <Layout title={t.layoutTitle} searchQuery={search} onSearchChange={setSearch}>

      {/* ── Page header ── */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 12px", borderRadius: 8, marginBottom: 10,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
              color: "#34d399", fontSize: "0.82rem",
            }}>
              🎓 {t.pageBadge}
            </div>
            <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.7rem" }}>
              {t.pageTitle}
            </h2>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.72)", fontSize: "0.88rem" }}>
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
                    <p style={{ margin: 0, color: cfg.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem" }}>{l}</p>
                    <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>{lvlDone}/{lvlTotal}</p>
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
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem",
                background: active ? (cfg ? cfg.bg : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
                color: active ? (cfg ? cfg.color : "white") : "rgba(255,255,255,0.65)",
                border: active ? `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.2)"}` : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.15s ease",
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
          <p style={{ color: "rgba(255,255,255,0.78)", fontFamily: "'Syne', sans-serif", fontSize: "0.95rem", margin: "0 0 6px" }}>
            {t.noResults}
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.86rem", margin: 0 }}>
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
      <div style={{ marginTop: 48, padding: "14px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
          {t.disclaimer}
        </p>
      </div>
    </Layout>
  );
}

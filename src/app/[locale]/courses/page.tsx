"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
type Filter = "Tous" | Level;

interface Course {
  id: string;
  titleDE: string;
  titleFR: string;
  icon: string;
  level: Level;
  lektionen: string;
  modules: number;
  progress: number;
  locked: boolean;
  firstModuleId?: string; // set for DB courses, use m1 fallback for static
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; glow: string; manuel: string; certif: string }> = {
  A1: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.06)", manuel: "Netzwerk neu A1", certif: "CEFR A1 — exam preparation" },
  A2: { color: "#14b8a6", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.2)", glow: "rgba(20,184,166,0.06)", manuel: "Netzwerk neu A2", certif: "CEFR A2 — exam preparation" },
  B1: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.06)", manuel: "Netzwerk neu B1", certif: "CEFR B1 — exam preparation" },
  B2: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", glow: "rgba(139,92,246,0.06)", manuel: "Aspekte neu B2",   certif: "CEFR B2 — exam preparation" },
  C1: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.06)", manuel: "Aspekte neu C1",   certif: "CEFR C1 — exam preparation" },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const COURSES: Course[] = [
  // A1
  { id: "a1-1", titleDE: "Guten Tag!",                  titleFR: "Salutations",           icon: "👋",  level: "A1", lektionen: "Lektion 1-2",  modules: 4, progress: 100, locked: false },
  { id: "a1-2", titleDE: "Familie und Freunde",          titleFR: "Famille et amis",       icon: "👨‍👩‍👧",  level: "A1", lektionen: "Lektion 3-4",  modules: 4, progress: 75,  locked: false },
  { id: "a1-3", titleDE: "Essen und Trinken",            titleFR: "Manger et boire",       icon: "🍽️",  level: "A1", lektionen: "Lektion 5-6",  modules: 4, progress: 50,  locked: false },
  { id: "a1-4", titleDE: "Wohnen",                      titleFR: "Habiter",               icon: "🏠",  level: "A1", lektionen: "Lektion 7-8",  modules: 4, progress: 0,   locked: false },
  { id: "a1-5", titleDE: "Alltag und Freizeit",         titleFR: "Quotidien et loisirs",  icon: "⏰",  level: "A1", lektionen: "Lektion 9-10", modules: 4, progress: 0,   locked: false },
  { id: "a1-6", titleDE: "Mein Tag",                    titleFR: "Ma journée",            icon: "📅",  level: "A1", lektionen: "Lektion 11-12",modules: 4, progress: 0,   locked: false },
  // A2
  { id: "a2-1", titleDE: "Arbeit und Beruf",             titleFR: "Travail et profession", icon: "💼",  level: "A2", lektionen: "Lektion 1-2",  modules: 4, progress: 0,   locked: false },
  { id: "a2-2", titleDE: "Gesundheit",                  titleFR: "Santé",                 icon: "🏥",  level: "A2", lektionen: "Lektion 3-4",  modules: 4, progress: 0,   locked: false },
  { id: "a2-3", titleDE: "Reisen und Verkehr",          titleFR: "Voyages et transport",  icon: "✈️",  level: "A2", lektionen: "Lektion 5-6",  modules: 4, progress: 0,   locked: false },
  { id: "a2-4", titleDE: "Einkaufen und Mode",          titleFR: "Shopping et mode",      icon: "🛒",  level: "A2", lektionen: "Lektion 7-8",  modules: 4, progress: 0,   locked: false },
  { id: "a2-5", titleDE: "Medien und Kommunikation",    titleFR: "Médias et communication",icon: "📱", level: "A2", lektionen: "Lektion 9-10", modules: 4, progress: 0,   locked: false },
  { id: "a2-6", titleDE: "Feste und Feiern",            titleFR: "Fêtes et célébrations", icon: "🎉",  level: "A2", lektionen: "Lektion 11-12",modules: 4, progress: 0,   locked: false },
  // B1
  { id: "b1-1", titleDE: "Menschen und Begegnungen",    titleFR: "Personnes et rencontres",icon: "🤝", level: "B1", lektionen: "Lektion 1-2",  modules: 5, progress: 0,   locked: false },
  { id: "b1-2", titleDE: "Arbeitswelt",                 titleFR: "Monde du travail",      icon: "🏢",  level: "B1", lektionen: "Lektion 3-4",  modules: 5, progress: 0,   locked: false },
  { id: "b1-3", titleDE: "Natur und Umwelt",            titleFR: "Nature et environnement",icon: "🌿", level: "B1", lektionen: "Lektion 5-6",  modules: 5, progress: 0,   locked: false },
  { id: "b1-4", titleDE: "Kultur und Gesellschaft",     titleFR: "Culture et société",    icon: "🎭",  level: "B1", lektionen: "Lektion 7-8",  modules: 5, progress: 0,   locked: false },
  { id: "b1-5", titleDE: "Sprache und Kommunikation",   titleFR: "Langue et communication",icon: "💬", level: "B1", lektionen: "Lektion 9-10", modules: 5, progress: 0,   locked: false },
  { id: "b1-6", titleDE: "Zukunft und Träume",          titleFR: "Avenir et rêves",       icon: "🌟",  level: "B1", lektionen: "Lektion 11-12",modules: 5, progress: 0,   locked: false },
  // B2 — locked
  { id: "b2-1", titleDE: "Werte und Normen",            titleFR: "Valeurs et normes",     icon: "⚖️",  level: "B2", lektionen: "Kapitel 1-2",  modules: 6, progress: 0,   locked: true  },
  { id: "b2-2", titleDE: "Wissenschaft und Technik",    titleFR: "Science et technologie",icon: "🔬",  level: "B2", lektionen: "Kapitel 3-4",  modules: 6, progress: 0,   locked: true  },
  { id: "b2-3", titleDE: "Wirtschaft und Finanzen",     titleFR: "Économie et finances",  icon: "📊",  level: "B2", lektionen: "Kapitel 5-6",  modules: 6, progress: 0,   locked: true  },
  { id: "b2-4", titleDE: "Geschichte und Politik",      titleFR: "Histoire et politique", icon: "🏛️",  level: "B2", lektionen: "Kapitel 7-8",  modules: 6, progress: 0,   locked: true  },
  { id: "b2-5", titleDE: "Kunst und Literatur",         titleFR: "Art et littérature",    icon: "🎨",  level: "B2", lektionen: "Kapitel 9-10", modules: 6, progress: 0,   locked: true  },
  // C1 — locked
  { id: "c1-1", titleDE: "Sprache und Identität",       titleFR: "Langue et identité",    icon: "🗣️",  level: "C1", lektionen: "Kapitel 1-2",  modules: 7, progress: 0,   locked: true  },
  { id: "c1-2", titleDE: "Globalisierung",              titleFR: "Mondialisation",        icon: "🌍",  level: "C1", lektionen: "Kapitel 3-4",  modules: 7, progress: 0,   locked: true  },
  { id: "c1-3", titleDE: "Philosophie und Ethik",       titleFR: "Philosophie et éthique",icon: "🧠",  level: "C1", lektionen: "Kapitel 5-6",  modules: 7, progress: 0,   locked: true  },
  { id: "c1-4", titleDE: "Medien und Gesellschaft",     titleFR: "Médias et société",     icon: "📰",  level: "C1", lektionen: "Kapitel 7-8",  modules: 7, progress: 0,   locked: true  },
  { id: "c1-5", titleDE: "Beruf und Karriere",          titleFR: "Profession et carrière",icon: "🚀",  level: "C1", lektionen: "Kapitel 9-10", modules: 7, progress: 0,   locked: true  },
];

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];
const FILTERS: Filter[] = ["Tous", ...LEVELS];

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const cfg = LEVEL_CONFIG[course.level];
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
      {/* Top row */}
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
          <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.38)", fontSize: "0.68rem" }}>
            {course.titleFR}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: "0.62rem", padding: "2px 8px", borderRadius: 6,
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}>
          {course.level}
        </span>
        <span style={{
          fontSize: "0.62rem", padding: "2px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
        }}>
          {course.lektionen}
        </span>
        <span style={{
          fontSize: "0.62rem", padding: "2px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
        }}>
          {course.modules} modules
        </span>
      </div>

      {/* Progress bar */}
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
          <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}>
            {course.progress === 0 ? "Non commencé" : course.progress === 100 ? "Terminé ✓" : `${course.progress}% complété`}
          </p>
        </div>
      ) : (
        <p style={{ margin: 0, color: "rgba(255,255,255,0.22)", fontSize: "0.62rem" }}>
          Complète B1 pour débloquer
        </p>
      )}
    </div>
  );
}

// ─── Level section ────────────────────────────────────────────────────────────

function LevelSection({ level, courses, isMobile }: { level: Level; courses: Course[]; isMobile: boolean }) {
  const cfg = LEVEL_CONFIG[level];
  const isLocked = courses.every(c => c.locked);
  const done = courses.filter(c => c.progress === 100).length;

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.9rem",
          color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
        }}>
          {level}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ margin: 0, color: isLocked ? "rgba(255,255,255,0.35)" : "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
              {cfg.manuel}
            </p>
            {isLocked && <span style={{ fontSize: "0.85rem" }}>🔒</span>}
          </div>
          <p style={{ margin: "2px 0 0", color: cfg.color, fontSize: "0.68rem", opacity: isLocked ? 0.5 : 0.85 }}>
            {isLocked ? "Verrouillé" : `${done}/${courses.length} cours · ${cfg.certif}`}
          </p>
        </div>
        {!isMobile && (
          <div style={{
            padding: "4px 12px", borderRadius: 8, fontSize: "0.65rem",
            background: isLocked ? "rgba(255,255,255,0.03)" : cfg.bg,
            color: isLocked ? "rgba(255,255,255,0.2)" : cfg.color,
            border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : cfg.border}`,
          }}>
            🎓 {cfg.certif}
          </div>
        )}
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 14 }}>
        {courses.map(course =>
          course.locked ? (
            <CourseCard key={course.id} course={course} />
          ) : (
            <Link key={course.id} href={`/courses/${course.id}/modules/${course.firstModuleId ?? "m1"}`} style={{ textDecoration: "none" }}>
              <CourseCard course={course} />
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [filter, setFilter] = useState<Filter>("Tous");
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
            id: string; titleDE: string; titleFR: string; icon: string;
            level: string; lektionen: string; modules: number; locked: boolean;
            progress: number; firstModuleId: string;
          }) => ({
            id: c.id,
            titleDE: c.titleDE,
            titleFR: c.titleFR,
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

  // For each level: use DB courses if available, else static fallback
  const allCourses = useMemo<Course[]>(() => {
    if (dbCourses.length === 0) return COURSES;
    const levelsInDB = new Set(dbCourses.map(c => c.level));
    const staticFallback = COURSES.filter(c => !levelsInDB.has(c.level));
    return [...dbCourses, ...staticFallback];
  }, [dbCourses]);

  const filtered = useMemo(() => allCourses.filter(c => {
    const matchLevel = filter === "Tous" || c.level === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.titleDE.toLowerCase().includes(q) || c.titleFR.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  }), [allCourses, filter, search]);

  const visibleLevels = useMemo<Level[]>(() =>
    (filter === "Tous" ? LEVELS : [filter] as Level[]).filter(l => filtered.some(c => c.level === l)),
    [filter, filtered]
  );

  const totalUnlocked = allCourses.filter(c => !c.locked).length;
  const done = allCourses.filter(c => c.progress === 100).length;

  return (
    <Layout title="Mes cours" searchQuery={search} onSearchChange={setSearch}>

      {/* ── Page header ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 12px", borderRadius: 8, marginBottom: 10,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
              color: "#34d399", fontSize: "0.7rem",
            }}>
              🎓 Programme CEFR aligné A1→C1
            </div>
            <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.7rem" }}>
              Mes cours
            </h2>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
              {done}/{totalUnlocked} cours complétés · A1 → C1 · Netzwerk neu + Aspekte neu
            </p>
          </div>

          {/* Level stat pills — hidden on mobile */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 10 }}>
              {LEVELS.map(l => {
                const cfg = LEVEL_CONFIG[l];
                const lvlDone = allCourses.filter(c => c.level === l && c.progress === 100).length;
                const lvlTotal = allCourses.filter(c => c.level === l && !c.locked).length;
                return (
                  <div key={l} style={{
                    padding: "8px 14px", borderRadius: 12, textAlign: "center",
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    opacity: lvlTotal === 0 ? 0.4 : 1,
                  }}>
                    <p style={{ margin: 0, color: cfg.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem" }}>{l}</p>
                    <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.58rem" }}>{lvlDone}/{lvlTotal || allCourses.filter(c => c.level === l).length}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="fade-up card-delay-1" style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const cfg = f !== "Tous" ? LEVEL_CONFIG[f as Level] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem",
                background: active ? (cfg ? cfg.bg : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
                color: active ? (cfg ? cfg.color : "white") : "rgba(255,255,255,0.4)",
                border: active ? `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.2)"}` : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* ── Level sections ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif", fontSize: "0.95rem" }}>
            Aucun cours trouvé
          </p>
        </div>
      ) : (
        visibleLevels.map(level => (
          <LevelSection key={level} level={level} courses={filtered.filter(c => c.level === level)} isMobile={isMobile} />
        ))
      )}
    </Layout>
  );
}

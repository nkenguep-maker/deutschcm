"use client";

import { useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import { IconFlame } from "@/components/landing/icons";

interface Learner {
  id: string;
  name: string;
  level: string;
  klass: string;
  avgScore: number;
  progress: number;
  lastActive: string;
  streak: number;
  status: "good" | "progressing" | "encourage" | "support" | "inactive";
}

const LEARNERS: Learner[] = [
  { id: "s1",  name: "Fatima Oumarou",  level: "A1", klass: "Groupe A1 Matin", avgScore: 9.0, progress: 78, lastActive: "2 h",  streak: 14, status: "good" },
  { id: "s2",  name: "Alice Fotso",     level: "A1", klass: "Groupe A1 Matin", avgScore: 7.6, progress: 62, lastActive: "5 h",  streak: 9,  status: "good" },
  { id: "s3",  name: "Rodrigue Essama", level: "A1", klass: "Groupe A1 Matin", avgScore: 7.1, progress: 55, lastActive: "1 j",  streak: 5,  status: "progressing" },
  { id: "s4",  name: "Nathalie Bello",  level: "A1", klass: "Groupe A1 Matin", avgScore: 6.3, progress: 47, lastActive: "2 j",  streak: 3,  status: "progressing" },
  { id: "s5",  name: "Christian Ondoa", level: "A1", klass: "Groupe A1 Matin", avgScore: 5.9, progress: 39, lastActive: "3 j",  streak: 2,  status: "encourage" },
  { id: "s6",  name: "Jean-Paul Mvondo",level: "A1", klass: "Groupe A1 Matin", avgScore: 3.2, progress: 32, lastActive: "5 j",  streak: 0,  status: "support" },
  { id: "s7",  name: "Boris Kamga",     level: "A1", klass: "Groupe A1 Matin", avgScore: 2.8, progress: 28, lastActive: "8 j",  streak: 0,  status: "inactive" },
  { id: "s8",  name: "Paul Biya",       level: "A2", klass: "Groupe A2 Soir",  avgScore: 8.1, progress: 60, lastActive: "4 h",  streak: 11, status: "good" },
  { id: "s9",  name: "Sylvie Ntang",    level: "A2", klass: "Groupe A2 Soir",  avgScore: 7.4, progress: 52, lastActive: "1 j",  streak: 7,  status: "progressing" },
  { id: "s10", name: "Aminata Diallo",  level: "A2", klass: "Groupe A2 Soir",  avgScore: 4.1, progress: 41, lastActive: "3 j",  streak: 1,  status: "encourage" },
  { id: "s11", name: "David Abomo",     level: "B1", klass: "Préparation B1",  avgScore: 9.2, progress: 82, lastActive: "1 h",  streak: 22, status: "good" },
  { id: "s12", name: "Claire Mballa",   level: "B1", klass: "Préparation B1",  avgScore: 8.6, progress: 76, lastActive: "3 h",  streak: 18, status: "good" },
  { id: "s13", name: "Eric Mfou",       level: "B1", klass: "Préparation B1",  avgScore: 7.8, progress: 68, lastActive: "6 h",  streak: 12, status: "progressing" },
];

type Filter = "all" | "encourage" | "progressing" | "support" | "inactive";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  searchPh: string;
  filters: Record<Filter, string>;
  statusLbl: Record<Learner["status"], string>;
  labelScore: string;
  labelProgress: string;
  labelStreak: string;
  lastActive: (t: string) => string;
  view: string;
  emptyH: string;
  emptySub: string;
}

const FR: Copy = {
  title: "Apprenant·e·s",
  eye: "Suivi individuel",
  h: "Chacun·e à son rythme.",
  sub: "Repère celles et ceux qui avancent seul·e·s et celles et ceux à qui un mot suffirait à relancer.",
  searchPh: "Chercher un nom ou une classe…",
  filters: {
    all: "Tou·te·s",
    encourage: "À encourager",
    progressing: "En progression",
    support: "À soutenir",
    inactive: "Inactif·ve·s",
  },
  statusLbl: {
    good: "Progresse bien",
    progressing: "En progression",
    encourage: "À encourager",
    support: "À soutenir",
    inactive: "Inactif·ve",
  },
  labelScore: "score",
  labelProgress: "progression",
  labelStreak: "série",
  lastActive: (t) => `Vu·e il y a ${t}`,
  view: "Voir le profil",
  emptyH: "Aucun·e apprenant·e ne correspond.",
  emptySub: "Essaie d'autres filtres, ou reviens à la vue complète.",
};

const EN: Copy = {
  title: "Learners",
  eye: "Individual tracking",
  h: "Everyone at their own pace.",
  sub: "Spot those moving on their own and those a short message would help restart.",
  searchPh: "Search a name or class…",
  filters: {
    all: "All",
    encourage: "To encourage",
    progressing: "Progressing",
    support: "Needs support",
    inactive: "Inactive",
  },
  statusLbl: {
    good: "Progressing well",
    progressing: "Progressing",
    encourage: "To encourage",
    support: "Needs support",
    inactive: "Inactive",
  },
  labelScore: "score",
  labelProgress: "progress",
  labelStreak: "streak",
  lastActive: (t) => `Last seen ${t} ago`,
  view: "See profile",
  emptyH: "No learner matches.",
  emptySub: "Try different filters, or clear them.",
};

export default function TeacherStudentsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => LEARNERS.filter((s) => {
    if (filter === "progressing") {
      if (s.status !== "progressing" && s.status !== "good") return false;
    } else if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.klass.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [filter, search]);

  const counts = useMemo(() => ({
    all: LEARNERS.length,
    encourage: LEARNERS.filter((s) => s.status === "encourage").length,
    progressing: LEARNERS.filter((s) => s.status === "progressing" || s.status === "good").length,
    support: LEARNERS.filter((s) => s.status === "support").length,
    inactive: LEARNERS.filter((s) => s.status === "inactive").length,
  }), []);

  const statusPillClass = (s: Learner["status"]) =>
    s === "good" || s === "progressing" ? "active"
    : s === "encourage" ? "pending"
    : s === "support" ? "warning"
    : "inactive";

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="search"
            aria-label={t.searchPh}
            className="modal-input"
            style={{ flex: 1, minWidth: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPh}
          />
        </div>

        <div className="subpage-filters" role="tablist" aria-label={t.filters.all}>
          {(Object.keys(t.filters) as Filter[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={filter === k}
              className={`subpage-filter ${filter === k ? "on" : ""}`}
              onClick={() => setFilter(k)}
            >
              {t.filters[k]} · {counts[k]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-h">{t.emptyH}</p>
            <p className="empty-state-sub">{t.emptySub}</p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map((s) => {
              const scoreClass = s.avgScore >= 7 ? "high" : s.avgScore >= 5 ? "mid" : "low";
              return (
                <article key={s.id} className="card">
                  <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="mono-avatar" aria-hidden="true">{initials(s.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="card-h" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      <p className="card-sub">{s.klass} · {s.level}</p>
                    </div>
                    <span className={`status-pill ${statusPillClass(s.status)}`}>{t.statusLbl[s.status]}</span>
                  </header>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}>
                    <div style={{ textAlign: "center", padding: "10px 6px", background: "rgba(244, 235, 220, 0.02)", borderRadius: 8 }}>
                      <p className={`score-cell ${scoreClass}`} style={{ margin: 0 }}>{s.avgScore}/10</p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.labelScore}</p>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 6px", background: "rgba(244, 235, 220, 0.02)", borderRadius: 8 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-jetbrains, monospace)", color: "var(--creme)", fontWeight: 600 }}>{s.progress}%</p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.labelProgress}</p>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 6px", background: "rgba(244, 235, 220, 0.02)", borderRadius: 8 }}>
                      <p style={{
                        margin: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "var(--font-jetbrains, monospace)",
                        color: s.streak > 0 ? "var(--brass)" : "var(--creme-mute)",
                        fontWeight: 600,
                      }}>
                        {s.streak > 0 && <IconFlame size={12} />}
                        {s.streak > 0 ? `${s.streak}` : "—"}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.labelStreak}</p>
                    </div>
                  </div>

                  <div className="card-progress">
                    <div className="card-progress-bar" style={{ width: `${s.progress}%` }} />
                  </div>

                  <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.04em" }}>
                      {t.lastActive(s.lastActive)}
                    </span>
                    <Link href={`/teacher/students/${s.id}`} className="row-btn">{t.view}</Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </TeacherLayout>
  );
}

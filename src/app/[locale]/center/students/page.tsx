"use client";

import { useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";

interface Student {
  id: string;
  name: string;
  email: string;
  teacher: string;
  classroom: string;
  level: string;
  xp: number;
  streak: number;
  subscription: "FREE" | "BASIC" | "PREMIUM" | "ANNUAL";
  lastActive: string;
  avgScore: number;
  progress: number;
}

const STUDENTS: Student[] = [
  { id: "s1",  name: "Marie Nguemo",   email: "marie.nguemo@gmail.com",   teacher: "Sophie Tanda",      classroom: "A1 Matin",       level: "A1", xp: 1850, streak: 12, subscription: "PREMIUM", lastActive: "2026-05-08", avgScore: 8.2, progress: 68 },
  { id: "s2",  name: "Paul Atangana",  email: "paul.atangana@gmail.com",  teacher: "Sophie Tanda",      classroom: "A1 Matin",       level: "A1", xp: 920,  streak: 3,  subscription: "FREE",    lastActive: "2026-05-06", avgScore: 4.5, progress: 35 },
  { id: "s3",  name: "Diane Biya",     email: "diane.biya@gmail.com",     teacher: "Dr. Beatrice Momo", classroom: "B1 Avancé",      level: "B1", xp: 2100, streak: 21, subscription: "ANNUAL",  lastActive: "2026-05-09", avgScore: 9.1, progress: 82 },
  { id: "s4",  name: "Eric Fotso",     email: "eric.fotso@gmail.com",     teacher: "Jean-Pierre Nkolo", classroom: "B2 Conversation",level: "B2", xp: 430,  streak: 0,  subscription: "FREE",    lastActive: "2026-04-28", avgScore: 3.2, progress: 18 },
  { id: "s5",  name: "Sandrine Kamga", email: "sandrine.kamga@gmail.com", teacher: "Sophie Tanda",      classroom: "A1 Soir",        level: "A1", xp: 1560, streak: 7,  subscription: "BASIC",   lastActive: "2026-05-07", avgScore: 7.4, progress: 58 },
  { id: "s6",  name: "Jean Mbarga",    email: "jean.mbarga@gmail.com",    teacher: "Arsène Biyong",     classroom: "A2 Préparation", level: "A2", xp: 680,  streak: 2,  subscription: "PREMIUM", lastActive: "2026-05-05", avgScore: 5.8, progress: 42 },
  { id: "s7",  name: "Olivia Tchamba", email: "olivia.tchamba@gmail.com", teacher: "Dr. Beatrice Momo", classroom: "B1 Avancé",      level: "B1", xp: 3200, streak: 30, subscription: "ANNUAL",  lastActive: "2026-05-09", avgScore: 9.4, progress: 94 },
  { id: "s8",  name: "Marc Essono",    email: "marc.essono@gmail.com",    teacher: "Jean-Pierre Nkolo", classroom: "B2 Conversation",level: "B2", xp: 1100, streak: 5,  subscription: "BASIC",   lastActive: "2026-05-04", avgScore: 6.1, progress: 47 },
  { id: "s9",  name: "Brice Ondoua",   email: "brice.ondoua@gmail.com",   teacher: "Arsène Biyong",     classroom: "A2 Préparation", level: "A2", xp: 780,  streak: 4,  subscription: "PREMIUM", lastActive: "2026-05-08", avgScore: 6.8, progress: 53 },
  { id: "s10", name: "Fatiha Moussa",  email: "fatiha.moussa@gmail.com",  teacher: "Sophie Tanda",      classroom: "A1 Soir",        level: "A1", xp: 460,  streak: 1,  subscription: "FREE",    lastActive: "2026-05-03", avgScore: 3.8, progress: 22 },
];

const PENDING = [
  { id: "p1", name: "Alain Nkomo",   email: "alain.nkomo@gmail.com",   teacher: "Sophie Tanda",      classroom: "A1 Matin",       level: "A1", requestedAt: "2026-05-09T14:22:00Z" },
  { id: "p2", name: "Celine Fogue",  email: "celine.fogue@gmail.com",  teacher: "Dr. Beatrice Momo", classroom: "B1 Avancé",      level: "B1", requestedAt: "2026-05-10T08:05:00Z" },
  { id: "p3", name: "Samuel Manga",  email: "samuel.manga@gmail.com",  teacher: "Jean-Pierre Nkolo", classroom: "B2 Conversation",level: "A2", requestedAt: "2026-05-10T10:30:00Z" },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: (n: number, total: number) => string;
  export: string;
  tabActive: string;
  tabPending: string;
  searchPh: string;
  fAllTeacher: string;
  fAllLevel: string;
  fAllSub: string;
  subFree: string;
  subBasic: string;
  subPremium: string;
  subAnnual: string;
  reset: string;
  cols: [string, string, string, string, string, string, string, string, string];
  emptyH: string;
  emptySub: string;
  profile: string;
  subscription: string;
  pendingEmpty: string;
  pendingH: string;
  requestedOn: (d: string) => string;
  validate: string;
  refuse: string;
  processing: string;
}

const FR: Copy = {
  title: "Apprenant·e·s",
  eye: "Apprenant·e·s du centre",
  h: "Une vue d'ensemble, deux gestes.",
  sub: (n, total) => `${n} sur ${total} affiché·e·s.`,
  export: "Exporter CSV",
  tabActive: "Actif·ve·s",
  tabPending: "En attente",
  searchPh: "Rechercher un nom ou email…",
  fAllTeacher: "Tou·te·s les enseignant·e·s",
  fAllLevel: "Tous les niveaux",
  fAllSub: "Tous les abonnements",
  subFree: "Gratuit",
  subBasic: "Basic",
  subPremium: "Premium",
  subAnnual: "Annuel",
  reset: "Réinitialiser",
  cols: ["Apprenant·e", "Enseignant·e · Classe", "Niveau", "XP", "Score", "Progression", "Plan", "Dernière activité", ""],
  emptyH: "Aucun résultat.",
  emptySub: "Essaie d'autres filtres, ou reviens à la vue complète.",
  profile: "Profil",
  subscription: "Plan",
  pendingEmpty: "Aucune demande en attente.",
  pendingH: "Demandes de rattachement",
  requestedOn: (d) => `Reçue le ${d}`,
  validate: "Valider",
  refuse: "Refuser",
  processing: "…",
};

const EN: Copy = {
  title: "Learners",
  eye: "Center learners",
  h: "One overview, two actions.",
  sub: (n, total) => `${n} of ${total} shown.`,
  export: "Export CSV",
  tabActive: "Active",
  tabPending: "Pending",
  searchPh: "Search a name or email…",
  fAllTeacher: "All teachers",
  fAllLevel: "All levels",
  fAllSub: "All plans",
  subFree: "Free",
  subBasic: "Basic",
  subPremium: "Premium",
  subAnnual: "Annual",
  reset: "Reset",
  cols: ["Learner", "Teacher · Class", "Level", "XP", "Score", "Progress", "Plan", "Last active", ""],
  emptyH: "No match.",
  emptySub: "Try different filters, or clear them all.",
  profile: "Profile",
  subscription: "Plan",
  pendingEmpty: "No pending request.",
  pendingH: "Enrollment requests",
  requestedOn: (d) => `Received on ${d}`,
  validate: "Approve",
  refuse: "Decline",
  processing: "…",
};

function exportCSV(rows: Student[]) {
  const header = "name,email,teacher,classroom,level,xp,streak,subscription,lastActive,avgScore,progress\n";
  const body = rows.map((s) =>
    `"${s.name}","${s.email}","${s.teacher}","${s.classroom}","${s.level}",${s.xp},${s.streak},"${s.subscription}","${s.lastActive}",${s.avgScore},${s.progress}%`,
  ).join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "yema-learners.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CenterStudentsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const [tab, setTab] = useState<"active" | "pending">("active");
  const [pending, setPending] = useState(PENDING);
  const [processing, setProcessing] = useState<string | null>(null);
  const [teacher, setTeacher] = useState("");
  const [level, setLevel] = useState("");
  const [sub, setSub] = useState("");
  const [search, setSearch] = useState("");

  const teachers = useMemo(() => Array.from(new Set(STUDENTS.map((s) => s.teacher))), []);
  const levels = useMemo(() => Array.from(new Set(STUDENTS.map((s) => s.level))).sort(), []);

  const filtered = useMemo(() => STUDENTS.filter((s) => {
    if (teacher && s.teacher !== teacher) return false;
    if (level && s.level !== level) return false;
    if (sub && s.subscription !== sub) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [teacher, level, sub, search]);

  const clear = () => { setTeacher(""); setLevel(""); setSub(""); setSearch(""); };
  const hasFilters = !!(teacher || level || sub || search);

  const decide = async (id: string) => {
    setProcessing(id);
    await new Promise((r) => setTimeout(r, 500));
    setPending((p) => p.filter((row) => row.id !== id));
    setProcessing(null);
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <CenterLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub(filtered.length, STUDENTS.length)}</p>
          </div>
          <button type="button" className="subpage-cta ghost" onClick={() => exportCSV(filtered)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 2v8M3.5 7L7 10.5 10.5 7M2 12h10" />
            </svg>
            {t.export}
          </button>
        </header>

        <div className="subpage-filters" role="tablist" aria-label={t.tabActive}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            className={`subpage-filter ${tab === "active" ? "on" : ""}`}
            onClick={() => setTab("active")}
          >
            {t.tabActive} · {STUDENTS.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pending"}
            className={`subpage-filter ${tab === "pending" ? "on" : ""}`}
            onClick={() => setTab("pending")}
          >
            {t.tabPending} · {pending.length}
          </button>
        </div>

        {tab === "pending" ? (
          pending.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-h">{t.pendingEmpty}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p className="dash-eye">{t.pendingH}</p>
              {pending.map((p) => (
                <div key={p.id} className="dash-center-team-row" style={{ gridTemplateColumns: "40px 1fr auto" }}>
                  <div className="mono-avatar" style={{ width: 40, height: 40 }} aria-hidden="true">{initials(p.name)}</div>
                  <div>
                    <p className="dash-center-team-name">{p.name}</p>
                    <p className="dash-center-team-meta">
                      {p.email} · {p.teacher} · {p.classroom} · {p.level}
                    </p>
                    <p className="dash-center-team-meta" style={{ marginTop: 2, fontSize: 11 }}>
                      {t.requestedOn(new Date(p.requestedAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" }))}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="row-btn"
                      disabled={processing === p.id}
                      onClick={() => decide(p.id)}
                    >
                      {processing === p.id ? t.processing : t.validate}
                    </button>
                    <button
                      type="button"
                      className="row-btn danger"
                      disabled={processing === p.id}
                      onClick={() => decide(p.id)}
                    >
                      {t.refuse}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="filter-row">
              <input
                type="search"
                aria-label={t.searchPh}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPh}
                className="modal-input"
              />
              <select
                aria-label={t.fAllTeacher}
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="modal-select"
              >
                <option value="">{t.fAllTeacher}</option>
                {teachers.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select
                aria-label={t.fAllLevel}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="modal-select"
              >
                <option value="">{t.fAllLevel}</option>
                {levels.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select
                aria-label={t.fAllSub}
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                className="modal-select"
              >
                <option value="">{t.fAllSub}</option>
                <option value="FREE">{t.subFree}</option>
                <option value="BASIC">{t.subBasic}</option>
                <option value="PREMIUM">{t.subPremium}</option>
                <option value="ANNUAL">{t.subAnnual}</option>
              </select>
              {hasFilters && (
                <button type="button" className="subpage-cta ghost" onClick={clear}>{t.reset}</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-h">{t.emptyH}</p>
                <p className="empty-state-sub">{t.emptySub}</p>
              </div>
            ) : (
              <>
                <div className="data-table-wrap desktop-only">
                  <div className="data-table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {t.cols.map((c, i) => (
                            <th key={c || i} className={i === 2 || i === 3 || i === 4 ? "center" : ""}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => {
                          const scoreClass = s.avgScore >= 7 ? "high" : s.avgScore >= 5 ? "mid" : "low";
                          return (
                            <tr key={s.id}>
                              <td>
                                <div className="mono-cell">
                                  <span className="mono-avatar" style={{ width: 32, height: 32, fontSize: 12 }} aria-hidden="true">
                                    {initials(s.name)}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <p className="mono-cell-name" style={{ fontSize: 13 }}>{s.name}</p>
                                    <p className="mono-cell-mail text-wrap-anywhere">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ color: "var(--creme-soft)" }}>{s.teacher}</div>
                                <div style={{ color: "var(--creme-mute)", fontSize: 11, marginTop: 2 }}>{s.classroom}</div>
                              </td>
                              <td className="center">
                                <span className="status-pill active">{s.level}</span>
                              </td>
                              <td className="center" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
                                {s.xp.toLocaleString()}
                              </td>
                              <td className="center">
                                <span className={`score-cell ${scoreClass}`}>{s.avgScore}/10</span>
                              </td>
                              <td>
                                <div className="card-progress" style={{ marginBottom: 4 }}>
                                  <div className="card-progress-bar" style={{ width: `${s.progress}%` }} />
                                </div>
                                <span style={{ color: "var(--creme-mute)", fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)" }}>
                                  {s.progress}%
                                </span>
                              </td>
                              <td>
                                <span className="status-pill pending">{s.subscription}</span>
                              </td>
                              <td style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11 }}>
                                {new Date(s.lastActive).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                              </td>
                              <td>
                                <Link href={`/teacher/students/${s.id}`} className="row-btn">{t.profile}</Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile · même source, une carte par apprenant·e */}
                <ul className="data-list mobile-only" aria-label={t.eye}>
                  {filtered.map((s) => {
                    const scoreClass = s.avgScore >= 7 ? "high" : s.avgScore >= 5 ? "mid" : "low";
                    return (
                      <li key={s.id} className="data-card">
                        <div className="data-card-head">
                          <span className="mono-avatar" style={{ width: 36, height: 36 }} aria-hidden="true">
                            {initials(s.name)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="data-card-title">{s.name}</p>
                            <p className="data-card-sub">{s.email}</p>
                          </div>
                          <span className="status-pill active" style={{ flexShrink: 0 }}>{s.level}</span>
                        </div>
                        <dl className="data-card-rows">
                          <dt>{t.cols[1]}</dt>
                          <dd>{s.teacher} · {s.classroom}</dd>
                          <dt>{t.cols[3]}</dt>
                          <dd>{s.xp.toLocaleString()} XP</dd>
                          <dt>{t.cols[4]}</dt>
                          <dd><span className={`score-cell ${scoreClass}`}>{s.avgScore}/10</span></dd>
                          <dt>{t.cols[5]}</dt>
                          <dd>
                            <div className="card-progress" style={{ marginBottom: 4 }}>
                              <div className="card-progress-bar" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span style={{ color: "var(--creme-mute)", fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)" }}>
                              {s.progress}%
                            </span>
                          </dd>
                          <dt>{t.cols[6]}</dt>
                          <dd><span className="status-pill pending">{s.subscription}</span></dd>
                          <dt>{t.cols[7]}</dt>
                          <dd>{new Date(s.lastActive).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}</dd>
                        </dl>
                        <div className="data-card-actions">
                          <Link href={`/teacher/students/${s.id}`} className="row-btn">{t.profile}</Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </CenterLayout>
  );
}

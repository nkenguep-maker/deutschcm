"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";

interface Klass {
  id: string;
  name: string;
  level: string;
  teacher: string;
  code: string;
  students: number;
  maxStudents: number;
  avgProgress: number;
  avgScore: number;
  isActive: boolean;
  schedule: string;
  enrolled: string;
}

const CLASSES: Klass[] = [
  { id: "cls1", name: "Groupe A1 Matin",  level: "A1", teacher: "Marie Tchamba",  code: "YEMA-A1-MT",  students: 18, maxStudents: 25, avgProgress: 45, avgScore: 7.5, isActive: true,  schedule: "Lun · Mer · Ven — 08h → 10h",   enrolled: "10 janv. 2026" },
  { id: "cls2", name: "Groupe A1 Soir",   level: "A1", teacher: "Jean Mbarga",    code: "YEMA-A1-SR",  students: 14, maxStudents: 20, avgProgress: 38, avgScore: 6.9, isActive: true,  schedule: "Mar · Jeu — 18h → 20h",         enrolled: "15 janv. 2026" },
  { id: "cls3", name: "Groupe A2 Matin",  level: "A2", teacher: "Marie Tchamba",  code: "YEMA-A2-MT",  students: 12, maxStudents: 20, avgProgress: 62, avgScore: 7.8, isActive: true,  schedule: "Lun · Mer — 09h → 11h",         enrolled: "20 janv. 2026" },
  { id: "cls4", name: "Groupe A2 Soir",   level: "A2", teacher: "Esther Fouda",   code: "YEMA-A2-SR",  students: 15, maxStudents: 20, avgProgress: 32, avgScore: 7.3, isActive: true,  schedule: "Mar · Jeu — 18h → 20h",         enrolled: "22 janv. 2026" },
  { id: "cls5", name: "Préparation B1",   level: "B1", teacher: "Marie Tchamba",  code: "YEMA-B1-GP",  students: 14, maxStudents: 20, avgProgress: 71, avgScore: 8.1, isActive: true,  schedule: "Sam — 09h → 13h",               enrolled: "5 févr. 2026"  },
  { id: "cls6", name: "Intensif B2",      level: "B2", teacher: "Alain Nkolo",    code: "YEMA-B2-IN",  students: 9,  maxStudents: 15, avgProgress: 54, avgScore: 8.4, isActive: true,  schedule: "Ven — 14h → 18h · Sam — 14h → 18h", enrolled: "1er mars 2026" },
  { id: "cls7", name: "Conversation C1",  level: "C1", teacher: "Sophie Beti",    code: "YEMA-C1-CV",  students: 6,  maxStudents: 12, avgProgress: 80, avgScore: 8.9, isActive: false, schedule: "Mer — 16h → 18h",               enrolled: "12 mars 2026"  },
];

type Filter = "all" | "active" | "inactive";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: (n: number, total: number, learners: number) => string;
  newBtn: string;
  searchPh: string;
  filters: Record<Filter, string>;
  emptyH: string;
  emptySub: string;
  statLearners: string;
  statProgress: string;
  statScore: string;
  statOpen: string;
  fill: (pct: number) => string;
  manage: string;
  active: string;
  inactive: string;
  modalEye: string;
  modalH: string;
  modalSub: string;
  fldName: string;
  fldNamePh: string;
  fldTeacher: string;
  fldTeacherPh: string;
  fldLevel: string;
  fldLevelPh: string;
  fldMax: string;
  fldMaxPh: string;
  cancel: string;
  create: string;
}

const FR: Copy = {
  title: "Mes classes",
  eye: "Classes du centre",
  h: "Une classe, un rythme, un·e prof.",
  sub: (n, total, learners) => `${n} sur ${total} affichée${n > 1 ? "s" : ""} · ${learners} apprenant·e·s au total.`,
  newBtn: "Nouvelle classe",
  searchPh: "Rechercher une classe, un·e prof, un niveau…",
  filters: { all: "Toutes", active: "Actives", inactive: "Inactives" },
  emptyH: "Aucune classe ne correspond.",
  emptySub: "Essaie un autre filtre, ou crée une nouvelle classe.",
  statLearners: "Apprenant·e·s",
  statProgress: "Progression",
  statScore: "Score",
  statOpen: "Ouvert le",
  fill: (pct) => `${pct}% rempli`,
  manage: "Gérer",
  active: "Active",
  inactive: "Inactive",
  modalEye: "Nouvelle classe",
  modalH: "Créer une nouvelle classe",
  modalSub: "Un code d'accès sera généré automatiquement.",
  fldName: "Nom de la classe",
  fldNamePh: "Ex : Groupe B1 Weekend",
  fldTeacher: "Enseignant·e",
  fldTeacherPh: "Nom Prénom",
  fldLevel: "Niveau",
  fldLevelPh: "A1 · A2 · B1 · B2 · C1",
  fldMax: "Capacité max",
  fldMaxPh: "20",
  cancel: "Annuler",
  create: "Créer la classe",
};

const EN: Copy = {
  title: "My classes",
  eye: "Center classes",
  h: "One class, one rhythm, one teacher.",
  sub: (n, total, learners) => `${n} of ${total} shown · ${learners} learners total.`,
  newBtn: "New class",
  searchPh: "Search a class, a teacher, a level…",
  filters: { all: "All", active: "Active", inactive: "Inactive" },
  emptyH: "No class matches.",
  emptySub: "Try another filter, or create a new class.",
  statLearners: "Learners",
  statProgress: "Progress",
  statScore: "Score",
  statOpen: "Opened",
  fill: (pct) => `${pct}% full`,
  manage: "Manage",
  active: "Active",
  inactive: "Inactive",
  modalEye: "New class",
  modalH: "Create a new class",
  modalSub: "An access code will be generated automatically.",
  fldName: "Class name",
  fldNamePh: "e.g. B1 Weekend Group",
  fldTeacher: "Teacher",
  fldTeacherPh: "First Last",
  fldLevel: "Level",
  fldLevelPh: "A1 · A2 · B1 · B2 · C1",
  fldMax: "Max capacity",
  fldMaxPh: "20",
  cancel: "Cancel",
  create: "Create class",
};

export default function CenterClassesPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", teacher: "", level: "", max: "" });

  const filtered = useMemo(() => CLASSES.filter((c) => {
    const matchFilter = filter === "active" ? c.isActive : filter === "inactive" ? !c.isActive : true;
    const q = search.toLowerCase();
    return (
      matchFilter &&
      (c.name.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q))
    );
  }), [filter, search]);

  const totalLearners = filtered.reduce((s, c) => s + c.students, 0);

  return (
    <CenterLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub(filtered.length, CLASSES.length, totalLearners)}</p>
          </div>
          <button type="button" className="subpage-cta" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v8M3 7h8" />
            </svg>
            {t.newBtn}
          </button>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPh}
            aria-label={t.searchPh}
            className="modal-input"
            style={{ flex: 1, minWidth: 260 }}
          />
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
                {t.filters[k]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-h">{t.emptyH}</p>
            <p className="empty-state-sub">{t.emptySub}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((cls) => {
              const fillPct = Math.round((cls.students / cls.maxStudents) * 100);
              const scoreClass = cls.avgScore >= 8 ? "high" : cls.avgScore >= 6 ? "mid" : "low";
              return (
                <article
                  key={cls.id}
                  style={{
                    background: "var(--espresso-2)",
                    border: "1px solid var(--creme-hair)",
                    borderRadius: 14,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 style={{
                          fontFamily: "var(--font-fraunces), Georgia, serif",
                          fontSize: 18,
                          color: "var(--creme)",
                          margin: 0,
                          fontWeight: 400,
                        }}>{cls.name}</h3>
                        <span className="status-pill active">{cls.level}</span>
                        <span className={`status-pill ${cls.isActive ? "active" : "inactive"}`}>
                          {cls.isActive ? t.active : t.inactive}
                        </span>
                      </div>
                      <p style={{
                        color: "var(--creme-mute)",
                        fontSize: 12.5,
                        fontFamily: "var(--font-jetbrains, monospace)",
                        letterSpacing: "0.04em",
                        margin: 0,
                      }}>
                        {cls.teacher} · {cls.schedule}
                      </p>
                    </div>
                    <code style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      background: "var(--brass-glow)",
                      border: "1px solid var(--brass-edge)",
                      color: "var(--brass)",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      alignSelf: "flex-start",
                    }}>{cls.code}</code>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 10,
                  }}>
                    {[
                      { v: `${cls.students}/${cls.maxStudents}`, l: t.statLearners },
                      { v: `${cls.avgProgress}%`, l: t.statProgress },
                      { v: `${cls.avgScore}/10`, l: t.statScore, cls: scoreClass },
                      { v: cls.enrolled, l: t.statOpen },
                    ].map((s) => (
                      <div key={s.l} style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(244, 235, 220, 0.02)",
                        border: "1px solid var(--creme-hair)",
                      }}>
                        <p style={{
                          fontFamily: "var(--font-fraunces), Georgia, serif",
                          fontSize: 16,
                          color: s.cls === "high" ? "var(--brass)" : s.cls === "low" ? "var(--oxblood)" : "var(--creme)",
                          margin: 0,
                          lineHeight: 1.2,
                        }}>{s.v}</p>
                        <p style={{
                          fontFamily: "var(--font-jetbrains, monospace)",
                          fontSize: 10,
                          color: "var(--creme-mute)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          margin: "4px 0 0",
                        }}>{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div className="card-progress" style={{ flex: 1, minWidth: 160 }}>
                      <div className="card-progress-bar" style={{ width: `${fillPct}%` }} />
                    </div>
                    <span style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      color: "var(--creme-mute)",
                      fontSize: 11,
                      letterSpacing: "0.04em",
                    }}>{t.fill(fillPct)}</span>
                    <button type="button" className="row-btn">{t.manage}</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="modal-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-new-h"
        >
          <div className="modal-card">
            <p className="modal-eye">{t.modalEye}</p>
            <h3 id="class-new-h" className="modal-h">{t.modalH}</h3>
            <p className="modal-sub">{t.modalSub}</p>

            <div className="modal-form">
              <div className="modal-field">
                <label htmlFor="cls-name" className="modal-lbl">{t.fldName}</label>
                <input id="cls-name" className="modal-input" placeholder={t.fldNamePh}
                       value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label htmlFor="cls-teacher" className="modal-lbl">{t.fldTeacher}</label>
                <input id="cls-teacher" className="modal-input" placeholder={t.fldTeacherPh}
                       value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label htmlFor="cls-level" className="modal-lbl">{t.fldLevel}</label>
                <input id="cls-level" className="modal-input" placeholder={t.fldLevelPh}
                       value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label htmlFor="cls-max" className="modal-lbl">{t.fldMax}</label>
                <input id="cls-max" type="number" min="1" className="modal-input" placeholder={t.fldMaxPh}
                       value={form.max} onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="subpage-cta ghost" onClick={() => setShowModal(false)}>
                {t.cancel}
              </button>
              <button type="button" className="subpage-cta"
                      disabled={!form.name || !form.teacher || !form.level}
                      onClick={() => setShowModal(false)}>
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </CenterLayout>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import {
  IconGrammatik,
  IconLesen,
  IconSprechen,
  IconSchreiben,
  IconHoeren,
  IconSpark,
} from "@/components/landing/icons";

type Kind = "quiz" | "read" | "sim" | "grammar" | "listen" | "write";
type TabKey = "review" | "ai" | "approved" | "all";

interface Activity {
  id: string;
  title: string;
  klass: string;
  due: string;
  submitted: number;
  total: number;
  maxScore: number;
  tab: "review" | "ai" | "approved";
  kind: Kind;
  hasAI: boolean;
}

const ACTIVITIES: Activity[] = [
  { id: "a1", title: "Quiz Lektion 4 — Wortschatz",       klass: "Groupe A1 Matin", due: "12 mai 2026", submitted: 12, total: 18, maxScore: 20, tab: "review",   kind: "quiz",    hasAI: true  },
  { id: "a2", title: "Lesen Arbeit — Textverstehen",       klass: "Groupe A1 Matin", due: "15 mai 2026", submitted:  7, total: 18, maxScore: 20, tab: "review",   kind: "read",    hasAI: false },
  { id: "a3", title: "Simulation Ambassade",               klass: "Préparation B1",   due: "—",           submitted: 14, total: 14, maxScore: 30, tab: "approved", kind: "sim",     hasAI: true  },
  { id: "a4", title: "Grammaire : Akkusativ & Dativ",      klass: "Groupe A2 Soir",   due: "18 mai 2026", submitted:  3, total: 15, maxScore: 20, tab: "review",   kind: "grammar", hasAI: false },
  { id: "a5", title: "Hörverstehen — Dialog au café",      klass: "Groupe A2 Soir",   due: "22 mai 2026", submitted:  0, total: 15, maxScore: 15, tab: "ai",       kind: "listen",  hasAI: true  },
  { id: "a6", title: "Schreiben — Brief an einen Freund",  klass: "Préparation B1",   due: "20 mai 2026", submitted:  9, total: 14, maxScore: 25, tab: "review",   kind: "write",   hasAI: true  },
];

const KIND_ICON: Record<Kind, (p: { size?: number }) => React.ReactElement> = {
  quiz: IconGrammatik,
  read: IconLesen,
  sim: IconSprechen,
  grammar: IconGrammatik,
  listen: IconHoeren,
  write: IconSchreiben,
};

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  loopEye: string;
  loop: [string, string, string, string];
  demoEye: string;
  demoBody: string;
  filters: Record<TabKey, string>;
  submitted: string;
  submittedPct: string;
  deadline: string;
  maxScore: string;
  aiChip: string;
  review: string;
  prepare: string;
  emptyH: string;
  emptySub: string;
  modalEye: string;
  modalH: string;
  modalSub: string;
  fldTitle: [string, string];
  fldClass: [string, string];
  fldDue: [string, string];
  guarantee: string;
  cancel: string;
  createDraft: string;
}

const FR: Copy = {
  title: "Corrections",
  eye: "Corrections",
  h: "Ton regard reste central.",
  sub: "L'IA propose une piste. Ta validation la publie. Les apprenant·e·s reçoivent ta note, pas celle d'une machine.",
  loopEye: "Boucle de correction",
  loop: ["Apprenant·e", "IA suggère", "Tu valides", "Envoi apprenant·e"],
  demoEye: "Données de démo",
  demoBody: "Ces activités sont fictives. Elles montrent comment la file de correction se remplira une fois tes classes actives.",
  filters: { review: "À revoir", ai: "IA proposée", approved: "Envoyées", all: "Toutes" },
  submitted: "Rendus",
  submittedPct: "remis",
  deadline: "Échéance",
  maxScore: "Note max",
  aiChip: "IA prête",
  review: "Revoir les rendus",
  prepare: "Préparer une activité",
  emptyH: "Rien dans cette catégorie.",
  emptySub: "Essaie un autre onglet pour voir les activités concernées.",
  modalEye: "Nouvelle activité",
  modalH: "Préparer une activité",
  modalSub: "Ta consigne, ta classe, ton échéance. La publication demandera ta validation.",
  fldTitle: ["Titre", "Ex : Vocabulaire Lektion 5"],
  fldClass: ["Classe", "Groupe A1 Matin"],
  fldDue: ["Date limite", ""],
  guarantee: "Rien n'est publié sans ta relecture.",
  cancel: "Annuler",
  createDraft: "Enregistrer le brouillon",
};

const EN: Copy = {
  title: "Corrections",
  eye: "Corrections",
  h: "Your judgement stays central.",
  sub: "AI drafts a path. Your validation publishes it. Learners receive your grade — not a machine's.",
  loopEye: "Correction loop",
  loop: ["Learner", "AI suggests", "You validate", "Sent to learner"],
  demoEye: "Demo data",
  demoBody: "These activities are placeholders. They show how the review queue will look once your classes are active.",
  filters: { review: "To review", ai: "AI drafted", approved: "Sent", all: "All" },
  submitted: "Submitted",
  submittedPct: "in",
  deadline: "Deadline",
  maxScore: "Max score",
  aiChip: "AI ready",
  review: "Review submissions",
  prepare: "Plan an activity",
  emptyH: "Nothing in this bucket.",
  emptySub: "Try another tab to see relevant items.",
  modalEye: "New activity",
  modalH: "Plan an activity",
  modalSub: "Your instructions, your class, your deadline. Publishing needs your approval.",
  fldTitle: ["Title", "e.g. Lesson 5 vocabulary"],
  fldClass: ["Class", "Morning A1 group"],
  fldDue: ["Deadline", ""],
  guarantee: "Nothing goes out without your review.",
  cancel: "Cancel",
  createDraft: "Save draft",
};

export default function TeacherAssignmentsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [tab, setTab] = useState<TabKey>("review");
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(
    () => ACTIVITIES.filter((a) => tab === "all" || a.tab === tab),
    [tab],
  );
  const counts: Record<TabKey, number> = {
    review: ACTIVITIES.filter((a) => a.tab === "review").length,
    ai: ACTIVITIES.filter((a) => a.tab === "ai").length,
    approved: ACTIVITIES.filter((a) => a.tab === "approved").length,
    all: ACTIVITIES.length,
  };

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
          <button type="button" className="subpage-cta" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v8M3 7h8" />
            </svg>
            {t.prepare}
          </button>
        </header>

        <section style={{
          padding: "18px 22px",
          background: "var(--brass-glow)",
          border: "1px solid var(--brass-edge)",
          borderRadius: 14,
        }}>
          <p className="subpage-eye">{t.loopEye}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {t.loop.map((step, i) => (
              <span key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && (
                  <span aria-hidden="true" style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)" }}>→</span>
                )}
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--brass-edge)",
                  background: "var(--espresso-2)",
                  color: "var(--creme)",
                  fontFamily: "var(--font-jetbrains, monospace)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}>
                  {i + 1}. {step}
                </span>
              </span>
            ))}
          </div>
        </section>

        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px dashed var(--creme-hair)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <span className="status-pill pending">{t.demoEye}</span>
          <p style={{ margin: 0, color: "var(--creme-soft)", fontSize: 12.5, lineHeight: 1.5 }}>
            {t.demoBody}
          </p>
        </div>

        <div className="subpage-filters" role="tablist" aria-label={t.filters.review}>
          {(Object.keys(t.filters) as TabKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`subpage-filter ${tab === k ? "on" : ""}`}
              onClick={() => setTab(k)}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((a) => {
              const pct = Math.round((a.submitted / a.total) * 100);
              const scoreClass = pct >= 80 ? "high" : pct >= 40 ? "mid" : "low";
              const Icon = KIND_ICON[a.kind];
              return (
                <article key={a.id} style={{
                  background: "var(--espresso-2)",
                  border: "1px solid var(--creme-hair)",
                  borderRadius: 14,
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  gap: 16,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: "var(--brass-glow)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--brass)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }} aria-hidden="true">
                    <Icon size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <h3 style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 17,
                        color: "var(--creme)",
                        margin: 0,
                        fontWeight: 400,
                      }}>{a.title}</h3>
                      <span className="status-pill inactive">{a.klass}</span>
                      {a.hasAI && (
                        <span className="status-pill active" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <IconSpark size={10} />
                          {t.aiChip}
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: "0 0 12px",
                      color: "var(--creme-mute)",
                      fontFamily: "var(--font-jetbrains, monospace)",
                      fontSize: 12,
                      letterSpacing: "0.04em",
                    }}>
                      {t.deadline}: {a.due} · {t.maxScore}: {a.maxScore}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180, maxWidth: 280 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "var(--creme-soft)", fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {t.submitted}
                          </span>
                          <span className={`score-cell ${scoreClass}`} style={{ fontSize: 12 }}>
                            {a.submitted}/{a.total}
                          </span>
                        </div>
                        <div className="card-progress">
                          <div className="card-progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span style={{
                        color: "var(--creme-mute)",
                        fontFamily: "var(--font-jetbrains, monospace)",
                        fontSize: 11,
                        letterSpacing: "0.04em",
                      }}>
                        {pct}% {t.submittedPct}
                      </span>
                    </div>
                  </div>
                  <button type="button" className="row-btn" style={{ whiteSpace: "nowrap" }}>
                    {t.review}
                  </button>
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
          aria-labelledby="assign-new-h"
        >
          <div className="modal-card">
            <p className="modal-eye">{t.modalEye}</p>
            <h3 id="assign-new-h" className="modal-h">{t.modalH}</h3>
            <p className="modal-sub">{t.modalSub}</p>

            <div className="modal-form">
              {([
                { key: "title", label: t.fldTitle[0], ph: t.fldTitle[1], type: "text" },
                { key: "class", label: t.fldClass[0], ph: t.fldClass[1], type: "text" },
                { key: "due",   label: t.fldDue[0],   ph: t.fldDue[1],   type: "date" },
              ] as const).map((f) => (
                <div key={f.key} className="modal-field">
                  <label htmlFor={`assign-${f.key}`} className="modal-lbl">{f.label}</label>
                  <input id={`assign-${f.key}`} type={f.type} className="modal-input" placeholder={f.ph} />
                </div>
              ))}
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--brass-glow)",
                border: "1px solid var(--brass-edge)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{ color: "var(--brass)" }} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7l3 3 5-6" />
                  </svg>
                </span>
                <span style={{ color: "var(--creme-soft)", fontSize: 12.5, lineHeight: 1.4 }}>
                  {t.guarantee}
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="subpage-cta ghost" onClick={() => setShowModal(false)}>
                {t.cancel}
              </button>
              <button type="button" className="subpage-cta" onClick={() => setShowModal(false)}>
                {t.createDraft}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}

"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";

interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  classes: number;
  students: number;
  avgScore: number;
  joinedAt: string;
  status: "active" | "inactive" | "pending";
  verified: boolean;
}

const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", name: "Dr. Beatrice Momo",  email: "b.momo@yema.app",   specialty: "Grammaire · Littérature",   classes: 3, students: 48, avgScore: 8.4, joinedAt: "2024-09-01", status: "active",   verified: true  },
  { id: "t2", name: "Jean-Pierre Nkolo",  email: "jp.nkolo@yema.app", specialty: "Conversation · B2-C1",      classes: 2, students: 31, avgScore: 7.9, joinedAt: "2024-10-15", status: "active",   verified: true  },
  { id: "t3", name: "Sophie Tanda",       email: "s.tanda@yema.app",  specialty: "A1-A2 Débutants",           classes: 4, students: 52, avgScore: 8.7, joinedAt: "2024-09-01", status: "active",   verified: true  },
  { id: "t4", name: "Arsène Biyong",      email: "a.biyong@yema.app", specialty: "Préparation examens CECRL", classes: 2, students: 28, avgScore: 7.2, joinedAt: "2025-01-10", status: "active",   verified: false },
  { id: "t5", name: "Claudine Ewane",     email: "c.ewane@yema.app",  specialty: "Business Deutsch",          classes: 1, students: 11, avgScore: 6.8, joinedAt: "2025-02-01", status: "inactive", verified: false },
  { id: "t6", name: "Dr. Samuel Kameni",  email: "s.kameni@gmail.com", specialty: "Phonétique",               classes: 0, students: 0,  avgScore: 0,   joinedAt: "2025-05-01", status: "pending",  verified: false },
  { id: "t7", name: "Alice Fouda",        email: "a.fouda@gmail.com",  specialty: "Culture & Civilisation",   classes: 0, students: 0,  avgScore: 0,   joinedAt: "2025-05-03", status: "pending",  verified: false },
];

type Filter = "all" | "active" | "inactive" | "pending";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: (active: number, pending: number) => string;
  invite: string;
  filters: Record<Filter, string>;
  cols: [string, string, string, string, string, string, string, string];
  emptyH: string;
  emptySub: string;
  profile: string;
  suspend: string;
  statusLbl: Record<Teacher["status"], string>;
  modalEye: string;
  modalH: string;
  modalSub: string;
  fldEmail: string;
  fldEmailPh: string;
  fldRole: string;
  roleTeacher: string;
  roleAdmin: string;
  fldMsg: string;
  fldMsgPh: string;
  cancel: string;
  send: string;
  sending: string;
  sent: string;
}

const FR: Copy = {
  title: "Enseignant·e·s",
  eye: "Équipe pédagogique",
  h: "Qui compose ton centre.",
  sub: (active, pending) => `${active} actif${active > 1 ? "·ve·s" : "·ve"} · ${pending} invitation${pending > 1 ? "s" : ""} en attente.`,
  invite: "Inviter un·e enseignant·e",
  filters: { all: "Tou·te·s", active: "Actifs", inactive: "Inactifs", pending: "En attente" },
  cols: ["Enseignant·e", "Spécialité", "Classes", "Élèves", "Score", "Rejoint le", "Statut", "Actions"],
  emptyH: "Aucun profil dans ce filtre.",
  emptySub: "Essaie un autre filtre ou invite un·e nouvel·le enseignant·e.",
  profile: "Profil",
  suspend: "Suspendre",
  statusLbl: { active: "Actif·ve", inactive: "Inactif·ve", pending: "En attente" },
  modalEye: "Invitation",
  modalH: "Inviter un·e enseignant·e",
  modalSub: "Un lien d'invitation sera envoyé par email. Il expire dans 7 jours.",
  fldEmail: "Adresse email",
  fldEmailPh: "prenom.nom@exemple.com",
  fldRole: "Rôle",
  roleTeacher: "Enseignant·e",
  roleAdmin: "Administrateur·rice du centre",
  fldMsg: "Message (optionnel)",
  fldMsgPh: "Un mot d'accueil…",
  cancel: "Annuler",
  send: "Envoyer l'invitation",
  sending: "Envoi…",
  sent: "Invitation envoyée",
};

const EN: Copy = {
  title: "Teachers",
  eye: "Teaching team",
  h: "Who runs your center.",
  sub: (active, pending) => `${active} active · ${pending} pending invitation${pending > 1 ? "s" : ""}.`,
  invite: "Invite a teacher",
  filters: { all: "All", active: "Active", inactive: "Inactive", pending: "Pending" },
  cols: ["Teacher", "Specialty", "Classes", "Learners", "Score", "Joined", "Status", "Actions"],
  emptyH: "No profile matches this filter.",
  emptySub: "Try another filter or invite a new teacher.",
  profile: "Profile",
  suspend: "Suspend",
  statusLbl: { active: "Active", inactive: "Inactive", pending: "Pending" },
  modalEye: "Invitation",
  modalH: "Invite a teacher",
  modalSub: "An email invitation will be sent. It expires in 7 days.",
  fldEmail: "Email",
  fldEmailPh: "first.last@example.com",
  fldRole: "Role",
  roleTeacher: "Teacher",
  roleAdmin: "Center administrator",
  fldMsg: "Message (optional)",
  fldMsgPh: "A short welcome note…",
  cancel: "Cancel",
  send: "Send invitation",
  sending: "Sending…",
  sent: "Invitation sent",
};

export default function CenterTeachersPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", role: "teacher", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const filtered = filter === "all" ? MOCK_TEACHERS : MOCK_TEACHERS.filter((x) => x.status === filter);
  const activeCount = MOCK_TEACHERS.filter((x) => x.status === "active").length;
  const pendingCount = MOCK_TEACHERS.filter((x) => x.status === "pending").length;

  const send = () => {
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setTimeout(() => {
        setShowModal(false);
        setStatus("idle");
        setForm({ email: "", role: "teacher", message: "" });
      }, 1400);
    }, 700);
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <CenterLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub(activeCount, pendingCount)}</p>
          </div>
          <button type="button" className="subpage-cta" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v8M3 7h8" />
            </svg>
            {t.invite}
          </button>
        </header>

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
                        <th key={c} className={i === 2 || i === 3 || i === 4 ? "center" : ""}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((teacher) => {
                      const scoreClass = teacher.avgScore >= 8 ? "high" : teacher.avgScore >= 7 ? "mid" : "low";
                      return (
                        <tr key={teacher.id}>
                          <td>
                            <div className="mono-cell">
                              <span className="mono-avatar" aria-hidden="true">{initials(teacher.name)}</span>
                              <div style={{ minWidth: 0 }}>
                                <p className="mono-cell-name">
                                  {teacher.name}
                                  {teacher.verified && (
                                    <svg className="mono-cell-check" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Vérifié">
                                      <path d="M2 6l3 3 5-6" />
                                    </svg>
                                  )}
                                </p>
                                <p className="mono-cell-mail text-wrap-anywhere">{teacher.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-wrap-anywhere">{teacher.specialty || "—"}</td>
                          <td className="center">{teacher.classes}</td>
                          <td className="center">{teacher.students}</td>
                          <td className="center">
                            {teacher.avgScore > 0 ? (
                              <span className={`score-cell ${scoreClass}`}>{teacher.avgScore}/10</span>
                            ) : (
                              <span style={{ color: "var(--creme-mute)" }}>—</span>
                            )}
                          </td>
                          <td>{new Date(teacher.joinedAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td>
                            <span className={`status-pill ${teacher.status}`}>{t.statusLbl[teacher.status]}</span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <Link href={`/teacher/students/${teacher.id}`} className="row-btn">
                                {t.profile}
                              </Link>
                              {teacher.status === "active" && (
                                <button type="button" className="row-btn danger">{t.suspend}</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile · même source, une carte par enseignant·e */}
            <ul className="data-list mobile-only" aria-label={t.eye}>
              {filtered.map((teacher) => {
                const scoreClass = teacher.avgScore >= 8 ? "high" : teacher.avgScore >= 7 ? "mid" : "low";
                return (
                  <li key={teacher.id} className="data-card">
                    <div className="data-card-head">
                      <span className="mono-avatar" aria-hidden="true">{initials(teacher.name)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="data-card-title">
                          {teacher.name}
                          {teacher.verified && (
                            <svg className="mono-cell-check" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Vérifié" style={{ marginLeft: 6, display: "inline" }}>
                              <path d="M2 6l3 3 5-6" />
                            </svg>
                          )}
                        </p>
                        <p className="data-card-sub">{teacher.email}</p>
                      </div>
                      <span className={`status-pill ${teacher.status}`} style={{ flexShrink: 0 }}>{t.statusLbl[teacher.status]}</span>
                    </div>
                    <dl className="data-card-rows">
                      <dt>{t.cols[1]}</dt>
                      <dd>{teacher.specialty || "—"}</dd>
                      <dt>{t.cols[2]} · {t.cols[3]}</dt>
                      <dd>{teacher.classes} · {teacher.students}</dd>
                      <dt>{t.cols[4]}</dt>
                      <dd>{teacher.avgScore > 0 ? <span className={`score-cell ${scoreClass}`}>{teacher.avgScore}/10</span> : "—"}</dd>
                      <dt>{t.cols[5]}</dt>
                      <dd>{new Date(teacher.joinedAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}</dd>
                    </dl>
                    <div className="data-card-actions">
                      <Link href={`/teacher/students/${teacher.id}`} className="row-btn">
                        {t.profile}
                      </Link>
                      {teacher.status === "active" && (
                        <button type="button" className="row-btn danger">{t.suspend}</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {showModal && (
        <div
          className="modal-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="teacher-invite-h"
        >
          <div className="modal-card">
            <p className="modal-eye">{t.modalEye}</p>
            <h3 id="teacher-invite-h" className="modal-h">{t.modalH}</h3>
            <p className="modal-sub">{t.modalSub}</p>

            <div className="modal-form">
              <div className="modal-field">
                <label htmlFor="inv-email" className="modal-lbl">{t.fldEmail}</label>
                <input
                  id="inv-email"
                  type="email"
                  className="modal-input"
                  placeholder={t.fldEmailPh}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="inv-role" className="modal-lbl">{t.fldRole}</label>
                <select
                  id="inv-role"
                  className="modal-select"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="teacher">{t.roleTeacher}</option>
                  <option value="admin">{t.roleAdmin}</option>
                </select>
              </div>
              <div className="modal-field">
                <label htmlFor="inv-msg" className="modal-lbl">{t.fldMsg}</label>
                <textarea
                  id="inv-msg"
                  rows={3}
                  className="modal-textarea"
                  placeholder={t.fldMsgPh}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="subpage-cta ghost" onClick={() => setShowModal(false)}>
                {t.cancel}
              </button>
              <button
                type="button"
                className="subpage-cta"
                onClick={send}
                disabled={!form.email || status !== "idle"}
              >
                {status === "sending" ? t.sending : status === "sent" ? t.sent : t.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </CenterLayout>
  );
}

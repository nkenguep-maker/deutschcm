"use client";

import { useState } from "react";
import Link from "next/link";
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
  { id: "t1", name: "Dr. Beatrice Momo",  email: "b.momo@goethe-yde.cm",    specialty: "Grammaire · Littérature", classes: 3, students: 48, avgScore: 8.4, joinedAt: "2024-09-01", status: "active",   verified: true },
  { id: "t2", name: "Jean-Pierre Nkolo",  email: "jp.nkolo@goethe-yde.cm",  specialty: "Conversation · B2-C1",    classes: 2, students: 31, avgScore: 7.9, joinedAt: "2024-10-15", status: "active",   verified: true },
  { id: "t3", name: "Sophie Tanda",       email: "s.tanda@goethe-yde.cm",   specialty: "A1-A2 Débutants",         classes: 4, students: 52, avgScore: 8.7, joinedAt: "2024-09-01", status: "active",   verified: true },
  { id: "t4", name: "Arsène Biyong",      email: "a.biyong@goethe-yde.cm",  specialty: "Préparation TELC/Goethe", classes: 2, students: 28, avgScore: 7.2, joinedAt: "2025-01-10", status: "active",   verified: false },
  { id: "t5", name: "Claudine Ewane",     email: "c.ewane@goethe-yde.cm",   specialty: "Business Deutsch",        classes: 1, students: 11, avgScore: 6.8, joinedAt: "2025-02-01", status: "inactive", verified: false },
  { id: "t6", name: "Dr. Samuel Kameni",  email: "s.kameni@gmail.com",       specialty: "Phonétique",              classes: 0, students: 0,  avgScore: 0,   joinedAt: "2025-05-01", status: "pending",  verified: false },
  { id: "t7", name: "Alice Fouda",        email: "a.fouda@gmail.com",        specialty: "Culture & Civilisation",  classes: 0, students: 0,  avgScore: 0,   joinedAt: "2025-05-03", status: "pending",  verified: false },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  active:   { bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)", label: "Actif" },
  inactive: { bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.3)", label: "Inactif" },
  pending:  { bg: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.3)",   label: "En attente" },
};

export default function CenterTeachersPage() {
  const [showModal, setShowModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "teacher", message: "" });
  const [sent, setSent] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filtered = filter === "all" ? MOCK_TEACHERS : MOCK_TEACHERS.filter(t => t.status === filter);

  const sendInvite = () => {
    setSent(true);
    setTimeout(() => { setSent(false); setShowModal(false); setInviteForm({ email: "", role: "teacher", message: "" }); }, 2000);
  };

  return (
    <CenterLayout title="Gestion des enseignants">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
            Enseignants
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            {MOCK_TEACHERS.filter(t => t.status === "active").length} actifs · {MOCK_TEACHERS.filter(t => t.status === "pending").length} invitations en attente
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: "linear-gradient(135deg, #eab308, #ca8a04)",
          color: "#080c10", border: "none", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Syne', sans-serif",
        }}>
          + Inviter un enseignant
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([["all", "Tous"], ["active", "Actifs"], ["inactive", "Inactifs"], ["pending", "En attente"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "6px 16px", borderRadius: 8, cursor: "pointer",
            background: filter === k ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
            color: filter === k ? "#eab308" : "rgba(255,255,255,0.4)",
            border: `1px solid ${filter === k ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.07)"}`,
            fontSize: 13, fontWeight: 600, transition: "all 0.2s",
          }}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Enseignant", "Spécialité", "Classes", "Élèves", "Score moy.", "Rejoint le", "Statut", "Actions"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.3)",
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const ss = STATUS_STYLE[t.status];
              return (
                <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(161,120,0,0.08))",
                        border: "1px solid rgba(234,179,8,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#eab308", fontWeight: 700, fontSize: 12,
                      }}>
                        {t.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                          {t.name}
                          {t.verified && <span style={{ color: "#10b981", fontSize: 11 }}>✓</span>}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{t.specialty || "—"}</td>
                  <td style={{ padding: "14px 16px", color: "#e2e8f0", fontSize: 13, textAlign: "center" }}>{t.classes}</td>
                  <td style={{ padding: "14px 16px", color: "#e2e8f0", fontSize: 13, textAlign: "center" }}>{t.students}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {t.avgScore > 0 ? (
                      <span style={{
                        color: t.avgScore >= 8 ? "#10b981" : t.avgScore >= 7 ? "#f59e0b" : "#ef4444",
                        fontWeight: 700, fontSize: 13,
                      }}>{t.avgScore}/10</span>
                    ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                    {new Date(t.joinedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {ss.label}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/teacher/students/${t.id}`} style={{
                        background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                        padding: "4px 10px", fontSize: 11, textDecoration: "none", whiteSpace: "nowrap",
                      }}>Profil</Link>
                      {t.status === "active" && (
                        <button style={{
                          background: "rgba(239,68,68,0.08)", color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6,
                          padding: "4px 10px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                        }}>Suspendre</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: "#0d1117", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: 16, padding: 32, width: 460, maxWidth: "90vw",
          }}>
            <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              Inviter un enseignant
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>
              Un lien d&apos;invitation sera envoyé par email.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Adresse email</label>
                <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="professeur@exemple.com"
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Rôle</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                  <option value="teacher">Enseignant</option>
                  <option value="admin">Administrateur centre</option>
                </select>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Message (optionnel)</label>
                <textarea value={inviteForm.message} onChange={e => setInviteForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Bienvenue dans notre équipe..." rows={3}
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>Annuler</button>
              <button onClick={sendInvite} style={{
                background: sent ? "#059669" : "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#080c10", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 700,
              }}>
                {sent ? "✓ Invitation envoyée !" : "Envoyer l'invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CenterLayout>
  );
}

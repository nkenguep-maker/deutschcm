"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import CenterLayout from "@/components/CenterLayout";

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Enseignants actifs", value: 11,           icon: "👨‍🏫", color: "#eab308", sub: "+3 ce mois" },
  { label: "Élèves inscrits",    value: 214,          icon: "👥",   color: "#10b981", sub: "+27 ce mois" },
  { label: "Classes actives",   value: 18,            icon: "🏫",   color: "#6366f1", sub: "5 niveaux (A1→C1)" },
  { label: "Revenus du mois",   value: "120 000 XAF", icon: "💰",   color: "#f59e0b", sub: "Plan Pro · Actif" },
];

const INSCRIPTIONS = [
  { mois: "Jun", eleves: 112 },
  { mois: "Jul", eleves: 121 },
  { mois: "Aoû", eleves: 135 },
  { mois: "Sep", eleves: 152 },
  { mois: "Oct", eleves: 148 },
  { mois: "Nov", eleves: 163 },
  { mois: "Déc", eleves: 158 },
  { mois: "Jan", eleves: 174 },
  { mois: "Fév", eleves: 183 },
  { mois: "Mar", eleves: 191 },
  { mois: "Avr", eleves: 205 },
  { mois: "Mai", eleves: 214 },
];

const TEACHERS = [
  { id: "t1", name: "Prof. Marie Tchamba",  specialty: "Allemand A1-B2",          classes: 3, students: 47,  avgScore: 7.8, status: "active" },
  { id: "t2", name: "Dr. Beatrice Momo",    specialty: "Grammaire · Littérature", classes: 3, students: 54,  avgScore: 8.4, status: "active" },
  { id: "t3", name: "Jean-Pierre Nkolo",    specialty: "Conversation · B2-C1",    classes: 2, students: 38,  avgScore: 7.9, status: "active" },
  { id: "t4", name: "Sophie Tanda",         specialty: "A1-A2 Débutants",         classes: 4, students: 62,  avgScore: 8.7, status: "active" },
  { id: "t5", name: "Arsène Biyong",        specialty: "Préparation TELC/Goethe", classes: 2, students: 31,  avgScore: 7.2, status: "active" },
  { id: "t6", name: "Claudine Ewane",       specialty: "Business Deutsch",        classes: 1, students: 13,  avgScore: 6.8, status: "inactive" },
];

const ALERTS = [
  { type: "warning", icon: "⚠️", title: "Renouvellement dans 12 jours", body: "Votre abonnement Pro expire le 22 mai 2026. Renouvelez pour éviter toute interruption." },
  { type: "info",    icon: "📩", title: "3 invitations en attente",       body: "Dr. Kameni, Mme Fouda et M. Abanda n'ont pas encore accepté leur invitation enseignant." },
  { type: "success", icon: "✅", title: "Nouvelle inscription record",    body: "+27 élèves ce mois — meilleure progression depuis l'ouverture du centre." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CenterDashboard() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [centerCode, setCenterCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    fetch("/api/center?action=code")
      .then(r => r.json())
      .then(d => { if (d.code) setCenterCode(d.code); })
      .catch(() => {});
  }, []);

  const copyCode = () => {
    if (!centerCode) return;
    navigator.clipboard.writeText(centerCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  return (
    <CenterLayout title="Vue d'ensemble" centerName="Institut Lingua Plus" centerCity="Yaoundé">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24 }}>
              Institut Lingua Plus
            </h2>
            <span style={{
              background: "rgba(16,185,129,0.15)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20,
              padding: "3px 12px", fontSize: 11, fontWeight: 700,
            }}>✓ Vérifié</span>
          </div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
            📍 Yaoundé, Cameroun · Tableau de bord · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/center/billing" style={{
          background: "linear-gradient(135deg, #eab308, #ca8a04)",
          color: "#080c10", borderRadius: 10, padding: "10px 20px",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          fontFamily: "'Syne', sans-serif",
        }}>
          ⭐ Plan Pro
        </Link>
      </div>

      {/* ── Code d'inscription ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(161,120,0,0.04))",
        border: "1px solid rgba(234,179,8,0.25)", borderRadius: 16,
        padding: "18px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 32 }}>🔑</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#eab308", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Code d&apos;inscription de votre centre
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700,
              color: "#f1f5f9", letterSpacing: "0.15em",
            }}>
              {centerCode ?? "Chargement..."}
            </span>
            {centerCode && (
              <button
                onClick={copyCode}
                style={{
                  background: codeCopied ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.12)",
                  border: `1px solid ${codeCopied ? "rgba(16,185,129,0.35)" : "rgba(234,179,8,0.3)"}`,
                  color: codeCopied ? "#10b981" : "#eab308",
                  borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {codeCopied ? "✓ Copié !" : "Copier"}
              </button>
            )}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
            Partagez ce code à vos élèves — ils le saisissent lors de leur inscription sur DeutschCM.
          </div>
        </div>
        <Link href="/center/students" style={{
          background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
          color: "#eab308", borderRadius: 10, padding: "10px 18px",
          fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
        }}>
          Voir les élèves →
        </Link>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "20px 18px",
            borderTop: `2px solid ${s.color}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{
                background: `${s.color}18`, color: s.color,
                border: `1px solid ${s.color}33`, borderRadius: 6,
                padding: "2px 8px", fontSize: 10, fontWeight: 700,
              }}>
                {s.sub}
              </span>
            </div>
            <div style={{ color: s.color, fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

        {/* ── Inscriptions chart ── */}
        <div style={{
          background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
                Évolution des inscriptions
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>12 derniers mois</div>
            </div>
            <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>▲ +91% sur un an</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={INSCRIPTIONS}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mois" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#161b22", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(v) => [v, "Élèves"] as [number, string]}
              />
              <Area type="monotone" dataKey="eleves" stroke="#eab308" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Alerts ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Alertes & Notifications
          </div>
          {ALERTS.map((a, i) => !dismissedAlerts.includes(i) && (
            <div key={i} style={{
              background: a.type === "warning" ? "rgba(234,179,8,0.07)" : a.type === "success" ? "rgba(16,185,129,0.07)" : "rgba(99,102,241,0.07)",
              border: `1px solid ${a.type === "warning" ? "rgba(234,179,8,0.2)" : a.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>{a.body}</div>
                  </div>
                </div>
                <button onClick={() => setDismissedAlerts(d => [...d, i])} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                  cursor: "pointer", fontSize: 14, padding: 0, marginLeft: 8, flexShrink: 0,
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Enseignants list ── */}
      <div style={{
        background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
            Enseignants du centre
          </div>
          <Link href="/center/teachers" style={{
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, textDecoration: "none",
          }}>
            Voir tout →
          </Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Enseignant", "Spécialité", "Classes", "Élèves", "Score moy.", "Statut"].map(h => (
                <th key={h} style={{
                  padding: "8px 14px", textAlign: "left", color: "rgba(255,255,255,0.3)",
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEACHERS.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < TEACHERS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(161,120,0,0.1))",
                      border: "1px solid rgba(234,179,8,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#eab308", fontWeight: 700, fontSize: 12,
                    }}>
                      {t.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{t.specialty}</td>
                <td style={{ padding: "14px", color: "#e2e8f0", fontSize: 13, textAlign: "center" }}>{t.classes}</td>
                <td style={{ padding: "14px", color: "#e2e8f0", fontSize: 13, textAlign: "center" }}>{t.students}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{
                    color: t.avgScore >= 8 ? "#10b981" : t.avgScore >= 7 ? "#f59e0b" : "#ef4444",
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {t.avgScore}/10
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{
                    background: t.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                    color: t.status === "active" ? "#10b981" : "#64748b",
                    border: `1px solid ${t.status === "active" ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.3)"}`,
                    borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                  }}>
                    {t.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CenterLayout>
  );
}

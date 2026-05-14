"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import CenterLayout from "@/components/CenterLayout";

interface CenterStats {
  teacherCount: number;
  studentCount: number;
  classCount: number;
}

interface CenterTeacher {
  id: string;
  name: string;
  specialty: string;
  classes: number;
  students: number;
  avgScore: number;
  status: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CenterDashboard() {
  const [centerCode, setCenterCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [stats, setStats] = useState<CenterStats | null>(null);
  const [teachers, setTeachers] = useState<CenterTeacher[]>([]);
  const [centerName, setCenterName] = useState<string>("");
  const [centerCity, setCenterCity] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.centerName) setCenterName(d.centerName);
        if (d?.centerCity) setCenterCity(d.centerCity);
      }).catch(() => {});

    fetch("/api/center?action=code")
      .then(r => r.json())
      .then(d => { if (d.code) setCenterCode(d.code); })
      .catch(() => {});

    fetch("/api/center?action=stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setStats({
            teacherCount: d.teacherCount ?? 0,
            studentCount: d.studentCount ?? 0,
            classCount: d.classroomCount ?? 0,
          });
          if (d.teachers) setTeachers(d.teachers);
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!centerCode) return;
    navigator.clipboard.writeText(centerCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const displayName = centerName || "Mon Centre";
  const displayCity = centerCity || "";
  const statCards = [
    { label: "Enseignants actifs", value: stats ? stats.teacherCount : "—", icon: "👨‍🏫", color: "#eab308", sub: loading ? "Chargement..." : "" },
    { label: "Élèves inscrits",    value: stats ? stats.studentCount : "—",  icon: "👥",   color: "#10b981", sub: loading ? "Chargement..." : "" },
    { label: "Classes actives",   value: stats ? stats.classCount : "—",    icon: "🏫",   color: "#6366f1", sub: "" },
    { label: "Revenus du mois",   value: "—",                                icon: "💰",   color: "#f59e0b", sub: "Monétisation à venir" },
  ];

  return (
    <CenterLayout title="Vue d'ensemble" centerName={displayName} centerCity={displayCity}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24 }}>
              {displayName}
            </h2>
            <span style={{
              background: "rgba(16,185,129,0.15)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20,
              padding: "3px 12px", fontSize: 11, fontWeight: 700,
            }}>✓ Vérifié</span>
          </div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
            {displayCity ? `📍 ${displayCity} · ` : ""}Tableau de bord · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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
            Partagez ce code à vos élèves — ils le saisissent lors de leur inscription sur Yema.
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
        {statCards.map((s, i) => (
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
          borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260,
        }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            Évolution des inscriptions
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", margin: 0 }}>
            Les statistiques d&apos;inscription apparaîtront ici au fur et à mesure.
          </p>
        </div>

        {/* ── Alerts ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Alertes & Notifications
          </div>
          <div style={{ padding: "20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>Aucune alerte pour le moment</p>
          </div>
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
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  Aucun enseignant associé au centre pour l&apos;instant.
                </td>
              </tr>
            )}
            {teachers.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: i < teachers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
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

"use client";

import Link from "next/link";
import Layout from "@/components/Layout";

const TOOLS = [
  {
    href: "/admin/courses/generate",
    icon: "✨",
    title: "Générer des cours avec Gemini",
    desc: "Créez du contenu pédagogique A1→C1 via Gemini 1.5 Pro, sauvegardez et publiez en un clic.",
    color: "#10b981",
    badge: "IA",
  },
  {
    href: "/teacher/students",
    icon: "👥",
    title: "Gérer les utilisateurs",
    desc: "Voir tous les apprenants, leurs niveaux, scores et activité.",
    color: "#6366f1",
    badge: null,
  },
  {
    href: "/center",
    icon: "🏫",
    title: "Centres de formation",
    desc: "Superviser les centres partenaires, leurs enseignants et leurs classes.",
    color: "#eab308",
    badge: null,
  },
  {
    href: "/center/stats",
    icon: "📊",
    title: "Statistiques globales",
    desc: "Métriques globales — inscriptions, rétention, progression moyenne.",
    color: "#f97316",
    badge: null,
  },
];

export default function AdminDashboard() {
  return (
    <Layout title="Administration">
      <div style={{ maxWidth: 700 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.7rem" }}>
            🛡️ Espace Administrateur
          </div>
          <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem" }}>
            Panneau d&apos;administration
          </h2>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
            Gérez les cours, les utilisateurs et les centres DeutschCM.
          </p>
        </div>

        {/* Tool cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TOOLS.map(tool => (
            <Link key={tool.href} href={tool.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 18,
                  padding: "20px 24px", borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.15s, background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${tool.color}40`;
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                  background: `${tool.color}12`,
                  border: `1px solid ${tool.color}30`,
                }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                      {tool.title}
                    </span>
                    {tool.badge && (
                      <span style={{ padding: "1px 8px", borderRadius: 5, background: `${tool.color}18`, color: tool.color, border: `1px solid ${tool.color}33`, fontSize: "0.6rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", lineHeight: 1.5 }}>
                    {tool.desc}
                  </div>
                </div>
                <span style={{ color: `${tool.color}80`, fontSize: "1.2rem", flexShrink: 0 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

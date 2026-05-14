"use client";

import { Link } from "@/navigation";
import { usePathname } from "@/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const CENTER_NAV = [
  { icon: "🏛️", label: "Vue d'ensemble",  href: "/center"                   },
  { icon: "👨‍🏫", label: "Enseignants",     href: "/center/teachers"          },
  { icon: "🏫", label: "Classes",           href: "/center/classes"           },
  { icon: "👥", label: "Élèves",            href: "/center/students"          },
  { icon: "✨", label: "Générer cours",     href: "/admin/courses/generate"   },
  { icon: "💳", label: "Facturation",       href: "/center/billing"           },
  { icon: "📊", label: "Statistiques",      href: "/center/stats"             },
  { icon: "⚙️", label: "Paramètres",       href: "/center/settings"          },
];

interface CenterLayoutProps {
  children: React.ReactNode;
  title: string;
  centerName?: string;
  centerCity?: string;
}

export default function CenterLayout({ children, title, centerName = "Institut Goethe Yaoundé", centerCity = "Yaoundé" }: CenterLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Directeur");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const name = data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Directeur";
      setUserName(name);
      // Backfill role for accounts created before the role selector was added
      if (!data.user.user_metadata?.role || data.user.user_metadata.role === "STUDENT") {
        await fetch("/api/fix-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "CENTER_MANAGER" }),
        });
      }
    });
  }, []);

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .cnav-link:hover { background: rgba(234,179,8,0.08) !important; color: rgba(234,179,8,0.8) !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono', monospace" }}>

        {/* ════ SIDEBAR ════ */}
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 40,
          display: "flex", flexDirection: "column",
          background: "rgba(8,12,16,0.97)",
          borderRight: "1px solid rgba(234,179,8,0.12)",
        }}>
          {/* Gold ambient glow */}
          <div style={{
            position: "absolute", top: -40, left: -40, width: 200, height: 200,
            borderRadius: "50%", opacity: 0.05,
            background: "radial-gradient(circle, #eab308, transparent)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />

          {/* ── Logo + centre name ── */}
          <div style={{ padding: "24px 20px 16px" }}>
            <Link href="/center" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem",
                background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(161,120,0,0.08))",
                border: "1px solid rgba(234,179,8,0.3)",
                boxShadow: "0 0 20px rgba(234,179,8,0.1)",
              }}>🇩🇪</div>
              <div>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
                  Deutsch<span style={{ color: "#eab308" }}>CM</span>
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.58rem", letterSpacing: "0.08em" }}>
                  Portail Centre
                </p>
              </div>
            </Link>

            {/* Centre card */}
            <div style={{
              background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>
                {centerName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>📍 {centerCity}</div>
              {/* Gold badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
                background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(161,120,0,0.1))",
                border: "1px solid rgba(234,179,8,0.35)", borderRadius: 20,
                padding: "3px 10px", fontSize: 10, color: "#eab308", fontWeight: 700,
              }}>
                ⭐ Centre Partenaire
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(234,179,8,0.1)", margin: "0 16px 8px" }} />

          {/* ── Nav ── */}
          <nav style={{ flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
            {CENTER_NAV.map(item => {
              const active = item.href === "/center"
                ? pathname === "/center"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="cnav-link"
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 13px", borderRadius: 11, textDecoration: "none",
                    background: active ? "rgba(234,179,8,0.1)" : "transparent",
                    border: active ? "1px solid rgba(234,179,8,0.25)" : "1px solid transparent",
                    color: active ? "#eab308" : "rgba(255,255,255,0.4)",
                    fontFamily: active ? "'Syne', sans-serif" : "'DM Mono', monospace",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.82rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ width: 22, textAlign: "center", flexShrink: 0, fontSize: "1rem" }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", flexShrink: 0 }} />}
                </Link>
              );
            })}
          </nav>

          <div style={{ height: 1, background: "rgba(234,179,8,0.08)", margin: "8px 16px 0" }} />

          {/* ── User ── */}
          <div style={{ padding: "12px 14px 20px" }}>
            <Link href="/dashboard" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, textDecoration: "none",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#080c10",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>Directeur · CENTER_MANAGER</p>
              </div>
            </Link>
          </div>
        </aside>

        {/* ════ MAIN ════ */}
        <div style={{ marginLeft: 260, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <header style={{
            position: "sticky", top: 0, zIndex: 30, height: 64,
            display: "flex", alignItems: "center", gap: 20, padding: "0 32px",
            background: "rgba(8,12,16,0.94)", backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(234,179,8,0.1)",
          }}>
            <h1 style={{
              margin: 0, color: "white", fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: "1.05rem",
            }}>
              {title}
            </h1>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/dashboard" style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px",
                fontSize: 12, textDecoration: "none",
              }}>
                ← Portail élève
              </Link>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem",
                color: "#080c10", background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "1px solid rgba(234,179,8,0.4)",
              }}>
                {initials}
              </div>
            </div>
          </header>

          <main style={{ flex: 1, padding: "32px", overflowX: "hidden" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

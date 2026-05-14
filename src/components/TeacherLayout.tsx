"use client";

import { Link } from "@/navigation";
import { usePathname, useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const TEACHER_NAV = [
  { icon: "📊", label: "Vue d'ensemble", href: "/teacher"                },
  { icon: "🏫", label: "Mes Classes",    href: "/teacher/classrooms"     },
  { icon: "👥", label: "Élèves",         href: "/teacher/students"       },
  { icon: "📋", label: "Devoirs",        href: "/teacher/assignments"    },
  { icon: "✨", label: "Générer cours",  href: "/admin/courses/generate" },
  { icon: "📈", label: "Statistiques",   href: "/teacher/stats"          },
  { icon: "⚙️", label: "Paramètres",    href: "/teacher/settings"       },
];

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function TeacherLayout({ children, title }: TeacherLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("Prof. Tchamba");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      if (data.user.user_metadata?.full_name) setTeacherName(data.user.user_metadata.full_name);
      if (!data.user.user_metadata?.role || data.user.user_metadata.role === "STUDENT") {
        await fetch("/api/fix-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "TEACHER" }),
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = teacherName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono', monospace" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 40,
          display: "flex", flexDirection: "column",
          background: "rgba(8,12,16,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
        }}>
          <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", opacity: 0.07, background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{ padding: "24px 20px 16px" }}>
            <Link href="/teacher" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem", background: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.08))", border: "1px solid rgba(16,185,129,0.28)", boxShadow: "0 0 20px rgba(16,185,129,0.12)" }}>🇩🇪</div>
              <div>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>Deutsch<span style={{ color: "#10b981" }}>CM</span></p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>Goethe · A1 → C1</p>
              </div>
            </Link>
          </div>

          {/* Teacher badge */}
          <div style={{ margin: "0 14px 12px", padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.9rem" }}>👨‍🏫</span>
            <div>
              <p style={{ margin: 0, color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.7rem" }}>Espace Enseignant</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.58rem" }}>Accès Professeur · Vérifié</p>
            </div>
            <span style={{ marginLeft: "auto", padding: "2px 6px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.58rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>✓</span>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 8px" }} />

          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
            {TEACHER_NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/teacher" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "10px 13px", borderRadius: 11, textDecoration: "none",
                  background: active ? "rgba(16,185,129,0.1)" : "transparent",
                  border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
                  color: active ? "#10b981" : "rgba(255,255,255,0.45)",
                  fontFamily: active ? "'Syne', sans-serif" : "'DM Mono', monospace",
                  fontWeight: active ? 600 : 400,
                  fontSize: "0.82rem",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ width: 22, textAlign: "center", flexShrink: 0, fontSize: "1rem" }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />}
                </Link>
              );
            })}
          </nav>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 16px 0" }} />

          {/* User + logout */}
          <div style={{ padding: "12px 14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "white", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.28)" }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teacherName}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.6rem" }}>Enseignant · Institut Lingua Plus</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width: "100%", padding: "7px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.15)", background: "transparent", color: "rgba(239,68,68,0.5)", fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", cursor: "pointer" }}>
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ marginLeft: 260, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {title && (
            <header style={{
              position: "sticky", top: 0, zIndex: 30, height: 64,
              display: "flex", alignItems: "center", padding: "0 32px",
              background: "rgba(8,12,16,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
            }}>
              <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>{title}</h1>
            </header>
          )}
          <main style={{ flex: 1, padding: "28px 32px 48px", overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

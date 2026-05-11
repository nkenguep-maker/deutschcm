"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { icon: "🏠", label: "Dashboard",      href: "/dashboard"  },
  { icon: "📚", label: "Cours",           href: "/courses"    },
  { icon: "🏫", label: "Mes Classes",     href: "/classroom"  },
  { icon: "🔍", label: "Découvrir",       href: "/discover"   },
  { icon: "🎙️", label: "Simulateur IA",  href: "/simulateur" },
  { icon: "📊", label: "Progression",     href: "/progress"   },
  { icon: "⚙️", label: "Paramètres",     href: "/settings"   },
];

const TEACHER_NAV = [
  { icon: "🏠", label: "Vue d'ensemble",  href: "/teacher"                  },
  { icon: "🏫", label: "Mes Classes",     href: "/teacher/classrooms"       },
  { icon: "👥", label: "Élèves",          href: "/teacher/students"         },
  { icon: "🔍", label: "Découvrir",       href: "/discover"                 },
  { icon: "📝", label: "Devoirs",         href: "/teacher/assignments"      },
  { icon: "✨", label: "Générer cours",   href: "/admin/courses/generate"   },
  { icon: "📊", label: "Statistiques",    href: "/teacher/stats"            },
  { icon: "⚙️", label: "Paramètres",     href: "/settings"                 },
];

const CENTER_NAV = [
  { icon: "🏠", label: "Vue d'ensemble",  href: "/center"                   },
  { icon: "👨‍🏫", label: "Enseignants",   href: "/center/teachers"          },
  { icon: "👥", label: "Élèves",          href: "/center/students"          },
  { icon: "🏫", label: "Classes",         href: "/center/classes"           },
  { icon: "✨", label: "Générer cours",   href: "/admin/courses/generate"   },
  { icon: "📊", label: "Statistiques",    href: "/center/stats"             },
  { icon: "💳", label: "Facturation",     href: "/center/billing"           },
];

const ADMIN_NAV = [
  { icon: "🏠", label: "Dashboard",         href: "/admin"                      },
  { icon: "✨", label: "Générer des cours",  href: "/admin/courses/generate"     },
  { icon: "👥", label: "Utilisateurs",       href: "/teacher/students"           },
  { icon: "🏫", label: "Centres",            href: "/center"                     },
  { icon: "📊", label: "Stats globales",     href: "/center/stats"               },
];

const NAV_BY_ROLE: Record<string, typeof STUDENT_NAV> = {
  STUDENT: STUDENT_NAV,
  TEACHER: TEACHER_NAV,
  CENTER_MANAGER: CENTER_NAV,
  ADMIN: ADMIN_NAV,
};

const ACCENT_BY_ROLE: Record<string, string> = {
  STUDENT: "#10b981",
  TEACHER: "#6366f1",
  CENTER_MANAGER: "#eab308",
  ADMIN: "#ef4444",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Layout({ children, title, searchQuery = "", onSearchChange }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Utilisateur");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("STUDENT");
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [studentType, setStudentType] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? "");
        const name =
          data.user.user_metadata?.full_name ??
          data.user.email?.split("@")[0] ??
          "Utilisateur";
        setUserName(name);
      }
    });
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      // No data or network error — don't redirect, just leave user where they are
      if (!d || typeof d.onboardingDone === "undefined") return;
      if (d.role) setUserRole(d.role);
      if (d.fullName) setUserName(d.fullName);
      if (d.germanLevel) setUserLevel(d.germanLevel);
      if (d.studentType) setStudentType(d.studentType);
      if (d.isValidated !== undefined) setIsValidated(d.isValidated);
      // Onboarding redirect — skip on onboarding/test pages and on admin/teacher/center routes
      const skipOnboarding =
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/test-niveau") ||
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/center") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/discover") ||
        pathname.startsWith("/notifications");
      if (!skipOnboarding) {
        // Already has a level → fully set up, never redirect back
        if (d.germanLevel) return;
        if (d.onboardingDone === false) {
          const dest = d.role === "TEACHER" ? "/onboarding/teacher"
            : d.role === "CENTER_MANAGER" ? "/onboarding/center"
            : "/onboarding/student";
          router.replace(dest);
          return;
        }
        if (d.role === "STUDENT") {
          router.replace("/test-niveau");
        }
      }
    }).catch(() => {});
  }, [pathname, router]);

  const initials = userName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const activeNav = NAV_BY_ROLE[userRole] ?? STUDENT_NAV;
  const accentColor = ACCENT_BY_ROLE[userRole] ?? "#10b981";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        .card-delay-1 { animation-delay: 0.05s; opacity: 0; }
        .card-delay-2 { animation-delay: 0.10s; opacity: 0; }
        .card-delay-3 { animation-delay: 0.15s; opacity: 0; }
        .card-delay-4 { animation-delay: 0.20s; opacity: 0; }
        .card-delay-5 { animation-delay: 0.25s; opacity: 0; }
        .nav-link:hover { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.8) !important; }
        .sidebar-drawer { animation: slideIn 0.25s ease forwards; }
      `}</style>

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 39,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
          }}
        />
      )}

      <div style={{ display: "flex", minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono', monospace" }}>

        {/* ════════════════ SIDEBAR ════════════════ */}
        <aside
          className={isMobile ? "sidebar-drawer" : ""}
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 40,
            display: isMobile && !sidebarOpen ? "none" : "flex",
            flexDirection: "column",
            background: "rgba(8,12,16,0.98)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: -40, left: -40, width: 200, height: 200,
            borderRadius: "50%", opacity: 0.06,
            background: `radial-gradient(circle, ${accentColor}, transparent)`,
            filter: "blur(40px)", pointerEvents: "none",
          }} />

          {/* ── Logo ── */}
          <div style={{ padding: "26px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem",
                background: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.08))",
                border: "1px solid rgba(16,185,129,0.28)",
                boxShadow: "0 0 20px rgba(16,185,129,0.12)",
              }}>🇩🇪</div>
              <div>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
                  Deutsch<span style={{ color: "#10b981" }}>CM</span>
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                  Goethe · A1 → C1
                </p>
              </div>
            </Link>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.2rem", cursor: "pointer", padding: 4, lineHeight: 1 }}
              >✕</button>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 8px" }} />

          {/* ── Nav items ── */}
          <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
            {/* Role badge */}
            {userRole !== "STUDENT" && (
              <div style={{ margin: "0 4px 8px", padding: "6px 12px", borderRadius: 8, background: `${accentColor}10`, border: `1px solid ${accentColor}25`, textAlign: "center" }}>
                <span style={{ color: accentColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
                  {userRole === "TEACHER" ? "👨‍🏫 ENSEIGNANT" : userRole === "CENTER_MANAGER" ? "⭐ CENTRE" : "🛡️ ADMIN"}
                </span>
              </div>
            )}
            {activeNav.map(item => {
              const exact = item.href === "/teacher" || item.href === "/center";
              const active = exact ? pathname === item.href : (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                  onClick={() => isMobile && setSidebarOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 13px", borderRadius: 11, textDecoration: "none",
                    background: active ? `${accentColor}15` : "transparent",
                    border: active ? `1px solid ${accentColor}30` : "1px solid transparent",
                    color: active ? accentColor : "rgba(255,255,255,0.45)",
                    fontFamily: active ? "'Syne', sans-serif" : "'DM Mono', monospace",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.82rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ width: 22, textAlign: "center", flexShrink: 0, fontSize: "1rem" }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />}
                </Link>
              );
            })}
          </nav>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 16px 0" }} />

          {/* ── User ── */}
          <div style={{ padding: "12px 14px 20px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem",
                color: "white",
                background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))",
                border: "1px solid rgba(16,185,129,0.28)",
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.62rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userLevel ? `Niveau ${userLevel}` : userEmail || ""}
                </p>
              </div>
            </div>
            {/* Student type badge */}
            {userRole === "STUDENT" && studentType && (() => {
              if (studentType === "classroom" && isValidated)
                return <div style={{ marginTop: 8, textAlign: "center", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "4px 0", color: "#10b981", fontSize: "0.6rem", fontWeight: 700 }}>✅ Élève inscrit</div>;
              if (studentType === "classroom" && !isValidated)
                return <div style={{ marginTop: 8, textAlign: "center", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "4px 0", color: "#f59e0b", fontSize: "0.6rem", fontWeight: 700 }}>⏳ Validation en cours</div>;
              if (studentType === "group_creator")
                return <div style={{ marginTop: 8, textAlign: "center", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "4px 0", color: "#a5b4fc", fontSize: "0.6rem", fontWeight: 700 }}>👥 Chef de groupe</div>;
              return <div style={{ marginTop: 8, textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 0", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", fontWeight: 700 }}>Solo</div>;
            })()}
          </div>
        </aside>

        {/* ════════════════ RIGHT SIDE ════════════════ */}
        <div style={{ marginLeft: isMobile ? 0 : 260, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* ── Header ── */}
          <header style={{
            position: "sticky", top: 0, zIndex: 30, height: 56,
            display: "flex", alignItems: "center", gap: isMobile ? 10 : 20,
            padding: isMobile ? "0 14px" : "0 28px",
            background: "rgba(8,12,16,0.92)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}>
            {/* Hamburger (mobile only) */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  flexShrink: 0, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  color: "white", fontSize: "1rem", cursor: "pointer",
                  width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >☰</button>
            )}

            {/* Page title */}
            <h1 style={{
              margin: 0, color: "white", fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: isMobile ? "0.9rem" : "1.05rem",
              flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: isMobile ? 140 : "none",
            }}>
              {title}
            </h1>

            {/* Search — hidden on mobile when no handler provided */}
            {(!isMobile || onSearchChange) && (
              <div style={{
                flex: 1, maxWidth: isMobile ? "none" : 500,
                display: "flex", alignItems: "center", gap: 8,
                padding: isMobile ? "6px 10px" : "8px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem", flexShrink: 0 }}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => onSearchChange?.(e.target.value)}
                  placeholder={isMobile ? "Rechercher…" : "Rechercher un cours, un scénario..."}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "white", fontSize: "0.8rem", fontFamily: "'DM Mono', monospace",
                    minWidth: 0,
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", flexShrink: 0 }}
                  >✕</button>
                )}
              </div>
            )}

            {/* Right actions */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <NotificationBell accentColor={accentColor} />

              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem",
                color: "white", cursor: "pointer",
                background: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.1))",
                border: "1px solid rgba(16,185,129,0.3)",
              }}>
                {initials}
              </div>
            </div>
          </header>

          {/* ── Main content ── */}
          <main style={{ flex: 1, padding: isMobile ? "16px 14px 32px" : "32px 28px 48px" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

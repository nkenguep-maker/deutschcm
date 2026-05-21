"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import { usePathname, useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/hooks/useT";
import BrandLogo from "@/components/BrandLogo";

interface RealStudent {
  id: string; name: string; email: string; level: string | null;
  xp: number; avgScore: number; lastActive: string; progress: number;
  streak: number; classId: string; className: string;
}

interface RealClassroom {
  id: string; name: string; level: string; code: string;
  students: number; avgProgress: number; avgScore: number; isActive: boolean;
}

// ─── Inline Sidebar ───────────────────────────────────────────────────────────

function TeacherSidebar({ teacherName, isMobile, open, onClose }: {
  teacherName: string; isMobile: boolean; open: boolean; onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { nav: tNav, teacher: tT } = useT();

  const TEACHER_NAV = [
    { icon: "🗓️", label: tNav.today,        href: "/teacher"              },
    { icon: "🏫", label: tNav.myClasses,    href: "/teacher/classrooms"   },
    { icon: "👤", label: tNav.learners,     href: "/teacher/students"     },
    { icon: "🎯", label: tNav.activities,   href: "/teacher/activities"   },
    { icon: "✏️", label: tNav.corrections,  href: "/teacher/assignments"  },
    { icon: "📈", label: tNav.tracking,     href: "/teacher/stats"        },
    { icon: "📚", label: tNav.resources,    href: "/teacher/resources"    },
    { icon: "⚙️", label: tNav.settings,    href: "/teacher/settings"     },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/teacher/goodbye");
  };

  const initials = teacherName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "YE";

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 40,
      display: "flex", flexDirection: "column",
      background: "rgba(8,12,16,0.98)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(24px)",
      transform: isMobile ? (open ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
      transition: "transform 0.25s ease",
    }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", opacity: 0.07, background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(40px)", pointerEvents: "none" }} />

      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/teacher" style={{ textDecoration: "none" }}>
          <BrandLogo variant="sidebar" subtitle="CEFR · A1 → C1" />
        </Link>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.2rem", cursor: "pointer", padding: 4 }}>✕</button>
        )}
      </div>

      <div style={{ margin: "0 14px 12px", padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.9rem" }}>👨‍🏫</span>
        <div>
          <p style={{ margin: 0, color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.7rem" }}>{tT.space}</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.72rem" }}>{tT.access}</p>
        </div>
        <span style={{ marginLeft: "auto", padding: "2px 6px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.72rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>✓</span>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px 8px" }} />

      <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {TEACHER_NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/teacher" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 11,
              padding: "10px 13px", borderRadius: 11, textDecoration: "none",
              background: active ? "rgba(16,185,129,0.1)" : "transparent",
              border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
              color: active ? "#10b981" : "rgba(255,255,255,0.65)",
              fontFamily: active ? "'Syne', sans-serif" : "'DM Mono', monospace",
              fontWeight: active ? 600 : 400, fontSize: "0.82rem", transition: "all 0.15s ease",
            }}>
              <span style={{ width: 22, textAlign: "center", flexShrink: 0, fontSize: "1rem" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 16px 0" }} />

      <div style={{ padding: "12px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "white", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.28)" }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teacherName}</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.72rem" }}>{tT.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>{tNav.logout}</span>
          <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", fontFamily: "'DM Mono', monospace" }}>{tNav.logoutHint}</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Attention card ───────────────────────────────────────────────────────────

function AttentionCard({ icon, title, desc, count, cta, href, color, isMobile }: {
  icon: string; title: string; desc: string; count: number; cta: string; href: string; color: string; isMobile: boolean;
}) {
  const isEmpty = count === 0;
  return (
    <div style={{ padding: isMobile ? "14px" : "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${isEmpty ? "rgba(255,255,255,0.07)" : color + "22"}`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.1rem", opacity: isEmpty ? 0.5 : 1 }}>{icon}</span>
        {isEmpty
          ? <span style={{ color: "rgba(255,255,255,0.40)", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>—</span>
          : <span style={{ padding: "2px 10px", borderRadius: 99, background: `${color}18`, color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>{count}</span>
        }
      </div>
      <div>
        <p style={{ margin: "0 0 3px", color: isEmpty ? "rgba(255,255,255,0.55)" : "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>{title}</p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.60)", fontSize: "0.75rem", lineHeight: 1.4 }}>{desc}</p>
      </div>
      <Link href={href} style={{ fontSize: "0.75rem", color: isEmpty ? "rgba(255,255,255,0.40)" : color, textDecoration: "none", fontFamily: "'DM Mono', monospace" }}>{cta} →</Link>
    </div>
  );
}

// ─── Classroom card ───────────────────────────────────────────────────────────

function ClassroomCard({ cls, tT, tCommon }: {
  cls: RealClassroom; tT: ReturnType<typeof useT>["teacher"]; tCommon: ReturnType<typeof useT>["common"];
}) {
  const levelColors: Record<string, string> = { A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316" };
  const c = levelColors[cls.level] ?? "#10b981";
  return (
    <Link href={`/teacher/classroom/${cls.id}`} style={{ textDecoration: "none" }}>
      <div style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", opacity: cls.isActive ? 1 : 0.55 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</p>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>{cls.code}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, background: `${c}18`, color: c, border: `1px solid ${c}33`, fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{cls.level}</span>
            <span style={{ padding: "2px 8px", borderRadius: 6, background: cls.isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: cls.isActive ? "#10b981" : "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>{cls.isActive ? tCommon.active : tCommon.inactive}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[{ v: cls.students, l: tT.classStudents }, { v: `${cls.avgProgress ?? 0}%`, l: tT.classProgress }, { v: `${cls.avgScore ?? 0}/10`, l: tT.classAvgScore }].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.60)", fontSize: "0.75rem" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div style={{ height: 5, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", borderRadius: 99, width: `${cls.avgProgress ?? 0}%`, background: `linear-gradient(90deg, ${c}88, ${c})` }} />
        </div>
      </div>
    </Link>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { nav: tNav, teacher: tT, common: tCommon } = useT();
  const [teacherName, setTeacherName] = useState("");
  const [teacherCode, setTeacherCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [classrooms, setClassrooms] = useState<RealClassroom[]>([]);
  const [students, setStudents] = useState<RealStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.role && d.role !== "TEACHER" && d.role !== "ADMIN") window.location.replace("/dashboard");
    }).catch(() => {});

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      if (data.user.user_metadata?.full_name) setTeacherName(data.user.user_metadata.full_name);
      if (!data.user.user_metadata?.role) {
        await fetch("/api/fix-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "TEACHER" }) });
      }
    });

    Promise.all([
      fetch("/api/teacher?action=code").then(r => r.ok ? r.json() : null),
      fetch("/api/teacher?action=dashboard").then(r => r.ok ? r.json() : null),
    ]).then(([codeData, dashData]) => {
      if (codeData?.code) setTeacherCode(codeData.code);
      if (dashData?.success) {
        if (dashData.teacher?.name) setTeacherName(dashData.teacher.name);
        setClassrooms((dashData.classes ?? []).map((c: RealClassroom) => ({ ...c, avgProgress: 0 })));
        setStudents(dashData.students ?? []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); });
  };

  const firstName = teacherName.split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  // Attention counts from real data
  const pendingCorrections = 0; // real API, currently 0
  const toEncourage = students.filter(s => s.streak === 0).length;
  const toCelebrate = students.filter(s => s.avgScore >= 8).length;
  const totalStudents = classrooms.reduce((s, c) => s + c.students, 0);
  const difficultStudents = students.filter((s) => s.avgScore < 5);
  const globalAvg = classrooms.length > 0
    ? (classrooms.reduce((s, c) => s + (c.avgScore ?? 0), 0) / classrooms.length).toFixed(1)
    : "—";

  const pad = isMobile ? "20px 16px 48px" : "28px 32px 48px";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono', monospace" }}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 39 }} />
        )}

        <TeacherSidebar teacherName={teacherName} isMobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div style={{ marginLeft: isMobile ? 0 : 260, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <header style={{
            position: "sticky", top: 0, zIndex: 30, height: 56,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "0 16px" : "0 32px", gap: 10,
            background: "rgba(8,12,16,0.94)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.3rem", cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}>☰</button>
              )}
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: isMobile ? "0.92rem" : "1.05rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tNav.today}</h1>
                {!isMobile && <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", textTransform: "capitalize" }}>{today}</p>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {!isMobile && (
                <span style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {tT.aiPill}
                </span>
              )}
              <Link href="/teacher/classroom/new" style={{ padding: isMobile ? "7px 12px" : "7px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.75rem", textDecoration: "none" }}>
                {isMobile ? "+" : tT.newClass}
              </Link>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: pad, overflowY: "auto", overflowX: "hidden" }}>

            {/* Welcome */}
            {firstName && (
              <div className="fade-up" style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 4px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? "1.25rem" : "1.4rem" }}>
                  {tT.greeting.replace("{name}", firstName)}
                </p>
                <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>{tT.todaySubtitle}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 12, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <span style={{ color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem" }}>{tT.expertiseCenter}</span>
                  {!isMobile && <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)" }} />}
                  {!isMobile && <span style={{ color: "rgba(255,255,255,0.60)", fontSize: "0.78rem", maxWidth: 360 }}>{tT.expertiseSupportCopy}</span>}
                </div>
              </div>
            )}

            {/* Priority card */}
            <div className="fade-up" style={{ marginBottom: 22, padding: "18px 20px", borderRadius: 16, background: pendingCorrections > 0 ? "rgba(99,102,241,0.07)" : "rgba(16,185,129,0.05)", border: `1px solid ${pendingCorrections > 0 ? "rgba(99,102,241,0.25)" : "rgba(16,185,129,0.18)"}` }}>
              <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{tT.todayPriorityTitle}</p>
              <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.82)", fontSize: "0.875rem", lineHeight: 1.55 }}>
                {pendingCorrections > 0 ? tT.todayPriorityPendingText : tT.todayPriorityCalmText}
              </p>
              <Link href={pendingCorrections > 0 ? "/teacher/assignments" : "/teacher/activities"} style={{
                display: "inline-block", padding: "8px 18px", borderRadius: 9,
                background: pendingCorrections > 0 ? "rgba(99,102,241,0.15)" : "rgba(16,185,129,0.12)",
                border: `1px solid ${pendingCorrections > 0 ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.25)"}`,
                color: pendingCorrections > 0 ? "#818cf8" : "#10b981",
                fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600, textDecoration: "none",
              }}>
                {pendingCorrections > 0 ? tT.todayPriorityPendingCTA : tT.todayPriorityCalmCTA} →
              </Link>
            </div>

            {/* Attention section header */}
            <div className="fade-up" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {tT.todayAttnSection}
              </h2>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* 4 Attention cards */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 26 }}>
              <AttentionCard icon="✏️" title={tT.todayAttnTitle1} desc={tT.todayAttnDesc1} count={pendingCorrections} cta={tT.todayAttnCTA1} href="/teacher/assignments" color="#6366f1" isMobile={isMobile} />
              <AttentionCard icon="💬" title={tT.todayAttnTitle2} desc={tT.todayAttnDesc2} count={toEncourage} cta={tT.todayAttnCTA2} href="/teacher/students" color="#f59e0b" isMobile={isMobile} />
              <AttentionCard icon="⭐" title={tT.todayAttnTitle3} desc={tT.todayAttnDesc3} count={toCelebrate} cta={tT.todayAttnCTA3} href="/teacher/stats" color="#10b981" isMobile={isMobile} />
              <AttentionCard icon="🎯" title={tT.todayAttnTitle4} desc={tT.todayAttnDesc4} count={0} cta={tT.todayAttnCTA4} href="/teacher/activities" color="#e879f9" isMobile={isMobile} />
            </div>

            {/* Access codes */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem" }}>👨‍🏫</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{tT.myTeacherCode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "10px 14px", color: "#818cf8", fontSize: "1rem", fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700 }}>
                    {teacherCode ?? tT.loading}
                  </code>
                  <button onClick={() => teacherCode && copyCode(teacherCode)} style={{ padding: "10px 14px", borderRadius: 10, background: codeCopied ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: codeCopied ? "#818cf8" : "rgba(255,255,255,0.72)", fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {codeCopied ? tT.copied : tT.copy}
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>{tT.shareCodeStudents}</p>
              </div>

              <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem" }}>🏫</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{tT.myClassCodes}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {classrooms.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.60)", fontSize: "0.78rem", margin: 0 }}>{tT.shareClassCode}</p>
                  ) : classrooms.map(cls => (
                    <div key={cls.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</span>
                      <code style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "3px 8px", color: "#10b981", fontSize: "0.75rem", fontFamily: "monospace", flexShrink: 0 }}>{cls.code}</code>
                      <button onClick={() => navigator.clipboard.writeText(cls.code)} style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(255,255,255,0.60)", fontSize: "0.75rem", cursor: "pointer" }}>⎘</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Classes + stats summary */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{tT.sectionClasses}</h2>
                  <Link href="/teacher/classrooms" style={{ color: "#10b981", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", textDecoration: "none" }}>{tT.viewAll}</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>{tT.loading}</p>
                  ) : classrooms.length === 0 ? (
                    <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                      <p style={{ color: "rgba(255,255,255,0.60)", fontSize: "0.875rem", margin: "0 0 12px" }}>{tT.classesEmpty}</p>
                      <Link href="/teacher/classroom/new" style={{ color: "#10b981", fontSize: "0.78rem", textDecoration: "none" }}>{tT.createFirstClass}</Link>
                    </div>
                  ) : classrooms.map((cls) => <ClassroomCard key={cls.id} cls={cls} tT={tT} tCommon={tCommon} />)}
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ margin: "0 0 2px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{tT.sectionActivity}</h2>
                {[
                  { label: tT.statStudentsLabel, value: `${totalStudents}`, color: "#10b981" },
                  { label: tT.statAvgLabel,       value: globalAvg,          color: "#3b82f6" },
                  { label: tT.statAssignmentsLabel, value: `${pendingCorrections}`, color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.78rem" }}>{s.label}</span>
                    <span style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{s.value}</span>
                  </div>
                ))}

                {/* Struggling students */}
                {difficultStudents.length > 0 && (
                  <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.78rem" }}>{tT.struggling}</span>
                    <span style={{ color: "#f87171", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{difficultStudents.length}</span>
                  </div>
                )}

                <div style={{ padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", margin: 0 }}>{tT.activityEmpty}</p>
                </div>
              </div>
            </div>

            {/* Empty corrections note */}
            <div style={{ padding: "20px 24px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <p style={{ color: "rgba(255,255,255,0.60)", fontSize: "0.82rem", margin: 0 }}>{tT.assignmentsEmpty}</p>
              <Link href="/teacher/assignments" style={{ color: "#10b981", fontSize: "0.72rem", textDecoration: "none", fontFamily: "'Syne', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>{tT.viewAll}</Link>
            </div>

            {/* Impact block */}
            <div style={{ padding: "20px 22px", borderRadius: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{tT.impactTitle}</h2>
                <span style={{ color: "rgba(255,255,255,0.60)", fontSize: "0.78rem" }}>{tT.impactSubtitle}</span>
              </div>
              {totalStudents === 0 ? (
                <p style={{ margin: 0, color: "rgba(255,255,255,0.60)", fontSize: "0.82rem" }}>{tT.impactEmpty}</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 100%), 1fr))", gap: 10, marginTop: 14 }}>
                  {[
                    { label: tT.impactLearnersGuided, value: totalStudents, color: "#10b981" },
                    { label: tT.impactProgressObserved, value: toCelebrate,   color: "#6366f1" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ margin: "0 0 2px", color: m.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.4rem" }}>{m.value}</p>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.60)", fontSize: "0.75rem" }}>{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>{tT.microcopy2}</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

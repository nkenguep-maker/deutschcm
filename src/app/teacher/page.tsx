"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockStudent {
  id: string;
  name: string;
  email: string;
  level: string;
  xp: number;
  avgScore: number;
  lastActive: string;
  progress: number;
  streak: number;
}

interface MockClassroom {
  id: string;
  name: string;
  level: string;
  code: string;
  students: number;
  avgProgress: number;
  avgScore: number;
  isActive: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLASSROOMS: MockClassroom[] = [
  { id: "cls1", name: "Groupe A1 Matin", level: "A1", code: "LINGUA-A1-MT2026", students: 18, avgProgress: 45, avgScore: 7.5, isActive: true },
  { id: "cls2", name: "Groupe A2 Soir", level: "A2", code: "LINGUA-A2-SR2026", students: 15, avgProgress: 32, avgScore: 7.8, isActive: true },
  { id: "cls3", name: "Prépa Goethe B1", level: "B1", code: "LINGUA-B1-GP2026", students: 14, avgProgress: 71, avgScore: 8.1, isActive: true },
];

const MOCK_STUDENTS: MockStudent[] = [
  { id: "s1", name: "Jean-Paul Mvondo", email: "jpmvondo@gmail.com", level: "A1", xp: 340, avgScore: 3.2, lastActive: "il y a 5j", progress: 32, streak: 0 },
  { id: "s2", name: "Aminata Diallo",   email: "aminata.d@yahoo.fr", level: "A2", xp: 520, avgScore: 4.1, lastActive: "il y a 3j", progress: 41, streak: 1 },
  { id: "s3", name: "Boris Kamga",      email: "boris.kamga@gmail.com", level: "A1", xp: 210, avgScore: 2.8, lastActive: "il y a 8j", progress: 28, streak: 0 },
];

const MOCK_ACTIVITY = [
  { name: "Sem 1", A1: 6.2, A2: 5.8, B1: 7.1 },
  { name: "Sem 2", A1: 6.8, A2: 6.3, B1: 7.4 },
  { name: "Sem 3", A1: 7.1, A2: 6.9, B1: 7.8 },
  { name: "Sem 4", A1: 7.4, A2: 7.2, B1: 8.1 },
];

const MOCK_RECENT = [
  { type: "quiz",    student: "Fatima Oumarou", detail: "Score 9/10 au quiz 'Lektion 4 — Wortschatz'", icon: "✏️", time: "14:31" },
  { type: "join",    student: "Paul Biya",       detail: "A rejoint le Groupe A2 Soir via code classe", icon: "🟢", time: "13:55" },
  { type: "devoir",  student: "Alice Fotso",     detail: "A rendu le devoir 'Lesen Arbeit — Textverstehen'", icon: "📝", time: "12:10" },
  { type: "pending", student: "3 devoirs",        detail: "Quiz Lektion 4 — en attente de correction", icon: "⏳", time: "11:00" },
];

const MOCK_ASSIGNMENTS = [
  { id: "a1", title: "Quiz Lektion 4", group: "Groupe A1 Matin", due: "12 mai", status: "12 rendus / 18", statusColor: "#f59e0b", icon: "✏️" },
  { id: "a2", title: "Lesen Arbeit",   group: "Groupe A2 Soir",  due: "15 mai", status: "7 rendus / 15",  statusColor: "#6366f1", icon: "📄" },
  { id: "a3", title: "Simulation Ambassade", group: "Prépa Goethe B1", due: "Sans limite", status: "14 rendus / 14", statusColor: "#10b981", icon: "🎙️" },
];

// ─── Teacher Sidebar ──────────────────────────────────────────────────────────

const TEACHER_NAV = [
  { icon: "📊", label: "Vue d'ensemble", href: "/teacher" },
  { icon: "🏫", label: "Mes Classes", href: "/teacher/classrooms" },
  { icon: "👥", label: "Élèves", href: "/teacher/students" },
  { icon: "📋", label: "Devoirs", href: "/teacher/assignments" },
  { icon: "📈", label: "Statistiques", href: "/teacher/stats" },
  { icon: "⚙️", label: "Paramètres", href: "/teacher/settings" },
];

function TeacherSidebar({ teacherName }: { teacherName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = teacherName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
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

      {/* Teacher info + logout */}
      <div style={{ padding: "12px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "white", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.28)" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Prof. {teacherName}</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.6rem" }}>Enseignant · DeutschCM</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: "100%", padding: "7px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.15)", background: "transparent", color: "rgba(239,68,68,0.5)", fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", cursor: "pointer" }}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = "#10b981" }: { icon: string; label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <span style={{ padding: "3px 8px", borderRadius: 6, background: `${color}15`, color, fontSize: "0.6rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>↑</span>
      </div>
      <div>
        <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.7rem", lineHeight: 1 }}>{value}</p>
        <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace" }}>{label}</p>
      </div>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", fontFamily: "'DM Mono', monospace" }}>{sub}</p>
    </div>
  );
}

// ─── Classroom card ───────────────────────────────────────────────────────────

function ClassroomCard({ cls }: { cls: MockClassroom }) {
  const levelColors: Record<string, string> = { A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316" };
  const c = levelColors[cls.level] ?? "#10b981";

  return (
    <Link href={`/teacher/classroom/${cls.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        padding: "16px 18px", borderRadius: 16,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "border-color 0.15s, background 0.15s",
        cursor: "pointer",
        opacity: cls.isActive ? 1 : 0.55,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</p>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>{cls.code}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, background: `${c}18`, color: c, border: `1px solid ${c}33`, fontSize: "0.62rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{cls.level}</span>
            <span style={{ padding: "2px 8px", borderRadius: 6, background: cls.isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: cls.isActive ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>{cls.isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[{ v: cls.students, l: "élèves" }, { v: `${cls.avgProgress}%`, l: "progression" }, { v: `${cls.avgScore}/10`, l: "score moyen" }].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.58rem" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div style={{ height: 5, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", borderRadius: 99, width: `${cls.avgProgress}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, transition: "width 0.6s ease" }} />
        </div>
      </div>
    </Link>
  );
}

// ─── Difficulty student ────────────────────────────────────────────────────────

function DifficultyRow({ s }: { s: MockStudent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#f87171", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
        {s.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
        <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>Score moyen : {s.avgScore}/10 · {s.progress}% complété · {s.lastActive}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <span style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{s.avgScore}/10</span>
        <Link href={`/teacher/students/${s.id}`} style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", textDecoration: "none" }}>Voir →</Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("Marie Tchamba");
  const [teacherCode, setTeacherCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    // Guard: verify DB role before doing anything
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.role && d.role !== "TEACHER" && d.role !== "ADMIN") {
        window.location.replace("/dashboard");
      }
    }).catch(() => {});

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      if (data.user.user_metadata?.full_name) {
        setTeacherName(data.user.user_metadata.full_name);
      }
      // Only backfill when role is completely absent — never overwrite an existing role
      if (!data.user.user_metadata?.role) {
        await fetch("/api/fix-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "TEACHER" }),
        });
      }
    });
    fetch("/api/teacher?action=code")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.code) setTeacherCode(d.code); })
      .catch(() => {});
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const difficultStudents = MOCK_STUDENTS.filter((s) => s.avgScore < 5);
  const totalStudents = MOCK_CLASSROOMS.reduce((s, c) => s + c.students, 0);
  const globalAvg = (MOCK_CLASSROOMS.reduce((s, c) => s + c.avgScore, 0) / MOCK_CLASSROOMS.length).toFixed(1);
  const pendingAssignments = 12;
  const completionRate = 68;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#080c10", fontFamily: "'DM Mono', monospace" }}>
        <TeacherSidebar teacherName={teacherName} />

        <div style={{ marginLeft: 260, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <header style={{
            position: "sticky", top: 0, zIndex: 30, height: 64,
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px",
            background: "rgba(8,12,16,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
          }}>
            <div>
              <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>Bonjour, Prof. {teacherName.split(" ")[0]} 👋</h1>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", textTransform: "capitalize" }}>{today}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/teacher/classroom/new" style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
              }}>+ Nouvelle classe</Link>
              <Link href="/dashboard" style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", textDecoration: "none" }}>
                Vue élève
              </Link>
            </div>
          </header>

          {/* Main content */}
          <main style={{ flex: 1, padding: "28px 32px 48px", overflowY: "auto" }}>

            {/* Stat cards */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard icon="👥" label="Élèves actifs cette semaine" value={`${totalStudents}`} sub={`${totalStudents} inscrits · 3 classes`} color="#10b981" />
              <StatCard icon="📊" label="Moyenne de la classe" value={globalAvg} sub="Sur 10 · +0.3 vs semaine passée" color="#3b82f6" />
              <StatCard icon="📋" label="Devoirs à corriger" value={`${pendingAssignments}`} sub="Dont 2 en retard" color="#f59e0b" />
              <StatCard icon="✅" label="Taux de complétion" value={`${completionRate}%`} sub="Modules terminés cette semaine" color="#8b5cf6" />
            </div>

            {/* Codes d'accès */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              {/* Code enseignant */}
              <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem" }}>👨‍🏫</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mon code enseignant</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10, padding: "10px 14px", color: "#818cf8", fontSize: "1.1rem", fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: 700 }}>
                    {teacherCode ?? "Chargement..."}
                  </code>
                  <button onClick={() => teacherCode && copyCode(teacherCode)} style={{ padding: "10px 14px", borderRadius: 10, background: codeCopied ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: codeCopied ? "#818cf8" : "rgba(255,255,255,0.5)", fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {codeCopied ? "✓ Copié" : "Copier"}
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>
                  Partagez ce code aux élèves pour qu'ils vous trouvent sur Découvrir
                </p>
              </div>

              {/* Codes de classes */}
              <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: "1rem" }}>🏫</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Codes de mes classes</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {MOCK_CLASSROOMS.map(cls => (
                    <div key={cls.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</span>
                      <code style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "3px 8px", color: "#10b981", fontSize: "0.65rem", fontFamily: "monospace", flexShrink: 0 }}>{cls.code}</code>
                      <button onClick={() => navigator.clipboard.writeText(cls.code)} style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", cursor: "pointer" }}>⎘</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Classes + Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>

              {/* Mes classes */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>Mes Classes</h2>
                  <Link href="/teacher/classrooms" style={{ color: "#10b981", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", textDecoration: "none" }}>Voir tout →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {MOCK_CLASSROOMS.map((cls) => <ClassroomCard key={cls.id} cls={cls} />)}
                </div>
              </div>

              {/* Activité récente */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>Activité récente</h2>
                </div>
                <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  {MOCK_RECENT.map((ev, i) => (
                    <div key={i} style={{
                      padding: "12px 16px",
                      borderBottom: i < MOCK_RECENT.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: 2 }}>{ev.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.73rem" }}>{ev.student}</p>
                        <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.4 }}>{ev.detail}</p>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{ev.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart + Difficulty */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>

              {/* Line chart */}
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "20px" }}>
                <h2 style={{ margin: "0 0 16px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
                  Progression des classes — 4 semaines
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={MOCK_ACTIVITY} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} domain={[5, 10]} />
                    <Tooltip contentStyle={{ background: "#0d1a12", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontFamily: "DM Mono", fontSize: 12 }} labelStyle={{ color: "#10b981" }} itemStyle={{ color: "rgba(255,255,255,0.7)" }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Mono", color: "rgba(255,255,255,0.45)", paddingTop: 8 }} />
                    <Line type="monotone" dataKey="A1" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="A1 Matin" />
                    <Line type="monotone" dataKey="A2" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="A2 Soir" />
                    <Line type="monotone" dataKey="B1" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="B1 Goethe" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Élèves en difficulté */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                    ⚠️ Élèves en difficulté
                  </h2>
                  <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: "0.65rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    {difficultStudents.length} élève{difficultStudents.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {difficultStudents.map((s) => <DifficultyRow key={s.id} s={s} />)}
                  {difficultStudents.length === 0 && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", fontFamily: "'DM Mono', monospace", textAlign: "center", padding: "20px 0" }}>
                      Tous les élèves sont au-dessus de 50% 🎉
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Devoirs récents */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>📋 Devoirs récents</h2>
                <Link href="/teacher/assignments" style={{ color: "#10b981", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", textDecoration: "none" }}>Voir tout →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MOCK_ASSIGNMENTS.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem" }}>{a.title}</p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>{a.group} · Échéance : {a.due}</p>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 8, background: `${a.statusColor}18`, color: a.statusColor, fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, flexShrink: 0 }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

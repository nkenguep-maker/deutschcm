"use client"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface AdminStats {
  users: { total: number; students: number; teachers: number; centers: number; growth: string };
  courses: { total: number; published: number; draft: number; modules: number };
  sessions: { today: number; avgDuration: number };
}

const LEVEL_DISTRIBUTION = [
  { name: "A1", value: 0, color: "#10b981" },
  { name: "A2", value: 0, color: "#34d399" },
  { name: "B1", value: 0, color: "#60a5fa" },
  { name: "B2", value: 0, color: "#a78bfa" },
  { name: "C1", value: 0, color: "#f59e0b" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#0f1a14", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px" }}>
        <p style={{ color: "#10b981", fontSize: 11, margin: "0 0 4px", fontWeight: 700 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontSize: 11, margin: 0 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const tA = useTranslations("admin")
  const [activeTab, setActiveTab] = useState<"overview"|"users"|"courses"|"validations"|"system">("overview")
  const [searchUser, setSearchUser] = useState("")
  const [filterRole, setFilterRole] = useState("ALL")
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, students: 0, teachers: 0, centers: 0, growth: "" },
    courses: { total: 0, published: 0, draft: 0, modules: 0 },
    sessions: { today: 0, avgDuration: 0 },
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingValidations, setPendingValidations] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetch("/api/analytics?type=admin")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success && d.data) {
          if (d.data.stats) setStats(d.data.stats)
          if (d.data.recentUsers) setRecentUsers(d.data.recentUsers)
          if (d.data.pendingValidations) setPendingValidations(d.data.pendingValidations)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  const roleColor: Record<string, string> = {
    STUDENT: "#10b981", TEACHER: "#60a5fa",
    CENTER_MANAGER: "#f59e0b", ADMIN: "#ef4444"
  }

  const roleLabel: Record<string, string> = {
    STUDENT: tA("roleLabelStudent"),
    TEACHER: tA("roleLabelTeacher"),
    CENTER_MANAGER: tA("roleLabelCenter"),
    ADMIN: tA("roleLabelAdmin"),
  }

  const navItems = [
    { key: "overview", icon: "📊", label: tA("navOverview") },
    { key: "users", icon: "👥", label: tA("navUsers") },
    { key: "courses", icon: "📚", label: tA("navCourses") },
    { key: "validations", icon: "✅", label: tA("navValidations"), badge: pendingValidations.length },
    { key: "system", icon: "⚙️", label: tA("navSystem") },
  ]

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10",
      fontFamily: "'DM Mono',monospace", color: "white"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono&display=swap');
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: "flex", height: "100vh" }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 240, flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          padding: "24px 16px", overflowY: "auto"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <span style={{ fontSize: 20 }}></span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800 }}>
              Yema
            </span>
            <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
          </div>

          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key as any)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 4, border: "none",
                background: activeTab === item.key ? "rgba(16,185,129,0.12)" : "transparent",
                color: activeTab === item.key ? "#10b981" : "rgba(255,255,255,0.5)",
                cursor: "pointer", textAlign: "left", fontSize: 13,
                outline: activeTab === item.key ? "1px solid rgba(16,185,129,0.2)" : "none"
              }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1, fontFamily: "'Syne',sans-serif", fontWeight: activeTab === item.key ? 700 : 400 }}>
                {item.label}
              </span>
              {item.badge ? (
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 700 }}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}

          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 24 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
              {tA("backToSite")}
            </a>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>

          {/* ════ OVERVIEW ════ */}
          {activeTab === "overview" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>
                  {tA("greeting")}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
                  Yema · {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: tA("kpiTotal"), value: stats.users.total.toLocaleString(), icon: "👥", color: "#10b981", sub: tA("kpiTotalSub", { growth: stats.users.growth }) },
                  { label: tA("kpiStudents"), value: stats.users.students.toLocaleString(), icon: "🎓", color: "#34d399", sub: tA("kpiStudentsSub") },
                  { label: tA("kpiTeachers"), value: stats.users.teachers.toLocaleString(), icon: "👨‍🏫", color: "#60a5fa", sub: tA("kpiTeachersSub") },
                  { label: tA("kpiCenters"), value: stats.users.centers.toLocaleString(), icon: "🏫", color: "#f59e0b", sub: tA("kpiCentersSub") },
                  { label: tA("kpiSessions"), value: stats.sessions.today.toLocaleString(), icon: "⚡", color: "#a78bfa", sub: tA("kpiSessionsSub", { duration: stats.sessions.avgDuration }) },
                ].map((kpi, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: kpi.color, marginBottom: 2 }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{kpi.label}</div>
                    <div style={{ fontSize: 9, color: kpi.color }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>

                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 20px" }}>{tA("chartMonthly")}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={[]}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="users" stroke="#10b981" fill="url(#colorUsers)" strokeWidth={2} name={tA("chartSeriesUsers")} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("chartLevels")}</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={LEVEL_DISTRIBUTION} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {LEVEL_DISTRIBUTION.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {LEVEL_DISTRIBUTION.map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{l.name}: {l.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 20px" }}>{tA("chartWeekly")}</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }} />
                    <Bar dataKey="students" fill="#10b981" radius={[4,4,0,0]} name={tA("chartSeriesStudents")} />
                    <Bar dataKey="teachers" fill="#60a5fa" radius={[4,4,0,0]} name={tA("chartSeriesTeachers")} />
                    <Bar dataKey="centers" fill="#f59e0b" radius={[4,4,0,0]} name={tA("chartSeriesCenters")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("recentActivity")}</h3>
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>
                      {tA("recentActivityEmpty")}
                    </p>
                  </div>
                </div>

                <div style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("topCities")}</h3>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0, textAlign: "center", padding: "20px 0" }}>
                    {tA("topCitiesEmpty")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ════ USERS ════ */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, margin: 0 }}>{tA("usersTitle")}</h1>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    placeholder={tA("searchPlaceholder")}
                    style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, outline: "none", width: 220 }}
                  />
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, outline: "none" }}>
                    <option value="ALL">{tA("filterAll")}</option>
                    <option value="STUDENT">{tA("filterStudents")}</option>
                    <option value="TEACHER">{tA("filterTeachers")}</option>
                    <option value="CENTER_MANAGER">{tA("filterCenters")}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: tA("filterStudents"), value: stats.users.students, color: "#10b981" },
                  { label: tA("filterTeachers"), value: stats.users.teachers, color: "#60a5fa" },
                  { label: tA("filterCenters"), value: stats.users.centers, color: "#f59e0b" },
                  { label: tA("quickStatNew"), value: 12, color: "#a78bfa" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {[tA("tableUser"), tA("tableRole"), tA("tableLevel"), tA("tableCity"), tA("tableDate"), tA("tableStatus"), tA("tableActions")].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers
                      .filter(u => filterRole === "ALL" || u.role === filterRole)
                      .filter(u => !searchUser || u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()))
                      .map((u, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${roleColor[u.role]}20`, border: `1px solid ${roleColor[u.role]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: roleColor[u.role] }}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p style={{ color: "white", fontSize: 12, fontWeight: 600, margin: 0 }}>{u.name}</p>
                                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0 }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${roleColor[u.role]}15`, color: roleColor[u.role], fontWeight: 700 }}>
                              {roleLabel[u.role]}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#10b981", fontSize: 12, fontWeight: 700 }}>{u.level}</td>
                          <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{u.city}</td>
                          <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{u.date}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: u.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: u.status === "active" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                              {u.status === "active" ? tA("statusActive") : tA("statusPending")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button style={{ fontSize: 10, color: "#10b981", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{tA("actionView")}</button>
                              <button style={{ fontSize: 10, color: "#60a5fa", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{tA("actionEdit")}</button>
                              <button style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{tA("actionBlock")}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ COURSES ════ */}
          {activeTab === "courses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, margin: 0 }}>{tA("coursesTitle")}</h1>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href="/admin/courses/generate"
                    style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    {tA("generateBtn")}
                  </a>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
                {[
                  { label: tA("kpiCoursesTotal"), value: stats.courses.total, color: "#10b981", icon: "📚" },
                  { label: tA("kpiPublished"), value: stats.courses.published, color: "#34d399", icon: "✅" },
                  { label: tA("kpiDraft"), value: stats.courses.draft, color: "#f59e0b", icon: "📝" },
                  { label: tA("kpiModules"), value: stats.courses.modules, color: "#60a5fa", icon: "🧩" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {["A1","A2","B1","B2","C1"].map(level => {
                const colors: Record<string, string> = { A1:"#10b981", A2:"#34d399", B1:"#60a5fa", B2:"#a78bfa", C1:"#f59e0b" }
                const isA1 = level === "A1"
                const total = level === "B2" || level === "C1" ? 10 : 12
                const generated = isA1 ? 6 : 0
                return (
                  <div key={level} style={{ marginBottom: 16, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors[level]}20` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: colors[level] }}>{level}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                          {level === "A1" ? "Netzwerk neu A1 · 12 Lektionen" : level === "A2" ? "Netzwerk neu A2 · 12 Lektionen" : level === "B1" ? "Netzwerk neu B1 · 12 Lektionen" : level === "B2" ? "Aspekte neu B2 · 10 Lektionen" : "Aspekte neu C1 · 10 Lektionen"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          {tA("levelGenerated", { generated, total })}
                        </span>
                        <a href="/admin/courses/generate"
                          style={{ padding: "5px 12px", borderRadius: 8, background: `${colors[level]}15`, border: `1px solid ${colors[level]}25`, color: colors[level], fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                          {tA("generateCourseBtn")}
                        </a>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginTop: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: isA1 ? "50%" : "0%", background: `linear-gradient(90deg,${colors[level]}88,${colors[level]})`, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ════ VALIDATIONS ════ */}
          {activeTab === "validations" && (
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
                {tA("validationsTitle")}
              </h1>

              {pendingValidations.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  {tA("noValidations")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingValidations.map((item, i) => (
                    <div key={i} style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {item.type === "center" ? "🏫" : "👨‍🏫"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: "'Syne',sans-serif" }}>{item.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
                          {item.city} · {item.email} · {item.date}
                        </p>
                      </div>
                      <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 99, background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontWeight: 700 }}>
                        {item.type === "center" ? tA("validTypeCenter") : tA("validTypeTeacher")}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {tA("validateBtn")}
                        </button>
                        <button style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {tA("rejectBtn")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ SYSTEM ════ */}
          {activeTab === "system" && (
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{tA("systemTitle")}</h1>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("apisTitle")}</h3>
                  {[
                    { name: "notre IA", status: "active", usage: "Quiz + Correction + Simulateur" },
                    { name: "voix natives", status: "active", usage: "Dialogues Hören" },
                    { name: "Web Speech API", status: "active", usage: "Reconnaissance vocale" },
                    { name: "Supabase Auth", status: "active", usage: "Authentification" },
                    { name: "Prisma + PostgreSQL", status: "active", usage: "Base de données" },
                    { name: "CinetPay", status: "pending", usage: "Paiements Mobile Money" },
                  ].map((api, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: api.status === "active" ? "#10b981" : "#f59e0b", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontSize: 12, fontWeight: 600, margin: 0 }}>{api.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0 }}>{api.usage}</p>
                      </div>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: api.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: api.status === "active" ? "#10b981" : "#f59e0b" }}>
                        {api.status === "active" ? tA("apiStatusActive") : tA("apiStatusPending")}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("pagesTitle")}</h3>
                  {[
                    { path: "/", name: "Landing page", status: "ok" },
                    { path: "/dashboard", name: tA("pageDashboardStudent"), status: "ok" },
                    { path: "/courses", name: tA("pageCourses"), status: "ok" },
                    { path: "/simulateur", name: tA("pageSimulator"), status: "ok" },
                    { path: "/discover", name: tA("pageDiscover"), status: "ok" },
                    { path: "/progress", name: tA("pageProgress"), status: "ok" },
                    { path: "/teacher", name: tA("pageDashboardTeacher"), status: "ok" },
                    { path: "/center", name: tA("pageDashboardCenter"), status: "ok" },
                    { path: "/hoeren/demo", name: "Hören demo", status: "ok" },
                    { path: "/schreiben/demo", name: "Schreiben demo", status: "ok" },
                    { path: "/quiz/demo", name: tA("pageQuiz"), status: "ok" },
                    { path: "/video/preview", name: tA("pageVideos"), status: "ok" },
                    { path: "/pricing", name: tA("pagePricing"), status: "ok" },
                  ].map((page, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: page.status === "ok" ? "#10b981" : "#ef4444", flexShrink: 0 }} />
                      <a href={page.path} target="_blank" rel="noreferrer"
                        style={{ flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 11, textDecoration: "none" }}>
                        {page.name}
                      </a>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{page.path}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", gridColumn: "1/-1" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, margin: "0 0 16px" }}>{tA("envTitle")}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      { key: "GEMINI_API_KEY", status: true },
                      { key: "NEXT_PUBLIC_SUPABASE_URL", status: true },
                      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: true },
                      { key: "SUPABASE_SERVICE_ROLE_KEY", status: true },
                      { key: "DATABASE_URL", status: true },
                      { key: "DIRECT_URL", status: true },
                      { key: "AZURE_TTS_KEY", status: true },
                      { key: "AZURE_TTS_REGION", status: true },
                      { key: "CINETPAY_API_KEY", status: false },
                      { key: "CINETPAY_SITE_ID", status: false },
                      { key: "NEXT_PUBLIC_APP_URL", status: false },
                    ].map((env, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                        <span style={{ fontSize: 8 }}>{env.status ? "✅" : "⚠️"}</span>
                        <span style={{ fontSize: 9, color: env.status ? "rgba(255,255,255,0.6)" : "#f59e0b", fontFamily: "monospace" }}>{env.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

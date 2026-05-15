"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: string; teacherName: string; teacherAvatar: string; verified: boolean;
  level: string; city: string; center: string; students: number; max: number;
  schedule: string; nextSession: string; description: string; tags: string[];
  rating: number; reviews: number; code: string; isOnline?: boolean; lastActive: string;
}
interface CenterItem {
  id: string; name: string; city: string; region: string; avatar: string;
  verified: boolean; plan: string; teachers: number; students: number;
  classes: number; languages: string[]; code: string; successRate: number; yearsActive: number;
}
interface GroupItem {
  id: string; name: string; creatorName: string; creatorAvatar: string;
  level: string; city: string; members: number; max: number;
  goal: string; schedule: string; description: string; tags: string[];
  lastActive: string; memberAvatars: string[]; code: string;
}
interface SoloItem {
  id: string; name: string; avatar: string; level: string; targetLevel: string;
  city: string; goal: string; availability: string; desc: string;
}
interface Filters {
  levels: string[]; cities: string[]; availability: string[];
  spotsOnly: boolean; verifiedOnly: boolean;
}

// ─── Empty static arrays (data is fetched from API in DiscoverPage) ─────────
const CLASSES: ClassItem[] = [];
const CENTERS: CenterItem[] = [];
const GROUPS: GroupItem[] = [];
const SOLOS: SoloItem[] = [];

// ─── Code lookup (vide — les vrais codes sont en DB) ────────────────────────

type CodeResultType =
  | { type: "class";  data: ClassItem  }
  | { type: "center"; data: CenterItem }
  | { type: "group";  data: GroupItem  };

const CODE_LOOKUP: Record<string, CodeResultType> = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#34d399", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444" };
const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "#64748b" },
  pro: { label: "Pro", color: "#6366f1" },
  enterprise: { label: "Enterprise", color: "#f59e0b" },
};

function Av({ initials, size = 38, color = "#10b981" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function LvlBadge({ level }: { level: string }) {
  const c = LEVEL_COLORS[level] ?? "#64748b";
  return <span style={{ background: `${c}20`, color: c, border: `1px solid ${c}40`, borderRadius: 7, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{level}</span>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#fbbf24", fontSize: 11 }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span style={{ color: "rgba(255,255,255,0.2)" }}>{"★".repeat(5 - Math.ceil(rating))}</span>
    </span>
  );
}

function SpotsBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
        <span>{current}/{max} élèves</span>
        <span style={{ color: pct >= 90 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{max - current > 0 ? `${max - current} places` : "Complet"}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ─── Cameroon Map ─────────────────────────────────────────────────────────────

const MAP_CITIES = [
  { name: "Yaoundé", x: 82, y: 220, classes: 4 },
  { name: "Douala", x: 35, y: 215, classes: 3 },
  { name: "Bafoussam", x: 52, y: 185, classes: 1 },
  { name: "Garoua", x: 128, y: 95, classes: 1 },
  { name: "Bamenda", x: 44, y: 172, classes: 0 },
  { name: "Maroua", x: 148, y: 55, classes: 0 },
  { name: "En ligne", x: 110, y: 240, classes: 1 },
];

function CameroonMap({ onCityClick }: { onCityClick: (city: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>🗺️ Carte du Cameroun — cliquez une ville</div>
      <svg viewBox="0 0 200 300" width={200} height={300} style={{ overflow: "visible" }}>
        {/* Cameroon outline — simplified */}
        <path d="M 30,275 C 40,280 65,285 85,282 L 130,278 C 155,265 175,240 185,210 L 190,175 L 185,145 C 182,120 175,100 165,78 L 152,50 C 140,28 122,10 100,3 L 72,0 C 48,5 25,22 14,50 L 3,82 C 0,108 8,132 12,158 L 16,192 L 22,228 Z"
          fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" />

        {/* City pins */}
        {MAP_CITIES.map(city => (
          <g key={city.name} onClick={() => onCityClick(city.name)} style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(city.name)} onMouseLeave={() => setHovered(null)}>
            <circle cx={city.x} cy={city.y} r={city.classes > 0 ? 7 : 4}
              fill={city.classes > 0 ? "#10b981" : "rgba(255,255,255,0.2)"}
              stroke={hovered === city.name ? "white" : city.classes > 0 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}
              strokeWidth={hovered === city.name ? 2 : 1} opacity={hovered === city.name ? 1 : 0.85} />
            {city.classes > 0 && (
              <text x={city.x} y={city.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={7} fontWeight="bold">{city.classes}</text>
            )}
            <text x={city.x + 10} y={city.y} dominantBaseline="middle" fill={hovered === city.name ? "white" : "rgba(255,255,255,0.6)"} fontSize={9}>{city.name}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} /> Classes disponibles</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} /> Ville</span>
      </div>
    </div>
  );
}

// ─── Dual Search ─────────────────────────────────────────────────────────────

function DualSearch({ onJoin }: { onJoin: (id: string, name: string, type: "class" | "group" | "center", teacher?: string) => void }) {
  const [code, setCode] = useState("");
  const [codeResult, setCodeResult] = useState<CodeResultType | null | "notfound">(null);
  const [codeSent, setCodeSent] = useState<Set<string>>(new Set());
  const [nameQuery, setNameQuery] = useState("");
  const [nameFilter, setNameFilter] = useState<"all" | "teachers" | "centers" | "groups" | "students">("all");

  const handleCodeSearch = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCodeResult(CODE_LOOKUP[trimmed] ?? "notfound");
  };

  const nameResults = useMemo(() => {
    if (nameQuery.length < 3) return [];
    const q = nameQuery.toLowerCase();
    type NR = { type: "class" | "center" | "group" | "student"; data: ClassItem | CenterItem | GroupItem | SoloItem };
    const r: NR[] = [];
    if (nameFilter === "all" || nameFilter === "teachers")
      CLASSES.filter(c => `${c.teacherName} ${c.city} ${c.level} ${c.center}`.toLowerCase().includes(q)).forEach(c => r.push({ type: "class", data: c }));
    if (nameFilter === "all" || nameFilter === "centers")
      CENTERS.filter(c => `${c.name} ${c.city}`.toLowerCase().includes(q)).forEach(c => r.push({ type: "center", data: c }));
    if (nameFilter === "all" || nameFilter === "groups")
      GROUPS.filter(g => `${g.name} ${g.city} ${g.level}`.toLowerCase().includes(q)).forEach(g => r.push({ type: "group", data: g }));
    if (nameFilter === "all" || nameFilter === "students")
      SOLOS.filter(s => `${s.name} ${s.city}`.toLowerCase().includes(q)).forEach(s => r.push({ type: "student", data: s }));
    return r;
  }, [nameQuery, nameFilter]);

  const ac = "#10b981";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>

      {/* ── BARRE 1 : CODE ── */}
      <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.03))", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 18, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>🔑</span>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Rejoindre par code</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>· Classes · Centres · Groupes</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setCodeResult(null); }}
            onKeyDown={e => e.key === "Enter" && code.trim().length >= 4 && handleCodeSearch()}
            placeholder="Entrez un code : DEUTSCH-A1-XXXX / CENTRE-XXXX / GROUPE-XXXX"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.06)", border: `1px solid ${codeResult === "notfound" ? "rgba(239,68,68,0.5)" : codeResult ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.12)"}`, color: "white", fontSize: 12, outline: "none", fontFamily: "monospace", letterSpacing: "0.04em", boxSizing: "border-box" as const }}
          />
          <button onClick={handleCodeSearch} disabled={code.trim().length < 4} style={{ padding: "10px 18px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: code.trim().length >= 4 ? "pointer" : "not-allowed", background: code.trim().length >= 4 ? `linear-gradient(135deg,${ac},#059669)` : "rgba(255,255,255,0.05)", color: code.trim().length >= 4 ? "white" : "rgba(255,255,255,0.3)", border: "none", whiteSpace: "nowrap" as const }}>
            Rechercher →
          </button>
        </div>

        {codeResult === "notfound" && (
          <div style={{ marginTop: 10, color: "#ef4444", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
            ❌ Code introuvable. Vérifiez l&apos;orthographe et réessayez.
          </div>
        )}

        {codeResult && codeResult !== "notfound" && (() => {
          if (codeResult.type === "class") {
            const cls = codeResult.data;
            const spots = cls.max - cls.students;
            const sent = codeSent.has(cls.id);
            const lc = LEVEL_COLORS[cls.level] ?? ac;
            return (
              <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${lc}30`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <Av initials={cls.teacherAvatar} size={42} color={lc} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{cls.teacherName}</span>
                    <LvlBadge level={cls.level} />
                    <span style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>Enseignant</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>📍 {cls.city} · 📅 {cls.schedule} · {spots > 0 ? `${spots} places dispo` : "Complet"}</div>
                </div>
                <button onClick={() => { if (!sent && spots > 0) { setCodeSent(s => new Set([...s, cls.id])); onJoin(cls.id, `${cls.teacherName} — ${cls.level}`, "class", cls.teacherName); } }} disabled={sent || spots <= 0} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: (!sent && spots > 0) ? "pointer" : "not-allowed", background: sent ? `${ac}15` : `linear-gradient(135deg,${ac},#059669)`, border: sent ? `1px solid ${ac}40` : "none", color: sent ? ac : "white", whiteSpace: "nowrap" as const }}>
                  {sent ? "✓ Envoyé" : spots <= 0 ? "Complet" : "📩 Rejoindre"}
                </button>
              </div>
            );
          }
          if (codeResult.type === "center") {
            const ctr = codeResult.data;
            const sent = codeSent.has(ctr.id);
            return (
              <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{ctr.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{ctr.name}</span>
                    {ctr.verified && <span>✅</span>}
                    <span style={{ background: "rgba(234,179,8,0.12)", color: "#fbbf24", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>Centre</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>📍 {ctr.city} · {ctr.classes} classes · {ctr.successRate}% taux de réussite</div>
                </div>
                <button onClick={() => { if (!sent) { setCodeSent(s => new Set([...s, ctr.id])); onJoin(ctr.id, ctr.name, "center"); } }} disabled={sent} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: sent ? "not-allowed" : "pointer", background: sent ? "rgba(234,179,8,0.1)" : "linear-gradient(135deg,#eab308,#ca8a04)", border: sent ? "1px solid rgba(234,179,8,0.3)" : "none", color: sent ? "#fbbf24" : "white", whiteSpace: "nowrap" as const }}>
                  {sent ? "✓ Envoyé" : "📩 Rejoindre"}
                </button>
              </div>
            );
          }
          const grp = codeResult.data;
          const isFull = grp.members >= grp.max;
          const sent = codeSent.has(grp.id);
          return (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
              <Av initials={grp.creatorAvatar} size={42} color="#6366f1" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const, marginBottom: 3 }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{grp.name}</span>
                  <LvlBadge level={grp.level} />
                  <span style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>Groupe</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>📍 {grp.city} · {grp.members}/{grp.max} membres · {grp.schedule}</div>
              </div>
              <button onClick={() => { if (!isFull && !sent) { setCodeSent(s => new Set([...s, grp.id])); onJoin(grp.id, grp.name, "group"); } }} disabled={sent || isFull} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: (sent || isFull) ? "not-allowed" : "pointer", background: sent ? "rgba(99,102,241,0.1)" : isFull ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#6366f1,#4f46e5)", border: sent ? "1px solid rgba(99,102,241,0.3)" : isFull ? "1px solid rgba(255,255,255,0.07)" : "none", color: sent ? "#818cf8" : isFull ? "rgba(255,255,255,0.3)" : "white", whiteSpace: "nowrap" as const }}>
                {sent ? "✓ Envoyé" : isFull ? "⛔ Complet" : "📩 Rejoindre"}
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── BARRE 2 : NOM ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Rechercher par nom</span>
        </div>
        <div style={{ position: "relative" as const, marginBottom: 10 }}>
          <input
            value={nameQuery}
            onChange={e => setNameQuery(e.target.value)}
            placeholder="Rechercher un enseignant, centre ou élève..."
            style={{ width: "100%", padding: "10px 36px 10px 36px", borderRadius: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
            onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.3)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <span style={{ position: "absolute" as const, left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
          {nameQuery && <button onClick={() => setNameQuery("")} style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer" }}>×</button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["all", "teachers", "centers", "groups", "students"] as const).map(f => (
            <button key={f} onClick={() => setNameFilter(f)} style={{ padding: "4px 11px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: nameFilter === f ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: nameFilter === f ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.07)", color: nameFilter === f ? "white" : "rgba(255,255,255,0.4)" }}>
              {f === "all" ? "Tous" : f === "teachers" ? "Enseignants" : f === "centers" ? "Centres" : f === "groups" ? "Groupes" : "Élèves"}
            </button>
          ))}
        </div>

        {nameQuery.length >= 3 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 8 }}>
              {nameResults.length} résultat{nameResults.length !== 1 ? "s" : ""} pour « {nameQuery} »
            </div>
            {nameResults.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center" as const, padding: "10px 0" }}>
                Aucun résultat pour « {nameQuery} »
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 320, overflowY: "auto" as const }}>
                {nameResults.slice(0, 8).map((r, i) => {
                  if (r.type === "class") {
                    const cls = r.data as ClassItem;
                    const lc = LEVEL_COLORS[cls.level] ?? ac;
                    return (
                      <div key={`c${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Av initials={cls.teacherAvatar} size={32} color={lc} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" as const }}>
                            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{cls.teacherName}</span>
                            <LvlBadge level={cls.level} />
                            <span style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: 5, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>Enseignant</span>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>📍 {cls.city} · {cls.max - cls.students > 0 ? `${cls.max - cls.students} places` : "Complet"}</div>
                        </div>
                        <button onClick={() => onJoin(cls.id, `${cls.teacherName} — ${cls.level}`, "class", cls.teacherName)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg,${ac},#059669)`, color: "white", border: "none", whiteSpace: "nowrap" as const }}>Voir →</button>
                      </div>
                    );
                  }
                  if (r.type === "center") {
                    const ctr = r.data as CenterItem;
                    return (
                      <div key={`t${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{ctr.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{ctr.name}</span>
                            <span style={{ background: "rgba(234,179,8,0.12)", color: "#fbbf24", borderRadius: 5, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>Centre</span>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>📍 {ctr.city} · {ctr.classes} classes</div>
                        </div>
                        <button onClick={() => onJoin(ctr.id, ctr.name, "center")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "white", border: "none", whiteSpace: "nowrap" as const }}>Voir →</button>
                      </div>
                    );
                  }
                  if (r.type === "group") {
                    const grp = r.data as GroupItem;
                    const lc = LEVEL_COLORS[grp.level] ?? ac;
                    return (
                      <div key={`g${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Av initials={grp.creatorAvatar} size={32} color="#6366f1" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" as const }}>
                            <span style={{ color: "white", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 120 }}>{grp.name}</span>
                            <LvlBadge level={grp.level} />
                            <span style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", borderRadius: 5, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>Groupe</span>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>📍 {grp.city} · {grp.members}/{grp.max} membres</div>
                        </div>
                        <button onClick={() => onJoin(grp.id, grp.name, "group")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", border: "none", whiteSpace: "nowrap" as const }}>Voir →</button>
                      </div>
                    );
                  }
                  const s = r.data as SoloItem;
                  return (
                    <div key={`s${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <Av initials={s.avatar} size={32} color="#f59e0b" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{s.name}</span>
                          <LvlBadge level={s.level} />
                          <span style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", borderRadius: 5, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>Élève</span>
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>📍 {s.city} · {s.availability}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onboarding tooltip ───────────────────────────────────────────────────────

function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🔑", title: "Vous avez un code ?", desc: "Entrez votre code enseignant (TCH-XXXXXX) ou code de classe en haut pour rejoindre directement." },
    { icon: "🔍", title: "Ou recherchez", desc: "Utilisez la barre de recherche et les filtres pour trouver une classe par niveau, ville ou institut." },
    { icon: "📩", title: "Rejoignez en 1 clic", desc: "Cliquez sur Rejoindre sur n'importe quelle carte. Votre profil sera envoyé automatiquement." },
  ];
  const current = steps[step];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0d1117", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 24, padding: "32px 28px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {steps.map((_, i) => <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#10b981" : "rgba(255,255,255,0.15)", transition: "width 0.3s" }} />)}
        </div>
        <h3 style={{ color: "white", fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{current.title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>{current.desc}</p>
        <div style={{ display: "flex", gap: 10 }}>
          {step < steps.length - 1 ? (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Passer</button>
              <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: "11px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Suivant →</button>
            </>
          ) : (
            <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>J&apos;ai compris ! 🚀</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────

const CITIES_LIST = ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda", "Maroua", "Ngaoundéré", "En ligne"];
const LEVELS_LIST = ["A1", "A2", "B1", "B2", "C1"];
const AVAIL_LIST = ["Matin", "Après-midi", "Soir", "Weekend"];

function FilterSidebar({ filters, onChange, onReset, count }: { filters: Filters; onChange: (f: Filters) => void; onReset: () => void; count: number }) {
  const toggle = (key: keyof Pick<Filters, "levels" | "cities" | "availability">, val: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", border: active ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.07)", color: active ? "#10b981" : "rgba(255,255,255,0.45)", transition: "all 0.15s" }}>
      {label}
    </button>
  );

  return (
    <div style={{ width: 220, flexShrink: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, height: "fit-content", position: "sticky", top: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>🎚️ Filtres</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{count} résultats</span>
          <button onClick={onReset} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {[
        { label: "Niveau", key: "levels" as const, items: LEVELS_LIST },
        { label: "Ville", key: "cities" as const, items: CITIES_LIST },
        { label: "Disponibilité", key: "availability" as const, items: AVAIL_LIST },
      ].map(section => (
        <div key={section.key} style={{ marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{section.label}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {section.items.map(item => (
              <Chip key={item} label={item} active={filters[section.key].includes(item)} onClick={() => toggle(section.key, item)} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { key: "spotsOnly", label: "Places disponibles uniquement" },
          { key: "verifiedOnly", label: "Centres vérifiés uniquement" },
        ].map(opt => (
          <label key={opt.key} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <div onClick={() => onChange({ ...filters, [opt.key]: !filters[opt.key as keyof Filters] })} style={{ width: 16, height: 16, borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)", background: filters[opt.key as keyof Filters] ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {filters[opt.key as keyof Filters] && <span style={{ color: "white", fontSize: 10 }}>✓</span>}
            </div>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────

function ClassCard({ cls, recommended, onJoin, faved, onFav, sent }: { cls: ClassItem; recommended?: boolean; onJoin: (id: string, name: string, teacher: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const isFull = cls.students >= cls.max;
  const lc = LEVEL_COLORS[cls.level] ?? "#10b981";

  const share = () => {
    const url = `${window.location.origin}/discover/class/${cls.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    const wa = `https://wa.me/?text=${encodeURIComponent(`Rejoins cette classe d'allemand : ${cls.teacherName} (${cls.level}) — ${url}`)}`;
    window.open(wa, "_blank");
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${hovered ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)",
      boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
      transition: "all 0.25s ease", position: "relative",
    }}>
      {recommended && <div style={{ position: "absolute", top: -8, left: 16, background: "#f59e0b", color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 99, letterSpacing: "0.05em" }}>⭐ RECOMMANDÉ</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Av initials={cls.teacherAvatar} size={44} color="#6366f1" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{cls.teacherName}</span>
            {cls.verified && <span title="Vérifié" style={{ fontSize: 12 }}>✅</span>}
            {cls.isOnline && <span style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", borderRadius: 5, padding: "1px 6px", fontSize: 10 }}>🌐 En ligne</span>}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>🏛️ {cls.center} · 📍 {cls.city}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.03em" }}>{cls.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(cls.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }} title="Copier le code">📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <LvlBadge level={cls.level} />
          <button onClick={() => onFav(cls.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: faved ? 1 : 0.3, transition: "opacity 0.2s" }} title="Ajouter aux favoris">
            {faved ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.6 }}>{cls.description}</p>

      <SpotsBar current={cls.students} max={cls.max} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
        <div>📅 {cls.schedule}</div>
        <div style={{ color: "#10b981" }}>⏭ {cls.nextSession}</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}><Stars rating={cls.rating} /> <span>{cls.rating} ({cls.reviews})</span></div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>🕐 Actif {cls.lastActive}</div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {cls.tags.map(t => <span key={t} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "1px 7px", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>#{t}</span>)}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/class/${cls.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)" }}>
          👁 Programme
        </Link>
        {isFull ? (
          <button onClick={() => setWaitlisted(true)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: waitlisted ? "default" : "pointer", background: waitlisted ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: waitlisted ? "rgba(255,255,255,0.4)" : "#f87171" }}>
            {waitlisted ? "✓ Liste d'attente" : "🔴 Liste d'attente"}
          </button>
        ) : sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
            ⏳ Demande envoyée
          </button>
        ) : (
          <button onClick={() => onJoin(cls.id, cls.teacherName + " — " + cls.level, cls.teacherName)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg, #10b981, #059669)`, color: "white", border: "none", boxShadow: hovered ? "0 4px 14px rgba(16,185,129,0.5)" : "0 4px 14px rgba(16,185,129,0.3)" }}>
            📩 Rejoindre
          </button>
        )}
        <button onClick={share} style={{ padding: "9px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer" }} title="Partager">
          ↗
        </button>
      </div>
    </div>
  );
}

// ─── Center Card ──────────────────────────────────────────────────────────────

function CenterCard({ center, onJoin, faved, onFav, sent }: { center: CenterItem; onJoin: (id: string, name: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const plan = PLAN_LABEL[center.plan];

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${hovered ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)",
      boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
      transition: "all 0.25s ease",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))", border: "1px solid rgba(234,179,8,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {center.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{center.name}</span>
            {center.verified && <span title="Vérifié par Yema" style={{ fontSize: 12 }}>✅</span>}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>📍 {center.city}, {center.region} · {center.yearsActive} ans</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.03em" }}>{center.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(center.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }} title="Copier le code">📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          <span style={{ background: `${plan.color}20`, color: plan.color, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{plan.label}</span>
          <button onClick={() => onFav(center.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: faved ? 1 : 0.3 }}>
            {faved ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[{ v: center.teachers, l: "Enseignants" }, { v: center.students, l: "Élèves" }, { v: center.classes, l: "Classes" }].map(s => (
          <div key={s.l} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 4px" }}>
            <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 16 }}>{s.v}</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>{center.languages.map(l => <span key={l} style={{ fontSize: 18 }}>{l}</span>)}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Taux de réussite</div>
          <div style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{center.successRate}%</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/center/${center.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)" }}>
          📋 Voir les classes
        </Link>
        {sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
            ⏳ Demande envoyée
          </button>
        ) : (
          <button onClick={() => onJoin(center.id, center.name)} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "white", border: "none", boxShadow: hovered ? "0 4px 14px rgba(234,179,8,0.4)" : "none" }}>
            🏫 Rejoindre
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, onJoin, faved, onFav, sent }: { group: GroupItem; onJoin: (id: string, name: string) => void; faved: boolean; onFav: (id: string) => void; sent?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isFull = group.members >= group.max;
  const lc = LEVEL_COLORS[group.level] ?? "#10b981";
  const isActive = group.lastActive.includes("min") || group.lastActive.includes("1h") || group.lastActive.includes("2h") || group.lastActive.includes("3h");

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${hovered ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "all 0.25s ease",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Av initials={group.creatorAvatar} size={40} color="#6366f1" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{group.name}</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>par {group.creatorName} · 📍 {group.city}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <code style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.03em" }}>{group.code}</code>
            <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(group.code).catch(() => {}); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, opacity: 0.4, lineHeight: 1 }} title="Copier le code">📋</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <LvlBadge level={group.level} />
          <button onClick={() => onFav(group.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: faved ? 1 : 0.3 }}>{faved ? "❤️" : "🤍"}</button>
        </div>
      </div>

      {/* Stacked member avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex" }}>
          {group.memberAvatars.slice(0, 5).map((av, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${i * 60}, 60%, 50%)`, border: "2px solid #0d1117", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 700, marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: "relative" }}>
              {av}
            </div>
          ))}
          {group.members > 5 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid #0d1117", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 9, marginLeft: -8, zIndex: 0 }}>+{group.members - 5}</div>}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{group.members}/{group.max} membres</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#10b981" : "rgba(255,255,255,0.2)", display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>{group.lastActive}</span>
        </div>
      </div>

      <SpotsBar current={group.members} max={group.max} />

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
        <div style={{ marginBottom: 4 }}>🎯 <strong style={{ color: "rgba(255,255,255,0.6)" }}>{group.goal}</strong></div>
        <div>📅 {group.schedule}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/discover/group/${group.id}`} style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)" }}>
          💬 Activité
        </Link>
        {sent ? (
          <button disabled style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "not-allowed", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
            ⏳ Demande envoyée
          </button>
        ) : (
          <button onClick={() => !isFull && onJoin(group.id, group.name)} disabled={isFull} style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isFull ? "default" : "pointer", background: isFull ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#6366f1,#4f46e5)", border: isFull ? "1px solid rgba(255,255,255,0.07)" : "none", color: isFull ? "rgba(255,255,255,0.25)" : "white", boxShadow: (!isFull && hovered) ? "0 4px 14px rgba(99,102,241,0.4)" : "none" }}>
            {isFull ? "⛔ Complet" : "👥 Rejoindre"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Solo Card ────────────────────────────────────────────────────────────────

function SoloCard({ student, onInvite, invited }: { student: SoloItem; onInvite: (id: string, name: string) => void; invited: boolean }) {
  const [hovered, setHovered] = useState(false);
  const lc = LEVEL_COLORS[student.level] ?? "#10b981";
  const tlc = LEVEL_COLORS[student.targetLevel] ?? "#f59e0b";

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${hovered ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12,
      transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "all 0.25s ease",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Av initials={student.avatar} size={44} color="#f59e0b" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{student.name}</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>📍 {student.city}</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <LvlBadge level={student.level} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>→</span>
          <LvlBadge level={student.targetLevel} />
        </div>
      </div>

      <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{student.desc}&rdquo;</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
        <div>🎯 {student.goal}</div>
        <div>⏰ {student.availability}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => !invited && onInvite(student.id, student.name)} disabled={invited} style={{
          flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: invited ? "default" : "pointer",
          background: invited ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.15)",
          border: invited ? "1px solid rgba(245,158,11,0.15)" : "1px solid rgba(245,158,11,0.35)",
          color: "#f59e0b", boxShadow: (!invited && hovered) ? "0 4px 14px rgba(245,158,11,0.2)" : "none",
        }}>
          {invited ? "✓ Invitation envoyée" : "✉️ Inviter dans mon groupe"}
        </button>
        <button onClick={() => { const wa = `https://wa.me/?text=${encodeURIComponent(`Salut ${student.name} ! Je t'invite à rejoindre mon groupe d'étude d'allemand sur Yema.`)}`; window.open(wa, "_blank"); }} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25d166", fontSize: 14, cursor: "pointer" }} title="Inviter sur WhatsApp">
          💬
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabKey = "all" | "classes" | "centers" | "groups" | "solo";
type SortKey = "relevance" | "active" | "new" | "rating";

const DEFAULT_FILTERS: Filters = { levels: [], cities: [], availability: [], spotsOnly: false, verifiedOnly: false };

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: "class" | "group" | "center"; teacherName?: string } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [solos] = useState<SoloItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("discoverSeen");
    if (!seen) { setShowOnboarding(true); localStorage.setItem("discoverSeen", "1"); }
    const favs = localStorage.getItem("discoverFavs");
    if (favs) setFavorites(new Set(JSON.parse(favs)));

    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.germanLevel) setUserLevel(d.germanLevel);
      if (d?.city) setUserCity(d.city);
    }).catch(() => {});

    fetch("/api/discover")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.success) {
          const apiClasses: ClassItem[] = (d.teachers ?? []).flatMap((t: any) =>
            (t.classrooms ?? []).map((c: any) => ({
              id: c.id,
              teacherName: t.fullName,
              teacherAvatar: (t.fullName || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
              verified: false,
              level: c.level,
              city: t.city ?? "—",
              center: "",
              students: c.enrollments ?? 0,
              max: c.maxStudents ?? 30,
              schedule: "",
              nextSession: "",
              description: t.bio ?? "",
              tags: [],
              rating: 0,
              reviews: 0,
              code: c.code,
              lastActive: "—",
            }))
          );
          const apiCenters: CenterItem[] = (d.centers ?? []).map((c: any) => ({
            id: c.id,
            name: c.centerName ?? c.fullName,
            city: c.centerCity ?? "—",
            region: "",
            avatar: (c.centerName ?? c.fullName ?? "?").slice(0, 2).toUpperCase(),
            verified: false,
            plan: "starter",
            teachers: 0,
            students: 0,
            classes: 0,
            languages: [""],
            code: "",
            successRate: 0,
            yearsActive: 0,
          }));
          setClasses(apiClasses);
          setCenters(apiCenters);
          setGroups(d.groups ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setDiscoverLoading(false));
  }, []);

  const toggleFav = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("discoverFavs", JSON.stringify([...next]));
      return next;
    });
  };

  const applyFilter = (items: (ClassItem | CenterItem | GroupItem)[], key: "level" | "city" | "verified") => {
    return items.filter(item => {
      const it = item as unknown as Record<string, unknown>;
      if (key === "level" && filters.levels.length > 0 && !filters.levels.includes(it.level as string)) return false;
      if (key === "city" && filters.cities.length > 0 && !filters.cities.includes(it.city as string)) return false;
      if (key === "verified" && filters.verifiedOnly && !it.verified) return false;
      return true;
    });
  };

  const matchSearch = (text: string) => !search || text.toLowerCase().includes(search.toLowerCase());

  const filteredClasses = useMemo(() => {
    let r = classes.filter(c =>
      matchSearch(`${c.teacherName} ${c.center} ${c.level} ${c.city} ${c.tags.join(" ")}`) &&
      (filters.levels.length === 0 || filters.levels.includes(c.level)) &&
      (filters.cities.length === 0 || filters.cities.includes(c.city)) &&
      (!filters.spotsOnly || c.students < c.max)
    );
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "new") r = [...r].sort((a, b) => a.students - b.students);
    if (sort === "active") r = [...r].sort((a, b) => a.lastActive.localeCompare(b.lastActive));
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, search, filters, sort]);

  const filteredCenters = useMemo(() => centers.filter(c =>
    matchSearch(`${c.name} ${c.city} ${c.region}`) &&
    (filters.cities.length === 0 || filters.cities.includes(c.city)) &&
    (!filters.verifiedOnly || c.verified)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [centers, search, filters]);

  const filteredGroups = useMemo(() => groups.filter(g =>
    matchSearch(`${g.name} ${g.level} ${g.city} ${g.goal}`) &&
    (filters.levels.length === 0 || filters.levels.includes(g.level)) &&
    (filters.cities.length === 0 || filters.cities.includes(g.city)) &&
    (!filters.spotsOnly || g.members < g.max)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [groups, search, filters]);

  const filteredSolos = useMemo(() => solos.filter(s =>
    matchSearch(`${s.name} ${s.city} ${s.level} ${s.goal}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [solos, search]);

  const recommendedIds = useMemo(() => {
    if (!userLevel) return new Set<string>();
    return new Set(classes.filter(c => c.level === userLevel || (userCity && c.city === userCity)).map(c => c.id));
  }, [classes, userLevel, userCity]);

  const totalCount = filteredClasses.length + filteredCenters.length + filteredGroups.length + filteredSolos.length;
  const isEmpty = !discoverLoading && totalCount === 0 && !search;

  const openJoin = (id: string, name: string, type: "class" | "group" | "center", teacher?: string) => {
    if (joined.has(id)) return;
    setSelectedItem({ id, name, type, teacherName: teacher });
    setModalOpen(true);
  };

  const accentColor = "#10b981";
  const showClasses = tab === "all" || tab === "classes";
  const showCenters = tab === "all" || tab === "centers";
  const showGroups = tab === "all" || tab === "groups";
  const showSolo = tab === "all" || tab === "solo";

  return (
    <Layout title="Découvrir">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
      `}</style>

      {showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} />}

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,16,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "-24px -24px 24px", padding: "16px 24px" }}>
        {/* Title + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>🔍 Découvrir</h1>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{totalCount} résultats · {userLevel ? `Niveau ${userLevel}` : "Tous niveaux"}{userCity ? ` · ${userCity}` : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilters(f => !f)} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: showFilters ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: showFilters ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)", color: showFilters ? accentColor : "rgba(255,255,255,0.5)" }}>
              🎚️ Filtres
            </button>
            <button onClick={() => setViewMode(v => v === "list" ? "map" : "list")} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              {viewMode === "list" ? "🗺️ Carte" : "☰ Liste"}
            </button>
          </div>
        </div>

        {/* Universal search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une classe, un centre, un enseignant, un groupe..."
            style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13, outline: "none", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔍</span>
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer" }}>×</button>}
        </div>

        {/* Tab filters + sort */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([
              { key: "all", label: "🎯 Tous", count: totalCount },
              { key: "classes", label: "👨‍🏫 Classes", count: filteredClasses.length },
              { key: "centers", label: "🏫 Centres", count: filteredCenters.length },
              { key: "groups", label: "👥 Groupes", count: filteredGroups.length },
              { key: "solo", label: "🎓 Élèves solo", count: filteredSolos.length },
            ] as { key: TabKey; label: string; count: number }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", background: tab === t.key ? `${accentColor}18` : "rgba(255,255,255,0.04)", border: tab === t.key ? `1px solid ${accentColor}40` : "1px solid rgba(255,255,255,0.07)", color: tab === t.key ? accentColor : "rgba(255,255,255,0.5)" }}>
                {t.label} <span style={{ opacity: 0.6, fontSize: 11 }}>({t.count})</span>
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: 12, outline: "none", cursor: "pointer" }}>
            <option value="relevance">📊 Pertinence</option>
            <option value="active">⚡ Les plus actifs</option>
            <option value="rating">⭐ Mieux notés</option>
            <option value="new">🆕 Places dispo.</option>
          </select>
        </div>
      </div>

      {/* Dual search */}
      <DualSearch onJoin={openJoin} />

      {viewMode === "map" ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 20 }}>
          <CameroonMap onCityClick={(city) => { setFilters(f => ({ ...f, cities: [city] })); setViewMode("list"); }} />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            Cliquez sur une ville pour filtrer les classes
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {showFilters && (
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              count={totalCount}
            />
          )}

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Recommended */}
            {recommendedIds.size > 0 && (tab === "all" || tab === "classes") && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ color: "#f59e0b", fontSize: 16 }}>⭐</span>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>Recommandé pour vous</h2>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Basé sur votre niveau {userLevel}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredClasses.filter(c => recommendedIds.has(c.id)).map(cls => (
                    <ClassCard key={cls.id} cls={cls} recommended onJoin={(id, name, teacher) => openJoin(id, name, "class", teacher)} faved={favorites.has(cls.id)} onFav={toggleFav} sent={joined.has(cls.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Classes */}
            {showClasses && filteredClasses.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>👨‍🏫</span>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>Classes enseignants</h2>
                  <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredClasses.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredClasses.map(cls => (
                    <ClassCard key={cls.id} cls={cls} recommended={recommendedIds.has(cls.id)} onJoin={(id, name, teacher) => openJoin(id, name, "class", teacher)} faved={favorites.has(cls.id)} onFav={toggleFav} sent={joined.has(cls.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Centers */}
            {showCenters && filteredCenters.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🏫</span>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>Centres de langue</h2>
                  <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredCenters.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredCenters.map(center => (
                    <CenterCard key={center.id} center={center} onJoin={(id, name) => openJoin(id, name, "center")} faved={favorites.has(center.id)} onFav={toggleFav} sent={joined.has(center.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {showGroups && filteredGroups.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>👥</span>
                    <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>Groupes d&apos;élèves</h2>
                    <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredGroups.length}</span>
                  </div>
                  <Link href="/group/create" style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>
                    + Créer un groupe
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
                  {filteredGroups.map(group => (
                    <GroupCard key={group.id} group={group} onJoin={(id, name) => openJoin(id, name, "group")} faved={favorites.has(group.id)} onFav={toggleFav} sent={joined.has(group.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Solo */}
            {showSolo && filteredSolos.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🎓</span>
                  <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>Élèves en recherche</h2>
                  <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>{filteredSolos.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {filteredSolos.map(s => (
                    <SoloCard key={s.id} student={s} onInvite={(id, name) => { setInvited(prev => new Set([...prev, id])); fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite-to-group", toUserId: id, groupName: "Mon groupe" }) }); }} invited={invited.has(s.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {totalCount === 0 && (
              <div style={{ textAlign: "center", padding: "60px 16px", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun résultat</div>
                <div style={{ fontSize: 13 }}>Modifiez vos filtres ou votre recherche</div>
                <button onClick={() => { setSearch(""); setFilters(DEFAULT_FILTERS); }} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Join modal */}
      {modalOpen && selectedItem && (
        <div
          onClick={() => setModalOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "linear-gradient(160deg,#0f1a14,#080c10)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 24, padding: 32 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)", margin: "0 auto 24px" }} />
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              Rejoindre {selectedItem.type === "group" ? "ce groupe" : selectedItem.type === "center" ? "ce centre" : "cette classe"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 20px" }}>
              {selectedItem.name}
            </p>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
              Message (optionnel)
            </label>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Bonjour, je m'appelle... je souhaite rejoindre pour..."
              rows={4}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, color: "white", fontSize: 13, resize: "none", outline: "none", marginBottom: 20, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={async () => {
                  const item = selectedItem;
                  setSending(true);
                  const action = item.type === "group" ? "request-join-group" : "request-join-class";
                  const bodyKey = item.type === "group" ? "groupId" : "classroomId";
                  try {
                    await fetch("/api/social", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action, [bodyKey]: item.id, message: messageText }),
                    });
                  } catch { /* optimistic */ }
                  setJoined(prev => new Set([...prev, item.id]));
                  setModalOpen(false);
                  setMessageText("");
                  setSending(false);
                }}
                disabled={sending}
                style={{ flex: 1, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}>
                {sending ? "Envoi..." : "📩 Envoyer la demande"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: "14px 20px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

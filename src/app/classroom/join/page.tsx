"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ClassroomPreview {
  id: string; name: string; level: string;
  teacherName: string; teacherCity: string | null;
  centerName: string | null; centerCity: string | null;
  enrolledCount: number; maxStudents: number;
}

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "13px 16px", color: "#f1f5f9", fontSize: 15,
    outline: "none", boxSizing: "border-box", fontFamily: "monospace",
    letterSpacing: "0.06em", transition: "border-color 0.2s",
    ...style,
  };
}

const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#34d399", B1: "#6366f1", B2: "#8b5cf6", C1: "#f59e0b" };

export default function ClassroomJoinPage() {
  return (
    <Suspense>
      <ClassroomJoinContent />
    </Suspense>
  );
}

function ClassroomJoinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<ClassroomPreview | null>(null);
  const [codeError, setCodeError] = useState("");
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState<{ teacherName: string; classroomName: string } | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const checkCode = async (val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (trimmed.length < 6) { setPreview(null); setCodeError(""); return; }
    setChecking(true); setCodeError("");
    try {
      const r = await fetch(`/api/classroom/check-code/${encodeURIComponent(trimmed)}`);
      const d = await r.json();
      if (d.valid) { setPreview(d.classroom); setCodeError(""); }
      else { setPreview(null); setCodeError(d.error ?? "Code invalide"); }
    } catch { setCodeError("Erreur réseau"); }
    finally { setChecking(false); }
  };

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => checkCode(code), 500);
    setDebounceTimer(t);
    return () => clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (!preview) return;
    setJoining(true);
    try {
      const r = await fetch("/api/classroom/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const d = await r.json();
      if (r.ok) { setDone({ teacherName: d.teacherName, classroomName: d.classroomName }); }
      else setCodeError(d.error ?? "Erreur inconnue");
    } finally { setJoining(false); }
  };

  const levelColor = preview ? (LEVEL_COLORS[preview.level] ?? "#10b981") : "#10b981";

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 500 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🏫</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24 }}>
            Rejoindre une classe
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            Entrez le code fourni par votre enseignant
          </p>
        </div>

        {done ? (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 18, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
            <h2 style={{ margin: "0 0 10px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Demande envoyée !</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Votre demande a été transmise à <strong style={{ color: "#f1f5f9" }}>Prof. {done.teacherName}</strong> pour la classe <strong style={{ color: "#f1f5f9" }}>{done.classroomName}</strong>.
              <br /><br />
              Vous serez notifié dès que votre inscription sera validée. En attendant, vous pouvez continuer à apprendre en mode solo.
            </p>
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <Link href="/dashboard" style={{ background: "#10b981", color: "#fff", borderRadius: 12, padding: "14px 24px", fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center", display: "block" }}>
                → Retour au tableau de bord
              </Link>
              <Link href="/simulateur" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "13px 24px", fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
                🎙️ Pratiquer en attendant
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Code de classe</label>
              <div style={{ position: "relative" }}>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="DEUTSCH-A1-XXXX"
                  style={{ ...inp(), color: preview ? "#10b981" : "#f1f5f9", borderColor: preview ? "rgba(16,185,129,0.4)" : codeError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }}
                  autoFocus
                />
                {checking && (
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                )}
                {preview && !checking && (
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#10b981", fontSize: 18 }}>✓</div>
                )}
              </div>
              {codeError && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>⚠ {codeError}</div>}
            </div>

            {/* Preview card */}
            {preview && (
              <div style={{ marginTop: 20, background: `${levelColor}08`, border: `1px solid ${levelColor}25`, borderTop: `3px solid ${levelColor}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 800 }}>{preview.level}</span>
                  <h3 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>{preview.name}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "👨‍🏫", label: "Enseignant", value: `Prof. ${preview.teacherName}` },
                    ...(preview.centerName ? [{ icon: "🏫", label: "Centre", value: `${preview.centerName} — ${preview.centerCity}` }] : []),
                    { icon: "📍", label: "Ville", value: preview.teacherCity ?? "–" },
                    { icon: "👥", label: "Effectif", value: `${preview.enrolledCount} / ${preview.maxStudents} élèves` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, width: 80, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ color: "#f59e0b", fontSize: 12 }}>ℹ️ Votre inscription sera validée par l'enseignant avant d'avoir accès à la classe.</div>
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!preview || joining}
              style={{
                width: "100%", marginTop: 20,
                background: preview && !joining ? "#10b981" : "rgba(255,255,255,0.05)",
                color: preview && !joining ? "#fff" : "rgba(255,255,255,0.2)",
                border: "none", borderRadius: 12, padding: "14px",
                fontWeight: 700, fontSize: 15, cursor: preview && !joining ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              {joining ? "Envoi de la demande..." : preview ? `Rejoindre ${preview.name} →` : "Entrez un code valide"}
            </button>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Link href="/group/join" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "underline" }}>
                Vous avez un code groupe ? →
              </Link>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>← Retour au tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}

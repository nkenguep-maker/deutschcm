"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GroupPreview { id: string; name: string; code: string; level?: string; membersCount: number; maxMembers: number; creatorName: string; }

export default function GroupJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);
  const [debounce, setDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  const checkCode = async (val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (!trimmed.startsWith("GROUPE-") || trimmed.length < 13) { setPreview(null); setCodeError(""); return; }
    setChecking(true); setCodeError("");
    try {
      // We use the group GET endpoint to check
      const r = await fetch(`/api/group?code=${encodeURIComponent(trimmed)}`);
      if (r.ok) {
        const d = await r.json();
        if (d.group) {
          const g = d.group;
          setPreview({ id: g.id, name: g.name, code: g.code, level: g.level, membersCount: g.members.length, maxMembers: g.maxMembers, creatorName: g.creator.fullName });
          setCodeError("");
        } else { setPreview(null); setCodeError("Groupe introuvable"); }
      } else { setPreview(null); setCodeError("Code invalide"); }
    } catch { setCodeError("Erreur réseau"); }
    finally { setChecking(false); }
  };

  useEffect(() => {
    if (debounce) clearTimeout(debounce);
    const t = setTimeout(() => checkCode(code), 600);
    setDebounce(t);
    return () => clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (!preview) return;
    setJoining(true);
    try {
      const r = await fetch("/api/group", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code: code.trim().toUpperCase() }),
      });
      const d = await r.json();
      if (r.ok) { setDone(true); setTimeout(() => router.push("/group"), 2000); }
      else setCodeError(d.error ?? "Erreur inconnue");
    } finally { setJoining(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 460 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Rejoindre un groupe</h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Entrez le code partagé par votre ami</p>
        </div>

        {done ? (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 18, padding: "36px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ margin: "0 0 8px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>Bienvenue dans le groupe !</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Redirection vers votre groupe...</p>
          </div>
        ) : (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Code du groupe</label>
              <div style={{ position: "relative" }}>
                <input
                  value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="GROUPE-XXXXXX"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${preview ? "rgba(16,185,129,0.4)" : codeError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "13px 16px", color: preview ? "#10b981" : "#f1f5f9", fontSize: 15, outline: "none", fontFamily: "monospace", letterSpacing: "0.05em", boxSizing: "border-box", paddingRight: 40 }}
                  autoFocus
                />
                {checking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                {preview && !checking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#10b981", fontSize: 16 }}>✓</div>}
              </div>
              {codeError && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>⚠ {codeError}</div>}
            </div>

            {preview && (
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{preview.name}</h3>
                {[
                  { label: "Créateur", value: preview.creatorName, icon: "👤" },
                  { label: "Niveau", value: preview.level ?? "Tous niveaux", icon: "📊" },
                  { label: "Membres", value: `${preview.membersCount} / ${preview.maxMembers}`, icon: "👥" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, width: 70 }}>{label}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!preview || joining}
              style={{ width: "100%", background: preview ? "#10b981" : "rgba(255,255,255,0.05)", color: preview ? "#fff" : "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: preview ? "pointer" : "default" }}
            >
              {joining ? "Rejoindre..." : preview ? `Rejoindre ${preview.name} →` : "Entrez un code GROUPE-XXXXX"}
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 16, display: "flex", gap: 16, justifyContent: "center" }}>
          <Link href="/group/create" style={{ color: "#10b981", fontSize: 12 }}>+ Créer mon groupe</Link>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

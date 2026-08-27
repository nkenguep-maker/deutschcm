"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, Link } from "@/navigation";

interface GroupPreview { id: string; name: string; code: string; level?: string; membersCount: number; maxMembers: number; creatorName: string; }

export default function GroupJoinPage() {
  const locale = useLocale();
  const en = locale === "en";
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
      const r = await fetch(`/api/group?code=${encodeURIComponent(trimmed)}`);
      if (r.ok) {
        const d = await r.json();
        if (d.group) {
          const g = d.group;
          setPreview({ id: g.id, name: g.name, code: g.code, level: g.level, membersCount: g.members.length, maxMembers: g.maxMembers, creatorName: g.creator.fullName });
          setCodeError("");
        } else { setPreview(null); setCodeError(en ? "Group not found" : "Groupe introuvable"); }
      } else { setPreview(null); setCodeError(en ? "Invalid code" : "Code invalide"); }
    } catch { setCodeError(en ? "Network error. Try again." : "Le réseau a lâché. Réessayez."); }
    finally { setChecking(false); }
  };

  useEffect(() => {
    if (debounce) clearTimeout(debounce);
    const t = setTimeout(() => checkCode(code), 600);
    setDebounce(t);
    return () => clearTimeout(t);
  }, [code, en]); // eslint-disable-line react-hooks/exhaustive-deps

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
      else setCodeError(d.error ?? (en ? "Something went wrong. Try again." : "Ça coince de notre côté. Réessayez."));
    } finally { setJoining(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        input:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp var(--dur-moment) var(--ease-enter) forwards; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 460 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div aria-hidden="true" style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontWeight: 800, fontSize: 22 }}>{en ? "Join a group" : "Rejoindre un groupe"}</h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{en ? "Enter the code shared by your friend" : "Entrez le code partagé par votre ami"}</p>
        </div>

        {done ? (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 18, padding: "36px 28px", textAlign: "center" }}>
            <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ margin: "0 0 8px", color: "#10b981", fontWeight: 800, fontSize: 20 }}>{en ? "Welcome to the group!" : "Bienvenue dans le groupe !"}</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{en ? "Redirecting to your group…" : "Redirection vers votre groupe..."}</p>
          </div>
        ) : (
          <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="group-code" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>{en ? "Group code" : "Code du groupe"}</label>
              <div style={{ position: "relative" }}>
                <input id="group-code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="GROUPE-XXXXXX" autoComplete="off" spellCheck={false} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${preview ? "rgba(16,185,129,0.4)" : codeError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "13px 16px", color: preview ? "#10b981" : "#f1f5f9", fontSize: 16, outline: "none", fontFamily: "monospace", letterSpacing: "0.05em", boxSizing: "border-box", paddingRight: 40 }} autoFocus />
                {checking && <div aria-hidden="true" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, background: "var(--brass)", borderRadius: "50%", animation: "motion-pulse 960ms var(--ease-enter) infinite" }} />}
                {preview && !checking && <div aria-hidden="true" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#10b981", fontSize: 16 }}>✓</div>}
              </div>
              {codeError && <div role="alert" style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>⚠ {codeError}</div>}
            </div>

            {preview && (
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{preview.name}</h3>
                {[
                  { label: en ? "Creator" : "Créateur", value: preview.creatorName, icon: "👤" },
                  { label: en ? "Level" : "Niveau", value: preview.level ?? (en ? "All levels" : "Tous niveaux"), icon: "📊" },
                  { label: en ? "Members" : "Membres", value: `${preview.membersCount} / ${preview.maxMembers}`, icon: "👥" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span aria-hidden="true" style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
                    <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, width: 70 }}>{label}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={handleJoin} disabled={!preview || joining} style={{ width: "100%", background: preview ? "#10b981" : "rgba(255,255,255,0.05)", color: preview ? "#fff" : "rgba(255,255,255,0.45)", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: preview ? "pointer" : "default" }}>
              {joining ? (en ? "Joining…" : "Rejoindre...") : preview ? (en ? `Join ${preview.name} →` : `Rejoindre ${preview.name} →`) : (en ? "Enter a GROUPE-XXXXX code" : "Entrez un code GROUPE-XXXXX")}
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 16, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/group/create" style={{ color: "#10b981", fontSize: 13 }}>{en ? "+ Create my group" : "+ Créer mon groupe"}</Link>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{en ? "← Dashboard" : "← Dashboard"}</Link>
        </div>
      </div>
    </div>
  );
}

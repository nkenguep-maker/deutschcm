"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
    ...style,
  };
}

type PayStep = "form" | "confirm" | "done";

interface CreatedGroup { id: string; name: string; code: string; }

export default function GroupCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payStep, setPayStep] = useState<PayStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<CreatedGroup | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConfirm = () => {
    if (!name.trim()) { setError("Nom du groupe requis"); return; }
    if (!payMethod) { setError("Choisissez un mode de paiement"); return; }
    if (!payPhone.match(/^6\d{8}$/)) { setError("Format téléphone : 6XXXXXXXX"); return; }
    setError("");
    setPayStep("confirm");
  };

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/group", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: name.trim(), level: level || undefined, payPhone, payMethod }),
      });
      const d = await r.json();
      if (r.ok) { setGroup(d.group); setPayStep("done"); }
      else setError(d.error ?? "Erreur de paiement");
    } finally { setLoading(false); }
  };

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus, select:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        select option { background: #0d1117; color: #f1f5f9; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 500 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>👥</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
            Créer un groupe d'étude
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            1.500 XAF/mois · Max 10 membres · Gratuit pour vos amis
          </p>
        </div>

        <div style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>

          {payStep === "done" && group ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: "0 0 8px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Groupe créé !</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 24px" }}>Partagez ce code à vos amis pour qu'ils vous rejoignent.</p>
              <div style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.4)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Code du groupe</div>
                <div style={{ color: "#10b981", fontFamily: "monospace", fontWeight: 800, fontSize: 22, letterSpacing: "0.08em" }}>{group.code}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6 }}>Nom : {group.name}</div>
              </div>
              <button onClick={copyCode} style={{ width: "100%", background: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", color: copied ? "#10b981" : "rgba(255,255,255,0.6)", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 12, transition: "all 0.2s" }}>
                {copied ? "✓ Copié !" : "📋 Copier le code"}
              </button>
              <button onClick={() => router.push(`/group`)} style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Voir mon groupe →
              </button>
            </div>
          ) : payStep === "confirm" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Confirmer le paiement</h2>
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Groupe", value: name },
                  { label: "Niveau cible", value: level || "Tous niveaux" },
                  { label: "Montant", value: "1.500 XAF/mois" },
                  { label: "Mode", value: payMethod === "mtn" ? "MTN Mobile Money" : "Orange Money" },
                  { label: "Numéro", value: `+237 ${payPhone}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{label}</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center" }}>
                Vous recevrez une notification {payMethod === "mtn" ? "MTN" : "Orange"} pour confirmer le paiement de 1.500 XAF.
              </div>
              {error && <div style={{ color: "#ef4444", fontSize: 12 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPayStep("form")} style={{ flex: 1, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 13 }}>← Modifier</button>
                <button onClick={handlePay} disabled={loading} style={{ flex: 2, background: loading ? "rgba(16,185,129,0.5)" : "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {loading ? "Traitement..." : "✓ Confirmer et créer"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { icon: "🎯", text: "Défis collectifs" },
                    { icon: "🏆", text: "Classement interne" },
                    { icon: "💬", text: "Chat de groupe" },
                    { icon: "👥", text: "Max 10 membres" },
                    { icon: "💸", text: "Gratuit pour vos amis" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      <span>{icon}</span><span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Nom du groupe *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Les As du Deutsch, Team A1..." style={inp()} />
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Niveau cible</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => setLevel(level === l ? "" : l)} style={{
                      padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                      background: level === l ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${level === l ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: level === l ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Mode de paiement *</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ v: "mtn", label: "🟡 MTN Money" }, { v: "orange", label: "🟠 Orange Money" }].map(m => (
                    <button key={m.v} onClick={() => setPayMethod(m.v)} style={{
                      flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
                      background: payMethod === m.v ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${payMethod === m.v ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)"}`,
                      color: payMethod === m.v ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13,
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>

              {payMethod && (
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Numéro {payMethod.toUpperCase()} *</label>
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden" }}>
                    <span style={{ padding: "12px 12px 12px 14px", color: "rgba(255,255,255,0.3)", borderRight: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>+237</span>
                    <input value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="6XXXXXXXX" style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "monospace" }} />
                  </div>
                </div>
              )}

              {error && <div style={{ color: "#ef4444", fontSize: 12 }}>⚠ {error}</div>}

              <button onClick={handleConfirm} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
                Payer 1.500 XAF et créer →
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>← Retour au tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface CreatedGroup {
  id: string;
  name: string;
  code: string;
}

export default function GroupCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<CreatedGroup | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Nom du groupe requis");
      return;
    }
    if (cleanName.length > 80) {
      setError("80 caractères maximum");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: cleanName,
          level: level || undefined,
        }),
      });
      const d = await r.json();
      if (r.ok) setGroup(d.group);
      else setError(d.error ?? "Impossible de créer le groupe. Réessayez.");
    } catch {
      setError("Le réseau a lâché. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fadeUp { animation: fadeUp var(--dur-moment) var(--ease-enter) forwards; }
      `}</style>

      <main style={{ width: "100%", maxWidth: 520 }} className="fadeUp">
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>👥</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 23 }}>
            Créer un groupe d'étude
          </h1>
          <p style={{ margin: "9px 0 0", color: "rgba(255,255,255,0.52)", fontSize: 13, lineHeight: 1.6 }}>
            Bêta technique · création sans facturation
          </p>
        </header>

        <section style={{ background: "rgba(13,17,23,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28 }}>
          {group ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: "0 0 8px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
                Groupe créé
              </h2>
              <p style={{ color: "rgba(255,255,255,0.52)", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
                Partagez ce code uniquement aux personnes que vous voulez inviter.
              </p>

              <div style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.35)", borderRadius: 14, padding: "20px 24px", marginBottom: 18 }}>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                  Code du groupe
                </div>
                <div style={{ color: "#10b981", fontFamily: "monospace", fontWeight: 800, fontSize: 22, letterSpacing: "0.08em", overflowWrap: "anywhere" }}>
                  {group.code}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 7 }}>
                  {group.name}
                </div>
              </div>

              <button
                onClick={copyCode}
                style={{ width: "100%", background: copied ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.06)", color: copied ? "#10b981" : "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}
              >
                {copied ? "✓ Code copié" : "📋 Copier le code"}
              </button>
              <button
                onClick={() => router.push("/group")}
                style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Ouvrir mon groupe →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.16)", borderRadius: 12, padding: "13px 15px", color: "rgba(255,255,255,0.58)", fontSize: 12, lineHeight: 1.6 }}>
                Jusqu'à 10 membres · code privé · classement interne. Aucun paiement n'est demandé pendant la bêta technique.
              </div>

              <div>
                <label htmlFor="group-name" style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, textTransform: "uppercase" }}>
                  Nom du groupe
                </label>
                <input
                  id="group-name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Team A1 Berlin"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ textAlign: "right", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 5 }}>
                  {name.length}/80
                </div>
              </div>

              <div>
                <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Niveau cible · optionnel
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LEVELS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLevel(level === item ? "" : item)}
                      aria-pressed={level === item}
                      style={{ minWidth: 48, minHeight: 44, padding: "8px 13px", borderRadius: 9, cursor: "pointer", background: level === item ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${level === item ? "rgba(16,185,129,0.42)" : "rgba(255,255,255,0.09)"}`, color: level === item ? "#10b981" : "rgba(255,255,255,0.62)", fontWeight: 800 }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div role="alert" style={{ color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", fontSize: 12 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                style={{ minHeight: 48, background: loading || !name.trim() ? "rgba(16,185,129,0.35)" : "#10b981", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: loading || !name.trim() ? "default" : "pointer" }}
              >
                {loading ? "Création..." : "Créer le groupe →"}
              </button>
            </div>
          )}
        </section>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/group" style={{ color: "rgba(255,255,255,0.58)", fontSize: 13 }}>
            ← Retour aux groupes
          </Link>
        </div>
      </main>
    </div>
  );
}

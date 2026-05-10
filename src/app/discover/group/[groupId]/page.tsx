"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";

interface GroupMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  germanLevel: string | null;
}

interface GroupDetail {
  id: string;
  name: string;
  level: string | null;
  maxMembers: number;
  isActive: boolean;
  isPaid: boolean;
  priceXAF: number;
  code: string;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    city: string | null;
    germanLevel: string | null;
  };
  members: { user: GroupMember }[];
  _count: { members: number };
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#3b82f6",
  B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444",
};

const MOCK_ACTIVITIES = [
  { emoji: "💬", text: "Session de conversation hier soir", time: "Hier, 20h" },
  { emoji: "📝", text: "Quiz sur les déclinaisons complété", time: "Il y a 2j" },
  { emoji: "🎯", text: "Objectif hebdo atteint : 5 sessions", time: "Il y a 3j" },
  { emoji: "📚", text: "Chapitre 4 du Netzwerk A1 terminé", time: "Il y a 5j" },
];

const MOCK_RULES = [
  "Participer à au moins 2 sessions par semaine",
  "Rester bienveillant et encourageant",
  "Prévenir en cas d'absence aux sessions planifiées",
  "Contribuer aux corrections mutuelles",
];

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/social?action=group-detail&groupId=${groupId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.group) setGroup(d.group); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleSendRequest = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-join-group", groupId, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setSent(true);
      setShowModal(false);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const accentColor = "#10b981";

  if (loading) {
    return (
      <Layout title="Détail groupe">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Chargement...</div>
        </div>
      </Layout>
    );
  }

  const grp = group ?? {
    id: groupId,
    name: "Groupe Netzwerk A1",
    level: "A1",
    maxMembers: 8,
    isActive: true,
    isPaid: false,
    priceXAF: 0,
    code: "GRP-DEMO",
    createdAt: new Date().toISOString(),
    creator: { id: "u1", fullName: "Sylvie Mbarga", avatarUrl: null, city: "Yaoundé", germanLevel: "B1" },
    members: [
      { user: { id: "u2", fullName: "Ahmed T.", avatarUrl: null, germanLevel: "A1" } },
      { user: { id: "u3", fullName: "Clarisse F.", avatarUrl: null, germanLevel: "A1" } },
      { user: { id: "u4", fullName: "Patrick N.", avatarUrl: null, germanLevel: "A2" } },
    ],
    _count: { members: 3 },
  };

  const levelColor = LEVEL_COLORS[grp.level ?? "A1"] ?? accentColor;
  const spotsLeft = grp.maxMembers - (grp._count?.members ?? 0);
  const creatorInitials = grp.creator.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout title="Détail groupe">
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Back */}
        <button onClick={() => router.back()} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
          ← Retour
        </button>

        {/* Hero */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${levelColor}, ${levelColor}80)` }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                  {grp.level ?? "Tous niveaux"}
                </span>
                {grp.isPaid ? (
                  <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    💰 {grp.priceXAF.toLocaleString()} FCFA/mois
                  </span>
                ) : (
                  <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Gratuit</span>
                )}
              </div>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>{grp.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>
                Groupe d'étude pour apprendre l'allemand ensemble. Sessions régulières de conversation et exercices collaboratifs.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Membres", value: `${grp._count?.members ?? 0}/${grp.maxMembers}` },
              { label: "Places dispo.", value: spotsLeft > 0 ? `${spotsLeft}` : "Complet" },
              { label: "Niveau", value: grp.level ?? "Ouvert" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ color: "white", fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            {sent ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#10b98120", border: "1px solid #10b98140", borderRadius: 12, padding: "10px 20px", color: "#10b981", fontWeight: 700, fontSize: 14 }}>
                ✅ Demande envoyée ! Le créateur vous répondra bientôt.
              </div>
            ) : (
              <button onClick={() => setShowModal(true)} disabled={spotsLeft <= 0} style={{
                padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: spotsLeft > 0 ? "pointer" : "not-allowed",
                background: spotsLeft > 0 ? `linear-gradient(135deg, ${accentColor}, #059669)` : "rgba(255,255,255,0.05)",
                color: spotsLeft > 0 ? "white" : "rgba(255,255,255,0.3)", border: "none",
                opacity: spotsLeft > 0 ? 1 : 0.6,
              }}>
                {spotsLeft > 0 ? "📩 Demander à rejoindre" : "Groupe complet"}
              </button>
            )}
          </div>
        </div>

        {/* Creator */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>👑 Créateur du groupe</h2>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
              background: grp.creator.avatarUrl ? `url(${grp.creator.avatarUrl}) center/cover` : `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
              border: `2px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center",
              color: accentColor, fontWeight: 700, fontSize: 16,
            }}>
              {!grp.creator.avatarUrl && creatorInitials}
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{grp.creator.fullName}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                📍 {grp.creator.city ?? "Cameroun"} · Niveau {grp.creator.germanLevel ?? "?"}
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        {grp.members?.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
            <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              👥 Membres ({grp._count?.members ?? 0})
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {grp.members.slice(0, 12).map((m, i) => {
                const initials = m.user.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const lc = LEVEL_COLORS[m.user.germanLevel ?? ""] ?? accentColor;
                return (
                  <div key={m.user.id ?? i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${lc}30, ${lc}10)`, display: "flex", alignItems: "center", justifyContent: "center", color: lc, fontSize: 11, fontWeight: 700 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>{m.user.fullName}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{m.user.germanLevel ?? "?"}</div>
                    </div>
                  </div>
                );
              })}
              {grp._count?.members > 12 && (
                <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                  +{grp._count.members - 12} autres
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Activité récente</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_ACTIVITIES.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{a.emoji}</span>
                <span style={{ flex: 1, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{a.text}</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Règles du groupe</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_RULES.map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: accentColor, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        {!sent && (
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setShowModal(true)} disabled={spotsLeft <= 0} style={{
              padding: "14px 36px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: spotsLeft > 0 ? "pointer" : "not-allowed",
              background: spotsLeft > 0 ? `linear-gradient(135deg, ${accentColor}, #059669)` : "rgba(255,255,255,0.05)",
              color: spotsLeft > 0 ? "white" : "rgba(255,255,255,0.3)", border: "none",
              boxShadow: spotsLeft > 0 ? `0 8px 32px ${accentColor}40` : "none",
            }}>
              📩 Demander à rejoindre ce groupe
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>📩 Rejoindre le groupe</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 20px" }}>
              Votre demande sera envoyée à <strong style={{ color: "rgba(255,255,255,0.7)" }}>{grp.creator.fullName}</strong>, créateur du groupe.
            </p>

            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Bonjour, je souhaite rejoindre votre groupe car..."
              style={{
                width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 10, resize: "vertical",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />

            {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleSendRequest} disabled={sending} style={{
                flex: 2, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                background: `linear-gradient(135deg, ${accentColor}, #059669)`, color: "white", border: "none",
                opacity: sending ? 0.7 : 1,
              }}>
                {sending ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

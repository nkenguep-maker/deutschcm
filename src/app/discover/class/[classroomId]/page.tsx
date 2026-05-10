"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";

interface ClassroomDetail {
  id: string;
  name: string;
  description: string | null;
  level: string;
  code: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  teacher: {
    id: string;
    bio: string | null;
    speciality: string[];
    yearsExp: number | null;
    isVerified: boolean;
    user: {
      fullName: string;
      avatarUrl: string | null;
      city: string | null;
      germanLevel: string | null;
    };
  };
  enrollments: { userId: string }[];
  _count: { enrollments: number };
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#34d399", B1: "#3b82f6",
  B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444",
};

const MOCK_REVIEWS = [
  { name: "Amina K.", rating: 5, text: "Cours très bien structurés, le professeur explique avec beaucoup de patience. J'ai progressé rapidement.", level: "A2", ago: "il y a 2 mois" },
  { name: "Jean-Paul M.", rating: 4, text: "Excellent pour les débutants. Les sessions sont dynamiques et on pratique beaucoup l'oral.", level: "A1", ago: "il y a 3 mois" },
  { name: "Fatou D.", rating: 5, text: "J'ai passé mon DELF grâce à cette classe. Les devoirs sont utiles et le suivi est personnalisé.", level: "B1", ago: "il y a 5 mois" },
];

const MOCK_PROGRAMME = [
  { week: "Sem. 1-2", theme: "Présentations & alphabet allemand", type: "Grammaire" },
  { week: "Sem. 3-4", theme: "Nombres, dates & salutations", type: "Vocabulaire" },
  { week: "Sem. 5-6", theme: "Verbes réguliers au présent", type: "Grammaire" },
  { week: "Sem. 7-8", theme: "La famille et les relations", type: "Conversation" },
  { week: "Sem. 9-10", theme: "Achats & argent", type: "Pratique" },
  { week: "Sem. 11-12", theme: "Évaluation & révisions", type: "Quiz" },
];

const TYPE_COLORS: Record<string, string> = {
  Grammaire: "#3b82f6", Vocabulaire: "#10b981",
  Conversation: "#f59e0b", Pratique: "#8b5cf6", Quiz: "#ef4444",
};

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/social?action=classroom-detail&classroomId=${classroomId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.classroom) setClassroom(d.classroom); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classroomId]);

  const handleSendRequest = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-join-class", classroomId, message }),
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
      <Layout title="Détail classe">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Chargement...</div>
        </div>
      </Layout>
    );
  }

  const cls = classroom ?? {
    id: classroomId,
    name: "Classe Allemand Débutants",
    description: "Un cours intensif pour apprendre les bases de l'allemand. Adapté aux francophones, nous commençons de zéro et progressons ensemble à travers des exercices interactifs et des conversations pratiques.",
    level: "A1",
    code: "DEMO",
    maxStudents: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    teacher: {
      id: "t1",
      bio: "Professeur certifié Goethe-Institut avec 8 ans d'expérience. Spécialisé dans l'enseignement aux francophones africains.",
      speciality: ["A1", "A2", "B1"],
      yearsExp: 8,
      isVerified: true,
      user: { fullName: "Prof. Klaus Müller", avatarUrl: null, city: "Yaoundé", germanLevel: "C2" },
    },
    enrollments: [],
    _count: { enrollments: 14 },
  };

  const levelColor = LEVEL_COLORS[cls.level] ?? accentColor;
  const teacherInitials = cls.teacher.user.fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const spotsLeft = cls.maxStudents - (cls._count?.enrollments ?? 0);

  return (
    <Layout title="Détail classe">
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
                  {cls.level}
                </span>
                {cls.isActive && <span style={{ background: "#10b98120", color: "#10b981", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Active</span>}
              </div>
              <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>{cls.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{cls.description}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Élèves inscrits", value: `${cls._count?.enrollments ?? 0}/${cls.maxStudents}` },
              { label: "Places restantes", value: spotsLeft > 0 ? `${spotsLeft} dispo.` : "Complet" },
              { label: "Niveau", value: cls.level },
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
                ✅ Demande envoyée ! Le professeur vous répondra bientôt.
              </div>
            ) : (
              <button onClick={() => setShowModal(true)} disabled={spotsLeft <= 0} style={{
                padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: spotsLeft > 0 ? "pointer" : "not-allowed",
                background: spotsLeft > 0 ? `linear-gradient(135deg, ${accentColor}, #059669)` : "rgba(255,255,255,0.05)",
                color: spotsLeft > 0 ? "white" : "rgba(255,255,255,0.3)", border: "none", opacity: spotsLeft > 0 ? 1 : 0.6,
              }}>
                {spotsLeft > 0 ? "📩 Envoyer une demande d'inscription" : "Classe complète"}
              </button>
            )}
          </div>
        </div>

        {/* Teacher */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>👨‍🏫 Votre professeur</h2>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
              background: cls.teacher.user.avatarUrl ? `url(${cls.teacher.user.avatarUrl}) center/cover` : `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
              border: `2px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center",
              color: accentColor, fontWeight: 700, fontSize: 20,
            }}>
              {!cls.teacher.user.avatarUrl && teacherInitials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{cls.teacher.user.fullName}</span>
                {cls.teacher.isVerified && <span title="Vérifié" style={{ fontSize: 14 }}>✅</span>}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>
                📍 {cls.teacher.user.city ?? "Cameroun"} · {cls.teacher.yearsExp ?? "?"} ans d'expérience
              </div>
              {cls.teacher.bio && (
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{cls.teacher.bio}</p>
              )}
              {cls.teacher.speciality?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cls.teacher.speciality.map((s: string) => (
                    <span key={s} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Programme */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>📚 Programme indicatif</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_PROGRAMME.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, width: 60, flexShrink: 0 }}>{item.week}</span>
                <span style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{item.theme}</span>
                <span style={{ background: `${TYPE_COLORS[item.type] ?? accentColor}20`, color: TYPE_COLORS[item.type] ?? accentColor, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>⭐ Avis des anciens élèves</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, fontSize: 12, fontWeight: 700 }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Niveau {r.level} · {r.ago}</div>
                    </div>
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{r.text}</p>
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
              📩 Envoyer une demande d'inscription
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>📩 Demande d'inscription</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 20px" }}>
              Votre demande sera envoyée à <strong style={{ color: "rgba(255,255,255,0.7)" }}>{cls.teacher.user.fullName}</strong>.
            </p>

            <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Bonjour, je souhaite rejoindre votre classe car..."
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

"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import { useT } from "@/hooks/useT";

const ACTIVITY_TYPES = (tT: ReturnType<typeof useT>["teacher"]) => [
  { icon: "✍️", label: tT.activityTypeWriting,      color: "#6366f1" },
  { icon: "🎙️", label: tT.activityTypeSpeaking,    color: "#10b981" },
  { icon: "🧩", label: tT.activityTypeQuiz,         color: "#f59e0b" },
  { icon: "👂", label: tT.activityTypeComprehension, color: "#3b82f6" },
  { icon: "🔄", label: tT.activityTypeReview,       color: "#14b8a6" },
  { icon: "📝", label: tT.activityTypeFree,         color: "#e879f9" },
];

export default function ActivitiesPage() {
  const { teacher: tT, nav: tNav, common: tC } = useT();
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const types = ACTIVITY_TYPES(tT);

  return (
    <TeacherLayout title={tNav.activities}>
      <div style={{ maxWidth: 760 }}>

        {/* Subtitle */}
        <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
          {tT.activitiesSubtitle}
        </p>

        {/* Teacher validation note */}
        <div style={{ marginBottom: 28, padding: "14px 18px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: 1 }}>🛡️</span>
          <div>
            <p style={{ margin: "0 0 2px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>{tT.activityValidationRequired}</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>{tT.trustNote}</p>
          </div>
        </div>

        {!showForm ? (
          <>
            {/* Activity type grid */}
            <h2 style={{ margin: "0 0 16px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{tT.activityFieldType}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 12, marginBottom: 28 }}>
              {types.map((t, i) => (
                <button key={i} onClick={() => { setSelectedType(i); setShowForm(true); }} style={{
                  padding: "18px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: selectedType === i ? `${t.color}14` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedType === i ? `${t.color}35` : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: "1.3rem", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: `${t.color}15`, flexShrink: 0 }}>{t.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Coming soon note */}
            <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.5)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem" }}>
                ⚙️ {tC.comingSoon}
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", lineHeight: 1.5 }}>
                {tT.activitiesComingSoon}
              </p>
              <Link href="/teacher/assignments" style={{ display: "inline-block", marginTop: 12, color: "#10b981", fontSize: "0.72rem", textDecoration: "none" }}>
                → {tNav.corrections}
              </Link>
            </div>
          </>
        ) : (
          /* Draft creation form */
          <div>
            <button onClick={() => { setShowForm(false); setSelectedType(null); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", cursor: "pointer", marginBottom: 20, padding: 0 }}>
              ← {tC.back}
            </button>

            {selectedType !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: `${types[selectedType].color}10`, border: `1px solid ${types[selectedType].color}25` }}>
                <span style={{ fontSize: "1.3rem" }}>{types[selectedType].icon}</span>
                <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>{types[selectedType].label}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: tT.activityFieldClass,        ph: "Groupe A1 Matin" },
                { label: tT.activityFieldGoal,         ph: "Ex: Maîtriser les salutations formelles" },
                { label: tT.activityFieldInstructions, ph: "Décrivez la consigne pour vos apprenants…" },
                { label: tT.activityFieldDeadline,     ph: "JJ/MM/AAAA" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input placeholder={f.ph} style={{ width: "100%", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              {/* Validation checkbox — always ON */}
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(16,185,129,0.3)", border: "1px solid rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontSize: "0.75rem", flexShrink: 0 }}>✓</span>
                <span style={{ color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem" }}>{tT.activityValidationRequired}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => { setShowForm(false); setSelectedType(null); }} style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.8rem" }}>
                {tC.cancel}
              </button>
              <button style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(16,185,129,0.25)" }}>
                {tT.createActivityDraft}
              </button>
            </div>

            <p style={{ marginTop: 12, color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>{tT.studioPublishWarning}</p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

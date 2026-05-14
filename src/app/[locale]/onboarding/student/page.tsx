"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import OnboardingProgress from "@/components/OnboardingProgress";
import PhoneInput from "@/components/PhoneInput";

const CITIES = ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi"];
const GOALS = [
  { value: "Tourisme",   icon: "✈️",  label: "Tourisme",   desc: "Voyager en Allemagne ou en Autriche" },
  { value: "Travail",    icon: "💼",  label: "Travail",    desc: "Opportunités professionnelles" },
  { value: "Études",     icon: "🎓",  label: "Études",     desc: "Étudier dans un pays germanophone" },
  { value: "Goethe",     icon: "📜",  label: "Certificat Goethe", desc: "Passer l'examen officiel" },
  { value: "Famille",    icon: "👨‍👩‍👧", label: "Famille",   desc: "Regroupement familial" },
  { value: "Personnel",  icon: "🌱",  label: "Personnel",  desc: "Épanouissement et culture" },
];
const AVAILABILITIES = [
  { value: "15",  label: "15 min/jour",  desc: "Apprentissage express" },
  { value: "30",  label: "30 min/jour",  desc: "Rythme régulier" },
  { value: "60",  label: "1 heure/jour", desc: "Progression rapide" },
  { value: "90+", label: "1h30+/jour",   desc: "Immersion intensive" },
];
const SCHEDULES = [
  { value: "matin",        label: "🌅 Matin",        desc: "6h–12h" },
  { value: "apres-midi",   label: "☀️ Après-midi",   desc: "12h–18h" },
  { value: "soir",         label: "🌙 Soir",          desc: "18h–22h" },
  { value: "flexible",     label: "🔄 Flexible",      desc: "Peu importe" },
];

const STEPS = [
  { label: "Profil" },
  { label: "Objectif" },
  { label: "Disponibilité" },
];

interface ClassPreview { id: string; name: string; level: string; teacherName: string; enrolledCount: number; maxStudents: number; }
interface CenterPreview { id: string; name: string; city: string; teacherCount: number; studentCount: number; }

interface Form {
  firstName: string; lastName: string; dateOfBirth: string; gender: string;
  phone: string; city: string; avatarUrl: string;
  learningGoal: string;
  availability: string; preferredSchedule: string;
  learningType: string; classCode: string; centerCode: string; groupName: string; groupLevel: string;
}

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s",
    ...style,
  };
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [form, setForm] = useState<Form>({
    firstName: "", lastName: "", dateOfBirth: "", gender: "",
    phone: "", city: "", avatarUrl: "",
    learningGoal: "",
    availability: "", preferredSchedule: "",
    learningType: "", classCode: "", centerCode: "", groupName: "", groupLevel: "",
  });
  const [codeChecking, setCodeChecking] = useState(false);
  const [codePreview, setCodePreview] = useState<ClassPreview | null>(null);
  const [codeError, setCodeError] = useState("");
  const [centerChecking, setCenterChecking] = useState(false);
  const [centerPreview, setCenterPreview] = useState<CenterPreview | null>(null);
  const [centerCodeError, setCenterCodeError] = useState("");

  useEffect(() => {
    if (!form.classCode || form.classCode.length < 6) { setCodePreview(null); setCodeError(""); return; }
    setCodeChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/classroom/check-code/${encodeURIComponent(form.classCode.toUpperCase())}`);
        const d = await r.json();
        if (d.valid) { setCodePreview(d.classroom); setCodeError(""); }
        else { setCodePreview(null); setCodeError(d.error ?? "Code invalide"); }
      } catch { setCodeError("Erreur réseau"); }
      finally { setCodeChecking(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [form.classCode]);

  useEffect(() => {
    if (!form.centerCode || form.centerCode.length < 6) { setCenterPreview(null); setCenterCodeError(""); return; }
    setCenterChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/center/check-code/${encodeURIComponent(form.centerCode.toUpperCase())}`);
        const d = await r.json();
        if (d.valid) { setCenterPreview(d.center); setCenterCodeError(""); }
        else { setCenterPreview(null); setCenterCodeError(d.error ?? "Code invalide"); }
      } catch { setCenterCodeError("Erreur réseau"); }
      finally { setCenterChecking(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [form.centerCode]);

  const set = (k: keyof Form) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validateStep = () => {
    setErrors({});
    return true;
  };

  const saveAndNext = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "student",
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: form.phone, city: form.city,
          dateOfBirth: form.dateOfBirth, gender: form.gender,
          avatarUrl: form.avatarUrl || undefined,
          learningGoal: form.learningGoal || undefined,
          availability: form.availability || undefined,
          preferredSchedule: form.preferredSchedule || undefined,
          classCode: form.learningType === "classroom" ? form.classCode : undefined,
          studentType: form.learningType || undefined,
        }),
      });
      if (step < STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        // Final step: link to center if code provided, then mark onboarding complete
        if (form.learningType === "center" && form.centerCode) {
          await fetch("/api/center/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: form.centerCode }),
          });
        }
        const completeRes = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "STUDENT",
            profileData: {
              fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
              phone: form.phone,
              city: form.city,
              country: "Cameroun",
              dateOfBirth: form.dateOfBirth,
              learningGoal: form.learningGoal,
              availability: form.availability,
            }
          })
        });
        const completeData = await completeRes.json();
        document.cookie = "onboarding_done=true;path=/;max-age=2592000";
        if (form.learningType === "group_creator") router.push("/group/create");
        else router.push(completeData.redirectTo || "/test-niveau");
      }
    } finally {
      setSaving(false);
    }
  };

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18, padding: 28, backdropFilter: "blur(12px)", ...style,
  });

  const err = (k: keyof Form) => errors[k] ? (
    <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors[k]}</div>
  ) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, select:focus, textarea:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0d1117; color: #f1f5f9; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 560 }} className="fadeUp">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}></div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
            Bienvenue sur Yema
          </h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            Configurons votre profil pour personnaliser votre apprentissage
          </p>
        </div>

        <OnboardingProgress steps={STEPS} current={step} />

        <div style={card()}>
          {/* ── Step 0 : Profil ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 18 }}>Votre profil</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>PRÉNOM <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>(recommandé)</span></label>
                  <input value={form.firstName} onChange={e => set("firstName")(e.target.value)} placeholder="Marie" style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>NOM <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>(recommandé)</span></label>
                  <input value={form.lastName} onChange={e => set("lastName")(e.target.value)} placeholder="Nkolo" style={inp()} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>DATE DE NAISSANCE</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth")(e.target.value)} style={{ ...inp(), colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>GENRE</label>
                  <select value={form.gender} onChange={e => set("gender")(e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Choisir...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="N">Non binaire</option>
                    <option value="-">Préfère ne pas préciser</option>
                  </select>
                </div>
              </div>

              <PhoneInput value={form.phone} onChange={set("phone")} />

              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>VILLE</label>
                <select value={form.city} onChange={e => set("city")(e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                  <option value="">Sélectionner votre ville</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>PHOTO DE PROFIL <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>(optionnel)</span></label>
                <input value={form.avatarUrl} onChange={e => set("avatarUrl")(e.target.value)} placeholder="https://... ou laisser vide" style={inp()} />
              </div>
            </div>
          )}

          {/* ── Step 1 : Objectif ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 18 }}>Votre objectif</h2>
                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Pourquoi apprenez-vous l'allemand ? Cela nous aidera à personnaliser votre parcours.</p>
              </div>
              {err("learningGoal")}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GOALS.map(g => {
                  const active = form.learningGoal === g.value;
                  return (
                    <button key={g.value} onClick={() => set("learningGoal")(g.value)} style={{
                      display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                      background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{g.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{g.label}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{g.desc}</div>
                      </div>
                      {active && <span style={{ color: "#10b981", fontSize: 18 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2 : Disponibilité ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 18 }}>Votre disponibilité</h2>
                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Planifiez votre temps d'apprentissage quotidien.</p>
              </div>

              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Temps par jour</div>
                {err("availability")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {AVAILABILITIES.map(a => {
                    const active = form.availability === a.value;
                    return (
                      <button key={a.value} onClick={() => set("availability")(a.value)} style={{
                        background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 12, padding: "14px", cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                      }}>
                        <div style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{a.label}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>{a.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Horaire préféré</div>
                {err("preferredSchedule")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {SCHEDULES.map(s => {
                    const active = form.preferredSchedule === s.value;
                    return (
                      <button key={s.value} onClick={() => set("preferredSchedule")(s.value)} style={{
                        background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 12, padding: "12px", cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                      }}>
                        <div style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Comment souhaitez-vous apprendre ?
                </div>
                {errors.learningType && <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 8 }}>{errors.learningType}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { value: "center",        icon: "🏛️", label: "J'ai un code de centre",  desc: "Rejoindre un centre de langue partenaire" },
                    { value: "classroom",     icon: "🏫", label: "J'ai un code de classe",   desc: "Rejoindre la classe d'un enseignant" },
                    { value: "solo",          icon: "🎓", label: "J'étudie en solo",         desc: "Apprentissage autonome avec l'IA" },
                    { value: "group_creator", icon: "👥", label: "Créer un groupe d'étude",  desc: "Étudier avec des amis — 1.500 XAF/mois" },
                  ].map(opt => {
                    const active = form.learningType === opt.value;
                    return (
                      <button key={opt.value} onClick={() => { set("learningType")(opt.value); setErrors(e => ({ ...e, learningType: "" })); }} style={{
                        display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                        background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                      }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{opt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>{opt.desc}</div>
                        </div>
                        {active && <span style={{ color: "#10b981", fontSize: 18 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Option: centre code input */}
                {form.learningType === "center" && (
                  <div style={{ marginTop: 14, padding: "16px", background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12 }}>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                      Code de centre
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        value={form.centerCode}
                        onChange={e => { set("centerCode")(e.target.value.toUpperCase()); setCenterCodeError(""); }}
                        placeholder="YAO-XXXX"
                        style={{ ...inp(), fontFamily: "monospace", letterSpacing: "0.08em", color: centerPreview ? "#eab308" : "#f1f5f9", borderColor: centerPreview ? "rgba(234,179,8,0.4)" : centerCodeError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)", paddingRight: 40 }}
                      />
                      {centerChecking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#eab308", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                      {centerPreview && !centerChecking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#eab308" }}>✓</div>}
                    </div>
                    {centerCodeError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>⚠ {centerCodeError}</div>}
                    {centerPreview && (
                      <div style={{ marginTop: 10, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>🏛️ {centerPreview.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
                          📍 {centerPreview.city} · {centerPreview.teacherCount} enseignant{centerPreview.teacherCount > 1 ? "s" : ""} · {centerPreview.studentCount} élève{centerPreview.studentCount > 1 ? "s" : ""}
                        </div>
                        <div style={{ color: "#eab308", fontSize: 11, marginTop: 6 }}>ℹ️ Vous rejoindrez ce centre — un enseignant vous assignera une classe.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option A: classroom code input */}
                {form.learningType === "classroom" && (
                  <div style={{ marginTop: 14, padding: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Code de classe</label>
                    <div style={{ position: "relative" }}>
                      <input
                        value={form.classCode}
                        onChange={e => { set("classCode")(e.target.value.toUpperCase()); setErrors(err => ({ ...err, classCode: "" })); }}
                        placeholder="DEUTSCH-A1-XXXX"
                        style={{ ...inp(), fontFamily: "monospace", letterSpacing: "0.05em", color: codePreview ? "#10b981" : "#f1f5f9", borderColor: codePreview ? "rgba(16,185,129,0.4)" : codeError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)", paddingRight: 40 }}
                      />
                      {codeChecking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                      {codePreview && !codeChecking && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#10b981" }}>✓</div>}
                    </div>
                    {codeError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>⚠ {codeError}</div>}
                    {errors.classCode && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.classCode}</div>}
                    {codePreview && (
                      <div style={{ marginTop: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{codePreview.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
                          👨‍🏫 Prof. {codePreview.teacherName} · {codePreview.level} · {codePreview.enrolledCount}/{codePreview.maxStudents} élèves
                        </div>
                        <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 6 }}>ℹ️ Votre inscription sera validée par l'enseignant.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Option B: solo benefits */}
                {form.learningType === "solo" && (
                  <div style={{ marginTop: 14, padding: "14px 16px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12 }}>
                    {["🤖 Conversations IA illimitées", "🎯 Parcours adaptatif selon votre niveau", "📈 Progression à votre rythme", "🏆 Défis et badges individuels"].map(b => (
                      <div key={b} style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, padding: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{b.split(" ")[0]}</span><span>{b.split(" ").slice(1).join(" ")}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Option C: group info */}
                {form.learningType === "group_creator" && (
                  <div style={{ marginTop: 14, padding: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Nom du groupe *</label>
                      <input value={form.groupName} onChange={e => { set("groupName")(e.target.value); setErrors(err => ({ ...err, groupName: "" })); }} placeholder="ex: Les As du Deutsch" style={inp()} />
                      {errors.groupName && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.groupName}</div>}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Niveau cible</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["A1","A2","B1","B2","C1"].map(l => (
                          <button key={l} onClick={() => set("groupLevel")(form.groupLevel === l ? "" : l)} style={{
                            padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12,
                            background: form.groupLevel === l ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${form.groupLevel === l ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: form.groupLevel === l ? "#10b981" : "rgba(255,255,255,0.5)",
                          }}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, color: "#f59e0b", fontSize: 11 }}>💳 Paiement de 1.500 XAF/mois à l'étape suivante via Mobile Money.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 28 }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px",
                cursor: "pointer", fontSize: 13,
              }}>← Précédent</button>
            ) : <div />}
            <button onClick={saveAndNext} disabled={saving} style={{
              background: saving ? "rgba(16,185,129,0.5)" : "#10b981", color: "#fff",
              border: "none", borderRadius: 10, padding: "12px 28px",
              fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer",
              flex: step === 0 ? 1 : "unset",
            }}>
              {saving ? "Sauvegarde..." : step === STEPS.length - 1
                ? form.learningType === "group_creator" ? "Terminer → Créer mon groupe" : "Terminer → Test de niveau"
                : "Sauvegarder et continuer →"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Étape {step + 1} sur {STEPS.length} — Vos données sont sécurisées 🔒
        </div>
      </div>
    </div>
  );
}

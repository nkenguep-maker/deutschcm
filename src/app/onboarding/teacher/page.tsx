"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingProgress from "@/components/OnboardingProgress";
import PhoneInput from "@/components/PhoneInput";

const CITIES = ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DIPLOMAS = ["Licence en linguistique", "Master FLE", "DAAD", "Magistère", "PhD Linguistique", "Baccalauréat + expérience", "Autre"];
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS = ["matin", "apres-midi", "soir"];
const SLOT_LABELS: Record<string, string> = { matin: "🌅 Matin", "apres-midi": "☀️ A-midi", soir: "🌙 Soir" };

const STEPS = [
  { label: "Profil" },
  { label: "Expertise" },
  { label: "Disponibilité" },
  { label: "Centre" },
];

interface Availability { [day: string]: { [slot: string]: boolean } }

interface Form {
  firstName: string; lastName: string; dateOfBirth: string; gender: string;
  phone: string; city: string; avatarUrl: string; bio: string;
  levels: string[]; diploma: string; yearsExp: string; certifications: string;
  maxStudents: string; hourlyRate: string;
  availability: Availability;
  centerSearch: string; centerId: string; centerName: string; independent: boolean;
}

const defaultAvailability = (): Availability => {
  const a: Availability = {};
  DAYS.forEach(d => { a[d] = {}; SLOTS.forEach(s => { a[d][s] = false; }); });
  return a;
};

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
    ...style,
  };
}

const MOCK_CENTERS = [
  { id: "c1", name: "Institut Goethe Yaoundé", city: "Yaoundé" },
  { id: "c2", name: "Centre DeutschCM Douala", city: "Douala" },
  { id: "c3", name: "Alliance Francophone Bafoussam", city: "Bafoussam" },
];

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [form, setForm] = useState<Form>({
    firstName: "", lastName: "", dateOfBirth: "", gender: "",
    phone: "", city: "", avatarUrl: "", bio: "",
    levels: [], diploma: "", yearsExp: "", certifications: "",
    maxStudents: "20", hourlyRate: "",
    availability: defaultAvailability(),
    centerSearch: "", centerId: "", centerName: "", independent: false,
  });

  const set = (k: keyof Form, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const toggleLevel = (l: string) => {
    set("levels", form.levels.includes(l) ? form.levels.filter(x => x !== l) : [...form.levels, l]);
  };
  const toggleSlot = (day: string, slot: string) => {
    const a = { ...form.availability, [day]: { ...form.availability[day], [slot]: !form.availability[day][slot] } };
    set("availability", a);
  };

  const validate = () => {
    setErrors({});
    return true;
  };

  const saveAndNext = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "teacher",
          fullName: `${form.firstName} ${form.lastName}`,
          phone: form.phone, city: form.city, dateOfBirth: form.dateOfBirth,
          gender: form.gender, avatarUrl: form.avatarUrl || undefined,
          bio: form.bio, speciality: form.levels,
          diploma: form.diploma || undefined,
          yearsExp: form.yearsExp ? Number(form.yearsExp) : undefined,
          certifications: form.certifications ? form.certifications.split(",").map(s => s.trim()) : [],
          maxStudents: Number(form.maxStudents),
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
          availabilitySchedule: form.availability,
          centerId: form.independent ? undefined : (form.centerId || undefined),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[onboarding/teacher]", err);
      }
      if (step < STEPS.length - 1) {
        setStep(s => s + 1);
      } else {
        await fetch("/api/onboarding/complete", { method: "POST" });
        document.cookie = "onboarding_done=true;path=/;max-age=2592000";
        router.push("/teacher");
      }
    } catch (err) {
      console.error("[saveAndNext]", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredCenters = MOCK_CENTERS.filter(c =>
    c.name.toLowerCase().includes(form.centerSearch.toLowerCase()) ||
    c.city.toLowerCase().includes(form.centerSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus, select:focus, textarea:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        select option { background: #0d1117; color: #f1f5f9; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 580 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>👨‍🏫</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Profil Enseignant</h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Renseignez vos informations pour accéder à votre espace enseignant</p>
        </div>

        <OnboardingProgress steps={STEPS} current={step} />

        <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>

          {/* ── Step 0 : Profil perso ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Informations personnelles</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>PRÉNOM <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>(recommandé)</span></label>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jean-Pierre" style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NOM <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>(recommandé)</span></label>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Nkolo" style={inp()} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>DATE DE NAISSANCE</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} style={{ ...inp(), colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>GENRE</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Choisir...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="N">Non binaire</option>
                  </select>
                </div>
              </div>
              <PhoneInput value={form.phone} onChange={v => set("phone", v)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>VILLE</label>
                  <select value={form.city} onChange={e => set("city", e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Sélectionner...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>PHOTO <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
                  <input value={form.avatarUrl} onChange={e => set("avatarUrl", e.target.value)} placeholder="URL photo" style={inp()} />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>BIO <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>(max 300 caractères)</span></label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Présentez-vous en quelques phrases..." rows={3}
                  style={{ ...inp(), resize: "none" } as React.CSSProperties} />
                <div style={{ color: form.bio.length > 280 ? "#f59e0b" : "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 4, textAlign: "right" }}>{form.bio.length}/300</div>
                {errors.bio && <div style={{ color: "#ef4444", fontSize: 11 }}>{errors.bio}</div>}
              </div>
            </div>
          )}

          {/* ── Step 1 : Expertise ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Expertise pédagogique</h2>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>NIVEAUX ENSEIGNÉS *</label>
                {errors.levels && <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 6 }}>{errors.levels}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LEVELS.map(l => {
                    const active = form.levels.includes(l);
                    return (
                      <button key={l} onClick={() => toggleLevel(l)} style={{
                        padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                        background: active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: active ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                        transition: "all 0.15s",
                      }}>{l}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>DIPLÔME</label>
                  <select value={form.diploma} onChange={e => set("diploma", e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Sélectionner...</option>
                    {DIPLOMAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>ANNÉES D'EXPÉRIENCE</label>
                  <input type="number" min="0" max="50" value={form.yearsExp} onChange={e => set("yearsExp", e.target.value)} placeholder="ex: 5" style={inp()} />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>CERTIFICATIONS <span style={{ fontWeight: 400 }}>(séparées par virgule)</span></label>
                <input value={form.certifications} onChange={e => set("certifications", e.target.value)} placeholder="ex: Goethe-Zertifikat B2, DAAD, TestDaF..." style={inp()} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>JUSTIFICATIFS</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>📎 Upload de diplômes — disponible après validation du compte</div>
              </div>
            </div>
          )}

          {/* ── Step 2 : Disponibilité ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Disponibilités & tarif</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textAlign: "left", padding: "0 0 8px", width: 80 }}>JOUR</th>
                      {SLOTS.map(s => <th key={s} style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, padding: "0 0 8px 8px", textAlign: "center" }}>{SLOT_LABELS[s]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, padding: "4px 0", fontWeight: 600 }}>{day}</td>
                        {SLOTS.map(slot => {
                          const on = form.availability[day]?.[slot];
                          return (
                            <td key={slot} style={{ padding: "4px 8px", textAlign: "center" }}>
                              <button onClick={() => toggleSlot(day, slot)} style={{
                                width: 36, height: 28, borderRadius: 6, cursor: "pointer",
                                background: on ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${on ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                                color: on ? "#10b981" : "rgba(255,255,255,0.15)", fontSize: 12,
                                transition: "all 0.15s",
                              }}>{on ? "✓" : "—"}</button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>ÉLÈVES MAX / CLASSE</label>
                  <input type="number" min="1" max="60" value={form.maxStudents} onChange={e => set("maxStudents", e.target.value)} style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>TARIF HORAIRE (XAF)</label>
                  <input type="number" min="0" value={form.hourlyRate} onChange={e => set("hourlyRate", e.target.value)} placeholder="ex: 5000" style={inp()} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 : Centre ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Rattachement au centre</h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Êtes-vous affilié à un centre de langues partenaire ?</p>

              <button onClick={() => set("independent", !form.independent)} style={{
                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                background: form.independent ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${form.independent ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "14px 16px", cursor: "pointer",
              }}>
                <span style={{ fontSize: 22 }}>🧑‍💻</span>
                <div>
                  <div style={{ color: form.independent ? "#10b981" : "#f1f5f9", fontWeight: 700, fontSize: 14 }}>Je suis indépendant</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Je gère mes propres élèves sans affiliation</div>
                </div>
                {form.independent && <span style={{ marginLeft: "auto", color: "#10b981" }}>✓</span>}
              </button>

              {!form.independent && (
                <>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>RECHERCHER UN CENTRE</label>
                    <input value={form.centerSearch} onChange={e => set("centerSearch", e.target.value)} placeholder="Nom du centre ou ville..." style={inp()} />
                  </div>
                  {errors.centerId && <div style={{ color: "#ef4444", fontSize: 11 }}>{errors.centerId}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredCenters.map(c => {
                      const selected = form.centerId === c.id;
                      return (
                        <button key={c.id} onClick={() => { set("centerId", c.id); set("centerName", c.name); }} style={{
                          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                          background: selected ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${selected ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                        }}>
                          <span style={{ fontSize: 18 }}>🏫</span>
                          <div>
                            <div style={{ color: selected ? "#10b981" : "#f1f5f9", fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{c.city}</div>
                          </div>
                          {selected && <span style={{ marginLeft: "auto", color: "#10b981" }}>✓</span>}
                        </button>
                      );
                    })}
                    {filteredCenters.length === 0 && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>Aucun centre trouvé</div>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24 }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontSize: 13 }}>← Précédent</button>
            ) : <div />}
            <button onClick={saveAndNext} disabled={saving} style={{ background: saving ? "rgba(16,185,129,0.5)" : "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {saving ? "Sauvegarde..." : step === STEPS.length - 1 ? "Terminer →" : "Continuer →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

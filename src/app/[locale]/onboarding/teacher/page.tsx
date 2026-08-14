"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import OnboardingProgress from "@/components/OnboardingProgress";
import PhoneInput from "@/components/PhoneInput";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const STEPS = [{ label: "Profil" }, { label: "Expertise" }, { label: "Disponibilité" }];

function inputStyle(): React.CSSProperties {
  return { width: "100%", background: "rgba(244,235,220,.04)", border: "1px solid rgba(244,235,220,.12)", borderRadius: 10, padding: "12px 14px", color: "var(--creme)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
}

export default function TeacherOnboardingPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [diploma, setDiploma] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [certifications, setCertifications] = useState("");
  const [maxStudents, setMaxStudents] = useState("20");
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const me = await response.json() as { firstName?: string | null; lastName?: string | null; phone?: string | null; city?: string | null };
        setFirstName((current) => current || me.firstName || "");
        setLastName((current) => current || me.lastName || "");
        setPhone((current) => current || me.phone || "");
        setCity((current) => current || me.city || "");
      })
      .catch(() => undefined);
  }, []);

  const fullName = useMemo(() => `${firstName.trim()} ${lastName.trim()}`.trim(), [firstName, lastName]);

  function toggleLevel(level: string) { setLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level]); }
  function toggleDay(day: string) { setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]); }

  function validateCurrentStep(): boolean {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) { setError(loc === "en" ? "First and last name are required." : "Le prénom et le nom sont requis."); return false; }
    if (step === 1 && levels.length === 0) { setError(loc === "en" ? "Choose at least one teaching level." : "Choisissez au moins un niveau enseigné."); return false; }
    if (step === 2 && days.length === 0) { setError(loc === "en" ? "Choose at least one available day." : "Choisissez au moins un jour de disponibilité."); return false; }
    setError(null); return true;
  }

  async function next() {
    if (!validateCurrentStep()) return;
    if (step < STEPS.length - 1) { setStep((value) => value + 1); return; }

    setSaving(true); setError(null);
    try {
      const profileResponse = await fetch("/api/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "teacher", fullName, phone: phone.trim() || undefined, city: city.trim() || undefined, bio: bio.trim(), speciality: levels, diploma: diploma.trim() || undefined, yearsExp: yearsExp ? Number(yearsExp) : undefined, certifications: certifications.split(",").map((value) => value.trim()).filter(Boolean), maxStudents: Math.max(1, Number(maxStudents) || 20), availabilitySchedule: { days } }),
      });
      if (!profileResponse.ok) throw new Error("teacher_profile_failed");

      const completeResponse = await fetch("/api/onboarding/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: "teacher", role: "TEACHER", profileData: { firstName: firstName.trim(), lastName: lastName.trim(), fullName, phone: phone.trim() || undefined, city: city.trim() || undefined, bio: bio.trim() || undefined, qualifications: diploma.trim() || undefined, teachingLevels: levels.join(","), availability: JSON.stringify({ days }) } }),
      });
      const completed = await completeResponse.json().catch(() => ({}));
      if (!completeResponse.ok || typeof completed.redirectTo !== "string") throw new Error(completed.code ?? "teacher_completion_failed");
      router.push(completed.redirectTo); router.refresh();
    } catch {
      setError(loc === "en" ? "We could not finish your Teacher profile. Please try again." : "Nous n’avons pas pu terminer votre profil Enseignant. Réessayez.");
    } finally { setSaving(false); }
  }

  return (
    <main className="onboarding-professional-shell" style={{ minHeight: "100vh", background: "var(--espresso)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <SeuilGreetings locale={loc} visibleCount={3} pool="world" variant="entry" />
      <div style={{ width: "100%", maxWidth: 620 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ margin: 0, color: "var(--creme)", fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26 }}>{loc === "en" ? "Teacher profile" : "Profil Enseignant"}</h1>
          <p style={{ color: "rgba(244,235,220,.62)", fontSize: 13 }}>{loc === "en" ? "Your saved identity is reused here. Professional access remains server-verified." : "Votre identité enregistrée est reprise ici. L’accès professionnel reste vérifié côté serveur."}</p>
        </div>
        <OnboardingProgress steps={STEPS} current={step} />
        <section style={{ marginTop: 18, background: "rgba(36,24,18,.85)", border: "1px solid rgba(244,235,220,.09)", borderRadius: 18, padding: 28 }}>
          {step === 0 ? <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span className="entry-field-lbl">{loc === "en" ? "First name" : "Prénom"}</span><input style={inputStyle()} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></label>
              <label><span className="entry-field-lbl">{loc === "en" ? "Last name" : "Nom"}</span><input style={inputStyle()} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></label>
            </div>
            <PhoneInput value={phone} onChange={setPhone} />
            <label><span className="entry-field-lbl">{loc === "en" ? "City" : "Ville"}</span><input style={inputStyle()} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" /></label>
            <label><span className="entry-field-lbl">Bio</span><textarea style={{ ...inputStyle(), resize: "vertical" }} rows={4} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
          </div> : null}

          {step === 1 ? <div style={{ display: "grid", gap: 16 }}>
            <div><span className="entry-field-lbl">{loc === "en" ? "Teaching levels" : "Niveaux enseignés"}</span><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{LEVELS.map((level) => <button key={level} type="button" onClick={() => toggleLevel(level)} className="entry-cta entry-cta-ghost" style={{ width: "auto" }} aria-pressed={levels.includes(level)}>{level}</button>)}</div></div>
            <label><span className="entry-field-lbl">{loc === "en" ? "Diploma / qualification" : "Diplôme / qualification"}</span><input style={inputStyle()} value={diploma} onChange={(e) => setDiploma(e.target.value)} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span className="entry-field-lbl">{loc === "en" ? "Years of experience" : "Années d’expérience"}</span><input type="number" min={0} style={inputStyle()} value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} /></label>
              <label><span className="entry-field-lbl">{loc === "en" ? "Max learners" : "Maximum d’élèves"}</span><input type="number" min={1} style={inputStyle()} value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} /></label>
            </div>
            <label><span className="entry-field-lbl">Certifications</span><input style={inputStyle()} value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder={loc === "en" ? "Comma-separated" : "Séparées par des virgules"} /></label>
          </div> : null}

          {step === 2 ? <div style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: 0, color: "rgba(244,235,220,.72)" }}>{loc === "en" ? "Which days can learners usually reach you?" : "Quels jours les apprenants peuvent-ils généralement vous retrouver ?"}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{DAYS.map((day) => <button key={day} type="button" onClick={() => toggleDay(day)} className="entry-cta entry-cta-ghost" style={{ width: "auto" }} aria-pressed={days.includes(day)}>{day}</button>)}</div>
            <div className="entry-context" role="note"><span className="entry-context-dot" aria-hidden="true" /><span className="entry-context-text">{loc === "en" ? "Center association is handled through trusted Center/Teacher workflows, not a mocked center list." : "Le rattachement à un centre passe par les workflows Centre/Enseignant vérifiés, jamais par une liste de centres fictifs."}</span></div>
          </div> : null}

          {error ? <p className="entry-err" role="alert">{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
            <button type="button" className="entry-cta entry-cta-ghost" style={{ width: "auto" }} disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))}>{loc === "en" ? "Back" : "Retour"}</button>
            <button type="button" className="entry-cta entry-cta-primary" style={{ width: "auto" }} disabled={saving} onClick={next}>{saving ? (loc === "en" ? "Saving…" : "Enregistrement…") : step === STEPS.length - 1 ? (loc === "en" ? "Open my Teacher space" : "Ouvrir mon espace Enseignant") : (loc === "en" ? "Continue" : "Continuer")}</button>
          </div>
        </section>
      </div>
    </main>
  );
}

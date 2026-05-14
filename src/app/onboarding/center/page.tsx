"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingProgress from "@/components/OnboardingProgress";
import PhoneInput from "@/components/PhoneInput";

const REGIONS = ["Centre", "Littoral", "Ouest", "Nord-Ouest", "Sud-Ouest", "Adamaoua", "Nord", "Extrême-Nord", "Est", "Sud"];
const CITIES: Record<string, string[]> = {
  "Centre": ["Yaoundé", "Mbalmayo", "Eséka"],
  "Littoral": ["Douala", "Nkongsamba", "Loum"],
  "Ouest": ["Bafoussam", "Dschang", "Bangangté"],
  "Nord-Ouest": ["Bamenda", "Kumbo", "Wum"],
  "Sud-Ouest": ["Buea", "Limbe", "Kumba"],
  "Adamaoua": ["Ngaoundéré", "Meiganga"],
  "Nord": ["Garoua", "Guider"],
  "Extrême-Nord": ["Maroua", "Mora", "Kousséri"],
  "Est": ["Bertoua", "Batouri"],
  "Sud": ["Ebolowa", "Kribi", "Sangmélima"],
};
const CENTER_TYPES = ["École de langues privée", "Centre culturel", "Institut académique", "Organisme de formation", "Centre communautaire", "Alliance", "Autre"];
const ADMIN_ROLES = ["Admin", "Manager", "Secrétaire"];
const PLANS = [
  { id: "starter", name: "Starter", price: 25000, admins: 3, teachers: 10, students: 100, highlight: false },
  { id: "pro",     name: "Pro",     price: 75000, admins: 10, teachers: 30, students: 300, highlight: true  },
  { id: "enterprise", name: "Enterprise", price: 150000, admins: 20, teachers: 100, students: 1000, highlight: false },
];

const STEPS = [
  { label: "Identité" },
  { label: "Localisation" },
  { label: "Capacité" },
  { label: "Équipe" },
  { label: "Abonnement" },
];

interface AdminInvite { email: string; role: string; }
interface Form {
  name: string; centerType: string; foundedAt: string; rccm: string; logoUrl: string;
  region: string; city: string; quartier: string; address: string;
  phone: string; email: string; website: string;
  facebook: string; linkedin: string; whatsapp: string;
  nbTeachers: string; nbStudents: string; languages: string[];
  openMorning: string; openEvening: string; nbRooms: string;
  admins: AdminInvite[]; plan: string;
  payMethod: string; payPhone: string;
  payStep: "form" | "confirm" | "done";
}

const LANGS = ["Allemand", "Anglais", "Français", "Espagnol", "Chinois", "Arabe", "Portugais"];

function inp(style?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
    ...style,
  };
}

export default function CenterOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [centerId, setCenterId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    name: "", centerType: "", foundedAt: "", rccm: "", logoUrl: "",
    region: "", city: "", quartier: "", address: "",
    phone: "", email: "", website: "",
    facebook: "", linkedin: "", whatsapp: "",
    nbTeachers: "", nbStudents: "", languages: [],
    openMorning: "08:00", openEvening: "18:00", nbRooms: "",
    admins: [{ email: "", role: "Admin" }],
    plan: "pro", payMethod: "", payPhone: "",
    payStep: "form",
  });

  const set = (k: keyof Form, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };
  const toggleLang = (l: string) =>
    set("languages", form.languages.includes(l) ? form.languages.filter(x => x !== l) : [...form.languages, l]);

  const addAdmin = () => {
    if (form.admins.length < 5) set("admins", [...form.admins, { email: "", role: "Manager" }]);
  };
  const setAdmin = (i: number, k: keyof AdminInvite, v: string) => {
    const a = form.admins.map((ad, idx) => idx === i ? { ...ad, [k]: v } : ad);
    set("admins", a);
  };
  const removeAdmin = (i: number) => set("admins", form.admins.filter((_, idx) => idx !== i));

  const validate = () => {
    const e: Partial<Form> = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Nom du centre requis";
      if (!form.centerType) e.centerType = "Type requis";
    }
    if (step === 1) {
      if (form.email && !form.email.includes("@")) e.email = "Email invalide";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveStep = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (step === 4) {
        if (form.payStep === "form") { set("payStep", "confirm"); setSaving(false); return; }
        if (form.payStep === "confirm") {
          await new Promise(r => setTimeout(r, 1200));
          set("payStep", "done");
          setSaving(false);
          await fetch("/api/onboarding/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "CENTER_MANAGER",
              profileData: {
                fullName: form.name,
                phone: form.phone,
                city: form.city,
                country: "Cameroun",
                centerName: form.name,
                centerAddress: form.address,
                centerCity: form.city,
                centerWebsite: form.website,
              }
            })
          });
          document.cookie = "onboarding_done=true;path=/;max-age=2592000";
          setTimeout(() => router.push("/center"), 1500);
          return;
        }
      }
      if (step === 0 && !centerId) {
        const r = await fetch("/api/onboarding", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "center", name: form.name, centerType: form.centerType,
            foundedAt: form.foundedAt || undefined, rccm: form.rccm || undefined,
            logoUrl: form.logoUrl || undefined,
            region: form.region || undefined, city: form.city || "–",
            address: form.address || undefined, phone: form.phone || undefined,
            email: form.email || undefined, website: form.website || undefined,
            socialMedia: { facebook: form.facebook, linkedin: form.linkedin, whatsapp: form.whatsapp },
            openingHours: { open: form.openMorning, close: form.openEvening },
          }),
        });
        if (r.ok) { const d = await r.json(); setCenterId(d.center?.id ?? null); }
      }
      if (step < STEPS.length - 1) setStep(s => s + 1);
    } finally { setSaving(false); }
  };

  const selectedPlan = PLANS.find(p => p.id === form.plan)!;

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        input:focus, select:focus, textarea:focus { border-color: rgba(16,185,129,0.5) !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .fadeUp { animation: fadeUp 0.4s ease forwards; }
        select option { background: #0d1117; color: #f1f5f9; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 620 }} className="fadeUp">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🏫</div>
          <h1 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Créer votre Centre</h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Enregistrez votre centre de langues sur la plateforme Yema</p>
        </div>

        <OnboardingProgress steps={STEPS} current={step} />

        <div style={{ background: "rgba(13,17,23,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>

          {/* ── Step 0 : Identité ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Identité du centre</h2>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NOM DU CENTRE *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Institut Goethe de Yaoundé" style={inp()} />
                {errors.name && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>TYPE DE CENTRE *</label>
                  <select value={form.centerType} onChange={e => set("centerType", e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Choisir...</option>
                    {CENTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.centerType && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.centerType}</div>}
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>DATE DE CRÉATION</label>
                  <input type="date" value={form.foundedAt} onChange={e => set("foundedAt", e.target.value)} style={{ ...inp(), colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>N° RCCM <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
                <input value={form.rccm} onChange={e => set("rccm", e.target.value)} placeholder="ex: YAO/RC/0099/B" style={inp()} />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>LOGO URL <span style={{ fontWeight: 400 }}>(optionnel)</span></label>
                <input value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." style={inp()} />
              </div>
            </div>
          )}

          {/* ── Step 1 : Localisation ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Localisation & contacts</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>RÉGION *</label>
                  <select value={form.region} onChange={e => { set("region", e.target.value); set("city", ""); }} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                    <option value="">Choisir...</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.region && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.region}</div>}
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>VILLE *</label>
                  <select value={form.city} onChange={e => set("city", e.target.value)} disabled={!form.region} style={{ ...inp(), appearance: "none", opacity: form.region ? 1 : 0.5 } as React.CSSProperties}>
                    <option value="">Choisir...</option>
                    {(CITIES[form.region] ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.city}</div>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>QUARTIER</label>
                  <input value={form.quartier} onChange={e => set("quartier", e.target.value)} placeholder="ex: Bastos, Bonanjo..." style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>ADRESSE COMPLÈTE</label>
                  <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rue, BP..." style={inp()} />
                </div>
              </div>
              <PhoneInput value={form.phone} onChange={v => set("phone", v)} />
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>EMAIL</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@centre.cm" style={inp()} />
                {errors.email && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.email}</div>}
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>SITE WEB</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://moncentre.cm" style={inp()} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { k: "facebook" as keyof Form, icon: "📘", ph: "Page Facebook" },
                  { k: "linkedin" as keyof Form, icon: "💼", ph: "LinkedIn" },
                  { k: "whatsapp" as keyof Form, icon: "💬", ph: "WhatsApp groupe" },
                ].map(({ k, icon, ph }) => (
                  <div key={k as string}>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, display: "block", marginBottom: 5 }}>{icon} {(k as string).toUpperCase()}</label>
                    <input value={form[k] as string} onChange={e => set(k, e.target.value)} placeholder={ph} style={{ ...inp(), fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2 : Capacité ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Capacité & langues</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NB ENSEIGNANTS</label>
                  <input type="number" min="1" value={form.nbTeachers} onChange={e => set("nbTeachers", e.target.value)} placeholder="ex: 5" style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NB ÉLÈVES</label>
                  <input type="number" min="1" value={form.nbStudents} onChange={e => set("nbStudents", e.target.value)} placeholder="ex: 80" style={inp()} />
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NB SALLES</label>
                  <input type="number" min="1" value={form.nbRooms} onChange={e => set("nbRooms", e.target.value)} placeholder="ex: 4" style={inp()} />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>LANGUES ENSEIGNÉES</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LANGS.map(l => {
                    const active = form.languages.includes(l);
                    return (
                      <button key={l} onClick={() => toggleLang(l)} style={{
                        padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                        background: active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.07)"}`,
                        color: active ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13,
                        transition: "all 0.15s",
                      }}>{l}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>HORAIRES D'OUVERTURE</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 4 }}>Ouverture</div>
                    <input type="time" value={form.openMorning} onChange={e => set("openMorning", e.target.value)} style={{ ...inp(), colorScheme: "dark" }} />
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, paddingTop: 20 }}>—</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 4 }}>Fermeture</div>
                    <input type="time" value={form.openEvening} onChange={e => set("openEvening", e.target.value)} style={{ ...inp(), colorScheme: "dark" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 : Équipe ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Inviter l'équipe de gestion</h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Invitez jusqu'à 5 administrateurs pour gérer votre centre.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.admins.map((admin, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      {i === 0 && <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>EMAIL</label>}
                      <input value={admin.email} onChange={e => setAdmin(i, "email", e.target.value)} placeholder="email@centre.cm" style={inp()} />
                    </div>
                    <div style={{ width: 130 }}>
                      {i === 0 && <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>RÔLE</label>}
                      <select value={admin.role} onChange={e => setAdmin(i, "role", e.target.value)} style={{ ...inp(), appearance: "none" } as React.CSSProperties}>
                        {ADMIN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {i > 0 && (
                      <button onClick={() => removeAdmin(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, paddingBottom: 8 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
              {form.admins.length < 5 && (
                <button onClick={addAdmin} style={{ background: "rgba(16,185,129,0.06)", border: "1px dashed rgba(16,185,129,0.25)", borderRadius: 10, padding: "10px", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  + Ajouter un administrateur
                </button>
              )}
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>ℹ️ Invitations par email</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Chaque personne invitée recevra un email pour créer son compte avec le rôle assigné.</div>
              </div>
            </div>
          )}

          {/* ── Step 4 : Abonnement ── */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {form.payStep === "done" ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                  <div style={{ color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Centre créé avec succès !</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 8 }}>Redirection vers votre tableau de bord...</div>
                </div>
              ) : form.payStep === "confirm" ? (
                <>
                  <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Confirmer le paiement</h2>
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Plan</span>
                      <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Yema {selectedPlan.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Montant</span>
                      <span style={{ color: "#10b981", fontWeight: 700, fontSize: 18 }}>{selectedPlan.price.toLocaleString()} XAF</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Numéro facturé</span>
                      <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>+237 {form.payPhone}</span>
                    </div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center" }}>
                    Vous recevrez une notification {form.payMethod === "mtn" ? "MTN Mobile Money" : "Orange Money"} pour confirmer.
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ margin: 0, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 17 }}>Choisir votre abonnement</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {PLANS.map(p => {
                      const active = form.plan === p.id;
                      return (
                        <button key={p.id} onClick={() => set("plan", p.id)} style={{
                          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                          background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${active ? "rgba(16,185,129,0.4)" : p.highlight ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`,
                          borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                          position: "relative",
                        }}>
                          {p.highlight && <span style={{ position: "absolute", top: -10, right: 12, background: "#f59e0b", color: "#000", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>POPULAIRE</span>}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                              <span style={{ color: active ? "#10b981" : "#f1f5f9", fontWeight: 800, fontSize: 15 }}>{p.price.toLocaleString()} XAF<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 400 }}>/mois</span></span>
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
                              {p.admins} admins · {p.teachers} enseignants · {p.students} élèves
                            </div>
                          </div>
                          {active && <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ color: "#10b981", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Mode de paiement</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[{ v: "mtn", label: "MTN Money", icon: "🟡" }, { v: "orange", label: "Orange Money", icon: "🟠" }].map(m => (
                        <button key={m.v} onClick={() => set("payMethod", m.v)} style={{
                          flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                          background: form.payMethod === m.v ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${form.payMethod === m.v ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)"}`,
                          color: form.payMethod === m.v ? "#10b981" : "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 13,
                        }}>{m.icon} {m.label}</button>
                      ))}
                    </div>
                    {form.payMethod && (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 5 }}>NUMÉRO {form.payMethod.toUpperCase()}</label>
                        <input value={form.payPhone} onChange={e => set("payPhone", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="6XXXXXXXX" style={inp()} />
                      </div>
                    )}
                  </div>

                  <button onClick={async () => {
                    await fetch("/api/onboarding/complete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        role: "CENTER_MANAGER",
                        profileData: {
                          fullName: form.name,
                          phone: form.phone,
                          city: form.city,
                          country: "Cameroun",
                          centerName: form.name,
                          centerAddress: form.address,
                          centerCity: form.city,
                          centerWebsite: form.website,
                        }
                      })
                    });
                    document.cookie = "onboarding_done=true;path=/;max-age=2592000";
                    router.push("/center");
                  }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12, textDecoration: "underline", textAlign: "center" }}>
                    Essayer gratuitement pendant 30 jours →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          {form.payStep !== "done" && (
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24 }}>
              {step > 0 && form.payStep === "form" ? (
                <button onClick={() => setStep(s => s - 1)} style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontSize: 13 }}>← Précédent</button>
              ) : form.payStep === "confirm" ? (
                <button onClick={() => set("payStep", "form")} style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontSize: 13 }}>← Modifier</button>
              ) : <div />}
              <button onClick={saveStep} disabled={saving} style={{ background: saving ? "rgba(16,185,129,0.5)" : "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {saving ? "..." : step === STEPS.length - 1 ? (form.payStep === "confirm" ? "Confirmer le paiement ✓" : "Payer") : "Continuer →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

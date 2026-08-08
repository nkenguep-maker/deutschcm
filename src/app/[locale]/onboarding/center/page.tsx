"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import OnboardingProgress from "@/components/OnboardingProgress";
import PhoneInput from "@/components/PhoneInput";

const CENTER_TYPES = ["École de langues privée", "Centre culturel", "Institut académique", "Organisme de formation", "Centre communautaire", "Alliance", "Autre"];
const STEPS = [{ label: "Centre" }, { label: "Contact" }, { label: "Confirmation" }];

function inputStyle(): React.CSSProperties {
  return { width: "100%", background: "rgba(244,235,220,.04)", border: "1px solid rgba(244,235,220,.12)", borderRadius: 10, padding: "12px 14px", color: "var(--creme)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
}

export default function CenterOnboardingPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [name, setName] = useState("");
  const [centerType, setCenterType] = useState("");
  const [foundedAt, setFoundedAt] = useState("");
  const [rccm, setRccm] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const me = await response.json() as { fullName?: string | null; phone?: string | null; city?: string | null; email?: string | null };
        setAccountName(me.fullName ?? "");
        setPhone((current) => current || me.phone || "");
        setCity((current) => current || me.city || "");
        setEmail((current) => current || me.email || "");
      })
      .catch(() => undefined);
  }, []);

  const summary = useMemo(() => [name, centerType, city, accountName].filter(Boolean), [accountName, centerType, city, name]);

  function validateCurrentStep(): boolean {
    if (step === 0 && (!name.trim() || !centerType)) {
      setError(loc === "en" ? "Center name and type are required." : "Le nom et le type de centre sont requis.");
      return false;
    }
    if (step === 1 && !city.trim()) {
      setError(loc === "en" ? "City is required." : "La ville est requise.");
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(loc === "en" ? "Enter a valid center email." : "Entrez un e-mail de centre valide.");
      return false;
    }
    setError(null);
    return true;
  }

  async function next() {
    if (!validateCurrentStep()) return;
    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const centerResponse = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "center",
          name: name.trim(),
          centerType,
          foundedAt: foundedAt || undefined,
          rccm: rccm.trim() || undefined,
          region: region.trim() || undefined,
          city: city.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });
      if (!centerResponse.ok) throw new Error("center_profile_failed");

      const completeResponse = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "center_admin",
          role: "CENTER",
          profileData: {
            fullName: accountName || name.trim(),
            phone: phone.trim() || undefined,
            city: city.trim(),
            centerName: name.trim(),
            centerAddress: address.trim() || undefined,
            centerCity: city.trim(),
            centerWebsite: website.trim() || undefined,
          },
        }),
      });
      const completed = await completeResponse.json().catch(() => ({}));
      if (!completeResponse.ok || typeof completed.redirectTo !== "string") throw new Error(completed.code ?? "center_completion_failed");

      router.push(completed.redirectTo);
      router.refresh();
    } catch {
      setError(loc === "en" ? "We could not finish your Center setup. Please try again." : "Nous n’avons pas pu terminer la configuration du Centre. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--espresso)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ margin: 0, color: "var(--creme)", fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26 }}>{loc === "en" ? "Set up your Center" : "Configurer votre Centre"}</h1>
          <p style={{ color: "rgba(244,235,220,.62)", fontSize: 13 }}>{loc === "en" ? "No payment is requested during technical onboarding." : "Aucun paiement n’est demandé pendant l’onboarding technique."}</p>
        </div>

        <OnboardingProgress steps={STEPS} current={step} />
        <section style={{ marginTop: 18, background: "rgba(36,24,18,.85)", border: "1px solid rgba(244,235,220,.09)", borderRadius: 18, padding: 28 }}>
          {step === 0 ? <div style={{ display: "grid", gap: 14 }}>
            {accountName ? <div className="entry-context"><span className="entry-context-dot" /><span className="entry-context-text">{loc === "en" ? `Account representative: ${accountName}` : `Compte représentant : ${accountName}`}</span></div> : null}
            <label><span className="entry-field-lbl">{loc === "en" ? "Center name" : "Nom du centre"}</span><input style={inputStyle()} value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label><span className="entry-field-lbl">{loc === "en" ? "Center type" : "Type de centre"}</span><select style={inputStyle()} value={centerType} onChange={(e) => setCenterType(e.target.value)}><option value="">—</option>{CENTER_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span className="entry-field-lbl">{loc === "en" ? "Founded" : "Date de création"}</span><input type="date" style={inputStyle()} value={foundedAt} onChange={(e) => setFoundedAt(e.target.value)} /></label>
              <label><span className="entry-field-lbl">RCCM</span><input style={inputStyle()} value={rccm} onChange={(e) => setRccm(e.target.value)} /></label>
            </div>
          </div> : null}

          {step === 1 ? <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label><span className="entry-field-lbl">{loc === "en" ? "Region" : "Région"}</span><input style={inputStyle()} value={region} onChange={(e) => setRegion(e.target.value)} /></label>
              <label><span className="entry-field-lbl">{loc === "en" ? "City" : "Ville"}</span><input style={inputStyle()} value={city} onChange={(e) => setCity(e.target.value)} required /></label>
            </div>
            <label><span className="entry-field-lbl">{loc === "en" ? "Address" : "Adresse"}</span><input style={inputStyle()} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
            <PhoneInput value={phone} onChange={setPhone} />
            <label><span className="entry-field-lbl">{loc === "en" ? "Center email" : "E-mail du centre"}</span><input type="email" style={inputStyle()} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label><span className="entry-field-lbl">Website</span><input type="url" style={inputStyle()} value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div> : null}

          {step === 2 ? <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, color: "var(--creme)" }}>{loc === "en" ? "Confirm your Center" : "Confirmez votre Centre"}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(244,235,220,.72)", lineHeight: 1.8 }}>{summary.map((value) => <li key={value}>{value}</li>)}</ul>
            <div className="entry-context" role="note"><span className="entry-context-dot" /><span className="entry-context-text">{loc === "en" ? "Billing and paid plans will be connected later. This step only creates the verified Center workspace and saves its profile." : "La facturation et les offres payantes seront connectées plus tard. Cette étape crée uniquement l’espace Centre et enregistre son profil."}</span></div>
          </div> : null}

          {error ? <p className="entry-err" role="alert">{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
            <button type="button" className="entry-cta entry-cta-ghost" style={{ width: "auto" }} disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))}>{loc === "en" ? "Back" : "Retour"}</button>
            <button type="button" className="entry-cta entry-cta-primary" style={{ width: "auto" }} disabled={saving} onClick={next}>{saving ? (loc === "en" ? "Saving…" : "Enregistrement…") : step === STEPS.length - 1 ? (loc === "en" ? "Open my Center" : "Ouvrir mon Centre") : (loc === "en" ? "Continue" : "Continuer")}</button>
          </div>
        </section>
      </div>
    </main>
  );
}

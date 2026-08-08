"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { BrandY } from "@/components/brand/BrandY";

export default function FamilyOnboardingPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError(loc === "en" ? "First and last name are required." : "Le prénom et le nom sont requis.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "family",
          role: "STUDENT",
          profileData: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            city: city.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.code ?? "family_onboarding_failed");
      router.push(typeof data.redirectTo === "string" ? data.redirectTo : "/family");
      router.refresh();
    } catch {
      setError(
        loc === "en"
          ? "We could not finish your family setup. Please try again."
          : "Nous n’avons pas pu terminer la configuration Famille. Réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="entry-page entry-universe-racines" data-universe="family">
      <div className="entry-main">
        <div className="entry-card entry-card-onboarding">
          <BrandY variant="sources" state="static" size={52} />
          <p className="entry-kicker">{loc === "en" ? "Family" : "Famille"}</p>
          <h1 className="entry-h">
            {loc === "en" ? "Set up the adult account first." : "Configurons d’abord le compte adulte."}
          </h1>
          <p className="entry-lede">
            {loc === "en"
              ? "Your confirmed account details are reused here. Children are then created inside this account and use an avatar and child PIN instead of an email address."
              : "Les informations de votre compte confirmé sont reprises ici. Vos enfants seront ensuite créés dans ce compte et utiliseront un avatar et un PIN enfant, pas une adresse e-mail."}
          </p>

          <form onSubmit={finish} className="entry-form">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="entry-field">
                <span className="entry-field-lbl">{loc === "en" ? "First name" : "Prénom"}</span>
                <input className="entry-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
              </label>
              <label className="entry-field">
                <span className="entry-field-lbl">{loc === "en" ? "Last name" : "Nom"}</span>
                <input className="entry-input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required />
              </label>
            </div>
            <label className="entry-field">
              <span className="entry-field-lbl">{loc === "en" ? "Phone" : "Téléphone"}</span>
              <input className="entry-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </label>
            <label className="entry-field">
              <span className="entry-field-lbl">{loc === "en" ? "City" : "Ville"}</span>
              <input className="entry-input" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            </label>
            {error ? <p className="entry-err" role="alert">{error}</p> : null}
            <button className="entry-cta entry-cta-primary" type="submit" disabled={saving}>
              {saving
                ? (loc === "en" ? "Saving…" : "Enregistrement…")
                : (loc === "en" ? "Open my family space" : "Ouvrir mon espace Famille")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

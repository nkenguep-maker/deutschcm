"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { BrandY } from "@/components/brand/BrandY";
import { SeuilGreetings } from "@/components/seuil/SeuilGreeting";

export default function CoachOnboardingPage() {
  const locale = useLocale();
  const loc = locale === "en" ? "en" : "fr";
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const me = await response.json() as { firstName?: string | null; lastName?: string | null; city?: string | null };
        setFirstName((current) => current || me.firstName || "");
        setLastName((current) => current || me.lastName || "");
        setCity((current) => current || me.city || "");
      })
      .catch(() => undefined);
  }, []);

  async function finish(event: React.FormEvent) {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last || !languages.trim()) {
      setError(loc === "en" ? "Name and languages are required." : "Le nom, le prénom et les langues sont requis.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "coach",
          role: "STUDENT",
          profileData: {
            firstName: first,
            lastName: last,
            fullName: `${first} ${last}`,
            city: city.trim() || undefined,
            qualifications: languages.trim(),
            bio: bio.trim() || undefined,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error(data.code ?? "coach_onboarding_failed");
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError(
        loc === "en"
          ? "We could not finish the Roots Coach setup. Please try again."
          : "Nous n’avons pas pu terminer la configuration Coach Racines. Réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="entry-page entry-universe-racines" data-universe="racines">
      <SeuilGreetings locale={loc} visibleCount={3} pool="sources" variant="entry" />
      <div className="entry-main">
        <div className="entry-card entry-card-onboarding">
          <BrandY variant="sources" state="static" size={52} />
          <p className="entry-kicker">{loc === "en" ? "Roots Coach" : "Coach Racines"}</p>
          <h1 className="entry-h">
            {loc === "en" ? "Set up your coach profile." : "Configurons votre profil Coach."}
          </h1>
          <p className="entry-lede">
            {loc === "en"
              ? "Your confirmed identity is reused here. These coach details stay attached to your YEMA account for later sign-ins."
              : "Votre identité confirmée est reprise ici. Ces informations Coach restent rattachées à votre compte YEMA pour les prochaines connexions."}
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
              <span className="entry-field-lbl">{loc === "en" ? "City" : "Ville"}</span>
              <input className="entry-input" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            </label>

            <label className="entry-field">
              <span className="entry-field-lbl">{loc === "en" ? "Heritage languages you coach" : "Langues maternelles accompagnées"}</span>
              <input className="entry-input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder={loc === "en" ? "e.g. Bassa, Wolof" : "ex. Bassa, Wolof"} required />
            </label>

            <label className="entry-field">
              <span className="entry-field-lbl">{loc === "en" ? "Short presentation" : "Présentation courte"}</span>
              <textarea className="entry-input" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </label>

            {error ? <p className="entry-err" role="alert">{error}</p> : null}
            <button className="entry-cta entry-cta-primary" type="submit" disabled={saving}>
              {saving
                ? (loc === "en" ? "Saving…" : "Enregistrement…")
                : (loc === "en" ? "Open my Roots Coach space" : "Ouvrir mon espace Coach Racines")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import TeacherLayout from "@/components/TeacherLayout";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  profileEye: string;
  fullName: string;
  emailLbl: string;
  specialty: string;
  city: string;
  institution: string;
  verified: string;
  save: string;
  saved: string;
  notifH: string;
  notifs: Array<{ label: string; defaultOn: boolean; key: string }>;
  dangerH: string;
  dangerBody: string;
  dangerCta: string;
}

const FR: Copy = {
  title: "Paramètres",
  eye: "Paramètres",
  h: "Ton compte, ton rythme.",
  sub: "Ajuste tes informations, tes préférences de notification. La suppression du compte reste toujours possible.",
  profileEye: "Profil enseignant·e",
  fullName: "Nom complet",
  emailLbl: "Adresse email",
  specialty: "Spécialité",
  city: "Ville",
  institution: "Centre / institution",
  verified: "Vérifié·e",
  save: "Enregistrer",
  saved: "Sauvegardé",
  notifH: "Notifications",
  notifs: [
    { key: "submission",  label: "Devoir rendu par un·e apprenant·e", defaultOn: true },
    { key: "newLearner",  label: "Nouvel·le apprenant·e dans une classe", defaultOn: true },
    { key: "struggling",  label: "Apprenant·e en difficulté (score < 5)", defaultOn: true },
    { key: "weekly",      label: "Récapitulatif hebdomadaire", defaultOn: false },
  ],
  dangerH: "Zone irréversible",
  dangerBody: "La suppression du compte efface toutes tes classes, corrections et ressources personnelles. L'action est immédiate.",
  dangerCta: "Supprimer mon compte",
};

const EN: Copy = {
  title: "Settings",
  eye: "Settings",
  h: "Your account, your pace.",
  sub: "Adjust your details, tweak notification preferences. Deleting your account remains possible at any time.",
  profileEye: "Teacher profile",
  fullName: "Full name",
  emailLbl: "Email",
  specialty: "Specialty",
  city: "City",
  institution: "Center / institution",
  verified: "Verified",
  save: "Save",
  saved: "Saved",
  notifH: "Notifications",
  notifs: [
    { key: "submission", label: "Learner submission", defaultOn: true },
    { key: "newLearner", label: "New learner in a class", defaultOn: true },
    { key: "struggling", label: "Learner struggling (score < 5)", defaultOn: true },
    { key: "weekly",     label: "Weekly digest", defaultOn: false },
  ],
  dangerH: "Irreversible zone",
  dangerBody: "Deleting your account erases all your classes, corrections and personal resources. The action is immediate.",
  dangerCta: "Delete my account",
};

export default function TeacherSettingsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [fullName, setFullName] = useState("Marie Tchamba");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState(locale === "en" ? "German A1-B2" : "Allemand A1-B2");
  const [institution, setInstitution] = useState("Institut Lingua Plus");
  const [city, setCity] = useState("Yaoundé");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      if (data.user.user_metadata?.full_name) setFullName(data.user.user_metadata.full_name);
    });
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <section style={{
          padding: 24,
          background: "var(--espresso-2)",
          border: "1px solid var(--creme-hair)",
          borderRadius: 14,
        }}>
          <p className="subpage-eye">{t.profileEye}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div className="mono-avatar" style={{ width: 52, height: 52, fontSize: 18 }} aria-hidden="true">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 20,
                color: "var(--creme)",
                margin: 0,
                fontWeight: 400,
              }}>{fullName}</p>
              <p style={{ color: "var(--creme-mute)", fontSize: 12.5, margin: "3px 0 0", fontFamily: "var(--font-jetbrains, monospace)" }}>
                {specialty} · {institution} · {city}
              </p>
            </div>
            <span className="status-pill active">{t.verified}</span>
          </div>

          <div className="modal-form">
            <div className="modal-field">
              <label htmlFor="setting-name" className="modal-lbl">{t.fullName}</label>
              <input id="setting-name" className="modal-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="modal-field">
              <label htmlFor="setting-email" className="modal-lbl">{t.emailLbl}</label>
              <input id="setting-email" type="email" className="modal-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="modal-field">
                <label htmlFor="setting-specialty" className="modal-lbl">{t.specialty}</label>
                <input id="setting-specialty" className="modal-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              </div>
              <div className="modal-field">
                <label htmlFor="setting-city" className="modal-lbl">{t.city}</label>
                <input id="setting-city" className="modal-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="modal-field">
              <label htmlFor="setting-institution" className="modal-lbl">{t.institution}</label>
              <input id="setting-institution" className="modal-input" value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button type="button" className="subpage-cta" onClick={handleSave}>
              {saved ? t.saved : t.save}
            </button>
          </div>
        </section>

        <section style={{
          padding: 24,
          background: "var(--espresso-2)",
          border: "1px solid var(--creme-hair)",
          borderRadius: 14,
        }}>
          <h3 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 18,
            color: "var(--creme)",
            margin: "0 0 12px",
            fontWeight: 400,
          }}>{t.notifH}</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {t.notifs.map((n, i) => (
              <NotifToggle key={n.key} label={n.label} defaultOn={n.defaultOn} last={i === t.notifs.length - 1} />
            ))}
          </div>
        </section>

        <section style={{
          padding: 24,
          border: "1px solid rgba(122, 40, 48, 0.35)",
          borderRadius: 14,
          background: "rgba(122, 40, 48, 0.05)",
        }}>
          <h3 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 18,
            color: "var(--oxblood)",
            margin: "0 0 8px",
            fontWeight: 400,
          }}>{t.dangerH}</h3>
          <p style={{
            color: "var(--creme-soft)",
            fontSize: 13.5,
            margin: "0 0 16px",
            maxWidth: "60ch",
            lineHeight: 1.5,
          }}>{t.dangerBody}</p>
          <button type="button" className="row-btn danger">{t.dangerCta}</button>
        </section>
      </section>
    </TeacherLayout>
  );
}

function NotifToggle({ label, defaultOn, last }: { label: string; defaultOn: boolean; last: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: last ? "none" : "1px solid var(--creme-hair)",
      gap: 20,
    }}>
      <span style={{ color: "var(--creme-soft)", fontSize: 13.5 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          border: `1px solid ${on ? "var(--brass)" : "var(--creme-hair)"}`,
          background: on ? "var(--brass-glow)" : "transparent",
          position: "relative",
          cursor: "pointer",
          transition: "all var(--dur-touch) var(--ease-enter)",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 2,
          left: on ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: on ? "var(--brass)" : "var(--creme-mute)",
          transition: "left var(--dur-touch) var(--ease-enter), background var(--dur-touch)",
        }} />
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import TeacherLayout from "@/components/TeacherLayout";

export default function TeacherSettingsPage() {
  const [fullName, setFullName] = useState("Marie Tchamba");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("Allemand A1-B2");
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

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "white", fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
          fontFamily: "'DM Mono', monospace",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );

  return (
    <TeacherLayout title="Paramètres">
      <div style={{ maxWidth: 580 }}>

        {/* Profile card */}
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))",
              border: "1px solid rgba(16,185,129,0.3)", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem",
            }}>{initials}</div>
            <div>
              <div style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>{fullName}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Enseignant · Institut Lingua Plus · Yaoundé</div>
            </div>
            <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontSize: "0.65rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>✓ Vérifié</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Nom complet" value={fullName} onChange={setFullName} />
            <Field label="Adresse email" value={email} onChange={setEmail} type="email" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Spécialité" value={specialty} onChange={setSpecialty} />
              <Field label="Ville" value={city} onChange={setCity} />
            </div>
            <Field label="Institution" value={institution} onChange={setInstitution} />
          </div>

          <button
            onClick={handleSave}
            style={{
              marginTop: 20, padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
              background: saved ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg, #10b981, #059669)",
              color: saved ? "#10b981" : "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem",
              boxShadow: saved ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
              transition: "all 0.2s",
            }}
          >
            {saved ? "✓ Sauvegardé" : "Enregistrer les modifications"}
          </button>
        </div>

        {/* Notifications */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Notifications</h3>
          {[
            { label: "Devoir rendu par un élève", defaultOn: true },
            { label: "Nouvel élève dans une classe", defaultOn: true },
            { label: "Élève en difficulté (score < 5)", defaultOn: true },
            { label: "Récapitulatif hebdomadaire", defaultOn: false },
          ].map(item => (
            <NotifToggle key={item.label} label={item.label} defaultOn={item.defaultOn} />
          ))}
        </div>

        {/* Danger zone */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h3 style={{ margin: "0 0 8px", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Zone dangereuse</h3>
          <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>
            La suppression du compte est irréversible. Toutes tes classes et données seront perdues.
          </p>
          <button style={{ padding: "8px 18px", borderRadius: 9, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
            Supprimer mon compte
          </button>
        </div>
      </div>
    </TeacherLayout>
  );
}

function NotifToggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>{label}</span>
      <button onClick={() => setOn(!on)} style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? "#10b981" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s",
      }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

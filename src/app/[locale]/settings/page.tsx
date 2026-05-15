"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Layout from "@/components/Layout";

export default function StudentSettingsPage() {
  const [fullName, setFullName] = useState("Fatima Oumarou");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("A1");
  const [city, setCity] = useState("Yaoundé");
  const [saved, setSaved] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting" | "done">("idle");

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

  const handleDelete = async () => {
    setDeleteStep("deleting");
    const supabase = createClient();
    await supabase.auth.signOut();
    setDeleteStep("done");
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
    <Layout title="Paramètres">
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
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Apprenant · Niveau {level} · {city}</div>
            </div>
            <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontSize: "0.65rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>✓ Inscrit</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Nom complet" value={fullName} onChange={setFullName} />
            <Field label="Adresse email" value={email} onChange={setEmail} type="email" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block", marginBottom: 6 }}>Niveau actuel</label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", fontSize: "0.82rem", outline: "none",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {["A1", "A2", "B1", "B2", "C1"].map(l => <option key={l} value={l} style={{ background: "#0d1117" }}>{l}</option>)}
                </select>
              </div>
              <Field label="Ville" value={city} onChange={setCity} />
            </div>
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
            { label: "Nouveau devoir assigné",          defaultOn: true },
            { label: "Résultats de quiz disponibles",   defaultOn: true },
            { label: "Rappel de streak quotidien",      defaultOn: true },
            { label: "Résumé hebdomadaire",             defaultOn: false },
            { label: "Messages du professeur",          defaultOn: true },
          ].map(item => (
            <NotifToggle key={item.label} label={item.label} defaultOn={item.defaultOn} />
          ))}
        </div>

        {/* Learning preferences */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Préférences d'apprentissage</h3>
          {[
            { label: "Mode sombre (actif par défaut)",  defaultOn: true },
            { label: "Sons de feedback lors des quiz",  defaultOn: true },
            { label: "Afficher le tableau des scores",  defaultOn: false },
          ].map(item => (
            <NotifToggle key={item.label} label={item.label} defaultOn={item.defaultOn} />
          ))}
        </div>

        {/* Legal links */}
        <div style={{ padding: "16px 24px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <a href="/privacy" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", textDecoration: "none" }}>Politique de confidentialité</a>
          <a href="/terms" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", textDecoration: "none" }}>Conditions d'utilisation</a>
          <a href="mailto:privacy@yema.app" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", textDecoration: "none" }}>Demander mes données</a>
        </div>

        {/* Danger zone */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h3 style={{ margin: "0 0 8px", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Zone dangereuse</h3>
          <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>
            La suppression du compte est irréversible. Toutes tes données de progression seront effacées dans les 30 jours, conformément à notre politique de confidentialité.
          </p>

          {deleteStep === "idle" && (
            <button
              onClick={() => setDeleteStep("confirm")}
              style={{ padding: "8px 18px", borderRadius: 9, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}
            >
              Supprimer mon compte
            </button>
          )}

          {deleteStep === "confirm" && (
            <div style={{ padding: "16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p style={{ margin: "0 0 12px", color: "#f87171", fontSize: "0.78rem", fontWeight: 600 }}>
                Confirmer la suppression ?
              </p>
              <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
                Cette action est définitive. Tes données seront supprimées dans les 30 jours.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleDelete}
                  style={{ padding: "8px 16px", borderRadius: 9, background: "#ef4444", border: "none", color: "white", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                >
                  Oui, supprimer définitivement
                </button>
                <button
                  onClick={() => setDeleteStep("idle")}
                  style={{ padding: "8px 16px", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {deleteStep === "deleting" && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>Suppression en cours…</p>
          )}

          {deleteStep === "done" && (
            <p style={{ color: "#10b981", fontSize: "0.75rem" }}>
              ✓ Compte déconnecté. Tes données seront effacées sous 30 jours. Contact : privacy@yema.app
            </p>
          )}
        </div>
      </div>
    </Layout>
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

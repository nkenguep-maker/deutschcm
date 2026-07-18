"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  profileEye: string;
  fullName: string;
  emailLbl: string;
  level: string;
  city: string;
  save: string;
  saved: string;
  notifH: string;
  notifs: Array<{ label: string; defaultOn: boolean; key: string }>;
  dangerH: string;
  dangerBody: string;
  dangerCta: string;
  confirmH: string;
  confirmBody: string;
  confirmCta: string;
  cancel: string;
  doneSoul: string;
  doneBody: string;
  doneCta: string;
}

const FR: Copy = {
  title: "Paramètres",
  eye: "Paramètres",
  h: "Votre compte, votre rythme.",
  sub: "Ajustez votre profil et vos préférences. La suppression du compte reste toujours possible.",
  profileEye: "Profil",
  fullName: "Nom complet",
  emailLbl: "Adresse email",
  level: "Niveau actuel",
  city: "Ville",
  save: "Enregistrer",
  saved: "Sauvegardé",
  notifH: "Notifications",
  notifs: [
    { key: "streak",   label: "Rappel série quotidienne",       defaultOn: true  },
    { key: "correct",  label: "Correction disponible",           defaultOn: true  },
    { key: "class",    label: "Message d'un·e enseignant·e",    defaultOn: true  },
    { key: "weekly",   label: "Récapitulatif hebdomadaire",     defaultOn: false },
  ],
  dangerH: "Zone irréversible",
  dangerBody: "Supprimer votre compte efface toute votre progression, votre historique de leçons et vos badges. L'action est immédiate.",
  dangerCta: "Supprimer mon compte",
  confirmH: "Effacer votre compte YEMA ?",
  confirmBody: "Cette action est définitive. Vos données ne pourront pas être restaurées.",
  confirmCta: "Confirmer la suppression",
  cancel: "Annuler",
  doneSoul: "Votre compte a été effacé. *À une prochaine fois.*",
  doneBody: "Nous n'avons plus aucune trace de vous. Si vous changez d'avis, l'inscription reste toujours ouverte.",
  doneCta: "Retour à l'accueil",
};

const EN: Copy = {
  title: "Settings",
  eye: "Settings",
  h: "Your account, your pace.",
  sub: "Adjust your profile and preferences. Deleting your account remains possible at any time.",
  profileEye: "Profile",
  fullName: "Full name",
  emailLbl: "Email",
  level: "Current level",
  city: "City",
  save: "Save",
  saved: "Saved",
  notifH: "Notifications",
  notifs: [
    { key: "streak",  label: "Daily streak reminder",       defaultOn: true  },
    { key: "correct", label: "Correction available",         defaultOn: true  },
    { key: "class",   label: "Message from a teacher",       defaultOn: true  },
    { key: "weekly",  label: "Weekly digest",                 defaultOn: false },
  ],
  dangerH: "Irreversible zone",
  dangerBody: "Deleting your account erases all your progress, lesson history and badges. The action is immediate.",
  dangerCta: "Delete my account",
  confirmH: "Erase your YEMA account?",
  confirmBody: "This action is definitive. Your data cannot be restored.",
  confirmCta: "Confirm deletion",
  cancel: "Cancel",
  doneSoul: "Your account has been erased. *Until next time.*",
  doneBody: "We have no trace of you left. If you change your mind, signup remains open.",
  doneCta: "Back to home",
};

export default function StudentSettingsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("A1");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "done">("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      if (data.user.user_metadata?.full_name) setFullName(data.user.user_metadata.full_name);
    });
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      if (d.fullName) setFullName(d.fullName);
      if (d.germanLevel) setLevel(d.germanLevel);
      if (d.city) setCity(d.city);
    }).catch(() => {});
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDeleteStep("done");
  };

  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "Y";

  if (deleteStep === "done") {
    return (
      <Layout title={t.title}>
        <StateBlock
          kind="success"
          centered
          soul={t.doneSoul}
          body={t.doneBody}
          action={{ label: t.doneCta, href: "/" }}
        />
      </Layout>
    );
  }

  return (
    <Layout title={t.title}>
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
            <div className="mono-avatar" style={{ width: 52, height: 52, fontSize: 18 }} aria-hidden="true">
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 20,
                color: "var(--creme)",
                margin: 0,
                fontWeight: 400,
              }}>{fullName || "—"}</p>
              <p style={{
                color: "var(--creme-mute)",
                fontSize: 12.5,
                margin: "3px 0 0",
                fontFamily: "var(--font-jetbrains, monospace)",
              }}>
                {locale === "en" ? "Level" : "Niveau"} {level} · {city || "—"}
              </p>
            </div>
          </div>

          <div className="modal-form">
            <div className="modal-field">
              <label htmlFor="s-name" className="modal-lbl">{t.fullName}</label>
              <input id="s-name" className="modal-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="modal-field">
              <label htmlFor="s-email" className="modal-lbl">{t.emailLbl}</label>
              <input id="s-email" type="email" className="modal-input" value={email} disabled />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="modal-field">
                <label htmlFor="s-level" className="modal-lbl">{t.level}</label>
                <input id="s-level" className="modal-input" value={level} disabled />
              </div>
              <div className="modal-field">
                <label htmlFor="s-city" className="modal-lbl">{t.city}</label>
                <input id="s-city" className="modal-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
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

        {deleteStep === "idle" && (
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
            <button type="button" className="row-btn danger" onClick={() => setDeleteStep("confirm")}>
              {t.dangerCta}
            </button>
          </section>
        )}

        {deleteStep === "confirm" && (
          <StateBlock
            kind="confirm"
            soul={t.confirmH}
            body={t.confirmBody}
            action={{ label: t.confirmCta, onClick: handleDelete }}
            secondary={{ label: t.cancel, onClick: () => setDeleteStep("idle") }}
          />
        )}
      </section>
    </Layout>
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
          flexShrink: 0,
          transition: "all var(--dur-touch) var(--ease-enter)",
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

"use client";

// Gate 8K · adaptateur UI minimal enfant · connecte les cartes Family
// au mécanisme serveur canonique POST /api/child-session déjà livré.
//
// Ne modifie PAS :
//   - l'API (format request/response inchangé) ;
//   - le format de session (cookie HttpOnly HMAC signé server-side) ;
//   - les règles PIN (scrypt server-side · pinUpdatedAt version-check).
//
// Contraintes strictes ·
//   - aucune valeur par défaut ;
//   - aucune persistance localStorage/sessionStorage ;
//   - PIN uniquement en state React ;
//   - erreur générique en cas d'échec (aucune divulgation) ;
//   - bouton désactivé pendant l'envoi ;
//   - input inputMode="numeric" + label + cible tactile 44 px ;
//   - aucun PIN dans les logs.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimalAvatar, type AvatarAnimal } from "@/components/famille/AnimalAvatar";

type Props = {
  child: { id: string; prenom: string; avatarAnimal: AvatarAnimal };
  locale: string;
  copy: {
    title: string;         // "Ouvrir l'espace de {prenom}"
    pinLbl: string;        // "Code enfant"
    pinPlaceholder: string;
    submit: string;
    cancel: string;
    errGeneric: string;    // Message erreur générique (aucune divulgation)
  };
  onClose: () => void;
};

export function ChildPinDialog({ child, locale, copy, onClose }: Props) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus l'input dès l'ouverture · accessibilité clavier.
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    if (submitting) return;
    if (!pin || pin.length < 4) {
      setErr(copy.errGeneric);
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/child-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childProfileId: child.id, pin }),
      });
      // Erreur générique · aucune divulgation (401 vs 404 vs 409 tous traités
      // pareil côté UX).
      if (!res.ok) {
        setErr(copy.errGeneric);
        setSubmitting(false);
        return;
      }
      // 200 · cookie HttpOnly émis par le serveur · navigate vers /dashboard
      // (resolveActiveChildSession détectera le cookie et rendra
      // ChildMondeDashboard ou ChildRacinesDashboard selon universe).
      // Wipe PIN de la mémoire avant redirection.
      setPin("");
      router.push(`/${locale}/dashboard`);
    } catch {
      setErr(copy.errGeneric);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="famille-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="child-pin-dialog-title"
      data-testid="child-pin-dialog"
    >
      <div className="famille-dialog-inner">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <AnimalAvatar animal={child.avatarAnimal} size={72} ariaLabel={child.prenom} />
          <h2 id="child-pin-dialog-title" style={{ margin: 0, fontSize: 18 }}>
            {copy.title.replace("{prenom}", child.prenom)}
          </h2>
        </div>
        <label className="famille-field" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="famille-field-lbl">{copy.pinLbl}</span>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); if (err) setErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={copy.pinPlaceholder}
            className="famille-input"
            style={{ minHeight: 44, fontSize: 20, letterSpacing: "0.4em", textAlign: "center" }}
            data-testid="child-pin-input"
            aria-invalid={err ? "true" : "false"}
            aria-describedby={err ? "child-pin-error" : undefined}
          />
        </label>
        {err ? (
          <p id="child-pin-error" className="famille-err" role="alert" data-testid="child-pin-error">
            {err}
          </p>
        ) : null}
        <div className="famille-dialog-actions">
          <button
            type="button"
            className="famille-btn ghost"
            onClick={onClose}
            disabled={submitting}
            style={{ minHeight: 44 }}
            data-testid="child-pin-cancel"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="famille-btn primary"
            onClick={submit}
            disabled={submitting || pin.length < 4}
            style={{ minHeight: 44 }}
            data-testid="child-pin-submit"
          >
            {copy.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

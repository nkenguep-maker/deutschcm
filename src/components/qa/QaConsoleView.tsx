// P4.5-QA · vue console persona-picker. Reçoit un catalogue de personas
// et gère l'appel POST /api/qa/impersonate + redirection vers le magic link.

"use client";

import { useState, useTransition } from "react";
import type { QaPersonaId } from "@/lib/qa/personas";

interface PersonaCard {
  id: QaPersonaId;
  label: string;
  role: string;
  destination: string;
  available: boolean;
  unavailableReason?: string;
}

interface Props {
  locale: string;
  projectRef: string;
  deploymentHost: string;
  expiresAtSeconds: number;
  personas: PersonaCard[];
}

const COPY = {
  fr: {
    title: "Mode QA · Preview P-1",
    subtitle: "Sélectionnez un persona pour entrer dans son espace avec les permissions réelles de ce rôle.",
    session: "Session QA",
    host: "Deployment",
    expiresAt: "Expire",
    projectRef: "Project ref",
    enter: "Entrer dans cet espace",
    unavailable: "Espace prévu dans la roadmap — non disponible dans cette Preview.",
    error: "L'impersonation a échoué.",
    connecting: "Connexion en cours…",
  },
  en: {
    title: "QA mode · Preview P-1",
    subtitle: "Pick a persona to enter their space with the real permissions for that role.",
    session: "QA session",
    host: "Deployment",
    expiresAt: "Expires",
    projectRef: "Project ref",
    enter: "Enter this space",
    unavailable: "Space planned in roadmap — not available in this Preview.",
    error: "Impersonation failed.",
    connecting: "Connecting…",
  },
} as const;

export default function QaConsoleView({
  locale, projectRef, deploymentHost, expiresAtSeconds, personas,
}: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    timeStyle: "short", dateStyle: "medium",
  });

  async function impersonate(persona: QaPersonaId) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/qa/impersonate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (!res.ok) {
        setError(c.error);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (typeof data?.redirectUrl === "string") {
        window.location.href = data.redirectUrl;
      } else {
        setError(c.error);
      }
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--espresso)", color: "var(--creme)" }}>
      <header className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl" style={{ color: "var(--creme)" }}>{c.title}</h1>
        <p className="mt-2" style={{ color: "var(--creme-mute)" }}>{c.subtitle}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: "var(--creme-mute)" }}>
          <dt>{c.host}</dt><dd style={{ color: "var(--creme-soft)" }}>{deploymentHost}</dd>
          <dt>{c.projectRef}</dt><dd style={{ color: "var(--creme-soft)" }}>{projectRef}</dd>
          <dt>{c.expiresAt}</dt><dd style={{ color: "var(--creme-soft)" }}>{dateFmt.format(new Date(expiresAtSeconds * 1000))}</dd>
        </dl>
        {error && (
          <div role="alert" aria-live="polite" className="mt-4 rounded p-3 text-sm"
               style={{ border: "1px solid rgba(122,40,48,0.35)", background: "rgba(122,40,48,0.08)", color: "var(--oxblood)" }}>
            {error}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {personas.map((p) => (
            <li key={p.id}
                className="rounded-2xl p-5"
                style={{ background: "rgba(232, 216, 190, 0.06)", border: "1px solid var(--brass-edge)" }}>
              <h2 className="font-serif text-lg" style={{ color: "var(--creme)" }}>{p.label}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ color: "var(--creme-mute)" }}>
                <dt>Rôle</dt><dd style={{ color: "var(--creme-soft)" }}>{p.role}</dd>
                <dt>Destination</dt><dd style={{ color: "var(--creme-soft)" }}>{p.destination}</dd>
              </dl>
              {p.available ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => impersonate(p.id)}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
                  style={{ background: "var(--brass)", color: "var(--espresso)" }}
                >
                  {pending ? c.connecting : c.enter}
                </button>
              ) : (
                <p className="mt-4 text-xs" style={{ color: "var(--creme-mute)" }}>
                  {p.unavailableReason ?? c.unavailable}
                </p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

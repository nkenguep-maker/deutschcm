// P4.5-QA · bannière persistante affichée quand le mode QA est actif.
// À intégrer dans les espaces (Teacher, Coach, Center, Student, Admin) via
// un rendu conditionnel · le serveur vérifie l'état QA + retourne le props.

"use client";

interface Props {
  locale: string;
  projectRef: string;
  currentPersona?: string;
  expiresAtSeconds: number;
  deploymentHost: string;
}

const COPY = {
  fr: {
    label: "MODE QA · P-1 · DONNÉES DE TEST",
    persona: "Persona",
    expiresAt: "Expire",
    switchRole: "Changer de rôle",
    exit: "Quitter le mode QA",
    host: "Deployment",
  },
  en: {
    label: "QA MODE · P-1 · TEST DATA",
    persona: "Persona",
    expiresAt: "Expires",
    switchRole: "Switch role",
    exit: "Exit QA mode",
    host: "Deployment",
  },
} as const;

export default function QaBanner({
  locale, projectRef, currentPersona, expiresAtSeconds, deploymentHost,
}: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    timeStyle: "short", dateStyle: "short",
  });
  async function exitQa() {
    // POST JSON body vide · satisfait le CSRF check (content-type +
    // Origin + Sec-Fetch-Site same-origin). Server retourne 303 vers
    // /fr/goodbye · fetch en `redirect: manual` ne suit pas · le client
    // navigate à la destination localisée.
    await fetch("/api/qa/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      redirect: "manual",
    });
    window.location.href = `/${locale}/goodbye`;
  }
  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs"
      style={{
        background: "var(--oxblood, #7a2830)",
        color: "var(--creme, #f2e6c9)",
        borderBottom: "1px solid var(--brass-edge, #b2905c)",
      }}
      data-qa-banner="active"
    >
      <div className="flex flex-wrap items-center gap-3">
        <strong className="tracking-wider">{c.label}</strong>
        {currentPersona && <span>· {c.persona}: {currentPersona}</span>}
        <span>· {c.expiresAt}: {dateFmt.format(new Date(expiresAtSeconds * 1000))}</span>
        <span title={deploymentHost} className="hidden sm:inline">· {c.host}: {deploymentHost.slice(0, 32)}</span>
        <span className="hidden md:inline">· projectRef: {projectRef}</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`/${locale}/qa`}
          className="rounded border border-current px-2 py-1 focus:outline-none focus:ring-2"
          style={{ color: "var(--creme)" }}
        >
          {c.switchRole}
        </a>
        <button
          type="button" onClick={exitQa}
          className="rounded border border-current px-2 py-1 focus:outline-none focus:ring-2"
          style={{ color: "var(--creme)" }}
        >
          {c.exit}
        </button>
      </div>
    </div>
  );
}

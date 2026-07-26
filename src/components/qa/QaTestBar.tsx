"use client";

// Barre persistante en haut de chaque espace pendant les tests QA.
// Deux modes ·
//   1. Super Admin (pas d'impersonation en cours) → menu "Tester comme…"
//   2. En cours d'impersonation → barre MODE TEST avec 3 actions
//        [Changer de compte ▼] · [Retour Super Admin] · [Quitter le mode test]
//
// Self-gate · fetch /api/qa/status au mount. Si 404 (gate KO), rien
// n'est rendu. Aucune donnée sensible côté client (juste ID persona
// + label + booléen isSuperAdmin).

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

interface PersonaOpt {
  id: string;
  labelFr: string;
  labelEn: string;
  role: string;
  available: boolean;
}
interface Status {
  gate: "active";
  currentPersona: string | null;
  isSuperAdmin: boolean;
  personas: PersonaOpt[];
}

export function QaTestBar() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/qa/status", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setStatus(d); })
      .catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, []);

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!status || status.gate !== "active") return null;
  // Ne rend rien si ce n'est ni un super admin ni une impersonation en cours.
  if (!status.isSuperAdmin && !status.currentPersona) return null;

  async function impersonate(personaId: string) {
    setBusy(true);
    setOpen(false);
    try {
      const res = await fetch("/api/qa/impersonate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ persona: personaId }),
        redirect: "manual",
      });
      const ok = res.type === "opaqueredirect" || res.status === 0
        || (res.status >= 200 && res.status < 400);
      if (!ok) {
        setBusy(false);
        return;
      }
      // Le server a écrit les cookies session Supabase + le cookie
      // yema_qa_persona · nav vers la destination canonique du persona.
      const target = status?.personas.find((p) => p.id === personaId);
      if (!target) { setBusy(false); return; }
      const dest = destinationFor(personaId, locale);
      window.location.href = dest;
    } catch {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/qa/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: "{}",
        redirect: "manual",
      });
    } catch { /* ignore */ }
    window.location.href = `/${locale}/goodbye`;
  }

  const current = status.currentPersona
    ? status.personas.find((p) => p.id === status.currentPersona) ?? null
    : null;
  const currentLabel = current ? (loc === "en" ? current.labelEn : current.labelFr) : null;

  const isImpersonating = !!status.currentPersona && status.currentPersona !== "super_admin";
  const isOnSuperAdmin = status.currentPersona === "super_admin" || (!status.currentPersona && status.isSuperAdmin);

  const C = COPY[loc];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="qatb" role="region" aria-label={C.regionAria}>
        <div className="qatb-inner">
          <div className="qatb-left">
            <span className="qatb-dot" aria-hidden="true" />
            {isImpersonating ? (
              <span className="qatb-label">
                <strong>{C.modeTest}</strong>
                <span className="qatb-sep">·</span>
                {C.viewingAs} <em>{currentLabel}</em>
              </span>
            ) : (
              <span className="qatb-label">
                <strong>{C.superAdmin}</strong>
                <span className="qatb-sep">·</span>
                {C.pickAccount}
              </span>
            )}
          </div>

          <div className="qatb-right" ref={wrapRef}>
            <div className="qatb-menu-wrap">
              <button
                type="button"
                className="qatb-btn qatb-btn-primary"
                onClick={() => setOpen((o) => !o)}
                disabled={busy}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {isImpersonating ? C.change : C.testAs}
                <span aria-hidden="true" className="qatb-caret">▾</span>
              </button>
              {open && (
                <ul className="qatb-menu" role="menu">
                  {status.personas.map((p) => (
                    <li key={p.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="qatb-menu-item"
                        onClick={() => impersonate(p.id)}
                        disabled={busy || !p.available || p.id === status.currentPersona}
                      >
                        <span className="qatb-menu-label">{loc === "en" ? p.labelEn : p.labelFr}</span>
                        <span className="qatb-menu-role">{p.role}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isImpersonating && (
              <button
                type="button"
                className="qatb-btn qatb-btn-ghost"
                onClick={() => impersonate("super_admin")}
                disabled={busy}
              >
                {C.backSA}
              </button>
            )}

            {(isImpersonating || isOnSuperAdmin) && (
              <button
                type="button"
                className="qatb-btn qatb-btn-quit"
                onClick={logout}
                disabled={busy}
              >
                {C.quit}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function destinationFor(personaId: string, locale: string): string {
  switch (personaId) {
    case "super_admin": return `/${locale}/admin`;
    case "teacher": return `/${locale}/teacher`;
    case "coach": return `/${locale}/coach/racines`;
    case "center_admin": return `/${locale}/center`;
    case "student_monde": return `/${locale}/dashboard`;
    case "student_racines": return `/${locale}/dashboard`;
    default: return `/${locale}`;
  }
}

const COPY = {
  fr: {
    regionAria: "Barre de test QA",
    modeTest: "MODE TEST",
    viewingAs: "Vous naviguez comme :",
    superAdmin: "SUPER ADMIN",
    pickAccount: "Tester tous les comptes",
    testAs: "Tester comme…",
    change: "Changer de compte",
    backSA: "Retour Super Admin",
    quit: "Quitter le mode test",
  },
  en: {
    regionAria: "QA test bar",
    modeTest: "TEST MODE",
    viewingAs: "You are viewing as:",
    superAdmin: "SUPER ADMIN",
    pickAccount: "Test all accounts",
    testAs: "Test as…",
    change: "Switch account",
    backSA: "Back to Super Admin",
    quit: "Exit test mode",
  },
} as const;

const CSS = `
.qatb {
  position: sticky; top: 0; z-index: 200;
  background: linear-gradient(180deg, #2A1D10 0%, #1B120A 100%);
  color: #F4EBDC;
  border-bottom: 1px solid rgba(184, 135, 62, 0.32);
  font-family: var(--font-manrope, system-ui, sans-serif);
  font-size: 13px;
  box-shadow: 0 4px 12px -6px rgba(0, 0, 0, 0.35);
}
.qatb *, .qatb *::before, .qatb *::after { box-sizing: border-box; }
.qatb-inner {
  max-width: 1400px; margin: 0 auto;
  padding: 8px clamp(12px, 3vw, 20px);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 44px;
}
.qatb-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.qatb-dot {
  width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto;
  background: #B8873E;
  box-shadow: 0 0 0 3px rgba(184, 135, 62, 0.24);
  animation: qatb-pulse 2.2s ease-in-out infinite;
}
.qatb-label {
  color: rgba(244, 235, 220, 0.86);
  letter-spacing: 0.02em;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.qatb-label strong {
  font-weight: 700; letter-spacing: 0.06em; font-size: 11px;
  color: #EBC07A; text-transform: uppercase;
}
.qatb-label em { font-style: normal; font-weight: 600; color: #F4EBDC; }
.qatb-sep { margin: 0 6px; color: rgba(244, 235, 220, 0.4); }
.qatb-right { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.qatb-menu-wrap { position: relative; }
.qatb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; border: 1px solid transparent;
  transition: background 160ms ease, border-color 160ms ease, transform 100ms ease;
  min-height: 34px;
}
.qatb-btn:focus-visible { outline: 2px solid #B8873E; outline-offset: 2px; }
.qatb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.qatb-btn-primary { background: #B8873E; color: #1B120A; border-color: #B8873E; }
.qatb-btn-primary:hover:not(:disabled) { background: #C9843F; transform: translateY(-1px); }
.qatb-btn-ghost { background: transparent; color: #F4EBDC; border-color: rgba(244, 235, 220, 0.28); }
.qatb-btn-ghost:hover:not(:disabled) { background: rgba(244, 235, 220, 0.06); border-color: rgba(244, 235, 220, 0.48); }
.qatb-btn-quit { background: transparent; color: rgba(244, 235, 220, 0.72); border-color: rgba(244, 235, 220, 0.16); }
.qatb-btn-quit:hover:not(:disabled) { background: rgba(122, 40, 48, 0.18); color: #F4EBDC; border-color: rgba(122, 40, 48, 0.5); }
.qatb-caret { font-size: 10px; margin-left: 2px; opacity: 0.7; }
.qatb-menu {
  position: absolute; right: 0; top: calc(100% + 6px);
  min-width: 240px; padding: 6px;
  background: #1B120A;
  border: 1px solid rgba(184, 135, 62, 0.42);
  border-radius: 10px;
  list-style: none; margin: 0;
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.6);
  z-index: 300;
}
.qatb-menu-item {
  width: 100%; padding: 10px 12px; border-radius: 6px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: transparent; color: #F4EBDC; border: 0;
  font-family: inherit; font-size: 13px; text-align: left; cursor: pointer;
  transition: background 120ms ease;
}
.qatb-menu-item:hover:not(:disabled) { background: rgba(184, 135, 62, 0.14); }
.qatb-menu-item:disabled {
  opacity: 0.4; cursor: not-allowed;
  background: rgba(184, 135, 62, 0.06);
}
.qatb-menu-label { font-weight: 600; }
.qatb-menu-role {
  font-family: var(--font-jetbrains, ui-monospace, monospace);
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(244, 235, 220, 0.5);
}
@keyframes qatb-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.65; transform: scale(0.92); }
}
@media (max-width: 720px) {
  .qatb-inner { flex-wrap: wrap; }
  .qatb-left { order: 1; width: 100%; }
  .qatb-right { order: 2; width: 100%; justify-content: flex-end; flex-wrap: wrap; }
  .qatb-menu { left: 0; right: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .qatb-dot, .qatb-btn { animation: none !important; transition: none !important; }
}
`;

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { SpaceRole } from "@/components/SpaceSwitcher";

// Admin · gestion des rôles multi-comptes.
// Recherche par email/nom, accorder/retirer un rôle avec confirmation.

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  userRoles: Array<{
    role: SpaceRole;
    onboarded: boolean;
    grantedBy: string | null;
    createdAt: string;
  }>;
}

const ROLES: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];

const LABEL_FR: Record<SpaceRole, string> = {
  STUDENT: "Apprenant·e",
  TEACHER: "Enseignant·e",
  CENTER: "Centre",
  ADMIN: "Admin",
};
const LABEL_EN: Record<SpaceRole, string> = {
  STUDENT: "Learner",
  TEACHER: "Teacher",
  CENTER: "Center",
  ADMIN: "Admin",
};

export default function AdminRolesPage() {
  const locale = useLocale();
  const L = locale === "en" ? LABEL_EN : LABEL_FR;
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = async (query: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/roles/list?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (r.ok) setRows(d.users ?? []);
      else setMsg({ kind: "err", text: d.error ?? "Erreur" });
    } catch {
      setMsg({ kind: "err", text: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("");
  }, []);

  const grant = async (userId: string, role: SpaceRole) => {
    setBusy(`${userId}:${role}:grant`);
    setMsg(null);
    try {
      const r = await fetch("/api/roles/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg({ kind: "ok", text: `Rôle ${L[role]} accordé.` });
        await load(q);
      } else {
        setMsg({ kind: "err", text: d.error ?? "Erreur" });
      }
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (userId: string, role: SpaceRole) => {
    if (!confirm(`Retirer le rôle ${L[role]} à cet utilisateur ?`)) return;
    setBusy(`${userId}:${role}:revoke`);
    setMsg(null);
    try {
      const r = await fetch("/api/roles/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg({ kind: "ok", text: `Rôle ${L[role]} retiré.` });
        await load(q);
      } else {
        setMsg({ kind: "err", text: d.error ?? "Erreur" });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="admin-roles">
      <header className="admin-roles-head">
        <p className="admin-roles-eye">
          {locale === "en" ? "Administration" : "Administration"}
        </p>
        <h1 className="admin-roles-h">
          {locale === "en" ? "Manage user roles" : "Gérer les rôles"}
        </h1>
        <p className="admin-roles-sub">
          {locale === "en"
            ? "Grant or revoke access to Learner, Teacher, Center, or Admin spaces. One account can hold several roles."
            : "Accorder ou retirer l'accès aux espaces Apprenant, Enseignant, Centre ou Admin. Un compte peut porter plusieurs rôles."}
        </p>
      </header>

      <div className="admin-roles-search">
        <label htmlFor="q" className="admin-roles-lbl">
          {locale === "en" ? "Search account" : "Rechercher un compte"}
        </label>
        <input
          id="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load(q);
          }}
          placeholder={locale === "en" ? "email or name…" : "email ou nom…"}
          className="admin-roles-input"
        />
        <button
          type="button"
          className="admin-roles-btn"
          onClick={() => load(q)}
          disabled={loading}
        >
          {loading ? "…" : locale === "en" ? "Search" : "Rechercher"}
        </button>
      </div>

      {msg ? (
        <div className={`admin-roles-msg ${msg.kind}`} role="status">
          {msg.text}
        </div>
      ) : null}

      <ul className="admin-roles-list" aria-label="Comptes">
        {rows.length === 0 && !loading ? (
          <li className="admin-roles-empty">
            {locale === "en" ? "No accounts found." : "Aucun compte trouvé."}
          </li>
        ) : null}
        {rows.map((u) => {
          const activeRoles = new Set(u.userRoles.map((r) => r.role));
          return (
            <li key={u.id} className="admin-roles-row">
              <div className="admin-roles-who">
                <span className="admin-roles-name">{u.fullName}</span>
                <span className="admin-roles-mail">{u.email}</span>
              </div>
              <div className="admin-roles-chips">
                {ROLES.map((r) => {
                  const isActive = activeRoles.has(r);
                  const key = `${u.id}:${r}`;
                  const isBusy = busy === `${key}:grant` || busy === `${key}:revoke`;
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`admin-roles-chip ${isActive ? "on" : ""}`}
                      disabled={isBusy}
                      onClick={() => (isActive ? revoke(u.id, r) : grant(u.id, r))}
                      aria-pressed={isActive}
                      aria-label={
                        isActive
                          ? `Retirer ${L[r]} à ${u.fullName}`
                          : `Accorder ${L[r]} à ${u.fullName}`
                      }
                    >
                      <span className="admin-roles-chip-lbl">{L[r]}</span>
                      {isActive ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M2 6l3 3 5-6"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M6 2v8M2 6h8"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

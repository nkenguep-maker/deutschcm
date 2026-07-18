"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import type { SpaceRole } from "@/components/SpaceSwitcher";

// Admin · Comptes
// Liste globale de tous les comptes YEMA. Recherche + filtrage.
// Réutilise l'API /api/roles/list qui existe déjà (admin-only).
// Pour la gestion des rôles précise → /admin/roles.

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  userRoles: Array<{
    role: SpaceRole;
    onboarded: boolean;
    createdAt: string;
  }>;
}

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  searchPh: string;
  searchBtn: string;
  cols: [string, string, string, string];
  empty: string;
  emptySub: string;
  rolesEdit: string;
  loading: string;
  networkErr: string;
}

const FR: Copy = {
  title: "Comptes",
  eye: "Administration",
  h: "Tous les comptes YEMA.",
  sub: "Vue globale des utilisateur·rice·s. Recherche par email ou nom, ouverture de la fiche pour éditer les rôles.",
  searchPh: "Rechercher un compte…",
  searchBtn: "Rechercher",
  cols: ["Nom", "Email", "Rôles actifs", ""],
  empty: "Aucun compte trouvé.",
  emptySub: "Essaie une autre recherche, ou réinitialise le filtre.",
  rolesEdit: "Modifier les rôles",
  loading: "Chargement…",
  networkErr: "Le réseau a lâché. Réessayez.",
};

const EN: Copy = {
  title: "Accounts",
  eye: "Administration",
  h: "All YEMA accounts.",
  sub: "Global view of users. Search by email or name, open the profile to edit roles.",
  searchPh: "Search an account…",
  searchBtn: "Search",
  cols: ["Name", "Email", "Active roles", ""],
  empty: "No account found.",
  emptySub: "Try another search, or clear the filter.",
  rolesEdit: "Edit roles",
  loading: "Loading…",
  networkErr: "Network dropped. Try again.",
};

const ROLE_LABEL_FR: Record<SpaceRole, string> = {
  STUDENT: "Apprenant·e",
  TEACHER: "Enseignant·e",
  CENTER: "Centre",
  ADMIN: "Admin",
};
const ROLE_LABEL_EN: Record<SpaceRole, string> = {
  STUDENT: "Learner",
  TEACHER: "Teacher",
  CENTER: "Center",
  ADMIN: "Admin",
};

export default function AdminUsersPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const L = locale === "en" ? ROLE_LABEL_EN : ROLE_LABEL_FR;
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/roles/list?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (r.ok) setRows(d.users ?? []);
      else setErr(d.error ?? t.networkErr);
    } catch {
      setErr(t.networkErr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("");
  }, []);

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

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            aria-label={t.searchPh}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void load(q); }}
            placeholder={t.searchPh}
            className="modal-input"
            style={{ flex: 1, minWidth: 260 }}
          />
          <button
            type="button"
            className="subpage-cta"
            onClick={() => load(q)}
            disabled={loading}
          >
            {loading ? "…" : t.searchBtn}
          </button>
        </div>

        {err && (
          <StateBlock
            kind="error"
            compact
            soul={locale === "en"
              ? "The network dropped. *Not your work.*"
              : "Le réseau a lâché. *Pas votre travail.*"}
            body={err}
            action={{ label: t.searchBtn, onClick: () => load(q) }}
          />
        )}

        {!err && !loading && rows.length === 0 && (
          <StateBlock
            kind="empty"
            centered
            soul={locale === "en"
              ? "Nothing by that name. *Try again ?*"
              : "Rien à ce nom. *Réessaie ?*"}
            body={t.emptySub}
          />
        )}

        {rows.length > 0 && (
          <div className="data-table-wrap">
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {t.cols.map((c, i) => <th key={i}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="mono-cell-name" style={{ fontSize: 13.5 }}>
                          {u.fullName}
                        </span>
                      </td>
                      <td>
                        <span className="mono-cell-mail">{u.email}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {u.userRoles.length === 0 ? (
                            <span style={{ color: "var(--creme-mute)", fontSize: 12 }}>—</span>
                          ) : (
                            u.userRoles.map((r) => (
                              <span key={r.role} className={`status-pill ${r.onboarded ? "active" : "pending"}`}>
                                {L[r.role]}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <Link href="/admin/roles" className="row-btn">
                          {t.rolesEdit}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

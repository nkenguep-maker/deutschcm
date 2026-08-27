"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";

type InviteRow = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  finalized: boolean;
  issuedByMe: boolean;
};

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: InviteRow[] };

function formatDate(value: string, en: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BetaInvitationHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const locale = useLocale();
  const en = locale === "en";
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    fetch("/api/admin/beta/invitations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as { items?: InviteRow[] };
      })
      .then((payload) => setState({ kind: "ready", items: payload.items ?? [] }))
      .catch(() => setState({ kind: "error" }));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const labelFor = (row: InviteRow) => {
    if (row.status === "REVOKED") return en ? "Revoked" : "Révoquée";
    if (row.status === "ACCEPTED" && row.finalized) return en ? "Accepted" : "Acceptée";
    if (row.status === "ACCEPTED") return en ? "Activation in progress" : "Activation en cours";
    if (new Date(row.expiresAt).getTime() <= Date.now()) return en ? "Expired" : "Expirée";
    return en ? "Pending" : "En attente";
  };

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" aria-labelledby="beta-history-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#d7b56d]">Ledger</p>
          <h2 id="beta-history-title" className="mt-2 text-2xl font-semibold">
            {en ? "Recent invitations" : "Invitations récentes"}
          </h2>
        </div>
        <button type="button" onClick={load} className="min-h-11 rounded-full border border-white/15 px-4 py-2 text-sm text-white/75">
          {en ? "Refresh" : "Actualiser"}
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/55">
        {en
          ? "Privacy-safe operational view: no email address and no invitation token are exposed here."
          : "Vue opérationnelle respectueuse de la confidentialité : aucune adresse e-mail ni aucun token d’invitation n’est affiché ici."}
      </p>

      {state.kind === "loading" ? <p className="mt-6 text-sm text-white/55">{en ? "Loading…" : "Chargement…"}</p> : null}
      {state.kind === "error" ? <p role="alert" className="mt-6 text-sm text-red-100">{en ? "Unable to load invitation history." : "Impossible de charger l’historique des invitations."}</p> : null}
      {state.kind === "ready" && state.items.length === 0 ? <p className="mt-6 text-sm text-white/55">{en ? "No invitation yet." : "Aucune invitation pour le moment."}</p> : null}

      {state.kind === "ready" && state.items.length > 0 ? (
        <ul className="mt-6 grid list-none gap-3 p-0">
          {state.items.map((row) => (
            <li key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{labelFor(row)}</div>
                  <div className="mt-1 text-xs text-white/50">
                    {en ? "Created" : "Créée"} {formatDate(row.createdAt, en)} · {en ? "expires" : "expire"} {formatDate(row.expiresAt, en)}
                  </div>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">
                  {row.issuedByMe ? (en ? "Issued by you" : "Émise par vous") : (en ? "Other admin" : "Autre admin")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader, DashboardStatusChip } from "@/features/dashboards/shared";
import type { CenterPendingRow } from "../types";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; items: CenterPendingRow[] };

type Props = { baseHref: string; locale: "fr" | "en" };

export function CenterPendingSection({ baseHref, locale }: Props) {
  const en = locale === "en";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/center/pending?pageSize=50", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { items?: CenterPendingRow[] };
      })
      .then((json) => { if (!cancelled) setState({ kind: "ready", items: json.items ?? [] }); })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="a-traiter" aria-labelledby="center-pending-title" style={{ display: "grid", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="center-pending-title">{en ? "Pending requests" : "À traiter"}</span>}
        description={en ? "Enrollment requests waiting for teacher approval in your center." : "Demandes d’inscription en attente de validation par l’enseignant de la classe."}
      />
      {state.kind === "loading" ? <DashboardCard>{en ? "Loading…" : "Chargement…"}</DashboardCard> : null}
      {state.kind === "error" ? <DashboardCard><DashboardEmptyState title={en ? "Unable to load pending requests." : "Impossible de charger les demandes en attente."} /></DashboardCard> : null}
      {state.kind === "ready" && state.items.length === 0 ? <DashboardCard><DashboardEmptyState title={en ? "No pending request." : "Aucune demande en attente."} /></DashboardCard> : null}
      {state.kind === "ready" && state.items.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {state.items.map((item) => (
            <li key={item.id}>
              <DashboardCard>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 650 }}>{item.fromUserFullName || (en ? "Learner" : "Apprenant")}</div>
                    <div style={{ marginTop: 5, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                      <DashboardStatusChip tone="alert">{en ? "Pending" : "En attente"}</DashboardStatusChip>
                      <span style={{ fontSize: 12.5, color: "var(--yema-text-muted)" }}>{item.toClassroomName}</span>
                    </div>
                  </div>
                  <Link href={`${baseHref}/classes/${item.toClassroomId}`} style={{ color: "var(--yema-gold-light)", textDecoration: "none" }}>
                    {en ? "Open class →" : "Ouvrir la classe →"}
                  </Link>
                </div>
              </DashboardCard>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

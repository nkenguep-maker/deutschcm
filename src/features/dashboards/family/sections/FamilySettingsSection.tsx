"use client";

import { DashboardCard, DashboardSectionHeader, DashboardStatusChip } from "@/features/dashboards/shared";
import type { FamilyDashboardResponse } from "../types";

type Props = {
  data: FamilyDashboardResponse;
  locale: "fr" | "en";
};

export function FamilySettingsSection({ data, locale }: Props) {
  const en = locale === "en";
  const seatsUsed = data.seats.reduce((sum, seat) => sum + seat.seatsUsed, 0);
  const seatsTotal = data.seats.reduce((sum, seat) => sum + seat.seatsTotal, 0);
  const protectedChildren = data.children.filter((child) => child.hasPin).length;
  const access = [data.adultAccess.monde ? "Monde" : null, data.adultAccess.racines ? "Racines" : null].filter(Boolean);

  return (
    <section id="parametres" aria-labelledby="parametres-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="parametres-title">{en ? "Family settings" : "Paramètres famille"}</span>}
        description={en ? "Account, access and child-space security." : "Compte, accès et sécurité des espaces enfants."}
      />

      <DashboardCard>
        <h3 style={{ margin: "0 0 10px", fontSize: 14.5, fontWeight: 600 }}>{en ? "Guardian account" : "Compte parent"}</h3>
        <div style={{ display: "grid", gap: 7, fontSize: 13 }}>
          <div><strong>{en ? "Name" : "Nom"}:</strong> {data.guardian.fullName?.trim() || "—"}</div>
          <div><strong>{en ? "City" : "Ville"}:</strong> {data.guardian.city?.trim() || "—"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
            <DashboardStatusChip tone={data.guardian.hasParentRole ? "success" : "muted"}>{en ? "Parent role" : "Rôle parent"}</DashboardStatusChip>
            <DashboardStatusChip tone={data.guardian.hasHousehold ? "success" : "muted"}>{en ? "Family household" : "Foyer famille"}</DashboardStatusChip>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 10px", fontSize: 14.5, fontWeight: 600 }}>{en ? "Current access" : "Accès actuels"}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {access.length > 0 ? access.map((item) => <DashboardStatusChip key={item} tone="gold">{item}</DashboardStatusChip>) : <DashboardStatusChip tone="muted">{en ? "No adult access" : "Aucun accès adulte"}</DashboardStatusChip>}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--yema-text-muted)" }}>
          {en ? `${seatsUsed} of ${seatsTotal} child seats currently used.` : `${seatsUsed} siège(s) enfant utilisé(s) sur ${seatsTotal}.`}
        </div>
        {data.seats.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 7 }}>
            {data.seats.map((seat) => (
              <li key={`${seat.universe}-${seat.productCode}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
                <span>{seat.universe} · {seat.productCode}</span>
                <span className="yema-mono">{seat.seatsUsed}/{seat.seatsTotal}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardCard>

      <DashboardCard>
        <h3 style={{ margin: "0 0 10px", fontSize: 14.5, fontWeight: 600 }}>{en ? "Child PIN security" : "Sécurité PIN enfants"}</h3>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--yema-text-muted)" }}>
          {en ? `${protectedChildren} of ${data.children.length} child profiles are PIN protected.` : `${protectedChildren} profil(s) enfant sur ${data.children.length} sont protégés par PIN.`}
        </p>
        {data.children.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 7 }}>
            {data.children.map((child) => (
              <li key={child.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span>{child.prenom}</span>
                <DashboardStatusChip tone={child.hasPin ? "success" : "alert"}>{child.hasPin ? (en ? "PIN active" : "PIN actif") : (en ? "PIN missing" : "PIN manquant")}</DashboardStatusChip>
              </li>
            ))}
          </ul>
        ) : <span style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>{en ? "No child profile yet." : "Aucun profil enfant pour le moment."}</span>}
      </DashboardCard>
    </section>
  );
}

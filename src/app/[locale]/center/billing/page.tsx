"use client";

import { useState } from "react";
import CenterLayout from "@/components/CenterLayout";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: 25000,
    icon: "🌱",
    color: "#64748b",
    teachers: 5,
    students: 100,
    features: [
      "5 enseignants maximum",
      "100 élèves maximum",
      "Tableau de bord centre",
      "Rapports mensuels",
      "Support email",
    ],
    current: false,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 75000,
    icon: "⭐",
    color: "#eab308",
    teachers: 20,
    students: 500,
    features: [
      "20 enseignants maximum",
      "500 élèves maximum",
      "Statistiques avancées",
      "Export CSV/PDF",
      "Simulateur IA illimité",
      "Support prioritaire",
      "Intégration Mobile Money",
    ],
    current: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 150000,
    icon: "🏆",
    color: "#6366f1",
    teachers: -1,
    students: -1,
    features: [
      "Enseignants illimités",
      "Élèves illimités",
      "API dédiée",
      "Formations sur site",
      "Manager dédié",
      "SLA 99,9%",
      "Personnalisation complète",
    ],
    current: false,
  },
];

const HISTORY = [
  { id: "p1", date: "2025-05-01", amount: 75000, method: "MTN Mobile Money", phone: "677 45 23 10", status: "SUCCESS", ref: "MTNCI-2025050187234" },
  { id: "p2", date: "2025-04-01", amount: 75000, method: "MTN Mobile Money", phone: "677 45 23 10", status: "SUCCESS", ref: "MTNCI-2025040162811" },
  { id: "p3", date: "2025-03-01", amount: 75000, method: "Orange Money",     phone: "655 12 98 44", status: "SUCCESS", ref: "OM-2025030195532" },
  { id: "p4", date: "2025-02-01", amount: 75000, method: "MTN Mobile Money", phone: "677 45 23 10", status: "FAILED",  ref: "MTNCI-2025020148119" },
  { id: "p5", date: "2025-02-02", amount: 75000, method: "Orange Money",     phone: "655 12 98 44", status: "SUCCESS", ref: "OM-2025020299843" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  SUCCESS: { bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)",  label: "Succès" },
  FAILED:  { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "rgba(239,68,68,0.3)",   label: "Échoué" },
  PENDING: { bg: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.3)",   label: "En cours" },
};

export default function CenterBillingPage() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [payMethod, setPayMethod] = useState<"MTN" | "ORANGE">("MTN");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  const currentPlan = PLANS.find(p => p.current)!;
  const renewDate = new Date("2025-05-16").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const openPay = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    setStep("form");
    setShowPayModal(true);
  };

  return (
    <CenterLayout title="Facturation">

      {/* Current plan banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(161,120,0,0.04))",
        border: "1px solid rgba(234,179,8,0.25)", borderRadius: 16, padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>⭐</div>
          <div>
            <div style={{ color: "#eab308", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
              Plan {currentPlan.name} · Actif
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 }}>
              {currentPlan.teachers} enseignants · {currentPlan.students} élèves · Renouvellement le {renewDate}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#eab308", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>
              {currentPlan.price.toLocaleString("fr-FR")} XAF
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>par mois</div>
          </div>
          <button onClick={() => openPay(currentPlan)} style={{
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            color: "#080c10", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            Renouveler →
          </button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: "0 0 16px", color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Choisir un plan
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.current ? "rgba(234,179,8,0.05)" : "rgba(13,17,23,0.8)",
              border: `2px solid ${plan.current ? "rgba(234,179,8,0.4)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 16, padding: 24, display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{plan.icon}</div>
                  <div style={{ color: plan.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>{plan.name}</div>
                </div>
                {plan.current && (
                  <span style={{
                    background: "rgba(234,179,8,0.15)", color: "#eab308",
                    border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20,
                    padding: "3px 10px", fontSize: 10, fontWeight: 700,
                  }}>ACTUEL</span>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: plan.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26 }}>
                  {plan.price.toLocaleString("fr-FR")}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}> XAF/mois</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>
                {plan.teachers === -1 ? "Enseignants illimités" : `Jusqu'à ${plan.teachers} enseignants`} ·{" "}
                {plan.students === -1 ? "Élèves illimités" : `${plan.students} élèves`}
              </div>
              <ul style={{ margin: "0 0 20px", padding: "0 0 0 0", listStyle: "none", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: plan.color, fontSize: 13, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openPay(plan)}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: plan.current
                    ? "linear-gradient(135deg, #eab308, #ca8a04)"
                    : `rgba(${plan.color === "#6366f1" ? "99,102,241" : "100,116,139"},0.1)`,
                  color: plan.current ? "#080c10" : plan.color,
                  border: `1px solid ${plan.current ? "transparent" : plan.color + "44"}`,
                  fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif",
                }}
              >
                {plan.current ? "Renouveler" : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
        <h3 style={{ margin: "0 0 20px", color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
          Historique des paiements
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Date", "Montant", "Méthode", "Téléphone", "Référence", "Statut"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((p, i) => {
              const ss = STATUS_STYLE[p.status];
              return (
                <tr key={p.id} style={{ borderBottom: i < HISTORY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    {new Date(p.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
                    {p.amount.toLocaleString("fr-FR")} XAF
                  </td>
                  <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    {p.method.includes("MTN") ? "🟡" : "🟠"} {p.method}
                  </td>
                  <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{p.phone}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <code style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>
                      {p.ref}
                    </code>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {ss.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pay modal */}
      {showPayModal && selectedPlan && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div style={{ background: "#0d1117", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw" }}>
            {step === "form" && (
              <>
                <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                  Paiement — Plan {selectedPlan.name}
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>
                  {selectedPlan.price.toLocaleString("fr-FR")} XAF / mois · Via Mobile Money
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {(["MTN", "ORANGE"] as const).map(m => (
                    <button key={m} onClick={() => setPayMethod(m)} style={{
                      flex: 1, padding: "12px 0", borderRadius: 10, cursor: "pointer",
                      background: payMethod === m
                        ? m === "MTN" ? "rgba(234,179,8,0.15)" : "rgba(249,115,22,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: payMethod === m ? (m === "MTN" ? "#eab308" : "#f97316") : "rgba(255,255,255,0.35)",
                      border: `1px solid ${payMethod === m ? (m === "MTN" ? "rgba(234,179,8,0.35)" : "rgba(249,115,22,0.35)") : "rgba(255,255,255,0.07)"}`,
                      fontWeight: 700, fontSize: 13,
                    }}>
                      {m === "MTN" ? "🟡 MTN MoMo" : "🟠 Orange Money"}
                    </button>
                  ))}
                </div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Numéro de téléphone
                </label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder={payMethod === "MTN" ? "6XX XX XX XX" : "655 XX XX XX"}
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 24 }}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowPayModal(false)} style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>Annuler</button>
                  <button onClick={() => setStep("confirm")} style={{ background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "#080c10", border: "none", borderRadius: 8, padding: "8px 24px", cursor: "pointer", fontWeight: 700 }}>
                    Confirmer
                  </button>
                </div>
              </>
            )}
            {step === "confirm" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                  <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                    Confirmez sur votre téléphone
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                    Une demande de paiement a été envoyée au <br />
                    <strong style={{ color: "#eab308" }}>{phone}</strong>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>
                    Montant : <strong style={{ color: "#e2e8f0" }}>{selectedPlan.price.toLocaleString("fr-FR")} XAF</strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => setStep("form")} style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>Retour</button>
                  <button onClick={() => setStep("done")} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 24px", cursor: "pointer", fontWeight: 700 }}>
                    J&apos;ai validé →
                  </button>
                </div>
              </>
            )}
            {step === "done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <div style={{ color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                  Paiement confirmé !
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 24 }}>
                  Votre plan {selectedPlan.name} est actif jusqu&apos;au {new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
                </div>
                <button onClick={() => setShowPayModal(false)} style={{ background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "#080c10", border: "none", borderRadius: 8, padding: "10px 28px", cursor: "pointer", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </CenterLayout>
  );
}

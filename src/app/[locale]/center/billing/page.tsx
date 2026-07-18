"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";
import { IconCheck } from "@/components/landing/icons";

interface Plan {
  id: "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  price: number;
  teachers: number; // -1 = illimité
  students: number;
  features: (locale: "fr" | "en") => string[];
  highlight?: boolean;
  current?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: 25000,
    teachers: 5,
    students: 100,
    features: (l) => l === "en" ? [
      "Up to 5 teachers",
      "Up to 100 learners",
      "Center dashboard",
      "Monthly reports",
      "Email support",
    ] : [
      "Jusqu'à 5 enseignant·e·s",
      "Jusqu'à 100 apprenant·e·s",
      "Tableau de bord centre",
      "Rapports mensuels",
      "Support email",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 75000,
    teachers: 20,
    students: 500,
    highlight: true,
    current: true,
    features: (l) => l === "en" ? [
      "Up to 20 teachers",
      "Up to 500 learners",
      "Advanced statistics",
      "CSV / PDF exports",
      "Unlimited AI simulator",
      "Priority support",
      "Mobile Money integration",
    ] : [
      "Jusqu'à 20 enseignant·e·s",
      "Jusqu'à 500 apprenant·e·s",
      "Statistiques avancées",
      "Exports CSV · PDF",
      "Simulateur IA illimité",
      "Support prioritaire",
      "Intégration Mobile Money",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 150000,
    teachers: -1,
    students: -1,
    features: (l) => l === "en" ? [
      "Unlimited teachers",
      "Unlimited learners",
      "Dedicated API",
      "On-site training",
      "Dedicated manager",
      "SLA 99.9%",
      "Full customization",
    ] : [
      "Enseignant·e·s illimité·e·s",
      "Apprenant·e·s illimité·e·s",
      "API dédiée",
      "Formations sur site",
      "Manager dédié",
      "SLA 99,9%",
      "Personnalisation complète",
    ],
  },
];

const HISTORY = [
  { id: "p1", date: "2026-05-01", amount: 75000, method: "MTN MoMo",     phone: "677 45 23 10", status: "SUCCESS" as const, ref: "MTN-2026050187234" },
  { id: "p2", date: "2026-04-01", amount: 75000, method: "MTN MoMo",     phone: "677 45 23 10", status: "SUCCESS" as const, ref: "MTN-2026040162811" },
  { id: "p3", date: "2026-03-01", amount: 75000, method: "Orange Money", phone: "655 12 98 44", status: "SUCCESS" as const, ref: "OM-2026030195532" },
  { id: "p4", date: "2026-02-02", amount: 75000, method: "Orange Money", phone: "655 12 98 44", status: "SUCCESS" as const, ref: "OM-2026020299843" },
  { id: "p5", date: "2026-02-01", amount: 75000, method: "MTN MoMo",     phone: "677 45 23 10", status: "FAILED" as const,  ref: "MTN-2026020148119" },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  currentPlanLbl: string;
  currentPlanSub: (teachers: string, students: string, renew: string) => string;
  perMonth: string;
  renewCta: string;
  plansEye: string;
  plansH: string;
  planLimits: (t: string, s: string) => string;
  unlimitedT: string;
  unlimitedS: (n: number) => string;
  upToT: (n: number) => string;
  currentBadge: string;
  chooseCta: string;
  renewSame: string;
  historyEye: string;
  historyH: string;
  historyCols: [string, string, string, string, string, string];
  statusLbl: Record<"SUCCESS" | "FAILED" | "PENDING", string>;
  modalEye: string;
  modalHForm: string;
  modalHConfirm: string;
  modalHDone: string;
  modalSubForm: (price: string) => string;
  modalPhoneLbl: string;
  modalPhonePh: string;
  modalConfirmSub: (phone: string, amount: string) => string;
  modalDoneSub: (plan: string, date: string) => string;
  back: string;
  cancel: string;
  confirm: string;
  validated: string;
  close: string;
}

const FR: Copy = {
  title: "Facturation",
  eye: "Facturation",
  h: "L'abonnement de ton centre.",
  sub: "Trois plans, Mobile Money natif, factures téléchargeables en XAF. Aucun engagement au-delà du mois en cours.",
  currentPlanLbl: "Plan actif",
  currentPlanSub: (teachers, students, renew) => `${teachers} · ${students} · renouvellement le ${renew}.`,
  perMonth: "par mois",
  renewCta: "Renouveler",
  plansEye: "Plans",
  plansH: "Choisir ou ajuster.",
  planLimits: (t, s) => `${t} · ${s}`,
  unlimitedT: "Enseignant·e·s illimité·e·s",
  unlimitedS: (n) => n === -1 ? "Apprenant·e·s illimité·e·s" : `${n} apprenant·e·s`,
  upToT: (n) => `Jusqu'à ${n} enseignant·e·s`,
  currentBadge: "Actuel",
  chooseCta: "Choisir ce plan",
  renewSame: "Renouveler",
  historyEye: "Historique",
  historyH: "Paiements du centre.",
  historyCols: ["Date", "Montant", "Méthode", "Téléphone", "Référence", "Statut"],
  statusLbl: { SUCCESS: "Réussi", FAILED: "Échec", PENDING: "En cours" },
  modalEye: "Paiement",
  modalHForm: "Payer par Mobile Money",
  modalHConfirm: "Confirme sur ton téléphone",
  modalHDone: "Paiement confirmé.",
  modalSubForm: (price) => `Montant : ${price} XAF. Aucun débit avant validation sur le mobile.`,
  modalPhoneLbl: "Numéro de téléphone",
  modalPhonePh: "6xx xx xx xx",
  modalConfirmSub: (phone, amount) =>
    `Une demande a été envoyée au ${phone}. Valide-la depuis ton application MoMo. Montant : ${amount} XAF.`,
  modalDoneSub: (plan, date) =>
    `Ton plan ${plan} est actif jusqu'au ${date}. Merci.`,
  back: "Retour",
  cancel: "Annuler",
  confirm: "Confirmer",
  validated: "J'ai validé",
  close: "Fermer",
};

const EN: Copy = {
  title: "Billing",
  eye: "Billing",
  h: "Your center's subscription.",
  sub: "Three plans, native Mobile Money, downloadable XAF invoices. No commitment beyond the current month.",
  currentPlanLbl: "Active plan",
  currentPlanSub: (teachers, students, renew) => `${teachers} · ${students} · renews on ${renew}.`,
  perMonth: "per month",
  renewCta: "Renew",
  plansEye: "Plans",
  plansH: "Pick or adjust.",
  planLimits: (t, s) => `${t} · ${s}`,
  unlimitedT: "Unlimited teachers",
  unlimitedS: (n) => n === -1 ? "Unlimited learners" : `${n} learners`,
  upToT: (n) => `Up to ${n} teachers`,
  currentBadge: "Current",
  chooseCta: "Choose this plan",
  renewSame: "Renew",
  historyEye: "History",
  historyH: "Center payments.",
  historyCols: ["Date", "Amount", "Method", "Phone", "Reference", "Status"],
  statusLbl: { SUCCESS: "Success", FAILED: "Failed", PENDING: "Pending" },
  modalEye: "Payment",
  modalHForm: "Pay via Mobile Money",
  modalHConfirm: "Confirm on your phone",
  modalHDone: "Payment confirmed.",
  modalSubForm: (price) => `Amount: ${price} XAF. No charge until you confirm on your phone.`,
  modalPhoneLbl: "Phone number",
  modalPhonePh: "6xx xx xx xx",
  modalConfirmSub: (phone, amount) =>
    `A request was sent to ${phone}. Confirm it from your MoMo app. Amount: ${amount} XAF.`,
  modalDoneSub: (plan, date) =>
    `Your ${plan} plan is active until ${date}. Thank you.`,
  back: "Back",
  cancel: "Cancel",
  confirm: "Confirm",
  validated: "I confirmed",
  close: "Close",
};

export default function CenterBillingPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payMethod, setPayMethod] = useState<"MTN" | "ORANGE">("MTN");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [doneDate, setDoneDate] = useState("");

  const current = PLANS.find((p) => p.current)!;
  const renewDate = new Date("2026-06-01").toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoneDate(new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" }));
  }, [dateLocale]);

  const openPay = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep("form");
    setPhone("");
    setShowModal(true);
  };

  const teacherLimitLabel = (p: Plan) => p.teachers === -1 ? t.unlimitedT : t.upToT(p.teachers);
  const studentLimitLabel = (p: Plan) => t.unlimitedS(p.students);

  return (
    <CenterLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <div style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(184, 135, 62, 0.14), rgba(184, 135, 62, 0.03))",
          border: "1px solid var(--brass-edge)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-jetbrains, monospace)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--brass)",
              margin: 0,
            }}>{t.currentPlanLbl}</p>
            <h3 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 24,
              color: "var(--creme)",
              margin: 0,
              fontWeight: 400,
            }}>{current.name}</h3>
            <p style={{ color: "var(--creme-soft)", fontSize: 13, margin: 0 }}>
              {t.currentPlanSub(teacherLimitLabel(current), studentLimitLabel(current), renewDate)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 26,
                color: "var(--creme)",
                margin: 0,
                lineHeight: 1,
              }}>
                {current.price.toLocaleString(dateLocale)} <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "var(--brass)" }}>XAF</span>
              </p>
              <p style={{ color: "var(--creme-mute)", fontSize: 11, margin: "4px 0 0", fontFamily: "var(--font-jetbrains, monospace)" }}>
                {t.perMonth}
              </p>
            </div>
            <button type="button" className="subpage-cta" onClick={() => openPay(current)}>
              {t.renewCta}
            </button>
          </div>
        </div>

        <section>
          <p className="dash-eye">{t.plansEye}</p>
          <h2 className="dash-block-h">{t.plansH}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {PLANS.map((plan) => (
              <div key={plan.id} style={{
                padding: 24,
                background: plan.highlight ? "rgba(184, 135, 62, 0.06)" : "var(--espresso-2)",
                border: `1px solid ${plan.highlight ? "var(--brass-edge)" : "var(--creme-hair)"}`,
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
              }}>
                {plan.current && (
                  <span style={{
                    position: "absolute",
                    top: 16, right: 16,
                    padding: "3px 10px",
                    background: "var(--brass)",
                    color: "var(--espresso)",
                    borderRadius: 999,
                    fontSize: 10,
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                  }}>{t.currentBadge}</span>
                )}

                <div>
                  <h3 style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: 22,
                    color: "var(--creme)",
                    margin: "0 0 8px",
                    fontWeight: 400,
                  }}>{plan.name}</h3>
                  <p style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: 32,
                    color: plan.highlight ? "var(--brass)" : "var(--creme)",
                    margin: 0,
                    lineHeight: 1,
                    fontWeight: 400,
                  }}>
                    {plan.price.toLocaleString(dateLocale)}
                    <span style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      fontSize: 12,
                      color: "var(--creme-mute)",
                      letterSpacing: "0.08em",
                      marginLeft: 6,
                    }}>XAF / {t.perMonth}</span>
                  </p>
                  <p style={{
                    color: "var(--creme-mute)",
                    fontSize: 12,
                    marginTop: 8,
                    fontFamily: "var(--font-jetbrains, monospace)",
                    letterSpacing: "0.04em",
                  }}>
                    {t.planLimits(teacherLimitLabel(plan), studentLimitLabel(plan))}
                  </p>
                </div>

                <ul style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}>
                  {plan.features(locale === "en" ? "en" : "fr").map((f) => (
                    <li key={f} style={{ color: "var(--creme-soft)", fontSize: 13, display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--brass)", flexShrink: 0, marginTop: 3 }} aria-hidden="true">
                        <IconCheck size={13} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`subpage-cta ${plan.current ? "" : "ghost"}`}
                  style={{ justifyContent: "center", width: "100%" }}
                  onClick={() => openPay(plan)}
                >
                  {plan.current ? t.renewSame : t.chooseCta}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="dash-eye">{t.historyEye}</p>
          <h2 className="dash-block-h">{t.historyH}</h2>
          <div className="data-table-wrap">
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {t.historyCols.map((c) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.date).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })}</td>
                      <td style={{ fontFamily: "var(--font-jetbrains, monospace)", color: "var(--creme)" }}>
                        {p.amount.toLocaleString(dateLocale)} XAF
                      </td>
                      <td>{p.method}</td>
                      <td style={{ fontFamily: "var(--font-jetbrains, monospace)", color: "var(--creme-mute)" }}>{p.phone}</td>
                      <td>
                        <code style={{
                          fontFamily: "var(--font-jetbrains, monospace)",
                          color: "var(--creme-mute)",
                          fontSize: 11,
                          background: "var(--brass-glow)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid var(--brass-edge)",
                        }}>{p.ref}</code>
                      </td>
                      <td>
                        <span className={`status-pill ${p.status === "SUCCESS" ? "active" : p.status === "FAILED" ? "warning" : "pending"}`}>
                          {t.statusLbl[p.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>

      {showModal && selectedPlan && (
        <div
          className="modal-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-h"
        >
          <div className="modal-card">
            <p className="modal-eye">{t.modalEye} · {selectedPlan.name}</p>

            {step === "form" && (
              <>
                <h3 id="pay-h" className="modal-h">{t.modalHForm}</h3>
                <p className="modal-sub">{t.modalSubForm(selectedPlan.price.toLocaleString(dateLocale))}</p>

                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  {(["MTN", "ORANGE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`subpage-filter ${payMethod === m ? "on" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setPayMethod(m)}
                    >
                      {m === "MTN" ? "MTN MoMo" : "Orange Money"}
                    </button>
                  ))}
                </div>

                <div className="modal-form">
                  <div className="modal-field">
                    <label htmlFor="pay-phone" className="modal-lbl">{t.modalPhoneLbl}</label>
                    <input
                      id="pay-phone"
                      type="tel"
                      className="modal-input"
                      placeholder={t.modalPhonePh}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="subpage-cta ghost" onClick={() => setShowModal(false)}>
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    className="subpage-cta"
                    disabled={!phone}
                    onClick={() => setStep("confirm")}
                  >
                    {t.confirm}
                  </button>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <h3 id="pay-h" className="modal-h">{t.modalHConfirm}</h3>
                <p className="modal-sub">
                  {t.modalConfirmSub(phone, selectedPlan.price.toLocaleString(dateLocale))}
                </p>
                <div className="modal-actions">
                  <button type="button" className="subpage-cta ghost" onClick={() => setStep("form")}>
                    {t.back}
                  </button>
                  <button type="button" className="subpage-cta" onClick={() => setStep("done")}>
                    {t.validated}
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <>
                <h3 id="pay-h" className="modal-h">{t.modalHDone}</h3>
                <p className="modal-sub">{t.modalDoneSub(selectedPlan.name, doneDate)}</p>
                <div className="modal-actions">
                  <button type="button" className="subpage-cta" onClick={() => setShowModal(false)}>
                    {t.close}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </CenterLayout>
  );
}

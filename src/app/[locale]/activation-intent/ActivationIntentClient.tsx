"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { StateBlock } from "@/components/StateBlock";
import {
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  AFRICAN_SOLO,
  AFRICAN_FAMILY,
  RACINES_COACH_ADDON,
  RACINES_COACH_OPERATIONAL,
  fmtPriceUnit,
  detectDefaultRail,
  type Rail,
  type LevelId,
} from "@/lib/pricing";
import type { ActivationIntent, CefrLevel } from "@/lib/funnel-state";

interface Props {
  locale: "fr" | "en";
  universe: "MONDE" | "RACINES";
  suggestedLevel: string;
  existingIntent: ActivationIntent | null;
}

const COPY = {
  fr: {
    eye: "Choix d'offre",
    mondeTitle: "Choisir un Passage",
    mondeSub: "Le programme complet d'un niveau, sur quatre mois. Le paiement s'ouvre ensuite.",
    racinesTitle: "Choisir un abonnement Racines",
    racinesSub: "Solo ou Famille. Le paiement s'ouvre ensuite.",
    railLabel: "Devise",
    railXAF: "FCFA",
    railEUR: "EUR",
    levelLabel: "Niveau",
    withTeacher: "Ajouter un suivi professeur",
    teacherComingSoon: "Suivi bientôt disponible",
    solo: "Solo",
    famille: "Famille",
    monthly: "Mensuel",
    yearly: "Annuel",
    coachTitle: "Suivi coach de langue",
    coachSoonBadge: "Bientôt disponible",
    coachSoonBody: "Le suivi coach humain ouvrira en même temps que la messagerie Racines. Aucun paiement possible pour l'instant.",
    save: "Enregistrer mon choix",
    saving: "Enregistrement…",
    savedSoul: "Ton choix est enregistré. *La suite s'écrit avec toi.*",
    savedBody: "Le paiement sera ouvert dès qu'il est prêt. Nous te préviendrons. Ta progression et ton choix restent conservés.",
    savedCta: "Revenir à mon espace",
    errSoul: "La sauvegarde n'a pas abouti. *Réessaie.*",
    errBody: "Une erreur réseau nous empêche d'enregistrer ton choix. Aucun paiement n'a été traité — tu peux réessayer.",
    retry: "Réessayer",
    perNiveau: "par niveau · 4 mois",
    perMonth: "par mois",
    perYear: "par an",
  },
  en: {
    eye: "Offer selection",
    mondeTitle: "Choose a Passage",
    mondeSub: "The complete programme for one level, over four months. Payment opens next.",
    racinesTitle: "Choose a Racines subscription",
    racinesSub: "Solo or Family. Payment opens next.",
    railLabel: "Currency",
    railXAF: "XAF",
    railEUR: "EUR",
    levelLabel: "Level",
    withTeacher: "Add a teacher",
    teacherComingSoon: "Teacher support coming soon",
    solo: "Solo",
    famille: "Family",
    monthly: "Monthly",
    yearly: "Yearly",
    coachTitle: "Language coach",
    coachSoonBadge: "Coming soon",
    coachSoonBody: "Human coach support opens with the Racines messaging. No payment possible right now.",
    save: "Save my choice",
    saving: "Saving…",
    savedSoul: "Your choice is saved. *The next step waits for you.*",
    savedBody: "Payment will open when it's ready. We'll let you know. Your progress and choice stay saved.",
    savedCta: "Back to my space",
    errSoul: "Save didn't go through. *Try again.*",
    errBody: "A network error kept us from saving your choice. No payment was processed — you can retry.",
    retry: "Retry",
    perNiveau: "per level · 4 months",
    perMonth: "per month",
    perYear: "per year",
  },
} as const;

const LEVELS: LevelId[] = ["A1", "A2", "B1", "B2", "C1"];

export function ActivationIntentClient({ locale, universe, suggestedLevel, existingIntent }: Props) {
  const c = COPY[locale];
  const router = useRouter();

  const defaultRail: Rail = useMemo(() => {
    if (existingIntent) return existingIntent.currency === "XAF" ? "fcfa" : "eur";
    if (typeof window !== "undefined") return detectDefaultRail();
    return "eur";
  }, [existingIntent]);

  const [rail, setRail] = useState<Rail>(defaultRail);
  const [level, setLevel] = useState<LevelId>((suggestedLevel as LevelId) ?? "A1");
  const [withTeacher] = useState(false); // suivi pro pas encore opérationnel — verrouillé
  const [racinesOffer, setRacinesOffer] = useState<"SOLO" | "FAMILLE">((existingIntent?.racinesOffer as "SOLO" | "FAMILLE") ?? "SOLO");
  const [racinesPeriod, setRacinesPeriod] = useState<"MONTH" | "YEAR">((existingIntent?.racinesPeriod as "MONTH" | "YEAR") ?? "MONTH");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const currency: "XAF" | "EUR" = rail === "fcfa" ? "XAF" : "EUR";

  const save = async () => {
    setError(false);
    setSaving(true);
    try {
      const intent: ActivationIntent =
        universe === "MONDE"
          ? {
              offer: "PASSAGE",
              cefrLevel: level as CefrLevel,
              withTeacher,
              currency,
              selectedAt: new Date().toISOString(),
            }
          : {
              racinesOffer,
              racinesPeriod,
              currency,
              selectedAt: new Date().toISOString(),
            };
      const resp = await fetch("/api/funnel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { activationIntent: intent } }),
      });
      if (!resp.ok) throw new Error("save failed");
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <main style={{ maxWidth: 620, margin: "0 auto", padding: "80px 16px" }}>
        <StateBlock
          kind="success"
          centered
          soul={c.savedSoul}
          body={c.savedBody}
          action={{ label: c.savedCta, onClick: () => { router.push("/dashboard"); router.refresh(); } }}
        />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px 96px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 8px", color: "var(--brass)",
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c.eye}</p>
        <h1 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26, color: "var(--creme)", margin: "0 0 6px" }}>
          {universe === "MONDE" ? c.mondeTitle : c.racinesTitle}
        </h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>
          {universe === "MONDE" ? c.mondeSub : c.racinesSub}
        </p>
      </header>

      {/* Devise · une seule visible à la fois */}
      <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
        <legend style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{c.railLabel}</legend>
        <div className="filter-row" role="radiogroup" aria-label={c.railLabel}>
          {[
            { r: "fcfa" as Rail, label: c.railXAF },
            { r: "eur" as Rail, label: c.railEUR },
          ].map((opt) => (
            <button
              key={opt.r}
              type="button"
              role="radio"
              aria-checked={rail === opt.r}
              onClick={() => setRail(opt.r)}
              className="subpage-filter"
              style={{ minHeight: 44, ...(rail === opt.r ? { background: "var(--brass-glow)", borderColor: "var(--brass-edge)", color: "var(--brass)" } : {}) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {universe === "MONDE" ? (
        <>
          <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
            <legend style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{c.levelLabel}</legend>
            <div className="filter-row" role="radiogroup" aria-label={c.levelLabel}>
              {LEVELS.map((lv) => {
                const price = WORLD_PASSAGE_PRICES[lv][rail];
                return (
                  <button
                    key={lv}
                    type="button"
                    role="radio"
                    aria-checked={level === lv}
                    onClick={() => setLevel(lv)}
                    className="data-card"
                    style={{
                      minHeight: 88,
                      cursor: "pointer",
                      textAlign: "left",
                      background: level === lv ? "var(--brass-glow)" : "var(--espresso-2)",
                      borderColor: level === lv ? "var(--brass)" : "var(--creme-hair)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, color: level === lv ? "var(--brass)" : "var(--creme)" }}>{lv}</div>
                    <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>{fmtPriceUnit(price, rail)}</div>
                    <div style={{ color: "var(--creme-mute)", fontSize: 11 }}>{c.perNiveau}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Suivi prof · verrouillé tant que la messagerie n'est pas ouverte */}
          <section style={{ margin: "0 0 24px", padding: "14px 16px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 12 }}>
            <p style={{ margin: "0 0 4px", color: "var(--creme)", fontSize: 13, fontWeight: 500 }}>
              {c.withTeacher}
              <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", background: "var(--brass-glow)", color: "var(--brass)", border: "1px solid var(--brass-edge)", borderRadius: 99, fontFamily: "var(--font-jetbrains, monospace)" }}>{c.teacherComingSoon}</span>
            </p>
            <p style={{ margin: 0, color: "var(--creme-mute)", fontSize: 12 }}>
              {fmtPriceUnit(WORLD_TEACHER_ADD[level][rail], rail)}
            </p>
          </section>
        </>
      ) : (
        <>
          <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
            <legend style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Offre</legend>
            <div className="filter-row" role="radiogroup" aria-label="Offre">
              {(["SOLO", "FAMILLE"] as const).map((off) => {
                const table = off === "SOLO" ? AFRICAN_SOLO : AFRICAN_FAMILY;
                const p = racinesPeriod === "MONTH" ? table[rail].month : table[rail].year;
                return (
                  <button
                    key={off}
                    type="button"
                    role="radio"
                    aria-checked={racinesOffer === off}
                    onClick={() => setRacinesOffer(off)}
                    className="data-card"
                    style={{
                      minHeight: 88, cursor: "pointer", textAlign: "left",
                      background: racinesOffer === off ? "var(--brass-glow)" : "var(--espresso-2)",
                      borderColor: racinesOffer === off ? "var(--brass)" : "var(--creme-hair)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, color: racinesOffer === off ? "var(--brass)" : "var(--creme)" }}>
                      {off === "SOLO" ? c.solo : c.famille}
                    </div>
                    <div style={{ color: "var(--creme-soft)", fontSize: 13 }}>{fmtPriceUnit(p, rail)}</div>
                    <div style={{ color: "var(--creme-mute)", fontSize: 11 }}>
                      {racinesPeriod === "MONTH" ? c.perMonth : c.perYear}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px" }}>
            <legend style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Fréquence</legend>
            <div className="filter-row" role="radiogroup" aria-label="Fréquence">
              {(["MONTH", "YEAR"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={racinesPeriod === p}
                  onClick={() => setRacinesPeriod(p)}
                  className="subpage-filter"
                  style={{ minHeight: 44, ...(racinesPeriod === p ? { background: "var(--brass-glow)", borderColor: "var(--brass-edge)", color: "var(--brass)" } : {}) }}
                >
                  {p === "MONTH" ? c.monthly : c.yearly}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Coach Racines · toujours "bientôt" tant que RACINES_COACH_OPERATIONAL=false */}
          <section style={{ margin: "0 0 24px", padding: "14px 16px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 12 }}>
            <p style={{ margin: "0 0 4px", color: "var(--creme)", fontSize: 13, fontWeight: 500 }}>
              {c.coachTitle}
              <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", background: "var(--brass-glow)", color: "var(--brass)", border: "1px solid var(--brass-edge)", borderRadius: 99, fontFamily: "var(--font-jetbrains, monospace)" }}>{c.coachSoonBadge}</span>
            </p>
            <p style={{ margin: "0 0 6px", color: "var(--creme-mute)", fontSize: 12 }}>
              {fmtPriceUnit(RACINES_COACH_ADDON[rail], rail)} — {c.perMonth}
            </p>
            <p style={{ margin: 0, color: "var(--creme-mute)", fontSize: 12, lineHeight: 1.5 }}>
              {c.coachSoonBody}
            </p>
            {/* Le flag RACINES_COACH_OPERATIONAL doit rester false. */}
            {RACINES_COACH_OPERATIONAL ? null : null}
          </section>
        </>
      )}

      {error && (
        <div style={{ marginBottom: 16 }}>
          <StateBlock
            kind="offline"
            compact
            soul={c.errSoul}
            body={c.errBody}
            action={{ label: c.retry, onClick: save }}
          />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="entry-cta entry-cta-primary"
          disabled={saving}
          onClick={save}
          style={{ minHeight: 48 }}
        >
          {saving ? c.saving : c.save}
        </button>
      </div>
    </main>
  );
}

"use client";

// ActivationScreen · écran de passage post-achat / post-upgrade.
// Reçoit un ActivationStatus (payload de /api/activation-status enrichi) et
// rend l'écran plein / carte centrée avec :
//   · le Confluent (BrandY) qui joue la signature au montage puis passe en
//     loader (braise pulse) tant que tout_pret === false ; static à la fin.
//   · une liste de droits — cercle éteint → anneau qui tourne → coche laiton.
//   · la ligne discrète bas.
// Deux ambiances (world / sources) — le shell applique territory-*.
//
// prefers-reduced-motion : BrandY dégrade seul en static ; les coches
// s'affichent sans transition (voir globals.css section activation).

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BrandY } from "@/components/brand/BrandY";
import { frTypo } from "@/components/landing/typo";
import type { ActivationStatus } from "@/lib/entitlements/activation";

type Locale = "fr" | "en";

interface Props {
  locale: Locale;
  status: ActivationStatus;
  /** true dès qu'on entre en fenêtre de grâce (>~20s sans complétion). */
  graceMode: boolean;
  /** Handler du bouton « Aller à mon espace » de la fenêtre de grâce. */
  onGraceContinue: () => void;
}

/** Résout les params i18n qui portent des enums langue/niveau. */
function resolveParams(
  raw: Record<string, string>,
  t: (key: string) => string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "langue" && v) {
      // v est un LanguageCode enum ; on résout via la table langues.
      out[k] = t(`langues.${v}`);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function ActivationScreen({ locale, status, graceMode, onGraceContinue }: Props) {
  const t = useTranslations("activation");
  const applyTypo = (s: string) => (locale === "fr" ? frTypo(s) : s);

  const titre = applyTypo(t(`titre.${status.titre.cle}`));
  const sousTitre = applyTypo(
    t(`sous_titre.${status.titre.cle}`, resolveParams(status.titre.params, t)),
  );

  // Signature au premier rendu → loader ensuite (tant que !tout_pret)
  // → static juste avant redirection. On garde la partition simple :
  // signature une seule fois, puis loader, puis static.
  const [brandState, setBrandState] = useState<"signature" | "loader" | "static">("signature");
  useEffect(() => {
    // La signature dure ~1.6s (arm + trunk + ignite complet à ~1050ms + 600ms tail).
    const to = window.setTimeout(() => {
      setBrandState((s) => (s === "signature" ? "loader" : s));
    }, 1650);
    return () => window.clearTimeout(to);
  }, []);
  useEffect(() => {
    if (status.tout_pret) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrandState("static");
    }
  }, [status.tout_pret]);

  const ambianceClass = status.ambiance === "sources" ? "territory-sources" : "territory-world";
  const brandVariant = status.ambiance === "sources" ? "sources" : "world";

  // ── Écran d'échec (paiement / order cancelled) ─────────────────────
  if (status.echec) {
    const kind = status.echec.kind === "ORDER_CANCELLED" ? "cancelled" : "paiement";
    return (
      <main className={`activation activation-echec ${ambianceClass}`}>
        <div className="activation-card" role="alert" aria-live="polite">
          <div className="activation-brand" aria-hidden="true">
            <BrandY variant={brandVariant} state="static" size={110} />
          </div>
          <h1 className="activation-titre">{applyTypo(t(`echec.${kind}.titre`))}</h1>
          <p className="activation-sous-titre">{applyTypo(t(`echec.${kind}.body`))}</p>
          <div className="activation-actions">
            {kind === "paiement" && (
              <a href={`/${locale}/pricing`} className="activation-cta">
                {applyTypo(t("echec.paiement.cta_retry"))}
              </a>
            )}
            <a href={`/${locale}`} className="activation-cta activation-cta-ghost">
              {applyTypo(t(`echec.${kind}.cta_home`))}
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Écran d'attente / progression ──────────────────────────────────
  return (
    <main className={`activation ${ambianceClass}`} data-tout-pret={status.tout_pret ? "1" : "0"}>
      <div className="activation-card">
        <div className="activation-brand" aria-label={t("aria.confluent")} role="img">
          <BrandY variant={brandVariant} state={brandState} size={120} />
        </div>

        <h1 className="activation-titre">{titre}</h1>
        <p className="activation-sous-titre">{sousTitre}</p>

        <ol className="activation-etapes" aria-live="polite">
          {(() => {
            const firstPending = status.droits.findIndex((d) => !d.pret);
            return status.droits.map((d, i) => {
              const libelle = applyTypo(
                t(`droits.${d.cle}`, resolveParams(d.params, t)),
              );
              return (
                <ActivationStep
                  key={d.cle}
                  libelle={libelle}
                  pret={d.pret}
                  enCours={i === firstPending}
                  ariaFaite={applyTypo(t("aria.etape_faite"))}
                  ariaEnCours={applyTypo(t("aria.etape_en_cours"))}
                  ariaAVenir={applyTypo(t("aria.etape_a_venir"))}
                />
              );
            });
          })()}
        </ol>

        {graceMode ? (
          <GraceBlock t={t} applyTypo={applyTypo} onContinue={onGraceContinue} locale={locale} />
        ) : (
          <p className="activation-attente">{applyTypo(t("attente.ligne_bas"))}</p>
        )}
      </div>
    </main>
  );
}

/** Une étape · cercle éteint → anneau qui tourne (en-cours) → coche laiton. */
function ActivationStep({
  libelle,
  pret,
  enCours,
  ariaFaite,
  ariaEnCours,
  ariaAVenir,
}: {
  libelle: string;
  pret: boolean;
  enCours: boolean;
  ariaFaite: string;
  ariaEnCours: string;
  ariaAVenir: string;
}) {
  const status = pret ? "fait" : enCours ? "en_cours" : "a_venir";
  const aria =
    status === "fait" ? ariaFaite : status === "en_cours" ? ariaEnCours : ariaAVenir;
  return (
    <li
      className={`activation-etape ${pret ? "is-fait" : ""}`}
      data-en-cours={enCours && !pret ? "1" : "0"}
      aria-current={enCours && !pret ? "step" : undefined}
    >
      <span className="activation-etape-mark" aria-hidden="true">
        {pret ? (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M5 12.5 L10 17.5 L19 7.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ) : null}
      </span>
      <span className="activation-etape-libelle">{libelle}</span>
      <span className="visually-hidden">{aria}</span>
    </li>
  );
}

function GraceBlock({
  t,
  applyTypo,
  onContinue,
  locale,
}: {
  t: ReturnType<typeof useTranslations>;
  applyTypo: (s: string) => string;
  onContinue: () => void;
  locale: Locale;
}) {
  const mailto = "mailto:hello@yema.co";
  return (
    <div className="activation-grace" role="status">
      <h2 className="activation-grace-titre">{applyTypo(t("grace.titre"))}</h2>
      <p className="activation-grace-body">{applyTypo(t("grace.body"))}</p>
      <div className="activation-actions">
        <button type="button" className="activation-cta" onClick={onContinue}>
          {applyTypo(t("grace.cta"))}
        </button>
        <a href={mailto} className="activation-contact" lang={locale}>
          {applyTypo(t("grace.contact"))}
        </a>
      </div>
    </div>
  );
}

"use client";

// /landing — page B2B centres de langues.
// Argumentaire douleur → solution → preuve → offre.
// Structure : Hero → Pains → Solution → How → Proof → Unique → Pricing → Final.
// Palette Kaffeehaus. Tokens :root. Composants réutilisés : LandingNav,
// LandingFooter, icons.tsx. next-intl pour toutes les strings.

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  IconAnalytics,
  IconArrow,
  IconCheck,
  IconContext,
  IconInstitution,
  IconLesen,
  IconSprechen,
  IconTracker,
} from "@/components/landing/icons";

// Micro-typo FR — espace fine insécable avant : ; ! ? % € °.
// Appliqué à chaque valeur retournée par useTranslations en FR.
const NNBSP = " ";
function frTypo(s: string): string {
  return s.replace(/ ([:;!?%€°])/g, `${NNBSP}$1`);
}
function useTypoT(namespace: string) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const apply = locale === "fr";
  return (key: string, values?: Record<string, string | number>): string => {
    const raw = t(key, values);
    return apply ? frTypo(raw) : raw;
  };
}

export default function B2BLandingPage() {
  const locale = useLocale();
  const t = useTypoT("b2b");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: locale === "en" ? "Languages" : "Langues",
          levels: locale === "en" ? "Method" : "Méthode",
          pricing: locale === "en" ? "Manifesto" : "Manifeste",
          centers: locale === "en" ? "Centers" : "Centres",
          login: locale === "en" ? "Log in" : "Se connecter",
          register: locale === "en" ? "Start" : "Commencer",
        }}
      />

      <main>
        <B2BHero />
        <B2BPains />
        <B2BSolution />
        <B2BHow />
        <B2BProof />
        <B2BUnique />
        <B2BPricing />
        <B2BFinal />
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline:
            locale === "en"
              ? "Africa speaks. All its languages — foreign and native, at last one place."
              : "L’Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
          made:
            locale === "en"
              ? "Built in Cameroon, for the continent and the world"
              : "Construit au Cameroun, pour le continent et le monde",
          legal: locale === "en" ? "Legal" : "Mentions légales",
          terms: locale === "en" ? "Terms" : "CGU",
          privacy: locale === "en" ? "Privacy" : "Confidentialité",
          contact: locale === "en" ? "Contact" : "Contact",
          disclaimer:
            locale === "en"
              ? "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute."
              : "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N’est affiliée à aucun organisme officiel d’examen.",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════════════ */
function B2BHero() {
  const t = useTypoT("b2b.hero");
  const locale = useLocale();
  return (
    <section className="lb2b-hero">
      <div className="container">
        <div className="lb2b-eye">{t("eye")}</div>
        <h1 className="lb2b-hero-h">
          <span className="lb2b-hero-line">{t("title_l1")}</span>
          <span className="lb2b-hero-line">
            {t("title_l2")}
            {" "}
            <em>{t("title_em")}</em>
          </span>
        </h1>
        <p className="lb2b-hero-sub">{t("sub")}</p>
        <div className="lb2b-hero-cta">
          <a
            href={`/${locale}/landing#final`}
            className="lb2b-btn-primary"
          >
            {t("cta_primary")}
            <span className="lb2b-btn-arrow" aria-hidden="true">
              <IconArrow size={16} />
            </span>
          </a>
          <a
            href={`/${locale}/landing#solution`}
            className="lb2b-btn-ghost"
          >
            {t("cta_ghost")}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   2. PAINS · 4 cartes
   ═══════════════════════════════════════════════ */
function B2BPains() {
  const t = useTypoT("b2b.pains");
  const pains: Array<{ Icon: (p: { size?: number }) => ReactNode; key: string }> = [
    { Icon: IconAnalytics, key: "p1" },
    { Icon: IconContext, key: "p2" },
    { Icon: IconLesen, key: "p3" },
    { Icon: IconTracker, key: "p4" },
  ];
  return (
    <section className="lb2b-section lb2b-section-alt" id="pains">
      <div className="container">
        <div className="lsection-head centered">
          <div className="lb2b-eye">{/* eye omitted for rythm */}</div>
          <h2 className="lb2b-h">{t("title")}</h2>
          <p className="lb2b-lede">{t("sub")}</p>
        </div>

        <div className="lb2b-pains-grid">
          {pains.map(({ Icon, key }) => (
            <article key={key} className="lb2b-pain">
              <div className="lb2b-pain-icon" aria-hidden="true">
                <Icon size={22} />
              </div>
              <h3>{t(`${key}_title`)}</h3>
              <p>{t(`${key}_body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   3. SOLUTION · mock + 3 bullets
   ═══════════════════════════════════════════════ */
function B2BSolution() {
  const t = useTypoT("b2b.solution");
  return (
    <section className="lb2b-section" id="solution">
      <div className="container">
        <div className="lb2b-solution-grid">
          <div className="lb2b-mock" role="img" aria-label={t("mock_label")}>
            <span className="lb2b-mock-label">{t("mock_label")}</span>
          </div>
          <div>
            <div className="lb2b-eye">{/* rythm */}</div>
            <h2 className="lb2b-h">
              {t("title")} <em>{t("title_em")}</em>
            </h2>
            <div className="lb2b-solution-bullets">
              {["b1", "b2", "b3"].map((k) => (
                <div key={k} className="lb2b-solution-bullet">
                  <span
                    className="lb2b-solution-bullet-check"
                    aria-hidden="true"
                  >
                    <IconCheck size={18} strokeWidth={2} />
                  </span>
                  <p>{t(k)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   4. HOW · 3 étapes
   ═══════════════════════════════════════════════ */
function B2BHow() {
  const t = useTypoT("b2b.how");
  return (
    <section className="lb2b-section lb2b-section-alt" id="how">
      <div className="container">
        <div className="lsection-head centered">
          <h2 className="lb2b-h">{t("title")}</h2>
        </div>

        <div className="lb2b-how-steps">
          {[1, 2, 3].map((n) => (
            <div key={n} className="lb2b-step">
              <span className="lb2b-step-num" aria-hidden="true">
                {String(n).padStart(2, "0")}
              </span>
              <span className="lb2b-step-lbl">
                {t("step_lbl")} {n}
              </span>
              <h3>{t(`s${n}_title`)}</h3>
              <p>{t(`s${n}_body`)}</p>
            </div>
          ))}
        </div>

        <p className="lb2b-how-note">{t("note")}</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   5. PROOF · mock + text
   ═══════════════════════════════════════════════ */
function B2BProof() {
  const t = useTypoT("b2b.proof");
  return (
    <section className="lb2b-section" id="proof">
      <div className="container">
        <div className="lb2b-proof-grid">
          <div className="lb2b-proof-text">
            <div className="lb2b-eye">{/* rythm */}</div>
            <h2 className="lb2b-h">{t("title")}</h2>
            <p>{t("body")}</p>
          </div>
          <div className="lb2b-mock" role="img" aria-label={t("mock_label")}>
            <span className="lb2b-mock-label">{t("mock_label")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   6. UNIQUE · 2 blocs
   ═══════════════════════════════════════════════ */
function B2BUnique() {
  const t = useTypoT("b2b.unique");
  return (
    <section className="lb2b-section lb2b-section-alt" id="unique">
      <div className="container">
        <div className="lsection-head centered">
          <h2 className="lb2b-h">
            {t("title")} <em>{t("title_em")}</em>
          </h2>
        </div>

        <div className="lb2b-unique-grid">
          <article className="lb2b-unique-item">
            <span className="icon" aria-hidden="true">
              <IconSprechen size={26} />
            </span>
            <h3>{t("u1_title")}</h3>
            <p>{t("u1_body")}</p>
          </article>
          <article className="lb2b-unique-item">
            <span className="icon" aria-hidden="true">
              <IconInstitution size={26} />
            </span>
            <h3>{t("u2_title")}</h3>
            <p>{t("u2_body")}</p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   7. PRICING · 3 formules
   ═══════════════════════════════════════════════ */
function B2BPricing() {
  const t = useTypoT("b2b.pricing");
  const locale = useLocale();
  const perMonth = locale === "en" ? "XAF / month" : "XAF / mois";

  const plans = ["starter", "pro", "ent"] as const;
  return (
    <section className="lb2b-section" id="pricing">
      <div className="container">
        <div className="lsection-head centered">
          <h2 className="lb2b-h">{t("title")}</h2>
          <p className="lb2b-lede">{t("sub")}</p>
        </div>

        <div className="lb2b-plans">
          {plans.map((key) => {
            const featured = key === "pro";
            const count = Number.parseInt(t(`${key}_fcount`), 10) || 0;
            const features = Array.from({ length: count }, (_, i) =>
              t(`${key}_f${i + 1}`),
            );
            return (
              <article
                key={key}
                className={`lb2b-plan${featured ? " lb2b-plan-featured" : ""}`}
                aria-labelledby={`plan-${key}-name`}
              >
                {featured ? (
                  <span className="lb2b-plan-badge">{t("pro_badge")}</span>
                ) : null}
                <h3 id={`plan-${key}-name`} className="lb2b-plan-name">
                  {t(`${key}_name`)}
                </h3>
                <p className="lb2b-plan-line">{t(`${key}_line`)}</p>
                <div className="lb2b-plan-price">
                  <span className="lb2b-plan-price-num" data-num>
                    {t(`${key}_price`)}
                  </span>
                  <span className="lb2b-plan-price-unit">{perMonth}</span>
                </div>
                <ul className="lb2b-plan-features">
                  {features.map((f, i) => (
                    <li key={i}>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`/${locale}/landing#final`}
                  className="lb2b-plan-cta"
                >
                  {t(`${key}_cta`)}
                </a>
              </article>
            );
          })}
        </div>

        <p className="lb2b-value-line">{t("value_line")}</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   8. FINAL CTA · bandeau + formulaire minimal
   ═══════════════════════════════════════════════ */
function B2BFinal() {
  const t = useTypoT("b2b.final");
  const [sent, setSent] = useState(false);
  const [center, setCenter] = useState("");
  const [city, setCity] = useState("");
  const [wa, setWa] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO server action / API. Pour la bêta, on flip juste sent = true.
    setSent(true);
  };

  return (
    <section className="lb2b-final" id="final">
      <div className="container">
        <div className="lb2b-final-band">
          <div>
            <span className="lb2b-final-eye">{t("eye")}</span>
            <h2 className="lb2b-final-h">{t("title")}</h2>
            <p className="lb2b-final-sub">{t("sub")}</p>
          </div>

          {sent ? (
            <div className="lb2b-sent">
              <h3 className="lb2b-sent-h">{t("form_sent_title")}</h3>
              <p className="lb2b-sent-body">{t("form_sent_body")}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="lb2b-form" noValidate>
              <div className="lb2b-form-field">
                <label htmlFor="b2b-center" className="lb2b-form-lbl">
                  {t("form_center_lbl")}
                </label>
                <input
                  id="b2b-center"
                  className="lb2b-form-input"
                  type="text"
                  required
                  autoComplete="organization"
                  value={center}
                  onChange={(e) => setCenter(e.target.value)}
                  placeholder={t("form_center_ph")}
                />
              </div>
              <div className="lb2b-form-field">
                <label htmlFor="b2b-city" className="lb2b-form-lbl">
                  {t("form_city_lbl")}
                </label>
                <input
                  id="b2b-city"
                  className="lb2b-form-input"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("form_city_ph")}
                />
              </div>
              <div className="lb2b-form-field">
                <label htmlFor="b2b-wa" className="lb2b-form-lbl">
                  {t("form_wa_lbl")}
                </label>
                <input
                  id="b2b-wa"
                  className="lb2b-form-input"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder={t("form_wa_ph")}
                />
              </div>
              <button type="submit" className="lb2b-form-cta">
                {t("form_cta")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

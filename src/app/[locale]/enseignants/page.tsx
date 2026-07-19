"use client";

// /enseignants · Sprint 5 « Les chemins ».
// Le prof au centre. AUCUN chiffre en public. L'outil travaille pour
// vous, sous votre contrôle (il propose / vous disposez). Amenez vos
// élèves, bâtissez votre activité. Formulaire d'accréditation POST
// /api/apply/teacher — la maison rencontre chaque prof avant de créer
// un compte.

import Link from "next/link";
import { useLocale } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  heroKicker: string;
  heroTitle: string;
  heroTitleEm: string;
  heroLede: string;

  manifKicker: string;
  manifLines: readonly string[];

  outilKicker: string;
  outilTitle: string;
  outilTitleEm: string;
  outils: readonly { proposes: string; disposes: string }[];

  activKicker: string;
  activTitle: string;
  activTitleEm: string;
  activLede: string;
  activPrinciples: readonly string[];

  dashKicker: string;
  dashTitle: string;
  dashTitleEm: string;

  humKicker: string;
  humTitle: string;
  humTitleEm: string;
  humLede: string;
  humItems: readonly string[];

  formKicker: string;
  formTitle: string;
  formTitleEm: string;
  formLede: string;
  fldName: string;
  fldEmail: string;
  fldWa: string;
  fldCity: string;
  fldLangs: string;
  fldExp: string;
  fldExpPh: string;
  submit: string;
  sentTitle: string;
  sentTitleEm: string;
  sentBody: string;

  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;
  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
}

const COPY_FR: Copy = {
  heroKicker: "Enseignant·e·s",
  heroTitle: "L'enseignant au cœur.",
  heroTitleEm: "L'outil à ses côtés.",
  heroLede: "La machine prépare, corrige, absorbe le répétitif. C'est vous qui décidez, qui reconnaissez la fatigue de la semaine, qui expliquez une troisième fois.",

  manifKicker: "Le manifeste enseignant",
  manifLines: [
    "Vous enseignez.",
    "Vous décidez.",
    "Vous restez le lien humain.",
  ],

  outilKicker: "Sous votre contrôle",
  outilTitle: "Il propose.",
  outilTitleEm: "Vous disposez.",
  outils: [
    { proposes: "Correction assistée sur les copies", disposes: "Vous relisez et signez." },
    { proposes: "Contenu prêt à ouvrir en classe", disposes: "Vous choisissez ce qui est joué." },
    { proposes: "Alerte quand un·e élève décroche", disposes: "Vous intervenez à votre manière." },
    { proposes: "Suivi automatique de la progression", disposes: "Vous accompagnez au bon moment." },
  ],

  activKicker: "Votre activité",
  activTitle: "Amenez vos élèves.",
  activTitleEm: "Bâtissez votre activité.",
  activLede: "YEMA n'est pas une place de marché anonyme. La maison rencontre chaque enseignant·e — une fois, avec dignité — puis vous accompagne.",
  activPrinciples: [
    "Le prix public est le même partout, pour toutes et tous.",
    "L'élève paie toujours la maison — pas vous, pas en cash.",
    "L'accréditation est la porte d'entrée. Une fois, ensemble.",
  ],

  dashKicker: "L'espace enseignant",
  dashTitle: "Un tableau clair.",
  dashTitleEm: "Vos classes, vos élèves, vos corrections.",

  humKicker: "L'irremplaçable",
  humTitle: "Ce qu'aucun outil.",
  humTitleEm: "Ne fera jamais.",
  humLede: "La liste courte de ce qui reste — et restera — humain.",
  humItems: [
    "Reconnaître qu'un·e élève est fatigué·e ce soir.",
    "Décider de la troisième explication, avec un autre exemple.",
    "Tenir la promesse d'un rendez-vous.",
    "Porter la voix qu'aucune machine n'imite.",
  ],

  formKicker: "L'accréditation",
  formTitle: "Demander mon accréditation.",
  formTitleEm: "La maison vous rencontre.",
  formLede: "Chaque enseignant·e de la maison est rencontré·e. Nous vous rappelons sous quarante-huit heures — jamais un compte créé à la va-vite.",
  fldName: "Nom complet",
  fldEmail: "Email",
  fldWa: "WhatsApp (optionnel)",
  fldCity: "Ville",
  fldLangs: "Langue(s) enseignée(s)",
  fldExp: "Diplôme ou années d'expérience",
  fldExpPh: "Ex : Master de didactique, six ans en collège privé…",
  submit: "Envoyer ma demande",
  sentTitle: "Demande reçue.",
  sentTitleEm: "Chaque enseignant·e de la maison est rencontré·e.",
  sentBody: "Nous vous rappelons sous 48 heures.",

  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",
  footerTagline: "L'Afrique parle. Toutes ses langues — du monde et africaines, enfin un lieu.",
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde, et indépendante pour les langues africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  heroKicker: "Teachers",
  heroTitle: "The teacher at the heart.",
  heroTitleEm: "The tool at their side.",
  heroLede: "The machine prepares, corrects, absorbs the repetitive. You decide, you notice the tiredness of the week, you explain a third time.",

  manifKicker: "The teacher manifesto",
  manifLines: [
    "You teach.",
    "You decide.",
    "You stay the human link.",
  ],

  outilKicker: "Under your control",
  outilTitle: "It proposes.",
  outilTitleEm: "You dispose.",
  outils: [
    { proposes: "Assisted correction on essays", disposes: "You re-read and sign." },
    { proposes: "Ready-to-open lesson content", disposes: "You choose what's played." },
    { proposes: "Alerts when a learner slips", disposes: "You step in your own way." },
    { proposes: "Automatic progress tracking", disposes: "You accompany at the right moment." },
  ],

  activKicker: "Your activity",
  activTitle: "Bring your learners.",
  activTitleEm: "Build your activity.",
  activLede: "YEMA isn't an anonymous marketplace. The house meets every teacher — once, with dignity — then accompanies you.",
  activPrinciples: [
    "The public price is the same everywhere, for everyone.",
    "The learner always pays the house — not you, never in cash.",
    "Accreditation is the entrance. Once, together.",
  ],

  dashKicker: "The teacher space",
  dashTitle: "A clear board.",
  dashTitleEm: "Your classes, your learners, your corrections.",

  humKicker: "The irreplaceable",
  humTitle: "What no tool.",
  humTitleEm: "Will ever do.",
  humLede: "The short list of what stays — and will stay — human.",
  humItems: [
    "Recognizing a learner is tired tonight.",
    "Choosing the third explanation, with another example.",
    "Keeping the promise of a meeting.",
    "Carrying the voice no machine imitates.",
  ],

  formKicker: "Accreditation",
  formTitle: "Request my accreditation.",
  formTitleEm: "The house meets you.",
  formLede: "Every teacher of the house is met. We will call you back within 48 hours — never an account created on the fly.",
  fldName: "Full name",
  fldEmail: "Email",
  fldWa: "WhatsApp (optional)",
  fldCity: "City",
  fldLangs: "Language(s) you teach",
  fldExp: "Degree or years of experience",
  fldExpPh: "E.g.: Master's in didactics, six years in a private high school…",
  submit: "Send my request",
  sentTitle: "Application received.",
  sentTitleEm: "Every teacher of the house is met.",
  sentBody: "We will call you back within 48 hours.",

  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",
  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages, and independent for African languages. Not affiliated with any official examination institute.",
};

export default function EnseignantsPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [form, setForm] = useState({
    fullName: "", email: "", whatsapp: "", city: "", languages: "", experience: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/apply/teacher?locale=${loc}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "internal");
      setSent(true);
    } catch (err) {
      setError(loc === "en" ? "Something didn't reach us. Try again." : "Quelque chose ne nous est pas parvenu. Réessayez.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="landing">
      <LandingNav
        locale={locale}
        isMobile={isMobile}
        labels={{
          features: c.navFeatures,
          levels: c.navLevels,
          pricing: c.navPricing,
          centers: c.navCenters,
          login: c.navLogin,
          register: c.navRegister,
        }}
      />

      <main className="chemin-page">
        {/* HERO */}
        <section className="chemin-hero" aria-labelledby="ens-hero-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.heroKicker)}</p>
            <h1 id="ens-hero-h" className="chemin-hero-h">
              {t(c.heroTitle)} <em>{t(c.heroTitleEm)}</em>
            </h1>
            <p className="chemin-hero-lede">{t(c.heroLede)}</p>
          </div>
        </section>

        {/* MANIFESTE ENSEIGNANT */}
        <section className="ens-manif" aria-labelledby="ens-manif-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.manifKicker)}</p>
            <h2 id="ens-manif-h" className="maison-h">
              {c.manifLines.map((l, i) => (
                <span key={i} className="ens-manif-line">
                  {i === c.manifLines.length - 1 ? <em>{t(l)}</em> : t(l)}
                </span>
              ))}
            </h2>
          </div>
        </section>

        {/* IL PROPOSE / VOUS DISPOSEZ */}
        <section className="ens-outils" aria-labelledby="ens-outils-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.outilKicker)}</p>
              <h2 id="ens-outils-h" className="maison-h">
                {t(c.outilTitle)} <em>{t(c.outilTitleEm)}</em>
              </h2>
            </div>
            <div className="ens-outils-grid">
              {c.outils.map((o, i) => (
                <article key={i} className="ens-outil">
                  <p className="ens-outil-proposes">{t(o.proposes)}</p>
                  <p className="ens-outil-arrow" aria-hidden="true">↓</p>
                  <p className="ens-outil-disposes"><em>{t(o.disposes)}</em></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* VOTRE ACTIVITÉ */}
        <section className="ens-activite" aria-labelledby="ens-activite-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.activKicker)}</p>
              <h2 id="ens-activite-h" className="maison-h">
                {t(c.activTitle)} <em>{t(c.activTitleEm)}</em>
              </h2>
              <p className="maison-lede">{t(c.activLede)}</p>
            </div>
            <ol className="ens-activite-principles" role="list">
              {c.activPrinciples.map((p, i) => (
                <li key={i}>
                  <span className="ens-activite-mark" aria-hidden="true">§ 0{i + 1}</span>
                  <span>{t(p)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* DASHBOARD PLACEHOLDER */}
        <section className="ens-dash" aria-labelledby="ens-dash-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.dashKicker)}</p>
              <h2 id="ens-dash-h" className="maison-h">
                {t(c.dashTitle)} <em>{t(c.dashTitleEm)}</em>
              </h2>
            </div>
            <div className="ens-dash-holder" aria-hidden="true">
              <div className="ens-dash-frame">
                <div className="ens-dash-header">Espace enseignant · YEMA</div>
                <div className="ens-dash-body">
                  <div className="ens-dash-col ens-dash-col-nav" />
                  <div className="ens-dash-col ens-dash-col-main">
                    <div className="ens-dash-line ens-dash-line-a" />
                    <div className="ens-dash-line ens-dash-line-b" />
                    <div className="ens-dash-line ens-dash-line-c" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CE QU'AUCUN OUTIL NE FERA JAMAIS */}
        <section className="ens-humain" aria-labelledby="ens-humain-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.humKicker)}</p>
              <h2 id="ens-humain-h" className="maison-h">
                {t(c.humTitle)} <em>{t(c.humTitleEm)}</em>
              </h2>
              <p className="maison-lede">{t(c.humLede)}</p>
            </div>
            <ul className="ens-humain-list" role="list">
              {c.humItems.map((it) => (
                <li key={it}>{t(it)}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* FORMULAIRE ACCRÉDITATION */}
        <section className="ens-form" aria-labelledby="ens-form-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.formKicker)}</p>
              <h2 id="ens-form-h" className="maison-h">
                {t(c.formTitle)} <em>{t(c.formTitleEm)}</em>
              </h2>
              <p className="maison-lede">{t(c.formLede)}</p>
            </div>

            {sent ? (
              <div className="ens-form-sent" role="status">
                <h3 className="ens-form-sent-h">
                  {t(c.sentTitle)} <em>{t(c.sentTitleEm)}</em>
                </h3>
                <p>{t(c.sentBody)}</p>
                <Link href={`/${locale}`} className="maison-link-strong" style={{ marginTop: 20 }}>
                  {loc === "en" ? "Back to the house" : "Retour à la maison"}
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="ens-form-body" noValidate>
                <label className="ens-form-field">
                  <span>{t(c.fldName)}</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </label>
                <label className="ens-form-field">
                  <span>{t(c.fldEmail)}</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
                <label className="ens-form-field">
                  <span>{t(c.fldWa)}</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  />
                </label>
                <label className="ens-form-field">
                  <span>{t(c.fldCity)}</span>
                  <input
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </label>
                <label className="ens-form-field ens-form-field-wide">
                  <span>{t(c.fldLangs)}</span>
                  <input
                    type="text"
                    required
                    value={form.languages}
                    onChange={(e) => setForm({ ...form, languages: e.target.value })}
                    placeholder={loc === "en" ? "German, French, Wolof…" : "Allemand, français, wolof…"}
                  />
                </label>
                <label className="ens-form-field ens-form-field-wide">
                  <span>{t(c.fldExp)}</span>
                  <textarea
                    required
                    rows={4}
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder={t(c.fldExpPh)}
                  />
                </label>

                {error ? <p className="ens-form-error" role="alert">{error}</p> : null}

                <button type="submit" className="maison-porte-cta" disabled={sending}>
                  {sending
                    ? (loc === "en" ? "Sending…" : "Envoi en cours…")
                    : t(c.submit)}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <LandingFooter
        locale={locale}
        labels={{
          tagline: c.footerTagline,
          made: c.footerMade,
          legal: c.footerLegal,
          terms: c.footerTerms,
          privacy: c.footerPrivacy,
          contact: c.footerContact,
          disclaimer: c.footerDisclaimer,
        }}
      />
    </div>
  );
}

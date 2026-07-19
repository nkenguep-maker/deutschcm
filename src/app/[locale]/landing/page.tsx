"use client";

// /landing · Sprint 7 « Le comptoir » (B2B centres).
// Un seul chiffre public : 30 jours gratuits sans engagement.
// AUCUN tarif visible (les tarifs vivent dans /admin, jamais en public).
// Seule porte : le formulaire de démo → /api/apply/center.

import { useLocale } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { frTypo } from "@/components/landing/typo";

interface Copy {
  navFeatures: string;
  navLevels: string;
  navPricing: string;
  navCenters: string;
  navLogin: string;
  navRegister: string;

  heroKicker: string;
  heroTitle: string;
  heroTitleEm: string;
  heroLede: string;
  heroCta: string;

  painsKicker: string;
  painsTitle: string;
  painsTitleEm: string;
  pains: readonly { title: string; body: string }[];

  solKicker: string;
  solTitle: string;
  solTitleEm: string;
  solSteps: readonly { title: string; body: string }[];
  solNote: string;

  proofKicker: string;
  proofTitle: string;
  proofTitleEm: string;
  proofLede: string;

  atoutKicker: string;
  atoutTitle: string;
  atoutTitleEm: string;
  atoutItems: readonly string[];

  guaranteeKicker: string;
  guaranteeTitle: string;
  guaranteeTitleEm: string;
  guaranteeBody: string;

  formKicker: string;
  formTitle: string;
  formTitleEm: string;
  formLede: string;
  fldName: string;
  fldCity: string;
  fldWa: string;
  fldEmail: string;
  submit: string;
  sentTitle: string;
  sentTitleEm: string;
  sentBody: string;
  error: string;

  footerTagline: string;
  footerMade: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  footerContact: string;
  footerDisclaimer: string;
}

const COPY_FR: Copy = {
  navFeatures: "Langues",
  navLevels: "Méthode",
  navPricing: "Manifeste",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",

  heroKicker: "Centres de langues",
  heroTitle: "Vos élèves progressent.",
  heroTitleEm: "Vous le prouvez.",
  heroLede: "Un tableau clair pour vos classes, un rapport pour les parents, un accompagnement humain de la maison. Sans installation, sur téléphone.",
  heroCta: "Réserver une démo",

  painsKicker: "Ce qui vous ralentit",
  painsTitle: "Ce que la maison retire.",
  painsTitleEm: "De votre semaine.",
  pains: [
    { title: "Les présences à la main.", body: "Feuilles perdues, corrections tardives, doublons — la présence devient un vrai relevé, en temps réel, partagé." },
    { title: "Le décrochage invisible.", body: "L'élève absent·e trois séances de suite ne devrait pas être une découverte. Une alerte tombe avant qu'il soit tard." },
    { title: "Des profs sans contenu prêt.", body: "Chaque prof reçoit une bibliothèque de leçons ouvertes, adaptées au niveau, prêtes à ouvrir en classe." },
    { title: "Rien à montrer aux parents.", body: "Le rapport de progression est là, mis à jour, montrable — pas un fichier bricolé la veille." },
  ],

  solKicker: "La solution",
  solTitle: "Trois pas.",
  solTitleEm: "Un tableau clair.",
  solSteps: [
    { title: "Le centre s'inscrit.", body: "Une démo, une signature, un code centre — la maison ouvre l'accès." },
    { title: "Vos profs sont invités.", body: "Chaque enseignant·e reçoit son espace. Les classes se créent. Les leçons se choisissent." },
    { title: "Les élèves rejoignent.", body: "Un code, une leçon — ils sont dans la classe, sur téléphone, tout de suite." },
  ],
  solNote: "Aucune installation. Fonctionne sur téléphone. Le tableau reste sur votre navigateur.",

  proofKicker: "La preuve",
  proofTitle: "Le rapport.",
  proofTitleEm: "Que vous montrez aux parents.",
  proofLede: "Une courbe qui monte. Une présence lisible. Un cap tenu. Le fichier que vous envoyiez en catastrophe la veille de la réunion — la maison le tient à jour tous les jours.",

  atoutKicker: "L'atout",
  atoutTitle: "Deux choses.",
  atoutTitleEm: "Qu'aucun autre ne donne.",
  atoutItems: [
    "L'accompagnement humain — un référent de la maison, joignable, qui connaît votre centre.",
    "Les langues natales africaines — pour les familles de diaspora, les héritages, les publics rares. Ni gadget, ni supplément.",
  ],

  guaranteeKicker: "La garantie",
  guaranteeTitle: "Trente jours gratuits.",
  guaranteeTitleEm: "Sans engagement.",
  guaranteeBody: "Si vos élèves ne progressent pas plus vite qu'avant, vous ne payez rien. Un seul chiffre public — le reste se dit en démo.",

  formKicker: "Réserver une démo",
  formTitle: "Une démo courte.",
  formTitleEm: "Un vrai référent.",
  formLede: "Nous vous rappelons sous 48 heures pour organiser une démonstration adaptée à votre centre.",
  fldName: "Nom du centre",
  fldCity: "Ville",
  fldWa: "WhatsApp",
  fldEmail: "Email",
  submit: "Envoyer la demande",
  sentTitle: "Demande reçue.",
  sentTitleEm: "Chaque centre de la maison est rencontré.",
  sentBody: "Nous vous rappelons sous 48 heures.",
  error: "Quelque chose ne nous est pas parvenu. Réessayez.",

  footerTagline: "L'Afrique parle. Toutes ses langues — étrangères et natales, enfin un lieu.",
  footerMade: "Construit au Cameroun, pour le continent et le monde",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues étrangères, et indépendante pour les langues natales africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Manifesto",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",

  heroKicker: "Language centers",
  heroTitle: "Your learners progress.",
  heroTitleEm: "You prove it.",
  heroLede: "A clear board for your classes, a report for the parents, a human referent from the house. No install, on phone.",
  heroCta: "Book a demo",

  painsKicker: "What slows you down",
  painsTitle: "What the house takes.",
  painsTitleEm: "Off your week.",
  pains: [
    { title: "Attendance by hand.", body: "Lost sheets, late corrections, duplicates — attendance becomes a real, real-time, shared record." },
    { title: "Invisible drop-off.", body: "A learner missing three sessions shouldn't be a discovery. An alert arrives before it's late." },
    { title: "Teachers without ready content.", body: "Every teacher gets a library of open lessons, level-adapted, ready to open in class." },
    { title: "Nothing to show parents.", body: "The progress report is there, up to date, showable — not a file cobbled together the night before." },
  ],

  solKicker: "The solution",
  solTitle: "Three steps.",
  solTitleEm: "A clear board.",
  solSteps: [
    { title: "The center signs up.", body: "A demo, a signature, a center code — the house opens access." },
    { title: "Your teachers are invited.", body: "Each teacher gets their space. Classes are created. Lessons are chosen." },
    { title: "Learners join.", body: "A code, a lesson — they're in the class, on phone, right away." },
  ],
  solNote: "No install. Works on phone. The board stays in your browser.",

  proofKicker: "The proof",
  proofTitle: "The report.",
  proofTitleEm: "You show to parents.",
  proofLede: "A curve that rises. A readable attendance. A cap held. The file you used to send in a panic the day before the meeting — the house keeps it up to date every day.",

  atoutKicker: "The edge",
  atoutTitle: "Two things.",
  atoutTitleEm: "No one else gives.",
  atoutItems: [
    "Human support — a referent from the house, reachable, who knows your center.",
    "Native African languages — for diaspora families, heritage, rare audiences. Not a gadget, not an add-on.",
  ],

  guaranteeKicker: "The guarantee",
  guaranteeTitle: "Thirty days free.",
  guaranteeTitleEm: "No commitment.",
  guaranteeBody: "If your learners don't progress faster than before, you don't pay. One public number — the rest is said in a demo.",

  formKicker: "Book a demo",
  formTitle: "A short demo.",
  formTitleEm: "A real referent.",
  formLede: "We will call you back within 48 hours to organize a demo tailored to your center.",
  fldName: "Center name",
  fldCity: "City",
  fldWa: "WhatsApp",
  fldEmail: "Email",
  submit: "Send request",
  sentTitle: "Request received.",
  sentTitleEm: "Every center of the house is met.",
  sentBody: "We will call you back within 48 hours.",
  error: "Something didn't reach us. Try again.",

  footerTagline: "Africa speaks. All its languages — foreign and native, at last one place.",
  footerMade: "Built in Cameroon, for the continent and the world",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for foreign languages, and independent for African native languages. Not affiliated with any official examination institute.",
};

// Icônes mono-trait laiton pour les 4 douleurs.
function PainIcon({ idx }: { idx: number }) {
  const p = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (idx === 0) return <svg {...p}><path d="M4 4h14v14H4z" /><path d="M4 8h14M8 4v14" /><path d="M11 12l2 2 3-3" /></svg>;
  if (idx === 1) return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M11 6v5l3 2M4 4l3 3M18 4l-3 3" /></svg>;
  if (idx === 2) return <svg {...p}><path d="M4 4h14v10H4z" /><path d="M4 18h14M7 10h8M7 7h5" /></svg>;
  return <svg {...p}><path d="M11 3l7 4v10l-7 4-7-4V7z" /><path d="M11 3v18M4 7l7 4 7-4" /></svg>;
}

export default function B2BLandingPage() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = loc === "en" ? COPY_EN : COPY_FR;
  const [isMobile, setIsMobile] = useState(false);
  const t = (s: string) => (loc === "fr" ? frTypo(s) : s);

  const [form, setForm] = useState({
    centerName: "", city: "", whatsapp: "", email: "",
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
      const res = await fetch(`/api/apply/center?locale=${loc}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "internal");
      setSent(true);
    } catch (err) {
      setError(c.error);
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

      <main className="comptoir-page">
        {/* HERO */}
        <section className="comptoir-hero">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.heroKicker)}</p>
            <h1 className="chemin-hero-h">
              {t(c.heroTitle)} <em>{t(c.heroTitleEm)}</em>
            </h1>
            <p className="chemin-hero-lede">{t(c.heroLede)}</p>
            <a href="#demo" className="maison-porte-cta">
              {t(c.heroCta)}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
          </div>
        </section>

        {/* 4 DOULEURS */}
        <section className="comptoir-pains" aria-labelledby="comptoir-pains-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.painsKicker)}</p>
              <h2 id="comptoir-pains-h" className="maison-h">
                {t(c.painsTitle)} <em>{t(c.painsTitleEm)}</em>
              </h2>
            </div>
            <div className="comptoir-pains-grid">
              {c.pains.map((p, i) => (
                <article key={i} className="comptoir-pain">
                  <div className="comptoir-pain-icon" aria-hidden="true">
                    <PainIcon idx={i} />
                  </div>
                  <h3 className="comptoir-pain-h">{t(p.title)}</h3>
                  <p className="comptoir-pain-p">{t(p.body)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION · 3 étapes + placeholder dashboard */}
        <section className="comptoir-sol" aria-labelledby="comptoir-sol-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.solKicker)}</p>
              <h2 id="comptoir-sol-h" className="maison-h">
                {t(c.solTitle)} <em>{t(c.solTitleEm)}</em>
              </h2>
            </div>

            <div className="ens-dash-holder" aria-hidden="true">
              <div className="ens-dash-frame">
                <div className="ens-dash-header">Espace centre · YEMA</div>
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

            <ol className="comptoir-steps" role="list">
              {c.solSteps.map((s, i) => (
                <li key={i} className="comptoir-step">
                  <span className="comptoir-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{t(s.title)}</h3>
                    <p>{t(s.body)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="comptoir-sol-note"><em>{t(c.solNote)}</em></p>
          </div>
        </section>

        {/* PREUVE · courbe placeholder */}
        <section className="comptoir-proof" aria-labelledby="comptoir-proof-h">
          <div className="maison-container comptoir-proof-inner">
            <div>
              <p className="maison-kicker">{t(c.proofKicker)}</p>
              <h2 id="comptoir-proof-h" className="maison-h">
                {t(c.proofTitle)} <em>{t(c.proofTitleEm)}</em>
              </h2>
              <p className="maison-lede">{t(c.proofLede)}</p>
            </div>
            <div className="comptoir-proof-graph" aria-hidden="true">
              <svg viewBox="0 0 300 180" width="100%" height="100%">
                <path d="M20 150 Q 60 130 90 110 T 160 70 T 260 30"
                      stroke="var(--brass)" strokeWidth="2" fill="none" />
                <path d="M20 150 Q 60 130 90 110 T 160 70 T 260 30 L 260 170 L 20 170 Z"
                      fill="var(--brass-glow)" />
                <g stroke="var(--creme-hair)" strokeWidth="0.5">
                  <line x1="20" y1="30" x2="280" y2="30" />
                  <line x1="20" y1="90" x2="280" y2="90" />
                  <line x1="20" y1="150" x2="280" y2="150" />
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* ATOUT · 2 items */}
        <section className="comptoir-atout" aria-labelledby="comptoir-atout-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.atoutKicker)}</p>
              <h2 id="comptoir-atout-h" className="maison-h">
                {t(c.atoutTitle)} <em>{t(c.atoutTitleEm)}</em>
              </h2>
            </div>
            <ul className="comptoir-atout-list" role="list">
              {c.atoutItems.map((it) => (
                <li key={it}>{t(it)}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* GARANTIE · le seul chiffre public */}
        <section className="comptoir-guarantee" aria-labelledby="comptoir-guarantee-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.guaranteeKicker)}</p>
            <h2 id="comptoir-guarantee-h" className="maison-porte-h">
              {t(c.guaranteeTitle)} <em>{t(c.guaranteeTitleEm)}</em>
            </h2>
            <p className="maison-lede" style={{ maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              {t(c.guaranteeBody)}
            </p>
          </div>
        </section>

        {/* FORMULAIRE DÉMO */}
        <section id="demo" className="ens-form" aria-labelledby="comptoir-form-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.formKicker)}</p>
              <h2 id="comptoir-form-h" className="maison-h">
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
              </div>
            ) : (
              <form onSubmit={onSubmit} className="ens-form-body" noValidate>
                <label className="ens-form-field">
                  <span>{t(c.fldName)}</span>
                  <input
                    type="text"
                    required
                    autoComplete="organization"
                    value={form.centerName}
                    onChange={(e) => setForm({ ...form, centerName: e.target.value })}
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
                  <span>{t(c.fldEmail)}</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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

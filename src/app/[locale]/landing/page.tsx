"use client";

// /landing · « Le comptoir » B2B centres.
// Surface commerciale réelle : fonctionnalités, demande de démo et accès bêta.
// Aucun checkout ni paiement en ligne n'est activé à ce stade.

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
  navPricing: "Tarifs",
  navCenters: "Centres",
  navLogin: "Se connecter",
  navRegister: "Commencer",

  heroKicker: "Centres de langues",
  heroTitle: "Suivez vos classes.",
  heroTitleEm: "Montrez leur progression.",
  heroLede: "Un tableau clair pour vos classes, le suivi des élèves et un espace pour votre équipe. Sans installation, sur téléphone comme sur ordinateur.",
  heroCta: "Réserver une démo",

  painsKicker: "Ce qui vous ralentit",
  painsTitle: "Ce que la maison retire.",
  painsTitleEm: "De votre semaine.",
  pains: [
    { title: "Les présences à la main.", body: "Feuilles perdues, corrections tardives, doublons — centralisez la vie de vos classes dans un seul espace." },
    { title: "Le décrochage difficile à voir.", body: "Les données de classe et de progression donnent à votre équipe un point de repère commun pour suivre les élèves." },
    { title: "Des outils dispersés pour les profs.", body: "L'espace enseignant centralise classes, devoirs, corrections et suivi des apprenants." },
    { title: "Peu de visibilité pour les familles.", body: "Les données de progression disponibles peuvent être consultées depuis les espaces prévus pour le suivi." },
  ],

  solKicker: "La solution",
  solTitle: "Trois pas.",
  solTitleEm: "Un tableau clair.",
  solSteps: [
    { title: "Le centre rejoint YEMA.", body: "Après validation, le centre dispose de son espace et de son identité dans la plateforme." },
    { title: "Vos profs sont invités.", body: "Chaque enseignant·e reçoit son espace. Les classes et les devoirs peuvent ensuite être gérés au même endroit." },
    { title: "Les élèves rejoignent.", body: "Les élèves rejoignent une classe avec le parcours d'inscription et la validation prévus par leur enseignant·e." },
  ],
  solNote: "Aucune installation. Fonctionne dans le navigateur sur téléphone et ordinateur.",

  proofKicker: "Le suivi",
  proofTitle: "Une vue.",
  proofTitleEm: "Pour piloter vos classes.",
  proofLede: "Effectifs, classes, inscriptions et progression disponible sont réunis dans le même espace. Les informations s'enrichissent à mesure que vos élèves utilisent YEMA.",

  atoutKicker: "L'atout",
  atoutTitle: "Deux univers.",
  atoutTitleEm: "Dans la même maison.",
  atoutItems: [
    "Les langues du monde — avec des parcours structurés et un espace de classe pour les équipes pédagogiques.",
    "Les langues africaines — avec des expériences distinctes pensées pour la transmission, les familles et les communautés.",
  ],

  guaranteeKicker: "Bêta fermée",
  guaranteeTitle: "Accès accompagné.",
  guaranteeTitleEm: "Sans paiement en ligne.",
  guaranteeBody: "Les centres peuvent découvrir l'offre et demander une démo. L'activation commerciale et les moyens de paiement seront connectés dans un lot ultérieur.",

  formKicker: "Réserver une démo",
  formTitle: "Une démo courte.",
  formTitleEm: "Adaptée à votre centre.",
  formLede: "Envoyez les coordonnées de votre centre. L'équipe YEMA vous contactera pour organiser une démonstration.",
  fldName: "Nom du centre",
  fldCity: "Ville",
  fldWa: "WhatsApp",
  fldEmail: "Email",
  submit: "Envoyer la demande",
  sentTitle: "Demande reçue.",
  sentTitleEm: "Merci pour votre intérêt.",
  sentBody: "Votre demande est enregistrée. L'équipe YEMA pourra vous recontacter pour organiser la démonstration.",
  error: "Quelque chose ne nous est pas parvenu. Réessayez.",

  footerTagline: "L'Afrique parle. Toutes ses langues — du monde et africaines, enfin un lieu.",
  footerMade: "L'Afrique parle. De Douala à Dakar, de Kinshasa à Abidjan.",
  footerLegal: "Mentions légales",
  footerTerms: "CGU",
  footerPrivacy: "Confidentialité",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages est une plateforme pan-africaine alignée CECRL pour les langues du monde, et indépendante pour les langues africaines. N'est affiliée à aucun organisme officiel d'examen.",
};

const COPY_EN: Copy = {
  navFeatures: "Languages",
  navLevels: "Method",
  navPricing: "Pricing",
  navCenters: "Centers",
  navLogin: "Log in",
  navRegister: "Start",

  heroKicker: "Language centers",
  heroTitle: "Follow your classes.",
  heroTitleEm: "Show their progress.",
  heroLede: "A clear workspace for classes, learner follow-up and your team. No installation, on phone and desktop.",
  heroCta: "Book a demo",

  painsKicker: "What slows you down",
  painsTitle: "What the house takes.",
  painsTitleEm: "Off your week.",
  pains: [
    { title: "Attendance by hand.", body: "Lost sheets, late corrections and duplicates — centralize day-to-day class operations in one workspace." },
    { title: "Drop-off that is hard to see.", body: "Class and progress data give your team a shared reference point for learner follow-up." },
    { title: "Scattered tools for teachers.", body: "The teacher workspace brings classes, assignments, corrections and learner follow-up together." },
    { title: "Limited visibility for families.", body: "Available progress data can be viewed from the workspaces designed for learner follow-up." },
  ],

  solKicker: "The solution",
  solTitle: "Three steps.",
  solTitleEm: "One clear workspace.",
  solSteps: [
    { title: "The center joins YEMA.", body: "After validation, the center gets its workspace and identity in the platform." },
    { title: "Your teachers are invited.", body: "Each teacher gets their workspace. Classes and assignments can then be managed in one place." },
    { title: "Learners join.", body: "Learners join a class through the enrollment flow and teacher approval designed for their class." },
  ],
  solNote: "No installation. Works in the browser on phone and desktop.",

  proofKicker: "Follow-up",
  proofTitle: "One view.",
  proofTitleEm: "To run your classes.",
  proofLede: "Learners, classes, enrollment requests and available progress are brought into the same workspace. The view becomes richer as learners use YEMA.",

  atoutKicker: "The edge",
  atoutTitle: "Two universes.",
  atoutTitleEm: "In the same house.",
  atoutItems: [
    "World languages — with structured journeys and classroom workspaces for teaching teams.",
    "African languages — with distinct experiences designed for transmission, families and communities.",
  ],

  guaranteeKicker: "Closed beta",
  guaranteeTitle: "Guided access.",
  guaranteeTitleEm: "No online payment yet.",
  guaranteeBody: "Centers can explore the offer and request a demo. Commercial activation and payment methods will be connected in a later delivery.",

  formKicker: "Book a demo",
  formTitle: "A short demo.",
  formTitleEm: "Tailored to your center.",
  formLede: "Send your center details. The YEMA team can then contact you to organize a demonstration.",
  fldName: "Center name",
  fldCity: "City",
  fldWa: "WhatsApp",
  fldEmail: "Email",
  submit: "Send request",
  sentTitle: "Request received.",
  sentTitleEm: "Thank you for your interest.",
  sentBody: "Your request has been recorded. The YEMA team can contact you to arrange the demonstration.",
  error: "Something didn't reach us. Try again.",

  footerTagline: "Africa speaks. All its languages — world and African, at last one place.",
  footerMade: "Africa speaks. From Douala to Dakar, from Kinshasa to Abidjan.",
  footerLegal: "Legal",
  footerTerms: "Terms",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  footerDisclaimer: "YEMA Languages is a pan-African CEFR-aligned platform for world languages, and independent for African languages. Not affiliated with any official examination institute.",
};

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
        <section className="comptoir-hero">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.heroKicker)}</p>
            <h1 className="chemin-hero-h">
              {t(c.heroTitle)} <em>{t(c.heroTitleEm)}</em>
            </h1>
            <p className="chemin-hero-lede">{t(c.heroLede)}</p>
            <a href="#demo" className="maison-porte-cta">
              {t(c.heroCta)}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
          </div>
        </section>

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
                  <div className="comptoir-pain-icon" aria-hidden="true"><PainIcon idx={i} /></div>
                  <h3 className="comptoir-pain-h">{t(p.title)}</h3>
                  <p className="comptoir-pain-p">{t(p.body)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

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
                  <div><h3>{t(s.title)}</h3><p>{t(s.body)}</p></div>
                </li>
              ))}
            </ol>

            <p className="comptoir-sol-note"><em>{t(c.solNote)}</em></p>
          </div>
        </section>

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
                <path d="M20 150 Q 60 130 90 110 T 160 70 T 260 30" stroke="var(--brass)" strokeWidth="2" fill="none" />
                <path d="M20 150 Q 60 130 90 110 T 160 70 T 260 30 L 260 170 L 20 170 Z" fill="var(--brass-glow)" />
                <g stroke="var(--creme-hair)" strokeWidth="0.5"><line x1="20" y1="30" x2="280" y2="30" /><line x1="20" y1="90" x2="280" y2="90" /><line x1="20" y1="150" x2="280" y2="150" /></g>
              </svg>
            </div>
          </div>
        </section>

        <section className="comptoir-atout" aria-labelledby="comptoir-atout-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.atoutKicker)}</p>
              <h2 id="comptoir-atout-h" className="maison-h">
                {t(c.atoutTitle)} <em>{t(c.atoutTitleEm)}</em>
              </h2>
            </div>
            <ul className="comptoir-atout-list" role="list">{c.atoutItems.map((it) => <li key={it}>{t(it)}</li>)}</ul>
          </div>
        </section>

        <section className="comptoir-guarantee" aria-labelledby="comptoir-guarantee-h">
          <div className="maison-container">
            <p className="maison-kicker">{t(c.guaranteeKicker)}</p>
            <h2 id="comptoir-guarantee-h" className="maison-porte-h">
              {t(c.guaranteeTitle)} <em>{t(c.guaranteeTitleEm)}</em>
            </h2>
            <p className="maison-lede" style={{ maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>{t(c.guaranteeBody)}</p>
          </div>
        </section>

        <section id="demo" className="ens-form" aria-labelledby="comptoir-form-h">
          <div className="maison-container">
            <div className="maison-section-head">
              <p className="maison-kicker">{t(c.formKicker)}</p>
              <h2 id="comptoir-form-h" className="maison-h">{t(c.formTitle)} <em>{t(c.formTitleEm)}</em></h2>
              <p className="maison-lede">{t(c.formLede)}</p>
            </div>

            {sent ? (
              <div className="ens-form-sent" role="status">
                <h3 className="ens-form-sent-h">{t(c.sentTitle)} <em>{t(c.sentTitleEm)}</em></h3>
                <p>{t(c.sentBody)}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="ens-form-body" noValidate>
                <label className="ens-form-field"><span>{t(c.fldName)}</span><input type="text" required autoComplete="organization" value={form.centerName} onChange={(e) => setForm({ ...form, centerName: e.target.value })} /></label>
                <label className="ens-form-field"><span>{t(c.fldCity)}</span><input type="text" required autoComplete="address-level2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
                <label className="ens-form-field"><span>{t(c.fldWa)}</span><input type="tel" autoComplete="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></label>
                <label className="ens-form-field"><span>{t(c.fldEmail)}</span><input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                {error ? <p className="ens-form-error" role="alert">{error}</p> : null}
                <button type="submit" className="maison-porte-cta" disabled={sending}>{sending ? (loc === "en" ? "Sending…" : "Envoi en cours…") : t(c.submit)}</button>
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

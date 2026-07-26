import Link from "next/link";
import { ShieldCheck, ArrowRight, LogIn } from "lucide-react";
import { BrandY } from "@/components/brand/BrandY";

type Loc = "fr" | "en";

const COPY: Record<Loc, {
  badge: string;
  title: string;
  body: string;
  note: string;
  ctaHome: string;
  ctaLogin: string;
  logoAria: string;
  homeAria: string;
  visualAria: string;
  visualCaption: string;
}> = {
  fr: {
    badge: "Déconnexion réussie",
    title: "À très bientôt.",
    body: "Votre session a bien été fermée. Merci d'avoir appris, partagé et progressé avec YEMA.",
    note: "Votre compte est protégé et aucune session active ne reste ouverte sur cet appareil.",
    ctaHome: "Retour à l'accueil",
    ctaLogin: "Se reconnecter",
    logoAria: "YEMA — retour à l'accueil",
    homeAria: "Retour à la page d'accueil",
    visualAria: "Composition YEMA",
    visualCaption: "YEMA · Apprendre. Partager. Progresser.",
  },
  en: {
    badge: "Signed out successfully",
    title: "See you again soon.",
    body: "Your session has been closed securely. Thank you for learning, sharing and growing with YEMA.",
    note: "Your account is protected, and no active session remains open on this device.",
    ctaHome: "Back to home",
    ctaLogin: "Sign in again",
    logoAria: "YEMA — back to home",
    homeAria: "Back to home page",
    visualAria: "YEMA composition",
    visualCaption: "YEMA · Learn. Share. Grow.",
  },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export const dynamic = "force-static";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = COPY[(locale as Loc)] ?? COPY.fr;
  return { title: `${t.title} · YEMA`, robots: { index: false, follow: false } };
}

export default async function GoodbyePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Loc = rawLocale === "en" ? "en" : "fr";
  const t = COPY[locale];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main className="gb-page" role="main">
        <div className="gb-bg" aria-hidden="true">
          <span className="gb-bg-warm" />
          <span className="gb-bg-grain" />
        </div>

        <header className="gb-header">
          <Link href={`/${locale}`} className="gb-brand" aria-label={t.logoAria}>
            <BrandY variant="world" state="static" size={40} />
            <span className="gb-brand-word" aria-hidden="true">YEMA</span>
          </Link>
        </header>

        <article className="gb-card">
          <div className="gb-content">
            <span className="gb-badge">
              <span className="gb-badge-dot" aria-hidden="true" />
              {t.badge}
            </span>

            <h1 className="gb-title">{t.title}</h1>

            <p className="gb-lede">{t.body}</p>

            <div className="gb-note" role="note">
              <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" className="gb-note-icon" />
              <p>{t.note}</p>
            </div>

            <div className="gb-actions">
              <Link href={`/${locale}`} className="gb-cta gb-cta-primary" aria-label={t.homeAria}>
                <span>{t.ctaHome}</span>
                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/login`} className="gb-cta gb-cta-ghost">
                <LogIn size={16} strokeWidth={2} aria-hidden="true" />
                <span>{t.ctaLogin}</span>
              </Link>
            </div>
          </div>

          <aside className="gb-panel" aria-label={t.visualAria}>
            <div className="gb-panel-halo" aria-hidden="true" />
            <div className="gb-panel-lines" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="gb-panel-mark">
              <BrandY variant="mono" state="static" size={104} />
            </div>
            <p className="gb-panel-caption">{t.visualCaption}</p>
          </aside>
        </article>

        <footer className="gb-footer" aria-hidden="true">
          <span className="gb-footer-dot" />
          <span className="gb-footer-word">YEMA</span>
        </footer>
      </main>
    </>
  );
}

const CSS = `
.gb-page {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  isolation: isolate;
  padding: 28px clamp(16px, 4vw, 48px) 24px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 28px;
  background: #F7EEDD;
  color: var(--espresso);
  overflow: hidden;
  box-sizing: border-box;
  font-family: var(--font-manrope), system-ui, sans-serif;
}
.gb-page *, .gb-page *::before, .gb-page *::after { box-sizing: border-box; }

.gb-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.gb-bg-warm {
  position: absolute; inset: -10%;
  background:
    radial-gradient(60% 55% at 20% 15%, rgba(255, 250, 240, 0.9), transparent 65%),
    radial-gradient(50% 45% at 90% 90%, rgba(184, 135, 62, 0.10), transparent 65%),
    linear-gradient(180deg, #FBF3E2 0%, #F4EBDC 55%, #EEE1C6 100%);
}
.gb-bg-grain {
  position: absolute; inset: 0; opacity: 0.35;
  background-image: radial-gradient(rgba(27, 18, 10, 0.05) 1px, transparent 1px);
  background-size: 4px 4px;
  pointer-events: none;
}

.gb-header {
  max-width: 960px; width: 100%; margin: 0 auto;
  display: flex; align-items: center; gap: 12px;
}
.gb-brand {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  text-decoration: none; color: inherit;
  transition: transform 180ms var(--ease-enter, ease-out);
}
.gb-brand:hover { transform: translateY(-1px); }
.gb-brand:focus-visible { outline: 2px solid var(--brass); outline-offset: 4px; }
.gb-brand-word {
  font-family: var(--font-fraunces), Georgia, serif;
  font-weight: 500; font-size: 15px; letter-spacing: 0.14em;
  color: var(--espresso);
}

.gb-card {
  align-self: center; justify-self: center;
  width: 100%; max-width: 960px;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  border-radius: 28px;
  overflow: hidden;
  background: #FFFDF7;
  border: 1px solid rgba(27, 18, 10, 0.08);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 1) inset,
    0 40px 80px -40px rgba(27, 18, 10, 0.24),
    0 12px 28px -14px rgba(27, 18, 10, 0.09);
  animation: gb-in 520ms var(--ease-enter, cubic-bezier(0.22, 1, 0.36, 1)) both;
}

.gb-content {
  padding: clamp(32px, 4.6vw, 60px);
  display: flex; flex-direction: column; gap: 18px;
  min-width: 0;
}

.gb-badge {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px 6px 9px;
  border-radius: 999px;
  background: rgba(184, 135, 62, 0.1);
  border: 1px solid rgba(184, 135, 62, 0.24);
  color: var(--brass-deep);
  font-family: var(--font-manrope), system-ui, sans-serif;
  font-size: 12px; font-weight: 600; letter-spacing: 0.03em;
  text-transform: none;
}
.gb-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--brass);
  box-shadow: 0 0 0 4px rgba(184, 135, 62, 0.18);
}

.gb-title {
  margin: 0;
  font-family: var(--font-fraunces), Georgia, serif;
  font-weight: 500;
  font-size: clamp(2.15rem, 5vw, 3.4rem);
  line-height: 1.02;
  letter-spacing: -0.025em;
  color: var(--espresso);
}

.gb-lede {
  margin: 4px 0 0;
  color: rgba(27, 18, 10, 0.7);
  font-size: 16.5px; line-height: 1.6;
  max-width: 44ch;
}

.gb-note {
  margin: 8px 0 4px;
  display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #FFFBF0;
  border: 1px solid rgba(184, 135, 62, 0.28);
  color: #3A2812;
  font-size: 13.5px; line-height: 1.55;
  isolation: isolate;
}
.gb-note p { margin: 0; max-width: 52ch; color: inherit; }
.gb-note-icon { color: var(--brass-deep); margin-top: 2px; flex: 0 0 auto; }

.gb-actions {
  margin-top: 12px;
  display: flex; gap: 12px; flex-wrap: wrap;
}

.gb-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 22px;
  border-radius: 14px;
  font-family: var(--font-manrope), system-ui, sans-serif;
  font-weight: 600; font-size: 14.5px; letter-spacing: 0.005em;
  text-decoration: none; cursor: pointer;
  min-height: 48px; min-width: 180px;
  transition:
    transform 180ms var(--ease-enter, ease-out),
    background 180ms var(--ease-enter, ease-out),
    border-color 180ms var(--ease-enter, ease-out),
    color 180ms var(--ease-enter, ease-out);
}
.gb-cta:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; }
.gb-cta-primary {
  background: var(--espresso);
  color: #FBF3E2;
  border: 1px solid var(--espresso);
}
.gb-cta-primary:hover { background: #2A1D10; transform: translateY(-1px); }
.gb-cta-primary:active { transform: translateY(0); }
.gb-cta-ghost {
  background: transparent;
  color: var(--espresso);
  border: 1px solid rgba(27, 18, 10, 0.18);
}
.gb-cta-ghost:hover {
  background: rgba(27, 18, 10, 0.04);
  border-color: rgba(27, 18, 10, 0.32);
}

/* ─── Panneau brass à droite ───────────────────────────────────────── */
.gb-panel {
  position: relative;
  min-height: 400px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 32px;
  background:
    radial-gradient(80% 60% at 50% 40%, rgba(255, 240, 210, 0.14), transparent 60%),
    linear-gradient(155deg, #A9782E 0%, #8A6027 60%, #6E4C1F 100%);
  color: #FBF3E2;
  overflow: hidden;
}

.gb-panel-halo {
  position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
  width: 130%; aspect-ratio: 1 / 1;
  background: radial-gradient(circle, rgba(255, 236, 200, 0.35), transparent 60%);
  filter: blur(20px);
  animation: gb-glow 9s ease-in-out infinite;
}

.gb-panel-lines {
  position: absolute; inset: 0;
  display: block;
}
.gb-panel-lines span {
  position: absolute; left: 8%; right: 8%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(251, 243, 226, 0.28), transparent);
}
.gb-panel-lines span:nth-child(1) { top: 22%; }
.gb-panel-lines span:nth-child(2) { top: 50%; opacity: 0.55; }
.gb-panel-lines span:nth-child(3) { top: 78%; opacity: 0.35; }

.gb-panel-mark {
  position: relative;
  width: 168px; height: 168px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(circle at 40% 30%, rgba(255, 240, 210, 0.28), rgba(0, 0, 0, 0) 65%),
    rgba(27, 18, 10, 0.14);
  border: 1px solid rgba(251, 243, 226, 0.22);
  box-shadow:
    0 20px 40px -20px rgba(27, 18, 10, 0.55),
    0 0 0 8px rgba(251, 243, 226, 0.05);
  animation: gb-lift 7s ease-in-out infinite;
}

.gb-panel-caption {
  position: absolute; bottom: 22px; left: 0; right: 0;
  margin: 0; text-align: center;
  font-family: var(--font-jetbrains, ui-monospace, monospace);
  font-size: 10.5px; letter-spacing: 0.28em; text-transform: uppercase;
  color: rgba(251, 243, 226, 0.72);
}

/* ─── Footer discret ──────────────────────────────────────────────── */
.gb-footer {
  max-width: 960px; width: 100%; margin: 0 auto;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  color: rgba(27, 18, 10, 0.42);
  font-family: var(--font-jetbrains, ui-monospace, monospace);
  font-size: 10.5px; letter-spacing: 0.24em; text-transform: uppercase;
}
.gb-footer-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--brass);
}

/* ─── Animations ──────────────────────────────────────────────────── */
@keyframes gb-in {
  from { opacity: 0; transform: translateY(16px) scale(0.995); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes gb-glow {
  0%, 100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.04); }
}
@keyframes gb-lift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ─── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 880px) {
  .gb-page { align-content: start; grid-template-rows: auto auto auto; }
  .gb-card { grid-template-columns: 1fr; align-self: start; margin-top: 8px; }
  .gb-panel { display: none; }
  .gb-content { padding: 28px 22px 32px; gap: 14px; }
  .gb-actions { flex-direction: column; margin-top: 8px; }
  .gb-cta { width: 100%; min-width: 0; }
  .gb-footer { margin-top: 16px; }
}

@media (max-width: 400px) {
  .gb-page { padding: 22px 14px 20px; gap: 22px; }
  .gb-title { font-size: 1.85rem; }
  .gb-lede { font-size: 15px; }
  .gb-brand-word { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .gb-card, .gb-panel-halo, .gb-panel-mark { animation: none !important; }
  .gb-brand, .gb-cta { transition: none !important; }
}
`;

import Link from "next/link";
import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveChildSession } from "@/lib/family/childResolvers";
import { isInternalTesterEmail } from "@/lib/internalTest";
import {
  AFRICAN_FAMILY,
  AFRICAN_SOLO,
  LEVELS,
  WORLD_PASSAGE_PRICES,
  WORLD_TEACHER_ADD,
  fmtPriceUnit,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

const WORLD_LANGUAGES = [
  { code: "DEUTSCH", fr: "Allemand", en: "German", selectable: true },
  { code: "ENGLISH", fr: "Anglais", en: "English", selectable: false },
  { code: "FRENCH", fr: "Français", en: "French", selectable: false },
] as const;

const ROOT_LANGUAGES = [
  { code: "WOLOF", fr: "Wolof", en: "Wolof" },
  { code: "DOUALA", fr: "Douala", en: "Duala" },
  { code: "LINGALA", fr: "Lingala", en: "Lingala" },
  { code: "BAMBARA", fr: "Bambara", en: "Bambara" },
  { code: "YORUBA", fr: "Yoruba", en: "Yoruba" },
  { code: "SWAHILI", fr: "Swahili", en: "Swahili" },
] as const;

const inputStyle = {
  width: "100%",
  minHeight: 46,
  borderRadius: 10,
  border: "1px solid rgba(244,235,220,.2)",
  background: "rgba(244,235,220,.04)",
  color: "inherit",
  padding: "0 12px",
  font: "inherit",
} as const;

const labelStyle = {
  display: "grid",
  gap: 7,
  fontSize: 12,
  color: "var(--creme-mute, #b9aa98)",
} as const;

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const child = await resolveActiveChildSession();
  if (child) {
    redirect({ href: "/dashboard", locale: loc });
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale: loc });
    return null;
  }
  const internalTester = isInternalTesterEmail(user.email);

  const text = loc === "fr" ? {
    kicker: "Catalogue complet",
    title: "Choisissez votre prochaine maison.",
    sub: "Votre langue d’onboarding ne vous enferme pas. Tous les adultes peuvent consulter les deux univers, comparer les tarifs et choisir un nouveau parcours.",
    coursesSoon: "Les espaces sont ouverts pour les tests internes. Les cours complets arrivent bientôt sur la plateforme ; aucun contenu culturel n’est inventé en attendant.",
    world: "Langues du monde",
    worldSub: "Le Passage · un niveau CECRL complet sur quatre mois.",
    roots: "Langues Racines",
    rootsSub: "Solo ou Famille · abonnement mensuel ou annuel.",
    language: "Langue",
    level: "Niveau",
    currency: "Devise",
    teacher: "Ajouter le suivi professeur",
    offer: "Offre",
    period: "Période",
    month: "Mensuel",
    year: "Annuel",
    solo: "Solo",
    family: "Famille",
    simulate: "Simuler le paiement et entrer",
    paymentSoon: "Paiement réel bientôt disponible",
    internal: "Paiement simulé réservé au test propriétaire. Une commande, un paiement confirmé et un droit d’accès réels seront créés dans Production avec le marqueur internalTest.",
    soon: "Cours bientôt disponibles",
    available: "Sélectionnable",
    back: "Retour à mon espace",
    testConsole: "Console des 9 personas",
  } : {
    kicker: "Full catalogue",
    title: "Choose your next YEMA home.",
    sub: "Your onboarding language never locks you in. Every adult can view both universes, compare pricing and choose a new learning path.",
    coursesSoon: "Spaces are open for internal testing. Full courses are coming soon; no cultural content is fabricated in the meantime.",
    world: "World languages",
    worldSub: "The Passage · one complete CEFR level over four months.",
    roots: "Roots languages",
    rootsSub: "Solo or Family · monthly or yearly subscription.",
    language: "Language",
    level: "Level",
    currency: "Currency",
    teacher: "Add teacher support",
    offer: "Offer",
    period: "Period",
    month: "Monthly",
    year: "Yearly",
    solo: "Solo",
    family: "Family",
    simulate: "Simulate payment and enter",
    paymentSoon: "Real payment coming soon",
    internal: "Simulated payment is restricted to the owner test account. A real Production order, confirmed payment and access grant will be created with the internalTest marker.",
    soon: "Courses coming soon",
    available: "Selectable",
    back: "Back to my space",
    testConsole: "Nine-persona console",
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--espresso, #120d0b)", color: "var(--creme, #f4ebdc)", padding: "40px 16px 96px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 8px", color: "var(--brass, #d9a855)", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>{text.kicker}</p>
          <h1 style={{ margin: "0 0 10px", maxWidth: 820, fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.05 }}>{text.title}</h1>
          <p style={{ margin: "0 0 14px", maxWidth: 820, color: "var(--creme-mute, #b9aa98)", lineHeight: 1.65 }}>{text.sub}</p>
          <p style={{ margin: 0, maxWidth: 820, padding: "12px 14px", border: "1px solid rgba(217,168,85,.3)", borderRadius: 12, background: "rgba(217,168,85,.07)", color: "var(--creme-soft, #ddcfbd)", fontSize: 13, lineHeight: 1.55 }}>{text.coursesSoon}</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <section style={{ border: "1px solid rgba(244,235,220,.14)", borderRadius: 20, padding: 22, background: "rgba(244,235,220,.025)" }}>
            <p style={{ margin: "0 0 6px", color: "var(--brass, #d9a855)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em" }}>{loc === "fr" ? "Le voyage" : "The journey"}</p>
            <h2 style={{ margin: "0 0 6px", fontSize: 27 }}>{text.world}</h2>
            <p style={{ margin: "0 0 18px", color: "var(--creme-mute, #b9aa98)", lineHeight: 1.5 }}>{text.worldSub}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {WORLD_LANGUAGES.map((language) => (
                <span key={language.code} style={{ border: "1px solid rgba(244,235,220,.16)", borderRadius: 999, padding: "7px 10px", fontSize: 12, color: language.selectable ? "var(--creme, #f4ebdc)" : "var(--creme-mute, #b9aa98)" }}>
                  {loc === "fr" ? language.fr : language.en} · {language.selectable ? text.available : text.soon}
                </span>
              ))}
            </div>

            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
              {LEVELS.map((level) => (
                <div key={level} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(244,235,220,.035)" }}>
                  <strong>{level}</strong>
                  <span style={{ color: "var(--creme-mute, #b9aa98)", fontSize: 13 }}>{fmtPriceUnit(WORLD_PASSAGE_PRICES[level].fcfa, "fcfa")} · {fmtPriceUnit(WORLD_PASSAGE_PRICES[level].eur, "eur")}</span>
                </div>
              ))}
            </div>

            <form action="/api/internal-test/simulate-payment" method="post" style={{ display: "grid", gap: 13 }}>
              <input type="hidden" name="offer" value="PASSAGE" />
              <input type="hidden" name="locale" value={loc} />
              <label style={labelStyle}>{text.language}
                <select name="language" defaultValue="DEUTSCH" style={inputStyle}>
                  <option value="DEUTSCH">{loc === "fr" ? "Allemand" : "German"}</option>
                </select>
              </label>
              <label style={labelStyle}>{text.level}
                <select name="level" defaultValue="A1" style={inputStyle}>
                  {LEVELS.map((level) => <option value={level} key={level}>{level}</option>)}
                </select>
              </label>
              <label style={labelStyle}>{text.currency}
                <select name="currency" defaultValue="EUR" style={inputStyle}>
                  <option value="EUR">EUR</option>
                  <option value="XAF">FCFA</option>
                </select>
              </label>
              <label style={{ display: "flex", gap: 9, alignItems: "center", color: "var(--creme-soft, #ddcfbd)", fontSize: 13 }}>
                <input type="checkbox" name="withTeacher" value="1" />
                {text.teacher} · +{fmtPriceUnit(WORLD_TEACHER_ADD.A1.eur, "eur")} à +{fmtPriceUnit(WORLD_TEACHER_ADD.C1.eur, "eur")}
              </label>
              <button type="submit" disabled={!internalTester} style={{ minHeight: 48, border: 0, borderRadius: 12, background: internalTester ? "var(--brass, #d9a855)" : "rgba(244,235,220,.12)", color: internalTester ? "#1a120d" : "var(--creme-mute, #b9aa98)", fontWeight: 800, cursor: internalTester ? "pointer" : "not-allowed" }}>
                {internalTester ? text.simulate : text.paymentSoon}
              </button>
            </form>
          </section>

          <section style={{ border: "1px solid rgba(201,132,63,.32)", borderRadius: 20, padding: 22, background: "rgba(118,54,37,.14)" }}>
            <p style={{ margin: "0 0 6px", color: "#ebc07a", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em" }}>{loc === "fr" ? "Les sources" : "The sources"}</p>
            <h2 style={{ margin: "0 0 6px", fontSize: 27 }}>{text.roots}</h2>
            <p style={{ margin: "0 0 18px", color: "var(--creme-mute, #b9aa98)", lineHeight: 1.5 }}>{text.rootsSub}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {ROOT_LANGUAGES.map((language) => (
                <span key={language.code} style={{ border: "1px solid rgba(235,192,122,.24)", borderRadius: 999, padding: "7px 10px", fontSize: 12 }}>
                  {loc === "fr" ? language.fr : language.en} · {text.soon}
                </span>
              ))}
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(244,235,220,.035)" }}>
                <strong>{text.solo}</strong>
                <div style={{ marginTop: 5, color: "var(--creme-mute, #b9aa98)", fontSize: 13 }}>{fmtPriceUnit(AFRICAN_SOLO.fcfa.month, "fcfa")} / {text.month.toLowerCase()} · {fmtPriceUnit(AFRICAN_SOLO.eur.year, "eur")} / {text.year.toLowerCase()}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(244,235,220,.035)" }}>
                <strong>{text.family}</strong>
                <div style={{ marginTop: 5, color: "var(--creme-mute, #b9aa98)", fontSize: 13 }}>{fmtPriceUnit(AFRICAN_FAMILY.fcfa.month, "fcfa")} / {text.month.toLowerCase()} · {fmtPriceUnit(AFRICAN_FAMILY.eur.year, "eur")} / {text.year.toLowerCase()}</div>
              </div>
            </div>

            <form action="/api/internal-test/simulate-payment" method="post" style={{ display: "grid", gap: 13 }}>
              <input type="hidden" name="locale" value={loc} />
              <label style={labelStyle}>{text.language}
                <select name="language" defaultValue="WOLOF" style={inputStyle}>
                  {ROOT_LANGUAGES.map((language) => <option value={language.code} key={language.code}>{loc === "fr" ? language.fr : language.en}</option>)}
                </select>
              </label>
              <label style={labelStyle}>{text.offer}
                <select name="offer" defaultValue="ROOTS_SOLO" style={inputStyle}>
                  <option value="ROOTS_SOLO">{text.solo}</option>
                  <option value="ROOTS_FAMILY">{text.family}</option>
                </select>
              </label>
              <label style={labelStyle}>{text.period}
                <select name="period" defaultValue="YEAR" style={inputStyle}>
                  <option value="MONTH">{text.month}</option>
                  <option value="YEAR">{text.year}</option>
                </select>
              </label>
              <label style={labelStyle}>{text.currency}
                <select name="currency" defaultValue="EUR" style={inputStyle}>
                  <option value="EUR">EUR</option>
                  <option value="XAF">FCFA</option>
                </select>
              </label>
              <button type="submit" disabled={!internalTester} style={{ minHeight: 48, border: 0, borderRadius: 12, background: internalTester ? "#ebc07a" : "rgba(244,235,220,.12)", color: internalTester ? "#24150f" : "var(--creme-mute, #b9aa98)", fontWeight: 800, cursor: internalTester ? "pointer" : "not-allowed" }}>
                {internalTester ? text.simulate : text.paymentSoon}
              </button>
            </form>
          </section>
        </div>

        {internalTester ? <p style={{ margin: "20px 0 0", color: "var(--creme-mute, #b9aa98)", fontSize: 12, lineHeight: 1.6 }}>{text.internal}</p> : null}
        <footer style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          <Link href={`/${loc}/dashboard`} style={{ color: "var(--creme, #f4ebdc)" }}>{text.back}</Link>
          {internalTester ? <Link href={`/${loc}/internal-test`} style={{ color: "var(--brass, #d9a855)" }}>{text.testConsole}</Link> : null}
        </footer>
      </div>
    </main>
  );
}

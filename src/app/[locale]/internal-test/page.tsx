import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  INTERNAL_TEST_COOKIE_NAME,
  getInternalPersonaContract,
  type InternalPersonaId,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";

export const dynamic = "force-dynamic";

const PERSONAS: Array<{
  id: InternalPersonaId;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
}> = [
  { id: "super_admin", labelFr: "Super Admin", labelEn: "Super Admin", descriptionFr: "Console globale et audit.", descriptionEn: "Global console and audit." },
  { id: "teacher", labelFr: "Enseignant·e", labelEn: "Teacher", descriptionFr: "Classes, devoirs et corrections.", descriptionEn: "Classes, assignments and reviews." },
  { id: "coach", labelFr: "Coach Racines", labelEn: "Racines Coach", descriptionFr: "Cercles, apprenants et séances.", descriptionEn: "Circles, learners and sessions." },
  { id: "center_admin", labelFr: "Centre", labelEn: "Center", descriptionFr: "Élèves, enseignants et administration.", descriptionEn: "Students, teachers and administration." },
  { id: "student_monde", labelFr: "Élève Monde", labelEn: "World Student", descriptionFr: "Parcours CECRL et dashboard Monde.", descriptionEn: "CEFR path and World dashboard." },
  { id: "student_racines", labelFr: "Élève Racines", labelEn: "Roots Student", descriptionFr: "Étapes E1–E5 et dashboard Racines.", descriptionEn: "E1–E5 path and Roots dashboard." },
  { id: "family", labelFr: "Famille", labelEn: "Family", descriptionFr: "Foyer, enfants et places techniques.", descriptionEn: "Household, children and technical seats." },
  { id: "child_monde", labelFr: "Enfant Monde", labelEn: "World Child", descriptionFr: "Espace enfant Monde avec session sécurisée.", descriptionEn: "World child space with a secure session." },
  { id: "child_racines", labelFr: "Enfant Racines", labelEn: "Roots Child", descriptionFr: "Espace enfant Racines avec session sécurisée.", descriptionEn: "Roots child space with a secure session." },
];

export default async function InternalTestPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!isInternalTestEnvironment()) notFound();

  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isInternalTesterEmail(user.email)) notFound();

  const jar = await cookies();
  const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
  const activePersona = isInternalPersonaId(rawPersona) ? rawPersona : null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--espresso, #120d0b)", color: "var(--creme, #f4ebdc)", padding: "40px 16px 96px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 8px", color: "var(--brass, #d9a855)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {loc === "fr" ? "P-1 · tests internes" : "P-1 · internal testing"}
          </p>
          <h1 style={{ margin: "0 0 10px", fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.05 }}>
            {loc === "fr" ? "Tester les neuf maisons YEMA." : "Test all nine YEMA spaces."}
          </h1>
          <p style={{ margin: 0, maxWidth: 820, color: "var(--creme-mute, #b9aa98)", lineHeight: 1.65 }}>
            {loc === "fr"
              ? "Cette console n’est disponible que sur l’environnement P-1. Chaque bascule vérifie le contrat du persona et utilise uniquement des fixtures de test."
              : "This console is available only in the P-1 environment. Each switch verifies the persona contract and uses test fixtures only."}
          </p>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          <form action="/api/internal-test/switch-persona" method="post">
            <input type="hidden" name="action" value="reset" />
            <input type="hidden" name="locale" value={loc} />
            <button type="submit" style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(244,235,220,.25)", background: "transparent", color: "inherit", cursor: "pointer" }}>
              {loc === "fr" ? "Quitter le mode persona" : "Exit persona mode"}
            </button>
          </form>
        </div>

        <section aria-label={loc === "fr" ? "Personas disponibles" : "Available personas"} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {PERSONAS.map((persona) => {
            const active = activePersona === persona.id;
            const contract = getInternalPersonaContract(persona.id);
            const badges = [
              `Space: ${contract.spaceRole}`,
              `App: ${contract.appRole ?? "CHILD"}`,
              `Universe: ${contract.universe ?? "GLOBAL"}`,
              `Auth: ${contract.authKind}`,
              `Route: ${contract.destinationPath}`,
            ];

            return (
              <article key={persona.id} style={{ border: active ? "1px solid var(--brass, #d9a855)" : "1px solid rgba(244,235,220,.14)", borderRadius: 18, padding: 20, background: active ? "rgba(217,168,85,.09)" : "rgba(244,235,220,.025)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: active ? "var(--brass, #d9a855)" : "var(--creme-mute, #b9aa98)" }}>
                    {active ? (loc === "fr" ? "Actif" : "Active") : persona.id.replaceAll("_", " ")}
                  </p>
                  <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{loc === "fr" ? persona.labelFr : persona.labelEn}</h2>
                  <p style={{ margin: 0, color: "var(--creme-mute, #b9aa98)", fontSize: 14, lineHeight: 1.5 }}>
                    {loc === "fr" ? persona.descriptionFr : persona.descriptionEn}
                  </p>
                </div>

                <div aria-label={loc === "fr" ? "Contrat technique" : "Technical contract"} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {badges.map((badge) => (
                    <span key={badge} style={{ border: "1px solid rgba(244,235,220,.14)", borderRadius: 999, padding: "5px 8px", fontSize: 10, color: "var(--creme-mute, #b9aa98)" }}>
                      {badge}
                    </span>
                  ))}
                </div>

                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--brass, #d9a855)" }}>
                    {loc === "fr" ? "Attributs contrôlés" : "Checked attributes"}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--creme-mute, #b9aa98)", fontSize: 12, lineHeight: 1.55 }}>
                    {contract.requiredAttributes.map((attribute) => <li key={attribute}>{attribute}</li>)}
                  </ul>
                </div>

                <form action="/api/internal-test/switch-persona" method="post" style={{ marginTop: "auto" }}>
                  <input type="hidden" name="persona" value={persona.id} />
                  <input type="hidden" name="locale" value={loc} />
                  <button type="submit" style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid rgba(217,168,85,.4)", background: active ? "var(--brass, #d9a855)" : "transparent", color: active ? "#1a120d" : "var(--creme, #f4ebdc)", fontWeight: 700, cursor: "pointer" }}>
                    {loc === "fr" ? "Tester ce persona" : "Test this persona"}
                  </button>
                </form>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

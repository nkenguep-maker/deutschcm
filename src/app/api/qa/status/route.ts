// GET /api/qa/status
//
// Petit endpoint READ-ONLY consommé par <QaTestBar /> pour savoir quoi
// afficher (menu Super Admin ou barre "MODE TEST · ..."). Aucune donnée
// sensible retournée · juste l'ID persona (label calculé côté client),
// et un booléen isSuperAdmin (déduit de l'email courant vs fixture email
// super_admin, sans exposer l'email).
//
// Retourne 404 si la gate QA n'est pas active · le composant client ne
// rend rien dans ce cas.

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { resolveQaConfig } from "@/lib/qa/config";
import { QA_PERSONAS, isQaPersonaId, getPersona } from "@/lib/qa/personas";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(_req: NextRequest) {
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  const cookieStore = await cookies();
  const rawPersona = cookieStore.get("yema_qa_persona")?.value ?? null;
  const currentPersonaId = rawPersona && isQaPersonaId(rawPersona) ? rawPersona : null;

  // Vérifier user courant · si son email == fixture super_admin, montrer le menu.
  let isSuperAdmin = false;
  try {
    const supabase = await createSsrClient();
    const { data } = await supabase.auth.getUser();
    const email = data?.user?.email ?? null;
    const superAdmin = getPersona("super_admin");
    if (email && superAdmin && email.toLowerCase() === superAdmin.fixtureEmail.toLowerCase()) {
      isSuperAdmin = true;
    }
  } catch {
    /* silent · pas de session = pas super admin */
  }

  return NextResponse.json({
    gate: "active",
    currentPersona: currentPersonaId,
    isSuperAdmin,
    personas: QA_PERSONAS.map((p) => ({
      id: p.id,
      labelFr: p.label.fr,
      labelEn: p.label.en,
      role: p.role,
      available: p.available,
    })),
  });
}

export async function POST() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }

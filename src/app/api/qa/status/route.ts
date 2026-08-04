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
import { readQaCookie } from "@/lib/qa/cookie";
import { normalizeHost } from "@/lib/qa/host";
import { QA_PERSONAS, isQaPersonaId, getPersona } from "@/lib/qa/personas";

function notFound(code?: string) {
  return NextResponse.json(
    { error: "Not found", ...(code ? { code } : {}) },
    { status: 404 },
  );
}

export async function GET(request: NextRequest) {
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  // Aussi vérifier le cookie yema_qa_session · sans bootstrap valide,
  // l'user ne doit pas voir la barre (l'impersonate refuserait ensuite
  // en 404 · autant afficher rien plutôt qu'un menu "cassé").
  const url = new URL(request.url);
  const host = normalizeHost(url.host);
  const cookieCheck = await readQaCookie(process.env.YEMA_QA_SESSION_SECRET!, {
    deploymentHost: host,
    projectRef: status.projectRef,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!cookieCheck.ok) return notFound(`cookie_${cookieCheck.reason}`);

  const cookieStore = await cookies();
  const rawPersona = cookieStore.get("yema_qa_persona")?.value ?? null;
  const currentPersonaId = rawPersona && isQaPersonaId(rawPersona) ? rawPersona : null;

  // Vérifier user courant · l'user est "super admin QA" si son email est
  //   (a) le fixture super_admin (persona impersonation), OU
  //   (b) l'admin humain listé dans YEMA_QA_ADMIN_EMAIL (celui qui a
  //       reçu le bootstrap link) · ce cas permet à Jacob de voir la
  //       barre depuis son propre compte avant d'impersonate.
  let isSuperAdmin = false;
  try {
    const supabase = await createSsrClient();
    const { data } = await supabase.auth.getUser();
    const email = (data?.user?.email ?? "").toLowerCase();
    const fixtureSA = getPersona("super_admin")?.fixtureEmail?.toLowerCase() ?? "";
    const humanSA = (status.adminEmail || "").toLowerCase();
    if (email && (email === fixtureSA || email === humanSA)) {
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

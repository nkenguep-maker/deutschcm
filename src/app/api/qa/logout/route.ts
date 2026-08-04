// QA-b1 Gate · POST /api/qa/logout
//
// Déconnecte la session Supabase courante + supprime le cookie QA +
// redirige vers /[locale]/goodbye. Idempotent. Protection CSRF ·
// mêmes contrôles que /api/qa/impersonate (POST + Content-Type JSON +
// Origin match + Sec-Fetch-Site).

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { resolveQaConfig } from "@/lib/qa/config";
import { clearQaCookie } from "@/lib/qa/cookie";
import { checkCsrf } from "@/lib/qa/csrf";
import { normalizeHost } from "@/lib/qa/host";
import { qaLog } from "@/lib/qa/log";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  const csrf = checkCsrf(request);
  if (!csrf.ok) {
    qaLog("QA_ACCESS_DENIED", {
      deploymentHost: normalizeHost(request.headers.get("host") || ""),
      projectRef: status.projectRef,
      reasonCode: csrf.reason,
    });
    return notFound();
  }

  // Déconnecte la session Supabase via le client SSR canonique.
  try {
    const supabase = await createSsrClient();
    await supabase.auth.signOut();
  } catch {
    // silencieux · même si signOut échoue on retire le cookie QA.
  }

  await clearQaCookie();
  qaLog("QA_IMPERSONATION_ENDED", { projectRef: status.projectRef });

  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/fr/goodbye", url.origin), { status: 303 });
  // Efface le label persona (affichage barre)
  response.cookies.set("yema_qa_persona", "", { path: "/", maxAge: 0 });
  // P4.6 Lot 6 · aucun contexte enfant ne doit survivre au logout QA
  // (brief §3). Idempotent : si le cookie n'existait pas, ce set le crée
  // vide puis l'expire immédiatement (maxAge 0).
  response.cookies.set("yema_child_session", "", {
    path: "/", httpOnly: true, sameSite: "lax", secure: true, maxAge: 0,
  });
  return response;
}

export async function GET() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }

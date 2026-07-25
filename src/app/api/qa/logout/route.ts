// P4.5-QA · POST /api/qa/logout
//
// Déconnecte la session Supabase courante + supprime le cookie QA +
// redirige vers /[locale]/goodbye. Idempotent · si aucune session, renvoie
// juste 204.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveQaConfig } from "@/lib/qa/config";
import { clearQaCookie } from "@/lib/qa/cookie";
import { qaLog } from "@/lib/qa/log";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST() {
  const status = resolveQaConfig();
  if (!status.active) return notFound();

  // Déconnecte la session Supabase.
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) => {
            try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
            catch { /* server component read-only · ignore */ }
          },
        },
      },
    );
    await supabase.auth.signOut();
  } catch {
    // silencieux · même si signOut échoue on veut retirer le cookie QA.
  }

  await clearQaCookie();
  qaLog("QA_IMPERSONATION_ENDED", { projectRef: status.projectRef });

  return NextResponse.json({ redirectUrl: "/fr/goodbye" }, { status: 200 });
}

export async function GET() { return notFound(); }
export async function PATCH() { return notFound(); }
export async function PUT() { return notFound(); }
export async function DELETE() { return notFound(); }

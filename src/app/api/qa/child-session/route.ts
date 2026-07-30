// P4.6 Lot 5 · QA endpoint pour activer une session enfant sur les fixtures
// bakées. UNIQUEMENT accessible en Preview P-1 (gate resolveQaConfig).
// 404 stable en Production.
//
// Flux :
//   GET /api/qa/child-session?child=monde|racines&locale=fr|en
//   → Gate QA (resolveQaConfig().active === true, sinon 404)
//   → Vérifie session Supabase parent (family fixture)
//   → Vérifie ownership du ChildProfile bakée (test_yema_qa_child_family_*)
//   → Set cookie enfant HMAC (30 min TTL)
//   → Redirect 303 vers /[locale]/dashboard qui rend le dashboard enfant
//
// Ce endpoint ne demande PAS le PIN (contexte QA). En Production, le PIN
// reste obligatoire via POST /api/child-session.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveQaConfig } from "@/lib/qa/config";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
} from "@/lib/security/childSession";

export const dynamic = "force-dynamic";

const FIXTURE_CHILD_IDS = {
  monde: "test_yema_qa_child_family_monde",
  racines: "test_yema_qa_child_family_racines",
} as const;

function notFound(code?: string) {
  const cfg = resolveQaConfig();
  if (cfg.active && code) {
    return NextResponse.json({ error: "Not found", code }, { status: 404 });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(req: NextRequest) {
  // 1. Gate QA · en Production ce endpoint est indistinguable d'une 404.
  const cfg = resolveQaConfig();
  if (!cfg.active) return notFound();

  const url = new URL(req.url);
  const childParam = url.searchParams.get("child");
  const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";
  if (childParam !== "monde" && childParam !== "racines") return notFound("bad_child");

  // 2. Session parent Supabase (émise par l'impersonate persona family).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound("no_parent_session");

  const parent = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!parent) return notFound("no_parent_row");

  // 3. Vérification ownership du ChildProfile bakée.
  const childId = FIXTURE_CHILD_IDS[childParam];
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentUserId: parent.id },
    select: { id: true },
  });
  if (!child) return notFound("child_not_owned");

  // 4. Set cookie signé HMAC.
  const cookieValue = encodeChildSession(child.id);
  if (!cookieValue) return notFound("secret_unavailable");

  const jar = await cookies();
  jar.set(CHILD_SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHILD_SESSION_TTL_SECONDS,
  });

  // 5. Redirect vers le dashboard qui rend le child dashboard.
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url), { status: 303 });
}

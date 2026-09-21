import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

const EMAIL_MAX = 254;
const NAME_MAX = 120;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 256;

function bad(error: string, status = 400) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  // QA-only escape hatch for the hosted Supabase SMTP quota. This route must
  // never exist as an effective capability in Production.
  if (!isInternalTestEnvironment()) return bad("NOT_FOUND", 404);
  if (!isSameOriginRequest(req)) return bad("ORIGIN_MISMATCH", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return bad("INVALID_JSON");

  const raw = body as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  const firstName = typeof raw.firstName === "string" ? raw.firstName.trim() : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName.trim() : "";
  const metadata = raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
    ? raw.metadata as Record<string, unknown>
    : {};

  if (!email || email.length > EMAIL_MAX || !isEmailLike(email)) return bad("INVALID_EMAIL");
  if (!firstName || !lastName || firstName.length > NAME_MAX || lastName.length > NAME_MAX) {
    return bad("INVALID_NAME");
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return bad("INVALID_PASSWORD");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return bad("QA_AUTH_NOT_CONFIGURED", 503);

  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fullName = `${firstName} ${lastName}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...metadata,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      qa_p1_email_bypass: true,
    },
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("exists")) return bad("ACCOUNT_EXISTS", 409);
    console.error("[qa/auth/register] createUser failed", error);
    return bad("QA_CREATE_FAILED", 500);
  }

  return NextResponse.json(
    { created: true, userId: data.user.id, emailConfirmed: true },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

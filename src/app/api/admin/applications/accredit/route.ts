// POST /api/admin/applications/accredit — Sprint 8bis.
// Accrédite un·e enseignant·e depuis sa demande : crée un user Supabase
// (si absent), attribue le rôle TEACHER, marque l'application comme
// ACCREDITED, envoie un email de bienvenue.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { grantRole, syncUserMetadata } from "@/lib/roles";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { sendEmail, emailRoleGranted } from "@/lib/resend";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { userRoles: { where: { status: "ACTIVE", role: "ADMIN" }, select: { id: true } } },
  });
  return admin && admin.userRoles.length > 0 ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = (await request.json()) as { id?: string };
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const app = await prisma.teacherApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE) {
    return NextResponse.json({ error: "no_service_key" }, { status: 500 });
  }
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Créer le user Supabase avec un mot de passe temporaire.
  const tempPassword = Math.random().toString(36).slice(2) + "!Aa1";
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: app.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: app.fullName,
      role: "TEACHER",
      accredited_from: id,
    },
  });

  let authUser = created?.user ?? null;
  if (createErr || !authUser) {
    // L'user existe peut-être déjà — récupérer par email.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email?.toLowerCase() === app.email.toLowerCase());
    if (!existing) {
      return NextResponse.json({ error: "cannot_create_user" }, { status: 500 });
    }
    authUser = existing;
  }

  let dbUserId: string;
  try {
    const { user: dbUser } = await reconcileDbUser({
      authUser,
      defaultRole: "TEACHER",
      patch: { fullName: app.fullName },
    });
    dbUserId = dbUser.id;
  } catch (e) {
    if (e instanceof ReconcileError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }

  await grantRole({ userId: dbUserId, role: "TEACHER", grantedBy: admin.id });
  await syncUserMetadata({ supabaseId: authUser.id });

  await prisma.teacherApplication.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: "ACCREDITED" as any },
  });

  // Email de bienvenue best-effort.
  if (process.env.RESEND_API_KEY) {
    sendEmail({
      to: app.email,
      subject: "YEMA · votre espace enseignant·e est ouvert",
      html: emailRoleGranted(app.fullName, "TEACHER"),
      from: "YEMA <noreply@deutschcm.vercel.app>",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, supabaseId: authUser.id, tempPassword });
}

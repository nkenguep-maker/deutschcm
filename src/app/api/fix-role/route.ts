import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { grantRole, syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import type { Role } from "@prisma/client";

// Rôle de base au register : réconcilie la ligne User + attache un UserRole
// ACTIVE (onboarded=false — l'onboarding se déclenche à l'entrée dans l'espace).

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];

export async function POST(request: Request) {
  const { role } = (await request.json()) as { role?: string };
  if (!role || !VALID.includes(role as SpaceRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let dbUserId: string;
  try {
    const { user: dbUser } = await reconcileDbUser({
      authUser: user,
      defaultRole: role as Role,
    });
    dbUserId = dbUser.id;
  } catch (e) {
    if (e instanceof ReconcileError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }

  await grantRole({ userId: dbUserId, role: role as SpaceRole });
  await syncUserMetadata({ supabaseId: user.id, activeSpace: role as SpaceRole });

  return NextResponse.json({ ok: true });
}

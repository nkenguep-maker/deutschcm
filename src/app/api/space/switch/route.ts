import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";
import {
  hasActiveRole,
  requireRoleOnboarding,
  syncUserMetadata,
  type SpaceRole,
} from "@/lib/roles";

// Bascule l'espace actif. Refuse si l'user n'a pas le rôle cible.
// Redirige vers l'onboarding du rôle s'il n'est pas encore onboardé.

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];
const SPACE_ROUTE: Record<SpaceRole, string> = {
  STUDENT: "/dashboard",
  TEACHER: "/teacher",
  CENTER: "/center",
  ADMIN: "/admin",
};

export async function POST(request: Request) {
  const { role } = (await request.json()) as { role?: string };
  if (!role || !VALID.includes(role as SpaceRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const has = await hasActiveRole(dbUser.id, role as SpaceRole);
  if (!has) {
    return NextResponse.json({ error: "Role not granted" }, { status: 403 });
  }

  // Mémoriser l'espace actif via cookie + sync user_metadata
  cookieStore.set("active_space", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  await syncUserMetadata({
    supabaseId: user.id,
    activeSpace: role as SpaceRole,
  });

  // Si le rôle n'est pas encore onboardé → rediriger vers son onboarding
  const guard = await requireRoleOnboarding({
    userId: dbUser.id,
    role: role as SpaceRole,
  });
  if (!guard.ok) {
    return NextResponse.json({ ok: true, redirectTo: guard.redirectTo });
  }

  return NextResponse.json({
    ok: true,
    redirectTo: SPACE_ROUTE[role as SpaceRole],
  });
}

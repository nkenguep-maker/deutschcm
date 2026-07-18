import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";

// Recherche + liste des users pour l'admin UI /admin/roles.
// Retourne id, email, fullName, roles[] (ACTIVE only).

export async function GET(request: Request) {
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

  const adminDb = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      userRoles: { where: { status: "ACTIVE", role: "ADMIN" }, select: { id: true } },
    },
  });
  if (!adminDb || adminDb.userRoles.length === 0) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      fullName: true,
      userRoles: {
        where: { status: "ACTIVE" },
        select: { role: true, onboarded: true, grantedBy: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    take: 40,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

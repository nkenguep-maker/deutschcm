import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Set onboardingDone in Prisma
  try {
    await prisma.user.update({
      where: { supabaseId: user.id },
      data: { onboardingDone: true },
    });
  } catch {
    // Row might not exist yet — upsert as fallback
    await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: { onboardingDone: true },
      create: {
        supabaseId: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name ?? "Utilisateur",
        onboardingDone: true,
      },
    });
  }

  // Set onboarding_done=true in Supabase user_metadata
  await supabase.auth.updateUser({ data: { onboarding_done: true } });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("onboarding_done", "true", { path: "/", maxAge: 2592000 });
  return response;
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { LANGUAGES } from "@/lib/languages";

// POST /api/language/switch
// Body : { languageId: string }
//
// Persiste la langue active du compte dans user_metadata.activeLanguage.
// Utilisé par le hook useActiveLanguage + LanguageChooser dropdown.
// Le middleware n'utilise pas cette info (pas de gating par langue),
// c'est purement une préférence d'affichage/contexte.

export async function POST(request: Request) {
  const { languageId } = (await request.json()) as { languageId?: string };
  if (!languageId || !LANGUAGES[languageId]) {
    return NextResponse.json({ error: "Invalid languageId" }, { status: 400 });
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

  // Utiliser admin pour merger user_metadata sans casser les autres clés
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: current } = await admin.auth.admin.getUserById(user.id);
  const existing = (current?.user?.user_metadata ?? {}) as Record<string, unknown>;

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...existing,
      activeLanguage: languageId,
    },
  });

  return NextResponse.json({ ok: true, activeLanguage: languageId });
}

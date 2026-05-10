import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const BUCKET = "course-videos";

async function getAuthUser() {
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
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, role: true } });
}

export async function POST(request: NextRequest) {
  const dbUser = await getAuthUser();
  const allowed = ["ADMIN", "TEACHER", "CENTER_MANAGER"];
  if (!dbUser || !allowed.includes(dbUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename } = await request.json();
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename requis" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Create bucket if it doesn't exist
  await supabaseAdmin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 524288000 }); // 500MB limit

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `videos/${Date.now()}-${safeName}`;

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path, publicUrl });
}

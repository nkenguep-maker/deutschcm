import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

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
  return user;
}

// GET /api/notifications — get user notifications
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ notifications: [] });

  const notifications = await prisma.notification.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ notifications });
}

// POST /api/notifications — create/send notification
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, studentId, reason, groupCode, classroomCode } = body;

  const TEMPLATES: Record<string, { title: string; body: (ctx: Record<string, string>) => string }> = {
    "validate-student": {
      title: "✅ Inscription validée !",
      body: (c) => `Votre inscription a été validée. Bienvenue dans la classe ${c.classroomName ?? ""} !`,
    },
    "refuse-student": {
      title: "❌ Inscription refusée",
      body: (c) => `Votre inscription a été refusée. Raison : ${c.reason ?? "Non précisée"}. Vous continuez en mode solo.`,
    },
    "group-invite": {
      title: "👥 Invitation groupe d'étude",
      body: (c) => `Vous avez été invité dans un groupe. Code : ${c.groupCode ?? ""}`,
    },
    "class-code-valid": {
      title: "🏫 Code classe trouvé",
      body: (c) => `Le code ${c.classroomCode ?? ""} est valide ! Votre demande a été envoyée à l'enseignant.`,
    },
  };

  const tpl = TEMPLATES[type];
  if (!tpl || !studentId) return NextResponse.json({ error: "Missing type or studentId" }, { status: 400 });

  const ctx: Record<string, string> = { reason: reason ?? "", groupCode: groupCode ?? "", classroomCode: classroomCode ?? "" };

  await prisma.notification.create({
    data: {
      userId: studentId,
      title: tpl.title,
      body: tpl.body(ctx),
      type,
    },
  });

  // In production: also send email via Resend / Supabase email
  return NextResponse.json({ ok: true });
}

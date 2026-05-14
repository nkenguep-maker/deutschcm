import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { DifficultyLevel } from "@prisma/client";

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

function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "GROUPE-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET /api/group?id=xxx — group info
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const group = await prisma.studentGroup.findUnique({
    where: { id },
    include: {
      creator: { select: { fullName: true, germanLevel: true } },
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, fullName: true, germanLevel: true, xpTotal: true, streakDays: true } } },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json({ group });
}

// POST /api/group — create or join
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { action } = body;

  // ── Create group ──────────────────────────────────────────────────────────
  if (action === "create") {
    const { name, level, payPhone, payMethod } = body;
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    if (!payPhone) return NextResponse.json({ error: "Numéro de paiement requis" }, { status: 400 });

    // In production: verify Mobile Money payment via API
    // For now: mock payment success

    const code = generateGroupCode();
    const group = await prisma.studentGroup.create({
      data: {
        name,
        creatorId: dbUser.id,
        code,
        level: level && Object.values(DifficultyLevel).includes(level) ? level as DifficultyLevel : undefined,
        isPaid: true,
        priceXAF: 1500,
      },
    });

    // Add creator as first member
    await prisma.studentGroupMember.create({
      data: { groupId: group.id, userId: dbUser.id },
    });

    // Update user type
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { studentType: "group_creator" },
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        title: "🎉 Groupe créé !",
        body: `Votre groupe "${name}" a été créé. Code : ${code}. Partagez-le à vos amis !`,
        type: "group_created",
      },
    });

    return NextResponse.json({ ok: true, group, code, payPhone, payMethod });
  }

  // ── Join group ────────────────────────────────────────────────────────────
  if (action === "join") {
    const { code } = body;
    if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

    const group = await prisma.studentGroup.findUnique({
      where: { code: code.toUpperCase() },
      include: { members: { where: { isActive: true } }, creator: { select: { fullName: true } } },
    });

    if (!group || !group.isActive) {
      return NextResponse.json({ error: "Code invalide ou groupe inactif" }, { status: 404 });
    }
    if (group.members.length >= group.maxMembers) {
      return NextResponse.json({ error: "Ce groupe est complet" }, { status: 400 });
    }
    if (group.members.some(m => m.userId === dbUser.id)) {
      return NextResponse.json({ error: "Vous êtes déjà membre de ce groupe" }, { status: 400 });
    }

    await prisma.studentGroupMember.create({ data: { groupId: group.id, userId: dbUser.id } });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: group.creatorId,
        title: "👥 Nouveau membre !",
        body: `${dbUser.fullName} a rejoint votre groupe "${group.name}".`,
        type: "group_member_joined",
      },
    });

    return NextResponse.json({ ok: true, group: { id: group.id, name: group.name, code: group.code, creatorName: group.creator.fullName } });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

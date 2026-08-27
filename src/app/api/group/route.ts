import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import prisma from "@/lib/prisma";
import { DifficultyLevel } from "@prisma/client";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

async function getAuthDbUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "GROUPE-" + Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join("");
}

async function generateUniqueGroupCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateGroupCode();
    const exists = await prisma.studentGroup.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("group_code_generation_exhausted");
}

// GET /api/group?id=xxx       — détails privés pour membre/créateur
// GET /api/group?code=GROUPE- — aperçu minimal pour rejoindre par code
export async function GET(request: NextRequest) {
  const dbUser = await getAuthDbUser();
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  const rawCode = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";

  if (!id && !rawCode) {
    return NextResponse.json({ error: "id or code required" }, { status: 400 });
  }
  if (id && rawCode) {
    return NextResponse.json({ error: "choose id or code" }, { status: 400 });
  }

  if (rawCode) {
    if (!rawCode.startsWith("GROUPE-") || rawCode.length > 32) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    const group = await prisma.studentGroup.findUnique({
      where: { code: rawCode },
      select: {
        id: true,
        name: true,
        code: true,
        level: true,
        maxMembers: true,
        isActive: true,
        creator: { select: { fullName: true } },
        members: { where: { isActive: true }, select: { id: true } },
      },
    });
    if (!group || !group.isActive) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        level: group.level,
        maxMembers: group.maxMembers,
        creator: group.creator,
        members: group.members,
      },
    });
  }

  if (id.length > 128) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const access = await prisma.studentGroup.findFirst({
    where: {
      id,
      isActive: true,
      OR: [
        { creatorId: dbUser.id },
        { members: { some: { userId: dbUser.id, isActive: true } } },
      ],
    },
    select: { id: true },
  });
  if (!access) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const group = await prisma.studentGroup.findUnique({
    where: { id },
    include: {
      creator: { select: { fullName: true, germanLevel: true } },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              germanLevel: true,
              xpTotal: true,
              streakDays: true,
            },
          },
        },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json({ group });
}

// POST /api/group — création bêta gratuite ou join par code partagé.
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUser = await getAuthDbUser();
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;

  // ── Create group · bêta technique, aucun paiement ──────────────────────────
  if (action === "create") {
    const rawName = (body as { name?: unknown }).name;
    const rawLevel = (body as { level?: unknown }).level;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const level = typeof rawLevel === "string" ? rawLevel : null;

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Nom requis (80 caractères max)" }, { status: 400 });
    }

    const code = await generateUniqueGroupCode();
    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.studentGroup.create({
        data: {
          name,
          creatorId: dbUser.id,
          code,
          level: level && Object.values(DifficultyLevel).includes(level as DifficultyLevel)
            ? level as DifficultyLevel
            : undefined,
          // Bêta technique : aucune transaction simulée, aucun droit payant.
          isPaid: false,
          priceXAF: 0,
        },
      });

      await tx.studentGroupMember.create({
        data: { groupId: created.id, userId: dbUser.id },
      });

      // Legacy UI only: garde l'identification créateur, sans donnée paiement.
      await tx.user.update({
        where: { id: dbUser.id },
        data: { studentType: "group_creator" },
      });

      return created;
    });

    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        title: "🎉 Groupe créé !",
        body: `Votre groupe "${name}" a été créé pour la bêta. Code : ${code}.`,
        type: "group_created",
      },
    }).catch((notificationError) => {
      console.error("[group/create] notification failed", notificationError);
    });

    return NextResponse.json({ ok: true, group, code, beta: true }, { status: 201 });
  }

  // ── Join group · le code partagé agit comme invitation ─────────────────────
  if (action === "join") {
    const rawCode = (body as { code?: unknown }).code;
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    if (!code || !code.startsWith("GROUPE-") || code.length > 32) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.studentGroup.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!target) return { ok: false, reason: "not_found" } as const;

      // The shared code can be used concurrently. Serialize every join for the
      // same group so only one request can consume the final available seat.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${target.id}, 0))`;

      const group = await tx.studentGroup.findUnique({
        where: { id: target.id },
        select: {
          id: true,
          name: true,
          code: true,
          creatorId: true,
          maxMembers: true,
          isActive: true,
          creator: { select: { fullName: true } },
        },
      });
      if (!group || !group.isActive) return { ok: false, reason: "not_found" } as const;
      if (group.creatorId === dbUser.id) return { ok: false, reason: "already_member" } as const;

      const existingMembership = await tx.studentGroupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: dbUser.id } },
        select: { isActive: true },
      });
      if (existingMembership?.isActive) return { ok: false, reason: "already_member" } as const;

      const activeCount = await tx.studentGroupMember.count({
        where: { groupId: group.id, isActive: true },
      });
      if (activeCount >= group.maxMembers) return { ok: false, reason: "group_full" } as const;

      await tx.studentGroupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: dbUser.id } },
        create: { groupId: group.id, userId: dbUser.id },
        update: { isActive: true, joinedAt: new Date() },
      });

      return { ok: true, group } as const;
    });

    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Code invalide ou groupe inactif" }, { status: 404 });
      }
      if (result.reason === "group_full") {
        return NextResponse.json(
          { error: "Ce groupe est complet", code: "group_full" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Vous êtes déjà membre de ce groupe" }, { status: 409 });
    }

    const group = result.group;
    await prisma.notification.create({
      data: {
        userId: group.creatorId,
        title: "👥 Nouveau membre !",
        body: `${dbUser.fullName} a rejoint votre groupe "${group.name}".`,
        type: "group_member_joined",
      },
    }).catch((notificationError) => {
      console.error("[group/join] notification failed", notificationError);
    });

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        creatorName: group.creator.fullName,
      },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

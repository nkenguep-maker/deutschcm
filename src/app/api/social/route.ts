import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

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
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

// ── GET: notifications ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "notifications";

  if (action === "notifications") {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  }

  if (action === "pending-requests") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { classrooms: { select: { id: true, name: true } } } });
    if (!teacher) return NextResponse.json({ requests: [] });
    const classroomIds = teacher.classrooms.map(c => c.id);
    const requests = await prisma.classJoinRequest.findMany({
      where: { toClassroomId: { in: classroomIds }, status: "pending" },
      include: { fromUser: { select: { id: true, fullName: true, email: true, germanLevel: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  }

  if (action === "classroom-detail") {
    const classroomId = searchParams.get("classroomId");
    if (!classroomId) return NextResponse.json({ error: "classroomId requis" }, { status: 400 });
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacher: {
          include: { user: { select: { fullName: true, avatarUrl: true, city: true, germanLevel: true } } },
        },
        enrollments: { where: { isActive: true }, select: { userId: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!classroom) return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    return NextResponse.json({ classroom });
  }

  if (action === "lookup-code") {
    const code = (searchParams.get("code") ?? "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });

    if (code.startsWith("TCH-")) {
      const teacher = await prisma.teacher.findUnique({
        where: { code },
        include: {
          user: { select: { fullName: true, avatarUrl: true, city: true } },
          classrooms: {
            where: { isActive: true },
            include: { _count: { select: { enrollments: true } } },
          },
        },
      });
      if (!teacher) return NextResponse.json({ found: false });
      return NextResponse.json({ found: true, type: "teacher", teacher });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { code },
      include: {
        teacher: { include: { user: { select: { fullName: true, avatarUrl: true, city: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!classroom) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, type: "classroom", classroom });
  }

  if (action === "group-detail") {
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json({ error: "groupId requis" }, { status: 400 });
    const group = await prisma.studentGroup.findUnique({
      where: { id: groupId },
      include: {
        creator: { select: { id: true, fullName: true, avatarUrl: true, city: true, germanLevel: true } },
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, fullName: true, avatarUrl: true, germanLevel: true } } },
          take: 20,
        },
        _count: { select: { members: true } },
      },
    });
    if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
    return NextResponse.json({ group });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ── POST: social actions ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body as { action: string };

  // ── Demander à rejoindre une classe ────────────────────────────────────────
  if (action === "request-join-class") {
    const { classroomId, message } = body;
    if (!classroomId) return NextResponse.json({ error: "classroomId requis" }, { status: 400 });

    const existing = await prisma.classJoinRequest.findFirst({
      where: { fromUserId: user.id, toClassroomId: classroomId, status: "pending" },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toClassroomId: classroomId, message: message ?? null },
    });

    // Notify teacher
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: { teacher: { include: { user: true } } },
    });
    if (classroom?.teacher?.user) {
      await prisma.notification.create({
        data: {
          userId: classroom.teacher.user.id,
          title: "Nouvelle demande d'inscription",
          body: `${user.fullName} demande à rejoindre ${classroom.name}.`,
          type: "join_request",
          metadata: { requestId: req.id, classroomId, studentName: user.fullName },
        },
      });
    }
    return NextResponse.json({ success: true, requestId: req.id });
  }

  // ── Demander à rejoindre un groupe ─────────────────────────────────────────
  if (action === "request-join-group") {
    const { groupId, message } = body;
    if (!groupId) return NextResponse.json({ error: "groupId requis" }, { status: 400 });

    const existing = await prisma.classJoinRequest.findFirst({
      where: { fromUserId: user.id, toGroupId: groupId, status: "pending" },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toGroupId: groupId, message: message ?? null },
    });

    // Notify group creator
    const group = await prisma.studentGroup.findUnique({ where: { id: groupId }, include: { creator: true } });
    if (group?.creator) {
      await prisma.notification.create({
        data: {
          userId: group.creator.id,
          title: "Demande pour rejoindre votre groupe",
          body: `${user.fullName} veut rejoindre "${group.name}".`,
          type: "group_join_request",
          metadata: { requestId: req.id, groupId, studentName: user.fullName },
        },
      });
    }
    return NextResponse.json({ success: true, requestId: req.id });
  }

  // ── Inviter un élève dans un groupe ────────────────────────────────────────
  if (action === "invite-to-group") {
    const { toUserId, groupId, groupName, message } = body;
    if (!toUserId) return NextResponse.json({ error: "toUserId requis" }, { status: 400 });

    const invite = await prisma.studyGroupInvite.create({
      data: { fromUserId: user.id, toUserId, groupId: groupId ?? null, groupName: groupName ?? null, message: message ?? null },
    });
    await prisma.notification.create({
      data: {
        userId: toUserId,
        title: "Invitation dans un groupe d'étude",
        body: `${user.fullName} vous invite dans "${groupName ?? "un groupe"}".`,
        type: "group_invite",
        metadata: { inviteId: invite.id, groupId, groupName, fromName: user.fullName },
      },
    });
    return NextResponse.json({ success: true, inviteId: invite.id });
  }

  // ── Répondre à une demande / invitation ────────────────────────────────────
  if (action === "respond") {
    const { requestId, inviteId, accept, classroomId } = body;

    if (requestId) {
      const req = await prisma.classJoinRequest.update({
        where: { id: requestId },
        data: { status: accept ? "accepted" : "refused", respondedAt: new Date(), respondedBy: user.id },
        include: { fromUser: true },
      });

      if (accept && req.toClassroomId) {
        // Add student to classroom
        await prisma.classroomEnrollment.upsert({
          where: { classroomId_userId: { classroomId: req.toClassroomId, userId: req.fromUserId } },
          create: { classroomId: req.toClassroomId, userId: req.fromUserId },
          update: { isActive: true },
        });
        // Connect as classmates
        const classmates = await prisma.classroomEnrollment.findMany({
          where: { classroomId: req.toClassroomId, isActive: true, userId: { not: req.fromUserId } },
          select: { userId: true },
        });
        if (classmates.length > 0) {
          await prisma.userConnection.createMany({
            data: classmates.flatMap(c => [
              { userId: req.fromUserId, connectedId: c.userId, type: "classmate" },
              { userId: c.userId, connectedId: req.fromUserId, type: "classmate" },
            ]),
            skipDuplicates: true,
          });
        }
      }

      const classroom = classroomId ? await prisma.classroom.findUnique({ where: { id: req.toClassroomId ?? "" }, select: { name: true } }) : null;
      await prisma.notification.create({
        data: {
          userId: req.fromUserId,
          title: accept ? "Demande acceptée ✅" : "Demande refusée",
          body: accept
            ? `Votre demande pour rejoindre ${classroom?.name ?? "la classe"} a été acceptée !`
            : `Votre demande pour rejoindre ${classroom?.name ?? "la classe"} a été refusée.`,
          type: accept ? "request_accepted" : "request_refused",
          metadata: { classroomId: req.toClassroomId },
        },
      });
      return NextResponse.json({ success: true });
    }

    if (inviteId) {
      const invite = await prisma.studyGroupInvite.update({
        where: { id: inviteId },
        data: { status: accept ? "accepted" : "refused" },
      });
      if (accept && invite.groupId) {
        await prisma.studentGroupMember.upsert({
          where: { groupId_userId: { groupId: invite.groupId, userId: invite.toUserId } },
          create: { groupId: invite.groupId, userId: invite.toUserId },
          update: { isActive: true },
        });
      }
      await prisma.notification.create({
        data: {
          userId: invite.fromUserId,
          title: accept ? "Invitation acceptée ✅" : "Invitation refusée",
          body: accept
            ? `${user.fullName} a rejoint votre groupe "${invite.groupName ?? ""}".`
            : `${user.fullName} a décliné l'invitation pour "${invite.groupName ?? ""}".`,
          type: accept ? "invite_accepted" : "invite_refused",
          metadata: { groupId: invite.groupId },
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "requestId ou inviteId requis" }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ── PUT: mark notifications as read ──────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids = (body as { ids?: string[] }).ids;

  if (ids && ids.length > 0) {
    await prisma.notification.updateMany({ where: { userId: user.id, id: { in: ids } }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  }
  return NextResponse.json({ success: true });
}

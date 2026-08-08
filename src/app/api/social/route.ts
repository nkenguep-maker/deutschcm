import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  hasReachedGroupInviteQuota,
  hasReachedJoinRequestQuota,
} from "@/lib/social/rateLimit";
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
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

function rateLimited() {
  return NextResponse.json(
    { error: "Too many requests", code: "social_rate_limited" },
    { status: 429, headers: { "Retry-After": "3600" } }
  );
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
  if (!isSameOriginRequest(request)) return forbidden();

  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { action } = body as { action?: string };
  if (!action) return NextResponse.json({ error: "action requis" }, { status: 400 });

  // ── Demander à rejoindre une classe ────────────────────────────────────────
  if (action === "request-join-class") {
    const { classroomId, message } = body as { classroomId?: string; message?: string | null };
    if (!classroomId) return NextResponse.json({ error: "classroomId requis" }, { status: 400 });

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, isActive: true },
      select: {
        id: true,
        name: true,
        teacher: { select: { user: { select: { id: true } } } },
      },
    });
    if (!classroom) return notFound();

    const enrollment = await prisma.classroomEnrollment.findUnique({
      where: { classroomId_userId: { classroomId, userId: user.id } },
      select: { isActive: true },
    });
    if (enrollment?.isActive) {
      return NextResponse.json({ error: "Déjà inscrit à cette classe" }, { status: 409 });
    }

    const existing = await prisma.classJoinRequest.findFirst({
      where: { fromUserId: user.id, toClassroomId: classroomId, status: "pending" },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });
    if (await hasReachedJoinRequestQuota(user.id)) return rateLimited();

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toClassroomId: classroomId, message: message ?? null },
    });

    await prisma.notification.create({
      data: {
        userId: classroom.teacher.user.id,
        title: "Nouvelle demande d'inscription",
        body: `${user.fullName} demande à rejoindre ${classroom.name}.`,
        type: "join_request",
        metadata: { requestId: req.id, classroomId, studentName: user.fullName },
      },
    });
    return NextResponse.json({ success: true, requestId: req.id });
  }

  // ── Demander à rejoindre un groupe ─────────────────────────────────────────
  if (action === "request-join-group") {
    const { groupId, message } = body as { groupId?: string; message?: string | null };
    if (!groupId) return NextResponse.json({ error: "groupId requis" }, { status: 400 });

    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, isActive: true },
      select: { id: true, name: true, creatorId: true, creator: { select: { id: true } } },
    });
    if (!group) return notFound();
    if (group.creatorId === user.id) {
      return NextResponse.json({ error: "Vous possédez déjà ce groupe" }, { status: 409 });
    }

    const membership = await prisma.studentGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      select: { isActive: true },
    });
    if (membership?.isActive) {
      return NextResponse.json({ error: "Déjà membre de ce groupe" }, { status: 409 });
    }

    const existing = await prisma.classJoinRequest.findFirst({
      where: { fromUserId: user.id, toGroupId: groupId, status: "pending" },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });
    if (await hasReachedJoinRequestQuota(user.id)) return rateLimited();

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toGroupId: groupId, message: message ?? null },
    });

    await prisma.notification.create({
      data: {
        userId: group.creator.id,
        title: "Demande pour rejoindre votre groupe",
        body: `${user.fullName} veut rejoindre "${group.name}".`,
        type: "group_join_request",
        metadata: { requestId: req.id, groupId, studentName: user.fullName },
      },
    });
    return NextResponse.json({ success: true, requestId: req.id });
  }

  // ── Inviter un élève dans un groupe ────────────────────────────────────────
  if (action === "invite-to-group") {
    const { toUserId, groupId, groupName, message } = body as {
      toUserId?: string;
      groupId?: string | null;
      groupName?: string | null;
      message?: string | null;
    };
    if (!toUserId) return NextResponse.json({ error: "toUserId requis" }, { status: 400 });
    if (toUserId === user.id) {
      return NextResponse.json({ error: "Impossible de vous inviter vous-même" }, { status: 409 });
    }

    const invitedUser = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
    if (!invitedUser) return notFound();

    let authorizedGroup: { id: string; name: string } | null = null;
    if (groupId) {
      authorizedGroup = await prisma.studentGroup.findFirst({
        where: { id: groupId, creatorId: user.id, isActive: true },
        select: { id: true, name: true },
      });
      if (!authorizedGroup) return forbidden();

      const membership = await prisma.studentGroupMember.findUnique({
        where: { groupId_userId: { groupId: authorizedGroup.id, userId: toUserId } },
        select: { isActive: true },
      });
      if (membership?.isActive) {
        return NextResponse.json({ error: "Cet utilisateur est déjà membre" }, { status: 409 });
      }

      const existingInvite = await prisma.studyGroupInvite.findFirst({
        where: {
          fromUserId: user.id,
          toUserId,
          groupId: authorizedGroup.id,
          status: "pending",
        },
        select: { id: true },
      });
      if (existingInvite) {
        return NextResponse.json({ error: "Invitation déjà envoyée" }, { status: 409 });
      }
    }

    if (await hasReachedGroupInviteQuota(user.id)) return rateLimited();

    const effectiveGroupName = authorizedGroup?.name ?? groupName ?? null;
    const invite = await prisma.studyGroupInvite.create({
      data: {
        fromUserId: user.id,
        toUserId,
        groupId: authorizedGroup?.id ?? null,
        groupName: effectiveGroupName,
        message: message ?? null,
      },
    });
    await prisma.notification.create({
      data: {
        userId: toUserId,
        title: "Invitation dans un groupe d'étude",
        body: `${user.fullName} vous invite dans "${effectiveGroupName ?? "un groupe"}".`,
        type: "group_invite",
        metadata: { inviteId: invite.id, groupId: authorizedGroup?.id ?? null, groupName: effectiveGroupName, fromName: user.fullName },
      },
    });
    return NextResponse.json({ success: true, inviteId: invite.id });
  }

  // ── Répondre à une demande / invitation ────────────────────────────────────
  if (action === "respond") {
    const { requestId, inviteId, accept } = body as {
      requestId?: string | null;
      inviteId?: string | null;
      accept?: boolean;
    };

    if (requestId) {
      const req = await prisma.classJoinRequest.findUnique({
        where: { id: requestId },
        include: { fromUser: true },
      });
      if (!req) return notFound();
      if (req.status !== "pending") return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 });

      let classroom: { id: string; name: string } | null = null;
      let group: { id: string; name: string } | null = null;

      if (req.toClassroomId) {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!teacher) return forbidden();

        classroom = await prisma.classroom.findFirst({
          where: { id: req.toClassroomId, teacherId: teacher.id },
          select: { id: true, name: true },
        });
        if (!classroom) return forbidden();
      } else if (req.toGroupId) {
        group = await prisma.studentGroup.findFirst({
          where: { id: req.toGroupId, creatorId: user.id, isActive: true },
          select: { id: true, name: true },
        });
        if (!group) return forbidden();
      } else {
        return NextResponse.json({ error: "Demande sans destination" }, { status: 400 });
      }

      await prisma.classJoinRequest.update({
        where: { id: requestId },
        data: { status: accept ? "accepted" : "refused", respondedAt: new Date(), respondedBy: user.id },
      });

      if (accept && req.toClassroomId) {
        await prisma.classroomEnrollment.upsert({
          where: { classroomId_userId: { classroomId: req.toClassroomId, userId: req.fromUserId } },
          create: { classroomId: req.toClassroomId, userId: req.fromUserId },
          update: { isActive: true },
        });

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

      if (accept && req.toGroupId) {
        await prisma.studentGroupMember.upsert({
          where: { groupId_userId: { groupId: req.toGroupId, userId: req.fromUserId } },
          create: { groupId: req.toGroupId, userId: req.fromUserId },
          update: { isActive: true },
        });
      }

      const destinationKind = classroom ? "classe" : "groupe";
      const destinationName = classroom?.name ?? group?.name ?? `le ${destinationKind}`;
      await prisma.notification.create({
        data: {
          userId: req.fromUserId,
          title: accept ? "Demande acceptée ✅" : "Demande refusée",
          body: accept
            ? `Votre demande pour rejoindre ${destinationName} a été acceptée !`
            : `Votre demande pour rejoindre ${destinationName} a été refusée.`,
          type: accept ? "request_accepted" : "request_refused",
          metadata: { classroomId: req.toClassroomId, groupId: req.toGroupId },
        },
      });
      return NextResponse.json({ success: true });
    }

    if (inviteId) {
      const invite = await prisma.studyGroupInvite.findUnique({ where: { id: inviteId } });
      if (!invite || invite.toUserId !== user.id) return notFound();
      if (invite.status !== "pending") return NextResponse.json({ error: "Invitation déjà traitée" }, { status: 409 });

      let targetGroup: { id: string; name: string } | null = null;
      if (invite.groupId) {
        targetGroup = await prisma.studentGroup.findFirst({
          where: { id: invite.groupId, isActive: true },
          select: { id: true, name: true },
        });
        if (!targetGroup) return NextResponse.json({ error: "Groupe indisponible" }, { status: 409 });
      }

      await prisma.studyGroupInvite.update({
        where: { id: inviteId },
        data: { status: accept ? "accepted" : "refused" },
      });
      if (accept && targetGroup) {
        await prisma.studentGroupMember.upsert({
          where: { groupId_userId: { groupId: targetGroup.id, userId: user.id } },
          create: { groupId: targetGroup.id, userId: user.id },
          update: { isActive: true },
        });
      }
      await prisma.notification.create({
        data: {
          userId: invite.fromUserId,
          title: accept ? "Invitation acceptée ✅" : "Invitation refusée",
          body: accept
            ? `${user.fullName} a rejoint votre groupe "${targetGroup?.name ?? invite.groupName ?? ""}".`
            : `${user.fullName} a décliné l'invitation pour "${targetGroup?.name ?? invite.groupName ?? ""}".`,
          type: accept ? "invite_accepted" : "invite_refused",
          metadata: { groupId: targetGroup?.id ?? invite.groupId },
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
  if (!isSameOriginRequest(request)) return forbidden();

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
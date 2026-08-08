import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  hasReachedGroupInviteQuota,
  hasReachedJoinRequestQuota,
} from "@/lib/social/rateLimit";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

const MAX_SOCIAL_MESSAGE_CHARS = 500;
const MAX_NOTIFICATION_READ_IDS = 100;

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

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

function rateLimited() {
  return NextResponse.json(
    { error: "Too many requests", code: "social_rate_limited" },
    { status: 429, headers: { "Retry-After": "3600" } },
  );
}

function optionalMessage(value: unknown): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return null;
  if (clean.length > MAX_SOCIAL_MESSAGE_CHARS) return undefined;
  return clean;
}

// ── GET: only current-user notifications + teacher-owned pending requests ─────
export async function GET(request: NextRequest) {
  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = request.nextUrl.searchParams.get("action") ?? "notifications";

  if (action === "notifications") {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  }

  if (action === "pending-requests") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { classrooms: { select: { id: true } } },
    });
    if (!teacher) return NextResponse.json({ requests: [] });

    const classroomIds = teacher.classrooms.map((c) => c.id);
    const requests = await prisma.classJoinRequest.findMany({
      where: { toClassroomId: { in: classroomIds }, status: "pending" },
      include: {
        fromUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            germanLevel: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  }

  // Legacy detail/lookup actions were unused and exposed more profile data
  // than needed. Discovery now uses dedicated scoped classroom/group routes.
  return notFound();
}

// ── POST: social actions ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbidden();

  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (typeof action !== "string") {
    return NextResponse.json({ error: "action requis" }, { status: 400 });
  }

  // ── Demander à rejoindre une classe ────────────────────────────────────────
  if (action === "request-join-class") {
    const input = body as { classroomId?: unknown; message?: unknown };
    if (typeof input.classroomId !== "string" || !input.classroomId) {
      return NextResponse.json({ error: "classroomId requis" }, { status: 400 });
    }
    const message = optionalMessage(input.message);
    if (message === undefined) {
      return NextResponse.json({ error: "message invalide ou trop long" }, { status: 400 });
    }
    const classroomId = input.classroomId;

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
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });
    if (await hasReachedJoinRequestQuota(user.id)) return rateLimited();

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toClassroomId: classroomId, message },
      select: { id: true },
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
    const input = body as { groupId?: unknown; message?: unknown };
    if (typeof input.groupId !== "string" || !input.groupId) {
      return NextResponse.json({ error: "groupId requis" }, { status: 400 });
    }
    const message = optionalMessage(input.message);
    if (message === undefined) {
      return NextResponse.json({ error: "message invalide ou trop long" }, { status: 400 });
    }
    const groupId = input.groupId;

    const group = await prisma.studentGroup.findFirst({
      where: { id: groupId, isActive: true },
      select: {
        id: true,
        name: true,
        creatorId: true,
        creator: { select: { id: true } },
      },
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
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });
    if (await hasReachedJoinRequestQuota(user.id)) return rateLimited();

    const req = await prisma.classJoinRequest.create({
      data: { fromUserId: user.id, toGroupId: groupId, message },
      select: { id: true },
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

  // ── Inviter un élève dans un groupe possédé par l'acteur ───────────────────
  if (action === "invite-to-group") {
    const input = body as { toUserId?: unknown; groupId?: unknown; message?: unknown };
    if (typeof input.toUserId !== "string" || !input.toUserId) {
      return NextResponse.json({ error: "toUserId requis" }, { status: 400 });
    }
    if (typeof input.groupId !== "string" || !input.groupId) {
      return NextResponse.json({ error: "groupId requis" }, { status: 400 });
    }
    if (input.toUserId === user.id) {
      return NextResponse.json({ error: "Impossible de vous inviter vous-même" }, { status: 409 });
    }
    const message = optionalMessage(input.message);
    if (message === undefined) {
      return NextResponse.json({ error: "message invalide ou trop long" }, { status: 400 });
    }

    const invitedUser = await prisma.user.findUnique({
      where: { id: input.toUserId },
      select: { id: true },
    });
    if (!invitedUser) return notFound();

    const authorizedGroup = await prisma.studentGroup.findFirst({
      where: { id: input.groupId, creatorId: user.id, isActive: true },
      select: { id: true, name: true },
    });
    if (!authorizedGroup) return forbidden();

    const membership = await prisma.studentGroupMember.findUnique({
      where: {
        groupId_userId: { groupId: authorizedGroup.id, userId: input.toUserId },
      },
      select: { isActive: true },
    });
    if (membership?.isActive) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre" }, { status: 409 });
    }

    const existingInvite = await prisma.studyGroupInvite.findFirst({
      where: {
        fromUserId: user.id,
        toUserId: input.toUserId,
        groupId: authorizedGroup.id,
        status: "pending",
      },
      select: { id: true },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "Invitation déjà envoyée" }, { status: 409 });
    }
    if (await hasReachedGroupInviteQuota(user.id)) return rateLimited();

    const invite = await prisma.studyGroupInvite.create({
      data: {
        fromUserId: user.id,
        toUserId: input.toUserId,
        groupId: authorizedGroup.id,
        groupName: authorizedGroup.name,
        message,
      },
      select: { id: true },
    });
    await prisma.notification.create({
      data: {
        userId: input.toUserId,
        title: "Invitation dans un groupe d'étude",
        body: `${user.fullName} vous invite dans "${authorizedGroup.name}".`,
        type: "group_invite",
        metadata: {
          inviteId: invite.id,
          groupId: authorizedGroup.id,
          groupName: authorizedGroup.name,
          fromName: user.fullName,
        },
      },
    });
    return NextResponse.json({ success: true, inviteId: invite.id });
  }

  // ── Répondre à une demande / invitation ────────────────────────────────────
  if (action === "respond") {
    const input = body as { requestId?: unknown; inviteId?: unknown; accept?: unknown };
    if (typeof input.accept !== "boolean") {
      return NextResponse.json({ error: "accept booléen requis" }, { status: 400 });
    }
    const requestId = typeof input.requestId === "string" ? input.requestId : null;
    const inviteId = typeof input.inviteId === "string" ? input.inviteId : null;
    if ((requestId ? 1 : 0) + (inviteId ? 1 : 0) !== 1) {
      return NextResponse.json({ error: "requestId ou inviteId requis" }, { status: 400 });
    }

    if (requestId) {
      const req = await prisma.classJoinRequest.findUnique({
        where: { id: requestId },
        include: { fromUser: true },
      });
      if (!req) return notFound();
      if (req.status !== "pending") {
        return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 });
      }

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
        data: {
          status: input.accept ? "accepted" : "refused",
          respondedAt: new Date(),
          respondedBy: user.id,
        },
      });

      if (input.accept && req.toClassroomId) {
        await prisma.classroomEnrollment.upsert({
          where: {
            classroomId_userId: {
              classroomId: req.toClassroomId,
              userId: req.fromUserId,
            },
          },
          create: { classroomId: req.toClassroomId, userId: req.fromUserId },
          update: { isActive: true },
        });

        const classmates = await prisma.classroomEnrollment.findMany({
          where: {
            classroomId: req.toClassroomId,
            isActive: true,
            userId: { not: req.fromUserId },
          },
          select: { userId: true },
        });
        if (classmates.length > 0) {
          await prisma.userConnection.createMany({
            data: classmates.flatMap((c) => [
              { userId: req.fromUserId, connectedId: c.userId, type: "classmate" },
              { userId: c.userId, connectedId: req.fromUserId, type: "classmate" },
            ]),
            skipDuplicates: true,
          });
        }
      }

      if (input.accept && req.toGroupId) {
        await prisma.studentGroupMember.upsert({
          where: {
            groupId_userId: { groupId: req.toGroupId, userId: req.fromUserId },
          },
          create: { groupId: req.toGroupId, userId: req.fromUserId },
          update: { isActive: true },
        });
      }

      const destinationKind = classroom ? "classe" : "groupe";
      const destinationName = classroom?.name ?? group?.name ?? `le ${destinationKind}`;
      await prisma.notification.create({
        data: {
          userId: req.fromUserId,
          title: input.accept ? "Demande acceptée ✅" : "Demande refusée",
          body: input.accept
            ? `Votre demande pour rejoindre ${destinationName} a été acceptée !`
            : `Votre demande pour rejoindre ${destinationName} a été refusée.`,
          type: input.accept ? "request_accepted" : "request_refused",
          metadata: { classroomId: req.toClassroomId, groupId: req.toGroupId },
        },
      });
      return NextResponse.json({ success: true });
    }

    const invite = await prisma.studyGroupInvite.findUnique({ where: { id: inviteId! } });
    if (!invite || invite.toUserId !== user.id) return notFound();
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invitation déjà traitée" }, { status: 409 });
    }
    if (!invite.groupId) {
      return NextResponse.json({ error: "Invitation sans groupe" }, { status: 409 });
    }

    const targetGroup = await prisma.studentGroup.findFirst({
      where: { id: invite.groupId, isActive: true },
      select: { id: true, name: true },
    });
    if (!targetGroup) {
      return NextResponse.json({ error: "Groupe indisponible" }, { status: 409 });
    }

    await prisma.studyGroupInvite.update({
      where: { id: inviteId! },
      data: { status: input.accept ? "accepted" : "refused" },
    });
    if (input.accept) {
      await prisma.studentGroupMember.upsert({
        where: {
          groupId_userId: { groupId: targetGroup.id, userId: user.id },
        },
        create: { groupId: targetGroup.id, userId: user.id },
        update: { isActive: true },
      });
    }
    await prisma.notification.create({
      data: {
        userId: invite.fromUserId,
        title: input.accept ? "Invitation acceptée ✅" : "Invitation refusée",
        body: input.accept
          ? `${user.fullName} a rejoint votre groupe "${targetGroup.name}".`
          : `${user.fullName} a décliné l'invitation pour "${targetGroup.name}".`,
        type: input.accept ? "invite_accepted" : "invite_refused",
        metadata: { groupId: targetGroup.id },
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ── PUT: mark notifications as read ──────────────────────────────────────────
export async function PUT(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbidden();

  const user = await getAuthDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const rawIds = (body as { ids?: unknown }).ids;
  if (rawIds !== undefined) {
    if (!Array.isArray(rawIds) || rawIds.length > MAX_NOTIFICATION_READ_IDS) {
      return NextResponse.json({ error: "ids invalides" }, { status: 400 });
    }
    if (!rawIds.every((id) => typeof id === "string" && id.length > 0 && id.length <= 128)) {
      return NextResponse.json({ error: "ids invalides" }, { status: 400 });
    }
    const ids = [...new Set(rawIds as string[])];
    if (ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId: user.id, id: { in: ids } },
        data: { isRead: true },
      });
    }
    return NextResponse.json({ success: true });
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ success: true });
}

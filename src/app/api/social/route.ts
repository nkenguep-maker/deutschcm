import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  hasReachedGroupInviteQuota,
  hasReachedJoinRequestQuota,
} from "@/lib/social/rateLimit";
import {
  respondToGroupInvite,
  respondToJoinRequest,
} from "@/lib/social/respondJoinRequest";
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
      const decision = await respondToJoinRequest({
        requestId,
        responderUserId: user.id,
        accept: input.accept,
      });

      if (!decision.ok) {
        if (decision.reason === "not_found") return notFound();
        if (decision.reason === "forbidden") return forbidden();
        if (decision.reason === "classroom_full") {
          return NextResponse.json(
            { error: "Cette classe est complète", code: "classroom_full" },
            { status: 409 },
          );
        }
        if (decision.reason === "classroom_inactive") {
          return NextResponse.json(
            { error: "Cette classe est inactive", code: "classroom_inactive" },
            { status: 409 },
          );
        }
        if (decision.reason === "invalid_destination") {
          return NextResponse.json({ error: "Demande sans destination" }, { status: 400 });
        }
        return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 });
      }

      if (decision.accepted && decision.kind === "classroom") {
        try {
          const classmates = await prisma.classroomEnrollment.findMany({
            where: {
              classroomId: decision.destinationId,
              isActive: true,
              userId: { not: decision.fromUserId },
            },
            select: { userId: true },
          });
          if (classmates.length > 0) {
            await prisma.userConnection.createMany({
              data: classmates.flatMap((c) => [
                { userId: decision.fromUserId, connectedId: c.userId, type: "classmate" },
                { userId: c.userId, connectedId: decision.fromUserId, type: "classmate" },
              ]),
              skipDuplicates: true,
            });
          }
        } catch (connectionError) {
          console.error("[social/respond] classmate connection sync failed", connectionError);
        }
      }

      await prisma.notification.create({
        data: {
          userId: decision.fromUserId,
          title: decision.accepted ? "Demande acceptée ✅" : "Demande refusée",
          body: decision.accepted
            ? `Votre demande pour rejoindre ${decision.destinationName} a été acceptée !`
            : `Votre demande pour rejoindre ${decision.destinationName} a été refusée.`,
          type: decision.accepted ? "request_accepted" : "request_refused",
          metadata: decision.kind === "classroom"
            ? { classroomId: decision.destinationId, groupId: null }
            : { classroomId: null, groupId: decision.destinationId },
        },
      }).catch((notificationError) => {
        console.error("[social/respond] decision notification failed", notificationError);
      });

      return NextResponse.json({ success: true });
    }

    const decision = await respondToGroupInvite({
      inviteId: inviteId!,
      responderUserId: user.id,
      accept: input.accept,
    });

    if (!decision.ok) {
      if (decision.reason === "not_found") return notFound();
      if (decision.reason === "group_unavailable") {
        return NextResponse.json({ error: "Groupe indisponible" }, { status: 409 });
      }
      return NextResponse.json({ error: "Invitation déjà traitée" }, { status: 409 });
    }

    await prisma.notification.create({
      data: {
        userId: decision.inviterUserId,
        title: decision.accepted ? "Invitation acceptée ✅" : "Invitation refusée",
        body: decision.accepted
          ? `${user.fullName} a rejoint votre groupe "${decision.groupName}".`
          : `${user.fullName} a décliné l'invitation pour "${decision.groupName}".`,
        type: decision.accepted ? "invite_accepted" : "invite_refused",
        metadata: { groupId: decision.groupId },
      },
    }).catch((notificationError) => {
      console.error("[social/respond] invite notification failed", notificationError);
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

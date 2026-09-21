import "server-only";

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export type JoinRequestDecision =
  | {
      ok: true;
      accepted: boolean;
      kind: "classroom" | "group";
      destinationId: string;
      destinationName: string;
      fromUserId: string;
    }
  | {
      ok: false;
      reason:
        | "not_found"
        | "not_pending"
        | "forbidden"
        | "invalid_destination"
        | "classroom_full"
        | "classroom_inactive"
        | "group_full";
    };

export type GroupInviteDecision =
  | {
      ok: true;
      accepted: boolean;
      groupId: string;
      groupName: string;
      inviterUserId: string;
    }
  | {
      ok: false;
      reason: "not_found" | "not_pending" | "group_unavailable" | "group_full";
    };

async function groupHasCapacity(
  tx: Prisma.TransactionClient,
  groupId: string,
  userId: string,
): Promise<
  | { ok: true; group: { id: string; name: string; maxMembers: number } }
  | { ok: false; reason: "group_unavailable" | "group_full" }
> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${groupId}, 0))`;

  const group = await tx.studentGroup.findFirst({
    where: { id: groupId, isActive: true },
    select: { id: true, name: true, maxMembers: true },
  });
  if (!group) return { ok: false, reason: "group_unavailable" };

  const existingMembership = await tx.studentGroupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
    select: { isActive: true },
  });
  if (!existingMembership?.isActive) {
    const activeCount = await tx.studentGroupMember.count({
      where: { groupId: group.id, isActive: true },
    });
    if (activeCount >= group.maxMembers) {
      return { ok: false, reason: "group_full" };
    }
  }

  return { ok: true, group };
}

export async function respondToJoinRequest(params: {
  requestId: string;
  responderUserId: string;
  accept: boolean;
}): Promise<JoinRequestDecision> {
  return prisma.$transaction(async (tx) => {
    const req = await tx.classJoinRequest.findUnique({
      where: { id: params.requestId },
      select: {
        id: true,
        status: true,
        fromUserId: true,
        toClassroomId: true,
        toGroupId: true,
      },
    });
    if (!req) return { ok: false, reason: "not_found" } as const;
    if (req.status !== "pending") return { ok: false, reason: "not_pending" } as const;

    if (req.toClassroomId) {
      const teacher = await tx.teacher.findUnique({
        where: { userId: params.responderUserId },
        select: { id: true },
      });
      if (!teacher) return { ok: false, reason: "forbidden" } as const;

      const classroom = await tx.classroom.findFirst({
        where: { id: req.toClassroomId, teacherId: teacher.id },
        select: { id: true, name: true, maxStudents: true, isActive: true },
      });
      if (!classroom) return { ok: false, reason: "forbidden" } as const;

      if (params.accept) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${classroom.id}, 0))`;

        const lockedClassroom = await tx.classroom.findFirst({
          where: { id: classroom.id, teacherId: teacher.id },
          select: { id: true, name: true, maxStudents: true, isActive: true },
        });
        if (!lockedClassroom) return { ok: false, reason: "forbidden" } as const;
        if (!lockedClassroom.isActive) return { ok: false, reason: "classroom_inactive" } as const;

        const existingEnrollment = await tx.classroomEnrollment.findUnique({
          where: {
            classroomId_userId: {
              classroomId: lockedClassroom.id,
              userId: req.fromUserId,
            },
          },
          select: { isActive: true },
        });

        if (!existingEnrollment?.isActive) {
          const activeCount = await tx.classroomEnrollment.count({
            where: { classroomId: lockedClassroom.id, isActive: true },
          });
          if (activeCount >= lockedClassroom.maxStudents) {
            return { ok: false, reason: "classroom_full" } as const;
          }
        }

        const decided = await tx.classJoinRequest.updateMany({
          where: { id: req.id, status: "pending" },
          data: {
            status: "accepted",
            respondedAt: new Date(),
            respondedBy: params.responderUserId,
          },
        });
        if (decided.count !== 1) return { ok: false, reason: "not_pending" } as const;

        await tx.classroomEnrollment.upsert({
          where: {
            classroomId_userId: {
              classroomId: lockedClassroom.id,
              userId: req.fromUserId,
            },
          },
          create: { classroomId: lockedClassroom.id, userId: req.fromUserId },
          update: { isActive: true },
        });

        return {
          ok: true,
          accepted: true,
          kind: "classroom",
          destinationId: lockedClassroom.id,
          destinationName: lockedClassroom.name,
          fromUserId: req.fromUserId,
        } as const;
      }

      const decided = await tx.classJoinRequest.updateMany({
        where: { id: req.id, status: "pending" },
        data: {
          status: "refused",
          respondedAt: new Date(),
          respondedBy: params.responderUserId,
        },
      });
      if (decided.count !== 1) return { ok: false, reason: "not_pending" } as const;

      return {
        ok: true,
        accepted: false,
        kind: "classroom",
        destinationId: classroom.id,
        destinationName: classroom.name,
        fromUserId: req.fromUserId,
      } as const;
    }

    if (req.toGroupId) {
      const ownedGroup = await tx.studentGroup.findFirst({
        where: { id: req.toGroupId, creatorId: params.responderUserId, isActive: true },
        select: { id: true, name: true },
      });
      if (!ownedGroup) return { ok: false, reason: "forbidden" } as const;

      let group = ownedGroup;
      if (params.accept) {
        const capacity = await groupHasCapacity(tx, ownedGroup.id, req.fromUserId);
        if (!capacity.ok) {
          return {
            ok: false,
            reason: capacity.reason === "group_full" ? "group_full" : "forbidden",
          } as const;
        }
        group = capacity.group;
      }

      const decided = await tx.classJoinRequest.updateMany({
        where: { id: req.id, status: "pending" },
        data: {
          status: params.accept ? "accepted" : "refused",
          respondedAt: new Date(),
          respondedBy: params.responderUserId,
        },
      });
      if (decided.count !== 1) return { ok: false, reason: "not_pending" } as const;

      if (params.accept) {
        await tx.studentGroupMember.upsert({
          where: {
            groupId_userId: { groupId: group.id, userId: req.fromUserId },
          },
          create: { groupId: group.id, userId: req.fromUserId },
          update: { isActive: true, joinedAt: new Date() },
        });
      }

      return {
        ok: true,
        accepted: params.accept,
        kind: "group",
        destinationId: group.id,
        destinationName: group.name,
        fromUserId: req.fromUserId,
      } as const;
    }

    return { ok: false, reason: "invalid_destination" } as const;
  });
}

export async function respondToGroupInvite(params: {
  inviteId: string;
  responderUserId: string;
  accept: boolean;
}): Promise<GroupInviteDecision> {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.studyGroupInvite.findFirst({
      where: { id: params.inviteId, toUserId: params.responderUserId },
      select: {
        id: true,
        status: true,
        fromUserId: true,
        groupId: true,
      },
    });
    if (!invite) return { ok: false, reason: "not_found" } as const;
    if (invite.status !== "pending") return { ok: false, reason: "not_pending" } as const;
    if (!invite.groupId) return { ok: false, reason: "group_unavailable" } as const;

    const group = await tx.studentGroup.findFirst({
      where: { id: invite.groupId, isActive: true },
      select: { id: true, name: true },
    });
    if (!group) return { ok: false, reason: "group_unavailable" } as const;

    let lockedGroup = group;
    if (params.accept) {
      const capacity = await groupHasCapacity(tx, group.id, params.responderUserId);
      if (!capacity.ok) return { ok: false, reason: capacity.reason } as const;
      lockedGroup = capacity.group;
    }

    const decided = await tx.studyGroupInvite.updateMany({
      where: { id: invite.id, status: "pending", toUserId: params.responderUserId },
      data: { status: params.accept ? "accepted" : "refused" },
    });
    if (decided.count !== 1) return { ok: false, reason: "not_pending" } as const;

    if (params.accept) {
      await tx.studentGroupMember.upsert({
        where: {
          groupId_userId: { groupId: lockedGroup.id, userId: params.responderUserId },
        },
        create: { groupId: lockedGroup.id, userId: params.responderUserId },
        update: { isActive: true, joinedAt: new Date() },
      });
    }

    return {
      ok: true,
      accepted: params.accept,
      groupId: lockedGroup.id,
      groupName: lockedGroup.name,
      inviterUserId: invite.fromUserId,
    } as const;
  });
}

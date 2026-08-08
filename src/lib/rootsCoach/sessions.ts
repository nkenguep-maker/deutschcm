import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type RootsCoachSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface RootsCoachSessionRow {
  id: string;
  coachUserId: string;
  circleId: string;
  childProfileId: string;
  childName: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string | null;
  status: RootsCoachSessionStatus;
  note: string | null;
  updatedAt: string;
}

type DbSessionRow = {
  id: string;
  coachUserId: string;
  circleId: string;
  childProfileId: string;
  childName: string;
  scheduledAt: Date;
  durationMinutes: number;
  topic: string | null;
  status: RootsCoachSessionStatus;
  note: string | null;
  updatedAt: Date;
};

function mapSession(row: DbSessionRow): RootsCoachSessionRow {
  return {
    ...row,
    scheduledAt: row.scheduledAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRootsCoachSessions(coachUserId: string): Promise<RootsCoachSessionRow[]> {
  const rows = await prisma.$queryRaw<DbSessionRow[]>`
    SELECT s."id", s."coachUserId", s."circleId", s."childProfileId",
           c."prenom" AS "childName", s."scheduledAt", s."durationMinutes",
           s."topic", s."status", n."body" AS "note", s."updatedAt"
    FROM "roots_coach_sessions" s
    JOIN "child_profiles" c ON c."id" = s."childProfileId"
    LEFT JOIN "roots_coach_session_notes" n ON n."sessionId" = s."id"
    WHERE s."coachUserId" = ${coachUserId}
    ORDER BY s."scheduledAt" ASC
    LIMIT 100
  `;
  return rows.map(mapSession);
}

export async function listFamilyRootsSessions(parentUserId: string): Promise<RootsCoachSessionRow[]> {
  const rows = await prisma.$queryRaw<DbSessionRow[]>`
    SELECT s."id", s."coachUserId", s."circleId", s."childProfileId",
           c."prenom" AS "childName", s."scheduledAt", s."durationMinutes",
           s."topic", s."status", NULL::text AS "note", s."updatedAt"
    FROM "roots_coach_sessions" s
    JOIN "child_profiles" c ON c."id" = s."childProfileId"
    WHERE c."parentUserId" = ${parentUserId}
    ORDER BY s."scheduledAt" ASC
    LIMIT 100
  `;
  return rows.map(mapSession);
}

export async function createRootsCoachSession(input: {
  coachUserId: string;
  circleId: string;
  childProfileId: string;
  scheduledAt: Date;
  durationMinutes: number;
  topic: string | null;
}): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "roots_coach_sessions"
      ("id", "coachUserId", "circleId", "childProfileId", "scheduledAt", "durationMinutes", "topic")
    VALUES
      (${id}, ${input.coachUserId}, ${input.circleId}, ${input.childProfileId}, ${input.scheduledAt}, ${input.durationMinutes}, ${input.topic})
  `;
  return id;
}

export async function cancelRootsCoachSession(coachUserId: string, sessionId: string): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "roots_coach_sessions"
    SET "status" = 'CANCELLED', "cancelledAt" = NOW(), "updatedAt" = NOW()
    WHERE "id" = ${sessionId} AND "coachUserId" = ${coachUserId} AND "status" = 'SCHEDULED'
  `;
  return changed === 1;
}

export async function upsertRootsCoachSessionNote(input: {
  coachUserId: string;
  sessionId: string;
  body: string;
}): Promise<boolean> {
  const owns = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "roots_coach_sessions"
    WHERE "id" = ${input.sessionId} AND "coachUserId" = ${input.coachUserId}
    LIMIT 1
  `;
  if (owns.length !== 1) return false;
  const noteId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "roots_coach_session_notes" ("id", "sessionId", "coachUserId", "body")
    VALUES (${noteId}, ${input.sessionId}, ${input.coachUserId}, ${input.body})
    ON CONFLICT ("sessionId") DO UPDATE
      SET "body" = EXCLUDED."body", "updatedAt" = NOW()
    WHERE "roots_coach_session_notes"."coachUserId" = ${input.coachUserId}
  `;
  return true;
}

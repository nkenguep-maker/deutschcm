import { NextRequest, NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor, assertRootsCoachChildAccess } from "@/lib/permissions/rootsCoach";
import { mapErrorToResponse } from "@/lib/api/circleErrors";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import {
  cancelRootsCoachSession,
  createRootsCoachSession,
  listRootsCoachSessions,
} from "@/lib/rootsCoach/sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isRootsCoachWorkspaceActive()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const actor = await resolveRootsCoachActor();
    return NextResponse.json({ items: await listRootsCoachSessions(actor.userId) });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  if (!isRootsCoachWorkspaceActive()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const actor = await resolveRootsCoachActor();
    const body = (await req.json().catch(() => ({}))) as {
      childProfileId?: unknown;
      scheduledAt?: unknown;
      durationMinutes?: unknown;
      topic?: unknown;
    };
    if (typeof body.childProfileId !== "string" || body.childProfileId.length < 4) {
      return NextResponse.json({ error: "child_required" }, { status: 400 });
    }
    if (typeof body.scheduledAt !== "string") return NextResponse.json({ error: "scheduled_at_required" }, { status: 400 });
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: "scheduled_at_invalid" }, { status: 400 });
    const now = Date.now();
    if (scheduledAt.getTime() < now - 5 * 60_000 || scheduledAt.getTime() > now + 180 * 24 * 60 * 60_000) {
      return NextResponse.json({ error: "scheduled_at_out_of_range" }, { status: 400 });
    }
    const durationMinutes = Number(body.durationMinutes ?? 45);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      return NextResponse.json({ error: "duration_invalid" }, { status: 400 });
    }
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) || null : null;
    const scope = await assertRootsCoachChildAccess(actor, body.childProfileId);
    const id = await createRootsCoachSession({
      coachUserId: actor.userId,
      circleId: scope.circleId,
      childProfileId: body.childProfileId,
      scheduledAt,
      durationMinutes,
      topic,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  if (!isRootsCoachWorkspaceActive()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const actor = await resolveRootsCoachActor();
    const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown };
    if (typeof body.sessionId !== "string" || body.sessionId.length < 4) return NextResponse.json({ error: "session_required" }, { status: 400 });
    const changed = await cancelRootsCoachSession(actor.userId, body.sessionId);
    if (!changed) return NextResponse.json({ error: "session_not_found_or_not_scheduled" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}

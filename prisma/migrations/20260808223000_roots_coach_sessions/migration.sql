-- YEMA · Coach Racines sessions + private coach notes.
-- Server-owned tables: Supabase Data API stays deny-by-default.

CREATE TABLE IF NOT EXISTS "roots_coach_sessions" (
  "id" TEXT PRIMARY KEY,
  "coachUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "circleId" TEXT NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
  "childProfileId" TEXT NOT NULL REFERENCES "child_profiles"("id") ON DELETE CASCADE,
  "scheduledAt" TIMESTAMPTZ NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 45,
  "topic" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "cancelledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "roots_coach_sessions_duration_check" CHECK ("durationMinutes" BETWEEN 15 AND 180),
  CONSTRAINT "roots_coach_sessions_status_check" CHECK ("status" IN ('SCHEDULED','COMPLETED','CANCELLED')),
  CONSTRAINT "roots_coach_sessions_topic_check" CHECK ("topic" IS NULL OR char_length("topic") <= 120)
);

CREATE INDEX IF NOT EXISTS "roots_coach_sessions_coach_time_idx"
  ON "roots_coach_sessions" ("coachUserId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "roots_coach_sessions_child_time_idx"
  ON "roots_coach_sessions" ("childProfileId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "roots_coach_sessions_circle_time_idx"
  ON "roots_coach_sessions" ("circleId", "scheduledAt");

CREATE TABLE IF NOT EXISTS "roots_coach_session_notes" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL UNIQUE REFERENCES "roots_coach_sessions"("id") ON DELETE CASCADE,
  "coachUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "roots_coach_session_notes_body_check" CHECK (char_length("body") BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS "roots_coach_session_notes_coach_idx"
  ON "roots_coach_session_notes" ("coachUserId", "updatedAt");

ALTER TABLE "roots_coach_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roots_coach_session_notes" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "roots_coach_sessions" FROM anon, authenticated;
REVOKE ALL ON TABLE "roots_coach_session_notes" FROM anon, authenticated;

-- YEMA A1 refonte v2
-- 1) Adds server-side memory state for spaced recall and remediation.
-- 2) Archives the superseded 6-unit A1 runtime in P-1/any future target.
-- Never FORCE RLS: trusted Prisma server role must keep working.

CREATE TABLE IF NOT EXISTS public.learning_memory_states (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  "courseId" text NOT NULL,
  "itemKind" text NOT NULL,
  "itemId" text NOT NULL,
  "intervalIndex" integer NOT NULL DEFAULT 0,
  "nextDueAt" timestamp without time zone,
  "failureStreak" integer NOT NULL DEFAULT 0,
  "lastResult" boolean,
  "lastSeenAt" timestamp without time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT learning_memory_states_user_fkey
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS learning_memory_states_user_course_kind_item_key
  ON public.learning_memory_states ("userId", "courseId", "itemKind", "itemId");

CREATE INDEX IF NOT EXISTS learning_memory_states_user_course_due_idx
  ON public.learning_memory_states ("userId", "courseId", "nextDueAt");

ALTER TABLE public.learning_memory_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.learning_memory_states FROM anon, authenticated;

UPDATE public.courses
SET "isPublished" = false,
    tags = array(
      SELECT DISTINCT x
      FROM unnest(coalesce(tags, ARRAY[]::text[]) || ARRAY['LEGACY_A1_2026_08_04']) AS x
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 'monde-adulte-de-a1';

UPDATE public.modules
SET "isPublished" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "courseId" = 'monde-adulte-de-a1';

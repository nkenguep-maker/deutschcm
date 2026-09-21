-- P4.7 · social pending uniqueness
--
-- App-level duplicate checks are not sufficient under concurrent requests.
-- These partial unique indexes make the one-pending-request invariant a
-- database guarantee while still allowing historical accepted/refused rows.

CREATE UNIQUE INDEX IF NOT EXISTS class_join_requests_pending_class_unique
  ON public.class_join_requests ("fromUserId", "toClassroomId")
  WHERE status = 'pending' AND "toClassroomId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS class_join_requests_pending_group_unique
  ON public.class_join_requests ("fromUserId", "toGroupId")
  WHERE status = 'pending' AND "toGroupId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS study_group_invites_pending_unique
  ON public.study_group_invites ("fromUserId", "toUserId", "groupId")
  WHERE status = 'pending' AND "groupId" IS NOT NULL;

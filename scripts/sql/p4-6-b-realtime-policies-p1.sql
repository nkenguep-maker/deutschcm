-- ============================================================
-- P4.6-B · policies Realtime Messagerie · à coller dans le
-- SQL Editor Supabase du projet P-1 (kzzagbojjkivdzzcrmxn).
-- ============================================================
--
-- CE FICHIER EST DIRECTEMENT COLLABLE dans le SQL Editor.
-- Aucun ALTER TABLE, aucun ALTER OWNER, aucun SET ROLE :
-- Supabase active RLS par défaut sur realtime.messages et
-- interdit ces commandes au rôle postgres du pooler
-- (owner = supabase_realtime_admin · 42501 permission denied).
--
-- Idempotent · les DROP POLICY IF EXISTS permettent le relaunch
-- sans erreur.
--
-- Résultat attendu · deux lignes visibles dans
-- pg_policies WHERE tablename='messages' AND policyname LIKE 'messaging_%'
--   messaging_realtime_receive_authorized               (SELECT)
--   messaging_realtime_presence_send_authorized         (INSERT)
--
-- ============================================================
-- 1. Fonctions helper (schema public · SECURITY DEFINER · STABLE)
-- ============================================================

CREATE OR REPLACE FUNCTION public.messaging_can_access_conversation(
  _supabase_uid uuid,
  _conversation_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM messaging_conversation_participants mcp
    INNER JOIN users u ON u.id = mcp."userId"
    WHERE u."supabaseId" = _supabase_uid::text
      AND mcp."conversationId" = _conversation_id
      AND mcp."leftAt" IS NULL
  );
$$;

COMMENT ON FUNCTION public.messaging_can_access_conversation IS
  'P4.6-B · true si auth.uid() est User + participant actif de la conversation.';

CREATE OR REPLACE FUNCTION public.messaging_is_inbox_owner(
  _supabase_uid uuid,
  _user_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    WHERE u."supabaseId" = _supabase_uid::text
      AND u.id = _user_id
  );
$$;

COMMENT ON FUNCTION public.messaging_is_inbox_owner IS
  'P4.6-B · true si auth.uid() est User propriétaire du canal msg:inbox:user:{userId}.';

CREATE OR REPLACE FUNCTION public.messaging_topic_kind(_topic text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _topic LIKE 'msg:conv:%' THEN 'conv'
    WHEN _topic LIKE 'msg:inbox:user:%' THEN 'inbox_user'
    WHEN _topic LIKE 'msg:inbox:child:%' THEN 'inbox_child'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.messaging_topic_id(_topic text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _topic LIKE 'msg:conv:%' THEN substring(_topic FROM 10)
    WHEN _topic LIKE 'msg:inbox:user:%' THEN substring(_topic FROM 16)
    WHEN _topic LIKE 'msg:inbox:child:%' THEN substring(_topic FROM 17)
    ELSE NULL
  END;
$$;

-- ============================================================
-- 2. Nettoyage idempotent (anciens noms P4.6-B.2 v1 + retry safe)
-- ============================================================

DROP POLICY IF EXISTS "messaging_realtime_subscribe"                ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_send_deny_client"         ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_receive_authorized"       ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized" ON realtime.messages;

-- ============================================================
-- 3. Policy SELECT (subscribe) · authenticated uniquement
-- ============================================================
--   msg:conv:<id>        → auth.uid() participant actif de la conversation
--   msg:inbox:user:<id>  → auth.uid() owner du userId
--   msg:inbox:child:<id> → refus total (child sans session Supabase)
--   autres topics        → laisser passer aux policies non-messaging

CREATE POLICY "messaging_realtime_receive_authorized" ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    CASE public.messaging_topic_kind(realtime.topic())
      WHEN 'conv' THEN
        public.messaging_can_access_conversation(
          auth.uid(),
          public.messaging_topic_id(realtime.topic())
        )
      WHEN 'inbox_user' THEN
        public.messaging_is_inbox_owner(
          auth.uid(),
          public.messaging_topic_id(realtime.topic())
        )
      WHEN 'inbox_child' THEN
        false
      ELSE
        realtime.topic() NOT LIKE 'msg:%'
    END
  );

-- ============================================================
-- 4. Policy INSERT extension='presence' sur msg:conv:<id> uniquement
-- ============================================================
-- Aucune policy INSERT permissive pour extension='broadcast' n'est créée.
-- Les broadcasts message_created / read_state_updated / conversation_updated
-- sont émis EXCLUSIVEMENT côté serveur via SUPABASE_SERVICE_ROLE_KEY
-- (bypass RLS).

CREATE POLICY "messaging_realtime_presence_send_authorized" ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'presence'
    AND public.messaging_topic_kind(realtime.topic()) = 'conv'
    AND public.messaging_can_access_conversation(
          auth.uid(),
          public.messaging_topic_id(realtime.topic())
        )
  );

-- ============================================================
-- 5. Vérification READ-ONLY (à lancer séparément après application)
-- ============================================================
-- SELECT policyname, cmd, roles::text
-- FROM pg_policies
-- WHERE schemaname = 'realtime' AND tablename = 'messages'
--   AND policyname LIKE 'messaging_%'
-- ORDER BY policyname;
--
-- Attendu · 2 lignes ·
--   messaging_realtime_presence_send_authorized · INSERT · {authenticated}
--   messaging_realtime_receive_authorized       · SELECT · {authenticated}
--
-- SELECT proname FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND proname IN (
--     'messaging_can_access_conversation',
--     'messaging_is_inbox_owner',
--     'messaging_topic_kind',
--     'messaging_topic_id'
--   )
-- ORDER BY proname;
-- Attendu · 4 lignes.
--
-- SELECT relrowsecurity FROM pg_class
-- WHERE oid = 'realtime.messages'::regclass;
-- Attendu · true (activée par défaut par Supabase).

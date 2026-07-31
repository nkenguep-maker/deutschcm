-- P4.6-B.2 / P4.6-B.3 · Realtime Authorization sur realtime.messages
--
-- Objectif · rendre les canaux messagerie strictement privés + autoriser
-- uniquement Presence côté client sur les conversations, jamais Broadcast.
--
-- Architecture · Supabase Realtime consulte les policies RLS de la table
-- realtime.messages pour déterminer si un client (auth.uid()) peut :
--   SELECT · s'abonner à un topic
--   INSERT · émettre un message dans le topic (Broadcast/Presence)
--     - realtime.messages.extension distingue "broadcast" vs "presence"
--
-- Doctrine PostgreSQL RLS · policies permissives combinées par OR ·
-- l'ABSENCE d'une policy autorisant Broadcast INSERT client est ce qui
-- refuse l'émission de faux message_created/read_state_updated.
--
-- Additif strict · aucune DROP destructive, aucune modification de
-- policies non-messaging. Idempotent via IF NOT EXISTS / DROP IF EXISTS.

-- ============================================================
-- 1. Helper functions (SECURITY DEFINER, STABLE)
-- ============================================================

-- 1a. true si le supabase auth.uid() est User + participant actif d'une
--     conversation. Usage · policies subscribe/presence.
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
  'P4.6-B.2 · true si auth.uid() est User + participant actif de la conversation.';

-- 1b. true si le supabase auth.uid() est le User propriétaire d'un canal
--     msg:inbox:user:{userId}.
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
  'P4.6-B.2 · true si auth.uid() est User propriétaire d''un canal msg:inbox:user:{userId}.';

-- 1c. Parse préfixe / ID d'un topic messagerie.
--     Reconnu · msg:conv:<id> · msg:inbox:user:<id> · msg:inbox:child:<id>
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
-- 2. Nettoyage préalable idempotent
-- ============================================================
-- On retire d'anciens noms de policies (P4.6-B.2 v1 + potentiels retry).
DROP POLICY IF EXISTS "messaging_realtime_subscribe" ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_send_deny_client" ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_receive_authorized" ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized" ON realtime.messages;

-- ============================================================
-- 3. SELECT (abonnement) sur topics messagerie
-- ============================================================
-- Autorise l'abonnement d'un client authenticated à un topic messagerie
-- uniquement si :
--   msg:conv:<id>        → auth.uid() = participant actif de la conv
--   msg:inbox:user:<id>  → auth.uid() = owner du userId
--   msg:inbox:child:<id> → refus total (le child n'a pas auth.uid())
-- Les topics non-"msg:" ne sont pas gouvernés par cette policy.
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
        -- Topics non-messaging (classroom, leaderboard, …) → laisser
        -- passer aux autres policies définies ailleurs.
        realtime.topic() NOT LIKE 'msg:%'
    END
  );

-- ============================================================
-- 4. INSERT extension = 'presence' sur msg:conv:<id> uniquement
-- ============================================================
-- Autorise Presence.track() côté client si :
--   - extension = 'presence' (Supabase Realtime encode l'extension utilisée)
--   - topic est un msg:conv:<id> (pas inbox, pas child)
--   - l'acteur est participant actif de la conversation
--
-- Note doctrine · aucune policy INSERT n'est créée pour extension =
-- 'broadcast'. L'absence d'autorisation permissive = refus par défaut
-- (RLS PostgreSQL). Les broadcasts message_created / read_state_updated
-- / conversation_updated restent EXCLUSIVEMENT émis par le serveur via
-- SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
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
-- 5. RLS activée sur realtime.messages
-- ============================================================
-- Supabase l'active par défaut ; commande idempotente incluse pour être
-- explicite. À exécuter uniquement depuis le SQL Editor si RLS était
-- désactivée manuellement.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Vérification (à exécuter séparément après application)
-- ============================================================
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'realtime' AND tablename = 'messages'
--   AND policyname LIKE 'messaging_%'
-- ORDER BY policyname;
--
-- Attendu · deux lignes ·
--   messaging_realtime_receive_authorized               (SELECT)
--   messaging_realtime_presence_send_authorized         (INSERT)
--
-- SELECT relrowsecurity FROM pg_class
-- WHERE oid = 'realtime.messages'::regclass;
-- Attendu · true

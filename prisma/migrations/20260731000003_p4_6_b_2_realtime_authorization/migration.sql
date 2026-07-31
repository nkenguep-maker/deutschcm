-- P4.6-B.2 · Realtime Authorization sur realtime.messages
--
-- Objectif · rendre les canaux messagerie strictement privés. Sans ces
-- politiques, tout détenteur de la clé anon peut s'abonner à n'importe
-- quel topic et recevoir les broadcast events.
--
-- Architecture · Supabase Realtime consulte les policies RLS de la table
-- realtime.messages pour déterminer si un client (auth.uid()) peut :
--   SELECT · s'abonner à un topic
--   INSERT · émettre un message dans le topic (Broadcast/Presence)
--
-- La colonne `topic` de realtime.messages contient le nom du canal
-- (ex. "msg:conv:xyz"). On ne fait JAMAIS confiance au préfixe seul ·
-- on vérifie systématiquement l'appartenance via MessagingConversation-
-- Participant.
--
-- Additif strict · aucune DROP, aucune modification de policies non-
-- messaging existantes. Idempotent via IF NOT EXISTS et DROP IF EXISTS.

-- 1. Helper : vérifie qu'un supabase auth.uid() correspond à un
--    User participant actif d'une conversation. Renvoie boolean.
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
  'P4.6-B.2 · true si le supabase auth.uid() est User + participant actif de la conversation. STABLE + SECURITY DEFINER pour usage dans policies realtime.messages.';

-- 2. Helper : vérifie qu'un supabase auth.uid() correspond au User.id
--    dont l'inbox est ciblée (msg:inbox:user:{userId}).
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
  'P4.6-B.2 · true si le supabase auth.uid() est le User propriétaire d''un canal msg:inbox:user:{userId}.';

-- 3. Helper : parse un topic messagerie et renvoie l''ID interne.
--    Formats acceptés :
--      msg:conv:<conversationId>
--      msg:inbox:user:<userId>
--      msg:inbox:child:<childProfileId>
--    Aucun autre préfixe n''est reconnu · les topics non-messaging ne
--    sont pas gouvernés par ces fonctions.
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

-- 4. Policies sur realtime.messages · SELECT (subscribe) + INSERT (client emit).
--
-- Convention · ces policies ne s''appliquent qu''aux topics messagerie
-- (préfixe "msg:"). Les autres topics restent gouvernés par leurs
-- propres policies (classroom broadcast, leaderboard, etc.).
--
-- SECURITY MODEL ·
--   SELECT (abonnement)
--     - Topic "msg:conv:<id>"        → auth.uid() doit être participant actif du conv
--     - Topic "msg:inbox:user:<uid>" → auth.uid() doit être owner du userId
--     - Topic "msg:inbox:child:<cid>" → REFUS TOTAL depuis client anon (enfant
--       n''a pas de session Supabase Auth · service_role publie côté serveur ·
--       le child utilisera polling exclusivement en attendant infra dédiée)
--     - Autres topics "msg:*"        → refus
--   INSERT (émission client)
--     - Uniquement Presence typing (extension "presence" · non whitelisté ici
--       de manière granulaire faute de discriminant portable). On refuse
--       INSERT sur "msg:*" pour tous les clients · le serveur publie via
--       service_role qui bypass RLS. Presence Realtime utilise un canal
--       séparé au niveau protocole (join_type), non filtré par cette policy
--       INSERT sur realtime.messages.

-- Nettoyage préalable idempotent (dev/staging retry safe).
DROP POLICY IF EXISTS "messaging_realtime_subscribe" ON realtime.messages;
DROP POLICY IF EXISTS "messaging_realtime_send_deny_client" ON realtime.messages;

-- 4a. SELECT (subscribe) sur topics messaging.
CREATE POLICY "messaging_realtime_subscribe" ON realtime.messages
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
        -- Aucun client anon/authenticated ne peut s''abonner à un canal
        -- inbox enfant · l''enfant n''a pas de session Supabase.
        false
      ELSE
        -- Topic non-messaging · policy laisse passer aux autres policies
        -- (aucune interférence avec classroom_broadcast, leaderboard, ...).
        -- Retourner NULL fait échouer la clause USING · on renvoie true
        -- uniquement si le topic n''est pas préfixé "msg:".
        realtime.topic() NOT LIKE 'msg:%'
    END
  );

-- 4b. INSERT (émission par client) · refus systématique sur "msg:*".
--     Le publisher serveur utilise SUPABASE_SERVICE_ROLE_KEY qui bypass RLS.
--     Typing arrive via Presence (protocole séparé, non stocké dans
--     realtime.messages).
CREATE POLICY "messaging_realtime_send_deny_client" ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- N''autorise que les topics non-messaging (autres policies décideront).
    realtime.topic() NOT LIKE 'msg:%'
  );

-- 5. S''assurer que RLS est bien activée sur realtime.messages (Supabase
--    l''active par défaut, ceci est un no-op idempotent).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

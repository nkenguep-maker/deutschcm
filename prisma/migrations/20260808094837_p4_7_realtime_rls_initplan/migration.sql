-- P4.7 · Realtime RLS init-plan optimization
--
-- Supabase's database advisor flags direct auth.uid() calls inside RLS
-- expressions because they may be re-evaluated for every row. Wrapping the
-- call in a scalar SELECT lets Postgres evaluate it once per statement while
-- preserving the exact authorization semantics.

DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized" ON realtime.messages;
CREATE POLICY "messaging_realtime_presence_send_authorized"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'presence'
    AND private.messaging_topic_kind(realtime.topic()) = 'conv'
    AND private.messaging_can_access_conversation(
      (SELECT auth.uid()),
      private.messaging_topic_id(realtime.topic())
    )
  );

DROP POLICY IF EXISTS "messaging_realtime_receive_authorized" ON realtime.messages;
CREATE POLICY "messaging_realtime_receive_authorized"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    CASE private.messaging_topic_kind(realtime.topic())
      WHEN 'conv' THEN private.messaging_can_access_conversation(
        (SELECT auth.uid()),
        private.messaging_topic_id(realtime.topic())
      )
      WHEN 'inbox_user' THEN private.messaging_is_inbox_owner(
        (SELECT auth.uid()),
        private.messaging_topic_id(realtime.topic())
      )
      WHEN 'inbox_child' THEN false
      ELSE realtime.topic() NOT LIKE 'msg:%'
    END
  );

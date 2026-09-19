-- P0.6 · Messaging domain RLS baseline (P-1 first)
--
-- Scope:
--   public.messaging_conversations
--   public.messaging_conversation_participants
--   public.messaging_conversation_read_states
--   public.messaging_messages
--   public.messaging_message_attachments
--   public.messaging_message_receipts
--   public.messaging_guided_phrases
--   public.messaging_moderation_actions
--   public.messaging_audio_assets
--
-- Important: YEMA Realtime does NOT subscribe to Postgres changes on these
-- public tables. Clients use private Broadcast/Presence channels governed by
-- policies on realtime.messages; message content and authorization are always
-- re-fetched through server APIs backed by Prisma.
--
-- Therefore these public relational tables remain server-owned.
--
-- Contract:
--   1. Enable RLS on the nine messaging-domain tables.
--   2. Add no public-table client policies: anon/authenticated remain deny-by-default.
--   3. Explicitly revoke accidental direct table privileges.
--   4. Do NOT FORCE RLS; the trusted Prisma database role remains the server path.
--   5. Do not alter realtime.messages policies or storage policies here.
--
-- Validate on Supabase P-1 before any Production use.

ALTER TABLE public.messaging_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_conversation_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_guided_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_audio_assets ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.messaging_conversations FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_conversation_participants FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_conversation_read_states FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_messages FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_message_attachments FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_message_receipts FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_guided_phrases FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_moderation_actions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.messaging_audio_assets FROM PUBLIC, anon, authenticated;

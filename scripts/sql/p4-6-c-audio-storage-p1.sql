-- ============================================================
-- P4.6-C.1 · bucket yema-messaging-audio-private · Storage P-1
-- ============================================================
-- À exécuter dans le SQL Editor du projet Supabase P-1
-- (kzzagbojjkivdzzcrmxn) UNIQUEMENT si le script
-- scripts/ensure-messaging-audio-bucket.mjs échoue.
--
-- Doctrine ·
--   - public = false ;
--   - MIME whitelist audio/webm|ogg|mp4|mpeg|wav ;
--   - file_size_limit 8 MiB ;
--   - AUCUNE policy Storage donnant accès direct aux rôles anon ou
--     authenticated. Tous les accès Storage passent par le serveur
--     YEMA avec service_role.
--
-- Idempotent · ON CONFLICT DO UPDATE + DROP POLICY IF EXISTS.

-- 1. Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yema-messaging-audio-private',
  'yema-messaging-audio-private',
  false,
  8388608,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];

-- 2. Aucune policy Storage supplémentaire · le service_role a un accès
--    complet par défaut · anon et authenticated N'ONT AUCUNE policy sur
--    ce bucket, donc AUCUN accès direct.
--
-- Nettoyage préventif · retirer toute policy legacy éventuelle liée au
-- bucket messagerie audio (aucune ne devrait exister mais safe).
DROP POLICY IF EXISTS "yema_messaging_audio_read_anon"          ON storage.objects;
DROP POLICY IF EXISTS "yema_messaging_audio_read_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "yema_messaging_audio_write_anon"         ON storage.objects;
DROP POLICY IF EXISTS "yema_messaging_audio_write_authenticated" ON storage.objects;

-- 3. Vérification READ-ONLY (à copier dans SQL Editor après application)
--
-- SELECT id, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id = 'yema-messaging-audio-private';
--
-- SELECT policyname, cmd, roles::text
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE 'yema_messaging_audio_%';
-- Attendu · 0 lignes (aucune policy publique/authenticated).

-- YEMA · DATA-002 · étape 1/2 — enums manquants + Role.CENTER
--
-- P-1 baseline authentifiée a révélé que la chaîne de migrations ne créait
-- ni certains enums ni la valeur Role.CENTER attendus par schema.prisma.
-- Post-A.2 (DATA-001), cette passe complète l'alignement sans jamais toucher
-- une migration historique.
--
-- Cette étape 1/2 crée UNIQUEMENT les nouveaux enums et ajoute Role.CENTER.
-- Postgres refuse d'utiliser une nouvelle valeur d'enum dans la même
-- transaction que son ADD VALUE (« unsafe use of new value »). L'étape 2/2
-- crée les tables + colonnes + backfill qui utilisent CENTER.

-- 1. Statut d'un UserRole (ACTIVE, PENDING).
--    Requis par la table user_roles créée en étape 2/2.
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'PENDING');

-- 2. Statut d'une demande d'accréditation (teacher_applications, center_applications).
CREATE TYPE "ApplicationStatus" AS ENUM ('RECEIVED', 'CONTACTED', 'MET', 'ACCREDITED', 'DECLINED');

-- 3. Ajout de CENTER à l'enum Role.
--    La doctrine post-A.1 utilise CENTER. Les migrations historiques créaient
--    CENTER_MANAGER (deprecated). On garde CENTER_MANAGER dans l'enum pour
--    permettre la lecture de lignes legacy et le backfill non destructif.
--    Une passe ultérieure pourra retirer CENTER_MANAGER si aucune ligne
--    users.role = 'CENTER_MANAGER' ne subsiste.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CENTER';

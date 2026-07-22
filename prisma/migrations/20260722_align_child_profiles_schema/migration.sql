-- YEMA · Phase A.2 · DATA-001
-- Aligne la table `child_profiles` sur le schéma Prisma actuel :
--   legacy : langue TEXT, echelleYema TEXT DEFAULT 'E1', etoiles INT DEFAULT 0, motsAppris TEXT[]
--   cible  : langues JSONB DEFAULT '[]', activeLangue TEXT NULL
--
-- La transformation préserve toutes les données legacy en les consolidant
-- dans un unique élément JSONB conforme au type ChildLangue :
--   { langue, type, echelle, etoiles, motsAppris }
--
-- `type` est dérivé : native si la langue appartient au territoire
-- « sources » (bassa, wolof, swahili, lingala, douala, ewondo, fulfulde,
-- yoruba), sinon foreign. Cette liste est figée dans le SQL car les
-- migrations n'ont pas accès au registre TypeScript.
--
-- `echelle` : conserve echelleYema si type=native (E1..E5) ; sinon la
-- remap vers M1 (initial foreign step), la valeur legacy E1 par défaut
-- ne signifiant rien pour une langue étrangère.
--
-- Séquence : ajout nullable → migration valeurs → suppression legacy.
-- Aucune donnée n'est perdue.

BEGIN;

-- 1. Ajouter les nouvelles colonnes en NULL / DEFAULT pour rester compatible
--    avec les lignes existantes.
ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "activeLangue" TEXT,
  ADD COLUMN IF NOT EXISTS "langues"      JSONB NOT NULL DEFAULT '[]';

-- 2. Consolider les 4 colonnes legacy en un unique élément JSONB par ligne.
--    Utilise jsonb_build_object pour garantir un objet valide et jsonb_build_array
--    pour envelopper dans un tableau. Aucun COALESCE défensif nécessaire côté
--    valeurs car toutes les colonnes legacy sont NOT NULL.
UPDATE "child_profiles"
SET
  "activeLangue" = "langue",
  "langues" = jsonb_build_array(
    jsonb_build_object(
      'langue',     "langue",
      'type',       CASE WHEN "langue" IN ('bassa','wolof','swahili','lingala','douala','ewondo','fulfulde','yoruba')
                         THEN 'native' ELSE 'foreign' END,
      'echelle',    CASE WHEN "langue" IN ('bassa','wolof','swahili','lingala','douala','ewondo','fulfulde','yoruba')
                         THEN "echelleYema" ELSE 'M1' END,
      'etoiles',    "etoiles",
      'motsAppris', to_jsonb("motsAppris")
    )
  )
WHERE "langues" = '[]'::jsonb;

-- 3. Supprimer les colonnes legacy (données déjà consolidées ci-dessus).
ALTER TABLE "child_profiles"
  DROP COLUMN "langue",
  DROP COLUMN "echelleYema",
  DROP COLUMN "etoiles",
  DROP COLUMN "motsAppris";

COMMIT;

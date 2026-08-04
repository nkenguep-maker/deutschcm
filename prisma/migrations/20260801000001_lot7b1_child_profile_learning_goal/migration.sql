-- Lot 7B.1 · objectif pédagogique par enfant (source canonique parcours Monde).
--
-- Contexte : ChildProfile n'a AUCUNE relation vers une source pédagogique
-- (aucun learner User, aucun LearningPath, aucun Enrollment child-scoped).
-- Le brief Lot 7B.1 §2 exige d'ajouter la migration MINIMALE nécessaire.
--
-- Changement strictement additif · un champ nullable, aucune valeur par
-- défaut (les enfants existants restent null · l'UI Family affiche
-- honnêtement "Objectif à préciser").
--
-- Aucun index (lecture uniquement par ChildProfile.id déjà indexé, jamais
-- par learningGoal). Aucun enum : parité stricte avec User.learningGoal ·
-- resolveMondePath fait le mapping. Aucun target_date, aucune ville, aucun
-- completion status, aucun défaut STUDIES.

ALTER TABLE "child_profiles"
  ADD COLUMN IF NOT EXISTS "learningGoal" TEXT;

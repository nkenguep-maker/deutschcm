-- Racines launch language decision: Bassa first.
-- Keep existing language values for future content; add BASSA as a first-class
-- LanguageCode used by LearningPath and ProductVariant.

ALTER TYPE "LanguageCode" ADD VALUE IF NOT EXISTS 'BASSA';

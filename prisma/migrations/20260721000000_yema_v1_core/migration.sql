-- YEMA V1 · Socle utilisateurs & droits
-- Drop legacy payment tables (data jetable, 0 réf code v1),
-- crée les enums v2 et les 20+ tables du noyau.

-- ─── DROP LEGACY (subscriptions + payments obsolètes) ──────────────
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "subscriptions" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus";
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "SubscriptionStatus";

-- ─── ENUMS v2 ─────────────────────────────────────────────────────
CREATE TYPE "Universe" AS ENUM ('MONDE', 'RACINES');
CREATE TYPE "Intention" AS ENUM ('VISA_DEPART', 'SUR_PLACE', 'RACINES_SOI', 'TRANSMISSION');
CREATE TYPE "LanguageCode" AS ENUM ('DEUTSCH', 'WOLOF', 'DOUALA', 'LINGALA', 'BAMBARA', 'YORUBA', 'SWAHILI');
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');
CREATE TYPE "AppRole" AS ENUM ('LEARNER', 'PARENT', 'TEACHER', 'CAREER_COACH', 'CENTER_ADMIN', 'YEMA_ADMIN');
CREATE TYPE "ProductCode" AS ENUM ('PASSAGE', 'TEACHER_ADDON', 'CAREER_COACH_ADDON', 'ROOTS_SOLO', 'ROOTS_FAMILY', 'ROOTS_FOLLOWUP_ADDON', 'COMPANION');
CREATE TYPE "BillingType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'SEAT');
CREATE TYPE "Currency" AS ENUM ('XAF', 'EUR');
CREATE TYPE "Capability" AS ENUM ('COURSE_ACCESS', 'AI_TEXT', 'AI_VOICE', 'MOCK_EXAMS', 'CLASSROOM', 'THREAD_POST', 'HOMEWORK', 'CERTIFICATE', 'VEILLEE_CONTENT', 'CHILD_PROFILES');
CREATE TYPE "BeneficiaryType" AS ENUM ('USER', 'HOUSEHOLD', 'LEARNING_PATH');
CREATE TYPE "GrantSourceType" AS ENUM ('ORDER', 'SUBSCRIPTION', 'CENTER_SEAT', 'PROMO');
CREATE TYPE "GrantStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
CREATE TYPE "LearningPathStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentProviderV2" AS ENUM ('CINETPAY', 'CARD');
CREATE TYPE "PaymentV2Status" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'ADULT');
CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ClassType" AS ENUM ('TEACHER', 'CAREER_COACH', 'CENTER');
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ClassMemberRole" AS ENUM ('LEARNER', 'TEACHER', 'COACH');
CREATE TYPE "ThreadType" AS ENUM ('MAIN', 'ANNOUNCEMENT', 'ASSIGNMENT', 'ONE_TO_ONE');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'AUDIO');

-- ─── users : drop de la colonne legacy plan ? NON — coexistence.
-- Rien à changer sur users pour l'instant.

-- ─── UserAppRole ──────────────────────────────────────────────────
CREATE TABLE "user_app_roles" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "role"      "AppRole" NOT NULL,
  "grantedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_app_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "user_app_roles_userId_role_key" ON "user_app_roles"("userId", "role");
CREATE INDEX "user_app_roles_userId_idx" ON "user_app_roles"("userId");

-- ─── LearningPath ─────────────────────────────────────────────────
CREATE TABLE "learning_paths" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL,
  "universe"          "Universe" NOT NULL,
  "language"          "LanguageCode" NOT NULL,
  "currentLevel"      "CefrLevel",
  "intention"         "Intention",
  "onboardingAnswers" JSONB NOT NULL DEFAULT '{}',
  "status"            "LearningPathStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"        TIMESTAMP(3),
  CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "learning_paths_userId_status_idx" ON "learning_paths"("userId", "status");
CREATE INDEX "learning_paths_universe_language_idx" ON "learning_paths"("universe", "language");

-- ─── Catalogue : Product / ProductVariant / Rule ──────────────────
CREATE TABLE "products" (
  "id"          TEXT PRIMARY KEY,
  "code"        "ProductCode" NOT NULL UNIQUE,
  "universe"    "Universe",
  "billingType" "BillingType" NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "product_variants" (
  "id"           TEXT PRIMARY KEY,
  "productId"    TEXT NOT NULL,
  "language"     "LanguageCode",
  "level"        "CefrLevel",
  "currency"     "Currency" NOT NULL,
  "amount"       INTEGER NOT NULL,
  "durationDays" INTEGER,
  "market"       TEXT,
  "active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "product_variants_uniq"
  ON "product_variants"("productId", "language", "level", "currency", "durationDays");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

CREATE TABLE "product_entitlement_rules" (
  "id"         TEXT PRIMARY KEY,
  "productId"  TEXT NOT NULL,
  "capability" "Capability" NOT NULL,
  "scopeRule"  JSONB,
  "limitValue" INTEGER,
  CONSTRAINT "product_entitlement_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "product_entitlement_rules_productId_capability_key"
  ON "product_entitlement_rules"("productId", "capability");
CREATE INDEX "product_entitlement_rules_productId_idx" ON "product_entitlement_rules"("productId");

-- ─── Orders / OrderItems / Payments ───────────────────────────────
CREATE TABLE "orders" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "status"    "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "currency"  "Currency" NOT NULL,
  "total"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");

CREATE TABLE "order_items" (
  "id"                TEXT PRIMARY KEY,
  "orderId"           TEXT NOT NULL,
  "productVariantId"  TEXT NOT NULL,
  "beneficiaryType"   "BeneficiaryType" NOT NULL,
  "beneficiaryId"     TEXT NOT NULL,
  "quantity"          INTEGER NOT NULL DEFAULT 1,
  "unitAmount"        INTEGER NOT NULL,
  CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id")
);
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

CREATE TABLE "payments" (
  "id"          TEXT PRIMARY KEY,
  "orderId"     TEXT NOT NULL,
  "provider"    "PaymentProviderV2" NOT NULL,
  "status"      "PaymentV2Status" NOT NULL DEFAULT 'PENDING',
  "amount"      INTEGER NOT NULL,
  "currency"    "Currency" NOT NULL,
  "externalRef" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "failedAt"    TIMESTAMP(3),
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
);
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- ─── Households ───────────────────────────────────────────────────
CREATE TABLE "households" (
  "id"          TEXT PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "status"      "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "households_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "households_ownerUserId_idx" ON "households"("ownerUserId");

CREATE TABLE "household_memberships" (
  "id"          TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "role"        "HouseholdRole" NOT NULL,
  "status"      "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "household_memberships_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE,
  CONSTRAINT "household_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "household_memberships_householdId_userId_key" ON "household_memberships"("householdId", "userId");
CREATE INDEX "household_memberships_userId_idx" ON "household_memberships"("userId");

CREATE TABLE "dependent_profiles" (
  "id"              TEXT PRIMARY KEY,
  "householdId"     TEXT NOT NULL,
  "managedByUserId" TEXT NOT NULL,
  "firstName"       TEXT NOT NULL,
  "birthYear"       INTEGER,
  "status"          "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dependent_profiles_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE,
  CONSTRAINT "dependent_profiles_managedByUserId_fkey" FOREIGN KEY ("managedByUserId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "dependent_profiles_householdId_idx" ON "dependent_profiles"("householdId");
CREATE INDEX "dependent_profiles_managedByUserId_idx" ON "dependent_profiles"("managedByUserId");

-- ─── Access grants ────────────────────────────────────────────────
-- Note : les FK userBeneficiary/householdBeneficiary/learningPathBeneficiary
-- pointent toutes vers beneficiaryId mais avec des tables cibles différentes
-- selon beneficiaryType. On les déclare avec ON DELETE NO ACTION pour éviter
-- les conflits d'intégrité (seule une des trois s'applique à la fois).
CREATE TABLE "access_grants" (
  "id"                TEXT PRIMARY KEY,
  "beneficiaryType"   "BeneficiaryType" NOT NULL,
  "beneficiaryId"     TEXT NOT NULL,
  "productVariantId"  TEXT NOT NULL,
  "sourceType"        "GrantSourceType" NOT NULL,
  "sourceId"          TEXT NOT NULL,
  "orderItemId"       TEXT,
  "startsAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt"            TIMESTAMP(3),
  "status"            "GrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata"          JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_grants_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id"),
  CONSTRAINT "access_grants_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL
);
CREATE INDEX "access_grants_benef_idx" ON "access_grants"("beneficiaryType", "beneficiaryId", "status");
CREATE INDEX "access_grants_productVariantId_idx" ON "access_grants"("productVariantId");
CREATE INDEX "access_grants_source_idx" ON "access_grants"("sourceType", "sourceId");

-- ─── Classes v2 / threads / messages / assignments ─────────────────
CREATE TABLE "classes" (
  "id"             TEXT PRIMARY KEY,
  "classType"      "ClassType" NOT NULL,
  "organizationId" TEXT,
  "language"       "LanguageCode" NOT NULL,
  "level"          "CefrLevel",
  "providerUserId" TEXT NOT NULL,
  "status"         "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "classes_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "classes_providerUserId_idx" ON "classes"("providerUserId");
CREATE INDEX "classes_language_level_idx" ON "classes"("language", "level");

CREATE TABLE "class_memberships" (
  "id"              TEXT PRIMARY KEY,
  "classId"         TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "learningPathId"  TEXT,
  "role"            "ClassMemberRole" NOT NULL,
  "status"          "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_memberships_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "class_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "class_memberships_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "class_memberships_classId_userId_key" ON "class_memberships"("classId", "userId");
CREATE INDEX "class_memberships_userId_idx" ON "class_memberships"("userId");

CREATE TABLE "threads" (
  "id"         TEXT PRIMARY KEY,
  "classId"    TEXT NOT NULL,
  "threadType" "ThreadType" NOT NULL DEFAULT 'MAIN',
  "title"      TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "threads_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);
CREATE INDEX "threads_classId_idx" ON "threads"("classId");

CREATE TABLE "messages" (
  "id"           TEXT PRIMARY KEY,
  "threadId"     TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "messageType"  "MessageType" NOT NULL DEFAULT 'TEXT',
  "body"         TEXT,
  "audioUrl"     TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE,
  CONSTRAINT "messages_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

CREATE TABLE "class_assignments" (
  "id"          TEXT PRIMARY KEY,
  "classId"     TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "dueAt"       TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);
CREATE INDEX "class_assignments_classId_idx" ON "class_assignments"("classId");

CREATE TABLE "submissions" (
  "id"           TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "body"         TEXT,
  "audioUrl"     TEXT,
  "submittedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "class_assignments"("id") ON DELETE CASCADE,
  CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "submissions_assignmentId_userId_key" ON "submissions"("assignmentId", "userId");

CREATE TABLE "class_feedback" (
  "id"           TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "score"        DOUBLE PRECISION,
  "body"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_feedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE,
  CONSTRAINT "class_feedback_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "class_feedback_submissionId_idx" ON "class_feedback"("submissionId");

-- ─── Provider profiles ────────────────────────────────────────────
CREATE TABLE "provider_profiles" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL UNIQUE,
  "bio"       TEXT,
  "languages" "LanguageCode"[] NOT NULL DEFAULT ARRAY[]::"LanguageCode"[],
  "levels"    "CefrLevel"[] NOT NULL DEFAULT ARRAY[]::"CefrLevel"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

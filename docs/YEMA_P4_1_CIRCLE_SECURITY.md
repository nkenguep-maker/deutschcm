# YEMA · P4.1 · Circle security foundations

> Livrables du sous-lot **P4.1** — Circle + CircleMembership + AuditEvent + StorageObject + helpers permissions + RLS + policies storage + feature flags.
>
> **Branche** · `feat/yema-p4-1-circle-security`
> **Base** · `main` post-merge audit P4 (`05ed637`)
> **Portée** · fondations techniques uniquement. **Aucune activation produit** · tous les flags P4 restent `false`. Aucune UI Circle, aucune messagerie, aucun upload, aucun endpoint coach/teacher/center.
>
> **Sources doctrine** ·
> - `docs/YEMA_P4_ARCHITECTURE_AUDIT.md`
> - `docs/YEMA_P4_PERMISSION_MATRIX.md`
> - `docs/YEMA_P4_THREAT_MODEL.md`
> - `docs/YEMA_P4_IMPLEMENTATION_PLAN.md`
> - `docs/YEMA_P3_CIRCLE_DECISION.md`

---

## 1. Schéma Prisma

Additif uniquement · fichier `prisma/schema.prisma`.

### 1.1 Nouvelles enums

- `CircleStatus` · `ACTIVE | ARCHIVED | SUSPENDED`
- `CircleRole` · `OWNER | ADULT | CHILD | COACH`
- `CircleMembershipStatus` · `INVITED | ACTIVE | SUSPENDED | REMOVED`
- `AuditAction` · 17 valeurs couvrant Circle, Household, ChildProfile, Storage, cross-tenant, break-glass admin
- `StorageObjectPurpose` · `SUBMISSION_AUDIO | FEEDBACK_AUDIO | CIRCLE_MESSAGE_AUDIO | CLASS_MESSAGE_AUDIO | ATTACHMENT`

### 1.2 Enums existantes étendues

- `AppRole` · ajout `RACINES_COACH` (distinct de `CAREER_COACH`).
- `ProductCode` · ajout `ROOTS_COACH_ADDON` (nom commercial · « Suivi Racines »).

### 1.3 Nouveaux modèles

#### `Circle`

```
id              String  @id @default(cuid())
householdId     String                                        -- FK Household (Cascade)
language        LanguageCode                                  -- immutable en ACTIVE (Q8)
status          CircleStatus @default(ACTIVE)
createdByUserId String                                        -- FK User (Restrict)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
activeAt        DateTime @default(now())
archivedAt      DateTime?

@@unique([householdId, language])                             -- 1 cercle par (foyer, langue) tous statuts
@@index([householdId, status])
@@index([language, status])
```

#### `CircleMembership`

```
id              String  @id @default(cuid())
circleId        String                                        -- FK Circle (Cascade)
role            CircleRole
status          CircleMembershipStatus @default(INVITED)
userId          String?                                       -- XOR avec childProfileId
childProfileId  String?                                       -- XOR avec userId
invitedByUserId String?
joinedAt        DateTime?
removedAt       DateTime?
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt

@@index([circleId, role, status])
@@index([circleId, status])
@@index([userId, status])
@@index([childProfileId, status])
```

Contrainte DB · `CHECK ((userId IS NULL) <> (childProfileId IS NULL))`.

Index partiels ·

- `UNIQUE (circleId) WHERE role='COACH' AND status='ACTIVE'` → **1 coach actif max**.
- `UNIQUE (circleId, userId) WHERE userId IS NOT NULL AND status='ACTIVE'` → **pas de doublon adulte actif**.
- `UNIQUE (circleId, childProfileId) WHERE childProfileId IS NOT NULL AND status='ACTIVE'` → **pas de doublon enfant actif**.

#### `AuditEvent`

```
id           String  @id @default(cuid())
actorUserId  String?
actorRole    String?
action       AuditAction
targetType   String
targetId     String
scopeType    String?
scopeId      String?
metadata     Json?
createdAt    DateTime @default(now())

@@index([targetType, targetId, createdAt])
@@index([actorUserId, createdAt])
@@index([action, createdAt])
```

#### `StorageObject`

```
id                  String  @id @default(cuid())
bucket              String
path                String
ownerUserId         String?
ownerChildProfileId String?
circleId            String?
classId             String?
purpose             StorageObjectPurpose
mimeType            String
sizeBytes           Int
durationSeconds     Int?
retentionUntil      DateTime?
createdAt           DateTime @default(now())
deletedAt           DateTime?

@@unique([bucket, path])
@@index([purpose, retentionUntil])
@@index([ownerUserId, createdAt])
@@index([circleId])
@@index([classId])
```

### 1.4 Modifications additives sur modèles existants

- `child_profiles.householdId TEXT?` FK vers `households` avec `ON DELETE SET NULL`.
- `users` · ajout `@@index([centerId])` (dette dette identifiée dans l'audit).
- Reverse relations Prisma sur `User` (`circlesCreated`, `circleMemberships`, `circleInvitationsSent`, `auditEventsAsActor`, `storageObjectsOwned`) et sur `Household` (`circles`, `children`) et `ChildProfile` (`circleMemberships`, `storageObjects`).

---

## 2. Migration

Un seul fichier · `prisma/migrations/20260723_p4_1_circle_security/migration.sql`. Purement additif.

### 2.1 Contenu

1. `CREATE TYPE` pour les 5 nouvelles enums.
2. `ALTER TYPE ... ADD VALUE IF NOT EXISTS` pour `RACINES_COACH` et `ROOTS_COACH_ADDON`.
3. `ALTER TABLE child_profiles ADD COLUMN householdId TEXT` + FK SetNull + index.
4. `CREATE INDEX users_centerId_idx`.
5. `CREATE TABLE circles + circle_memberships + audit_events + storage_objects` avec FKs et index.
6. `CHECK ((userId IS NULL) <> (childProfileId IS NULL))` sur `circle_memberships`.
7. 3 index partiels uniques (coach actif, adulte actif, enfant actif).
8. 9 fonctions helper Postgres `SECURITY DEFINER SET search_path = public, pg_temp` ·
   - `current_app_user_id()`
   - `is_household_member(household_id, user_id)`
   - `is_child_parent(child_profile_id, user_id)`
   - `is_circle_member(circle_id, user_id)`
   - `is_circle_owner(circle_id, user_id)`
   - `is_circle_coach(circle_id, user_id)`
   - `is_class_member(class_id, user_id)`
   - `is_center_admin(center_id, user_id)`
   - `is_yema_admin(user_id)`
9. `ENABLE ROW LEVEL SECURITY` sur les 4 nouvelles tables.
10. Policies `SELECT` conservatrices ·
    - `circles_select_member` · membre ACTIVE ou `is_yema_admin`.
    - `circle_memberships_select_member` · membre ACTIVE du même cercle ou `is_yema_admin`.
    - `audit_events_select_admin` · `is_yema_admin` uniquement.
    - `storage_objects_select_owner` · propriétaire OU membre du contexte (circleId/classId) OU admin.

**Aucune policy INSERT/UPDATE/DELETE côté client** · toutes les écritures P4 passent par des routes Next.js avec Prisma en service_role (bypass RLS). Défense en profondeur seulement.

### 2.2 Application

Migration appliquée à P-1 (`kzzagbojjkivdzzcrmxn`) via `pg` Node client (une transaction unique).

Aucune interaction avec la production Supabase (`sbjhvlrkbyjckdxujjsk`).

### 2.3 Rollback

Le rollback est possible mais peu recommandé après création · les tables sont vides en P4.1, donc `DROP POLICY ... ; DISABLE ROW LEVEL SECURITY; DROP FUNCTION ...; DROP TABLE circle_memberships; DROP TABLE circles; DROP TABLE audit_events; DROP TABLE storage_objects; ALTER TABLE child_profiles DROP COLUMN householdId;` est safe. Les `ALTER TYPE ADD VALUE` ne se rollback pas facilement en Postgres — laisser les enum values inutilisées est acceptable.

---

## 3. Capacités et contraintes serveur

Fichier · `src/lib/circles/capacity.ts`. Fonctions transactionnelles ·

- `assertCircleAdultCapacity(tx, circleId)` · throw `max_adults_reached` si ≥ 2 (OWNER + ADULT ACTIVE).
- `assertCircleChildCapacity(tx, circleId)` · throw `max_children_reached` si ≥ 4.
- `assertCircleCoachCapacity(tx, circleId)` · throw `coach_already_assigned` si un COACH ACTIVE existe.
- `assertUniqueActiveHouseholdLanguageCircle(tx, householdId, language)` · throw `circle_language_already_active` si un Circle ACTIVE existe déjà.

Concurrence · toutes les writes doivent utiliser `prisma.$transaction([...], { isolationLevel: "Serializable" })`. En cas de conflit `40001 serialization_failure`, retry applicative-side. Les index partiels uniques garantissent qu'aucun état sur-capacité ne persiste même si le guard applicative saute (ceinture + bretelles).

---

## 4. Permission resolver

Fichier · `src/lib/permissions/circle.ts`. API ·

- `resolveCircleActor()` · résout session Supabase → dbUser. Throw `PermissionError("UNAUTHORIZED" | "NOT_FOUND")`.
- `assertCircleMembership(circleId, actor)` · membership ACTIVE requis, retourne le row.
- `assertCircleOwner(circleId, actor)` · rôle `OWNER` requis.
- `assertCircleAdult(circleId, actor)` · `OWNER` ou `ADULT` requis (accompagnement Q1).
- `assertCircleCoach(circleId, actor)` · rôle `COACH` ACTIVE requis.
- `assertCircleChildAccess(childProfileId, actor)` · parent direct OU membre d'un cercle partagé.
- `assertHouseholdOwnership(householdId, actor)` · owner strict (jamais adulte invité).

Contrats · toutes les erreurs sont typées `PermissionError` avec `code ∈ { UNAUTHORIZED, FORBIDDEN, NOT_FOUND }`. Aucun trust dans `body.userId` ou `params.userId`.

---

## 5. Feature flags

Fichier · `src/lib/flags.ts`.

- Toutes les valeurs par défaut · `false` (variable env absente ou différente de `"true"` / `"1"`).
- Aucun préfixe `NEXT_PUBLIC_` · les flags restent serveur-only.
- API · `getFlag(name)`, `assertFlagEnabled(name)` (throw `FEATURE_FLAG_DISABLED`), `listAllFlags()`.
- 9 flags · `CIRCLE_ENABLED`, `CENTER_REAL_DATA_ENABLED`, `TEACHER_WORKSPACE_ENABLED`, `COACH_WORKSPACE_ENABLED`, `ASSIGNMENTS_ENABLED`, `AUDIO_FEEDBACK_ENABLED`, `CLOSED_MESSAGING_ENABLED`, `NOTIFICATIONS_ENABLED`, `RACINES_COACH_OPERATIONAL`.

---

## 6. Storage

Fichier · `src/lib/storage/objects.ts`. Aucun endpoint d'upload en P4.1 · le module est prêt à être consommé par P4.5/P4.6.

- 6 buckets Supabase Storage créés en P-1 · `class-audio`, `class-attachment`, `circle-audio`, `circle-attachment`, `submission-audio`, `feedback-audio` · **tous privés** (`public: false`).
- MIME allowlist · audio `audio/webm | audio/ogg | audio/mpeg | audio/mp4` · attachment `image/jpeg | image/png | application/pdf`.
- Taille max · 5 MB audio · 10 MB attachment.
- Durée audio max · 180 s (Q6 · Suivi Racines).
- TTL · signed upload 5 min · signed read 10 min.
- Rétention (Q7) · 90 j pour `CIRCLE_MESSAGE_AUDIO` · 12 mois pour `SUBMISSION_AUDIO`, `FEEDBACK_AUDIO`, `CLASS_MESSAGE_AUDIO`, `ATTACHMENT`.
- Chemins canoniques · `{yyyy-mm}/{scope}/{id}/member/{membershipId}/{sha256Prefix}-{rand}.{ext}` · jamais issus du filename client.
- Bucket public existant · `course-videos` reste public (cours pédagogiques, validé produit). Aucune donnée user-generated n'y va.

---

## 7. AuditEvent

Fichier · `src/lib/audit/events.ts`. API ·

- `writeAuditEvent(record, tx?)` · écrit dans la même transaction si `tx` fourni.
- Sanitize automatique · rejette les clés blacklistées (`body`, `message`, `audioUrl`, `signedUrl`, `token`, `password`, `transcription`).
- Truncate · toute string > 500 chars dans metadata est droppée.

Actions supportées P4.1 · CIRCLE_CREATED, CIRCLE_ARCHIVED, CIRCLE_SUSPENDED, CIRCLE_MEMBERSHIP_INVITED, CIRCLE_MEMBERSHIP_ACCEPTED, CIRCLE_MEMBERSHIP_REVOKED, CIRCLE_MEMBERSHIP_ROLE_CHANGED, CIRCLE_COACH_ASSIGNED, CIRCLE_COACH_UNASSIGNED, HOUSEHOLD_MEMBERSHIP_INVITED/ACCEPTED/REVOKED, CHILD_PROFILE_UPDATED, CHILD_ACCESS_DENIED, CROSS_TENANT_ACCESS_DENIED, STORAGE_ACCESS_DENIED, ADMIN_BREAK_GLASS_USED.

---

## 8. APIs

Toutes gated par `CIRCLE_ENABLED = false` par défaut → 404 côté produit.

- `POST /api/circles` · crée un Circle (owner uniquement, transaction Serializable, auto-crée membership OWNER, audit CIRCLE_CREATED).
- `GET /api/circles/[circleId]` · retourne métadonnées Circle + membership du caller si membre ACTIVE.
- `POST /api/circles/[circleId]/archive` · archive un Circle (OWNER uniquement, idempotent, audit CIRCLE_ARCHIVED).

Aucun endpoint d'invitation / création membership en P4.1 (relève de P4.2). Aucun endpoint messagerie / feedback / audio.

---

## 9. RLS · état par table

### Nouvelles tables (P4.1)

| Table | RLS | Policy SELECT | INSERT/UPDATE/DELETE |
|---|---|---|---|
| `circles` | ✅ ON | `is_circle_member(id, current_app_user_id())` ou `is_yema_admin` | service_role seul |
| `circle_memberships` | ✅ ON | `is_circle_member(circleId, current_app_user_id())` ou `is_yema_admin` | service_role seul |
| `audit_events` | ✅ ON | `is_yema_admin(current_app_user_id())` uniquement | service_role seul |
| `storage_objects` | ✅ ON | owner OU membre du contexte (circleId/classId) OU admin | service_role seul |

### Tables existantes P4.1 restées sans RLS · **blockers explicites**

Les tables suivantes restent `RLS_OFF` en P4.1 · le sous-lot correspondant devra les activer **avant** activation du flag associé ·

| Table | Sous-lot bloqueur | Flag concerné |
|---|---|---|
| `users` (données personnelles) | P4.2 | (tous) |
| `households`, `household_memberships`, `dependent_profiles` | P4.2 | `CIRCLE_ENABLED` prod |
| `child_profiles` (déjà service_role only, à raffiner) | P4.2 | `CIRCLE_ENABLED` prod |
| `access_grants`, `orders`, `order_items`, `payments` | P4.2 (avant paiement Racines) | `RACINES_COACH_OPERATIONAL` |
| `classes`, `class_memberships` | P4.3b | `TEACHER_WORKSPACE_ENABLED`, `CENTER_REAL_DATA_ENABLED` |
| `class_assignments`, `submissions`, `class_feedback` | P4.3b | `ASSIGNMENTS_ENABLED` |
| `threads`, `messages` | P4.6 | `CLOSED_MESSAGING_ENABLED` |
| `classrooms`, `classroom_enrollments`, `assignments`, `assignment_submissions` (legacy) | P4.3b | `TEACHER_WORKSPACE_ENABLED` |
| `language_centers`, `teachers` | P4.3a | `CENTER_REAL_DATA_ENABLED` |
| `notifications` | P4.7 | `NOTIFICATIONS_ENABLED` |
| `learning_paths` | P4.3b | `TEACHER_WORKSPACE_ENABLED` |

Chaque activation de flag en production doit être précédée d'un check `ENABLE ROW LEVEL SECURITY + policies` sur les tables listées.

---

## 10. Storage policies

Bucket policies Supabase Storage · à écrire en P4.5 avant activation `AUDIO_FEEDBACK_ENABLED`. En P4.1, les buckets existent et sont privés (par défaut aucun accès public). Aucun endpoint d'upload actif.

Politique cible ·

- `SELECT storage.objects` · autorisé si `auth.uid()` correspond à `storage_objects.ownerUserId` OU si `storage_objects.circleId` a `is_circle_member(...)` OU si `storage_objects.classId` a `is_class_member(...)`.
- `INSERT storage.objects` · signed upload URL fournie par le serveur (contrainte via Supabase Auth · l'URL contient un JWT court terme).
- `DELETE storage.objects` · service_role uniquement (audit trail obligatoire).

---

## 11. Fixtures et smoke tests

- `scripts/test-baseline/p4-1-fixtures.mjs` · `seed | clean | list`. Crée 2 households (A, B), 4 users (owner A, adult A, owner B, coach A avec `RACINES_COACH`), 2 enfants dans A, 1 Circle A LINGALA ACTIVE avec 5 memberships (OWNER + ADULT + COACH + 2 CHILD), 1 Circle A SWAHILI ARCHIVED, 1 Circle B WOLOF ACTIVE, 1 StorageObject métadonnée.
- `scripts/test-baseline/p4-1-rls-smoke.mjs` · vérifie CHECK XOR, index partiel coach, unique (household, language), cross-tenant, RLS anon → 0 lignes (erreur 42501), RLS auth via Supabase Auth JWT → 0 lignes également (les tables ne sont pas exposées via PostgREST par grants — défense en profondeur additionnelle).

Résultats · **6/6 checks OK** au 2026-07-23.

---

## 12. Tests

- **Unitaires** ·
  - `src/lib/__tests__/flags.test.ts` · 6 tests (default false, strict truthy, throw code, pas de leak NEXT_PUBLIC).
  - `src/lib/__tests__/circle-capacity.test.ts` · 8 tests (adultes, enfants, coach, langue).
  - `src/lib/__tests__/circle-permissions.test.ts` · 10 tests (structurel + `circleRoleAllows`).
  - `src/app/__tests__/p4-1-circle-security.test.ts` · 25 tests (schema, migration, API, storage, audit).
- **Intégration** · `scripts/test-baseline/p4-1-rls-smoke.mjs` (RLS + concurrence + cross-tenant).
- **Total** · **354 tests pass** · `Test Files 27 passed (27)`.

---

## 13. Landing regression

Aucune modification de `/fr` ni `/en`. Aucun composant Racines / dashboard modifié. Landing intacte.

---

## 14. Blockers pour P4.2

Avant démarrage P4.2 (memberships + invitations) ·

- [ ] Câbler `AuditEvent.CIRCLE_MEMBERSHIP_INVITED / ACCEPTED / REVOKED` sur chaque endpoint membership.
- [ ] Câbler `AuditEvent.HOUSEHOLD_MEMBERSHIP_INVITED / ACCEPTED / REVOKED` sur endpoints famille.
- [ ] Étendre RLS aux tables `households`, `household_memberships`, `child_profiles` (P3 avait posé service_role only sur child_profiles · relaxer à owner + shared circle).
- [ ] Écrire endpoints `POST /api/circles/[cid]/members`, `DELETE /api/circles/[cid]/members/[mid]`, `POST /api/family/adults`, `POST /api/family/adults/[mid]/accept`.
- [ ] Guarantee 15 min retract window et OWNER-hide sur messages (spec P4.6, mais capture les patterns dès P4.2 dans le lib).

---

## 15. Décision

**P4.1 READY TO MERGE**

- Schéma additif validé (Prisma valid).
- Migration appliquée à P-1 (jamais en prod).
- 354 tests pass.
- 6/6 smoke tests RLS + concurrence + cross-tenant OK.
- 0 blocker service-role (voir `YEMA_P4_SERVICE_ROLE_INVENTORY.md`).
- Feature flags tous à `false` par défaut.
- Aucune UI Circle exposée.
- Landing intacte.

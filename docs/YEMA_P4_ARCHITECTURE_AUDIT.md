# YEMA · Audit d'architecture P4 · Espaces professionnels, Circle, devoirs, feedback humain et messagerie fermée

> **Statut** : audit lecture seule. Aucune modification du schéma Prisma, aucune migration, aucune API touchée. Décision Circle A/B déjà tranchée en P3 (`docs/YEMA_P3_CIRCLE_DECISION.md` · Option A).
>
> **Branche** : `feat/yema-p4-professional-spaces`
> **Base** : `main@4370f128d545907a31967eb85b6bc4dcd76170c2` (merge P3 validé)
> **Date** : 2026-07-23

Cet audit répond aux cinq questions structurelles :

1. Quels modèles existants peuvent être réutilisés ?
2. Quels nouveaux modèles sont réellement nécessaires ?
3. Quelles permissions doivent être appliquées côté serveur et en base ?
4. Quels risques existent pour les mineurs et les communications privées ?
5. Dans quel ordre P4 doit-il être implémenté sans casser Monde, Racines ou les centres ?

Les documents compagnons couvrent les autres axes : `YEMA_P4_PERMISSION_MATRIX.md` (matrices d'autorisation détaillées), `YEMA_P4_THREAT_MODEL.md` (menaces + RLS + storage), `YEMA_P4_IMPLEMENTATION_PLAN.md` (migrations, feature flags, plan P4.1 → P4.7).

---

## 1. Résumé exécutif

- **Réutilisable P4** · `User`, `AccessGrant`, `LearningPath`, `Product/ProductVariant`, `Household`, `HouseholdMembership`, `ChildProfile`, `Class`, `ClassMembership`, `Thread`, `Message` (texte + audio), `ClassAssignment`, `Submission`.
- **À créer (Option A, migrations additives)** · `Circle`, `CircleMembership`, `CircleMessage`, `AuditEvent`, `StorageObject` — tous posés dès **P4.1** avec RLS activée immédiatement.
- **À corriger sur modèles existants** · `ClassFeedback` ne porte pas de `audioUrl` alors que la doctrine §Suivi humain l.2003-2005 impose feedback vocal. Migration additive `+ audioUrl String?` requise en P4.3b (M3). Immutable après publication (Q13 validée) · corrections successives via nouvelle ligne (`addendumOfFeedbackId`).
- **Absents à ce jour** · aucun modèle `Coach`, `CoachAssignment`, `CircleInvitation`, `MessageReadState`, `MessageReport`, `AuditEvent`, `StorageObject`. Tous proposés en additif dans le plan.
- **RLS activée dès P4.1** · les fonctions helper Postgres (`is_class_member`, `is_circle_member`, `is_circle_owner`, `is_circle_coach`, `is_center_admin`, `is_household_member`, `is_child_parent`) sont posées en M1. Les policies Circle/CircleMembership/AuditEvent/StorageObject activées immédiatement · Class/ClassMembership/Household/ChildProfile en M2 · assignments/submissions/feedback/threads/messages en M3 · CircleAssignment/CircleMessage en M4. **`P4.RLS`** en fin de séquence est une **revue de consolidation**, plus la première implémentation.
- **Mocks résiduels** · les pages `/center/*`, `/teacher/students/*`, `/classroom/[id]`, `/discover/*` rendent des constantes JS comme données réelles. À remplacer en P4.3a par des getters `lib/data/*` scopés serveur.
- **Nomenclature figée** · `ProductCode = ROOTS_COACH_ADDON` (à créer en migration additive P4.4) · nom commercial · **« Suivi Racines »** · `AppRole = RACINES_COACH` (nouveau, jamais réutiliser `CAREER_COACH`). `DependentProfile` audité et **déprécié** en P4 (aucune suppression destructive) · `ChildProfile` reste canonique.
- **`ThreadType.ONE_TO_ONE`** · déprécié · nouvelles créations bloquées côté API en P4.6 · aucune suppression destructive de l'enum en P4 · retrait effectif planifié P5+.
- **Blocage réel bêta** · sans RLS activée par table, sans URLs signées pour les productions enfants, sans policy audio, sans messagerie coach opérationnelle, `RACINES_COACH_OPERATIONAL` reste `false` (comme cadré en P3).

---

## 2. Fichiers inspectés

### Doctrine + roadmap

`YEMA_PRODUCT_DESIGN_DOCTRINE.md` · `YEMA_PRODUCT_GAP_ANALYSIS.md` · `YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md` (§Lot P4 lignes 484-549 + amendements §P4-7 lignes 814-824) · `YEMA_AUTHENTICATED_BASELINE.md` · `YEMA_UI_FOUNDATIONS.md` · `YEMA_P1_FUNNEL.md` · `YEMA_P2_WORLD_STUDENT.md` · `YEMA_P3_ROOTS_FAMILY.md` · `YEMA_P3_CIRCLE_DECISION.md` (§Recommandation + §Règles capacité RECOMMANDÉES lignes 130-152).

### Schéma Prisma

`prisma/schema.prisma` · 1150 lignes · 51 modèles · 13 migrations sous `prisma/migrations/`.

### Pages produit auditées

- Teacher · `src/app/[locale]/teacher/{page,classrooms,classroom/[classroomId],students,students/[studentId],courses,assignments,activities,resources,settings,stats,studio,goodbye}/page.tsx`
- Center · `src/app/[locale]/center/{page,classes,students,teachers,billing,stats}/page.tsx`
- Classroom · `src/app/[locale]/classroom/{page,join,[classroomId],[classroomId]/assignment/[assignmentId]}/page.tsx`
- Famille · `src/app/[locale]/famille/{page,enfant/[profilId]}/page.tsx`
- Discover · `src/app/[locale]/discover/{page,center/[centerId],class/[classroomId],group/[groupId]}/page.tsx`
- Admin · `src/app/[locale]/admin/{page,roles,users,centers,courses,applications,system,courses/generate}/page.tsx`
- Group · `src/app/[locale]/group/{page,create,join}/page.tsx`
- Notifications · `src/app/[locale]/notifications/page.tsx`

### API auditées

`src/app/api/{family,me,teacher,center,classroom,discover,courses,notifications,social,onboarding,group,space,language,roles,progress,quiz,test-niveau,schreiben,speech,upload,events,apply,fix-role,health,admin,dev}/**/route.ts`.

### Sécurité + storage

`src/lib/supabase/{server,client,realtime}.ts` · `src/proxy.ts` · `src/lib/roles.ts` · `src/app/api/upload/video-url/route.ts` · migration `prisma/migrations/20260719_child_profiles/migration.sql` (seule RLS active) · `prisma/migrations/20260721000000_yema_v1_core/migration.sql`.

---

## 3. Inventaire des modèles Prisma pertinents pour P4

Chaque ligne cite le nom exact du modèle Prisma, jamais un nom fantôme.

| Modèle | Utilisé aujourd'hui | Routes / API principales | Ownership serveur | Contraintes | Réutilisable P4 | Dette |
|---|---|---|---|---|---|---|
| `User` | ✓ auth cœur | toutes les routes | `supabaseId` (unique) → `id` | index `[email]`, `[supabaseId]` | **oui** | rôle legacy `role` coexiste avec `UserAppRole` |
| `UserAppRole` | ✓ V2 multi-rôle | `roles/grant`, `roles/revoke`, proxy | `[userId, role]` unique | index `[userId]` | **oui** | `AppRole` inclut `CAREER_COACH` mais pas de table de rattachement |
| `UserRole` (legacy) | ⚠ toujours lu | `me/racines-dashboard` (`role=STUDENT`) | `[userId, role]` unique | | **oui — read-only** | à retirer après P4 |
| `AccessGrant` | ✓ source d'autorité entitlements | `me/racines-dashboard`, `me/monde-dashboard`, seams `lib/entitlements/*` | `[beneficiaryType, beneficiaryId, status]` index | FKs `NoAction` sur bénéficiaire | **oui** | à filtrer aussi sur `productVariant.product.code IN (COACH_RACINES_ADDON, TEACHER_ADDON…)` en P4.3b/4.4 |
| `LearningPath` | ✓ | `me/racines-dashboard`, `me/monde-dashboard` | `[userId, status]` index | | **oui** | doctrine · beneficiary type possible mais rarement utilisé |
| `Product` / `ProductVariant` / `ProductEntitlementRule` | ✓ | seed + pricing | `code` unique | | **oui** | ajouter `ProductCode = ROOTS_COACH_ADDON` (validé · migration additive légère P4.4) · nom commercial « Suivi Racines » |
| `Household` | ✓ | `me/foyer`, `family/*` | `ownerUserId` FK | 1 owner | **oui** | pas de champ `name` explicite |
| `HouseholdMembership` | ✓ | `family/*` | `[householdId, userId]` unique | rôle `HouseholdRole = OWNER | ADULT` | **oui** | **enum manque `CHILD`** — les enfants vivent dans `ChildProfile` ou `DependentProfile` (deux modèles parallèles) |
| `DependentProfile` | présent, peu utilisé | (aucun endpoint direct) | `[householdId]`, `[managedByUserId]` | | ⚠ redondant avec `ChildProfile` | **déprécié P4** (RLS lecture seule, aucune écriture applicative, aucune suppression destructive · retrait effectif P5+) |
| `ChildProfile` | ✓ Racines Famille | `family/children`, `me/racines-dashboard`, `me/active-child` | `parentUserId` FK | | **oui** | pas de `householdId` → un enfant existe hors foyer aujourd'hui |
| `Class` | ✓ V2 unifiée | `me/racines-dashboard` (rare), `discover/class`, back-office | `providerUserId` FK, `[language, level]` index | `classType = TEACHER | CAREER_COACH | CENTER` | **oui** | conflit sémantique avec `Classroom` legacy — voir §12 |
| `ClassMembership` | ✓ | idem | `[classId, userId]` unique | rôle `ClassMemberRole = LEARNER | TEACHER | COACH` | **oui** | pas de champ `centerId` — un centre ne peut pas hériter d'appartenance |
| `Thread` | ✓ (embryonnaire) | non exposé côté produit | `classId` FK | `threadType = MAIN | ANNOUNCEMENT | ASSIGNMENT | ONE_TO_ONE` | ⚠ réutilisable pour Monde seulement (voir §7) |
| `Message` | ✓ | non exposé | `threadId` + `authorUserId` FKs | `messageType = TEXT | AUDIO` (audioUrl déjà présent) | ⚠ Monde uniquement |
| `ClassAssignment` | ✓ | back-office | `classId` FK | `dueAt` optionnel | **oui** | pas de `type` (annonce vs devoir vs invitation orale) |
| `Submission` | ✓ | back-office | `[assignmentId, userId]` unique | `body`, `audioUrl` déjà présents | **oui** | pas de `status` (ASSIGNED / SUBMITTED / IN_REVIEW / …) |
| `ClassFeedback` | ✓ | back-office | `submissionId` FK, `authorUserId` FK | | ⚠ **manque `audioUrl`** — migration additive P4.5 |
| `Notification` | modèle présent, non câblé | jamais lue en runtime | `[userId, isRead]` index | | **oui** | vide en production ; à câbler en P4.7 |
| `Classroom` (legacy) | ✓ pages `/classroom/*` | `classroom/*`, `teacher/classrooms` | `teacherId`, `code` unique | | ⚠ **coexiste** avec `Class` | à **archiver** en P5 mais garder read-only en P4 |
| `ClassroomEnrollment` (legacy) | ✓ | `classroom/join`, `teacher/*` | `[classroomId, userId]` unique | | ⚠ | idem |
| `Assignment` / `AssignmentSubmission` (legacy) | ✓ back-office | `teacher/assignments` | `[assignmentId, userId]` unique | | ⚠ | idem |
| `LanguageCenter` | ✓ | `center/*`, `discover/center/[centerId]` | `code` unique | `maxAdmins` int | **oui** | pas de FK inverse depuis `User.centerId` — soft link |
| `Teacher` | ✓ | `teacher/*`, `apply/teacher` | `userId` FK, `centerId` FK optionnel | | **oui** | seul modèle "provider" typé (pas de `Coach`) |
| `ProviderProfile` | présent | non exposé côté user | `userId` unique | | **oui** | peut porter les métadonnées coach Racines P4.4 |

### Modèles totalement absents

- `Coach`, `CoachProfile`, `CoachAssignment` (rattachement coach-cercle)
- `Circle`, `CircleMembership`, `CircleMessage`, `CircleReadState`, `CircleAssignment`, `CircleSubmission`, `CircleFeedback`, `CircleInvitation`
- `MessageReadState`, `MessageReaction`, `MessageReport` (modération / read receipts)
- `AuditEvent` (§24)
- `StorageObject` (métadonnées upload, MIME, taille, TTL)
- Enum `ClassMemberRole` n'inclut pas `CENTER_ADMIN` — cette permission passe par `AppRole = CENTER_ADMIN` + `User.centerId`.
- Enum `AppRole` n'inclut pas encore `RACINES_COACH` — à ajouter en migration additive P4.4 (aucune suppression, ajout de valeur uniquement).
- Enum `ProductCode` n'inclut pas encore `ROOTS_COACH_ADDON` — à ajouter en migration additive P4.4 (nom commercial · « Suivi Racines »).

### Cascades sensibles à surveiller

- `User.onDelete = Cascade` → propage sur `ChildProfile`, `HouseholdMembership`, `LearningPath`, `Order`, tous les messages / feedbacks. La suppression d'un professeur détruit tous ses `Class`, `ClassMembership`, `Thread`, `Message`, `ClassAssignment`, `Submission`, `ClassFeedback` en cascade. **Pas de soft-delete**. Doit être traité par une convention applicative en P4.7 (`status = ARCHIVED` plutôt que `DELETE`).
- `AccessGrant` FKs utilisent `NoAction` (bien).
- `Household.onDelete = Cascade` supprime `DependentProfile`, `HouseholdMembership`, mais pas `ChildProfile` (relié uniquement au parent, pas au foyer) — asymétrie à documenter.

### Indexes / uniques manquants critiques

- Pas d'index sur `User.centerId` → toute requête « membres du centre X » scanne la table users.
- Pas d'index composite sur `ClassMembership(classId, role)` → filtres teacher-only / student-only scannent la table.
- Pas d'index sur `Thread(classId, threadType)` → filtrer annonces vs devoirs = scan.
- Pas de `@@unique([householdId, activeChildId])` → possible désynchronisation profil actif.

---

## 4. Inventaire des routes et APIs

### Pages sensibles avec mocks résiduels

Chemins **exacts** (à traiter en P4.3a REMOVE_MOCK / P4.3b REPLACE) :

| Fichier | Lignes | Mock | Rendu comme réel ? |
|---|---|---|---|
| `src/app/[locale]/center/students/page.tsx` | 23-40 | `STUDENTS`, `PENDING` (Marie Nguemo, Paul Atangana, Diane Biya…) | oui |
| `src/app/[locale]/center/teachers/page.tsx` | 21-29 | `MOCK_TEACHERS` (Dr. Beatrice Momo, Sophie Tanda…) | oui |
| `src/app/[locale]/classroom/[classroomId]/page.tsx` | 12-59 | `MOCK_CLASS`, `MOCK_MEMBERS`, `MOCK_LEADERBOARD`, `MOCK_FEED`, `RECENT_ACTIVITY` | oui |
| `src/app/[locale]/classroom/[classroomId]/assignment/[assignmentId]/page.tsx` | 38-70 | `MOCK_ASSIGNMENTS`, `MOCK_QUIZ` | oui |
| `src/app/[locale]/teacher/students/page.tsx` | 21-35 | `LEARNERS` (Fatima Oumarou, Alice Fotso, Rodrigue Essama) | oui |
| `src/app/[locale]/teacher/students/[studentId]/page.tsx` | 61-100+ | `MOCK_STUDENT`, `MOCK_COURSE_PROGRESS`, `MOCK_SESSIONS`, `MOCK_QUIZ_ATTEMPTS`, `SCORE_EVOLUTION` | oui |
| `src/app/[locale]/teacher/courses/page.tsx` | 29-33 | `CLASSES` (modal court) | oui |
| `src/app/[locale]/discover/center/[centerId]/page.tsx` | 20-44 | `CENTERS`, `CENTER_CLASSES` (Institut Lingua Plus, Deutsch Pro CM) | oui |
| `src/app/[locale]/discover/class/[classroomId]/page.tsx` | 39-52 | `MOCK_REVIEWS`, `MOCK_PROGRAMME` (Amina K., Jean-Paul M., Fatou D.) | oui |
| `src/app/[locale]/discover/group/[groupId]/page.tsx` | 41-53 | `MOCK_ACTIVITIES`, `MOCK_RULES` | oui |
| `src/app/[locale]/onboarding/teacher/page.tsx` | 8-57 | `MOCK_CENTERS` (mêler `CITIES`/`LEVELS`/`DIPLOMAS` qui sont légitimes) | oui |

### Classification P4 des routes principales

| Route | Rôle attendu | Données réelles | Mock | API | Protection serveur | Action P4 |
|---|---|---|---|---|---|---|
| `/api/family/children` GET·POST | PARENT | ✅ Prisma `ChildProfile` filtré `parentUserId` | non | oui | ✅ getParent() serveur | KEEP |
| `/api/family/children/[id]` GET·PATCH·DELETE | PARENT | ✅ | non | oui | ✅ ownership vérifiée | KEEP |
| `/api/me/racines-dashboard` GET | STUDENT | ✅ `AccessGrant + ChildProfile + user_metadata` | non | oui | ✅ role STUDENT + ownership | KEEP |
| `/api/me/monde-dashboard` GET | STUDENT | ✅ | non | oui | ✅ | KEEP |
| `/api/me/active-child` GET·POST | PARENT | ✅ user_metadata + ownership `ChildProfile` | non | oui | ✅ | KEEP |
| `/api/teacher` GET·POST | TEACHER · ADMIN | mixte (mocks côté page) | oui | oui | ✅ role check | REFACTOR_LIMITED |
| `/api/center` GET·POST | CENTER · ADMIN | mixte | oui | oui | ✅ isCenterManager | REFACTOR_LIMITED |
| `/api/center/join` POST | tous | rejoint via `code` | non | oui | ✅ auth | KEEP |
| `/api/classroom` GET·POST | authent | Prisma existant | oui | oui | ✅ auth | REFACTOR_LIMITED |
| `/api/classroom/join` POST | authent | code | non | oui | ✅ | KEEP |
| `/api/classroom/check-code/[code]` GET | authent | Prisma | non | oui | ✅ | KEEP |
| `/api/courses` GET·POST | ADMIN pour POST | Prisma | non | oui | ⚠ à durcir (aucune garde visible sur GET) | LOCK_HONESTLY |
| `/api/notifications` GET·POST | authent | modèle vide en prod | oui (implicite) | oui | ⚠ non testé | CONNECT en P4.7 |
| `/api/notifications/email` · `/inapp` POST | interne | placeholder | oui | oui | ⚠ | POST_P4 (P5 emails) |
| `/api/discover` GET | anonyme | oui, Prisma limité | oui (mocks côté page) | oui | pas d'ownership (public) | REFACTOR_LIMITED |
| `/api/social` GET | authent | inconnu | à vérifier | oui | ⚠ | REFACTOR_LIMITED |
| `/api/admin/applications` GET·POST | ADMIN | Prisma | non | oui | ✅ requireAdmin | KEEP |
| `/api/admin/applications/accredit` POST | ADMIN | Supabase admin | non | oui | ✅ service role + guard | KEEP |
| `/api/upload/video-url` POST | TEACHER · CENTER · ADMIN | Supabase Storage `course-videos` | non | oui | ✅ role + service role signé | KEEP + policy TTL P4.5 |
| `/api/language/switch` POST | authent | user_metadata | non | oui | ⚠ **service role inutile pour auto-update** | REFACTOR_LIMITED |
| `/api/dev/*` | dev | mock | oui | oui | ✅ NODE_ENV guard | KEEP (dev-only) |
| `/api/roles/*` grant·revoke·list | ADMIN | Prisma + syncMetadata | non | oui | ✅ | KEEP |
| `/api/coach/*` | COACH | **route absente** | – | – | – | MISSING (P4.4) |
| `/api/circles/*` | PARENT · COACH · CHILD | **route absente** | – | – | – | MISSING (P4.2) |
| `/api/assignments/*` (canonical) | TEACHER · COACH · STUDENT · PARENT | **route absente** | – | – | – | MISSING (P4.5) |
| `/api/messages/*` (canonical) | authent scoped | **route absente** | – | – | – | MISSING (P4.6) |

### Absences totales

- Aucun endpoint sous `/api/coach/*` (cohérent, la console coach est marquée « Bientôt disponible » par la doctrine P3).
- Aucun endpoint sous `/api/circles/*`.
- Aucun endpoint canonique `/api/messages`, `/api/assignments`, `/api/submissions`, `/api/feedback` — les back-office actuels passent par `/api/teacher` (générique).
- Aucun endpoint `/api/coach/circles`, `/api/coach/productions`, `/api/coach/feedback`.

---

## 5. Architecture Circle · pseudo-schéma (Option A imposée)

> La décision A vs B est **figée**. Ce paragraphe ne rouvre pas le choix ; il détaille les entités additives à créer en P4.1 / P4.5 / P4.6. **Aucun `schema.prisma` n'est modifié dans cet audit.**

### 5.1 Entités obligatoires (P4.1)

#### `Circle` — unité de vie Racines privée

```
Circle {
  id             cuid PK
  householdId    → Household (onDelete: Cascade)  UNIQUE (1 seul Circle par foyer par langue)
  language       LanguageCode
  status         CircleStatus (ACTIVE | ARCHIVED)  default ACTIVE
  coachUserId?   → User (onDelete: SetNull)        -- coach principal, nullable si en attente
  activeAt       DateTime                          -- premier passage à ACTIVE
  createdAt      DateTime @default(now())
  archivedAt?    DateTime

  @@unique([householdId, language])                -- contrainte capacité §8
  @@index([coachUserId, status])                   -- « mes cercles » côté coach
}
```

**Enum** ·

```
CircleStatus {
  ACTIVE
  ARCHIVED
}
```

**Responsabilité** · représenter le foyer en tant que groupe pédagogique privé par langue. Un `Household` peut avoir plusieurs `Circle` s'il apprend plusieurs langues (`kikongo` + `swahili` → 2 Circles).

**Ownership** · le `Household.ownerUserId` est l'autorité première ; le `coachUserId` est un membre professionnel invité, jamais propriétaire.

**Archivage** · `status = ARCHIVED` + `archivedAt`. Jamais `DELETE`. Les messages / feedback restent pour audit.

**Comportement en cas de suppression du `Household`** · `onDelete: Cascade` — le Circle est effacé (aucune donnée hors foyer ne subsiste). Les messages étant liés au Circle, ils tombent avec le Circle. Décision à valider (§Décisions ouvertes P4-Q7).

#### `CircleMembership` — appartenance typée au cercle

```
CircleMembership {
  id             cuid PK
  circleId       → Circle (onDelete: Cascade)
  userId?        → User (onDelete: Cascade)         -- adulte (parent, adulte invité, coach)
  childProfileId? → ChildProfile (onDelete: Cascade) -- enfant (via son profil, jamais authentifié)
  role           CircleRole                          -- OWNER | ADULT | CHILD | COACH
  status         CircleMembershipStatus              -- INVITED | ACTIVE | REVOKED
  invitedByUserId? → User (onDelete: SetNull)
  invitedAt      DateTime @default(now())
  joinedAt?      DateTime
  revokedAt?     DateTime

  @@unique([circleId, userId, childProfileId])       -- pas de doublon
  @@index([circleId, role, status])                  -- listage membres actifs par rôle
  @@index([userId, status])                          -- « mes cercles » côté adulte / coach
  @@index([childProfileId, status])                  -- « mon cercle » côté enfant
}
```

**Enums** ·

```
CircleRole {
  OWNER   -- 1 exactement, correspond à Household.ownerUserId
  ADULT   -- 0 ou 1 (règle §8 : 2 adultes max = OWNER + ADULT)
  CHILD   -- 0 à 4 (règle §8)
  COACH   -- 0 ou 1 (règle §8, active)
}

CircleMembershipStatus {
  INVITED  -- lien envoyé, acceptation pending
  ACTIVE   -- membre actif
  REVOKED  -- retiré, conservé pour audit
}
```

**Contrainte structurelle** · `userId XOR childProfileId` (jamais les deux à la fois). À enforcer par un `CHECK` Postgres en migration P4-M1.

#### `CircleMessage` — message dans le fil privé du cercle

```
CircleMessage {
  id             cuid PK
  circleId       → Circle (onDelete: Cascade)
  authorMembershipId → CircleMembership (onDelete: Cascade)  -- source de l'auteur (rôle + qui)
  messageType    CircleMessageType     -- TEXT | AUDIO | ANNOUNCEMENT
  body?          String
  audioObjectId? → StorageObject (onDelete: Restrict)         -- proposé §19
  createdAt      DateTime @default(now())
  editedAt?      DateTime
  deletedAt?     DateTime                                     -- soft-delete, contenu masqué UI
  deletedByMembershipId? → CircleMembership (onDelete: SetNull)

  @@index([circleId, createdAt])                              -- pagination fil
  @@index([circleId, deletedAt])
}
```

**Enum** ·

```
CircleMessageType {
  TEXT
  AUDIO
  ANNOUNCEMENT     -- épinglable, rédigé OWNER / COACH
}
```

**Soft-delete** · un message supprimé garde son enveloppe (`deletedAt`, `deletedByMembershipId`) mais son contenu (`body`, `audioObjectId`) est **effacé physiquement** (voir §11 doctrine).

### 5.2 Entités recommandées mais reportables (P4.5-6)

Non créées en P4.1, à cadrer sous-lot par sous-lot :

- `CircleInvitation` (jeton d'invitation adulte externe · P4.2)
- `CircleAssignment` / `CircleSubmission` / `CircleFeedback` (parcours devoirs Racines · P4.5)
- `CircleReadState` (compteurs unread · P4.6)
- `CircleAttachment` (pièces jointes hors audio · P4.6, optionnel)

L'objectif est de ne **pas** dupliquer `ClassAssignment` / `Submission` / `ClassFeedback`. En revanche, la sécurité mineurs impose des tables **distinctes**, pas des colonnes discriminantes. Voir §12.

### 5.3 Champs / relations sur les modèles existants

Aucune migration destructive. Additifs éventuels sur modèles existants, à trancher en P4-M1 :

- `Household.name?` (nom d'affichage foyer) — cosmétique, optionnel.
- `ClassFeedback.audioUrl?` (obligatoire pour feedback vocal — voir MSG-04 gap analysis).
- `ChildProfile.householdId?` (rattacher explicitement enfant au foyer, éviter les orphelins).
- `HouseholdMembership.status` déjà présent — étendre l'enum si besoin d'un `INVITED` transitoire (à trancher P4.2).

---

## 6. Contraintes Circle — mise en œuvre

| Règle | Contrainte SQL | Transaction serveur | Validation API | Test concurrence |
|---|---|---|---|---|
| 4 enfants max par foyer | ✗ (COUNT non exprimable en `CHECK`) | Transaction avec `SELECT count() FOR UPDATE` sur `ChildProfile WHERE parentUserId = ?` | ✅ déjà en place `POST /api/family/children` (409 `max_children_reached`) | À écrire · deux `POST` simultanés doivent se sérialiser |
| 2 adultes max par foyer | ✗ | Transaction identique sur `HouseholdMembership WHERE householdId = ? AND role = ADULT` | À créer en P4.2 | À écrire |
| 1 coach max par Circle | ✅ partiel · index unique conditionnel `@@unique([circleId]) WHERE role = COACH AND status = ACTIVE` (à écrire manuellement en `CREATE UNIQUE INDEX ... WHERE ...`) | + validation API | ✅ | À écrire |
| 1 langue principale par Circle | ✅ colonne `language` non nullable + `@@unique([householdId, language])` | – | ✅ (rejet si langue déjà utilisée par un autre cercle du foyer) | ✅ contrainte native |
| 1 Circle actif max par (foyer, langue) | ✅ via `@@unique([householdId, language])` **si** on n'admet pas deux Circles historiques (archivé + actif) sur même langue. Sinon partiel via `WHERE status = ACTIVE` | + validation API | ✅ | ✅ |
| 1 coach peut piloter plusieurs Circles | Aucune contrainte négative à poser — c'est le comportement par défaut | – | – | – |
| 4 langues max par enfant | ✗ (JSON) | Validation applicative existante `POST /api/family/children` (400 `too_many_langues`) | ✅ | ✅ (déjà couvert) |

### Codes d'erreur stables à figer P4.1

| Code | HTTP | Signification |
|---|---|---|
| `max_children_reached` | 409 | déjà utilisé en P3 |
| `max_adults_reached` | 409 | à créer P4.2 |
| `coach_already_assigned` | 409 | à créer P4.2 |
| `language_circle_exists` | 409 | à créer P4.1 |
| `child_not_in_circle` | 404 | à créer P4.2 |
| `circle_archived` | 410 | à créer P4.6 |
| `not_a_circle_member` | 403 | à créer P4.6 |
| `not_a_circle_owner` | 403 | à créer P4.2 |
| `coach_not_assigned_to_circle` | 403 | à créer P4.4 |

Concurrence · toutes les writes de membership doivent utiliser `Prisma.$transaction([..., { isolationLevel: 'Serializable' }])` ou un lock avancé (`SELECT ... FOR UPDATE`) pour éviter les race conditions décrites en §30.

---

## 7. Classroom Monde vs Circle Racines · pourquoi deux tables

La décision A du P3 a été prise sur la base des points ci-dessous. L'audit confirme.

| Sujet | Classroom / Class Monde | Circle Racines |
|---|---|---|
| Propriétaire | `Class.providerUserId` (professeur) ou `Classroom.teacherId` | `Household.ownerUserId` (parent) |
| Membres | `ClassMembership` avec rôles `LEARNER`, `TEACHER`, `COACH` (Career Coach) | `CircleMembership` avec `OWNER`, `ADULT`, `CHILD`, `COACH` (Racines) |
| Mineurs | jamais (public par code) | **cœur** du produit (2 adultes + 4 enfants) |
| Teacher / Coach | typé `TEACHER` global via `AppRole` + adhésion classe | `COACH` local au cercle, disjoint de `TEACHER` |
| Assignments | `ClassAssignment` / `Submission` / `ClassFeedback` | `CircleAssignment` / `CircleSubmission` / `CircleFeedback` (P4.5) |
| Messages | `Thread` + `Message` (déjà en base, `MessageType = TEXT | AUDIO`) | `CircleMessage` (créer en P4.6) |
| Audio | `Message.audioUrl` — URL string, pas de policy | `CircleMessage.audioObjectId` → `StorageObject` avec URLs signées TTL |
| Progression | `ModuleProgress` par élève (existant) | `ChildProfile.langues[i].echelle` (existant, É1-É5) |
| Centre | `LanguageCenter` → `Teacher` → `Classroom` | non applicable |
| Visibilité parent | non pertinente (adultes uniquement) | **obligatoire** : parent voit tous les échanges où son enfant est concerné |

### Composants et services partageables sans risque

- Layout `Layout`, primitives UI (`Portrait`, `StateBlock`), navigation `TopBar`.
- Player audio (`AudioPlayer`).
- Éditeur d'annotation, dès qu'il existera (P4.5).
- Helper `signStorageUrl(objectKey, ttlSeconds)`.

### Services à **ne pas** partager

- Endpoint messagerie : `/api/classrooms/[id]/messages` vs `/api/circles/[id]/messages` — routes séparées, contrats HTTP identiques, logique d'autorisation différente.
- Endpoint feedback : idem.
- Fonction d'ownership : `assertClassMembership()` vs `assertCircleMembership()`.

### Abstractions à éviter absolument

- Table `SocialSpace { type: CLASS | CIRCLE, ... }` polymorphique — augmente la surface de bug, complique RLS, brouille les permissions mineurs.
- Table `Conversation` générique remplaçant `Thread` et `CircleMessage` — même problème.
- Enum `MessageAudience` avec valeurs mixtes — les frontières doivent être structurelles.

---

## 8. Sécurité mineurs · résumé (détail dans `THREAT_MODEL.md`)

Résumé cadré ici pour référence dans les décisions produit :

- **Zéro DM adulte↔enfant privé**. Les seuls contextes d'échange autorisés sont `Circle` (fil visible OWNER + ADULT + tous COACH assignés + CHILD concerné) et `Class` Monde (adultes uniquement, mineurs interdits).
- **Coach ne contacte jamais un enfant hors cercle**. `CircleMessage` vérifie `authorMembership.circleId === message.circleId` côté serveur.
- **Coach visible parent** obligatoire. Toute écriture COACH incrémente `CircleReadState` pour tous les OWNER / ADULT du cercle.
- **Nom d'affichage** enfant limité au prénom + animal (déjà en place `ChildProfile.prenom`, `avatarAnimal`). Aucune date de naissance exposée aux professionnels (garder `age` int uniquement).
- **Voix enfant** stockée sous URL signée courte durée (proposé §19), jamais publique.
- **Journalisation** minimale audit-only, sans texte du message.

---

## 9. Console Teacher Monde · exigences P4.3b

Basé sur `YEMA_PRODUCT_DESIGN_DOCTRINE.md §25.1` et `YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md §Lot P4-1 P4-2`.

Le teacher DOIT pouvoir :

- Voir ses classes assignées (`Class` où `ClassMembership.role = TEACHER` **ou** `Class.providerUserId = teacher.userId` **ou** `Classroom.teacherId = teacher.id`).
- Voir les étudiants de ces classes uniquement.
- Créer / éditer / publier un `ClassAssignment` sur ses classes.
- Voir les `Submission` associées à ses `ClassAssignment`.
- Écrire un `ClassFeedback` (texte + audio après migration P4.5).
- Envoyer une annonce dans un `Thread` de type `ANNOUNCEMENT` de sa classe.
- Voir la progression pédagogique limitée : dernière connexion, dernier module complété, moyennes.

Le teacher NE DOIT PAS :

- Voir la table `users` globale.
- Voir un autre centre.
- Modifier un `AccessGrant`.
- Voir un paiement.
- Accéder à un `Circle` Racines.
- Voir un `ChildProfile` (aucune raison métier).
- S'auto-ajouter à une `Class` (uniquement provider ou admin).

La matrice complète est dans `YEMA_P4_PERMISSION_MATRIX.md §Teacher`.

---

## 10. Console Coach Racines · exigences P4.4

Basé sur `YEMA_PRODUCT_DESIGN_DOCTRINE.md §Suivi humain Racines §3` et `YEMA_P3_ROOTS_FAMILY.md §Coach panel`.

Console **totalement séparée** de la console Teacher :

- Routes distinctes `/coach/*` (jamais `/teacher/*`).
- Rôle applicatif **`AppRole = RACINES_COACH`** (nouveau, jamais `CAREER_COACH`). Ajout de valeur d'enum en migration additive P4.4.
- Le coach voit uniquement ses `Circle` (via `CircleMembership.role = COACH AND status = ACTIVE`).
- Le coach voit uniquement · prénom / nom d'affichage + données pédagogiques minimales (langue active, étape É, productions du cercle). Jamais nom de famille, email, téléphone, adresse, école (Q4 validée).
- Tous les échanges coach-enfant restent visibles au parent OWNER + ADULT du même Circle (Q5 validée).
- Feedback texte + audio (`CircleFeedback` P4.5 avec `storageObjectId`, immutable · Q13).
- Vue quotas · `productionsThisMonth / 8`, `productionsThisWeek / 2`, `sessionsThisMonth / 1`.
- Vue capacité coach · `activeProfiles / 20` + `activeCircles / 10` (Q15 validée).
- Retrait coach = accès immédiatement révoqué · historique conservé attribué (Q10 validée).

Le coach NE DOIT PAS :

- Voir tous les foyers.
- Rechercher librement `ChildProfile` (aucun endpoint `/api/children/search`).
- Écrire dans un DM privé (Q5 · aucun sous-fil coach-enfant).
- Modifier `HouseholdMembership`.
- Voir un `AccessGrant`.
- Changer `Circle.language` (Q8 · immutable).
- S'auto-assigner à un `Circle` (seul un admin ou l'OWNER via workflow d'acceptation).

**Compatibilité avec la doctrine « Suivi Racines »** (produit `ROOTS_COACH_ADDON` · 30 000 XAF / 45 € · 8 productions / mois · 2 / semaine · oral 3 min · écrit 250 mots · session 30 min / mois · délai cible 48 h ouvrées · capacité coach 20 profils / 10 Circles) :

- Quotas enforced applicatif en P4.4 · non par la DB (fenêtres glissantes).
- Capacité coach Q15 enforced applicatif · 409 `coach_capacity_reached` avec dimension `profiles` ou `circles`.
- Feature flag `RACINES_COACH_OPERATIONAL = false` par défaut jusqu'à P4.4 + validation contenus + rétention audio Q7 (validation juridique).

La matrice complète est dans `YEMA_P4_PERMISSION_MATRIX.md §Coach`.

---

## 11. Espaces Center · connexion données réelles P4.3a

Pages actuelles à retravailler en priorité (fichiers listés §4) :

- `src/app/[locale]/center/students/page.tsx` — remplacer `STUDENTS`/`PENDING` par `getCenterStudents(centerId)` + `getCenterPendingEnrollments(centerId)`.
- `src/app/[locale]/center/teachers/page.tsx` — remplacer `MOCK_TEACHERS` par `getCenterTeachers(centerId)`.
- `src/app/[locale]/center/classes/page.tsx` — vérifier absence de mock ; câbler `getCenterClasses(centerId)`.
- `src/app/[locale]/discover/center/[centerId]/page.tsx` — `CENTERS`, `CENTER_CLASSES` : remplacer par lecture Prisma `LanguageCenter + Classroom + Class` scopée sur `centerId` param + `isVerified`.

### Nouveau seam `src/lib/data/center.ts` (à créer P4.3a)

Fonctions minimales scopées serveur :

- `getCenterForUser(userId)` — résout `centerId` depuis `User.centerId` ou `Teacher.centerId`, retourne `LanguageCenter | null`.
- `getCenterStudents(centerId)` — join `Classroom.centerId → ClassroomEnrollment → User`, distinct.
- `getCenterTeachers(centerId)` — `Teacher WHERE centerId = ?`.
- `getCenterClasses(centerId)` — `Classroom WHERE centerId = ?` + (optionnel) `Class WHERE classType = CENTER AND organizationId = ?`.
- `getCenterPendingEnrollments(centerId)` — `ClassJoinRequest WHERE status = PENDING AND classroom.centerId = ?`.

Chaque fonction rejette 403 si `centerId` ≠ celui résolu du session user (test cross-centre obligatoire).

### États d'affichage attendus (contrats produit)

- **Loading** · squelette + fallback `<StateBlock title=... body=...>`.
- **Empty** · pas d'étudiant / enseignant / classe rattachée → CTA « Inviter un enseignant », « Créer une classe ».
- **Error** · 403 réseau → `<StateBlock role="alert" title="Accès refusé" body="Ce centre ne t'appartient pas.">`.

Aucune donnée hors du centre ne doit jamais apparaître.

---

## 12. Assignments / Submissions / Feedback

### Ce qui existe

- `ClassAssignment` · `id, classId, title, description?, dueAt?, createdAt`.
- `Submission` · `id, assignmentId, userId, body?, audioUrl?, submittedAt` · unique `[assignmentId, userId]`.
- `ClassFeedback` · `id, submissionId, authorUserId, score?, body?, createdAt` — **manque `audioUrl`**.

### Ce qui manque pour P4.5

- **Statut** sur `Submission` · `SubmissionStatus = ASSIGNED | SUBMITTED | IN_REVIEW | FEEDBACK_READY | REVISION_REQUESTED | COMPLETED`. Ajouter en migration additive `+ status SubmissionStatus @default(ASSIGNED)`.
- **`audioUrl` sur `ClassFeedback`** · migration M3 (`ALTER TABLE class_feedback ADD COLUMN audio_url TEXT`, `+ storage_object_id TEXT?`).
- **`type` sur `ClassAssignment`** · optionnel · `ClassAssignmentType = HOMEWORK | ANNOUNCEMENT | ORAL_INVITATION`.
- **Immutabilité feedback** (Q13 validée) · aucune route `PATCH /api/feedback/[id]`. Correction complémentaire = **nouvelle ligne** `class_feedback` / `circle_feedback` avec `addendumOfFeedbackId?` pointant sur la version précédente. UI affiche la version la plus récente + badge.
- **Discussion parent-coach** (Q14 validée) · le parent répond dans le **fil du Circle**, jamais en DM. `CircleFeedback.discussionThreadId?` optionnel · à la publication du feedback, un `CircleMessage` d'introduction est posté dans le fil général du Circle.
- **Visibilité parent** · pour les élèves mineurs, `Submission.userId` peut pointer sur un User adulte-parent OU un dispositif Circle plus tard. Pour Monde public, non applicable ; pour Racines, séparer via `CircleSubmission` (voir §12.3).

### Peut-on unifier Monde et Racines ?

**Non**. Cette question a été posée en gap analysis MSG-01 et tranchée dans `YEMA_P3_CIRCLE_DECISION.md` §Option A : les modèles doivent rester séparés (`Class{Assignment,Submission,Feedback}` vs `Circle{Assignment,Submission,Feedback}`). L'ambiguïté d'ownership d'un même modèle serait ingérable pour les mineurs.

Les deux ensembles partagent la même **forme** (statut, feedback texte + audio, unicité par utilisateur) mais des **frontières d'autorisation différentes** :

- `ClassAssignment` : accessible à tout `ClassMembership.role = LEARNER` de la `Class`.
- `CircleAssignment` : accessible uniquement aux `CircleMembership.role = CHILD` du `Circle`, avec visibilité `OWNER` + `ADULT` + `COACH` du même Circle.

### 12.3 Feedback humain — cycle

```
ASSIGNED
 → SUBMITTED         (student POST)
 → IN_REVIEW          (teacher/coach GET l'ouverture)
 → FEEDBACK_READY     (teacher/coach POST feedback)
 → REVISION_REQUESTED (teacher/coach demande retravail)
 → COMPLETED          (student marque comme lu, ou timeout)
```

- Transition serveur uniquement, jamais client-driven.
- Chaque transition inscrite dans `AuditEvent` (§24 THREAT_MODEL).
- Feedback édition post-publication : à trancher (Q13). Recommandation : **immutable**, avec possibilité d'ajouter un `ClassFeedback` supplémentaire lié au même `Submission`.

---

## 13. Messagerie fermée · Classe Monde + Circle Racines

**Aucune messagerie publique, aucun DM 1:1.** Deux types d'espace fermé :

- **Classe Monde** · fil `Thread` déjà en place, à câbler côté produit en P4.6. Types : `MAIN` (fil général), `ANNOUNCEMENT` (annonces professeur), `ASSIGNMENT` (fil autour d'un devoir).
- **Circle Racines** · `CircleMessage` (à créer P4.6). Types : `TEXT`, `AUDIO`, `ANNOUNCEMENT`.

Le type `ONE_TO_ONE` déjà présent dans `ThreadType` est un risque · il pourrait ouvrir une messagerie privée prof↔élève. **Traitement P4.6 (aucune suppression destructive en P4)** ·

- Enum `ThreadType.ONE_TO_ONE` **déprécié** (commentaire `@deprecated` dans schema).
- Nouvelles créations **interdites** côté API · toute `POST /api/*/threads` avec `threadType = "ONE_TO_ONE"` retourne 400 `thread_type_deprecated`.
- Routes correspondantes désactivées · aucun `/api/*/threads/one-to-one/*` créé, aucun composant produit ne l'utilise.
- Données historiques auditées via `SELECT COUNT(*) FROM threads WHERE thread_type = 'ONE_TO_ONE'` (metrics uniquement, migration M5).
- Suppression destructive de la valeur d'enum reportée à une migration ultérieure P5+.

### Tables minimales nécessaires

Déjà en place · `Thread`, `Message`.

À créer :

- `CircleMessage` (§5).
- `CircleMessageReadState { circleMessageId, membershipId, readAt }` unique · pour compteur unread par membre.
- `ClassMessageReadState` similaire pour Monde (P4.6, optionnel selon besoin produit).
- `MessageReport { targetType: CLASS|CIRCLE, targetId, reporterUserId, reason, status, resolvedByUserId, resolvedAt }` · pour modération de contenu (P4.7).

### Édition, suppression, modération (Q11 validée)

Workflow à 4 niveaux ·

- **Auteur** · rétractation sous **15 minutes** post-envoi (soft-delete contenu · endpoint `DELETE /api/circles/[cid]/messages/[mid]`).
- **OWNER** · peut **masquer** un message à tout moment sur son Circle (soft-hide réversible sur 24 h · endpoint `POST /api/circles/[cid]/messages/[mid]/hide`).
- **Coach** · peut **signaler** un message inapproprié (`MessageReport` avec `reason`, `status = PENDING` · endpoint `POST /api/messages/[mid]/report`).
- **Admin** · peut **supprimer exceptionnellement** avec audit obligatoire (endpoint `DELETE /api/admin/messages/[mid]`, requiert `reason`, `AuditEvent.MESSAGE_DELETED`).
- Édition · possible dans les 15 minutes post-envoi, sinon interdit. Ajouter `Message.editedAt?` (déjà partiellement modélisable).
- Soft-delete · contenu vidé physiquement, enveloppe conservée avec `deletedAt` + `deletedByMembershipId` pour audit.

### Lecture messages par le Center (Q12 validée)

- Par défaut · le Center **ne lit pas** les conversations de classe.
- Accès exceptionnel · réservé au **rôle safeguarding** (à créer P5) **avec audit obligatoire**.
- Implémentation P4 · RLS `messages` `SELECT` conditionné à `is_class_member(...) OR (is_center_admin(center_id, auth.uid()) AND has_safeguarding_role(auth.uid()))`. En P4, `has_safeguarding_role` retourne toujours `false` (rôle non créé) → aucun Center admin ne lit de message pendant tout P4.

### Rate limiting

Aucune infrastructure de rate limit n'existe côté API. À câbler en P4.7 avec un compteur Postgres simple par (userId, minute) ou middleware KV — décision P5.

---

## 14. Notifications

- Modèle `Notification` déjà en base (`id, userId, title, body, type, isRead, metadata, createdAt`) — jamais lu en production.
- À câbler en P4.7 uniquement sur événements réels :
  - `assignment.published` → tous les `ClassMembership.LEARNER` de la classe.
  - `feedback.ready` → l'élève auteur de la `Submission`.
  - `circle.message.new` → tous les membres actifs du cercle, sauf l'auteur.
  - `circle.coach.assigned` → OWNER + ADULT du cercle.
- Emails · reportés en P5 (endpoints existent en `POST /api/notifications/email` mais placeholder).
- Push mobile · reporté P7.
- **Aucune notification décorative**. Si une catégorie d'événement n'est pas encore produite, la préférence utilisateur n'apparaît pas.

---

## 15. Sécurité storage · audio et fichiers

Détail complet dans `YEMA_P4_THREAT_MODEL.md §Storage`. Résumé (posé dès P4.1 · aucune ouverture d'endpoint fichier tant que ces éléments ne sont pas en place) :

- **Buckets séparés** · `class-audio`, `class-attachment`, `circle-audio`, `circle-attachment`, `submission-audio`, `feedback-audio`. Un bucket pour productions enfants Racines **n'est jamais public**.
- **URLs signées** · `createSignedUrl(objectKey, ttl=600)` pour lecture, `createSignedUploadUrl` pour écriture. TTL court (10 minutes lecture, 5 minutes écriture).
- **MIME allow-list** · `audio/webm, audio/ogg, audio/mpeg, audio/mp4` pour audio · `image/jpeg, image/png, application/pdf` pour pièces jointes. Rejet server-side via MIME sniff.
- **Taille max** · audio 5 MB (couvre 3 min à 224 kb/s), pièce jointe 10 MB.
- **Durée audio** · 3 min pour production coach Racines · 3 min pour note vocale enfant Circle (Q6 validée) · 60 s pour note vocale classe Monde.
- **Métadonnées** · stockées dans le modèle `StorageObject` (créé en M1) · `id, bucket, key, mimeType, sizeBytes, uploadedByUserId, uploadedByMembershipId?, purpose, sha256?, retentionUntil, deletedAt?`.
- **Rétention** (Q7 validée · validation juridique requise avant activation `AUDIO_FEEDBACK_ENABLED = true`) ·
  - **90 jours** pour messages audio Circle post-retrait membership ou `archivedAt`.
  - **12 mois** pour productions (`Submission` / `CircleSubmission`) et feedbacks (`ClassFeedback` / `CircleFeedback`).
  - `StorageObject.retention_until` calculé automatiquement à l'upload · worker de purge quotidien à câbler P5.
- **Bucket actuel `course-videos`** · public — cohérent (vidéos de cours), mais aucune donnée user-generated ne doit y aller.

---

## 16. Audit + traçabilité

Aucun modèle `AuditEvent` n'existe. Proposition (migration P4-M5) :

```
AuditEvent {
  id            cuid PK
  actorUserId   → User (onDelete: SetNull)
  actorRole     AppRole
  action        AuditAction    -- enum contrôlé
  targetType    String         -- 'Circle', 'CircleMembership', 'ClassAssignment', ...
  targetId      String
  metadata      Json?          -- ex : { previous: {...}, next: {...} }
  createdAt     DateTime @default(now())

  @@index([targetType, targetId, createdAt])
  @@index([actorUserId, createdAt])
}

enum AuditAction {
  CIRCLE_CREATED
  CIRCLE_ARCHIVED
  CIRCLE_LANGUAGE_CHANGED       -- à interdire, mais tracer si autorisé
  CIRCLE_MEMBERSHIP_INVITED
  CIRCLE_MEMBERSHIP_ACCEPTED
  CIRCLE_MEMBERSHIP_REVOKED
  CIRCLE_COACH_ASSIGNED
  CIRCLE_COACH_UNASSIGNED
  CLASS_TEACHER_ASSIGNED
  CLASS_TEACHER_UNASSIGNED
  ASSIGNMENT_CREATED
  ASSIGNMENT_PUBLISHED
  FEEDBACK_CREATED
  MESSAGE_DELETED
  ATTACHMENT_DELETED
  ADMIN_IMPERSONATION_STARTED   -- exceptionnel
  ADMIN_IMPERSONATION_ENDED
}
```

Règle stricte · **jamais** stocker le corps d'un message ou l'URL audio dans `metadata`. Uniquement des identifiants et des transitions d'état.

---

## 17. Fichiers créés / modifiés dans cet audit

Créés :

- `docs/YEMA_P4_ARCHITECTURE_AUDIT.md` (ce document)
- `docs/YEMA_P4_PERMISSION_MATRIX.md`
- `docs/YEMA_P4_THREAT_MODEL.md`
- `docs/YEMA_P4_IMPLEMENTATION_PLAN.md`

Modifiés :

- `docs/YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md` (bloc P4 uniquement)

Aucun fichier source, aucune migration, aucun package, aucun schéma Prisma, aucun secret n'est touché.

---

## 18. Prochaines étapes

Voir `YEMA_P4_IMPLEMENTATION_PLAN.md` pour la décomposition P4.1 → P4.7, les feature flags, les migrations additives, les tests requis et les blockers de lancement.

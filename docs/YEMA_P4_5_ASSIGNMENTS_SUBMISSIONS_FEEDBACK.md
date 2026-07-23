# YEMA · P4.5 · Assignments · Submissions · Feedback

Espaces pédagogiques structurés **séparés strictement** ·

```text
Monde    · Teacher       → Classroom → Assignment       → AssignmentSubmission → AssignmentFeedback
Racines  · Roots Coach   → Circle    → CircleAssignment → CircleSubmission     → CircleFeedback
                                                       ↳ CircleSubmissionReply (fil parent–Coach Q14)
```

Doctrine · aucune polymorphie · aucune messagerie générale · aucun DM.

Ce document est structuré en **sous-lots** livrés séquentiellement · P4.5-A
livre les fondations (migrations, enums, capacity helpers, flags, error
codes, audit actions). Les sous-lots B/C/D/E livreront respectivement les
routes Monde, les routes Racines, le workflow storage 2-phase et l'UI
Teacher/Coach/Famille.

## Statut actuel · P4.5-A ✅

Livré ·

- 2 migrations SQL additives ·
  - `20260723000009_p4_5_assignments_submissions` · Monde V2 (Classroom + Assignment + AssignmentSubmission + `AssignmentFeedback` nouveau)
  - `20260723000010_p4_5_racines_productions_rls` · Racines (5 nouvelles tables + triggers immutabilité + RLS enable)
- Enums · `AssignmentType`, `AssignmentStatus`, `SubmissionStatus`, `FeedbackStatus`, `CircleAssignmentType`, `CircleAssignmentStatus`, `CircleSubmissionStatus`, `CircleFeedbackStatus`, `CircleSubmissionReplyRole`
- 15 nouvelles valeurs `AuditAction` · Monde + Racines + capacité + reply
- Capacity helpers Racines · `assertRootsAssignmentWeeklyCapacity`, `assertRootsAssignmentMonthlyCapacity`, `assertRootsSubmissionFormat`
- Convention temporelle UTC calendaire · `isoWeekBoundsUtc`, `utcMonthBounds`
- Codes d'erreur stables · `AssignmentError`, `SubmissionError`, `FeedbackError`, `StorageOwnershipError`, `WorkspaceAccessError` · liste blanche `P4_5_STABLE_ERROR_CODES` (30+ codes)
- Extension `ConcurrentUpdateError.code` · `concurrent_assignment_update` + `concurrent_submission_update`
- Flags · `ASSIGNMENTS_ENABLED` + `AUDIO_FEEDBACK_ENABLED` + helpers `isAssignmentsActive` / `isAudioFeedbackActive`
- Tests · 40 vitest (28 racines-production-capacity + 12 p4-5-structural)

Reporté vers les sous-lots suivants ·

- **P4.5-B** · services + APIs Teacher/Student (`/api/teacher/…`, `/api/student/…`)
- **P4.5-C** · services + APIs Racines (`/api/roots-coach/…`, `/api/circles/…/activities`, `.../replies`)
- **P4.5-D** · workflow storage 2-phase (upload intent + finalize serveur) + validation MIME/durée/ownership
- **P4.5-E** · UI Teacher (`/[locale]/teacher/assignments`), Coach (`/[locale]/coach/racines/activities`), Famille (namespace canonique)
- **P4.5-F** · tests concurrence + RLS/JWT 12 personas + immutabilité DB directe + runtime FR/EN + responsive + landing + fixtures + closure

## 1. Séparation stricte Monde / Racines

Deux graphes de modèles indépendants. Aucune colonne polymorphique
`ownerType`/`ownerId` reliant alternativement `Classroom` et `Circle`.

| Monde (V2) | Racines |
|---|---|
| `Classroom` (existant, P4.3b) | `Circle` (existant, P4.1) |
| `ClassroomEnrollment` | `CircleMembership` |
| `Assignment` (étendu P4.5) | `CircleAssignment` (nouveau P4.5) |
| — | `CircleAssignmentTarget` (ciblage individuel) |
| `AssignmentSubmission` (étendu P4.5) | `CircleSubmission` (nouveau P4.5) |
| `AssignmentFeedback` (nouveau P4.5) | `CircleFeedback` (nouveau P4.5) |
| — | `CircleSubmissionReply` (fil parent–Coach Q14) |

Un Teacher n'accède jamais à un `CircleAssignment`. Un Roots Coach n'accède
jamais à un `Assignment`. RLS `deny-by-default` sur toutes les nouvelles
tables · policies scopées introduites avec les routes API en P4.5-B/C.

## 2. Modèles Monde (V2 · additifs)

Choix V2 confirmé · le workspace Teacher P4.3b tourne sur `Classroom` +
`Assignment` + `AssignmentSubmission` (voir `src/lib/permissions/teacher.ts`).
V1 legacy (`ClassAssignment`/`Submission`/`ClassFeedback`) reste intouchée
et sera dépréciée en P5+.

### 2.1 `Assignment` (étendu)

Colonnes P4.5 ajoutées ·

- `type AssignmentType @default(WRITTEN)` · WRITTEN | AUDIO | MIXED
- `status AssignmentStatus @default(DRAFT)` · DRAFT | PUBLISHED | CLOSED | ARCHIVED
- `instructions String?`, `publishedAt`, `closedAt`, `archivedAt`
- `createdByTeacherId String?` FK vers `Teacher` (SET NULL)
- `updatedAt` timestamp

Index composites · `(classroomId, status)`, `(status, publishedAt)`.

### 2.2 `AssignmentSubmission` (étendu)

Colonnes P4.5 ajoutées ·

- `status SubmissionStatus @default(DRAFT)` · DRAFT | SUBMITTED | WITHDRAWN | SUPERSEDED
- `version Int @default(1)`
- `writtenContent String?`
- `storageObjectId String?` FK vers `StorageObject` (SET NULL)
- `withdrawnAt`, `updatedAt`

Unique partial · un seul `DRAFT` par `(assignmentId, userId)`. Les
`SUBMITTED`/`WITHDRAWN`/`SUPERSEDED` peuvent coexister (versions successives).

### 2.3 `AssignmentFeedback` (nouveau)

- Immuable après `PUBLISHED` · trigger DB `p4_5_enforce_feedback_immutability`
- Correction = nouveau row `status = ADDENDUM` avec `supersedesFeedbackId`
- Unique partial · un seul `DRAFT` par submission
- FK vers `Teacher` (RESTRICT) · `StorageObject` (SET NULL) · self-referencing `supersedesFeedbackId` (SET NULL)

## 3. Modèles Racines (nouveaux)

### 3.1 `CircleAssignment`

Activité Coach · verrous ·

- Coach membership `ACTIVE` obligatoire (à vérifier en P4.5-C)
- Circle `ACTIVE` obligatoire (pas ARCHIVED ni SUSPENDED)
- Brouillon modifiable uniquement par son auteur
- Après `PUBLISHED`, contenu pédagogique principal immuable (via trigger sur `AssignmentFeedback`, pas assignment lui-même)

`productionType` · WRITTEN | AUDIO | MIXED. `status` · DRAFT | PUBLISHED | CLOSED | ARCHIVED.

### 3.2 `CircleAssignmentTarget`

Ciblage sous-ensemble d'enfants du Circle. Absence de row = cible tout le
Circle (tous CHILD ACTIVE members). Unique `(assignmentId, childProfileId)`.

Une activité qui vise 3 enfants compte comme **3 productions planifiées**
distinctes pour les quotas hebdomadaires/mensuels · §5.

### 3.3 `CircleSubmission`

Production enfant ·

- Un seul DRAFT actif par `(assignmentId, childProfileId)` (unique partial)
- Versioning · une nouvelle soumission après retour = nouveau row v+1, statut SUPERSEDED sur l'ancien
- Immuable après `SUBMITTED` · trigger DB `p4_5_enforce_submission_immutability`
- `submittedByUserId` · le parent OWNER ou ADULT du foyer (jamais l'enfant · pas d'auth enfant P4.5)
- Association `StorageObject` (SET NULL) pour la piste audio

### 3.4 `CircleFeedback`

Retour Coach · même contrat immuabilité que `AssignmentFeedback` ·

- Publié = trigger BLOQUE toute mutation body/audio/version
- Correction = nouveau row `ADDENDUM` avec `supersedesFeedbackId`
- Seule transition autorisée depuis PUBLISHED · `RETRACTED_BY_ADMIN` (par YEMA_ADMIN futur)

### 3.5 `CircleSubmissionReply` (Q14)

Fil structuré lié à une production, participants limités ·

- Parent OWNER/ADULT du foyer (à valider P4.5-C)
- Coach `ACTIVE` du Circle (à valider P4.5-C)
- **Texte uniquement** · pas d'audio, pas de pièce jointe, pas de DM
- `body` contraint `1..1000` caractères (CHECK constraint SQL)
- `authorRole` explicite `PARENT | COACH` (colonne enum, pas dérivé)
- Aucune recherche globale · projections toujours filtrées par submission

## 4. Quotas Racines (§3, §6)

Par **ChildProfile**, pas par Circle (un enfant peut appartenir à plusieurs
Circles langue).

- `MAX_ROOTS_PRODUCTIONS_PER_WEEK = 2` · fenêtre ISO calendaire UTC (lundi 00:00 UTC → lundi suivant)
- `MAX_ROOTS_PRODUCTIONS_PER_MONTH = 8` · fenêtre mois calendaire UTC (1er 00:00 UTC → 1er suivant)
- `MAX_ROOTS_WRITTEN_WORDS = 250` · convention `split(/\s+/)` trimmed
- `MAX_ROOTS_AUDIO_SECONDS = 180` · 3 minutes

Helpers · `assertRootsAssignmentWeeklyCapacity`, `assertRootsAssignmentMonthlyCapacity`, `assertRootsSubmissionFormat`.

Les codes d'erreur émis sur dépassement ·

- `roots_weekly_production_limit_reached` · detail `{ dimension: "weekly", limit, attemptedCount, windowStartUtc, windowEndUtc, childProfileId }`
- `roots_monthly_production_limit_reached` · idem, dimension `"monthly"`
- `written_production_too_long` · detail `{ limit: 250, attemptedCount: <mots> }`
- `audio_production_too_long` · detail `{ limit: 180, attemptedCount: <secondes> }`
- `invalid_production_format` · detail `{ productionType }`

Ces helpers sont **destinés à être appelés dans une transaction Serializable**
avec advisory lock côté application · P4.5-C câblera cette invocation.

## 5. Immutabilité (§9)

Deux triggers Postgres `BEFORE UPDATE` posés par la migration Racines,
communs Monde + Racines ·

- `p4_5_enforce_feedback_immutability` · appliqué à `circle_feedbacks` et `assignment_feedbacks`
  - Statut PUBLISHED → seules `PUBLISHED` (idempotent) et `RETRACTED_BY_ADMIN` sont acceptés
  - Mutation `writtenContent`/`storageObjectId`/`version`/`publishedAt`/`supersedesFeedbackId` interdite après PUBLISHED
- `p4_5_enforce_submission_immutability` · appliqué à `circle_submissions` et `assignment_submissions`
  - Statut SUBMITTED → seules `SUBMITTED`/`WITHDRAWN`/`SUPERSEDED` sont acceptés (jamais retour DRAFT)
  - Mutation `writtenContent`/`storageObjectId`/`version`/`submittedAt` interdite après SUBMITTED

Fonctions `SECURITY DEFINER SET search_path = public, pg_temp` · doctrine P4
(prévient injection sur `search_path` mutable).

## 6. RLS deny-by-default (§11)

RLS `ENABLE ROW LEVEL SECURITY` posé sur ·

- `circle_assignments`, `circle_assignment_targets`, `circle_submissions`, `circle_feedbacks`, `circle_submission_replies`
- `assignment_feedbacks`
- `assignments`, `assignment_submissions` (rétroactivement · P4.3b s'arrêtait à Classroom-level)

**Aucune policy créée en P4.5-A** · sans policy, Postgres refuse
`authenticated`/`anon` par défaut. Seul `service_role` (via Prisma) écrit.
Les policies scopées (`is_teacher_for_assignment`, `is_active_circle_coach`,
`is_child_parent`, `can_view_circle_submission`, etc.) sont
introduites avec les routes API en P4.5-B/C.

## 7. Feature flags (§22)

| Flag | Rôle | Défaut |
|---|---|---|
| `ASSIGNMENTS_ENABLED` | Verrouille TOUTES les nouvelles routes P4.5 en 404 | `false` |
| `AUDIO_FEEDBACK_ENABLED` | Requiert `ASSIGNMENTS_ENABLED` · gate audio | `false` |
| `RACINES_COACH_OPERATIONAL` | Indépendant · gouverne l'opérationnalité commerciale | `false` |

Helpers ·

- `isAssignmentsActive() = getFlag("ASSIGNMENTS_ENABLED")`
- `isAudioFeedbackActive() = isAssignmentsActive() && getFlag("AUDIO_FEEDBACK_ENABLED")`

Aucune variable `NEXT_PUBLIC_*` · flags exclusivement serveur.

## 8. Codes d'erreur stables (§17)

Liste blanche exportée · `P4_5_STABLE_ERROR_CODES`. 30+ codes couvrant ·

- Assignment (6) · not_found / not_owned / not_published / closed / archived / invalid_transition
- Submission (9) · not_found / already_submitted / content_required / not_owned / immutable / invalid_transition / student_not_enrolled / child_not_in_circle / parent_not_authorized
- Feedback (6) · not_found / already_published / immutable / addendum_required / not_owned / invalid_transition
- Storage (2) · not_owned / invalid
- Workspace (2) · teacher_access_required / roots_coach_access_required
- Capacity Racines (5) · weekly/monthly limit, written/audio too long, invalid format
- Concurrence (2) · concurrent_assignment_update, concurrent_submission_update

Un mapper HTTP (à câbler P4.5-B/C dans `src/lib/api/…`) convertira ces
codes en statuts stables (404/409/403). **Aucun code Prisma** (`P2002`,
`P2034`) ni chaîne Postgres (`40001`, `TransactionWriteConflict`) exposé.

## 9. AuditEvents (§18)

**24 nouvelles valeurs** `AuditAction` (13 Monde + 11 Racines · dédupliquées).
Les 4 sources — `schema.prisma`, migrations SQL (`20260723000009`,
`20260723000010`), cette documentation, et `P4_5_AUDIT_ACTIONS_CANONICAL`
dans `src/lib/__tests__/p4-5-structural.test.ts` — citent la MÊME liste.
Test structurel `P4.5-A · AuditAction · 4-sources coherence` verrouille
cette parité.

### 9.1 Monde (13 valeurs)

| Valeur | Producteur planifié | Sous-lot |
|---|---|---|
| `ASSIGNMENT_CREATED` | POST `/api/teacher/classes/[classroomId]/assignments` | P4.5-B |
| `ASSIGNMENT_PUBLISHED` | POST `/api/teacher/assignments/[id]/publish` (in-tx) | P4.5-B |
| `ASSIGNMENT_CLOSED` | POST `/api/teacher/assignments/[id]/close` (in-tx) | P4.5-B |
| `ASSIGNMENT_ACCESS_DENIED` | resolveTeacherActor cross-class refus (post-échec) | P4.5-B |
| `SUBMISSION_CREATED` | POST `/api/student/assignments/[id]/submissions` (in-tx) | P4.5-B |
| `SUBMISSION_SUBMITTED` | POST `/api/student/submissions/[id]/submit` (in-tx) | P4.5-B |
| `SUBMISSION_WITHDRAWN` | POST `/api/student/submissions/[id]/withdraw` (in-tx) | P4.5-B |
| `SUBMISSION_ACCESS_DENIED` | Student cross-submission refus (post-échec) | P4.5-B |
| `FEEDBACK_DRAFTED` | POST `/api/teacher/submissions/[id]/feedback` (in-tx) | P4.5-B |
| `FEEDBACK_PUBLISHED` | POST `/api/teacher/feedback/[id]/publish` (in-tx) | P4.5-B |
| `FEEDBACK_ADDENDUM_CREATED` | POST `/api/teacher/feedback/[id]/addendum` (in-tx) | P4.5-B |
| `FEEDBACK_ACCESS_DENIED` | Student/Teacher cross-feedback refus (post-échec) | P4.5-B |
| `STORAGE_UPLOAD_DENIED` | POST `/api/storage/finalize` refus MIME/durée/ownership | P4.5-D |

### 9.2 Racines (11 valeurs)

| Valeur | Producteur planifié | Sous-lot |
|---|---|---|
| `CIRCLE_ASSIGNMENT_CREATED` | POST `/api/roots-coach/circles/[id]/activities` (in-tx) | P4.5-C |
| `CIRCLE_ASSIGNMENT_PUBLISHED` | POST `/api/roots-coach/activities/[id]/publish` (in-tx) | P4.5-C |
| `CIRCLE_ASSIGNMENT_CLOSED` | POST `/api/roots-coach/activities/[id]/close` (in-tx) | P4.5-C |
| `CIRCLE_SUBMISSION_CREATED` | POST `/api/circles/[id]/activities/[aid]/submissions` (in-tx) | P4.5-C |
| `CIRCLE_SUBMISSION_SUBMITTED` | POST `/api/circles/[id]/submissions/[sid]/submit` (in-tx) | P4.5-C |
| `CIRCLE_SUBMISSION_WITHDRAWN` | POST `/api/circles/[id]/submissions/[sid]/withdraw` (in-tx) | P4.5-C |
| `CIRCLE_FEEDBACK_DRAFTED` | POST `/api/roots-coach/submissions/[id]/feedback` (in-tx) | P4.5-C |
| `CIRCLE_FEEDBACK_PUBLISHED` | POST `/api/roots-coach/feedback/[id]/publish` (in-tx) | P4.5-C |
| `CIRCLE_FEEDBACK_ADDENDUM_CREATED` | POST `/api/roots-coach/feedback/[id]/addendum` (in-tx) | P4.5-C |
| `PRODUCTION_LIMIT_REACHED` | `assertRootsAssignmentWeekly/Monthly` refus (post-échec unique) | P4.5-C |
| `PARENT_REPLY_CREATED` | POST `/api/circles/[id]/submissions/[sid]/replies` (in-tx) | P4.5-C |

### 9.3 Doctrine émission

**Écriture in-tx** pour les événements de changement d'état (comme P4.4
`ROOTS_COACH_ASSIGNMENT_REVOKED`) · pattern à appliquer en P4.5-B/C pour
`ASSIGNMENT_CREATED/PUBLISHED/CLOSED`, `SUBMISSION_CREATED/SUBMITTED/WITHDRAWN`,
`FEEDBACK_DRAFTED/PUBLISHED/ADDENDUM_CREATED`, `PARENT_REPLY_CREATED`
et leurs équivalents `CIRCLE_*`.

**Écriture post-échec unique** pour les événements de refus
(`ASSIGNMENT_ACCESS_DENIED`, `SUBMISSION_ACCESS_DENIED`, `FEEDBACK_ACCESS_DENIED`,
`PRODUCTION_LIMIT_REACHED`, `STORAGE_UPLOAD_DENIED`) · via helper dédié
semblable à `emitCoachCapacityAudit` (P4.4 closure).

Metadata autorisée · `actorUserId`, `teacherId`, `coachUserId`, `classroomId`,
`circleId`, `assignmentId`, `submissionId`, `feedbackId`, `childProfileId`,
`reasonCode`, `productionType`, `capacityType`, `attemptedCount`, `limit`,
`routeAction`. Interdite · texte de production, texte de feedback, nom
complet enfant, email, phone, dateOfBirth, audioUrl, signedUrl, token,
cookie, body complet.

## 10. Statut P4.5-B1 · services Monde + resolvers + RLS WRITE

Livré sur `feat/yema-p4-5-b-monde-workflows` @ base `2c8c27f` (post-P4.5-A closure) ·

### 10.1 Namespace canonique Student

Choisi · **`/api/student/*`** (§10 brief). Aucun namespace `learner` préexistant
dans le repo — aucun conflit. Symétrique à `/api/teacher/*` P4.3b actif.

### 10.2 Domaine V2 confirmé

Services Monde P4.5-B utilisent exclusivement la famille V2 ·

- `Classroom` (P4.3b)
- `ClassroomEnrollment` (P4.3b)
- `Assignment` (colonnes P4.5 additives)
- `AssignmentSubmission` (colonnes P4.5 additives)
- `AssignmentFeedback` (nouveau P4.5-A)

Les modèles V1 (`Class`, `ClassAssignment`, `Submission`, `ClassFeedback`)
restent **gelés** · aucun nouveau consommateur.

### 10.3 Resolvers

- `src/lib/permissions/student.ts` · `resolveStudentActor()` +
  `resolveStudentActorOrNull()` + `assertStudentCanAccessAssignment()` +
  `assertStudentOwnsSubmission()`. Rôles acceptés · V1 `User.role = "STUDENT"`
  ou V2 `UserAppRole.role = "LEARNER"`. Aucun autre rôle (TEACHER, YEMA_ADMIN,
  CENTER_ADMIN, RACINES_COACH, CAREER_COACH) n'ouvre l'espace Student.
- `resolveTeacherActor()` (P4.3b, réutilisé sans modification).
- Aucun `studentId`/`userId`/`classroomId` client accepté comme autorité.

Table de décision resolver Student §3 brief · 7 situations couvertes (anonyme,
rôle non étudiant, enrollment vide, enrollment actif, enrollment retiré,
classroom inactive, YEMA admin sans binding).

### 10.4 Services métier

- `src/lib/assignments/transitions.ts` · pures functions ·
  `assertAssignmentTransition`, `assertSubmissionTransition`,
  `assertFeedbackTransition`, `assertMondeTextOnlyProductionType`,
  `assertMondeTextOnlyFeedback`, `assertMondeSubmissionWordLimit`,
  `countMondeSubmissionWords`.
- `src/lib/assignments/teacher.ts` · 12 fonctions Teacher ·
  `listTeacherAssignments`, `getTeacherAssignment`,
  `createTeacherAssignmentDraft`, `updateTeacherAssignmentDraft`,
  `publishTeacherAssignment`, `closeTeacherAssignment`,
  `listAssignmentSubmissions`, `getTeacherSubmission`,
  `createAssignmentFeedbackDraft`, `updateAssignmentFeedbackDraft`,
  `publishAssignmentFeedback`, `createAssignmentFeedbackAddendum`.
- `src/lib/assignments/student.ts` · 8 fonctions Student ·
  `listStudentAssignments`, `getStudentAssignment`, `getStudentSubmission`,
  `createStudentSubmissionDraft`, `updateStudentSubmissionDraft`,
  `submitStudentSubmission`, `createStudentSubmissionVersion`,
  `listStudentFeedback`.

Chaque service prend un `TxClient` explicite. Les changements d'état
écrivent leur `AuditEvent` **DANS la même tx** via `writeAuditEvent(rec, tx)`
(pattern P4.4 closure). Aucun `void writeAuditEvent` fire-and-forget dans
les services.

### 10.5 Limite Monde texte · 1000 mots

`MAX_MONDE_SUBMISSION_WORDS = 1000` (§6 brief). Distinct de la limite Racines
(250 mots). Convention `split(/\s+/u)` trimmed identique à P4.5-A Racines.
Émission `submission_too_long` avec `detail.limit=1000, detail.attemptedCount=<mots>`.

### 10.6 Texte uniquement (§5, §7 brief)

- `assertMondeTextOnlyProductionType` rejette AUDIO/MIXED en création
  d'assignment · code `audio_feedback_disabled` (409).
- `assertMondeTextOnlyFeedback` rejette tout `storageObjectId` sur
  feedback · code `feedback_invalid_transition` avec `detail.reason =
  "audio_feedback_disabled"`.
- Storage 2-phase reste reporté **P4.5-D**.

### 10.7 Migration RLS WRITE Monde

`prisma/migrations/20260724000002_p4_5_b_monde_rls_writes/migration.sql` ·

Helpers additifs ·
- `is_teacher_for_classroom_v2(classroomId, userId)` · SECURITY DEFINER
  search_path pinned · réutilisable par les policies WRITE.

Policies · 5 policies WRITE au total ·

- **assignments** · `p4_5_b_assignments_insert_teacher_own` (INSERT si
  Teacher owns classroom), `p4_5_b_assignments_update_teacher_own` (UPDATE
  scoped). Aucune policy INSERT/UPDATE Student · deny-by-default RLS bloque.
- **assignment_submissions** · `p4_5_b_assignment_submissions_insert_student_own`
  (INSERT si student enrolled actif ET assignment PUBLISHED ET userId=self),
  `p4_5_b_assignment_submissions_update_student_draft` (UPDATE contraint
  `status = 'DRAFT'`, `userId = self`). Aucune policy INSERT/UPDATE Teacher
  sur submissions · le Teacher ne peut jamais toucher au contenu Student.
- **assignment_feedbacks** · `p4_5_b_assignment_feedbacks_insert_teacher_own`
  (INSERT si Teacher owns classroom via submission ET authorTeacherId matche),
  `p4_5_b_assignment_feedbacks_update_teacher_draft` (UPDATE contraint
  `status = 'DRAFT'`, auteur matche).

Aucun `is_yema_admin()` global · aucun bypass admin. Aucune policy `FOR
DELETE` · immutabilité feedback PUBLISHED + submission SUBMITTED reste
contrainte par les triggers P4.5-A.

### 10.8 Mapping HTTP + audit access denied

- `src/lib/api/assignmentErrors.ts::mapAssignmentErrorToResponse(e)` ·
  centralise le mapping AssignmentError/SubmissionError/FeedbackError/
  StorageOwnershipError/WorkspaceAccessError/PermissionError/
  ConcurrentUpdateError vers HTTP 400/401/403/404/409. Fallback triggers DB
  immutabilité (`submission_immutable` / `feedback_immutable`) et P2034
  bruts (`concurrent_assignment_update`). **Aucun leak Prisma** dans le
  body de réponse · vérifié par test structurel.
- `src/lib/audit/assignmentEvents.ts::emitAssignmentAuditFromError(...)` ·
  émission unique post-échec pour `ASSIGNMENT_ACCESS_DENIED` /
  `SUBMISSION_ACCESS_DENIED` / `FEEDBACK_ACCESS_DENIED`. Miroir de
  `emitCoachCapacityAudit` (P4.4 closure).

### 10.9 Codes P4.5-B ajoutés

Nouveaux codes stables ajoutés à `P4_5_STABLE_ERROR_CODES` ·

- `assignment_immutable`, `invalid_assignment_transition`, `audio_feedback_disabled`
- `submission_too_long`, `invalid_submission_transition`, `student_access_required`
- `invalid_feedback_transition`
- `concurrent_feedback_update` (extension `ConcurrentUpdateError.code`)

### 10.10 Tests

71 nouveaux tests vitest · 39 `monde-transitions` (graphes autorisés
+ word limit + texte-only + audio guard) + 32 `p4-5-b-structural` (migration
RLS présente et complète, services structurels, mapper sans leak Prisma,
resolver rôles restrictifs, audit helper 3 codes distincts). Total **737 tests**
sur 41 files (contre 666 sur 39 P4.5-A validated).

Reporté vers P4.5-B2 (avec routes API + tests intégration P-1) ·
- Routes API Teacher (12) + Student (8) selon §9 + §10 brief.
- Tests intégration RLS/JWT avec 9 personas + 6 races concurrence.
- Immutabilité API-level (via requêtes HTTP réelles, pas seulement DB).
- UI Teacher/Student placeholders scoped.
- Runtime FR/EN + responsive + landing regressions.
- Fixtures P-1 protégées + cleanup `BASELINE DATA CLEANED`.

## 11. Statut P4.5-B2a · préflight RLS + 20 routes API + validators

Livré sur `feat/yema-p4-5-b-monde-workflows` @ base P4.5-B1 (`7a83c15`) ·

### 11.1 Préflight RLS WRITE + migration corrective

Inspection §1 sur P-1 · 3 policies UPDATE (assignments / assignment_submissions
/ assignment_feedbacks) exigeaient `status='DRAFT'` uniquement dans USING
mais pas dans WITH CHECK · un JWT authenticated pouvait donc muter le
status directement (bypass des services et de leur audit in-tx).

Migration corrective additive `20260724000003_p4_5_b_monde_rls_write_hardening` ·

- DROP + CREATE des 3 policies UPDATE en ajoutant `AND status = 'DRAFT'`
  dans USING **et** WITH CHECK.
- Aucune migration historique modifiée. Aucun bypass admin ajouté.

Après hardening (vérifié sur P-1) · le JWT direct ne peut effectuer QUE
un `UPDATE contenu` sur une ligne DRAFT qui reste DRAFT. Toutes les
transitions PUBLISHED/CLOSED/ARCHIVED/SUBMITTED/SUPERSEDED/ADDENDUM sont
exclusives au seam Prisma via service_role (avec audit in-tx).

### 11.2 Matrice des 20 opérations Monde

| # | Méthode | Path | Service |
|---:|---|---|---|
| 1 | GET | `/api/teacher/classes/[classroomId]/assignments` | `listTeacherAssignments` |
| 2 | POST | `/api/teacher/classes/[classroomId]/assignments` | `createTeacherAssignmentDraft` |
| 3 | GET | `/api/teacher/assignments/[assignmentId]` | `getTeacherAssignment` |
| 4 | PATCH | `/api/teacher/assignments/[assignmentId]` | `updateTeacherAssignmentDraft` |
| 5 | POST | `/api/teacher/assignments/[assignmentId]/publish` | `publishTeacherAssignment` |
| 6 | POST | `/api/teacher/assignments/[assignmentId]/close` | `closeTeacherAssignment` |
| 7 | GET | `/api/teacher/assignments/[assignmentId]/submissions` | `listAssignmentSubmissions` |
| 8 | GET | `/api/teacher/submissions/[submissionId]` | `getTeacherSubmission` |
| 9 | POST | `/api/teacher/submissions/[submissionId]/feedback` | `createAssignmentFeedbackDraft` |
| 10 | PATCH | `/api/teacher/feedback/[feedbackId]` | `updateAssignmentFeedbackDraft` |
| 11 | POST | `/api/teacher/feedback/[feedbackId]/publish` | `publishAssignmentFeedback` |
| 12 | POST | `/api/teacher/feedback/[feedbackId]/addendum` | `createAssignmentFeedbackAddendum` |
| 13 | GET | `/api/student/assignments` | `listStudentAssignments` |
| 14 | GET | `/api/student/assignments/[assignmentId]` | `getStudentAssignment` |
| 15 | GET | `/api/student/assignments/[assignmentId]/submissions` | inline scoped à `userId=self` |
| 16 | POST | `/api/student/assignments/[assignmentId]/submissions` | `createStudentSubmissionDraft` |
| 17 | PATCH | `/api/student/submissions/[submissionId]` | `updateStudentSubmissionDraft` |
| 18 | POST | `/api/student/submissions/[submissionId]/submit` | `submitStudentSubmission` |
| 19 | POST | `/api/student/submissions/[submissionId]/versions` | `createStudentSubmissionVersion` |
| 20 | GET | `/api/student/submissions/[submissionId]/feedback` | `listStudentFeedback` (PUBLISHED/ADDENDUM) |

### 11.3 Feature gate `ASSIGNMENTS_ENABLED`

`src/lib/api/assignmentsGate.ts::assignmentsFlagOr404()` ·
- Appelé TOUT en début de chaque handler, **avant** résolution de session.
- Avec `ASSIGNMENTS_ENABLED=false` (défaut), retourne un 404 stable
  identique à une ressource inexistante · aucun `await` DB ni Supabase
  auth n'est effectué.
- Aucun AuditEvent flag-off.
- Aucun `NEXT_PUBLIC_*` · flag serveur exclusif.

Verrouillé par test structurel · le call `assignmentsFlagOr404()` précède
`await resolveTeacherActor()` / `await resolveStudentActor()` dans les
deux helpers.

### 11.4 Anti-injection · body allowlist stricte

`src/lib/assignments/bodyValidators.ts` · 3 validators avec allowlist
canonique et rejet des clés forbidden :

- **Assignment create** · `title`, `instructions`, `dueAt`, `submissionFormat`.
  Rejette `status`, `version`, `publishedAt`, `closedAt`, `classroomId`,
  `teacherId`, `createdBy`, `createdByTeacherId`, `id`. Rejette
  `submissionFormat != "WRITTEN"` avec `audio_feedback_disabled` (P4.5-B
  texte uniquement).
- **Assignment update** · `title`, `instructions`, `dueAt`. Rejette la
  même liste forbidden que create.
- **Submission** · `writtenContent` uniquement. Rejette `status`,
  `version`, `storageObjectId`, `assignmentId`, `userId`, `submittedAt`,
  `supersedesSubmissionId`, `id`.
- **Feedback** · `writtenContent` uniquement. Rejette `status`, `version`,
  `storageObjectId`, `submissionId`, `authorId`, `authorTeacherId`,
  `publishedAt`, `supersedesFeedbackId`, `id`.

Les routes appellent aussi des guards inline additionnels · rejet de
`classroomId`/`teacherId`/`assignmentId`/`userId`/`authorId`/`submissionId`/
`supersedesFeedbackId`/`version` avant validation (défense en profondeur).

### 11.5 Route helpers · pattern uniforme

`src/lib/api/teacherRouteHelper.ts::runTeacherRoute(fn, opts)` et
`src/lib/api/studentRouteHelper.ts::runStudentRoute(fn, opts)` · pattern
appliqué aux 20 routes ·

1. `assignmentsFlagOr404()` en premier · avant session.
2. `resolveTeacherActor()` / `resolveStudentActor()` · rôle + binding.
3. Pour `writeTx: true` · `withSerializableRetry(() => prisma.$transaction(
   fn, { isolationLevel: "Serializable" }), { errorCode })`.
4. Pour lectures · un seul appel de service sur `prisma` (typé
   `TxClient` par cast contrôlé).
5. `catch (e)` · `emitAssignmentAuditFromError` (idempotent) puis
   `mapAssignmentErrorToResponse(e)` (aucun code Prisma exposé).

### 11.6 Concurrence

`ConcurrentUpdateCode` P4.5-B2 utilisé selon domaine ·

- Assignments create/publish/close/update · `concurrent_assignment_update`.
- Submissions create/update/submit/versions · `concurrent_submission_update`.
- Feedback create/update/publish/addendum · `concurrent_feedback_update`.

Après retry SSI épuisé (3 tentatives, backoff 25/50/100ms) ·
`ConcurrentUpdateError` mappé en HTTP 409 stable. Aucun P2034 /
TransactionWriteConflict / INTERNAL exposé (fallback dernier recours
mappé vers `concurrent_assignment_update` par `assignmentErrors.ts`).

### 11.7 Codes HTTP (mapper)

Anti-énumération respectée · une ressource étrangère renvoie 404
indiscernable d'une ressource inexistante · les erreurs de rôle
retournent 403 sans détail sur le scope réel.

| Code métier | HTTP |
|---|---:|
| `assignment_not_found` / `submission_not_found` / `feedback_not_found` | 404 |
| `assignment_not_owned` / `submission_not_owned` / `feedback_not_owned` | 403 |
| `student_access_required` / `student_not_enrolled` | 403 |
| `assignment_immutable` / `submission_immutable` / `feedback_immutable` | 409 |
| `invalid_*_transition` / `feedback_already_published` / `submission_already_submitted` | 409 |
| `audio_feedback_disabled` | 409 |
| `submission_content_required` / `submission_too_long` | 400 |
| `concurrent_assignment_update` / `_submission_update` / `_feedback_update` | 409 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `INTERNAL` (dernier recours) | 500 |

### 11.8 Tests P4.5-B2a

70 nouveaux tests vitest · 42 `monde-body-validators` (allowlist stricte,
forbidden keys pour les 3 validators, audio_feedback_disabled) + 28
`p4-5-b2-structural` (migration hardening WITH CHECK status='DRAFT',
20 routes présentes avec bonnes méthodes, feature gate avant résolution,
runXRoute pattern, anti-injection body, writeTx + errorCode explicites).

Total **807 tests / 43 files** (contre 737 sur 41 P4.5-B1).

Reporté vers P4.5-B2b (closure B) ·
- UI Teacher (4 pages) + Student (3 pages) + états 8 requis.
- Fixtures P-1 `test_p4_5_b_` protégées + cleanup `BASELINE DATA CLEANED`.
- Tests runtime API réels · Teacher A/B + Student A/B + Center admin +
  Racines Coach + YEMA_ADMIN sans binding + Anonymous.
- Tests JWT/PostgREST direct · UPDATE `status` refusé, INSERT feedback
  cross-tenant refusé, etc.
- 5 races concurrence · double publish assignment / double submit /
  version concurrente / double publish feedback / double addendum.
- Immutabilité DB directe (Prisma + SQL raw).
- Runtime FR/EN sur `/fr/teacher/*`, `/fr/student/*` + `/en/*`.
- Responsive 4 viewports + zoom 200 % + a11y clavier.
- Landing regressions.
- Flag-off validation · retirer flags, tester 20 routes → 404 stable.
- Finalisation `docs/YEMA_P4_5_ASSIGNMENTS_SUBMISSIONS_FEEDBACK.md`
  + mises à jour docs globaux.

## 12. Chemin restant

- **P4.5-B** · services `assignments.ts` + `submissions.ts` + `feedback.ts` Monde · routes Teacher + Student · tests RLS/JWT + immutabilité DB + races
- **P4.5-C** · services Racines équivalents · routes Coach + Famille · quotas semaine/mois testés sous concurrence · reply parent structuré
- **P4.5-D** · workflow storage 2-phase (upload intent + finalize serveur) · validation MIME/durée/ownership · cleanup abandonnés
- **P4.5-E** · UI Teacher/Coach/Famille · placeholders scoped avec états loading/empty/error/forbidden/feature_disabled/draft/published/closed · runtime FR/EN + responsive
- **P4.5-F** · fixtures P-1 protégées + cleanup `BASELINE DATA CLEANED` + landing regressions + validation finale + décision READY-TO-MERGE

Chaque sous-lot suit le même cycle P4.3b/P4.4 · commits atomiques `[no-push]`, tests + validation + rapport intermédiaire.

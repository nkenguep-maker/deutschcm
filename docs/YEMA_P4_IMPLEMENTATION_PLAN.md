# YEMA · Plan d'implémentation P4 · migrations, feature flags, sous-lots, tests, blockers

> Compagnon de `YEMA_P4_ARCHITECTURE_AUDIT.md`, `YEMA_P4_PERMISSION_MATRIX.md`, `YEMA_P4_THREAT_MODEL.md`. Aucune ligne de code, aucune migration, aucun schéma modifié par cet audit.
>
> **Portée** · plan ordonnancé des sous-lots P4.1 → P4.7 + P4.RLS (revue consolidation), migrations additives, feature flags, décisions produit **validées** (§5 Q1-Q15), plan de tests, blockers de lancement.
>
> **Correctifs post-revue 2026-07-23** ·
> 1. **RLS activée dès P4.1** pour Circle, CircleMembership, Class, memberships, Center, Storage. Aucune fonctionnalité P4 ne s'active avant les policies des tables qu'elle utilise. `P4.RLS` devient une revue finale de consolidation, pas la première implémentation.
> 2. **`ThreadType.ONE_TO_ONE`** · déprécié · nouvelles créations interdites · routes correspondantes désactivées · **aucune suppression destructive en P4**.
> 3. **`AuditEvent`** posé en P4.1 (avant toute invitation / changement de membership en P4.2).
> 4. **`StorageObject` + buckets privés + URLs signées + MIME allowlist** posés en P4.1 (avant tout sous-lot acceptant fichiers ou audios).
> 5. **Décisions produit** Q1-Q15 validées et intégrées (§5).
> 6. Codes définitifs · `ProductCode = ROOTS_COACH_ADDON` · Nom commercial · « Suivi Racines » · `AppRole = RACINES_COACH` (jamais `CAREER_COACH`).
> 7. `ChildProfile` = représentation canonique enfants. `DependentProfile` **audité et déprécié** en P4, sans suppression destructive.

---

## 1. Plan de migration additive

Toutes les migrations P4 sont **additives**. Aucune colonne existante n'est renommée ou supprimée pendant P4. Les colonnes obsolètes (`DependentProfile`, `Message.audioUrl` remplacé par `storage_object_id`, `ThreadType.ONE_TO_ONE`) sont marquées deprecated dans les commentaires · leur retrait effectif est planifié à P5+ via un plan de dépréciation dédié (aucune suppression destructive pendant P4).

Règle transverse · **aucune fonctionnalité P4 n'est activée avant que les policies RLS des tables qu'elle utilise soient en place, testées, et le compteur IDOR à zéro.** Le sous-lot `P4.RLS` en fin de séquence n'est pas la première implémentation des policies : c'est une revue de consolidation et un audit final.

### P4-M1 · Foundations · Circle + AuditEvent + StorageObject + RLS helpers + RLS Circle/CircleMembership

**Objectif** · poser en une seule migration l'ossature de sécurité de P4 · entités Circle, socle audit, socle storage, fonctions helper RLS, activation RLS Circle · sans exposer côté produit (`CIRCLE_ENABLED = false`).

Tables · `circles`, `circle_memberships`, `audit_events`, `storage_objects`.

Enums · `CircleStatus`, `CircleRole`, `CircleMembershipStatus`, `AuditAction`, `StorageObjectPurpose`.

Colonnes ajoutées à modèles existants ·

- `households.name TEXT?` (nom d'affichage optionnel).
- `child_profiles.household_id TEXT?` FK vers `households(id)` avec `ON DELETE SET NULL` (rattachement explicite au foyer).

Indexes ·

- `circles` · `@@unique([householdId, language])`, `@@index([coachUserId, status])`.
- `circle_memberships` · `@@unique([circleId, userId, childProfileId])`, `@@index([circleId, role, status])`, `@@index([userId, status])`, `@@index([childProfileId, status])`.
- `audit_events` · `@@index([targetType, targetId, createdAt])`, `@@index([actorUserId, createdAt])`.
- `storage_objects` · `@@unique([bucket, key])`, `@@index([purpose, retentionUntil])`, `@@index([uploadedByUserId, createdAt])`.
- Ajout `@@index([centerId])` sur `users` (comble la dette identifiée dans l'audit).

Contraintes CHECK ·

- `circle_memberships` · `CHECK ((user_id IS NULL) <> (child_profile_id IS NULL))` — XOR obligatoire.
- Unique conditionnel · `CREATE UNIQUE INDEX circle_one_active_coach ON circle_memberships (circle_id) WHERE role = 'COACH' AND status = 'ACTIVE'` (1 coach actif max).

Fonctions Postgres helper (créées dans la même migration) ·

- `is_class_member(class_id UUID, user_id UUID) RETURNS BOOLEAN` — SELECT EXISTS(class_memberships WHERE class_id AND user_id AND status='ACTIVE').
- `is_circle_member(circle_id UUID, user_id UUID) RETURNS BOOLEAN` — via `circle_memberships.user_id`.
- `is_circle_owner(circle_id UUID, user_id UUID) RETURNS BOOLEAN`.
- `is_circle_coach(circle_id UUID, user_id UUID) RETURNS BOOLEAN`.
- `is_center_admin(center_id UUID, user_id UUID) RETURNS BOOLEAN` — via `users.center_id` + `user_app_roles.role = 'CENTER_ADMIN'`.
- `is_household_member(household_id UUID, user_id UUID) RETURNS BOOLEAN`.
- `is_child_parent(child_profile_id UUID, user_id UUID) RETURNS BOOLEAN`.

Activation RLS + policies (dans cette migration) ·

| Table | ENABLE RLS | Lecture | Écriture | Service admin |
|---|---|---|---|---|
| `circles` | oui | `is_circle_member(id, auth.uid())` | `is_circle_owner(id, auth.uid())` | service_role |
| `circle_memberships` | oui | `is_circle_member(circle_id, auth.uid())` | `is_circle_owner(circle_id, auth.uid())` | service_role |
| `audit_events` | oui | admin only (`is_yema_admin(auth.uid())`) | service_role uniquement | service_role |
| `storage_objects` | oui | uploader (`uploaded_by_user_id = auth.uid()`) OU membre du contexte via `purpose` join | service_role | service_role |

Ces policies sont **testées** dans la même PR que la migration · connexions anon simulées → lecture rejetée, connexion propriétaire → lecture acceptée.

Backfill · aucun (tables nouvelles).

Compatibilité ascendante · aucun endpoint public n'expose ces tables tant que `CIRCLE_ENABLED = false`.

Rollback · `DROP POLICY ... ; DISABLE ROW LEVEL SECURITY; DROP FUNCTION ...; DROP TABLE circle_memberships; DROP TABLE circles; DROP TABLE audit_events; DROP TABLE storage_objects; DROP TYPE ...` — sûr tant qu'aucune donnée n'est écrite.

Tests · unit RLS (lecture/écriture par rôle simulé), test IDOR de base (`SELECT * FROM circles WHERE id = 'other'` avec session anon → 0 rows).

Risque · faible (additif + flag off).

### P4-M2 · Memberships + invitations + capacity guards + RLS extensions

**Objectif** · rendre exploitables les gardes de capacité (2 adultes / 4 enfants / 1 coach par cercle / 1 cercle par langue), câbler `AuditEvent` sur toutes les transitions de membership, activer RLS Class / ClassMembership / Household / HouseholdMembership / ChildProfile / DependentProfile.

Aucune table nouvelle. Colonnes additives + policies.

Colonnes ajoutées ·

- `household_memberships.status` élargi · valeur `INVITED` ajoutée (enum dédié `HouseholdMembershipStatus` créé pour éviter de polluer `HouseholdStatus`, décision Q2 validée).
- `household_memberships.invited_by_user_id TEXT?` FK vers `users(id)` (Q2 → OWNER uniquement).
- `household_memberships.invited_at TIMESTAMP?`.
- Ajout de `@@index([householdId, role, status])`.

Activation RLS + policies (nouvelles) ·

| Table | Lecture | Écriture | Notes |
|---|---|---|---|
| `households` | `is_household_member(id, auth.uid())` | owner (`owner_user_id = auth.uid()`) | – |
| `household_memberships` | `is_household_member(household_id, auth.uid())` | owner du household | – |
| `child_profiles` | `parent_user_id = auth.uid()` OU membre d'un cercle contenant ce childProfile via `circle_memberships` | `parent_user_id = auth.uid()` (Q1 · 2ᵉ adulte lecture seule, jamais delete) | remplace la policy `service_role only` de P3 |
| `dependent_profiles` | `is_household_member(household_id, auth.uid())` | admin only | modèle **déprécié** en P4, RLS lecture seule pour compat, aucune écriture applicative |
| `classes` | `is_class_member(id, auth.uid())` OU `provider_user_id = auth.uid()` | provider ou admin | – |
| `class_memberships` | `is_class_member(class_id, auth.uid())` | provider ou admin | – |
| `learning_paths` | `user_id = auth.uid()` | owner | – |
| `access_grants` | `is_beneficiary(access_grant, auth.uid())` (helper join sur beneficiary_type / beneficiary_id) | admin only | – |
| `orders`, `payments` | `user_id = auth.uid()` | admin only | financier · policy stricte |

Câblage `AuditEvent` sur transitions membership · `CIRCLE_MEMBERSHIP_INVITED`, `CIRCLE_MEMBERSHIP_ACCEPTED`, `CIRCLE_MEMBERSHIP_REVOKED`, `CIRCLE_COACH_ASSIGNED`, `CIRCLE_COACH_UNASSIGNED`, `HOUSEHOLD_MEMBERSHIP_INVITED`, `HOUSEHOLD_MEMBERSHIP_ACCEPTED`, `HOUSEHOLD_MEMBERSHIP_REVOKED`.

Backfill · aucun (les enregistrements existants restent `ACTIVE`).

Rollback · `DROP POLICY ...; DISABLE ROW LEVEL SECURITY; ALTER TABLE ... DROP COLUMN ...` — sûr.

Tests · concurrence (deux POST simultanés · un seul aboutit), IDOR cross-household, RLS lecture par rôle simulé.

Risque · moyen (RLS élargie · fenêtre d'attention en staging).

### P4-M3 · Feedback audio + submission status + RLS assignments/submissions/feedback

**Objectif** · combler MSG-04 (`ClassFeedback.audioUrl`), poser le statut lifecycle Submission, activer RLS assignments / submissions / feedback / threads / messages.

Tables · aucune nouvelle.

Colonnes ajoutées ·

- `class_feedback.audio_url TEXT?` (Q13 · immutable après publication · voir §5).
- `class_feedback.storage_object_id TEXT?` FK vers `storage_objects(id)` — futur remplaçant de `audio_url` string.
- `submissions.status` avec enum `SubmissionStatus = ASSIGNED | SUBMITTED | IN_REVIEW | FEEDBACK_READY | REVISION_REQUESTED | COMPLETED`. Default `SUBMITTED` pour lignes existantes.
- `submissions.storage_object_id TEXT?` FK vers `storage_objects(id)`.
- `messages.storage_object_id TEXT?` FK vers `storage_objects(id)` (colonne `audioUrl` string conservée pour compat).
- `class_assignments.type TEXT?` avec enum `ClassAssignmentType = HOMEWORK | ANNOUNCEMENT | ORAL_INVITATION` (optionnel · si non nécessaire à P4.5, reporter P4.6).

Indexes · `submissions` `@@index([assignmentId, status])`.

Backfill · `UPDATE submissions SET status = 'SUBMITTED' WHERE status IS NULL` (transaction courte).

Activation RLS + policies ·

| Table | Lecture | Écriture |
|---|---|---|
| `class_assignments` | `is_class_member(class_id, auth.uid())` | provider ou teacher de la classe |
| `submissions` | auteur (`user_id = auth.uid()`) OU provider/teacher de la classe | auteur uniquement |
| `class_feedback` | auteur, élève cible (via join `submission.user_id`), provider/teacher | auteur (créer) · **jamais update ni delete** (immutable Q13) |
| `threads` | `is_class_member(class_id, auth.uid())` | provider/teacher |
| `messages` | `is_class_member(thread.class_id, auth.uid())` | auteur (create) · auteur pour delete/edit selon Q11 |

Rollback · sûr.

Tests · lifecycle Submission complet, IDOR cross-class sur feedback.

Risque · moyen.

### P4-M4 · Circle assignments / submissions / feedback + closed messaging + RLS

**Objectif** · poser la structure devoirs Racines + messagerie fermée Circle, avec RLS immédiate.

Tables · `circle_assignments`, `circle_submissions`, `circle_feedback`, `circle_messages`, `circle_message_read_state`.

Enums · `CircleMessageType = TEXT | AUDIO | ANNOUNCEMENT`, `SubmissionStatus` (réutilisé).

Colonnes ·

- `circle_assignments (id, circleId, createdByMembershipId, title, description?, dueAt?, type, createdAt, publishedAt?)`.
- `circle_submissions (id, assignmentId, submitterMembershipId, body?, storageObjectId?, submittedAt, status)` unique `[assignmentId, submitterMembershipId]`.
- `circle_feedback (id, submissionId, authorMembershipId, score?, body?, storageObjectId?, createdAt, addendumOfFeedbackId?)` — Q13 · nouveau feedback = nouvelle ligne, éventuellement `addendumOfFeedbackId` pointant sur la version précédente.
- `circle_messages (id, circleId, authorMembershipId, messageType, body?, storageObjectId?, createdAt, editedAt?, deletedAt?, deletedByMembershipId?)`.
- `circle_message_read_state (circleMessageId, membershipId, readAt)` unique `[circleMessageId, membershipId]`.

Indexes · `circle_messages` `@@index([circleId, createdAt])`, `@@index([circleId, deletedAt])`.

Activation RLS + policies · toutes les tables Circle · lecture `is_circle_member(circle_id, auth.uid())`, écriture selon rôle Circle.

Backfill · aucun.

Rollback · sûr.

Tests · ownership sur toutes les entités · un OWNER voit tout, un CHILD ne voit que ses submissions et le fil du cercle.

Risque · moyen.

### P4-M5 · Notifications réelles + storage extensions + rate limiting metadata

**Objectif** · consolider · câbler `Notification` sur événements réels, ajouter metadata rate limit.

Tables · `notification_events` (optionnel · si `Notification` existant suffit, réutiliser).

Colonnes ajoutées ·

- `notifications.event_type TEXT` (déjà là via `type`, préciser sémantique · `assignment.published`, `feedback.ready`, `circle.message.new`, `circle.coach.assigned`).
- `notifications.storage_object_id TEXT?` (si notif référence un audio · optionnel).
- Ajout table `rate_limit_counters (user_id, endpoint, window_start, count)` pour rate limit persistant.

Activation RLS · `notifications` lecture `user_id = auth.uid()`, écriture service_role uniquement.

Backfill · aucun.

Rollback · sûr.

Tests · notification lifecycle, rate limit sur `/api/circles/[id]/messages`.

Risque · faible.

---

**Note sur `P4-M6`** · ce numéro **n'existe plus**. La RLS n'est pas concentrée dans une migration terminale. Chaque migration M1-M5 pose et teste ses policies au moment de créer les tables associées. Le sous-lot `P4.RLS` en fin de séquence effectue une **revue de consolidation** (§3 · P4.RLS).

---

## 2. Feature flags

Tous à `false` par défaut. **Règle absolue** · aucun flag ne bascule à `true` en production avant que **les policies RLS des tables consommées par la fonctionnalité soient posées, testées, et le compteur IDOR / cross-tenant à zéro** pour le sous-lot correspondant.

| Flag | Environnement | Comportement disabled | Activable après |
|---|---|---|---|
| `CIRCLE_ENABLED` | env (Vercel + local) | UI cercle Racines → `<StateBlock title="Bientôt disponible">` | P4.1 complète · RLS `circles`, `circle_memberships`, `storage_objects`, `audit_events` OK · IDOR = 0 |
| `CENTER_REAL_DATA_ENABLED` | env | pages `/center/*` continuent d'afficher mocks (dev) ou StateBlock (prod) | P4.3a complète · RLS `classes`, `class_memberships`, `classrooms` OK · test cross-centre pass |
| `TEACHER_WORKSPACE_ENABLED` | env | `/teacher/*` renvoie state neutre (existant) | P4.3b complète · RLS `class_assignments`, `submissions`, `class_feedback` OK · test cross-class pass |
| `COACH_WORKSPACE_ENABLED` | env | `/coach/*` route absente (404 → landing) | P4.4 complète · RLS Circle actives · assignation coach auditée · Q15 capacité 20 profils / 10 Circles enforcée |
| `ASSIGNMENTS_ENABLED` | env | boutons devoirs cachés | P4.5 complète · RLS assignments/submissions/feedback OK · storage buckets privés créés · TTL courts vérifiés |
| `AUDIO_FEEDBACK_ENABLED` | env | feedback texte only | P4.5 complète · MIME allowlist + validation server-side + audio ≤ 3 min enforced |
| `CLOSED_MESSAGING_ENABLED` | env | fil classe/cercle → StateBlock | P4.6 complète · RLS threads/messages/circle_messages OK · `ThreadType.ONE_TO_ONE` désactivé côté route · rate limit actif |
| `NOTIFICATIONS_ENABLED` | env | `NotificationBell` reste muet | P4.7 complète · notifications sur événements réels uniquement (jamais décoratives) |
| `RACINES_COACH_OPERATIONAL` | déjà défini (`src/lib/pricing.ts`) | reste `false` jusqu'à P5 (paiement Suivi Racines) | après P4 complète + paiement `ROOTS_COACH_ADDON` opérationnel |

Convention de résolution ·

- `src/lib/flags.ts` (à créer P4.1) · fonction `getFlag(name): boolean` lit `process.env.YEMA_${name}` avec default `false`.
- Aucune valeur `true` ne doit être commit'ée en dev sans validation P4 du sous-lot.
- Toute désactivation en urgence (bug détecté post-activation) est immédiate via `false` env + redéploiement · aucune modification de policy RLS pour contourner.

---

## 3. Décomposition P4 recommandée

### P4.1 · Circle + permissions + RLS + Storage + AuditEvent + flags

**Objectif** · poser en une seule vague l'ossature de sécurité de P4. Aucun endpoint produit n'est exposé (`CIRCLE_ENABLED = false`), mais toute la chaîne — modèles, contraintes, helpers, RLS, storage buckets, audit socle, flags — est fonctionnelle et testée.

- Migration · **M1** (Circle + CircleMembership + AuditEvent + StorageObject + RLS helpers + policies Circle/CircleMembership/AuditEvent/StorageObject).
- Fichiers probables · `prisma/schema.prisma` (ajouts Circle, CircleMembership, AuditEvent, StorageObject, enums), `prisma/migrations/2026xxxx_p4_m1_foundations/migration.sql`, `src/lib/flags.ts`, `src/lib/storage/objects.ts` (create/read StorageObject + signed URL helpers), `src/lib/audit/events.ts` (append-only écriture AuditEvent), `src/lib/permissions/circle.ts` (assertCircleMembership, assertCircleOwner), `src/lib/permissions/rls.ts` (documentation Fonctions Postgres), `scripts/test-baseline/p4-seed-circle.mjs`, buckets Supabase créés via script `scripts/supabase-buckets-p4.mjs` (idempotent).
- Buckets Supabase créés · `class-audio`, `class-attachment`, `circle-audio`, `circle-attachment`, `submission-audio`, `feedback-audio` · tous **privés** · policies `storage.objects` restrictives.
- Dépendances · aucune.
- Tests · unit (contraintes SQL, XOR CHECK, unique conditionnel coach), IDOR de base (session anon → 0 rows sur `circles`), cross-tenant simulé (utilisateur A ne voit pas Circle de B), audit write append-only, storage upload MIME allowlist + refus MIME falsifié.
- Critères de merge · TS + tests + build verts · aucune UI exposée · RLS active testée par script `scripts/test-baseline/p4-rls-smoke.mjs` (à créer).
- Risques · faible (feature flag off + additif).

### P4.2 · Memberships + invitations + capacity guards

**Objectif** · rendre exploitables les gardes de capacité (2 adultes / 4 enfants / 1 coach par cercle / 1 cercle par langue). Câbler `AuditEvent` sur toutes les transitions de membership. Élargir RLS aux tables Class / ClassMembership / Household / HouseholdMembership / ChildProfile.

- Migration · **M2**.
- Fichiers probables · `src/app/api/family/adults/route.ts` (nouveau · POST invitation, DELETE retrait), `src/app/api/family/adults/[membershipId]/accept/route.ts` (nouveau · flow acceptation), `src/app/api/circles/[circleId]/route.ts` (nouveau · GET), `src/app/api/circles/[circleId]/members/route.ts` (nouveau · GET/POST/DELETE), `src/app/api/circles/[circleId]/coach/route.ts` (nouveau · POST/DELETE), `src/lib/data/circles.ts`, `src/lib/data/family.ts` (étendre avec adults), `src/lib/permissions/household.ts`.
- Décisions produit intégrées · Q1 (2ᵉ adulte lecture/accompagnement, jamais delete enfant · policy RLS `child_profiles` restreinte au `parent_user_id`), Q2 (OWNER seul invite), Q3 (OWNER retire OU adulte se retire lui-même), Q10 (retrait coach = accès immédiatement révoqué + historique conservé attribué).
- Dépendances · P4.1.
- Tests · concurrence (3ᵉ adulte simultané → 1 seul aboutit avec 409 `max_adults_reached`), invitation → acceptation lifecycle, retrait OWNER-only, self-retrait ADULT autorisé, audit trail vérifié pour chaque transition.
- Critères de merge · zéro cross-household leak vérifié · toutes les transitions génèrent un `AuditEvent`.
- Risques · moyen (nouvelle surface auth) — nécessite tests IDOR exhaustifs.

### P4.3a · Center real data · suppression des mocks

**Objectif** · connecter `/center/*` à Prisma réel, supprimer les mocks listés en `YEMA_P4_ARCHITECTURE_AUDIT.md §4`. RLS Center posée.

- Migration · aucune (utilise `LanguageCenter` + `Classroom` existants · RLS élargie via M2/M3 selon calendrier).
- Fichiers probables · `src/lib/data/center.ts` (nouveau · getCenterForUser, getCenterStudents, getCenterTeachers, getCenterClasses, getCenterPendingEnrollments), `src/app/[locale]/center/students/page.tsx` (remove `STUDENTS`, `PENDING`), `src/app/[locale]/center/teachers/page.tsx` (remove `MOCK_TEACHERS`), `src/app/[locale]/center/classes/page.tsx` (câbler getter), `src/app/api/center/route.ts` (élargir aux nouveaux getters), tests p4-center.
- Décision produit intégrée · Q12 (Center ne lit pas conversations par défaut · accès exceptionnel réservé au rôle `safeguarding` avec audit — rôle à créer P5 · en P4, aucune lecture message côté Center).
- Dépendances · P4.1.
- Tests · cross-center · Center A appelle `/api/center/students` avec `centerId=B` → 403 · RLS vérifiée · empty state honnête.
- Critères de merge · aucun `MOCK_*` restant dans `/center/*`, aucun `STUDENTS = [` hardcodé · flag `CENTER_REAL_DATA_ENABLED = true` uniquement après tests cross-centre verts.
- Risques · UI change (empty states) → à valider design avant merge.

### P4.3b · Teacher workspace

**Objectif** · connecter `/teacher/students/*`, `/teacher/classroom/*`, `/teacher/assignments/*` à Prisma. Supprimer les mocks listés.

- Migration · **M3** (feedback audio + submission status + RLS assignments/submissions/feedback/threads/messages).
- Fichiers probables · `src/lib/data/teacher.ts` (getTeacherClasses, getTeacherStudent, getTeacherAssignments), `src/app/[locale]/teacher/students/page.tsx` (remove mocks), `src/app/[locale]/teacher/students/[studentId]/page.tsx` (remove `MOCK_STUDENT`), `src/app/[locale]/teacher/courses/page.tsx` (remove `CLASSES`), `src/app/api/teacher/*` (élargir).
- Dépendances · P4.3a (pattern data layer établi).
- Tests · un teacher ne voit jamais un étudiant hors ses classes · un teacher d'un autre centre est bloqué par RLS.
- Critères de merge · aucun `MOCK_STUDENT`, `LEARNERS`, etc. restant · RLS Class/ClassMembership actives.
- Risques · impact UI (empty states) + validation feedback audio TTL.

### P4.4 · Coach Racines workspace

**Objectif** · endpoints `/api/coach/circles`, `/api/coach/circles/[id]/messages`, page `/coach` avec liste des cercles assignés + productions + feedback. Rôle `AppRole = RACINES_COACH` créé.

- Migration · aucune (Circle et RLS déjà posés en M1/M2 · nouveau rôle `RACINES_COACH` ajouté à l'enum `AppRole` via migration additive légère).
- Fichiers probables · `src/app/[locale]/coach/{page,circles/[circleId],circles/[circleId]/productions}/page.tsx` (nouveaux), `src/app/api/coach/{circles,circles/[id],circles/[id]/productions,circles/[id]/feedback}/route.ts`, `src/lib/data/coach.ts`, `src/lib/permissions/coach.ts`, `src/components/coach/*`.
- Décisions produit intégrées · Q4 (coach voit prénom/nom d'affichage + données pédagogiques minimales · aucune donnée personnelle), Q5 (échanges coach-enfant visibles au parent · vérifier à l'écriture `CircleMessage`), Q10 (retrait coach immédiat), Q15 (capacité initiale coach 20 profils actifs + 10 Circles max · compteur `countActiveProfilesByCoach(coachUserId)` + `countActiveCirclesByCoach(coachUserId)` · 409 `coach_capacity_reached` au-delà).
- Dépendances · P4.1, P4.2, P4.5 (feedback partiellement dispo).
- Tests · coach ne voit que ses cercles · coach ne peut envoyer message que dans ses cercles · quotas 8/mois enforced · Q15 capacités testées · `RACINES_COACH_OPERATIONAL` reste `false` en prod.
- Critères de merge · matrice permissions coach §7 permission-matrix passe à 100 %.
- Risques · nouvelle surface auth → tests IDOR exhaustifs.

### P4.5 · Assignments + submissions + feedback

**Objectif** · lifecycle complet devoir → soumission → feedback, texte + audio, Monde + Racines. Q13 (feedback immutable) + Q14 (parent répond dans fil structuré lié à la production) intégrées.

- Migrations · **M3** (déjà posée en P4.3b) + **M4** (CircleAssignment + CircleSubmission + CircleFeedback + CircleMessage + read state + RLS Circle).
- Fichiers probables · `src/app/api/assignments/*`, `src/app/api/submissions/*`, `src/app/api/feedback/*`, `src/app/api/circles/[id]/assignments/*`, `src/app/api/circles/[id]/submissions/*`, `src/app/api/circles/[id]/feedback/*`, `src/lib/data/assignments.ts`, `src/lib/feedback/*`, `src/components/assignments/*`.
- Décisions produit intégrées · Q6 (notes vocales enfant Circle/activité · visibles parent · 3 min max), Q7 (rétention 90 j audio Circle · 12 mois productions et feedbacks · validation juridique requise avant activation `AUDIO_FEEDBACK_ENABLED`), Q13 (feedback publié immuable · addendum via nouvelle ligne `circle_feedback.addendumOfFeedbackId`), Q14 (réponse parent dans le fil du cercle attaché à la production, pas en DM).
- Dépendances · P4.4.
- Tests · lifecycle complet · TEACHER crée, LEARNER soumet, TEACHER feedback texte + audio · idem Circle · immutabilité feedback vérifiée (tentative PATCH → 405).
- Critères de merge · statut Submission cohérent · audio URL signée TTL courts (10 min lecture, 5 min upload) · rétention 90 j scriptée (worker P5, mais `storage_objects.retention_until` calculé dès P4.5).
- Risques · gestion audio · politique juridique à valider Q7 avant activation.

### P4.6 · Closed messaging + audio

**Objectif** · messagerie fermée · Class Thread + Circle Message + read state + suppression + modération.

- Migration · M4 (partiellement en P4.5) + M5 (extensions).
- Fichiers probables · `src/app/api/classrooms/[id]/messages/*`, `src/app/api/circles/[id]/messages/*`, `src/components/messages/*`, `src/lib/messages/permissions.ts`, `src/lib/messages/moderation.ts`.
- Décisions produit intégrées · Q11 (rétractation auteur < 15 min · OWNER peut masquer · coach signale · admin supprime exceptionnellement avec audit `MESSAGE_DELETED`), Q12 (Center ne lit pas messages par défaut · rôle safeguarding P5).
- Traitement `ThreadType.ONE_TO_ONE` · **enum déprécié** · nouvelles créations interdites côté API (validation entrée · rejet 400 si `threadType === "ONE_TO_ONE"` sur POST) · routes correspondantes désactivées (`/api/classrooms/[id]/threads/one-to-one` n'est pas créé · aucun composant produit ne l'utilise) · **audit des lignes historiques** (`SELECT COUNT(*) FROM threads WHERE thread_type = 'ONE_TO_ONE'` en migration M5 pour metrics uniquement) · suppression destructive reportée à une migration ultérieure P5+.
- Dépendances · P4.4, P4.5.
- Tests · impossibilité création `ONE_TO_ONE` (test négatif · POST → 400) · impossibilité DM privé (aucune route) · read state cohérent · soft-delete audit trail complet · rate limit 10 msg/min/membership vérifié.
- Critères de merge · aucun endpoint acceptant `ONE_TO_ONE` · Q11 workflow complet (retract 15 min · OWNER hide · coach report · admin delete audité).
- Risques · surface d'attaque messagerie → tester exhaustivement les IDOR.

### P4.7 · Notifications + rate limiting + hardening

**Objectif** · consolidation · notifications réelles, rate limiting durable, observabilité, accessibilité, E2E complet.

- Migration · **M5** (notifications wiring + rate limit metadata).
- Fichiers probables · `src/lib/notifications/*`, `src/lib/rateLimit/*`, `src/app/api/notifications/*`, extensions à toutes les routes existantes pour ajouter rate limit.
- Dépendances · P4.6.
- Tests · E2E · Teacher, Coach, Center, Parent, Enfant, Monde, Racines, FR/EN, mobile, clavier, zoom 200 %, pièces jointes, erreurs réseau.
- Critères de merge · 0 blocker sécurité restant · toutes les routes P4 sous rate limit · notifications sur événements réels uniquement.
- Risques · rate limits mal calibrés → fausse détection abus.

### P4.RLS · Consolidation finale · revue des policies

**Objectif** · revue de conformité, pas première implémentation. Chaque migration M1-M5 a déjà posé et testé ses policies · ce sous-lot vérifie l'exhaustivité.

- Migration · aucune de tables. Uniquement `ALTER POLICY` correctifs si un manque est détecté.
- Fichiers probables · `docs/YEMA_P4_RLS_REVIEW.md` (nouveau · matrice tables × policies × tests), `scripts/test-baseline/p4-rls-consolidation.mjs` (test exhaustif sur les 20+ tables couvertes).
- Vérifications ·
  - Chaque table P4 (Circle, CircleMembership, CircleMessage, CircleAssignment, CircleSubmission, CircleFeedback, CircleMessageReadState, AuditEvent, StorageObject, Notifications rate_limit_counters) a une policy `SELECT`, `INSERT`, `UPDATE`, `DELETE` explicite.
  - Chaque table existante étendue P4 (Class, ClassMembership, ClassAssignment, Submission, ClassFeedback, Thread, Message, Household, HouseholdMembership, ChildProfile, DependentProfile, Notifications, AccessGrant, Order, Payment, LearningPath) a été activée avec les policies définies en M2/M3.
  - Aucune table ne repose sur `USING (auth.role() = 'service_role')` seul (sauf tables véritablement admin-only comme `audit_events`).
  - Aucun endpoint bypass RLS via `service_role` sans justification documentée.
- Dépendances · P4.7.
- Tests · script `p4-rls-consolidation.mjs` exécute pour chaque table + chaque rôle simulé (parent, enfant, teacher, coach, center admin, admin, anon) les 4 opérations CRUD et vérifie `ALLOW`/`DENY` conforme à la matrice.
- Critères de merge · 100 % des cellules matrice conformes · 0 régression IDOR.
- Risques · faible (revue).

---

## 4. Ordre P4 final

```
P4.1  Circle + permissions + RLS + Storage + AuditEvent + flags
P4.2  Memberships + invitations
P4.3a Center real data
P4.3b Teacher workspace
P4.4  Coach Racines workspace
P4.5  Assignments + submissions + feedback
P4.6  Closed messaging + audio
P4.7  Notifications + rate limiting + hardening
P4.RLS Final consolidation review
```

Cet ordre est **contraignant** :

- P4.1 pose Circle, RLS helpers, RLS Circle/CircleMembership/AuditEvent/StorageObject, buckets privés, MIME allowlist. Aucun endpoint produit exposé.
- P4.2 étend la RLS aux tables Household / ChildProfile / Class / ClassMembership avant tout flux d'invitation. `AuditEvent` déjà disponible depuis P4.1.
- P4.3a pose le pattern data layer serveur (`lib/data/center.ts`) et supprime les mocks avant P4.3b.
- P4.3b étend RLS aux tables ClassAssignment / Submission / ClassFeedback / Thread / Message via M3.
- P4.4 nécessite P4.2 (ownership OWNER + COACH) et P4.5 partiel (feedback).
- P4.5 pose les modèles Circle{Assignment,Submission,Feedback} avec RLS + storage_objects immédiatement associés.
- P4.6 (messagerie) hérite du storage privé posé en P4.1 et de la RLS posée au fil des migrations. Désactive `ThreadType.ONE_TO_ONE` côté API sans le retirer de l'enum.
- P4.7 consolidation notifications + rate limits + E2E complet.
- P4.RLS revue finale · aucune activation nouvelle, uniquement conformité et audit exhaustif.

---

## 5. Décisions produit validées (Q1-Q15)

Toutes les décisions ci-dessous sont **validées** post-revue 2026-07-23. Elles s'appliquent au sous-lot indiqué et ne nécessitent plus de re-validation avant démarrage P4.1.

### Q1 · Pouvoirs du deuxième adulte sur les profils enfants — VALIDÉ

- **Décision** · le deuxième adulte **voit et accompagne** les profils enfants, **mais ne les supprime pas** et **ne gère pas les memberships sensibles** (invitations, coach, retraits).
- **Mise en œuvre P4.2** · RLS `child_profiles` `SELECT` autorisé pour tout `is_household_member(household_id, auth.uid())` · `UPDATE`/`DELETE` restreint à `parent_user_id = auth.uid()`. Endpoints `POST/DELETE /api/family/children/*` refusent (403 `not_owner`) tout appel d'un adulte non-OWNER.
- **Audit** · `AuditEvent.CHILD_PROFILE_UPDATED` déclenché sur toute modification (owner seulement).
- **Sous-lot** · P4.2.

### Q2 · Invitation du deuxième adulte — VALIDÉ

- **Décision** · **OWNER seul** invite un deuxième adulte.
- **Mise en œuvre P4.2** · `POST /api/family/adults` vérifie `Household.ownerUserId === user.id`. Champ `HouseholdMembership.invited_by_user_id` obligatoire, contrainte serveur `invited_by_user_id = household.owner_user_id`.
- **Audit** · `AuditEvent.HOUSEHOLD_MEMBERSHIP_INVITED`.
- **Sous-lot** · P4.2.

### Q3 · Retrait du deuxième adulte — VALIDÉ

- **Décision** · **OWNER** peut retirer un adulte · l'adulte peut **quitter lui-même** son foyer.
- **Mise en œuvre P4.2** · `DELETE /api/family/adults/[membershipId]` accepte deux acteurs · l'OWNER du foyer OU le membership.userId lui-même. Toute autre requête → 403 `not_authorized`.
- **Audit** · `AuditEvent.HOUSEHOLD_MEMBERSHIP_REVOKED` avec metadata `revokedByRole = OWNER | SELF`.
- **Sous-lot** · P4.2.

### Q4 · Données coach sur l'enfant — VALIDÉ

- **Décision** · le coach voit **uniquement** un prénom ou nom d'affichage + données pédagogiques minimales (langue active, étape É actuelle, productions du cercle). Jamais nom de famille, date de naissance complète, email, téléphone, adresse, école.
- **Mise en œuvre P4.4** · `getCoachChildView(childProfileId, coachUserId)` retourne uniquement `{ id, prenom, avatarAnimal, age, activeLangue, echelle }` après vérification `is_circle_coach(circle_id, coach.id)`. Aucun autre champ exposé.
- **Sous-lot** · P4.4.

### Q5 · Visibilité parentale des échanges coach-enfant — VALIDÉ

- **Décision** · **tous les échanges coach-enfant** sont visibles au parent.
- **Mise en œuvre P4.4/P4.6** · `CircleMessage` toujours lisible par OWNER et ADULT du même Circle (jamais de sous-fil privé coach↔enfant). RLS `circle_messages` `SELECT` conditionné à `is_circle_member(circle_id, auth.uid())` sans distinction de sous-audience.
- **Sous-lot** · P4.4 + P4.6.

### Q6 · Notes vocales enfant — VALIDÉ

- **Décision** · les notes vocales enfant sont **limitées au Circle ou à une activité**, **visibles au parent**, durée **maximum 3 minutes**.
- **Mise en œuvre P4.5/P4.6** · `CircleMessage.messageType = AUDIO` autorisé pour `authorMembership.role = CHILD` uniquement si `circleId != null` (jamais DM). Validation serveur audio durée ≤ 180 s à l'upload (via metadata storage). Refus 400 `audio_duration_exceeded` sinon.
- **Sous-lot** · P4.5 pour upload · P4.6 pour messagerie.

### Q7 · Rétention audios — VALIDÉ (sous validation juridique)

- **Décision** · **90 jours pour messages audio Circle** · **12 mois pour productions et feedbacks** · **validation juridique requise** avant activation de `AUDIO_FEEDBACK_ENABLED = true` en production.
- **Mise en œuvre P4.5** · `StorageObject.retention_until` calculé à l'upload · worker de purge quotidien (à câbler P5). Buckets tagués par `purpose` pour appliquer la bonne rétention.
- **Blocker prod** · avis juridique écrit avant activation.
- **Sous-lot** · P4.5 pour calcul · worker P5.

### Q8 · Changement de langue d'un Circle — VALIDÉ

- **Décision** · un Circle actif **ne change pas de langue**. `Circle.language` immutable une fois `status = ACTIVE`.
- **Mise en œuvre P4.1** · aucune API `PATCH /api/circles/[id]` n'accepte le champ `language`. Contrainte serveur explicite. Aucun `AuditEvent.CIRCLE_LANGUAGE_CHANGED` émis en production (l'événement reste dans l'enum pour audit historique éventuel).
- **Sous-lot** · P4.1.

### Q9 · Nouvelle langue = nouveau Circle — VALIDÉ

- **Décision** · une nouvelle langue **crée un nouveau Circle** · l'ancien est **archivé** (`status = ARCHIVED`).
- **Mise en œuvre P4.1** · workflow OWNER · `POST /api/circles` avec `{ language }` · si un Circle actif existe déjà pour ce foyer sur cette langue → 409 `language_circle_exists` · sinon création. Pour transition, `PATCH /api/circles/[oldId]/archive` + `POST /api/circles` avec la nouvelle langue.
- **Sous-lot** · P4.1.

### Q10 · Remplacement d'un coach — VALIDÉ

- **Décision** · un coach remplacé perd **immédiatement** l'accès · l'historique **reste attribué et audité**.
- **Mise en œuvre P4.4** · retrait coach = `CircleMembership.status = REVOKED` + `revokedAt` + `AuditEvent.CIRCLE_COACH_UNASSIGNED`. Les `CircleMessage` du coach sortant conservent `authorMembershipId` (jointure via `authorMembership.status = REVOKED` reste lisible par les membres actifs). Nouveau coach = nouvelle `CircleMembership` `role = COACH` `status = ACTIVE`. Contrainte unique conditionnelle `WHERE role='COACH' AND status='ACTIVE'` empêche coexistence.
- **Sous-lot** · P4.4.

### Q11 · Suppression / masquage / signalement / suppression admin — VALIDÉ

- **Décision** · workflow à 4 niveaux ·
  - **Auteur** · rétractation sous **15 minutes** post-envoi (soft-delete contenu).
  - **OWNER** · peut **masquer** un message à tout moment sur son Circle (soft-hide, réversible sur 24 h).
  - **Coach** · peut **signaler** un message inapproprié (`MessageReport` avec `reason`, `status = PENDING`).
  - **Admin** · peut **supprimer exceptionnellement** avec audit obligatoire (`AuditEvent.MESSAGE_DELETED` avec `metadata.reason` obligatoire).
- **Mise en œuvre P4.6** · endpoints séparés · `DELETE /api/circles/[cid]/messages/[mid]` (auteur < 15 min) · `POST /api/circles/[cid]/messages/[mid]/hide` (OWNER) · `POST /api/messages/[mid]/report` (coach ou tout membre) · `DELETE /api/admin/messages/[mid]` (admin, requiert `reason`).
- **Sous-lot** · P4.6.

### Q12 · Lecture centre des conversations — VALIDÉ

- **Décision** · le Center **ne lit pas les conversations par défaut**. Accès exceptionnel réservé au **rôle safeguarding** (à créer P5) **avec audit obligatoire**.
- **Mise en œuvre P4.3a/P4.6** · RLS `messages` `SELECT` conditionné à `is_class_member(...) OR (is_center_admin(center_id, auth.uid()) AND has_safeguarding_role(auth.uid()))`. En P4, la seconde branche `has_safeguarding_role` retourne toujours `false` (rôle non encore créé) · donc en pratique aucun Center admin ne lit de message en P4.
- **Sous-lot** · P4.3a pour policy · P5 pour rôle safeguarding.

### Q13 · Immutabilité du feedback publié — VALIDÉ

- **Décision** · feedback publié **immuable** · modification par **nouvelle version ou addendum** (nouvelle ligne `class_feedback` / `circle_feedback` avec `addendumOfFeedbackId` pointant sur la version précédente).
- **Mise en œuvre P4.5** · aucune route `PATCH /api/feedback/[id]` n'existe · seul `POST /api/submissions/[sid]/feedback` (crée une nouvelle ligne). UI affiche la version la plus récente en haut avec badge « Correction complémentaire ».
- **Sous-lot** · P4.5.

### Q14 · Réponse parent au feedback coach — VALIDÉ

- **Décision** · le parent peut répondre dans un **fil structuré lié à la production**, **jamais en DM**.
- **Mise en œuvre P4.5** · `CircleFeedback` porte un `discussionThreadId?` optionnel · à la publication du feedback, un `CircleMessage` d'introduction est posté dans le fil général du Circle avec référence à la production. Toute réponse parent se fait dans ce fil, visible par OWNER, ADULT, CHILD concerné, COACH. Aucun sous-fil privé.
- **Sous-lot** · P4.5.

### Q15 · Capacité coach — VALIDÉ

- **Décision** · capacité initiale coach · **20 profils actifs** et **10 Circles maximum**.
- **Mise en œuvre P4.4** · fonctions `countActiveProfilesByCoach(coachUserId)` et `countActiveCirclesByCoach(coachUserId)` · toute assignation coach (`POST /api/circles/[cid]/coach`) vérifie les deux compteurs · 409 `coach_capacity_reached` avec `{ limit, current, dimension: "profiles" | "circles" }` si dépassement.
- **Sous-lot** · P4.4.

---

## 6. Plan de tests

### Unitaires

- Résolution permissions · `canAccessCircle(userId, circleId, expectedRole)` retourne les 4 valeurs attendues.
- Limites membres · fonction pure `wouldExceedAdultLimit(householdId)`.
- Statut assignment · transitions autorisées / interdites (ex. `ASSIGNED → COMPLETED` interdit sans passer par `SUBMITTED`).
- Read state · marquer lu → unread count 0.
- Quotas coach · `getCoachQuotaState(coachUserId, month)` calcule productions & rendez-vous.
- Visibilité parentale · fonction `parentCanSeeMessage(circleMessageId, parentUserId)` retourne true si parent est OWNER/ADULT du circle.

### Intégration

- Cross-center · Center A ne voit pas un étudiant de Center B (`/api/center/students?centerId=B`) → 403.
- Cross-class · Teacher X ne voit pas la Class Y d'un autre teacher → 403.
- Cross-circle · Coach C ne voit pas le Circle d'un autre foyer → 403.
- Cross-household · Parent P1 ne voit pas un ChildProfile de P2 → 404.
- Coach non assigné · POST feedback sur Submission d'un cercle non assigné → 403.
- Teacher non assigné · idem.
- Enfant retiré du cercle · GET messages → 403 (session stale bloquée).
- AccessGrant expiré · `me/racines-dashboard` retourne `mode: NO_ACCESS` correctement.

### Concurrence

- 5ᵉ enfant simultané · deux `POST /api/family/children` en parallèle → un seul aboutit, l'autre 409.
- 3ᵉ adulte simultané · idem.
- Double coach · deux `POST /api/circles/[id]/coach` simultanés → un aboutit, l'autre 409.
- Double Circle même langue · idem sur `POST /api/circles`.
- Double soumission · deux `POST /api/submissions` sur même `assignmentId` par même user → un aboutit.
- Double message · dédup impossible en base (chaque message a un cuid distinct) → mais ne pas double-poster si click 2× (idempotency-key optionnel).

### E2E (Playwright, script `p4-e2e.mjs`)

- Teacher parcours complet · crée classe → invite étudiant → crée devoir → l'étudiant soumet → teacher feedback texte + audio → étudiant lit.
- Coach parcours · l'OWNER invite coach → coach accepte → crée `CircleAssignment` → enfant soumet → coach feedback → parent lit.
- Center parcours · connexion CENTER_ADMIN → voit tableaux réels → tente d'accéder autre centre → 403.
- Parent parcours · gestion 4 enfants max, invitation 2ᵉ adulte, retrait, changement profil actif.
- Enfant parcours · sélection profil actif, envoi audio dans cercle (si Q6 = YES), lecture feedback coach.
- Monde parcours · student complet A1 module → soumission → feedback.
- Racines parcours · similaire dans Circle.
- FR/EN · toutes routes disponibles dans les deux langues.
- Mobile · 360, 390 viewports.
- Clavier · tab trace complet.
- Zoom 200 % · dashboard + Circle + Classroom.
- Pièces jointes · upload MIME valide OK · MIME invalide rejeté.
- Erreurs réseau · offline retry, 500 handled gracefully.

### Sécurité

- IDOR · pour chaque `[id]` dans les URLs P4, tenter accès avec ID d'un autre utilisateur → 403.
- Enumeration · brute force `GET /api/circles/[cuid]` → 403 systématique, pas de leak par timing.
- Upload MIME falsifié · header `content-type: audio/webm` mais bytes PDF → rejet.
- URL signée expirée · attendre TTL + 10 s puis GET → 401.
- Message après retrait · retrait membership, ancien token session encore valide, POST message → 403.
- Stale session · révocation session Supabase (côté admin), tentative POST → 401.
- Privilege escalation · LEARNER tente PATCH `ClassMembership.role = TEACHER` → 403.

---

## 7. Blockers de lancement P4

Aucun sous-lot ne peut être activé en production avec un blocker ouvert. Chaque check est vérifié **par sous-lot** avant activation du flag correspondant.

- [ ] 0 IDOR sur toutes les routes du sous-lot (test §Sécurité)
- [ ] 0 cross-center leak (test §Intégration · sous-lot P4.3a+)
- [ ] 0 cross-circle leak (sous-lot P4.2+)
- [ ] 0 cross-household leak (sous-lot P4.2+)
- [ ] 0 message privé adulte-enfant possible (sous-lot P4.6)
- [ ] RLS policies posées **au moment de la migration** (M1-M5 · pas reportées à P4.RLS)
- [ ] Storage buckets privés créés avec policies (posés P4.1)
- [ ] URLs signées TTL courts systématiques (5 min upload · 10 min lecture)
- [ ] Rate limiting actif sur endpoints messagerie (P4.7)
- [ ] `AuditEvent` capture toutes les actions sensibles (socle P4.1 · câblages progressifs)
- [ ] `ThreadType.ONE_TO_ONE` bloqué côté API (P4.6 · aucune suppression destructive de l'enum en P4)
- [ ] Feature flags à `false` par défaut jusqu'à validation du sous-lot
- [ ] Tests ownership complets par sous-lot (100 % pass rate)
- [ ] Décisions produit Q1-Q15 intégrées et testées (§5 · toutes validées 2026-07-23)
- [ ] Validation juridique Q7 obtenue avant `AUDIO_FEEDBACK_ENABLED = true`

---

## 8. État de départ · fichiers créés / modifiés dans cet audit

Créés ·

- `docs/YEMA_P4_ARCHITECTURE_AUDIT.md`
- `docs/YEMA_P4_PERMISSION_MATRIX.md`
- `docs/YEMA_P4_THREAT_MODEL.md`
- `docs/YEMA_P4_IMPLEMENTATION_PLAN.md` (ce document)

Modifiés ·

- `docs/YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md` (bloc P4 uniquement)

Aucun fichier source, aucune migration, aucun package, aucun secret, aucune landing, aucun test produit modifié.

---

## 9. Décision

**P4 AUDIT READY TO MERGE**

- Architecture Circle · pseudo-schéma + contraintes (`YEMA_P4_ARCHITECTURE_AUDIT.md §5-8`) · Option A confirmée
- Matrice permissions · complète pour tous les rôles globaux et locaux (`YEMA_P4_PERMISSION_MATRIX.md`) · rôle `RACINES_COACH` intégré
- Threat model · menaces CRITICAL/HIGH/MEDIUM/LOW · RLS activée dès P4.1 · storage privé · retention Q7 (`YEMA_P4_THREAT_MODEL.md`)
- Plan · migrations M1-M5 avec RLS intégrée · feature flags · sous-lots P4.1 → P4.7 · P4.RLS revue finale · tests · blockers (ce document)
- Décisions produit Q1-Q15 · toutes **validées** post-revue 2026-07-23
- Codes définitifs · `ProductCode = ROOTS_COACH_ADDON` · Nom commercial · « Suivi Racines » · `AppRole = RACINES_COACH` (jamais `CAREER_COACH`)
- Politique `ChildProfile` · représentation canonique enfants · `DependentProfile` audité et déprécié P4, aucune suppression destructive
- `ThreadType.ONE_TO_ONE` · déprécié · nouvelles créations interdites · aucune suppression destructive en P4

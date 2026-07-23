# YEMA · P4.3b · Teacher workspace sécurisé et connecté aux données réelles

> Livrables du sous-lot **P4.3b** — dashboard, classes, détail classe, étudiants et planning de l'enseignant servis depuis Prisma, strictement filtrés par le Teacher courant.
>
> **Branche** · `feat/yema-p4-3b-teacher-workspace`
> **Base** · `main` post-merge P4.3a (`a14fac8`, tag `yema-p4-3a-validated-20260723`)
> **Portée** · lecture seule scopée par Teacher. **Aucune console assignments/submissions/messages, aucun paiement, aucun ajout libre d'étudiant, aucune modification de progression.** Le feature flag `TEACHER_WORKSPACE_ENABLED` reste `false` par défaut. En production, `TEACHER_RLS_CONFIRMED=true` est également requis.
>
> **Sources doctrine** · `YEMA_P4_ARCHITECTURE_AUDIT.md` · `YEMA_P4_PERMISSION_MATRIX.md` · `YEMA_P4_THREAT_MODEL.md` · `YEMA_P4_IMPLEMENTATION_PLAN.md` · `YEMA_P4_3A_CENTER_REAL_DATA.md` · `YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md`.

---

## 1. Source de vérité Teacher

Un enseignant Monde est identifié par un `Teacher` row (`Teacher.userId @unique`). Le rôle applicatif accepté est ·

1. Legacy V1 · `User.role ∈ { "TEACHER", "ADMIN" }`.
2. V2 · `UserAppRole.role ∈ { "TEACHER", "YEMA_ADMIN" }`.

**Aucun** autre chemin n'ouvre l'espace Teacher · Center admin seul, Coach Racines (`CAREER_COACH` / `RACINES_COACH`), Student → `403 teacher access required`.

**Aucun** `teacherId`, `centerId`, `classroomId` client (body/query/param/header) n'est jamais accepté comme source d'autorité. Le classroom fourni en URL (`/api/teacher/classes/[classroomId]`) est **validé via `assertTeacherOwnsClassroom`** — toute classe étrangère renvoie `404 class not found` sans oracle.

---

## 1.1 Règle YEMA_ADMIN (§7 hardening)

Un rôle global `ADMIN` (V1) ou `YEMA_ADMIN` (V2) **ne donne pas** un accès automatique à l'espace Teacher. Le resolver accepte l'utilisateur au niveau du rôle applicatif (étape 1) mais tombe sur `ZERO_BINDING` (404) si aucun `Teacher` row n'est attaché. L'accès Teacher provient donc **du binding, pas du rôle global**. Deux personas fixtures illustrent la règle · `TEST_YEMA_ADMIN_WITHOUT_TEACHER_BINDING` → 404, `TEST_YEMA_ADMIN_WITH_TEACHER_BINDING` → 200 via le Teacher row rattaché à un centre. L'entrée YEMA_ADMIN dans les policies RLS (`is_yema_admin`) reste un bypass distinct destiné au backoffice support · en API applicative, elle ne dispense pas de `resolveTeacherActor`.

## 2. Résolveur serveur — `resolveTeacherActor`

Fichier · `src/lib/permissions/teacher.ts`.

Contrat trois-états ·

| Situation | Statut | Code |
|---|:---:|---|
| Anonyme | 401 | `UNAUTHORIZED` |
| Aucun rôle Teacher | 403 | `FORBIDDEN teacher access required` |
| Rôle Teacher, aucun Teacher row | 404 | `NOT_FOUND no teacher membership resolved` |
| Rôle Teacher, un Teacher row + binding cohérent | 200 | `ONE_BINDING` |
| Rôle Teacher, 2+ Teacher rows (défensif · schéma cassé) | 409 | `CONFLICT teacher scope ambiguous` |
| Teacher inactif | 404 | (via `assertTeacherOwnsClassroom` sur classes vides) |
| Center admin sans rôle Teacher | 403 | `FORBIDDEN` |
| Racines Coach / Career Coach | 403 | `FORBIDDEN` |

Défense en profondeur · `prisma.teacher.findMany({ where: { userId }, take: 2 })` détecte explicitement toute ambigüité même si `@unique userId` cassait. Aucun `findFirst` arbitraire, aucun `orderBy` implicite.

Helpers ·
- `assertTeacherOwnsClassroom(actor, classroomId)` · vérifie `classroom.teacherId = actor.teacherId`, throw 404 sinon.
- `assertTeacherCanViewStudent(actor, studentUserId)` · vérifie une `ClassroomEnrollment` active dans une classe du Teacher, throw 404 sinon.

Variante `resolveTeacherActorOrNull()` — même contrat, retourne `null` sur toute PermissionError · pages SSR redirigent vers `/login`.

---

## 3. Modèles Prisma utilisés

| Modèle | Rôle en P4.3b | Filtre obligatoire |
|---|---|---|
| `User` | acteur applicatif + étudiants inscrits | `id = actor.userId` (resolver) |
| `UserAppRole` | check V2 role | `userId = actor.userId AND role IN ('TEACHER','YEMA_ADMIN')` |
| `Teacher` | binding du caller + liste enseignants | `userId = actor.userId` (resolver, `take: 2`) |
| `LanguageCenter` | centre du Teacher (info seulement) | via `Teacher.centerId` |
| `Classroom` | classes du Teacher | `teacherId = actor.teacherId` |
| `ClassroomEnrollment` | étudiants actifs | `isActive = true AND classroom.teacherId = actor.teacherId` |
| `ClassJoinRequest` | demandes en attente | `status = 'pending' AND toClassroomId IN (teacherClasses)` |

**Aucune migration additive** de schéma. Le schéma existant suffit (§4 spec).

---

## 4. Service Prisma — `src/lib/teacher/queries.ts`

Cinq fonctions, chacune reçoit `teacherId: string` **résolu serveur** ·

- `getTeacherDashboard(teacherId)` → `{ classroomCount, activeStudentCount, pendingRequestCount }`.
- `getTeacherClasses(teacherId, { page, pageSize, query })` → pagination (`MAX_PAGE_SIZE = 100`), search allowlist sur `name`.
- `getTeacherClass(teacherId, classroomId)` → détail scopé (double-check `teacherId` dans le seam).
- `getTeacherClassStudents(teacherId, classroomId, { page, pageSize, query })` → étudiants actifs, projection sans email/phone/dateOfBirth.
- `getTeacherStudents(teacherId, { page, pageSize, query })` → agrégé sur toutes les classes du Teacher.
- `getTeacherSchedule(teacherId)` → **LOCK_HONESTLY** · retourne `{ available: false }` (aucun modèle de planning persistant).

Pagination · `DEFAULT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 100`, `page ≥ 1`, `query.length ≤ 80`. Aucune query Prisma construite depuis un champ arbitraire client.

**Projections** · id, `fullName`, `speciality`, `languages`, `isVerified`, `centerId`, `classroomCount`, `activeStudentCount`, `level`, `code`, `maxStudents`, `joinedAt`, `createdAt`. Champs **jamais exposés** · `email`, `phone`, `dateOfBirth`, `hourlyRate`, `address`, `availabilitySchedule`, `Household`, `ChildProfile`, données Racines, données paiement, autres centres.

---

## 5. Routes SSR — `src/app/[locale]/teacher/…`

Toutes en Server Components (`export const dynamic = "force-dynamic"`), aucun `use client` en tête.

| Route | Composant | Rôle |
|---|---|---|
| `/{locale}/teacher` | `TeacherDashboardView` | Compteurs réels + placeholders LOCK_HONESTLY |
| `/{locale}/teacher/classes` | `TeacherClassesView` | Pagination + search |
| `/{locale}/teacher/classes/[classroomId]` | `TeacherClassDetailView` | Détail + étudiants scopés |
| `/{locale}/teacher/students` | `TeacherStudentsView` | Étudiants agrégés |
| `/{locale}/teacher/schedule` | `TeacherLockedView` | LOCK_HONESTLY |
| `/{locale}/teacher/assignments` | `TeacherLockedView` | Verrouillé (P4.5) |
| `/{locale}/teacher/activities` | `TeacherLockedView` | Verrouillé (P4.5) |

Routes **redirigées** vers la nouvelle canonique ·
- `/{locale}/teacher/classrooms` → `/teacher/classes`
- `/{locale}/teacher/classroom/[classroomId]` → `/teacher/classes/[classroomId]` (élimine 905 lignes de mock)
- `/{locale}/teacher/students/[studentId]` → `/teacher/students` (élimine 638 lignes de mock avec Racines/Household leaks potentiels)
- `/{locale}/teacher/stats` → `/teacher` (dashboard)

Flow commun ·
1. `await params` (Next 16).
2. `if (!isTeacherWorkspaceActive())` → `<TeacherFeaturePlaceholder>`.
3. `resolveTeacherActorOrNull()` → redirect `/login` si `null`.
4. Charge via seam.
5. Rend le composant SSR.

---

## 6. Endpoints API — `src/app/api/teacher/…`

| Méthode & route | Payload | Statuts |
|---|---|---|
| `GET /api/teacher/me` | — | 200 `{ teacher, center, actorRole }` · 401/403/404/409 · 404 (flag off) |
| `GET /api/teacher/dashboard` | — | 200 `{ teacher, center, stats }` |
| `GET /api/teacher/classes` | `?page&pageSize&query` | 200 `{ items, total, page, pageSize }` |
| `GET /api/teacher/classes/[classroomId]` | — | 200 `{ classroom }` · 404 si étranger |
| `GET /api/teacher/classes/[classroomId]/students` | `?page&pageSize&query` | 200 `{ items, total, page, pageSize }` · 404 si classroomId étranger |
| `GET /api/teacher/students` | `?page&pageSize&query` | 200 idem |
| `GET /api/teacher/schedule` | — | 200 `{ schedule: { available: false } }` |

Contrat commun ·
1. `if (!isTeacherWorkspaceActive())` → `404`.
2. `resolveTeacherActor()` puis `assertTeacherOwnsClassroom` si `classroomId` en URL.
3. Appel du seam.
4. `catch → mapErrorToResponse(e)` · mapping stable `PermissionError → 401/403/404/409`.

**Aucun** endpoint ne lit `body.centerId`, `query.centerId`, `query.teacherId`, `params.teacherId` ou un header — ces champs sont **ignorés silencieusement**.

Codes stables retournés ·
- `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409).
- `class_not_found` (404) sur `classroomId` étranger.
- `teacher_endpoint_deprecated` (404) sur legacy `/api/teacher`.

---

## 7. Endpoint legacy fermé

`/api/teacher/route.ts` acceptait ·
- `POST { type: "assignment", classroomId }` **sans** vérification d'ownership → un Teacher pouvait créer un assignment sur une classroom arbitraire.
- `PUT { assignmentId, userId, score, feedback }` **sans** vérification d'ownership sur le submission.
- `GET ?action=classrooms/students/dashboard/code` → projection large (email, xp, streak).

Zéro consommateur détecté (grep `fetch.*api/teacher["'?]` hors nouveaux endpoints). Fermé à **`404 teacher_endpoint_deprecated`** pour tous les verbes. Le workflow assignments/grading appartient à P4.5 avec ownership `AssignmentSubmission.assignment.classroom.teacherId = self` obligatoire.

---

## 8. Feature flag · double confirmation

Registre · `src/lib/flags.ts`.

Deux flags serveur-only ·
- `TEACHER_WORKSPACE_ENABLED` (`process.env.YEMA_TEACHER_WORKSPACE_ENABLED`).
- `TEACHER_RLS_CONFIRMED` (`process.env.YEMA_TEACHER_RLS_CONFIRMED`) · certifie que les policies RLS PostgreSQL P4.3b ont été appliquées et validées.

API publique · `isTeacherWorkspaceActive()`. Comportement identique au pattern Center P4.3a ·

- `WORKSPACE_ENABLED=false` → false.
- `WORKSPACE_ENABLED=true` **et** `NODE_ENV !== "production"` → true (dev/test/P-1).
- `WORKSPACE_ENABLED=true` **et** `NODE_ENV === "production"` **et** `RLS_CONFIRMED=false` → **false** (production sans RLS = 404 sécurisé).
- Les deux flags à `true` en prod → true.

**Aucun** `NEXT_PUBLIC_YEMA_TEACHER_*` déclaré. Un composant client ne peut pas activer les flags.

---

## 9. RLS versionnée

Migration additive · `prisma/migrations/20260723000005_p4_3b_teacher_rls/migration.sql`.

Trois nouveaux helpers SQL, tous `SECURITY INVOKER` avec `search_path = public, pg_temp` verrouillé ·
- `public.is_teacher(user_id)` · true si User.role ∈ {TEACHER, ADMIN} OU UserAppRole.role ∈ {TEACHER, YEMA_ADMIN}.
- `public.is_teacher_for_classroom(classroom_id, user_id)` · true si `classroom.teacher.userId = user_id`.
- `public.is_active_student_in_classroom(classroom_id, user_id)` · true si `ClassroomEnrollment.isActive = true AND userId = user_id`.

Grants ·
```
REVOKE ALL ON FUNCTION public.is_teacher(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_teacher(TEXT) TO authenticated;
```
(idem pour les 3 helpers). Aucun grant à `anon`.

Policies ·

| Table | Policy | Contenu |
|---|---|---|
| `public.teachers` | `teachers_select_self` | `userId = current_app_user_id() OR is_yema_admin(current)` |
| `public.classrooms` | `classrooms_select_teacher_scope` | `is_teacher_for_classroom(id, current) OR is_yema_admin(current)` |
| `public.classroom_enrollments` | `enrollments_select_owner_or_teacher` | `userId = current OR is_teacher_for_classroom(classroomId, current) OR is_yema_admin(current)` |
| `public.class_join_requests` | `class_join_requests_select_scope` | `fromUserId = current OR (toClassroomId IS NOT NULL AND is_teacher_for_classroom(toClassroomId, current)) OR is_yema_admin(current)` |

**Aucune** politique WRITE en P4.3b · les écritures classroom/enrollment resteront route serveur + `assertTeacherOwnsClassroom` jusqu'à P4.5 (assignments).

Nouvelles valeurs `AuditAction` idempotent · `TEACHER_ACCESS_DENIED`, `TEACHER_CLASS_ACCESS_DENIED`, `TEACHER_STUDENT_ACCESS_DENIED`, `TEACHER_SCOPE_AMBIGUOUS`.

**Correctif migration** · `20260723000006_p4_3b_teacher_rls_fix` bascule les 3 helpers Teacher de `SECURITY INVOKER` vers `SECURITY DEFINER` (avec `search_path = public, pg_temp` conservé). Motivation · récursion infinie détectée en runtime · `is_teacher_for_classroom` en INVOKER lisait `public.classrooms`, ce qui appliquait à nouveau la policy et rappelait le helper. Pattern identique à `is_circle_member`, `is_class_member`, `is_center_admin` posés en P4.1 §5.

**Émissions AuditEvent** (fire-and-forget · sanitizeMetadata en défense) · voir `src/lib/permissions/teacher.ts` ·
- `TEACHER_ACCESS_DENIED` sur rôle Teacher absent (Center admin, Student, Coach) · metadata `{reasonCode, appRoles}`.
- `TEACHER_CLASS_ACCESS_DENIED` sur classroomId existant mais étranger · metadata `{reasonCode, actorTeacherId, targetTeacherId, targetCenterId}`.
- `TEACHER_STUDENT_ACCESS_DENIED` sur student existant mais hors des classes du Teacher · metadata `{reasonCode, actorTeacherId, targetClassroomTeacherId}`.
- `TEACHER_SCOPE_AMBIGUOUS` sur multi-Teacher rows · metadata `{reasonCode, teacherRowCount}`.
- `ZERO_BINDING` · aucun audit (bruit sur onboarding attendu).

Metadata interdits (filtrés par `sanitizeMetadata`) · `body`, `message`, `audioUrl`, `signedUrl`, `token`, `password`, `transcription`. Un événement max par refus.

---

## 10. Fixtures P-1 · `scripts/test-baseline/p4-3b-fixtures.mjs`

Idempotentes (`seed | clean | list`). Refusent la production via `_common.mjs` durci (P4.3a hardening).

| ID / label | Rôle | Binding |
|---|---|---|
| `TEST_TEACHER_A` (`paul+p4_3b_teacher_a`) | TEACHER + `TEACHER` | Center A, classe A1+A2 |
| `TEST_TEACHER_B` (`paul+p4_3b_teacher_b`) | TEACHER + `TEACHER` | Center B, classe B1 |
| `TEST_TEACHER_AMBIGUOUS` (`paul+p4_3b_teacher_ambig`) | TEACHER | Teacher.centerId=A + User.centerId=B (rôle Center legacy divergent) |
| `TEST_TEACHER_ZERO_BINDING` (`paul+p4_3b_teacher_zero`) | TEACHER (rôle OK) | AUCUN Teacher row |
| `TEST_CENTER_ADMIN_ONLY` (`paul+p4_3b_center_admin`) | CENTER + `CENTER_ADMIN` | aucun rôle TEACHER → attend 403 |
| `TEST_STUDENT_A_1` / `A_2` / `B_1` | STUDENT + `LEARNER` | Enrolments actifs A1/A1/B1 |
| `TEST_STUDENT_REMOVED` | STUDENT | Enrollment A1 `isActive=false` → doit être exclu |
| `TEST_RACINES_COACH` | STUDENT + `CAREER_COACH` (enum P-1 n'a pas encore `RACINES_COACH`) | attend 403 |

Classes ·
- `test_p4_3b_class_a1` (level A1, teacher A, center A)
- `test_p4_3b_class_a2` (level A2, teacher A, center A)
- `test_p4_3b_class_b1` (level B1, teacher B, center B)

Cleanup · `node scripts/test-baseline/p4-3b-fixtures.mjs clean`.

---

## 11. Smoke Playwright — `p4-3b-smoke.mjs`

Vérifie runtime ·

- `me` · teacherA/B → 200, teacherZero → 404 NOT_FOUND, centerAdmin → 403, studentA1 → 403, racinesCoach → 403, anon → 401.
- `dashboard` · stats distincts par Teacher.
- `classes` · teacherA voit A1+A2, teacherB voit B1, `overlap = []`.
- `classes/[CLASS_B1]` avec cookies A → `404 class_not_found`.
- `classes/[CLASS_A1]/students` avec cookies A → 2 items (retired exclu), `classes/[CLASS_B1]/students` avec cookies A → 404.
- `students` agrégés · zéro chevauchement A/B.
- Injections · `?teacherId=<B>&centerId=<B>`, header `x-teacher-id`, `x-center-id` → tous ignorés (scope reste A).
- `schedule` → `{ available: false }`.
- Legacy `/api/teacher` → `404 teacher_endpoint_deprecated`.

---

## 12. Runtime UI — `p4-3b-visual.mjs`

6 routes Teacher × 2 locales × 4 viewports = **48 renders**. Vérifie ·
- HTTP 200 partout,
- `overflow ≤ 2px`,
- aucun nom mock (Marie Tchamba, Sophie Tanda, etc.),
- aucun marqueur Center B / Class B / TEST P4.3b Teacher B chez le Teacher A,
- console errors (hydration warning pré-existant framework hors P4.3b).

---

## 13. Limitations et dépendances

Explicitement **non couverts en P4.3b** ·
- Création/gestion d'assignments (P4.5).
- Notation de submissions (P4.5).
- Feedback structuré (P4.5).
- Notes vocales / audio (P4.6).
- Messagerie fermée Teacher–Student (P4.6).
- Notifications runtime (P4.7).
- Console Coach Racines (P4.4).
- Planning fin (LOCK_HONESTLY jusqu'à modèle persistant).
- Progression fine par étudiant (LOCK_HONESTLY).
- Ajout libre d'étudiant / retrait (workflow signé futur).

Le legacy `/api/teacher/route.ts` est **fermé** en P4.3b (404 stable). Le legacy `/api/classroom` et `/api/classrooms` restent à auditer en P4.4/P4.5 (hors scope P4.3b).

---

## 14. Verdict d'intégration

- Feature flag `TEACHER_WORKSPACE_ENABLED` = `false` par défaut → aucun code réel activé sans intervention explicite serveur.
- En production, `TEACHER_RLS_CONFIRMED=true` requis en plus.
- Zéro mock résiduel dans les pages Teacher produites/modifiées.
- Zéro leak cross-teacher / cross-center sur les 7 endpoints P4.3b.
- Zéro modification hors du scope Teacher (Center P4.3a intouché, landing intouchée, RLS Center intouchées).
- Migration RLS additive · `20260723000005_p4_3b_teacher_rls`.

**Statut** · prêt à merger dans `main` sous flag off, avec plan RLS déjà versionné (à appliquer P-1 avant activation prod).

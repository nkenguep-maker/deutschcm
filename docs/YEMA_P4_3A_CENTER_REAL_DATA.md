# YEMA · P4.3a · Espaces Center connectés aux données Prisma réelles

> Livrables du sous-lot **P4.3a** — dashboard, enseignants, classes, étudiants et inscriptions du centre servis depuis Prisma, strictement filtrés par le centre de l'utilisateur connecté.
>
> **Branche** · `feat/yema-p4-3a-center-real-data`
> **Base** · `main` post-merge P4.2 (`9940c58`)
> **Portée** · lecture seule scopée par centre. **Aucune console Teacher/Coach, aucune messagerie, aucun devoir, aucun paiement, aucune interface Circle.** Le feature flag `CENTER_REAL_DATA_ENABLED` reste `false` par défaut.
>
> **Sources doctrine** · `YEMA_P4_ARCHITECTURE_AUDIT.md` · `YEMA_P4_PERMISSION_MATRIX.md` · `YEMA_P4_THREAT_MODEL.md` · `YEMA_P4_IMPLEMENTATION_PLAN.md` · `YEMA_P4_1_CIRCLE_SECURITY.md` · `YEMA_P4_2_MEMBERSHIPS_INVITATIONS.md` · `YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md` §P4-3a.

---

## 1. Source de vérité du centre

La relation persistée qui rattache l'utilisateur applicatif à un centre est · `User.teacher.centerId` (`Teacher` → `LanguageCenter`). Un directeur de centre est modélisé comme un `Teacher` de son propre centre — pattern déjà en place depuis P0.B, confirmé par les fixtures (§8).

**Aucune** des sources suivantes n'est jamais utilisée comme autorité ·

- adresse email ou domaine ;
- `body.centerId`, `query.centerId`, header `centerId`, `params.centerId` ;
- `centerId` cookié côté client ;
- rôle applicatif isolé sans `Teacher.centerId` associé.

Deux rôles sont acceptés en amont ·

1. Legacy **V1** · `User.role ∈ { "CENTER", "ADMIN" }`.
2. **V2** · `UserAppRole.role ∈ { "CENTER_ADMIN", "YEMA_ADMIN" }`.

Un utilisateur possédant l'un de ces rôles mais **sans** `Teacher.centerId` reçoit `404 no center membership resolved`. Un centre dont le nom est vide (convention interne pour "désactivé") reçoit `404 center inactive`.

---

## 2. Résolveur serveur — `resolveCenterActor`

Fichier · `src/lib/permissions/center.ts`.

**Contrat trois-états** · toute résolution produit exactement `ZERO_BINDING` (404), `ONE_BINDING` (200) ou `AMBIGUOUS_BINDING` (409). Aucun `findFirst`, aucun `orderBy` implicite, aucun tri arbitraire.

Séquence stricte ·

1. `resolveCircleActor()` (P4.1) — lit la session Supabase, mappe `supabaseId → users.id`, throw `401 UNAUTHORIZED` si anonyme.
2. `prisma.user.findUnique({ id: actor.userId })` en projection minimale — vérifie `role`, `appRoles`, `centerId` (legacy Student column).
3. `403 FORBIDDEN` si aucun rôle centre.
4. `prisma.teacher.findMany({ where: { userId }, take: 2 })` — défense-en-profondeur, permet la détection explicite d'un binding multiple même si `Teacher.userId @unique` cassait.
5. `404 NOT_FOUND` si `teacherRows.length === 0` ou `centerId` null (ZERO_BINDING).
6. `409 CONFLICT` si `teacherRows.length > 1` (AMBIGUOUS · schéma cassé) **ou** si `dbUser.centerId` (legacy) diverge de `teacher.centerId` (AMBIGUOUS · rattachement inconsistant).
7. `404 NOT_FOUND` si `teacher.center.name` vide (centre inactif).
8. Retourne `{ userId, supabaseId, centerId, center, actorRole }` avec `center` projeté à `{ id, name, city, country, plan, isVerified, code }` (aucun secret, aucun champ interne).

Variante `resolveCenterActorOrNull()` — même contrat, retourne `null` sur toute PermissionError · utilisée par les pages SSR qui redirigent vers `/login` sans révéler la cause.

**Extension mapping erreur** · `PermissionError.code = "CONFLICT"` est mappé à `409 center scope ambiguous` par `mapErrorToResponse` (`src/lib/api/circleErrors.ts`).

---

## 3. Modèles Prisma utilisés

| Modèle | Rôle en P4.3a | Filtre obligatoire |
|---|---|---|
| `User` | acteur applicatif + étudiants inscrits | `id = actor.userId` (resolver) · `classroomEnrollments.some.classroom.centerId = centerId` (query étudiants) |
| `UserAppRole` | V2 role check | `userId = actor.userId AND role IN ('CENTER_ADMIN','YEMA_ADMIN')` |
| `Teacher` | rattachement centre du caller + liste enseignants | `centerId = resolved.centerId` |
| `LanguageCenter` | source du centre courant | `id = resolved.centerId` |
| `Classroom` | classes du centre | `centerId = resolved.centerId` |
| `ClassroomEnrollment` | inscription active d'un étudiant | `isActive = true AND classroom.centerId = resolved.centerId` |
| `ClassJoinRequest` | demandes en attente | `status = 'pending' AND toClassroomId IN (centerClasses)` |

**Aucune migration additive** créée en P4.3a. Le schéma existant permet toutes les relations nécessaires — voir §26 spec.

**AccessGrant / Product / ProductVariant / ProductEntitlementRule** ·  non exposés en P4.3a — la relation `AccessGrant → LanguageCenter` n'est pas persistée à ce jour et la capacité contractuelle n'est pas modélisée. LOCK_HONESTLY · le dashboard affiche « Donnée indisponible pour le moment ».

---

## 4. Service Prisma — `src/lib/center/queries.ts`

Cinq fonctions, chacune reçoit `centerId: string` **résolu serveur** ·

- `getCenterDashboard(centerId)` → `{ teacherCount, classroomCount, studentCount, pendingEnrollmentCount }`.
- `getCenterTeachers(centerId, { page, pageSize, query })` → pagination serveur (`MAX_PAGE_SIZE = 100`), search allowlist sur `user.fullName`, agrégat `activeStudentCount` scopé au centre.
- `getCenterClasses(centerId, { page, pageSize, query })` → search allowlist sur `name`.
- `getCenterStudents(centerId, { page, pageSize, query, classId })` → `classId` **validé dans le scope du centre** (§15) · un `classId` étranger retourne `{ items: [], total: 0 }` (jamais 404 leak).
- `getCenterPendingEnrollments(centerId, { page, pageSize })` → jointure logique `ClassJoinRequest.toClassroomId ∈ Classroom(centerId)`.

**Projections minimales** · id, `fullName`, `speciality`, `languages`, `isVerified`, `classroomCount`, `activeStudentCount`, `level`, `code`, `maxStudents`, `joinedAt`, `createdAt`. Aucun champ suivant n'apparaît · `email`, `phone`, `dateOfBirth`, `hourlyRate`, `address`, `availabilitySchedule`, `socialMedia`, `openingHours`, données famille/Circle, données paiement, données Racines.

Pagination · `DEFAULT_PAGE_SIZE = 25` · `MAX_PAGE_SIZE = 100` · `page ≥ 1` · `query.length ≤ 80`. Aucune query Prisma n'est construite depuis un champ arbitraire.

---

## 5. Routes SSR — `src/app/[locale]/center/…`

Toutes en Server Components (`export const dynamic = "force-dynamic"`) — aucun `use client` en tête. Chacune ·

1. Attend `params` async (Next 16).
2. Vérifie `getFlag("CENTER_REAL_DATA_ENABLED")` — si `false`, rend `<CenterFeaturePlaceholder locale={locale}>`.
3. Appelle `resolveCenterActorOrNull()` — redirige `/{locale}/login` si `null`.
4. Charge les données via le seam `src/lib/center/queries.ts`.
5. Rend un composant SSR de la famille `Center{Dashboard,Teachers,Classes,Students}View`.

| Route | Composant |
|---|---|
| `/{locale}/center` | `CenterDashboardView` |
| `/{locale}/center/teachers` | `CenterTeachersView` (pagination + search) |
| `/{locale}/center/classes` | `CenterClassesView` (pagination + search) |
| `/{locale}/center/students` | `CenterStudentsView` (tabs actifs / en attente, `classId` scopé) |
| `/{locale}/center/stats` | `CenterDashboardView` (mêmes chiffres réels — pas d'agrégat inventé) |

`/{locale}/center/billing` reste tel quel · c'est un **catalogue statique** de plans (PLANS[]), pas de donnée personnelle. La spec §13 interdit d'exposer les paiements ; le catalogue public n'entre pas dans cette interdiction.

---

## 6. Endpoints API — `src/app/api/center/…`

| Méthode & route | Payload | Statuts |
|---|---|---|
| `GET /api/center/me` | — | 200 `{ center, actorRole }` · 401/403/404 · 404 (flag off) |
| `GET /api/center/dashboard` | — | 200 `{ center, stats }` |
| `GET /api/center/teachers` | `?page&pageSize&query` | 200 `{ items, total, page, pageSize }` |
| `GET /api/center/classes` | `?page&pageSize&query` | 200 idem |
| `GET /api/center/students` | `?page&pageSize&query&classId` | 200 idem (`classId` étranger → `{ items: [], total: 0 }`) |
| `GET /api/center/enrollments` | `?page&pageSize` | 200 idem |

Contrat commun ·

1. `if (!getFlag("CENTER_REAL_DATA_ENABLED")) → 404 not_found` — jamais 401/403 (évite l'oracle sur l'état du flag).
2. `resolveCenterActor()` puis appel du seam.
3. `catch → mapErrorToResponse(e)` — mapping stable `PermissionError → 401/403/404` avec code `UNAUTHORIZED | FORBIDDEN | NOT_FOUND`, autres erreurs internes cachées derrière `500 internal error`.

Aucun endpoint ne lit `body.centerId`, `query.centerId`, `params.centerId` ou un header — quand présent, ces champs sont **ignorés silencieusement** (voir §14 spec).

---

## 7. Feature flag · double confirmation en production

Registre · `src/lib/flags.ts`.

Deux flags serveur-only ·

- `CENTER_REAL_DATA_ENABLED` (`process.env.YEMA_CENTER_REAL_DATA_ENABLED`).
- `CENTER_RLS_CONFIRMED` (`process.env.YEMA_CENTER_RLS_CONFIRMED`) · certifie que les policies RLS PostgreSQL ont été posées et validées sur les tables Center.

L'API publique est `isCenterRealDataActive()` (également dans `src/lib/flags.ts`) · utilisée par **tous** les endpoints Center et **toutes** les pages Center. Comportement ·

- `CENTER_REAL_DATA_ENABLED = false` → `false`.
- `CENTER_REAL_DATA_ENABLED = true` **et** `NODE_ENV !== "production"` → `true` (dev/test/P-1).
- `CENTER_REAL_DATA_ENABLED = true` **et** `NODE_ENV === "production"` **et** `CENTER_RLS_CONFIRMED = false` → `false` (production sans RLS confirmée = données jamais servies).
- Les deux flags à `true` en production → `true` (activation finale).

Interdits ·

- **Aucun** `NEXT_PUBLIC_YEMA_CENTER_*` n'est jamais lu. Un composant client qui veut connaître l'état passe par `/api/center/me` (lui-même gated).
- Aucun composant client ne peut activer les flags — le client ne peut pas écrire `process.env`.

Après les tests · `unset YEMA_CENTER_REAL_DATA_ENABLED` **et** `unset YEMA_CENTER_RLS_CONFIRMED` · endpoints retombent à `404`.

---

## 8. Fixtures P-1 · `scripts/test-baseline/p4-3a-fixtures.mjs`

Idempotentes (`seed | clean | list`). Refusent la production via `assertNonProduction`.

| ID | Rôle | Centre | Classe |
|---|---|---|---|
| `TEST_CENTER_A` (id `test_p4_3a_center_a`) | — | — | — |
| `TEST_CENTER_B` (id `test_p4_3a_center_b`) | — | — | — |
| `paul+p4_3a_admin_a@example.com` | CENTER + `CENTER_ADMIN` + Teacher | A | — |
| `paul+p4_3a_admin_b@example.com` | CENTER + `CENTER_ADMIN` + Teacher | B | — |
| `paul+p4_3a_teacher_a@example.com` | TEACHER + `TEACHER` | A | Class A1 |
| `paul+p4_3a_teacher_b@example.com` | TEACHER + `TEACHER` | B | Class B1 |
| `paul+p4_3a_student_a1@example.com` | STUDENT + `LEARNER` | via enrollment | Class A1 (active) |
| `paul+p4_3a_student_a2@example.com` | STUDENT + `LEARNER` | via enrollment | Class A1 (active) |
| `paul+p4_3a_student_b1@example.com` | STUDENT + `LEARNER` | via enrollment | Class B1 (active) |
| `paul+p4_3a_pending_a@example.com` | STUDENT + `LEARNER` | — | Class A1 (pending) |
| `paul+p4_3a_zerobind@example.com` | CENTER + `CENTER_ADMIN` (aucun Teacher) | — | attend `404 no membership` |
| `paul+p4_3a_ambig@example.com` | CENTER + `CENTER_ADMIN` + Teacher(centerId=A) + `User.centerId=B` | A ≠ B | attend `409 center_scope_ambiguous` |
| `paul+p4_3a_teacher_only_a@example.com` | TEACHER + Teacher(centerId=A) (aucun rôle CENTER) | A | attend `403 forbidden` |
| `paul+p4_3a_racines_coach@example.com` | `RACINES_COACH` | — | attend `403 forbidden` |

Classes · `test_p4_3a_class_a1` (TEST_CLASS_A_1, A1) · `test_p4_3a_class_b1` (TEST_CLASS_B_1, B1).

Smoke Playwright · `scripts/test-baseline/p4-3a-smoke.mjs` · vérifie ·

- `me` / `dashboard` cross-tenant · adminA voit seulement A ;
- `teachers` / `classes` / `students` · zéro overlap A ∩ B ;
- `students?classId=<B>` avec cookies A · `items.length === 0` ;
- `teachers?centerId=<B>` avec cookies A · scope reste A (query ignorée) ;
- header `x-center-id: <B>` avec cookies A · ignoré ;
- teacherA sur `/api/center/me` · `403` ;
- studentA1 sur `/api/center/me` · `403` ;
- racinesCoach sur `/api/center/me` · `403` ;
- zeroBind sur `/api/center/me` · `404 no center membership resolved` ;
- ambig sur `/api/center/me` · `409 center_scope_ambiguous` ;
- anonyme sur `/api/center/me` · `401` ;
- `GET /api/center` (verbe legacy) · `404 center_endpoint_deprecated` ;
- `POST /api/center/join` · `404 center_join_deprecated`.

Cleanup · `node scripts/test-baseline/p4-3a-fixtures.mjs clean` · supprime auth Supabase + rows Prisma + centres TEST.

---

## 9. Tests structurels — `src/app/__tests__/p4-3a-center-real-data.test.ts`

Vitest lecture-source, bloque toute régression ·

- **Pages Center** · aucun `const MOCK_/STUDENTS/TEACHERS/CLASSES`, aucun nom mock connu (Marie Nguemo, Sophie Tanda, …), toutes flag-gated, toutes SSR, aucune référence à `searchParams.centerId` / `body.centerId`.
- **Resolver** · `Teacher.centerId` obligatoire · refus `403/404` documenté · refus centre inactif · zéro lecture `centerId` client.
- **Queries** · signature `(centerId: string, …)` · filtre Prisma `centerId` présent partout · `MAX_PAGE_SIZE = 100` · classId étranger retourne réponse vide sûre · projections sans email/phone/dateOfBirth/hourlyRate/address.
- **APIs** · flag-gate `404` · appel resolver · aucun `centerId` client.

---

## 10. RLS et sécurité

- Les tables lues (`teachers`, `classrooms`, `classroom_enrollments`, `class_join_requests`, `language_centers`, `users`) sont accédées via **Prisma serveur** avec autorisation applicative explicite dans `resolveCenterActor` — jamais depuis un client browser Supabase.
- RLS PostgreSQL versionnée sur ces tables · **absente à ce jour** (`SEC-002` audit) — la garantie de scope repose entièrement sur les filtres `centerId` du seam. Documenté comme dette dans `YEMA_P4_SERVICE_ROLE_INVENTORY.md` — plan RLS bloquant avant production commerciale.
- Le smoke Playwright §8 valide en runtime que les endpoints refusent tout leak cross-tenant.

Fonctions RLS `is_center_admin` / `is_center_member` / `is_teacher_for_center` · non créées en P4.3a — dépendance P4.RLS finale. Un template est esquissé dans `YEMA_P4_THREAT_MODEL.md`.

---

## 11. UI · états, i18n, mobile

- Chaque page rend explicitement `loading` (SSR streaming implicite), `empty` (`role="status"` + copie neutre), `error` (redirection login sur PermissionError silencieuse — les erreurs Prisma remontent naturellement).
- FR/EN · copies dans les composants `CenterDashboardView`, `CenterTeachersView`, `CenterClassesView`, `CenterStudentsView`, `CenterFeaturePlaceholder` — deux dictionnaires stricts. Empty states traduits. Aucune chaîne FR/EN croisée.
- Mobile · tables en `overflow-x-auto` sur un conteneur `rounded-2xl` — pas de comprimé desktop-only. Pagination et search en flex simple (`flex gap-2`), boutons tap ≥ 44px via padding Tailwind (`px-4 py-2`).
- Accessibilité · empty states annoncés via `role="status"` · tables sémantiques (`<thead>/<tbody>`) · nav pagination via `<nav>` · liens data-testids `teacher-row-*`, `class-row-*`, `student-row-*`, `pending-row-*` pour tests.
- Erreurs cross-tenant · pas d'information sur le centre étranger — `classId` invalide → réponse vide, jamais 404 explicite qui confirmerait l'existence de la classe.

---

## 12. Limitations et dépendances P4.3b

Explicitement **non couverts en P4.3a** ·

- Actions Teacher avancées (planning, revenu par prof, dernière activité fine).
- Création d'invitations Teacher/Student (workflow verrouillé jusqu'à sécurisation).
- Modification de plan / création d'AccessGrant / prolongation d'accès.
- Console Teacher détaillée (`/teacher/*`).
- Console Coach Racines.
- Devoirs, submissions, feedback.
- Messagerie fermée.
- Notifications runtime.
- Interface Circle exposée.
- Rétention, progression moyenne, top students, revenu mensuel · marqués « Donnée indisponible pour le moment » ou masqués — nécessitent des agrégats non calculables depuis le schéma actuel.

Le legacy `/api/center/route.ts` (GET stats/students/code, POST invite/subscribe) et `/api/center/join/route.ts` sont **définitivement fermés** en P4.3a hardening · ils répondent `404 center_endpoint_deprecated` / `404 center_join_deprecated` pour tous les verbes. Zéro consommateur détecté (grep exhaustif · `docs/YEMA_P4_3A_CENTER_REAL_DATA.md`). Aucun `centerId` client n'est plus lu · aucun tenant selection possible via query/body/header. Le workflow d'attachement Student ↔ Center reste à concevoir en P4.3b (invitations signées + validation admin + TTL).

---

## 13. Verdict d'intégration

- Feature flag `CENTER_REAL_DATA_ENABLED` = `false` par défaut → aucun code réel activé sans intervention explicite serveur.
- Zéro mock résiduel dans les pages Center produites ou modifiées par ce lot (`page.tsx`, `teachers/page.tsx`, `classes/page.tsx`, `students/page.tsx`, `stats/page.tsx`).
- Zéro leak cross-tenant sur les 6 endpoints P4.3a — validé par smoke Playwright P-1.
- Zéro modification hors du scope Center (pas de touche à `/teacher`, `/coach`, `/family`, `/admin`, landing).
- Migration Prisma · aucune — le schéma existant suffit.

**Statut** · prêt à merger dans `main` sous flag off, avec plan RLS bloquant maintenu au niveau P4.RLS avant activation production.

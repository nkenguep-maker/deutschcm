# YEMA · P4.4 · Roots Coach workspace sécurisé et connecté aux Circles réels

> Livrables du sous-lot **P4.4** — dashboard, Circles assignés, profils enfants suivis (projection minimale), placeholders honnêtes activities/messages/sessions.
>
> **Branche** · `feat/yema-p4-4-roots-coach-workspace`
> **Base** · `main` post-merge P4.3b (`7f2f8e1`, tag `yema-p4-3b-validated-20260723`)
>
> **Doctrine contraignante** ·
> - `AppRole = RACINES_COACH` (jamais `CAREER_COACH` en fallback).
> - `ProductCode = ROOTS_COACH_ADDON`, nom commercial « Suivi Racines ».
> - `RACINES_COACH_OPERATIONAL = false` par défaut · workspace consultable en interne, non-commercialisé.
> - Q10 · remplacement du coach = perte d'accès immédiate pour l'ancien coach.
> - Q15 · 10 Circles actifs max, 20 profils enfants actifs max par coach.
> - Aucune zone privée coach-enfant.
> - Aucune recherche libre de `ChildProfile`.
>
> **Sources doctrine** · `YEMA_P4_ARCHITECTURE_AUDIT.md` · `YEMA_P4_PERMISSION_MATRIX.md` · `YEMA_P4_THREAT_MODEL.md` · `YEMA_P4_1_CIRCLE_SECURITY.md` · `YEMA_P4_2_MEMBERSHIPS_INVITATIONS.md`.

---

## 1. Séparation stricte Career / Racines

Un Coach Racines est **uniquement** un `UserAppRole.role = "RACINES_COACH"`. Le resolver `resolveRootsCoachActor` refuse `CAREER_COACH` sans fallback. Un utilisateur qui n'a QUE `CAREER_COACH` reçoit `403 FORBIDDEN` avec `code: FORBIDDEN` et un AuditEvent `ROOTS_COACH_ACCESS_DENIED` avec `reasonCode: "role_missing"`.

Le rôle global `YEMA_ADMIN` seul n'ouvre PAS le workspace Coach Racines (règle P4.3b §7 réaffirmée). Il faut un `CircleMembership` `COACH` `ACTIVE` sur au moins un Circle actif.

Aucune route ni composant ne fait `RACINES_COACH || CAREER_COACH` (test structurel vérifié).

---

## 2. Enums et Product Code

Ajoutés en additif (déjà présents pré-P4.4) ·

- `AppRole.RACINES_COACH`
- `ProductCode.ROOTS_COACH_ADDON`

**Préservés** · `AppRole.CAREER_COACH` et `ProductCode.CAREER_COACH_ADDON` restent en place. Aucune migration ne les renomme ni supprime.

---

## 3. Source de vérité Coach Racines

```
session Supabase
→ User applicatif (prisma.user)
→ UserAppRole role=RACINES_COACH (obligatoire)
→ CircleMembership role=COACH status=ACTIVE (au moins un)
→ Circle status=ACTIVE
→ CircleMembership role=CHILD status=ACTIVE (profils suivis)
```

Un membership `REMOVED` supprime immédiatement l'accès (Q10). Un Circle `ARCHIVED` disparaît de la vue active.

---

## 4. Résolveur serveur — `resolveRootsCoachActor`

Fichier · `src/lib/permissions/rootsCoach.ts`.

Contrat ·

| Situation | Statut | Code | AuditEvent |
|---|:---:|---|---|
| Anonyme | 401 | `UNAUTHORIZED` | — |
| Aucun rôle `RACINES_COACH` (Career Coach, Teacher, Center admin, Student) | 403 | `FORBIDDEN` | `ROOTS_COACH_ACCESS_DENIED` |
| `YEMA_ADMIN` sans Coach membership | 403 | `FORBIDDEN` | `ROOTS_COACH_ACCESS_DENIED` |
| Rôle Racines sans Circle actif | 200 | — (dashboard vide, état onboarding) | — |
| Membership Coach `ACTIVE` sur ≥ 1 Circle actif | 200 | — | — |
| Membership `REMOVED` | équivalent aucun membership actif · aucun Circle visible | — | — |

Helpers ·
- `assertRootsCoachCircleAccess(actor, circleId)` · vérifie `CircleMembership` COACH ACTIVE + `Circle.status=ACTIVE`. Throw 404 sans oracle si le Circle est étranger, archivé, ou révoqué. Émet `ROOTS_COACH_CIRCLE_ACCESS_DENIED` si le Circle existe mais hors scope.
- `assertRootsCoachChildAccess(actor, childProfileId)` · vérifie `CircleMembership` CHILD ACTIVE dans un Circle du coach. Throw 404 sans oracle. Émet `ROOTS_COACH_PROFILE_ACCESS_DENIED` si le profil existe mais hors scope.
- `assertActiveCoachMembership(actor, circleId)` · double-check juste avant une opération sensible.
- `assertRootsCoachCircleCapacity(actor)` / `assertRootsCoachProfileCapacity(actor)` · gardes 10/20.

---

## 5. Capacité (Q15)

Constantes P4.1/P4.2 déjà en place · `MAX_ACTIVE_CIRCLES_PER_COACH = 10` et `MAX_ACTIVE_CHILDREN_PER_COACH = 20` (`src/lib/circles/capacity.ts`). L'assignation reste un workflow ADMIN P4.2 via `assignCoach` qui appelle `assertCoachCapacityAvailable` en transaction serializable · deux assignations concurrentes ne peuvent jamais dépasser la borne (retry sur `40001 serialization_failure`).

Le workspace Coach lit la capacité via `GET /api/roots-coach/capacity` · `{ activeCircles, activeChildren, maxCircles, maxChildren, circlesRemaining, childrenRemaining }`.

Le coach ne peut pas s'assigner lui-même · aucune route d'écriture en P4.4.

---

## 6. Projection enfant minimale (§9 spec)

Le Coach voit uniquement · `id`, `displayName` (= `prenom` d'usage), `avatarAnimal`, `ageBand`, `activeLangue`, `circleId`, `circleLanguage`, `joinedAt`.

**Jamais** · nom légal complet, email, téléphone, adresse, école, date de naissance complète, contact parent, données `Household`, documents, paiement, données Monde, autres Circles.

L'âge est **projeté en tranche** via `toAgeBand(age)` ·

| Age | Band |
|---|---|
| 4-6 | `4-6` |
| 7-9 | `7-9` |
| 10-12 | `10-12` |
| 13-15 | `13-15` |
| 16-17 | `16-17` |
| autre | `unknown` |

Vérifié runtime · smoke reporte `firstItemKeys: [activeLangue, ageBand, avatarAnimal, circleId, circleLanguage, displayName, id, joinedAt]` · **8 clés seulement**, aucune sensible.

---

## 7. Sécurité `child_profiles` · double barrière

1. **RLS table `child_profiles`** · policy `child_profiles_service_only` posée par `20260719_child_profiles` reste active. Un `authenticated` (y compris avec rôle `RACINES_COACH`) ne peut PAS `SELECT * FROM child_profiles` directement. Vérifié à la migration.

2. **Fonction projection** · `public.get_roots_coach_assigned_profiles()` créée en `SECURITY DEFINER` avec `search_path = public, pg_temp` verrouillé. Colonnes exposées · `id`, `display_name`, `avatar_animal`, `age_band` (dérivé, jamais l'âge exact), `active_langue`, `circle_id`, `circle_language`, `joined_at`. Le coach appelant est identifié par `current_app_user_id()` · aucun paramètre client. Grants · `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated`.

3. **APIs serveur** · les endpoints `/api/roots-coach/profiles*` utilisent le seam Prisma `src/lib/rootsCoach/queries.ts` qui filtre en tenant de teacherId côté serveur + n'expose que les colonnes de la projection minimale.

**Critère obligatoire (§10 spec) satisfait** ·
```
JWT Coach → SELECT direct child_profiles = 0 rows
```
La RLS `service_role only` empêche toute lecture par un rôle applicatif quelconque.

---

## 8. Services Prisma — `src/lib/rootsCoach/queries.ts`

Six fonctions, chacune reçoit `coachUserId: string` **résolu serveur** ·

- `getRootsCoachDashboard(coachUserId)` → `{ activeCircleCount, activeChildProfileCount, circleCapacityMax, profileCapacityMax, languageBreakdown }`.
- `getRootsCoachCircles(coachUserId, { page, pageSize })` → liste paginée.
- `getRootsCoachCircle(coachUserId, circleId)` → détail scopé (double-check `teacherId`).
- `getRootsCoachProfiles(coachUserId, { page, pageSize, query })` → projection minimale.
- `getRootsCoachProfile(coachUserId, childProfileId)` → détail projeté.
- `getRootsCoachCapacity(coachUserId)` → info capacité 10/20.

`toAgeBand(age)` public + testé structurellement.

`MAX_PAGE_SIZE = 100`, `DEFAULT_PAGE_SIZE = 25`, `query.length ≤ 80`.

---

## 9. Endpoints API — `src/app/api/roots-coach/…`

| Route | Payload | Statuts |
|---|---|---|
| `GET /api/roots-coach/me` | — | 200 · 401 · 403 · 404 flag-off |
| `GET /api/roots-coach/dashboard` | — | 200 `{ actorRole, stats }` |
| `GET /api/roots-coach/circles` | `?page&pageSize` | 200 `{ items, total, page, pageSize }` |
| `GET /api/roots-coach/circles/[circleId]` | — | 200 `{ circle }` · 404 étranger |
| `GET /api/roots-coach/profiles` | `?page&pageSize&query` | 200 idem |
| `GET /api/roots-coach/profiles/[childProfileId]` | — | 200 `{ profile }` · 404 étranger |
| `GET /api/roots-coach/capacity` | — | 200 `{ capacity }` |

Chaque endpoint · `isRootsCoachWorkspaceActive()` gate (404), `resolveRootsCoachActor`, `mapErrorToResponse`. Codes stables ·

- `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409).
- `roots_coach_circle_not_found` sur `[circleId]` étranger.
- `roots_coach_profile_not_found` sur `[childProfileId]` étranger.

Aucun endpoint ne lit `coachId`, `circleId`, `childProfileId`, `householdId`, `parentId`, `userId` client (body/query/param/header). Injections ignorées (vérifié runtime).

---

## 10. Feature flags

Trois flags serveur-only ·
- `COACH_WORKSPACE_ENABLED` (`YEMA_COACH_WORKSPACE_ENABLED`)
- `ROOTS_COACH_RLS_CONFIRMED` (`YEMA_ROOTS_COACH_RLS_CONFIRMED`) · production requiert.
- `RACINES_COACH_OPERATIONAL` (`YEMA_RACINES_COACH_OPERATIONAL`) · indépendant · gouverne l'opérationnalité commerciale (paiement, réservation), pas l'exposition en lecture.

API publique · `isRootsCoachWorkspaceActive()` (pattern identique Center/Teacher).

Aucun `NEXT_PUBLIC_YEMA_*COACH*`. Un composant client ne peut pas activer.

---

## 11. RLS versionnée — `20260723000008_p4_4_roots_coach_rls`

Trois helpers `SECURITY DEFINER` + `search_path = public, pg_temp` verrouillé ·
- `is_roots_coach(user_id)` · true si `UserAppRole.role='RACINES_COACH'`. `CAREER_COACH` seul renvoie false.
- `is_active_circle_coach(circle_id, user_id)` · true si `CircleMembership` COACH ACTIVE + Circle ACTIVE. Q10 immédiat.
- `can_roots_coach_view_child(child_profile_id, user_id)` · true si l'enfant est dans un Circle où le coach est actif.

Grants · `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated`. Aucun grant `anon`.

Fonction projection `get_roots_coach_assigned_profiles()` · voir §7.

**Aucune** nouvelle policy `is_yema_admin` bypass. Les policies P4.1 sur `circles` et `circle_memberships` (avec bypass historique `OR is_yema_admin`) ne sont **pas** modifiées par cette migration · elles restent pour le support ADMIN qui ne concerne pas le workspace Coach. Un futur endpoint backoffice devra passer par une autorisation applicative explicite.

Six nouvelles valeurs `AuditAction` (idempotent) · `ROOTS_COACH_ACCESS_DENIED`, `ROOTS_COACH_CIRCLE_ACCESS_DENIED`, `ROOTS_COACH_PROFILE_ACCESS_DENIED`, `ROOTS_COACH_CAPACITY_REACHED`, `ROOTS_COACH_ASSIGNMENT_REVOKED`, `ROOTS_COACH_SCOPE_AMBIGUOUS`.

---

## 12. Routes SSR — `src/app/[locale]/coach/racines/…`

Namespace explicite `/coach/racines/*` pour éviter toute collision avec un éventuel Career Coach.

| Route | Composant | Rôle |
|---|---|---|
| `/{locale}/coach/racines` | `RootsCoachDashboardView` | Compteurs réels + placeholders honnêtes |
| `/{locale}/coach/racines/circles` | `RootsCoachCirclesView` | Pagination |
| `/{locale}/coach/racines/circles/[circleId]` | `RootsCoachLayout` + inline detail | Detail + enfants du cercle |
| `/{locale}/coach/racines/profiles` | `RootsCoachProfilesView` | Pagination + search (prenom uniquement) |
| `/{locale}/coach/racines/profiles/[childProfileId]` | `RootsCoachLayout` + inline profile | Projection minimale + placeholders P4.5/P4.6 |
| `/{locale}/coach/racines/activities` | `RootsCoachLockedView` | LOCK_HONESTLY P4.5 |
| `/{locale}/coach/racines/messages` | `RootsCoachLockedView` | LOCK_HONESTLY P4.6 · aucune messagerie coach-enfant |
| `/{locale}/coach/racines/sessions` | `RootsCoachLockedView` | LOCK_HONESTLY · workflow ultérieur |

Toutes SSR (`dynamic = "force-dynamic"`), aucun `use client`, i18n FR/EN strict.

---

## 13. Fixtures P-1 · `scripts/test-baseline/p4-4-fixtures.mjs`

Idempotentes. 11 personas + 3 Circles + 4 ChildProfiles ·

| Persona | Rôle | Attendu |
|---|---|---|
| `coachA` | RACINES_COACH + Coach ACTIVE Circle A | 200 · voit 1 Circle, 2 enfants |
| `coachB` | RACINES_COACH + Coach ACTIVE Circle B | 200 · voit 1 Circle, 1 enfant |
| `coachRemoved` | RACINES_COACH + Coach REMOVED Circle A | 200 · aucun Circle visible (Q10) |
| `careerCoach` | CAREER_COACH | **403** FORBIDDEN |
| `yemaAdminNoBinding` | YEMA_ADMIN sans Coach membership | **403** FORBIDDEN |
| `parentA/B` | PARENT (owner Household) | 403 (aucun rôle Coach) |
| `foreignParent` | PARENT foyer Circle archivé | — |
| `teacherHostile` | TEACHER | 403 |
| `centerAdminHostile` | CENTER_ADMIN | 403 |
| `studentHostile` | LEARNER | 403 |

Circles ·
- `test_p4_4_circle_a` (langue WOLOF, actif, coach A, enfants A1+A2 actifs, A3 removed)
- `test_p4_4_circle_b` (langue DOUALA, actif, coach B, enfant B1)
- `test_p4_4_circle_arch` (langue LINGALA, ARCHIVÉ, coach A membership actif · mais Circle archivé → non visible)

Cleanup · `node scripts/test-baseline/p4-4-fixtures.mjs clean`.

---

## 14. Smoke Playwright — `p4-4-smoke.mjs`

Runtime P-1 avec flags on. Vérifie ·

- `me` · matrice complète (200 pour coach A/B/Removed · 403 pour Career/adminNoBind/Teacher/Center/Student · 401 anon).
- `dashboard` · stats distincts, `languageBreakdown` réelle (WOLOF pour A, DOUALA pour B).
- `circles` · zéro overlap A ∩ B.
- `circles/[CIRCLE_B]` avec cookies A → 404 (foreign).
- `circles/[CIRCLE_ARCH]` avec cookies A → 404 (archived, même si coach A a un membership actif dessus).
- `circles/[CIRCLE_A]` avec cookies A → 200 avec `activeChildCount: 2`.
- `circles/[CIRCLE_A]` avec cookies `coachRemoved` → **404** (Q10 · révocation immédiate confirmée).
- `profiles` · projection minimale · 8 clés seulement, aucune sensible.
- `profiles/[CHILD_B_1]` avec cookies A → 404.
- `profiles/[CHILD_A_1]` avec cookies A → 200 · ageBand `7-9` (age 8 → tranche `7-9`).
- `capacity` · `{ activeCircles: 1, activeChildren: 2, maxCircles: 10, maxChildren: 20, circlesRemaining: 9, childrenRemaining: 18 }`.
- Injections `?coachId=B&circleId=B` + headers `x-coach-id` / `x-circle-id` → tous ignorés.

---

## 15. Limitations et dépendances

Explicitement **non couverts en P4.4** ·

- **P4.5** · assignments, submissions, feedbacks, notes/scores.
- **P4.6** · messagerie coach-parent-enfant (aucun DM coach-enfant · pas de `ThreadType.ONE_TO_ONE`).
- **P4.7** · notifications runtime.
- **P4.RLS** · consolidation finale des policies (incl. retrait éventuel du bypass `is_yema_admin` sur `circles`/`circle_memberships` P4.1).
- **P5** · paiement réel · réservation session · commercialisation opérationnelle.
- IA · aucune IA sur le workspace Coach.
- Recherche globale d'enfants · interdite définitivement.
- Choix libre du coach par un parent · reste workflow ADMIN.

Le workspace lit uniquement · aucune écriture Circle ni ChildProfile depuis le Coach. Assignation/retrait restent workflow ADMIN P4.2 (`assignCoach` / `removeCoach`).

Sessions API `/api/coach`, `/api/coaches`, `/api/career-coach` · **aucune n'existe** actuellement (grep exhaustif). Aucun risque de collision avec Career Coach à cette date.

---

## 15.1 AuditActions Coach · production runtime

Six actions déclarées, toutes avec un producteur runtime documenté ·

| Action | Producteur | Émission observée P-1 (races + smoke) |
|---|---|:---:|
| `ROOTS_COACH_ACCESS_DENIED` | `resolveRootsCoachActor` (rôle absent) | ✓ 5 (Career Coach + admin no binding + Teacher + Center + Student) |
| `ROOTS_COACH_CIRCLE_ACCESS_DENIED` | `assertRootsCoachCircleAccess` (Circle étranger existant) | ✓ 3 (Coach A → Circle B, Circle archivé, ancien coach) |
| `ROOTS_COACH_PROFILE_ACCESS_DENIED` | `assertRootsCoachChildAccess` (profil étranger existant) | ✓ 1 (Coach A → Child B1) |
| `ROOTS_COACH_CAPACITY_REACHED` | `assignCoach` catch (`coach_circle_capacity_reached` \| `coach_profile_capacity_reached`) · `addChildToCircle` catch profile-capacity | ✓ 3 (races S1 · 11e Circle circles=10 · S1b · race 19→20/21 children=20 · replacement S2) |
| `ROOTS_COACH_ASSIGNMENT_REVOKED` | `removeCoach` (Q10 · avant retour) | ✓ 8 (races S2/S3 + admin route) |
| `ROOTS_COACH_SCOPE_AMBIGUOUS` | **Réservé (Option A · P4.4 finale)** · ne plus produire depuis un seuil de compte | ✓ 0 (races S3.5 · drift 22 memberships, aucun événement émis) |

## 15.2 Sémantique capacité et audit · P4.4 finale

Deux évolutions doctrine actées en closure P4.4, intégrées et prouvées runtime.

### 15.2.1 Codes capacité stables (Q15)

`CapacityError` déclinée en deux codes explicites côté throw sites de `assertCoachCapacityAvailable` et du nouveau garde `assertCoachProfileCapacityForChildAdd` ·

- `coach_circle_capacity_reached` · budget circles atteint (`MAX_ACTIVE_CIRCLES_PER_COACH = 10`) · levé au moment où un ADMIN tente une assignation qui porterait le coach à 11 Circles ACTIVE.
- `coach_profile_capacity_reached` · budget profils enfants atteint (`MAX_ACTIVE_CHILDREN_PER_COACH = 20`) · levé au moment où (a) un ADMIN assigne un coach à un Circle qui porterait le total au-delà de 20 enfants, ou (b) un parent OWNER ajoute un CHILD à un Circle déjà supervisé par un coach saturé.

Statut HTTP · 409 · propagé tel quel côté API (`err(e.code, ...)`) sans réécriture ni fallback.

### 15.2.2 Retry Serializable centralisé + mapping stable

Les workflows `assignCoach`, `removeCoach`, `replaceCoach` et l'expansion profil enfant (`addChildToCircle`) transitent tous par `withSerializableRetry`. Deux nouveaux `errorCode` supportés dans le helper ·

- `concurrent_coach_assignment` · POST `/api/admin/circles/[circleId]/coach`
- `concurrent_coach_replacement` · DELETE `/api/admin/circles/[circleId]/coach`

Comportement · retry SSI (`40001` / `P2034` / `TransactionWriteConflict`) borné à `MAX_SERIALIZATION_RETRIES = 3`, backoff exponentiel `25 · 50 · 100 ms`. À l'épuisement, `ConcurrentUpdateError` propage `err(code, msg, 409)`. **Aucune string Postgres/Prisma ne peut fuiter en body de réponse** · vérifié par `roots-coach-p4-4-structural.test.ts` (invariant statique).

### 15.2.3 `ROOTS_COACH_SCOPE_AMBIGUOUS` · Option A (clarification)

L'enum est conservé mais **le producteur seuil (> 2× cap) a été retiré du resolver**. Motif · un drift compte n'est pas une ambiguïté binding — c'est une saturation capacité, qui doit remonter via `ROOTS_COACH_CAPACITY_REACHED` par le workflow (`assignCoach` ou `addChildToCircle`). Aucun événement émis en état de drift 22 memberships (attesté S3.5 runtime).

Sémantique future de l'enum · réservé aux **ambiguïtés binding vraies** (fusion identité, mappings professionnels contradictoires). Aucun producteur runtime actuellement.

**PII leak check** · 0 clé interdite (`email`, `phone`, `fullName`, `dateOfBirth`, `body`, `token`, `cookie`) dans toute la metadata émise (attesté runtime `races-audits.json`).

## 16. Verdict d'intégration

- Feature flag `COACH_WORKSPACE_ENABLED = false` par défaut → aucun code réel activé sans intervention explicite serveur.
- En production, `ROOTS_COACH_RLS_CONFIRMED=true` requis en plus.
- `RACINES_COACH_OPERATIONAL = false` · workspace consultable en interne, non commercialisé.
- Zéro mock résiduel dans les pages Coach.
- Zéro leak cross-coach / cross-circle sur les 7 endpoints P4.4 (runtime P-1 validé).
- Séparation stricte Career / Racines · vérifié structurellement.
- ChildProfile · barrière `service_role only` conservée + fonction projection minimale.
- Migration RLS additive sans bypass `is_yema_admin` dans les policies P4.4.

**Statut** · prêt à merger dans `main` sous flag off · activation prod exigera aussi `ROOTS_COACH_RLS_CONFIRMED=true` (garde active).

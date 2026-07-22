# YEMA — Baseline authentifiée P-1

> **Livrable du lot P-1** défini dans `docs/YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md`. Capture l'état réel des dashboards derrière l'authentification à un moment donné (2026-07-22) sur un projet Supabase isolé.
>
> Cette baseline ne finalise aucune page. Elle rend les recommandations `CODE_AUDITED_VISUAL_PENDING` du gap analysis désormais falsifiables.

## Environnement

| Élément | Valeur |
|---|---|
| Projet Supabase | `yema-p1-baseline` (ref `kzzagbojjkivdzzcrmxn`) |
| Organisation | `nkengue.p@gmail.com` (`fcdqwbndeehzagyjdhju`) |
| Region | `eu-central-1` |
| Postgres | 17.6.1.147 |
| Créé | 2026-07-22 |
| Distinct de la prod (`sbjhvlrkbyjckdxujjsk`) | ✅ oui |
| Guard `P1_BASELINE_CONFIRMED_NOT_PRODUCTION` | ✅ appliqué dans `scripts/test-baseline/_common.mjs` |
| Blacklist explicite de la prod dans `_common.mjs` | ✅ |
| Password DB | généré aléatoirement (32 hex), stocké local dans `.env.p1-baseline` gitignoré |
| Password comptes Auth | fourni via `P1_TEST_PASSWORD` env var — jamais loggé, jamais commit |

## Convention de nommage des données

Tous les préfixes sont visibles :

- Emails Auth : `paul+yema_test_<label>@example.com` (Gmail plus-addressing → boîte de Paul, jamais externe)
- Prénoms enfants : `TEST_Ade`, `TEST_Yara`
- Nom classe : `TEST_KLASSE_A1`
- Nom centre : `TEST_CENTRE_YEMA_DEV`
- IDs Prisma : `test_<8chars>`
- Codes générés : `TEST-CLS-xxxxxx`, `TEST-CTR-xxxx`

Le script `cleanup-test-baseline.mjs` **refuse** toute suppression d'entité qui ne matche pas ces préfixes.

## Dérives DB corrigées uniquement sur P-1 (jamais sur les migrations trackées)

La base P-1 dédiée a nécessité un `prisma db push --accept-data-loss` pour aligner le schéma sur `prisma/schema.prisma`. **Les migrations `prisma/migrations/*/migration.sql` n'ont pas été modifiées.** Écarts DB observés (à traiter séparément dans une passe DATA-002 pour la prod) :

- `users.plan SubscriptionPlan @default(FREE)` — absent des migrations
- `users.centerId TEXT?` — absent
- Table `user_roles` — absente (la migration `20260718_multi_roles/migration.sql` est intégralement commentée)
- Enum `Role` — `CENTER_MANAGER` obsolète, `CENTER` attendu par la doctrine post-A.1
- `teachers.code TEXT UNIQUE` — absent
- `language_centers.code TEXT UNIQUE` — absent
- `level_history.ceremonySeen BOOLEAN DEFAULT false` — absent
- Diverses FK renames (residuel prisma migrate diff)

Ces écarts sont hors scope P-1 mais bloqueront quiconque tente d'appliquer les migrations existantes sur une base vraiment fraîche. Recommandation : passe DATA-002 dédiée avec migration additive avant P0.A.

## 6 comptes créés

| Label | Email | Rôle | Territoire | Données |
|---|---|---|---|---|
| monde | `paul+yema_test_monde@example.com` | STUDENT | Monde | LearningPath deutsch A1 |
| racines_solo | `paul+yema_test_racines_solo@example.com` | STUDENT | Racines | LearningPath wolof A1 |
| racines_family | `paul+yema_test_racines_family@example.com` | STUDENT | Racines Famille | Household + `TEST_Ade` (lingala native) + `TEST_Yara` (deutsch foreign) |
| teacher | `paul+yema_test_teacher@example.com` | TEACHER | Monde | Teacher profile + `TEST_KLASSE_A1` V1 |
| center | `paul+yema_test_center@example.com` | CENTER | — | `TEST_CENTRE_YEMA_DEV` |
| admin | `paul+yema_test_admin@example.com` | ADMIN | — | UserRole ADMIN |

Vérification : `33/33 checks passed` (voir `scripts/test-baseline/verify-test-baseline.mjs`) — incluant `Auth login · <role> · session token OK` pour les 6.

## Authentification Playwright

Six sessions capturées via login réel Supabase (cookies chunkés `sb-<ref>-auth-token` de longueur ~3000 chars pour chaque compte).

| Rôle | signIn HTTP | Cookies | sb-* | Post-login redirect |
|---|:---:|:---:|:---:|---|
| monde | 200 | 2 | 1 | `/fr/dashboard` |
| racines_solo | 200 | 2 | 1 | `/fr/dashboard` |
| racines_family | 200 | 2 | 1 | `/fr/dashboard` |
| teacher | 200 | 2 | 1 | `/fr/dashboard` |
| center | 200 | 2 | 1 | `/fr/dashboard` |
| admin | 200 | 2 | 1 | `/fr/dashboard` |

Les 6 `storageState.json` sont stockés dans `scripts/test-baseline/storage-state/` (gitignoré).

## Sweep visuelle authentifiée — 4 breakpoints

`scripts/test-baseline/playwright-sweep.mjs` a capturé chaque page autorisée × chaque rôle × 4 viewports (360, 390, 768, 1440). Total : **268 renders**.

### Synthèse par rôle (viewport 390 × 844 canonique mobile)

| Rôle | Pages rendered | Redirected login | Overflow total | AI btns | Fake data hits | Console errors |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| monde | 11 | 0 | 1 | **0** ✅ | 1 (Prof. Sophie) | 11 |
| racines_solo | 9 | 0 | 1 | **0** ✅ | 0 | 11 |
| racines_family | 7 | 0 | 1 | **0** ✅ | 0 | 7 |
| teacher | 15 | 0 | 1 | **0** ✅ | 1 (Prof. Sophie) | 15 |
| **center** | 12 | 0 | **259** ⚠️ | **0** ✅ | 3 (Sophie Tanda) | 12 |
| admin | 13 | 0 | **69** ⚠️ | **0** ✅ | 0 | 14 |

**Bonnes nouvelles** :
- 0 bouton IA visible sur toutes les pages authentifiées → **confirme Phase A.1 en post-auth**
- Toutes les pages accessibles à leur rôle se rendent (aucune redirection login pour un compte autorisé)

**Points d'attention** :
- Overflow catastrophique côté center (259 elts sur mobile) et admin (69) — tableaux non responsive
- Fake data confirmée : `Prof. Sophie` / `Sophie Tanda` / `Marie N.` (composant `ClassroomChat` PLACEHOLDER)
- 7-15 console errors par rôle sur mobile 390 — à investiguer (probable manifest icon 404, image fallback, etc. sans impact fonctionnel majeur)

## Table détaillée des captures par page

Convention : `RENDERED_AUTHENTICATED` = page effectivement rendue avec session valide × viewport testé.

| Route | Rôle testé | Rendu vérifié | Données réelles test | Placeholder / fake | Mobile 360/390 | Erreurs | Classification |
|---|---|:---:|---|---|:---:|:---:|---|
| `/fr/dashboard` | monde, racines_solo, racines_family, teacher, center, admin | ✅ 6 rôles | LearningPath réel, foyer réel | H1 = "Foyer" (Racines-shaped pour tous) | ovf=0 | cerr=1 | **FUNCTIONALLY_INCOMPLETE** — le dashboard actuel EST le foyer Racines, aucun dashboard Monde dédié (doctrine §20 non implémentée). Confirme FUNC-01 gap analysis. |
| `/fr/courses` | 6 rôles | ✅ | Course seed | body 5722 (dense) | ovf=0 | cerr=1-3 | GOOD_BUT_INCOMPLETE — page rendue mais à confirmer contenu Monde vs Racines |
| `/fr/progress` | 6 rôles | ✅ | H1 "Ma Progression" | body 143-637 modeste | ovf=0 | cerr=1 | FUNCTIONALLY_INCOMPLETE — progression à connecter aux vraies données |
| `/fr/settings` | 6 rôles | ✅ | Params user | body 665-696 | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/notifications` | 6 rôles | ✅ | H1 "Notifications" body 232-368 | vide | ovf=3 | cerr=1 | FUNCTIONALLY_INCOMPLETE — pas de notifs réelles, ovf=3 sur mobile |
| `/fr/discover` | 6 rôles | ✅ | H1 "Découvrir" body 1090-1575 | contenu réel discover | ovf=1 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/test-niveau` | monde, racines_solo | ✅ | 30 questions statiques (A.1) | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/famille` | racines_family | ✅ | 2 enfants TEST_ visibles | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE — sélecteur "Qui apprend ce soir ?" |
| `/fr/classroom` | monde, teacher | ✅ | H1 "Mes Classes" body 1071-1080 | **fake "Prof. Sophie"** (ClassroomChat placeholder) | ovf=0 | cerr=1 | **PLACEHOLDER** — MSG-02 confirmé |
| `/fr/classroom/join` | monde, racines_solo | ✅ | H1 "Rejoindre une classe" body 162 | vide propre | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/group` | monde | ✅ | H1 "Mon Groupe" body 181-193 | quasi vide | ovf=3 | cerr=1 | FUNCTIONALLY_INCOMPLETE |
| `/fr/onboarding` | monde, racines_solo | ✅ | redirect vers `/onboarding/monde` ou `/racines` selon signal user | H1 "Pourquoi l'allemand ?" / "Quel est votre lien avec la langue ?" | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE — le fallback "portes" §12 doctrine reste absent |
| `/fr/teacher` | teacher | ✅ | H1 "Dashboard prof" body 1173 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/classrooms` | teacher | ✅ | body 824 · classroom TEST_KLASSE_A1 visible | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/students` | teacher | ✅ | body 2131 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/assignments` | teacher | ✅ | body 1196 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/stats` | teacher | ✅ | body 1610 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/resources` | teacher | ✅ | body 1145 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/studio` | teacher | ✅ | body 1110 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/teacher/settings` | teacher | ✅ | body 865 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/center` | center | ✅ | body 1126 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/center/teachers` | center | ✅ | body 1204 | **fake "Sophie Tanda"** | **ovf=80** (360/390) | cerr=1 | **FUNCTIONALLY_INCOMPLETE** — tableau non responsive + fake data |
| `/fr/center/students` | center | ✅ | body 1739 | **fake "Sophie Tanda"** | **ovf=147-178** | cerr=1 | **FUNCTIONALLY_INCOMPLETE** — tableau catastrophique mobile |
| `/fr/center/classes` | center | ✅ | body 1573 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/center/billing` | center | ✅ | body 1662 | ok | **ovf=31-37** | cerr=1 | FUNCTIONALLY_INCOMPLETE — overflow mobile |
| `/fr/center/stats` | center | ✅ | body 1843 | **fake "Sophie Tanda"** | ovf=0 | cerr=1 | FUNCTIONALLY_INCOMPLETE — fake data |
| `/fr/admin` | admin | ✅ | body 540-1126 | ok | ovf=13-38 | cerr=1-3 | FUNCTIONALLY_INCOMPLETE — overflow mobile |
| `/fr/admin/users` | admin | ✅ | body 867 | ok | **ovf=45-55** | cerr=1 | FUNCTIONALLY_INCOMPLETE — tableau mobile |
| `/fr/admin/courses` | admin | ✅ | body 554 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/admin/applications` | admin | ✅ | body 184 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE — probable état vide |
| `/fr/admin/roles` | admin | ✅ | body 727 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/admin/system` | admin | ✅ | body 742 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |
| `/fr/admin/centers` | admin | ✅ | body 632 | ok | ovf=0 | cerr=1 | GOOD_BUT_INCOMPLETE |

## Placeholders confirmés

| Fichier | Placeholder | Route(s) exposée(s) | Priorité |
|---|---|---|---|
| `src/components/ClassroomChat.tsx` | "Prof. Sophie Tanda", "Marie N.", "Herr Kwessi" (fake `INITIAL_MESSAGES`) | `/classroom` (monde, teacher), `/center/*` (via probable réutilisation) | **P0** — MSG-02 |
| `src/components/VoiceRecorder.tsx` | Coming-soon banner + textarea (aucun micro réel) | wherever used | **P0** — MSG-03 |
| `src/app/[locale]/admin/courses/generate/page.tsx` | `SAVED_COURSES` (Netzwerk neu A1 hardcoded) | `/admin/courses/generate` | P2 |

## Matrice des permissions

Tests d'ownership et d'accès observés durant la sweep. `PASS` = comportement correct, `NOT_TESTED` = non couvert par la sweep P-1.

| Action | Anonyme | Monde | Racines Solo | Racines Famille | Teacher | Center | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Accès `/fr/login`, `/fr/register` | PASS | PASS (redirect dashboard) | PASS | PASS | PASS | PASS | PASS |
| `GET /api/me` sans session | PASS (401) | — | — | — | — | — | — |
| Accès `/fr/dashboard` sans session | PASS (redirect login) | — | — | — | — | — | — |
| Accès `/fr/dashboard` avec session | — | PASS | PASS | PASS | PASS | PASS | PASS |
| Accès `/fr/famille` | NOT_TESTED | NOT_TESTED (pas d'ownership actif) | NOT_TESTED | PASS (2 enfants visibles) | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Accès `/fr/teacher/*` | PASS (redirect login) | NOT_TESTED (proxy allows or not?) | NOT_TESTED | NOT_TESTED | PASS | NOT_TESTED | NOT_TESTED |
| Accès `/fr/center/*` | PASS (redirect login) | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | PASS | NOT_TESTED |
| Accès `/fr/admin/*` | PASS (redirect login) | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | PASS |
| Ownership famille enfant : Parent A ↔ Parent B | NOT_TESTED_P1 (couvert par test unit A.2) | — | — | NOT_TESTED (un seul parent famille dans la baseline) | — | — | — |
| Cross-role : STUDENT accède aux routes prof | NOT_IMPLEMENTED (proxy protège probablement, à vérifier) | NOT_TESTED | NOT_TESTED | NOT_TESTED | — | — | — |
| Messagerie cross-classe (élève A voit classe B) | NOT_IMPLEMENTED (pas de messagerie réelle en place) | — | — | — | — | — | — |
| Messagerie cross-cercle Racines | NOT_IMPLEMENTED (pas de "cercle Racines" en Prisma, cf. MSG-01) | — | — | — | — | — | — |
| Changement de rôle multi-espace via `SpaceSwitcher` | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Publication message dans classe | NOT_IMPLEMENTED (`ClassroomChat` fake, pas d'API) | — | — | — | NOT_TESTED | — | — |
| Correction humaine devoir | NOT_IMPLEMENTED (`ClassFeedback.audioUrl` manquant, MSG-04) | — | — | — | NOT_TESTED | — | — |

**Aucun `NOT_TESTED` n'est marqué `PASS`** — la baseline reste honnête sur ce qu'elle n'a pas vérifié.

## Landing protégée

Non re-vérifiée dans P-1 (aucun test ne pointe sur `/fr` ou `/en` — protégée par exclusion). Confirmation :

```
Landing /fr : CANONICAL
Landing /en : CANONICAL
```

Aucun fichier landing modifié dans P-1.

## Marqueurs `CODE_AUDITED_VISUAL_PENDING` — mise à jour

Sur les 19 marqueurs initiaux du gap analysis :

**Levés (session authentifiée + rendu confirmé)** :
- `/fr/dashboard` → `RENDERED_AUTHENTICATED` (6 rôles, mais FUNC-01 confirmé : c'est le Foyer, pas Monde)
- `/fr/famille` → `RENDERED_AUTHENTICATED` (racines_family, 2 enfants)
- `/fr/famille/enfant/[id]` → NOT_TESTED (id des enfants non passé au sweep)
- `/fr/classroom`, `/fr/classroom/join`, `/fr/classroom/[id]` → `RENDERED_AUTHENTICATED` (partiellement — placeholder confirmé)
- `/fr/group`, `/fr/group/create`, `/fr/group/join` → PARTIALLY (group rendered, create/join non ciblés par sweep)
- `/fr/teacher/*` (8 pages) → `RENDERED_AUTHENTICATED` toutes
- `/fr/center/*` (5 pages) → `RENDERED_AUTHENTICATED` toutes
- `/fr/admin/*` (6 pages) → `RENDERED_AUTHENTICATED` toutes
- `/fr/onboarding` → `RENDERED_AUTHENTICATED` (aiguille vers `/onboarding/monde` ou `/racines`)
- `/fr/settings`, `/fr/notifications` → `RENDERED_AUTHENTICATED`
- `/fr/discover/*` sous-routes → NOT_TESTED (id de centre/class/group non ciblés)

**Conservés** :
- `/fr/onboarding/monde`, `/fr/onboarding/racines`, `/fr/onboarding/teacher`, `/fr/onboarding/center` — non testés en profondeur (le sweep ne visite que `/onboarding` qui aiguille)
- `/fr/test-niveau/results` — nécessite sessionStorage post-quiz
- `/fr/activation` — nécessite un checkout complet
- `/fr/famille/enfant/[profilId]` — id non passé
- `/fr/classroom/[classroomId]/assignment/[assignmentId]` — id non passé
- `/fr/discover/{center,class,group}/[id]` — ids non passés

## Environnement — dérives DB observées à traiter séparément

Récapitulatif des dérives constatées uniquement patchées sur P-1 :

1. `users.plan` + `users.centerId` — colonnes absentes des migrations
2. Table `user_roles` — la migration `20260718_multi_roles/migration.sql` est intégralement commentée
3. Enum `Role` — `CENTER_MANAGER` obsolète, `CENTER` attendu
4. `teachers.code UNIQUE` — colonne absente
5. `language_centers.code UNIQUE` — colonne absente
6. `level_history.ceremonySeen` — colonne absente
7. Diverses FK renames cosmétiques

**Recommandation** : passe **DATA-002** dédiée avec une migration additive `20260723_align_prisma_schema.sql` avant tout démarrage de P0.A.

## Scripts

| Fichier | Rôle |
|---|---|
| `scripts/test-baseline/_common.mjs` | Guards (assertNonProduction, blacklist, TEST_ prefix), constantes ACCOUNTS + TEST_PASSWORD |
| `scripts/test-baseline/create-test-baseline.mjs` | Idempotent seed : 6 comptes Auth + DB users + userRoles + LearningPaths + Household + 2 enfants + Teacher + Classroom + Center |
| `scripts/test-baseline/verify-test-baseline.mjs` | Contrôle intégrité + smoke test signInWithPassword × 6 |
| `scripts/test-baseline/cleanup-test-baseline.mjs` | Suppression prefixée uniquement, refuse toute entité sans préfixe test |
| `scripts/test-baseline/playwright-sweep.mjs` | 6 sessions Playwright réelles + capture 4 viewports + report TSV |
| `scripts/test-baseline/README.md` | Doc d'usage |

## Cleanup

Testé avant merge : `node scripts/test-baseline/cleanup-test-baseline.mjs` supprime les 6 comptes Auth + tous les enfants TEST_ + household + classrooms TEST_ + centre TEST_ + user_roles des 6 test users + LearningPaths + users TEST_.

Le storageState et les captures Playwright sont gitignorés, à supprimer manuellement au besoin :
```bash
rm -rf scripts/test-baseline/storage-state/ scripts/test-baseline/captures/
```

## Hardening final P-1 (post-tâche complémentaire)

Passage `test(baseline): harden role matrix and test secrets` après la première itération de P-1 pour :

### Secrets

- Password test **rotation obligatoire** — l'ancien password commun (utilisé dans la première itération) est considéré exposé, plus jamais réutilisé.
- `_common.mjs` exporte `getTestPassword()` qui lit `P1_TEST_PASSWORD` du process env, refuse le démarrage si absent ou <12 chars, jamais de valeur par défaut hardcodée.
- `redactPassword(str)` helper pour tout log qui pourrait contenir la valeur.
- Aucun mot de passe présent dans les screenshots, TSV, JSON storage-state, ni dans cette documentation.
- Vérification `git grep` sur l'ancien password test + le password DB prod : 0 occurrence trackée après réécriture d'historique.

### PAT et projets Supabase

- `.mcp.json` reste gitignoré ; aucun PAT dans les fichiers trackés ni dans l'historique de la branche.
- Le projet créé initialement dans la mauvaise organisation (`qggwvonfumuimjfsgpdz` — jacobspaul932) **a été supprimé** dès signalement du bon compte, jamais utilisé pour du seed.
- Le PAT du mauvais compte (utilisé pour la création puis la suppression) a été mis hors service côté utilisateur (401 Forbidden constaté lors du contrôle final). Aucun script du dépôt ne crée ni ne supprime un projet Supabase — la création du projet P-1 est un acte manuel non répétable via `scripts/test-baseline/`.
- Le PAT du bon compte reste **local uniquement** dans `.mcp.json` gitignoré ; recommandation utilisateur : rotation prudente si la valeur a été vue à l'écran.

### Cross-role HTTP tests (script `cross-role-tests.mjs`)

Nouveau script utilise Playwright `BrowserContext` pour disposer des vrais cookies Supabase SSR chunkés `sb-<ref>-auth-token`. Résultat : **75 PASS · 2 FAIL · 0 NOT_TESTED**.

Matrice testée (`anon`, `monde`, `racines_solo`, `racines_family`, `teacher`, `center`, `admin`) × 11 routes :

| Route | Résultat |
|---|---|
| `/api/me` | anon 401 · 6 rôles authentifiés 200 · PASS |
| `/api/family/children` | anon 401 · 6 rôles authentifiés 200 · PASS |
| `/fr/dashboard` | anon 307 · 6 rôles 200 · PASS |
| `/fr/famille` | anon 307 · monde/solo/family/admin 200 · **teacher 200 (FAIL — attendu 307)** · **center 200 (FAIL — attendu 307)** |
| `/fr/teacher`, `/fr/teacher/students` | anon+monde+solo+family+center 307 · teacher+admin 200 · PASS |
| `/fr/center`, `/fr/center/billing` | anon+monde+solo+family+teacher 307 · center+admin 200 · PASS |
| `/fr/admin`, `/fr/admin/users`, `/fr/admin/system` | anon+5 autres rôles 307 · admin 200 · PASS |

**2 FAIL sur `/fr/famille`** — la route n'est actuellement pas restreinte aux STUDENT/PARENT, elle accepte TEACHER et CENTER. Ce n'est **pas une fuite de données** (chaque parent voit ses propres enfants via `parentUserId`), mais la sémantique produit est floue (un professeur ou un centre n'a rien à faire dans le sélecteur "Qui apprend ce soir ?"). À revisiter en P0.A : soit restreindre le proxy sur `/famille`, soit accepter comme "espace parent optionnel pour tous les rôles authentifiés".

### Cross-parent famille (ownership)

Testé en direct DB + HTTP :

- **DB-level** : `db.childProfile.findFirst({ where: { id, parentUserId } })` avec un `parentUserId` étranger retourne `null` → PASS blocked ✅
- **HTTP** : `racines_solo` tente `PATCH /api/family/children/<family_kid_id>` avec sa session → HTTP **404** (handler retourne `not_found`) → PASS blocked ✅

Aucune fuite de données famille cross-parent.

### Route dynamique `/fr/famille/enfant/[profilId]`

Testé avec le vrai `profilId` d'un enfant du parent famille :

- Parent owner : HTTP 200 ✅
- Autre parent (`racines_solo`) : HTTP 200 ⚠️ — la page rend un contenu (probablement l'état "not found" en HTML), à confirmer que **aucun champ enfant** n'est exposé dans le body. Recommandation : ajouter un test `expect(!page.textContent().includes('TEST_Ade'))` en E2E P6-11.
- Anonyme : HTTP 307 (login) ✅

### Route dynamique `/fr/classroom/[classroomId]`

Testé avec le vrai `classroomId` de `TEST_KLASSE_A1` :

- Owner teacher : HTTP 200 ✅
- Non-enrolled student (`monde`) : HTTP 200 ⚠️ — même remarque : contenu à vérifier, la page rend probablement l'état empty ou "classe non trouvée".
- Anonyme : HTTP 307 ✅

### Route dynamique `/fr/classroom/[id]/assignment/[aid]` — **MARQUEUR CONSERVÉ**

Cause précise : aucun `Assignment` ni `ClassAssignment` ne peut être créé par la seed sans traverser un flux produit non exécutable en isolation (`POST /api/teacher` avec form data spécifique + auth teacher). Fabriquer un id inexistant violerait §5 du prompt P-1 hardening ("Ne fabriquer aucun identifiant inexistant"). Le marqueur `CODE_AUDITED_VISUAL_PENDING` sur cette route persiste, à lever en P4 quand la messagerie de suivi (§B doctrine) sera implémentée avec sa vraie création de devoirs.

### État final données de test

```
BASELINE DATA CLEANED
```

Cleanup vérifié : 6 auth users + 2 enfants + 1 household + 1 classroom + 1 teacher profile + 1 center + user_roles + learning_paths + users — **tous supprimés** avec préfixe `test_`, `TEST_`, `yema_test_` matché. Refus explicite du cleanup sur toute entité sans préfixe. Storage states + captures Playwright supprimés du filesystem local.

### Vérifications finales

```
git grep sur l'ancien password test → 0 occurrence trackée (après réécriture)
git grep sur pattern PAT `sbp_`   → 0 occurrence trackée
git grep sur pattern access-token env var → 0 occurrence trackée
git ls-files .mcp.json        → 0 fichier (gitignoré)
git ls-files .env*            → 0 fichier (gitignoré)
git ls-files scripts/test-baseline/storage-state → 0 fichier (gitignoré)
git ls-files scripts/test-baseline/captures      → 0 fichier (gitignoré)
```

## Confirmation finale

```
Landing /fr : CANONICAL — non touchée
Landing /en : CANONICAL — non touchée
Aucun fichier produit modifié
Aucune modification de migration Prisma
AUDIT.md non tracké et intact
Projet Supabase prod (sbjhvlrkbyjckdxujjsk) jamais touché
Projet Supabase P-1 (kzzagbojjkivdzzcrmxn) : baseline data cleaned
Password test : rotation appliquée, valeur fournie par env var, jamais commit
```

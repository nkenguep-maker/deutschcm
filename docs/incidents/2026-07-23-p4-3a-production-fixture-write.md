# Incident · 2026-07-23 · Fixtures test P4.3a écrites en production

**Statut · CLOSED · aucun résidu, protection posée, rotations non requises.**

Ce document est factuel. Aucun secret n'est reproduit ici · aucune URL ne contient de mot de passe ou clé. Les identifiants de projets Supabase sont publics (déjà présents dans `docs/YEMA_P4_ARCHITECTURE_AUDIT.md`).

---

## 1. Synthèse

Pendant la campagne de validation runtime P4.3a (sous-lot Center real data), le script `scripts/test-baseline/p4-3a-fixtures.mjs` a créé des rows Prisma dans la base **production** deutschcm (Supabase project ref `sbjhvlrkbyjckdxujjsk`) au lieu de la base P-1 dédiée (`kzzagbojjkivdzzcrmxn`). L'incident a été détecté en runtime la même minute pendant l'exécution des tests smoke Playwright (les 200 attendus revenaient en 404, le smoke a levé un drapeau). Purge exécutée immédiatement · production actuellement résiduel **0**.

---

## 2. Chronologie (heure Europe/Paris = CEST)

| Heure approximative | Événement |
|---|---|
| ~14 h 55 | Première tentative de seed sur P-1 · échoue à mi-parcours (enum `AppRole.RACINES_COACH` absent en DB P-1). Correction appliquée dans `p4-3a-fixtures.mjs`. Les auth users et une partie des DB users avaient déjà été créés à cette étape. |
| ~15 h 00 | Clean puis re-seed · le seed rapporte "success" avec des IDs stables (`36e834f5-…`, etc.). |
| ~15 h 00–15 h 15 | Smoke Playwright · 401 anonyme correct, mais `adminA` renvoie 404 sans données. Séquence de debug (grep DB, tests fresh insert, comparaison). Découverte · seed avait écrit sur PROD ; queries de vérification faites depuis un shell exportant `.env.p1-baseline` regardaient P-1 (vide). |
| ~15 h 15 | Détection formelle · sur `sbjhvlrkbyjckdxujjsk`, 12 users `paul+p4_3a_*@example.com` présents. |
| ~15 h 16 | Confinement · purge programmatique via Prisma sur PROD. |
| ~15 h 17 | Confirmation post-purge · 0 résidu users / centers / classrooms. |
| ~15 h 20 | Refactor `_common.mjs` · override forcé `.env.p1-baseline`, garde étendue à `DIRECT_URL` / `DATABASE_URL`. Re-seed sur P-1, runtime complet vert. |
| ~17 h 30 | Incident closure · audit croisé PROD sur 18 tables + Storage · **0 résidu confirmé**. |

---

## 3. Cause racine

Fichier · `scripts/test-baseline/_common.mjs`, version antérieure.

Séquence bugée ·

1. `import "dotenv/config"` en haut du module. `dotenv/config` charge automatiquement `.env` à la racine du repo, écrase `process.env` uniquement pour les variables absentes (mode `override: false` par défaut).
2. Sur poste dev deutschcm, `.env` contient `DATABASE_URL` et `DIRECT_URL` pointant vers la **production** (`postgres.sbjhvlrkbyjckdxujjsk...`), pour permettre à Prisma migrate/generate de fonctionner en local sur la DB prod (usage explicite du repo).
3. `.env.p1-baseline` était ensuite lu manuellement, avec la même sémantique `if (!process.env[m[1]])`. Toute variable déjà définie par `.env` restait inchangée.
4. `assertNonProduction()` ne validait que `NEXT_PUBLIC_SUPABASE_URL` (défini uniquement dans `.env.p1-baseline`, donc effectivement P-1). Aucun contrôle sur `DIRECT_URL`.

Résultat · les appels Supabase Auth Admin ciblaient bien P-1 (via `SUPABASE_SERVICE_ROLE_KEY` + URL P-1), mais toutes les écritures Prisma allaient sur PROD.

---

## 4. Environnement

* Projet P-1 attendu · `kzzagbojjkivdzzcrmxn` (organisation `nkengue.p@gmail.com`).
* Projet PROD touché · `sbjhvlrkbyjckdxujjsk` (deutschcm production).
* Variables chargées au moment de l'incident ·
  * `NEXT_PUBLIC_SUPABASE_URL` · P-1 (correct, depuis `.env.p1-baseline`).
  * `SUPABASE_SERVICE_ROLE_KEY` · P-1 (correct, depuis `.env.p1-baseline`).
  * `DATABASE_URL` · **PROD** (incorrect, depuis `.env`).
  * `DIRECT_URL` · **PROD** (incorrect, depuis `.env`).
  * `P1_TEST_PASSWORD` · défini (`.env.p1-baseline`).
* Scripts concernés · `scripts/test-baseline/p4-3a-fixtures.mjs` (seed uniquement · le smoke Playwright ne fait pas d'écriture Prisma).
* Commandes exécutées · `node scripts/test-baseline/p4-3a-fixtures.mjs seed` (deux fois avant détection · première fois interrompue par erreur enum, deuxième fois complète).

---

## 5. Étendue exacte · par environnement

La fixture instancie un unique client Supabase Auth avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`. Ces deux variables n'existaient que dans `.env.p1-baseline` (le fichier `.env` du repo ne les contient pas — vérifié `grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env` → aucune ligne). En conséquence, **tous les appels `admin.auth.admin.createUser` sont partis sur P-1**. Le seul chemin polué est Prisma (via `DIRECT_URL` dérivé de `.env` en production).

Étendue effective par projet · préfixes `test_p4_3a_` ou emails `paul+p4_3a_*@example.com`.

### 5.1 Production (`sbjhvlrkbyjckdxujjsk`) · **pollution incidentelle**

| Table | Rows créées | Détail |
|---|:---:|---|
| `public.users` | 12 | emails `paul+p4_3a_*` |
| `public.language_centers` | 2 | `test_p4_3a_center_a`, `test_p4_3a_center_b` |
| `public.teachers` | 4 | adminA, adminB, teacherA, teacherB |
| `public.classrooms` | 2 | `test_p4_3a_class_a1`, `test_p4_3a_class_b1` |
| `public.classroom_enrollments` | 3 | studentA1, studentA2 → classroom A · studentB1 → classroom B |
| `public.class_join_requests` | 1 | pendingA → classroom A, `status = pending` |
| `public.user_app_roles` | 12 | rôles CENTER_ADMIN / TEACHER / LEARNER / CAREER_COACH |
| **`auth.users`** | **0** | **Aucun auth user créé sur production** · le client Auth était P-1. |
| Storage | 0 | Les fixtures ne créent aucun objet Storage. |

### 5.2 P-1 (`kzzagbojjkivdzzcrmxn`) · **opérations attendues + désynchronisation temporaire**

| Ressource | Rows créées | Détail |
|---|:---:|---|
| `auth.users` | 12 | Comptes de test P4.3a créés normalement — c'est le comportement attendu du seed. |
| `public.users` et suivants | 0 (au moment de l'incident) | Les écritures Prisma partaient sur PROD à cause du bug. La table `public.users` de P-1 restait vide pour les fixtures. |

Cette asymétrie explique le symptôme runtime · les smoke tests logaient bien sur P-1 (auth OK), obtenaient un cookie de session valide, mais le proxy/API ne trouvait aucun `User` Prisma sur P-1 pour la résolution → 404 systématique au lieu des 200 attendus.

Autres impacts ·

- Aucun objet Storage, aucun webhook, aucun email transactionnel déclenchés (les fixtures créent uniquement des rows, pas de flux applicatif).
- Aucun soft-delete résiduel — les modèles `User`/`Teacher`/`Classroom`/etc. ne pratiquent pas de soft-delete.
- Durée totale d'existence en production · environ **17 minutes** (création ~15 h 00 · purge Prisma ~15 h 16).
- Aucun user réel n'a pu voir ou interagir avec ces fixtures (préfixes tests, emails `paul+p4_3a_*`, jamais liés à des sessions Supabase de utilisateurs réels).

---

## 6. Confinement immédiat

Deux purges distinctes, sur les deux environnements affectés.

### 6.1 Production (`sbjhvlrkbyjckdxujjsk`) · Prisma uniquement

Shell chargeant `.env` (sans `.env.p1-baseline`). `DIRECT_URL` → PROD, aucun client Supabase Auth Admin instancié (les auth users n'existaient pas ici).

1. `db.classroomEnrollment.deleteMany({ where: { userId: { in: <fixture ids> } } })`
2. `db.classJoinRequest.deleteMany({ where: { fromUserId: { in: <fixture ids> } } })`
3. `db.teacher.deleteMany({ where: { userId: { in: <fixture ids> } } })`
4. `db.userAppRole.deleteMany({ where: { userId: { in: <fixture ids> } } })`
5. `db.userRole.deleteMany({ where: { userId: { in: <fixture ids> } } })`
6. `db.user.deleteMany({ where: { id: { in: <fixture ids> } } })`
7. `db.classroom.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } })`
8. `db.languageCenter.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } })`

Aucun appel `admin.auth.admin.deleteUser` sur PROD · les auth users n'y ont jamais été créés (voir §5.1 et §7).

### 6.2 P-1 (`kzzagbojjkivdzzcrmxn`) · Supabase Auth + Prisma résiduel

Exécuté via `node scripts/test-baseline/p4-3a-fixtures.mjs clean` (client Supabase Auth pointant sur P-1 via `.env.p1-baseline`, Prisma pointant sur P-1 après hardening `_common.mjs`).

- Suppression Prisma des rows résiduels de tentatives de seed antérieures sur P-1 (structure identique à §6.1 · retire les rows dont l'email/id matche le préfixe fixture).
- Supabase Auth Admin · `admin.auth.admin.deleteUser(...)` pour chaque `id` retourné par `listUsers` avec `email.includes("p4_3a")` · **12 auth users supprimés sur P-1**.

Log final `═══ P4.3a · clean ═══ · cleaned · 12 db users · 12 auth users · centers + classrooms`.

---

## 7. Vérifications post-purge · par environnement

### 7.1 Production (`sbjhvlrkbyjckdxujjsk`)

Contrôle indépendant depuis `.env.local` (sans `.env.p1-baseline`), `dotenv` chargé explicitement · 19 sources vérifiées. Le résidu `auth.users` figure dans le tableau pour prouver que **rien** n'a jamais existé sur PROD à ce niveau.

| Source | Résidu | Note |
|---|:---:|---|
| `public.users` (email contient `p4_3a` OU `fullName` commence par `TEST P4.3a`) | 0 | Purgé §6.1 |
| `auth.users` (email contient `p4_3a`) | 0 | **Jamais créés sur PROD** (client Supabase Auth = P-1) |
| `public.language_centers` (id commence par `test_p4_3a_`) | 0 | Purgé §6.1 |
| `public.classrooms` (id commence par `test_p4_3a_`) | 0 | Purgé §6.1 |
| `public.classroom_enrollments` (userId fixture) | 0 | Purgé §6.1 |
| `public.class_join_requests` (message = "TEST P4.3a") | 0 | Purgé §6.1 |
| `public.user_app_roles` (userId fixture) | 0 | Purgé §6.1 |
| `public.user_roles` (userId fixture) | 0 | Aucune écriture (fixture ne touche pas ce modèle) |
| `public.access_grants` (userId fixture) | 0 | Aucune écriture |
| `public.audit_events` (actorUserId fixture) | 0 | Aucune écriture |
| `public.notifications` (userId fixture) | 0 | Aucune écriture |
| `public.circle_memberships` (userId fixture) | 0 | Aucune écriture |
| `public.households` (ownerUserId fixture) | 0 | Aucune écriture |
| `public.household_memberships` (userId fixture) | 0 | Aucune écriture |
| `public.child_profiles` (parentUserId fixture) | 0 | Aucune écriture |
| `public.class_memberships` (userId fixture) | 0 | Aucune écriture |
| `public.learning_paths` (userId fixture) | 0 | Aucune écriture |
| `public.orders` (userId fixture) | 0 | Aucune écriture |
| Supabase Storage (objets contenant `test_p4_3a`) | 0 | Aucune écriture |

**Production · 0 fixture P4.3a résiduelle confirmée le 2026-07-23 ~17 h 30 CEST.**

### 7.2 P-1 (`kzzagbojjkivdzzcrmxn`)

Contrôle après `p4-3a-fixtures.mjs clean` puis relecture ·

| Source | Résidu |
|---|:---:|
| `auth.users` (email contient `p4_3a`) | 0 |
| `public.users` (email contient `p4_3a`) | 0 |
| `public.language_centers` (id commence par `test_p4_3a_`) | 0 |
| `public.classrooms` (id commence par `test_p4_3a_`) | 0 |

**P-1 · 0 fixture P4.3a résiduelle confirmée.**

---

## 8. Protection ajoutée

Fichier durci · `scripts/test-baseline/_common.mjs`.

Changements ·

1. **Aucun** `dotenv/config` ni `require("dotenv")`. Seul `.env.p1-baseline` est lu, en **override forcé** (les env vars shell préalables sont remplacées si `.env.p1-baseline` les définit).
2. Nouveau helper `parseSupabaseRef(url, label)` · analyse une URL Supabase HTTPS ou une connection string PostgreSQL du pooler Supabase. Extrait le `project_ref` (20 caractères) et refuse toute URL non conforme (protocole inconnu, hostname non-Supabase, username non-`postgres.<ref>`).
3. `assertNonProduction()` refuse maintenant explicitement `DIRECT_URL`, `DATABASE_URL`, `SUPABASE_URL` (si défini), en plus de `NEXT_PUBLIC_SUPABASE_URL`. Toute URL dont le `project_ref` diffère de `kzzagbojjkivdzzcrmxn` ou appartient à la liste noire (`sbjhvlrkbyjckdxujjsk`, `mamofhrurksyuuolucea`, `qggwvonfumuimjfsgpdz`) bloque le script avant toute connexion Prisma/Supabase.
4. Aucun mode override ne permet aux fixtures de cibler la production.

Runner de refus · `scripts/test-baseline/p4-3a-env-refusal.mjs` (child-process, cwd temporaire sans `.env.p1-baseline`). Six scénarios ·

| # | Scénario | Attendu | Vérifié |
|:-:|---|---|:-:|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` = PROD | REFUSED | ✓ |
| 2 | URL Supabase P-1 mais `DIRECT_URL` PROD (le bug exact) | REFUSED | ✓ |
| 3 | URL malformée (`not-a-url`) | REFUSED | ✓ |
| 4 | `DIRECT_URL` non-Supabase (`some-other-host.example.com`) | REFUSED | ✓ |
| 5 | `P1_BASELINE_CONFIRMED_NOT_PRODUCTION` absent | REFUSED | ✓ |
| 6 | Toutes URLs P-1 conformes | PASS | ✓ |

---

## 9. Rotations / cache

Aucune clé n'a été affichée, loggée ou commitée pendant l'incident. Les captures/logs n'ont pas été inspectés par un tiers. Aucun secret n'a jamais été présent dans l'historique Git pour cette branche (audit `git log -p` sur `main..HEAD` — 0 pattern secret détecté).

En conséquence · **aucune rotation de credential n'est requise**.

---

## 10. Propriétaire du suivi

Paul Nkengue (`nkengue.p@gmail.com`) · suivi personnel · fixtures P4.3a et hardening baseline. Suivi ouvert le 2026-07-23, clos par cet incident report.

---

## 11. Statut final

* Production résiduel · 0 (vérifié 19 sources dont `auth.users`, Storage inclus). Auth users **jamais créés** sur PROD.
* P-1 résiduel · 0 (cleanup exécuté après validation runtime, 12 auth users + rows Prisma retirés).
* Protection code · posée, verrouillée par `scripts/test-baseline/p4-3a-env-refusal.mjs` (6/6 scénarios validés).
* Rotations · non requises.
* Branche · `feat/yema-p4-3a-center-real-data` (non mergée à l'écriture du rapport initial ; le commit correctif documentaire précède le merge planifié).
* Statut · **CLOSED**.

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

## 5. Étendue exacte

Fixtures créées sur PROD (`sbjhvlrkbyjckdxujjsk`), toutes de type isolé (préfixes `test_p4_3a_` ou emails `paul+p4_3a_*@example.com`) ·

* **12 rows** `public.users` avec emails `paul+p4_3a_*@example.com`.
* **12 rows** `auth.users` (Supabase Auth Admin API · adresses de test P4.3a).
* **2 rows** `public.language_centers` (ids `test_p4_3a_center_a`, `test_p4_3a_center_b`).
* **4 rows** `public.teachers` (adminA, adminB, teacherA, teacherB rattachés aux centres A/B).
* **2 rows** `public.classrooms` (`test_p4_3a_class_a1`, `test_p4_3a_class_b1`).
* **3 rows** `public.classroom_enrollments` (studentA1, studentA2 → classroom A · studentB1 → classroom B).
* **1 row** `public.class_join_requests` (pendingA → classroom A, `status = pending`).
* **12 rows** `public.user_app_roles` (rôles `CENTER_ADMIN`/`TEACHER`/`LEARNER`/`CAREER_COACH`).

Aucun fichier Storage, aucun webhook, aucun email transactionnel déclenchés (les fixtures créent uniquement des rows, pas de flux applicatif). Aucun soft-delete résiduel — les modèles `User`/`Teacher`/`Classroom`/etc. ne pratiquent pas de soft-delete.

Durée totale d'existence en production · environ **17 minutes** (création ~15 h 00 · purge ~15 h 16). Aucun user réel n'a pu voir ou interagir avec ces fixtures (préfixes tests, emails `paul+p4_3a_*`, jamais liés à des sessions Supabase de utilisateurs réels).

---

## 6. Confinement immédiat

Séquence de purge exécutée depuis un shell **avec les variables de production actives** (`.env` chargé, non `.env.p1-baseline`), Prisma pointant sur `sbjhvlrkbyjckdxujjsk` ·

1. `db.classroomEnrollment.deleteMany({ where: { userId: { in: <fixture ids> } } })`
2. `db.classJoinRequest.deleteMany({ where: { fromUserId: { in: <fixture ids> } } })`
3. `db.teacher.deleteMany({ where: { userId: { in: <fixture ids> } } })`
4. `db.userAppRole.deleteMany({ where: { userId: { in: <fixture ids> } } })`
5. `db.userRole.deleteMany({ where: { userId: { in: <fixture ids> } } })`
6. `db.user.deleteMany({ where: { id: { in: <fixture ids> } } })`
7. `db.classroom.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } })`
8. `db.languageCenter.deleteMany({ where: { id: { startsWith: "test_p4_3a_" } } })`
9. Supabase Auth Admin · `admin.auth.admin.deleteUser(...)` pour chaque `id` récupéré via `listUsers` en filtrant `email.includes("p4_3a")` — 12 auth users supprimés.

---

## 7. Vérifications post-purge

Contrôle indépendant sur PROD depuis `.env.local` (sans `.env.p1-baseline`) · 18 sources vérifiées.

| Source | Résidu |
|---|:---:|
| `public.users` (email contient `p4_3a` OU `fullName` commence par `TEST P4.3a`) | 0 |
| `auth.users` (email contient `p4_3a`) | 0 |
| `public.language_centers` (id commence par `test_p4_3a_`) | 0 |
| `public.classrooms` (id commence par `test_p4_3a_`) | 0 |
| `public.classroom_enrollments` (userId fixture) | 0 |
| `public.class_join_requests` (message = "TEST P4.3a") | 0 |
| `public.user_app_roles` (userId fixture) | 0 |
| `public.user_roles` (userId fixture) | 0 |
| `public.access_grants` (userId fixture) | 0 |
| `public.audit_events` (actorUserId fixture) | 0 |
| `public.notifications` (userId fixture) | 0 |
| `public.circle_memberships` (userId fixture) | 0 |
| `public.households` (ownerUserId fixture) | 0 |
| `public.household_memberships` (userId fixture) | 0 |
| `public.child_profiles` (parentUserId fixture) | 0 |
| `public.class_memberships` (userId fixture) | 0 |
| `public.learning_paths` (userId fixture) | 0 |
| `public.orders` (userId fixture) | 0 |
| Supabase Storage (objets contenant `test_p4_3a`) | 0 |

**Résultat production · 0 fixture P4.3a résiduelle confirmée le 2026-07-23 ~17 h 30 CEST.**

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

* Production résiduel · 0 (vérifié 18 sources, Storage inclus).
* P-1 résiduel · 0 (cleanup exécuté après validation runtime).
* Protection code · posée, verrouillée par `scripts/test-baseline/p4-3a-env-refusal.mjs` (6/6 scénarios validés).
* Rotations · non requises.
* Branche · `feat/yema-p4-3a-center-real-data` (non mergée).
* Statut · **CLOSED**.

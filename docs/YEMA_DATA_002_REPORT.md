# YEMA · DATA-002 · Rapport d'alignement schéma

> **Livrable de la passe `fix/yema-data-002`.** Aligne la chaîne `prisma/migrations/*` sur `prisma/schema.prisma` pour supprimer les dérives identifiées par la Baseline P-1 (`docs/YEMA_AUTHENTICATED_BASELINE.md`).

## Contexte

Post-A.2 (DATA-001), P-1 avait révélé qu'une base Postgres fraîche obtenue via `prisma migrate deploy` **exigeait un `prisma db push` manuel** pour matcher `schema.prisma`. Ce hack était valide uniquement pour la P-1 dédiée et ne pouvait pas être appliqué à la prod. DATA-002 comble ce trou : la chaîne de migrations produit désormais un schéma aligné, `db push` n'est plus nécessaire ni pour un environnement fresh ni pour la validation P-1.

## Inventaire complet des dérives (avant DATA-002)

Diff `prisma migrate diff --from-config-datasource --to-schema` sur une base PG 17 fraîche migrée jusqu'à `20260722_align_child_profiles_schema` :

### Dérives fonctionnelles corrigées

| Objet | État avant | Type | Correction |
|---|---|---|---|
| enum `RoleStatus` | absent | MISSING_ENUM | CREATE TYPE (ACTIVE, PENDING) |
| enum `ApplicationStatus` | absent | MISSING_ENUM | CREATE TYPE (RECEIVED, CONTACTED, MET, ACCREDITED, DECLINED) |
| `Role.CENTER` | absent | MISSING_ENUM_VALUE | ALTER TYPE ADD VALUE |
| table `user_roles` | absente | MISSING_TABLE | CREATE TABLE + FK + 2 indexes |
| table `class_join_requests` | absente | MISSING_TABLE | CREATE TABLE + FK + 2 indexes |
| table `study_group_invites` | absente | MISSING_TABLE | CREATE TABLE + 2 FK + 1 index |
| table `user_connections` | absente | MISSING_TABLE | CREATE TABLE + 2 FK + unique index |
| table `teacher_applications` | absente | MISSING_TABLE | CREATE TABLE + 2 indexes |
| table `center_applications` | absente | MISSING_TABLE | CREATE TABLE + 2 indexes |
| `users.plan` | absente | MISSING_COLUMN | ADD COLUMN SubscriptionPlan NOT NULL DEFAULT FREE |
| `users.centerId` | absente | MISSING_COLUMN | ADD COLUMN TEXT nullable (pas de FK côté User) |
| `teachers.code` | absente | MISSING_COLUMN + INDEX | ADD COLUMN TEXT nullable + UNIQUE |
| `language_centers.code` | absente | MISSING_COLUMN + INDEX | ADD COLUMN TEXT nullable + UNIQUE |
| `level_history.ceremonySeen` | absente | MISSING_COLUMN | ADD COLUMN BOOLEAN NOT NULL DEFAULT false |

### Dérives cosmétiques laissées volontairement

| Objet | Nature | Justification |
|---|---|---|
| ~20 FK Drop/Re-add | Nom de contrainte diff (`access_grants_orderItemId_fkey` vs `access_grants_orderItemId_fkey`) | Prisma génère un nom canonique, comportement `ON DELETE`/`ON UPDATE` identique. Aucun impact runtime, aucune migration future bloquée. Corriger n'apporterait rien fonctionnel. |
| `access_grants_benef_idx` → `access_grants_beneficiaryType_beneficiaryId_status_idx` | Rename index | Colonnes identiques, comportement identique. |
| `access_grants_source_idx` → `access_grants_sourceType_sourceId_idx` | Rename index | Idem. |
| `product_variants_uniq` → `product_variants_productId_language_level_currency_duration_key` | Rename unique | Idem. |
| `provider_profiles.languages/levels` DEFAULT `[]` retiré | Default DB non déclaré dans schema.prisma | Prisma sur `.create` passe explicitement les valeurs, le default DB n'est jamais utilisé. Retrait cosmétique. |
| `Role.CENTER_MANAGER` reste dans l'enum | ADD VALUE possible, DROP VALUE impossible en PG | Retirer un enum value nécessite DROP TYPE + CREATE + migration data lourde. La valeur n'est utilisée par aucune donnée après backfill (UPDATE users SET role='CENTER' WHERE role='CENTER_MANAGER'). Retrait à envisager en DATA-003 si besoin. |

## Migrations créées

Deux fichiers additifs — **aucune migration historique modifiée** :

```
prisma/migrations/
├── 20260723000001_data_002_enums_and_role_center/migration.sql   (36 lignes)
└── 20260723000002_data_002_tables_and_backfill/migration.sql     (125 lignes)
```

### Étape 1/2 · Enums

Contient uniquement :
- `CREATE TYPE "RoleStatus"`
- `CREATE TYPE "ApplicationStatus"`
- `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CENTER'`

Séparée car Postgres 17 refuse **« unsafe use of new value »** lorsqu'on utilise une valeur d'enum juste ajoutée dans la même transaction. Testé empiriquement : voir §5 du script `crud-test.mjs`.

### Étape 2/2 · Colonnes + tables + backfill

Contient dans une transaction unique :
1. `ALTER TABLE users ADD COLUMN centerId, plan` (avec `IF NOT EXISTS`)
2. `ALTER TABLE teachers ADD COLUMN code` + `UNIQUE`
3. `ALTER TABLE language_centers ADD COLUMN code` + `UNIQUE`
4. `ALTER TABLE level_history ADD COLUMN ceremonySeen DEFAULT false`
5. `CREATE TABLE user_roles, class_join_requests, study_group_invites, user_connections, teacher_applications, center_applications` (+ indexes + FK)
6. Backfill :
   - `UPDATE users SET role = 'CENTER' WHERE role = 'CENTER_MANAGER'`
   - `INSERT INTO user_roles SELECT ... FROM users ON CONFLICT DO NOTHING`

## Stratégie de backfill

| Champ | Legacy value | Post-DATA-002 |
|---|---|---|
| `users.plan` | absent (colonne inexistante) | `FREE` (default sûr, aucun engagement commercial) |
| `users.centerId` | absent | `NULL` (aucun rattachement centre inventé) |
| `users.role` = `CENTER_MANAGER` | oui | `CENTER` (doctrine post-A.1) |
| `teachers.code` | absent | `NULL` (les nouveaux teachers reçoivent un code via `POST /api/teacher`) |
| `language_centers.code` | absent | `NULL` (les nouveaux centres reçoivent un code via `POST /api/apply/center` puis `PATCH`) |
| `level_history.ceremonySeen` | absent | `false` (peut re-déclencher une cérémonie déjà vue, mais préférable à masquer un événement non vu) |
| `user_roles` | table absente | 1 UserRole `ACTIVE + onboarded=true` par user existant, dérivé de `users.role`. `grantedBy=null`. |

**Aucun rôle n'est élevé arbitrairement.** Un STUDENT ne devient ni TEACHER, ni CENTER, ni ADMIN par la migration. Les seuls UserRole créés reflètent le `users.role` déjà présent avant DATA-002.

## Résultats

### Base vide (Postgres 17 embarqué)

```
npx prisma migrate deploy   → 13 migrations appliquées (11 legacy + 2 DATA-002)
npx prisma migrate status   → Database schema is up to date!
npx prisma validate         → schema is valid
npx prisma generate         → Prisma Client v7.8.0
npx prisma migrate diff     → 0 drift fonctionnel
                              (seul residu : [-] Removed variant CENTER_MANAGER — cosmétique documenté)
```

### Scénario legacy (6 utilisateurs pré-DATA-002 + 2 learning paths + 1 level history + 1 teacher + 1 center)

**20/20 assertions passées** (voir `/tmp/yema-data-002-tools/legacy-scenario.mjs`) :

- 6 users préservés (id, email, role, timestamps inchangés)
- `CENTER_MANAGER → CENTER` migré côté `users.role` **et** côté `user_roles`
- `users.plan = FREE`, `users.centerId = NULL` pour tous
- `user_roles` : 1 row par legacy user, ACTIVE + onboarded
- `level_history.ceremonySeen = false` pour la ligne existante
- Learning paths intacts (Monde deutsch A1 + Racines wolof)
- `teachers.code = NULL`, `language_centers.code = NULL` (nouveaux teachers/centers en génèrent un)
- Tables sociales (`class_join_requests`, `study_group_invites`, `user_connections`) existent et vides
- Tables applications (`teacher_applications`, `center_applications`) existent et vides
- Enums `RoleStatus`, `ApplicationStatus`, `Role.CENTER` disponibles

### CRUD Prisma post-DATA-002

**27/27 assertions passées** (voir `/tmp/yema-data-002-tools/crud-test.mjs`) :

- Création STUDENT/TEACHER/CENTER avec Prisma
- `users.plan` default FREE lu à la création puis relu
- `users.centerId` assignable puis lu
- UserRole création + duplicate rejeté (P2002)
- LanguageCenter avec code unique + findUnique + duplicate rejeté
- Teacher avec code unique + findUnique + duplicate rejeté
- LearningPath création multi-univers pour même user + update
- LevelHistory avec `ceremonySeen` create + update
- ClassJoinRequest, StudyGroupInvite, UserConnection créés
- TeacherApplication, CenterApplication default status RECEIVED

### Validation Supabase P-1

Sur le projet `yema-p1-baseline` (ref `kzzagbojjkivdzzcrmxn`) :

1. Schéma public droppé + recréé (état vraiment fresh)
2. `npx prisma migrate deploy` seul (**pas de `prisma db push`**)
3. `npx prisma migrate status` : up to date
4. `npx prisma migrate diff --exit-code` : 0 drift fonctionnel
5. `npx prisma db seed` (catalogue)
6. `node scripts/test-baseline/create-test-baseline.mjs` : 6 comptes créés
7. `node scripts/test-baseline/verify-test-baseline.mjs` : **33/33 checks passés**

**Critère satisfait : `P-1 baseline creation succeeds using migrations only`** ✅

Auth et rôles vérifiés :
- 6 sessions signInWithPassword OK
- users.role = STUDENT/TEACHER/CENTER/ADMIN correctement lus
- user_roles.role synchronisés
- `/api/me` (testable en runtime) renverrait le bon rôle et plan
- Aucun `prisma db push` requis

### Tests techniques

```
npm test              → 7 files · 41 tests passed
npx tsc --noEmit      → 0 erreur
npm run build         → Compiled successfully en 4.2s
git diff --check      → propre
```

## Preuve qu'aucune migration historique n'a été modifiée

```
$ git diff --name-only main...HEAD -- prisma/migrations
prisma/migrations/20260723000001_data_002_enums_and_role_center/migration.sql
prisma/migrations/20260723000002_data_002_tables_and_backfill/migration.sql
```

Seuls les deux nouveaux dossiers apparaissent. Les 11 migrations existantes (dont `20260719_child_profiles`, `20260721000000_yema_v1_core`, `20260722_align_child_profiles_schema` d'A.2) sont intactes.

## Cleanup

- Cluster embedded-postgres `/tmp/yema-data-002-cluster` : à arrêter et supprimer après validation
- P-1 baseline data : cleanup exécuté (0 users, 0 test data)
- P-1 project (`yema-p1-baseline`) : reste actif mais vide
- `package.json` et `package-lock.json` : hashes identiques au baseline (embedded-postgres installé isolément dans `/tmp/yema-data-002-tools/`)

## Décision produit à trancher plus tard

- **Retrait de `Role.CENTER_MANAGER`** : à faire dans une passe DATA-003 après confirmation absolue qu'aucune ligne prod ne l'utilise. Nécessite `CREATE TYPE Role_new AS ENUM(...) + migration + DROP + rename`. Non urgent, aucun impact runtime.

## Confirmation

```
Landing /fr : CANONICAL — non touchée
Landing /en : CANONICAL — non touchée
Aucune migration historique modifiée
Aucun fichier produit modifié (uniquement migrations SQL ajoutées)
AUDIT.md non tracké et intact
Projet Supabase prod (sbjhvlrkbyjckdxujjsk) jamais touché
Cluster PG 17 jetable utilisé pour tests destructifs
P-1 baseline fonctionne sans prisma db push
```

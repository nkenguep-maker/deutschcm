# YEMA · Inventaire des usages `SUPABASE_SERVICE_ROLE_KEY` (P4.1)

> Audit lecture seule. Aucun secret n'est affiché · seuls les noms de fichiers, les intentions et les gardes applicatives sont documentés.
>
> **Règle** · toute route ou fonction utilisant la clé service-role **bypass la RLS**. Elle doit donc appliquer sa propre autorisation applicative avant d'exécuter la moindre opération sensible. Une route service-role sans garde d'autorisation est un **blocker P4.1**.
>
> **État** · **0 blocker ouvert** au 2026-07-23. Tous les usages ci-dessous sont justifiés, gardés côté serveur, et hors périmètre client.

---

## 1. Résumé

| # | Fichier | Rôle | Autorisation avant appel | Risque | Statut P4.1 |
|---|---------|------|-------------------------|--------|-------------|
| 1 | `src/app/api/admin/applications/accredit/route.ts` | POST admin accréditation prof/centre · createUser + updateUserById | `requireAdmin()` guard (`AppRole = YEMA_ADMIN`) | LOW | ✅ KEEP |
| 2 | `src/app/api/language/switch/route.ts` | POST langue préférée user · updateUserById (self) | Session Supabase + résolution `dbUser` | ⚠ escalation inutile · anon key suffirait | 🟡 REFACTOR P4.2 |
| 3 | `src/app/api/upload/video-url/route.ts` | POST signed upload URL (course-videos) · createBucket + createSignedUploadUrl | Rôle ∈ {ADMIN, TEACHER, CENTER} | LOW | ✅ KEEP |
| 4 | `src/app/api/onboarding/complete/route.ts` | POST completion onboarding · updateUserById (self · user_metadata sync) | Session Supabase auth · self only | LOW | ✅ KEEP |
| 5 | `src/app/api/dev/reset-user/route.ts` | DELETE user dev-only · deleteUser + reset Prisma | `NODE_ENV !== "production"` guard | NONE (dev-only) | ✅ KEEP |
| 6 | `src/lib/roles.ts` — `syncUserMetadata()` | Sync rôles Prisma → user_metadata Supabase | Fonction interne appelée depuis routes déjà gardées | LOW | ✅ KEEP |
| 7 | `src/app/api/__tests__/me.test.ts` | Tests · setup fixture users | Test suite (jamais prod) | NONE | ✅ KEEP |
| — | `src/app/[locale]/admin/page.tsx:549` | Affichage cosmétique d'un check env-var | Aucune (lecture seule, pas d'appel) | NONE | ✅ KEEP |
| — | `scripts/test-baseline/*` | Fixtures test P-1 uniquement | `assertNonProduction()` guard | NONE (P-1 only) | ✅ KEEP |

**Aucun composant client** n'importe `SUPABASE_SERVICE_ROLE_KEY`. Le hook global `secrets-scan` bloque tout commit y insérant un secret.

---

## 2. Détail par usage

### 2.1 `src/app/api/admin/applications/accredit/route.ts`

- **Rôle** · accréditer un candidat professeur ou un centre depuis `teacher_applications` / `center_applications`.
- **Opérations service-role** ·
  - `admin.auth.admin.listUsers()` — recherche user existant par email.
  - `admin.auth.admin.createUser()` — création si absent (invitation email).
  - `admin.auth.admin.updateUserById()` — merge `user_metadata.roles`, `user_metadata.accredited_from`.
- **Garde applicative** · `requireAdmin()` vérifie `UserAppRole.role = YEMA_ADMIN AND grantedBy != null`. 403 sinon.
- **Justification service-role** · nécessaire · seule la clé service-role peut créer des utilisateurs Supabase Auth.
- **Migration vers RLS user-scoped** · **impossible** — auth admin API n'a pas d'équivalent client. Statu quo.
- **Action P4** · maintenir tel quel. Ajouter en P4.2 un `AuditEvent.ADMIN_BREAK_GLASS_USED` à chaque appel (aujourd'hui pas de trace).

### 2.2 `src/app/api/language/switch/route.ts`

- **Rôle** · persister `activeLanguage` dans `user_metadata` (choix de langue affichée).
- **Opérations service-role** ·
  - `admin.auth.admin.getUserById()` puis `updateUserById()` sur soi-même.
- **Garde applicative** · session `supabase.auth.getUser()` avant d'appeler admin.
- **Justification service-role** · **discutable**. Le client anon `supabase.auth.updateUser({ data: {...} })` fonctionnerait aussi bien pour un self-update.
- **Migration vers RLS user-scoped** · **oui** · basculer sur `createClient()` server-side avec cookies (anon key). Pas de blocker P4.1 mais **REFACTOR P4.2** (baisser la surface service-role globale).
- **Action P4.1** · aucune (fonctionne, hors périmètre Circle).
- **Action P4.2** · refactor + PR séparée.

### 2.3 `src/app/api/upload/video-url/route.ts`

- **Rôle** · générer un signed upload URL pour un professeur / centre publiant une vidéo dans `course-videos`.
- **Opérations service-role** ·
  - `admin.storage.createBucket()` — idempotent, création du bucket (une fois).
  - `admin.storage.from(bucket).createSignedUploadUrl()` — signer un upload autorisé.
- **Garde applicative** · lookup Prisma `dbUser.role ∈ {ADMIN, TEACHER, CENTER}`. 403 sinon.
- **Justification service-role** · nécessaire · seule la clé service-role peut créer un bucket. Pour signer un upload, le client anon peut suffire *si* le bucket est privé avec policies · à revoir P5.
- **Migration vers RLS user-scoped** · partielle · bucket creation reste service-role · signing peut migrer sous policies. Non prioritaire P4.
- **Action P4.1** · aucun changement. TTL du signed URL à documenter explicitement (Supabase default 3600s · vérifier valeur en P4.5 avant activation `AUDIO_FEEDBACK_ENABLED`).

### 2.4 `src/app/api/onboarding/complete/route.ts`

- **Rôle** · finaliser l'onboarding · sync `cap`, `activeLanguage`, `personalGoal`, `availability` dans `user_metadata` + Prisma.
- **Opérations service-role** · `getUserById()` + `updateUserById()` sur soi-même.
- **Garde applicative** · session Supabase + résolution `dbUser`.
- **Justification service-role** · discutable (idem 2.2). Historique · première implémentation P0. Statu quo P4.
- **Action P4** · surveiller. Pas de blocker.

### 2.5 `src/app/api/dev/reset-user/route.ts`

- **Rôle** · reset user + Prisma en dev pour tests fixtures.
- **Opérations service-role** · `listUsers()` + `deleteUser()`.
- **Garde applicative** · `if (process.env.NODE_ENV === "production") return 404`.
- **Migration** · non applicable (dev-only).
- **Action P4** · maintenir. Vérifier au build prod que la route n'apparaît pas.

### 2.6 `src/lib/roles.ts` — `syncUserMetadata()`

- **Rôle** · fonction utilitaire appelée depuis les routes `roles/grant`, `roles/revoke`, `onboarding/complete` pour synchroniser le state rôles côté `user_metadata` Supabase (utilisé par le proxy pour routing serveur).
- **Opérations service-role** · `getUserById()` + `updateUserById()`.
- **Garde applicative** · la fonction est interne, les routes appelantes sont gardées par `requireAdmin()` ou session self.
- **Migration** · idem (auth admin API nécessaire pour metadata write cross-user).
- **Action P4** · statu quo.

### 2.7 `src/app/api/__tests__/me.test.ts`

- **Rôle** · test suite `me` — création de fixture users.
- **Opérations service-role** · setup vitest uniquement.
- **Garde** · N/A (test).
- **Action P4** · aucune.

### 2.8 `src/app/[locale]/admin/page.tsx:549`

- **Rôle** · affiche cosmétiquement un check de présence env-var dans un tableau de diagnostic.
- **Opérations service-role** · **aucune** (juste le nom de la clé en string dans une liste).
- **Action P4** · aucune. Faux positif du grep.

### 2.9 `scripts/test-baseline/*` (P4.1 fixtures inclus)

- **Rôle** · fixtures test P-1 · `create-test-baseline.mjs`, `p2-access-fixtures.mjs`, `p3-hardening-fixtures.mjs`, `p4-1-fixtures.mjs` (nouveau), `p4-1-rls-smoke.mjs` (nouveau).
- **Garde** · `assertNonProduction()` refuse d'exécuter contre la prod Supabase (`sbjhvlrkbyjckdxujjsk`).
- **Action P4** · maintenir.

---

## 3. Chemin de blocage

Un **futur** ajout de route service-role sans garde d'autorisation devient un **blocker P4** :

- **Détection** · un test de garde exhaustif sera ajouté en P4.7 (`scripts/test-baseline/p4-service-role-audit.mjs`) qui parse le repo et échoue si un fichier importe `SUPABASE_SERVICE_ROLE_KEY` sans matcher un pattern d'auth (`requireAdmin`, `assertCircle*`, `NODE_ENV !== "production"`, etc.).
- **Blocking gate** · aucune activation de flag P4.6 (`CLOSED_MESSAGING_ENABLED`) tant que ce script n'est pas au vert.

---

## 4. Recommandations P4.2+

1. Câbler `AuditEvent.ADMIN_BREAK_GLASS_USED` sur chaque appel `/api/admin/applications/accredit` — traçabilité obligatoire.
2. Refactorer `/api/language/switch` et `/api/onboarding/complete` vers anon-key + cookies pour réduire la surface service-role à ce qui est strictement nécessaire (auth admin API).
3. Documenter le TTL des signed URLs `/api/upload/video-url` — par défaut Supabase = 3600s, à trancher en P4.5 avant activation `AUDIO_FEEDBACK_ENABLED`.
4. Ajouter un test statique P4.7 qui empêche l'importation de `SUPABASE_SERVICE_ROLE_KEY` dans tout fichier sous `src/components/**` ou `src/app/**/page.tsx`.

---

## 5. Décision P4.1

**Aucun blocker service-role ouvert.** Les 7 usages actuels sont justifiés, gardés côté serveur, et hors périmètre client. Les 2 recommandations de refactor (§2.2, §2.4) sont non-bloquantes et suivront en P4.2.

---

## 6. Grants Postgres · état post-revue 2026-07-23

Les 9 fonctions helper (`current_app_user_id`, `is_household_member`, `is_child_parent`, `is_circle_member`, `is_circle_owner`, `is_circle_coach`, `is_class_member`, `is_center_admin`, `is_yema_admin`) suivent le protocole ·

- `REVOKE ALL ... FROM PUBLIC` d'abord.
- `GRANT EXECUTE ... TO authenticated` pour toutes.
- `GRANT EXECUTE ... TO anon` uniquement pour `current_app_user_id()` (les autres helpers requièrent une session).
- `SECURITY DEFINER SET search_path = public, pg_temp` sur chaque fonction · toutes les jointures internes sont qualifiées `public.<table>`.
- Aucun argument client-supplied · les paramètres `p_user_id` sont fournis par les policies elles-mêmes (via `current_app_user_id()`), pas par l'utilisateur.

Grants tables ·

- `GRANT SELECT ON circles, circle_memberships, storage_objects TO authenticated` · les policies RLS filtrent les lignes.
- `GRANT SELECT ON audit_events TO authenticated` · seule la policy `is_yema_admin` renvoie des lignes · les autres users voient 0 rows.
- `REVOKE ALL ON <4 tables> FROM anon` · aucun accès anonyme quelle que soit la RLS.
- Aucune policy `INSERT/UPDATE/DELETE` côté client · toutes les écritures P4.1 passent par des routes Next avec Prisma en `service_role` (bypass RLS).

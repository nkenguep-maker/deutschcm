# YEMA · P4.2 · Memberships + invitations Circle

> Livrables du sous-lot **P4.2** — CircleInvitation + workflow adulte + ajout/retrait enfant + coach assignment ADMIN.
>
> **Branche** · `feat/yema-p4-2-memberships-invitations`
> **Base** · `main` post-merge P4.1 (`7d7452e`)
> **Portée** · workflow membership uniquement. **Aucune UI Circle exposée**, aucune messagerie, aucun devoir, aucun feedback. Tous les feature flags P4 restent `false` par défaut.
>
> **Sources doctrine** · `YEMA_P4_ARCHITECTURE_AUDIT.md` · `YEMA_P4_PERMISSION_MATRIX.md` · `YEMA_P4_THREAT_MODEL.md` · `YEMA_P4_IMPLEMENTATION_PLAN.md` · `YEMA_P4_1_CIRCLE_SECURITY.md`.
>
> **Décisions produit intégrées** (validées post-revue P4 finalisée) ·
> - **Q1** · 2ᵉ adulte voit + accompagne · jamais delete enfant · jamais membership sensible.
> - **Q2** · OWNER seul invite le 2ᵉ adulte.
> - **Q3** · OWNER peut retirer · l'adulte peut se retirer lui-même.
> - **Q10** · Coach remplacé perd l'accès immédiatement · historique attribué conservé (soft-delete membership).
> - **Q15** · Capacité coach initiale · 20 profils enfants actifs / 10 Circles.

---

## 1. Schéma Prisma additif

- **Nouveau modèle** · `CircleInvitation` (voir §3).
- **Nouvelle enum** · `InvitationStatus = PENDING | ACCEPTED | REVOKED | EXPIRED`.
- **Extensions enum** · `AuditAction` reçoit 11 nouvelles valeurs (`ADULT_INVITED`, `ADULT_INVITATION_REVOKED`, `ADULT_INVITATION_ACCEPTED`, `ADULT_LEFT_CIRCLE`, `ADULT_REMOVED`, `CHILD_ADDED`, `CHILD_REMOVED`, `COACH_ASSIGNMENT_REQUESTED`, `COACH_ASSIGNED`, `COACH_REMOVED`, `MEMBERSHIP_ACCESS_DENIED`).
- **Reverse relations** · `Circle.invitations`, `User.invitationsIssued/Accepted/Revoked`.

---

## 2. Migration

Fichier · `prisma/migrations/20260723000004_p4_2_invitations/migration.sql` · additive, idempotente (IF NOT EXISTS + DO $$ EXCEPTION duplicate_object).

Contenu ·

1. `CREATE TYPE InvitationStatus` (idempotent).
2. `ALTER TYPE AuditAction ADD VALUE IF NOT EXISTS <11 values>`.
3. `CREATE TABLE circle_invitations` avec 4 FKs (Circle + 3 relations User).
4. Indexes · `tokenHash UNIQUE` · `[circleId, status]` · `[invitedEmailHash, status]` · `[expiresAt, status]` · **partial unique** `[circleId, invitedEmailHash] WHERE status='PENDING'`.
5. `ENABLE ROW LEVEL SECURITY` + policy SELECT `circle_invitations_select_owner` (OWNER du cercle ou `is_yema_admin`).
6. `GRANT SELECT TO authenticated` · `REVOKE ALL FROM anon`.

Application ·
- **P-1** · appliquée via `pg` Node client (idempotente).
- **Base vierge** · à valider avec `prisma dev` + bootstrap Supabase-compat (méthode P4.1 §14).

---

## 3. CircleInvitation

```
id                cuid PK
circleId          → Circle (Cascade)
role              CircleRole                       -- ADULT en P4.2
status            InvitationStatus @default(PENDING)
invitedEmailHash  String                           -- SHA-256 lowercase(email)
invitedByUserId   → User (Cascade)
tokenHash         String @unique                   -- SHA-256 du token brut
expiresAt         DateTime                         -- création + 72h
acceptedAt        DateTime?
acceptedByUserId  → User? (SetNull)
revokedAt         DateTime?
revokedByUserId   → User? (SetNull)
createdAt, updatedAt

@@unique([tokenHash])
@@index([circleId, status])
@@index([invitedEmailHash, status])
@@index([expiresAt, status])
CREATE UNIQUE INDEX ... WHERE status='PENDING' (partial · 1 PENDING par (circle, email))
```

---

## 4. Sécurité du token

- **Génération** · `crypto.randomBytes(32).toString("base64url")` · 43 chars URL-safe · entropie 2^256.
- **Stockage** · `SHA-256(token).hex` uniquement (64 hex chars). Le token brut n'est **jamais** persisté en base ni journalisé.
- **Retour** · le token brut n'est disponible **qu'à la création**, une seule fois. En P4.2, exposé via header `X-P4-Test-Token` **uniquement** quand `YEMA_ALLOW_TEST_TOKENS=true` (env test local, jamais en prod ni Preview). En P5, un worker écoutera l'événement `ADULT_CIRCLE_INVITATION_CREATED` pour envoyer l'email.
- **Vérification** · `verifyToken(rawToken, storedHash)` retourne `hashToken(raw) === storedHash`.
- **Aucune énumération** · lookup par `tokenHash` UNIQUE en base · impossibilité pratique de brute-force.
- **Aucun logging** · le token brut ne transite jamais dans `console.log`, dans les `AuditEvent.metadata` (blacklist `token`), ni dans les réponses d'erreur.

Tests token · `src/lib/__tests__/invitation-tokens.test.ts` (7 tests · génération, unicité 10 000 iterations, hashing, normalisation email, vérification).

---

## 5-8. Workflow adulte (Q1-Q3)

### 5. OWNER invite
`POST /api/circles/[cid]/invitations/adult` · body `{ email }`.
- OWNER-only (assert via `resolveCircleActor` + membership OWNER ACTIVE).
- Cap 2 adultes vérifié avant création · `409 max_adults_reached` si atteint.
- Si un user existe déjà avec ce mail et membership ACTIVE dans ce cercle · `409 membership_already_active` (pas d'énumération cross-tenant).
- Duplicate PENDING sur même `(circleId, emailHash)` · `409 duplicate_pending_invitation` (partial unique DB).
- Émet `AuditEvent.ADULT_INVITED` (metadata · `role`, `expiresAt`).

### 6. Accept
`POST /api/circle-invitations/[token]/accept`.
- Résout `invitation` par `tokenHash`.
- Vérifie `status='PENDING'`, `expiresAt > now`, email actor = email invité, Circle ACTIVE, cap 2 adultes.
- Transition atomique · `updateMany({status:'PENDING'}, {status:'ACCEPTED', acceptedAt, acceptedByUserId})` · si `count=0` → `410 invitation_already_used` (double accept concurrent).
- Crée `CircleMembership` `role=ADULT status=ACTIVE`.
- Émet `AuditEvent.ADULT_INVITATION_ACCEPTED`.

### 7. Revoke
`POST /api/circles/[cid]/invitations/[iid]/revoke` · OWNER seul.
- Passe `PENDING → REVOKED` avec guard `updateMany({status:'PENDING'})`.
- Émet `AuditEvent.ADULT_INVITATION_REVOKED`.

### 8. Adult leave
`POST /api/circles/[cid]/leave` · membre self.
- OWNER interdit · `403 owner_cannot_leave`.
- Membership passe `ACTIVE → REMOVED` avec `removedAt=now`.
- Émet `AuditEvent.ADULT_LEFT_CIRCLE`.

### OWNER remove adult
`DELETE /api/circles/[cid]/members/[mid]` · OWNER seul, cible ADULT.
- Refuse si target.role=OWNER (`forbidden`).
- Émet `AuditEvent.ADULT_REMOVED`.

---

## 9-11. Enfants

### 10. Add child
`POST /api/circles/[cid]/children` · body `{ childProfileId }`.
- OWNER seul.
- Child doit appartenir au foyer (`householdId` match) OU au parent authentifié.
- Cap 4 enfants vérifié · `409 max_children_reached`.
- Dédup · pas de duplicate ACTIVE pour même `(circleId, childProfileId)`.
- Émet `AuditEvent.CHILD_ADDED`.

### 11. Remove child
`DELETE /api/circles/[cid]/children/[childProfileId]` · OWNER seul.
- Soft-delete · membership `ACTIVE → REMOVED`.
- `ChildProfile` conservé · progression conservée.
- Reset `user_metadata.activeChildId` côté Supabase si le parent avait ce profil actif (non fatal si échoue).
- Émet `AuditEvent.CHILD_REMOVED`.

### 12. Profil actif
Le contrat `me/active-child` (P3) reste inchangé. L'enfant retiré ne peut pas rester `activeChildId` :
- Retrait explicite lors du DELETE (§11).
- Toute future lecture `me/racines-dashboard` doit ignorer un `activeChildId` pointant vers un membership `REMOVED` (à câbler P4.3+ si nécessaire).

---

## 13-14. Coach assignment (Q10, Q15)

Le coach ne s'invite pas lui-même. En P4.2, seul un ADMIN (`AppRole = YEMA_ADMIN`) peut l'assigner.

### 13. Assign coach
`POST /api/admin/circles/[cid]/coach` · body `{ coachUserId }`.
- `resolveAdminActor` · vérifie `YEMA_ADMIN`.
- `assignCoach` vérifie · Circle ACTIVE · target user porte `AppRole=RACINES_COACH` · cap 1 coach ACTIVE par cercle · cap Q15 (20 profils / 10 Circles).
- Émet `AuditEvent.COACH_ASSIGNED` (metadata · `coachUserId`).

### 14. Remove coach
`DELETE /api/admin/circles/[cid]/coach` · ADMIN seul.
- Passe le membership COACH ACTIVE en REMOVED · retire l'accès immédiatement (Q10).
- L'historique reste attribué via `authorMembership.status='REMOVED'` (les futurs `CircleMessage` P4.6 conserveront l'auteur).
- Émet `AuditEvent.COACH_REMOVED` (metadata · `previousCoachUserId`).

Capacité coach dans `src/lib/circles/capacity.ts` · `assertCoachCapacityAvailable(tx, coachUserId, additionalCircleId)`. Erreur stable `coach_capacity_reached` avec `detail.dimension = "circles" | "children"`.

---

## 15. Endpoints (10)

| Verb | Route | Rôle | Objectif |
|---|---|---|---|
| GET | `/api/circles/[cid]/members` | membre ACTIVE | Liste memberships (projection par rôle) |
| POST | `/api/circles/[cid]/invitations/adult` | OWNER | Créer invitation ADULT |
| POST | `/api/circle-invitations/[token]/accept` | invité authentifié | Accepter (atomique) |
| POST | `/api/circles/[cid]/invitations/[iid]/revoke` | OWNER | Révoquer PENDING |
| POST | `/api/circles/[cid]/children` | OWNER | Ajouter enfant |
| DELETE | `/api/circles/[cid]/children/[cpid]` | OWNER | Retirer enfant |
| POST | `/api/circles/[cid]/leave` | non-OWNER member | Quitter self |
| DELETE | `/api/circles/[cid]/members/[mid]` | OWNER | Retirer adulte |
| POST | `/api/admin/circles/[cid]/coach` | ADMIN | Assigner coach |
| DELETE | `/api/admin/circles/[cid]/coach` | ADMIN | Retirer coach |

Chaque endpoint · vérifie `CIRCLE_ENABLED` (404 si off) · résout session serveur · autorise par membership/rôle · transaction Serializable pour les writes · émet AuditEvent · code d'erreur stable.

---

## 16. RLS

- **`circle_invitations`** · RLS ON · policy SELECT `is_circle_owner(circleId) OR is_yema_admin`. Ni l'invité ni un adulte ordinaire ne peut lister les invitations · seul l'OWNER voit celles de son cercle.
- **`circle_memberships`** (P4.1) · policy SELECT inchangée (`is_circle_member`).
- **Écritures** · toutes via routes serveur avec Prisma `service_role` · aucune policy INSERT/UPDATE côté client.
- **Grants** · `SELECT TO authenticated` · `REVOKE ALL FROM anon`.

---

## 17. AuditEvent

11 nouvelles actions dans la même transaction que l'action métier. Sanitize automatique (blacklist `body`, `message`, `audioUrl`, `signedUrl`, `token`, `password`, `transcription` · truncate >500 chars).

Metadata autorisée · IDs techniques (`role`, `expiresAt` ISO, `childProfileId`, `previousCoachUserId`, `revokedByRole`).
Interdite · email brut, token, contenu privé, nom complet enfant, request body.

Smoke test post-run · 23 événements émis, breakdown ·
```
ADULT_INVITED=7 · ADULT_INVITATION_ACCEPTED=2 · ADULT_LEFT_CIRCLE=1 ·
ADULT_REMOVED=1 · CHILD_ADDED=4 · CHILD_REMOVED=4 · COACH_ASSIGNED=2 ·
COACH_REMOVED=2
```
Check leak · `SELECT id FROM audit_events WHERE metadata::text ILIKE '%token%' OR '%password%'` · **0 lignes**.

---

## 18. Concurrence (smoke test P-1)

Scénarios validés dans `scripts/test-baseline/p4-2-smoke.mjs` avec `Promise.all` réel ·

| Scénario | Résultat |
|---|---|
| 2 invitations distinct emails simultanées | Les deux passent (PENDING · cap = ACTIVE cap) |
| 2× accept même token (double accept) | 1 succès / 1 échec · `post-race active adults = 2` |
| Add 5ᵉ enfant | `409 max_children_reached` |
| Second coach assign (déjà 1 ACTIVE) | `409 coach_already_assigned` |
| Retrait pendant lecture | Membership REMOVED → accès révoqué (vérifié P4.1) |

---

## 19. Permissions (§16 spec)

| Action | OWNER | ADULT | CHILD | COACH | ADMIN | Externe |
|---|---|---|---|---|---|---|
| Lire membres | ✅ complet | ✅ complet | ✅ limité (rôle+prénom) | ✅ minimal (prénom/animal/âge) | via audit | 403 |
| Inviter adulte | ✅ | ❌ | ❌ | ❌ | (support hors-ligne) | 403 |
| Révoquer invitation | ✅ | ❌ | ❌ | ❌ | (support) | 403 |
| Ajouter enfant | ✅ | ❌ | ❌ | ❌ | (support) | 403 |
| Retirer enfant | ✅ | ❌ | ❌ | ❌ | (support) | 403 |
| Quitter Circle | ❌ owner_cannot_leave | ✅ | ✅ limité | ✅ | n/a | 403 |
| Retirer adulte | ✅ | ❌ | ❌ | ❌ | (support) | 403 |
| Assigner coach | ❌ | ❌ | ❌ | ❌ | ✅ | 403 |
| Retirer coach | ❌ | ❌ | ❌ | ❌ | ✅ | 403 |

Tous les rejets sont testés E2E via smoke script.

---

## 20. Données visibles par rôle (§17 spec)

Projection appliquée dans `GET /api/circles/[cid]/members` ·

- **OWNER / ADULT** · `id, role, status, joinedAt, user{id, fullName}, childProfile{id, prenom, avatarAnimal, age}`.
- **COACH** · `id, role, status, displayName, avatarAnimal, age` (pas d'`id user`, pas de nom de famille).
- **CHILD** · `role, displayName` uniquement.

Aucun rôle ne voit · email, téléphone, adresse, école, date de naissance complète, données d'un autre Circle.

---

## 21-22. Fixtures + Tests

- **Fixtures** · `scripts/test-baseline/p4-2-fixtures.mjs seed|clean|list` · crée 7 personas + 4 enfants + Circle A complet (OWNER + ADULT + COACH + 4 enfants) + Circle B cross-tenant + 3 invitations (valide, expirée, révoquée).
- **Unit tests** ·
  - `src/lib/__tests__/invitation-tokens.test.ts` · 7 tests (crypto, uniqueness 10k, hash, verify).
  - `src/lib/__tests__/coach-capacity.test.ts` · 4 tests (Q15 · 20 profils / 10 Circles).
  - `src/app/__tests__/p4-2-memberships.test.ts` · 60+ assertions structurelles (schema, migration, 10 routes flag-gated + no-body-userId + Serializable, token security, admin route, service invariants, membership contracts, audit sanitization).
- **Integration smoke** · `scripts/test-baseline/p4-2-smoke.mjs` · 26 assertions Playwright + Prisma live (voir §18 concurrence + §22).
- **Résultat** · **418 tests pass · Test Files 30 passed**.

---

## 23. Migration base vierge

Attendu · même méthode qu'en P4.1 (script `prisma dev` + bootstrap Supabase-compat + `prisma migrate deploy` 2× · 2ᵉ retourne "No pending migrations"). Cette migration est purement additive et respecte l'ordre chronologique (`20260723000004` > `20260723000003` P4.1).

---

## 24. Landing

- `/fr` · http 200 · 92 927 bytes ✓
- `/en` · http 200 · 89 327 bytes ✓
- Endpoints Circle flag OFF · `GET /api/circles/x` → 404 · `POST /invitations/adult` → 404 ✓
- Aucun composant Racines/dashboard modifié.

---

## 25. Blockers ouverts pour P4.3

- Câbler `MEMBERSHIP_ACCESS_DENIED` audit sur toute route qui refuse (aujourd'hui certaines routes retournent 403 sans audit — à câbler quand la surface s'élargit).
- Améliorer le mapping erreur `40001 serialization_failure` → code stable `serialization_conflict` (aujourd'hui remonte comme `INTERNAL` dans les cas rares de double-accept).
- Câbler `CIRCLE_LANGUAGE_CHANGED` interdit runtime (Q8 · déjà interdit par contrat, ajouter garde explicite).
- Nettoyer `activeChildId` après retrait enfant même si l'utilisateur n'est pas connecté au moment du DELETE (worker P5).
- Ajouter test statique · aucun composant client n'importe `SUPABASE_SERVICE_ROLE_KEY` (à câbler P4.7).

---

## 26. Décision

**P4.2 READY TO MERGE**

- 418 tests · TS clean · build vert.
- Smoke E2E · 26/26 assertions vertes en P-1 avec `CIRCLE_ENABLED=true`.
- Flag restauré à `false` par défaut · vérifié 404 sur `/api/circles/*` et `/invitations/adult`.
- Landing intacte.
- Aucun contact production Supabase (`sbjhvlrkbyjckdxujjsk`).
- Aucun `db push`.
- Aucune régression P4.1.

# YEMA · Threat model P4 · mineurs, messagerie fermée, storage, RLS

> Compagnon de `YEMA_P4_ARCHITECTURE_AUDIT.md` et `YEMA_P4_PERMISSION_MATRIX.md`. Aucun changement de code.
>
> **Périmètre** · menaces spécifiques aux profils enfants (ChildProfile), aux Circles Racines, à la messagerie fermée classe/cercle, au storage audio, et aux gaps RLS de Supabase.
>
> **Classification** · CRITICAL · HIGH · MEDIUM · LOW.

---

## 1. Menaces d'accès (autorisation)

| Menace | Impact | Probabilité | Protection actuelle P3 | Protection P4 requise | Test | Risque résiduel |
|---|---|---|---|---|---|---|
| Parent externe utilisant un `childId` d'un autre parent (IDOR direct) | Vue prénom + progression enfant tiers | Moyenne | ✅ `parentUserId` filtré serveur dans `/api/family/children/*`, `/api/me/active-child` | Étendre à toutes futures routes `/api/circles/*`, `/api/coach/*` avec `assertParentOwnership(childId, user.id)` | test E2E `p3-hardening-e2e.mjs §active-child · POST other parent kid (must 404)` déjà couvert | LOW |
| Coach accédant à un `Circle` non assigné (IDOR sur circleId) | Vue échanges + productions d'un foyer étranger | Haute | absente (route inexistante) | `assertCircleMembership(circleId, user.id, role=COACH)` avant toute lecture/écriture | test intégration à créer P4.4 | CRITICAL si oubli |
| Coach accédant à un `ChildProfile` hors cercle (recherche libre) | Vue prénom + langue + progression | Haute | absente | jamais exposer `/api/children/search`. Seul `getChildrenInCircle(circleId, coachUserId)` en scope. | test dédié coach hors cercle | CRITICAL |
| Enseignant Monde accédant à un `Circle` Racines | Vue données foyer + mineurs | Basse (surface actuelle) | ✅ pas de route commune | Confirmer `/api/circles/*` ne délègue pas à `/api/teacher/*` | test cross-role E2E | LOW |
| Centre accédant à un foyer | Vue household + children d'un centre | Basse | ✅ modèles disjoints | Confirmer `/api/center/*` ne joint jamais `Household` | test | LOW |
| Utilisateur retiré conservant un accès via cookie stale | Vue continue après retrait | Moyenne | ⚠ session Supabase persiste jusqu'à expiration | Chaque route vérifie `CircleMembership.status = ACTIVE` (pas juste existence) | test session révoquée | MEDIUM |
| Enumeration d'identifiants (cuid guessable) | Découverte massive de circles/childprofiles | Basse | ✅ cuid non séquentiel | Rate limit sur endpoints scoped `/api/circles/[id]` (P4.7) | test brute force | LOW |
| Fuite par URL (share link) | Circle URL partagée expose contenu | Moyenne | absente (pas d'URL circle actuelle) | Toute page `/racines/cercle/[id]` doit valider membership serveur avant SSR. Aucun query param d'auth. | test URL nue sans session | HIGH si oubli |
| Fuite par logs / erreurs | `error.message` retourne cuid ou payload utilisateur | Moyenne | ⚠ certaines routes retournent `error.message` brut (`/api/language/switch`) | Normaliser en `{ code, message }` sans PII. Ne jamais logger le body des messages | audit logs P4.7 | MEDIUM |

### Menace transverse IDOR

**Toutes** les routes `/api/circles/*`, `/api/circles/[id]/messages`, `/api/circles/[id]/members`, `/api/circles/[id]/assignments`, `/api/coach/*` doivent commencer par la même séquence :

```
1. user = supabase.auth.getUser() → 401 si null
2. dbUser = prisma.user.findUnique({ supabaseId }) → 404 si null
3. membership = prisma.circleMembership.findFirst({
     where: { circleId, userId: dbUser.id, status: ACTIVE }
   }) → 403 si null
4. Si role attendu (ex. OWNER pour DELETE), vérifier membership.role
5. Puis exécuter l'action
```

Toute déviation de ce séquencement = **CRITICAL blocker de mise en prod P4**.

---

## 2. Menaces de communication (messagerie mineurs)

| Menace | Impact | Probabilité | Protection actuelle P3 | Protection P4 requise | Test | Risque résiduel |
|---|---|---|---|---|---|---|
| Message privé adulte↔enfant | Contact hors cadre, protection mineurs bafouée | Haute si `ThreadType = ONE_TO_ONE` exposé | ⚠ enum autorise `ONE_TO_ONE` mais aucune route ne le crée | Ne jamais exposer `ONE_TO_ONE` côté produit. Supprimer de `ThreadType` en P4.6 par migration additive (déprécier, garder valeur) | test création thread avec type ONE_TO_ONE → 400 | HIGH tant que valeur d'enum est active |
| Coach contactant directement un enfant hors cercle | Contact non consenti, non tracé | Haute si feature coach mal cadré | absente | `CircleMessage` toujours attaché à `authorMembership` **et** `circleId`. Aucune API DM. Coach cannot start conversation. | test coach envoie message vers `otherCircleId` → 403 | LOW |
| Pièce jointe dangereuse (malware, phishing) | Compromission device | Moyenne | absente | MIME allowlist + antivirus scan (P5 · out of scope P4). Rejeter `.exe`, `.zip`, `.js`. | test upload MIME malicieux | HIGH sans antivirus |
| Contenu abusif (harcèlement, injures) | Traumatisme mineur, préjudice image | Moyenne | absente | `MessageReport` (P4.7) · workflow modération OWNER + admin | test signalement | MEDIUM |
| Audio inapproprié envoyé par un adulte à un enfant | Idem, plus grave (voix, intimité) | Moyenne | absente | Toute écoute d'audio par un CHILD nécessite validation OWNER (option produit). Rétention courte. | test flag audio | HIGH sans workflow |
| Suppression de preuve (parent efface preuve d'abus) | Impossible investiguer post-facto | Basse | absente | Soft-delete : contenu vidé mais enveloppe (`deletedAt`, `deletedByMembershipId`, `authorMembershipId`, taille payload initial) conservée. AuditEvent MESSAGE_DELETED. | test soft-delete conserve audit | LOW |
| Membre adulte non vérifié (identité fausse) | Fake identité dans cercle | Basse | absente | Invitation OWNER-only + email confirmation obligatoire + `HouseholdMembership.status` transitoire | test invite process | MEDIUM |
| Invitation transférée à un tiers | Circle infiltré | Basse | absente | Token invitation à usage unique + expiration 72h + lié à email destinataire | test token réutilisé → 410 | LOW |
| Spam / harcèlement (flood messages) | Circle inutilisable | Basse | absente | Rate limit 10 msg / min par membership (P4.7) | test flood | MEDIUM |

---

## 3. Menaces sur données personnelles

| Donnée | Menace | Impact | Protection actuelle | Protection P4 requise | Risque résiduel |
|---|---|---|---|---|---|
| Nom complet enfant | Exposition aux professionnels | Diffusion identité | ✅ `ChildProfile.prenom` seulement (jamais nom de famille) | Maintenir. Auditer `metadata` JSON pour ne pas y stocker nom. | LOW |
| Date de naissance enfant | Idem | Idem | ✅ Prisma stocke `age` int (`ChildProfile.age`) et `birthYear?` int (`DependentProfile`), pas de date complète | Ne jamais afficher `birthYear` aux professionnels. Considérer purge `DependentProfile.birthYear` si redondant. | LOW |
| Photographie enfant | Fuite biométrique | Grave | ✅ pas de champ photo | Ne jamais ajouter `photoUrl` sur `ChildProfile`. Avatar animal uniquement. | LOW tant que respecté |
| École | Vulnérabilité localisation | Moyenne | ✅ pas de champ école | Ne jamais ajouter. `ChildProfile.metadata` doit être limité (whitelist de clés). | LOW |
| Adresse | Idem | Grave | ✅ pas dans `ChildProfile` | Idem | LOW |
| Voix (audio production) | Empreinte biométrique, exploitable | Grave | absente | Bucket privé, URL signée TTL courte (10 min), rétention 90 jours post-retrait, jamais publique | HIGH sans policy |
| Historique de progression (fine grain) | Profilage enfant | Moyenne | partielle (`ChildProfile.langues[i].echelle, etoiles, motsAppris`) | Exposer aux professionnels uniquement le résumé (`echelle` + `etoiles`), pas la liste des mots ni les erreurs | MEDIUM |
| Transcription audio (STT) | Verbatim voix enfant en clair | Grave | absente (pas de STT en P3) | Interdire STT sauf accord parental explicite. Ne pas stocker transcription en base. | LOW tant que STT désactivé |
| Métadonnées fichier (EXIF, GPS) | Fuite localisation | Moyenne | absente (aucun upload photo) | Si un jour photos, stripper EXIF/GPS à l'upload | LOW |

---

## 4. Sécurité fichiers et audios

### Politique validée · posée dès P4.1 (Q7 validée · validation juridique requise avant activation `AUDIO_FEEDBACK_ENABLED = true` en production)

| Bucket | Public | Contenu | TTL upload | TTL lecture | Rétention | Antivirus |
|---|---|---|---|---|---|---|
| `class-audio` | privé | messages audio classe (LEARNER + TEACHER) | 5 min | 10 min | 12 mois post-`Class.archivedAt` | P5 |
| `class-attachment` | privé | pièces jointes classe (PDF, image) | 5 min | 10 min | 12 mois | P5 |
| `circle-audio` | privé | messages audio cercle (CHILD, ADULT, OWNER, COACH) | 5 min | 10 min | **90 jours** post-retrait membership OU `archivedAt` | P5 |
| `circle-attachment` | privé | pièces jointes cercle | 5 min | 10 min | 90 jours post-retrait | P5 |
| `submission-audio` | privé | audio devoirs (LEARNER Monde ou CHILD Circle) | 5 min | 10 min | **12 mois** post-`submittedAt` | P5 |
| `feedback-audio` | privé | feedback vocal (TEACHER / COACH · immutable Q13) | 5 min | 10 min | **12 mois** post-création | P5 |
| `course-videos` (existant) | public | vidéos de cours pédagogiques | – | – | – | non nécessaire (validé produit) |

### MIME / taille

- Audio · `audio/webm, audio/ogg, audio/mpeg, audio/mp4` uniquement.
- Attachment · `image/jpeg, image/png, application/pdf` uniquement.
- Rejet server-side si MIME sniff ne correspond pas à `content-type` header (détection MIME falsifié).
- Taille max audio · 5 MB (couvre 3 min à 224 kb/s).
- Taille max attachment · 10 MB.

### Nommage objet

- Pattern · `{bucket}/{yyyy-mm}/{sha256Prefix}-{filename-sanitized}`.
- Jamais de userId ou prénom dans le chemin.
- Fichier renommé côté serveur ; le `filename` client n'est jamais utilisé tel quel.

### URLs

- **Upload** · `createSignedUploadUrl(bucket, key, { expiresIn: 300 })` (5 min).
- **Read** · `createSignedUrl(bucket, key, { expiresIn: 600 })` (10 min).
- **Never** `getPublicUrl` pour les productions enfants.

### Modèle `StorageObject` proposé (P4-M5)

```
StorageObject {
  id                cuid PK
  bucket            String
  key               String
  mimeType          String
  sizeBytes         Int
  sha256            String?
  uploadedByUserId  → User (onDelete: SetNull)
  uploadedByMembershipId? String   -- rattachement Circle/Class si applicable
  purpose           StorageObjectPurpose  -- MESSAGE_AUDIO | MESSAGE_ATTACHMENT | SUBMISSION_AUDIO | FEEDBACK_AUDIO | ...
  createdAt         DateTime @default(now())
  retentionUntil?   DateTime            -- date de purge automatique
  deletedAt?        DateTime

  @@unique([bucket, key])
  @@index([purpose, retentionUntil])
  @@index([uploadedByUserId, createdAt])
}
```

Toute écriture d'audio / attachment passe par ce modèle · aucun `audioUrl` string direct dans les entités métier après P4.5.

---

## 5. RLS et sécurité Supabase (état actuel)

### Constat

- **1 seule table** avec RLS activée · `child_profiles` (policy `child_profiles_service_only` limitant l'accès au `service_role`).
- **50+ tables** sans RLS · `users`, `orders`, `payments`, `access_grants`, `households`, `dependent_profiles`, `class_memberships`, `submissions`, `class_feedback`, `threads`, `messages`, tous les `product*`, `classrooms`, tous les enrollments legacy, etc.
- **Service role** utilisé par 6 fichiers seulement, tous côté serveur, aucun import client.
- **Storage** · un seul bucket `course-videos`, public, pas de policy `storage.objects` custom.

### Risque global

- **Structurellement acceptable** tant que le seul point d'accès public est l'API Next.js (qui applique les gardes applicatives). Aucun client anon ne fait de requête directe à la DB.
- **Devient CRITICAL** si un jour :
  - Un client Supabase browser est utilisé pour lire les tables directement.
  - Un contournement de proxy expose une route SQL.
  - Un attacker s'authentifie et utilise la clé anon avec `postgrest` directement.

### Plan RLS · activée **par migration** (M1-M5), consolidation revue en P4.RLS

**Correctif post-revue** · la RLS n'est plus reportée à une migration terminale. Chaque migration M1-M5 pose et teste ses policies au moment de créer les tables associées. Le sous-lot `P4.RLS` en fin de séquence n'est plus une première implémentation · c'est une revue exhaustive.

| Table | RLS | Lecture | Écriture | Service admin | Risque si RLS OFF |
|---|---|---|---|---|---|
| `users` | ON | self only (`id = auth.uid()`) | self only | admin | MEDIUM |
| `child_profiles` | ON déjà | service_role only (P4 · relaxer à parent) | service_role | admin | LOW |
| `households` | ON | membre du household | owner | admin | HIGH |
| `household_memberships` | ON | membre du household | owner | admin | HIGH |
| `access_grants` | ON | beneficiary (via join) | admin | admin | HIGH |
| `learning_paths` | ON | owner user | owner | admin | MEDIUM |
| `orders`, `payments` | ON | owner user | admin | admin | CRITICAL |
| `classes` | ON | ClassMembership.ACTIVE | provider ou admin | admin | HIGH |
| `class_memberships` | ON | même class | teacher/provider/admin | admin | HIGH |
| `class_assignments` | ON | membre de la class | teacher/provider | admin | MEDIUM |
| `submissions` | ON | auteur ou teacher/provider de la class | auteur | admin | HIGH |
| `class_feedback` | ON | auteur, l'élève cible, teacher/provider | auteur | admin | HIGH |
| `threads` | ON | membre class | teacher/provider | admin | MEDIUM |
| `messages` | ON | membre thread's class | auteur | admin | HIGH |
| `notifications` | ON | destinataire (`userId = auth.uid()`) | admin | admin | LOW |
| `circles` (nouveau) | ON | CircleMembership.ACTIVE | owner ou admin | admin | HIGH |
| `circle_memberships` | ON | même cercle | owner | admin | HIGH |
| `circle_messages` | ON | membre cercle | auteur | admin | HIGH |
| `audit_events` | ON | admin only | service_role | service_role | LOW |
| `storage_objects` | ON | uploader ou membre du contexte | service_role | service_role | HIGH |
| `language_centers` | soft | tous (public read pour discover) | admin | admin | LOW |
| `teachers` | soft | public read (annuaire) sauf email | self ou center admin | admin | LOW |

### Storage policies

- Toutes les buckets privées (§4) doivent porter une policy `storage.objects` reflétant l'ownership :
  - `SELECT` autorisé si `auth.uid()` est membre du context (via lookup `storage_objects` + jointure) — implémentation via fonction `is_member(bucket, key, auth.uid())`.
  - `INSERT` autorisé si `auth.uid()` fournit un token upload signé (déjà géré par Supabase).
  - `DELETE` restreint au service_role (audit trail obligatoire).

**Règle d'activation** · pour chaque table de la matrice ci-dessus, l'activation `ENABLE ROW LEVEL SECURITY` est effectuée dans la **même migration** que la création des policies correspondantes. Chaque PR de migration inclut son test de smoke (`scripts/test-baseline/p4-rls-smoke.mjs`) qui vérifie ALLOW/DENY par rôle simulé. **Aucune fonctionnalité P4 n'est activée en production avant la présence effective des policies pour les tables qu'elle consomme.**

Le sous-lot terminal `P4.RLS` (renommé « Consolidation finale · revue des policies ») vérifie l'exhaustivité de la matrice, corrige les manques éventuels via `ALTER POLICY`, et exécute `scripts/test-baseline/p4-rls-consolidation.mjs` pour un audit CRUD × rôle × table complet.

---

## 6. Menaces spécifiques mineurs (résumé priorisé)

| # | Menace | Classification |
|---|---|---|
| 1 | Coach contactant enfant hors cercle | **CRITICAL** |
| 2 | Circle URL leak sans membership check SSR | **CRITICAL** |
| 3 | Audio enfant en URL publique permanente | **CRITICAL** |
| 4 | RLS off sur `orders`, `payments`, `access_grants` | **CRITICAL** (financial + PII) |
| 5 | Coach accède `ChildProfile` global (recherche libre) | **CRITICAL** |
| 6 | ThreadType `ONE_TO_ONE` exposé par erreur | **HIGH** |
| 7 | Session stale conserve accès après retrait membership | **HIGH** |
| 8 | Pièce jointe MIME falsifié | **HIGH** (sans antivirus) |
| 9 | Suppression message sans audit | **MEDIUM** |
| 10 | Enum `ClassMemberRole` inclut `COACH` (potentiellement lu comme coach Racines) | **MEDIUM** (nommage à clarifier) |
| 11 | `DependentProfile` + `ChildProfile` parallèles (redondance = incohérence) | **MEDIUM** |
| 12 | Notifications non câblées mais modèle en base | **LOW** |
| 13 | `AUDIT.md` non tracké (héritage audit précédent) | **LOW** (hors périmètre P4) |

---

## 7. Audit trail obligatoire (§24 mission P4)

Le modèle `AuditEvent` est posé en **P4.1** (M1). Les câblages progressifs suivent chaque migration :

- Invitation household adulte (`HOUSEHOLD_MEMBERSHIP_INVITED` · P4.2)
- Acceptation invitation household (`HOUSEHOLD_MEMBERSHIP_ACCEPTED` · P4.2)
- Retrait household (`HOUSEHOLD_MEMBERSHIP_REVOKED` avec `metadata.revokedByRole = OWNER | SELF` · P4.2)
- Invitation adulte Circle (`CIRCLE_MEMBERSHIP_INVITED` · P4.2)
- Acceptation Circle (`CIRCLE_MEMBERSHIP_ACCEPTED` · P4.2)
- Retrait membership Circle (`CIRCLE_MEMBERSHIP_REVOKED` · P4.2)
- Assignation coach (`CIRCLE_COACH_ASSIGNED` / `_UNASSIGNED` · P4.4)
- Assignation teacher (`CLASS_TEACHER_ASSIGNED` / `_UNASSIGNED` · P4.3b)
- Modification profil enfant (`CHILD_PROFILE_UPDATED` · P4.2 · OWNER seulement, Q1)
- Création `ClassAssignment` / `CircleAssignment` (`ASSIGNMENT_CREATED` · P4.5)
- Publication (`ASSIGNMENT_PUBLISHED` · P4.5)
- Écriture `ClassFeedback` / `CircleFeedback` (`FEEDBACK_CREATED` · P4.5) · toute addition/addendum génère aussi un événement
- Suppression message (`MESSAGE_DELETED` avec `metadata.reason` obligatoire pour ADMIN · P4.6, Q11)
- Masquage message par OWNER (`MESSAGE_HIDDEN` · P4.6, Q11)
- Signalement message (`MESSAGE_REPORTED` · P4.6, Q11)
- Suppression attachment (`ATTACHMENT_DELETED` · P4.5)
- Changement langue Circle (`CIRCLE_LANGUAGE_CHANGED`) — **interdit en P4** (Q8), événement conservé dans l'enum pour audit historique éventuel uniquement
- Impersonation admin (`ADMIN_IMPERSONATION_STARTED` / `_ENDED`)

Ne **jamais** journaliser :

- Corps de message (`body`).
- URL audio ou payload binaire.
- Adresse email, téléphone.
- Contenu `metadata` sensible (mots appris, transcription).

Le champ `metadata` de `AuditEvent` peut porter uniquement des identifiants (`previousCoachUserId`, `nextCoachUserId`, `revokedByUserId`) et des transitions d'état (`before: 'INVITED', after: 'ACTIVE'`).

---

## 8. Politique de rétention

| Donnée | Rétention | Purge automatique |
|---|---|---|
| `CircleMessage` texte | Vie du Circle (jusqu'à `archivedAt` + 12 mois) | oui, worker P5 |
| `CircleMessage` audio | 90 jours après retrait membership auteur OU `archivedAt` + 12 mois (le plus court) | oui |
| `Submission` audio (Monde) | 12 mois post-`Submission.submittedAt` | oui |
| `ClassFeedback` audio | 12 mois post-création | oui |
| `AuditEvent` | 24 mois glissants | oui, non-conservation légale |
| `AccessGrant` révoqué | conservé (business continuity) | non |
| `Order`, `Payment` | conservation légale (10 ans) | non |
| `ChildProfile` inactif | conservation tant que `parentUserId` actif ; purge à la suppression compte parent | Cascade Prisma existante |

---

## 9. Blockers sécurité de lancement P4 (bloc `IMPLEMENTATION_PLAN.md §7`)

Aucun sous-lot P4 ne peut être activé en production tant que ses blockers ne sont pas fermés. Chaque check est vérifié **par sous-lot** avant activation du flag correspondant.

- [ ] 0 IDOR sur toutes les routes du sous-lot
- [ ] 0 cross-center leak (test dédié P4.3a)
- [ ] 0 cross-circle leak (test dédié P4.2+)
- [ ] 0 cross-household leak (test dédié P4.2+)
- [ ] 0 DM privé adulte-enfant possible (P4.6 · `ThreadType.ONE_TO_ONE` bloqué côté API sans suppression destructive)
- [ ] Policies RLS posées et testées **au moment de la migration** (M1-M5 · pas reportées à P4.RLS)
- [ ] Storage buckets privés créés avec policies (posés P4.1)
- [ ] URLs signées TTL courts systématiques (§4 · 5 min upload · 10 min lecture)
- [ ] MIME allowlist + validation server-side sur tout upload (posé P4.1 avant toute route acceptant fichier)
- [ ] Rate limiting actif sur `/api/circles/[id]/messages` (P4.7)
- [ ] `AuditEvent` capture toutes les actions sensibles (§7 · socle P4.1, câblages progressifs)
- [ ] Feature flags à `false` par défaut jusqu'à validation du sous-lot
- [ ] Tests ownership complets par sous-lot (100 % pass rate)
- [ ] Décisions produit Q1-Q15 intégrées et testées (toutes validées 2026-07-23)
- [ ] Validation juridique Q7 (rétention audios) obtenue avant `AUDIO_FEEDBACK_ENABLED = true`

Un blocker ouvert = mise en production interdite. Aucun contournement de feature flag n'est autorisé sans validation de tous les items ci-dessus pour le sous-lot concerné.

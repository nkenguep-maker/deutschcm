# YEMA · Plan d'implémentation P4 · migrations, feature flags, sous-lots, tests, blockers

> Compagnon de `YEMA_P4_ARCHITECTURE_AUDIT.md`, `YEMA_P4_PERMISSION_MATRIX.md`, `YEMA_P4_THREAT_MODEL.md`. Aucune ligne de code, aucune migration, aucun schéma modifié par cet audit.
>
> **Portée** · plan ordonnancé des sous-lots P4.1 → P4.7, migrations additives, feature flags, décisions produit ouvertes, plan de tests, blockers de lancement.

---

## 1. Plan de migration additive

Toutes les migrations P4 sont **additives**. Aucune colonne existante n'est renommée ou supprimée pendant P4. Les colonnes obsolètes seront marquées deprecated dans commentaires puis retirées à P5+ selon un plan de dépréciation dédié.

### P4-M1 · Circle + memberships

**Objectif** · poser la structure additive `Circle` + `CircleMembership` + enums, sans exposer côté produit.

Tables · `circles`, `circle_memberships`.

Enums · `CircleStatus`, `CircleRole`, `CircleMembershipStatus`.

Colonnes ajoutées à modèles existants ·

- `households.name TEXT?` (nom d'affichage optionnel)
- `child_profiles.household_id TEXT?` FK vers `households(id)` avec `ON DELETE SET NULL` (rattache enfants au foyer explicitement)

Indexes ·

- `circles`: `@@unique([householdId, language])`, `@@index([coachUserId, status])`
- `circle_memberships`: `@@unique([circleId, userId, childProfileId])`, `@@index([circleId, role, status])`, `@@index([userId, status])`, `@@index([childProfileId, status])`
- Ajout `@@index([centerId])` sur `users` (pour combler la dette identifiée à §Prisma)

Contraintes CHECK ·

- `circle_memberships`: `CHECK ((user_id IS NULL) <> (child_profile_id IS NULL))` — XOR obligatoire.
- Unique conditionnel · `CREATE UNIQUE INDEX circle_one_active_coach ON circle_memberships (circle_id) WHERE role = 'COACH' AND status = 'ACTIVE'` (1 coach actif max).

Backfill · aucun (tables nouvelles).

Compatibilité ascendante · aucun endpoint public expose ces tables tant que `CIRCLE_ENABLED = false`.

Rollback · `DROP TABLE circle_memberships; DROP TABLE circles; DROP TYPE ...;` sûr tant qu'aucune donnée n'est écrite.

Tests · unit test création Circle + memberships avec contraintes.

Risque · faible (additif).

### P4-M2 · Adult + coach capacity guards

**Objectif** · rendre les contraintes de capacité applicables à l'API (2 adultes / 1 coach / 1 cercle par langue).

Aucune table nouvelle. Ajout d'index conditionnels et de codes d'erreur stables applicatifs.

Colonnes ajoutées ·

- `household_memberships.status` élargi : ajouter valeur `INVITED` à l'enum `HouseholdStatus` **OU** créer enum dédié `HouseholdMembershipStatus` (à trancher · voir décision Q2).
- `household_memberships.invited_by_user_id TEXT?` FK vers `users(id)`.
- `household_memberships.invited_at TIMESTAMP?`.

Indexes · `household_memberships` `@@index([householdId, role, status])`.

Backfill · aucun (les enregistrements existants restent `ACTIVE`).

Rollback · sûr.

Tests · concurrence · deux `POST /api/family/adults` simultanés → un seul aboutit.

### P4-M3 · Feedback audio + assignment status

**Objectif** · combler MSG-04 (`ClassFeedback.audioUrl` manquant) + statut de submission.

Tables · aucune nouvelle.

Colonnes ajoutées ·

- `class_feedback.audio_url TEXT?`
- `submissions.status TEXT` avec enum `SubmissionStatus = ASSIGNED | SUBMITTED | IN_REVIEW | FEEDBACK_READY | REVISION_REQUESTED | COMPLETED`. Default `SUBMITTED` pour rangs existants (via `UPDATE` idempotent en même migration).
- `class_assignments.type TEXT?` avec enum `ClassAssignmentType = HOMEWORK | ANNOUNCEMENT | ORAL_INVITATION` — optionnel, si non nécessaire à P4.5, reporter P4.6.

Indexes · `submissions` `@@index([assignmentId, status])`.

Backfill · `UPDATE submissions SET status = 'SUBMITTED' WHERE status IS NULL` (transaction courte).

Rollback · sûr (colonne nullable).

Tests · lifecycle Submission complet.

### P4-M4 · Circle assignments / submissions / feedback + closed messaging

**Objectif** · poser la structure pour parcours devoirs Racines + messagerie fermée Circle.

Tables · `circle_assignments`, `circle_submissions`, `circle_feedback`, `circle_messages`, `circle_message_read_state`.

Enums · `CircleMessageType`, `SubmissionStatus` (réutilisé si M3 déjà appliqué).

Colonnes ·

- `circle_assignments (id, circleId, createdByMembershipId, title, description?, dueAt?, type, createdAt, publishedAt?)`
- `circle_submissions (id, assignmentId, submitterMembershipId, body?, audioObjectId?, submittedAt, status)` unique `[assignmentId, submitterMembershipId]`
- `circle_feedback (id, submissionId, authorMembershipId, score?, body?, audioObjectId?, createdAt)`
- `circle_messages` (§Architecture §5)
- `circle_message_read_state (circleMessageId, membershipId, readAt)` unique `[circleMessageId, membershipId]`

Indexes · voir §Architecture §5.

Backfill · aucun.

Rollback · sûr.

Tests · ownership sur toutes les entités · un OWNER voit tout, un CHILD ne voit que ses submissions.

### P4-M5 · Audit + Storage metadata + Notifications réelles

**Objectif** · traçabilité + policy storage + notifications réelles.

Tables · `audit_events`, `storage_objects`.

Enums · `AuditAction`, `StorageObjectPurpose`.

Colonnes ajoutées à modèles existants ·

- `messages.storage_object_id TEXT?` FK vers `storage_objects(id)` (remplacer progressivement `audioUrl` string). Colonne `audioUrl` conservée en P4 pour compatibilité ascendante, déprécation en P5.
- `submissions.storage_object_id TEXT?` idem.
- `class_feedback.storage_object_id TEXT?` idem.
- `class_feedback.audio_url TEXT?` reste (M3), sera aliassé.

Indexes · `audit_events` `@@index([targetType, targetId, createdAt])`, `@@index([actorUserId, createdAt])`.

Backfill · aucun (les entités existantes gardent leur `audioUrl` string).

Rollback · sûr.

Tests · audit trail complet + purge worker.

### P4-M6 · RLS policies (activation)

**Objectif** · activer les policies RLS pour les 10+ tables critiques (`YEMA_P4_THREAT_MODEL.md §5`).

Aucune table nouvelle. Fonctions Postgres helper `is_class_member(class_id, user_id)`, `is_circle_member(circle_id, user_id)`, `is_center_admin(center_id, user_id)`.

`ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` pour chaque table listée §5 threat model.

Backfill · aucun.

Rollback · `DROP POLICY` puis `DISABLE ROW LEVEL SECURITY`. Attention · désactiver RLS après activation peut créer une fenêtre d'exposition. Prévoir maintenance window.

Tests · exhaustif · pour chaque policy, tester lecture allowed + lecture denied + écriture allowed + écriture denied avec des connexions Supabase anon et service_role.

**Cette migration ne s'active qu'après validation exhaustive des sous-lots P4.1 à P4.6.** Toute anomalie détectée après activation impose une bascule feature flag `CIRCLE_ENABLED = false` + désactivation temporaire de la policy correspondante.

---

## 2. Feature flags

Tous à `false` par défaut. Toute activation nécessite validation des blockers §Blockers.

| Flag | Environnement | Comportement disabled | Ordre d'activation |
|---|---|---|---|
| `CIRCLE_ENABLED` | env (Vercel + local) | UI cercle Racines → `<StateBlock title="Bientôt disponible">` | 1 (après P4.1) |
| `CENTER_REAL_DATA_ENABLED` | env | pages `/center/*` continuent d'afficher mocks (dev) ou StateBlock (prod) | 2 (après P4.3a) |
| `TEACHER_WORKSPACE_ENABLED` | env | `/teacher/*` renvoie state neutre (existant) | 3 (après P4.3b) |
| `COACH_WORKSPACE_ENABLED` | env | `/coach/*` route absente (404 → landing) | 4 (après P4.4) |
| `ASSIGNMENTS_ENABLED` | env | boutons devoirs cachés | 5 (après P4.5) |
| `AUDIO_FEEDBACK_ENABLED` | env | feedback texte only | 5 (après P4.5) |
| `CLOSED_MESSAGING_ENABLED` | env | fil classe/cercle → StateBlock | 6 (après P4.6) |
| `NOTIFICATIONS_ENABLED` | env | `NotificationBell` reste muet | 7 (après P4.7) |
| `RACINES_COACH_OPERATIONAL` | déjà défini (`src/lib/pricing.ts`) | reste `false` jusqu'à P5 (paiement) | après validation P4 complète |

Convention de résolution ·

- `src/lib/flags.ts` (à créer P4.1) · fonction `getFlag(name): boolean` lit `process.env.YEMA_${name}` avec default `false`.
- Aucune valeur `true` ne doit être commit'ée en dev sans validation P4.
- En production, tous les flags P4 restent `false` jusqu'à la validation finale de sous-lot.

---

## 3. Décomposition P4 recommandée

### P4.1 · Data model + security foundations

**Objectif** · poser `Circle`, `CircleMembership`, contraintes, `flags.ts`, seeds de développement.

- Migrations · M1.
- Fichiers probables · `prisma/schema.prisma` (+ Circle, CircleMembership, enums), `prisma/migrations/2026xxxx_p4_m1_circle/`, `src/lib/flags.ts`, `scripts/test-baseline/p4-seed-circle.mjs`.
- Dépendances · aucune.
- Tests · unit (contraintes), fixture seed.
- Critères de merge · TS + tests + build verts, aucune UI exposée.
- Risques · aucun impact utilisateur (feature flag off).

### P4.2 · Memberships + invitations + adult/child ownership

**Objectif** · endpoints d'invitation adulte, ajout / retrait enfant dans un Circle, ownership de l'OWNER.

- Migrations · M2.
- Fichiers probables · `src/app/api/family/adults/route.ts` (nouveau), `src/app/api/circles/[circleId]/route.ts` (nouveau, GET), `src/app/api/circles/[circleId]/members/route.ts` (nouveau, GET/POST/DELETE), `src/lib/data/circles.ts` (nouveau seam), `src/lib/permissions/circle.ts` (nouveau · assertCircleMembership, assertCircleOwner).
- Dépendances · P4.1.
- Tests · unit (permissions), intégration (invitation + acceptation), concurrence (3ᵉ adulte simultané → 1 seul aboutit).
- Critères de merge · zéro cross-household leak vérifié par test.
- Risques · faible (endpoints en flag off).

### P4.3a · Center real data · suppression des mocks

**Objectif** · connecter `/center/*` à Prisma réel, supprimer les mocks listés en `YEMA_P4_ARCHITECTURE_AUDIT.md §4`.

- Migrations · aucune.
- Fichiers probables · `src/lib/data/center.ts` (nouveau · getCenterForUser, getCenterStudents, getCenterTeachers, getCenterClasses, getCenterPendingEnrollments), `src/app/[locale]/center/students/page.tsx` (remove mocks, câbler getter), `src/app/[locale]/center/teachers/page.tsx` (idem), `src/app/[locale]/center/classes/page.tsx` (idem), `src/app/api/center/route.ts` (élargir aux nouveaux getters), tests p4-center.
- Dépendances · aucune.
- Tests · cross-center · Center A appelle `/api/center/students` avec `centerId=B` → 403. Test empty state (aucun étudiant / enseignant).
- Critères de merge · aucun `MOCK_*` restant dans `/center/*`, aucun `STUDENTS = [` hardcodé.
- Risques · UI peut changer (empty states) → confirmer avec design avant merge.

### P4.3b · Teacher workspace

**Objectif** · connecter `/teacher/students/*`, `/teacher/classroom/*`, `/teacher/assignments/*` à Prisma. Supprimer les mocks listés.

- Migrations · aucune (utilise Class / Classroom existants).
- Fichiers probables · `src/lib/data/teacher.ts` (getTeacherClasses, getTeacherStudent, getTeacherAssignments), `src/app/[locale]/teacher/students/page.tsx` (remove mocks), `src/app/[locale]/teacher/students/[studentId]/page.tsx` (remove `MOCK_STUDENT`), `src/app/[locale]/teacher/courses/page.tsx` (remove `CLASSES`), `src/app/api/teacher/*` (élargir).
- Dépendances · P4.3a (pattern data layer établi).
- Tests · un teacher ne voit jamais un étudiant hors ses classes ; un teacher d'un autre centre est bloqué.
- Critères de merge · aucun `MOCK_STUDENT`, `LEARNERS`, etc. restant.
- Risques · impact UI (empty states).

### P4.4 · Coach Racines workspace

**Objectif** · endpoints `/api/coach/circles`, `/api/coach/circles/[id]/messages`, page `/coach` avec liste des cercles assignés + productions + feedback.

- Migrations · aucune (M1 déjà passée).
- Fichiers probables · `src/app/[locale]/coach/{page,circles/[circleId],circles/[circleId]/productions}/page.tsx` (nouveaux), `src/app/api/coach/{circles,circles/[id],circles/[id]/productions,circles/[id]/feedback}/route.ts`, `src/lib/data/coach.ts`, `src/lib/permissions/coach.ts`, `src/components/coach/*`.
- Dépendances · P4.1, P4.2, P4.5 (feedback partiellement dispo).
- Tests · coach ne voit que ses cercles ; coach ne peut envoyer message que dans ses cercles ; quotas 8/mois enforced ; RACINES_COACH_OPERATIONAL reste `false` en prod.
- Critères de merge · matrice permissions coach §7 permission-matrix passe à 100 %.
- Risques · matrice coach nouvelle · risque IDOR.

### P4.5 · Assignments + submissions + feedback

**Objectif** · lifecycle complet devoir → soumission → feedback, texte + audio, Monde + Racines.

- Migrations · M3 (add audioUrl + status), M4 (CircleAssignment + CircleSubmission + CircleFeedback).
- Fichiers probables · `src/app/api/assignments/*`, `src/app/api/submissions/*`, `src/app/api/feedback/*`, `src/lib/data/assignments.ts`, `src/lib/feedback/*`, `src/components/assignments/*`.
- Dépendances · P4.4.
- Tests · lifecycle complet · TEACHER crée, LEARNER soumet, TEACHER feedback texte + audio · idem Circle.
- Critères de merge · statut Submission cohérent (M3 backfill correct), audio URL signée TTL correcte.
- Risques · gestion audio · rétention 90 jours à mettre en place (worker P5, mais storage_objects existe P4).

### P4.6 · Closed messaging

**Objectif** · messagerie fermée · Class Thread + Circle Message + read state + suppression + modération.

- Migrations · M4 (partiellement en P4.5), extension read state.
- Fichiers probables · `src/app/api/classrooms/[id]/messages/*`, `src/app/api/circles/[id]/messages/*`, `src/components/messages/*`, `src/lib/messages/permissions.ts`, `src/lib/messages/moderation.ts`.
- Dépendances · P4.4.
- Tests · impossibilité DM privé (test négatif ThreadType ONE_TO_ONE), read state cohérent, soft-delete audit trail.
- Critères de merge · rate limit basique actif (10 msg/min/membership).
- Risques · surface d'attaque messagerie → tester exhaustivement les IDOR.

### P4.7 · Notifications + audit + rate limits + observabilité + a11y + E2E

**Objectif** · consolidation · notifications réelles, audit trail, rate limiting, observabilité, accessibilité, E2E complet.

- Migrations · M5 (AuditEvent + StorageObject).
- Fichiers probables · `src/lib/notifications/*`, `src/lib/audit/*`, `src/lib/rateLimit/*`, `src/app/api/notifications/*`, extensions à toutes les routes existantes pour ajouter audit + rate limit.
- Dépendances · P4.6.
- Tests · E2E · Teacher, Coach, Center, Parent, Enfant, Monde, Racines, FR/EN, mobile, clavier, zoom 200 %, pièces jointes, erreurs réseau.
- Critères de merge · 0 blocker sécurité, RLS activation planifiée (M6 après validation complète).
- Risques · rate limits mal calibrés → fausse détection abus.

### M6 · RLS activation (post-P4.7)

Séparé pour permettre validation exhaustive avant activation. Peut être appliqué en maintenance window courte, sans utilisateurs actifs.

---

## 4. Ordre recommandé (confirmation)

```
P4.1 (data model + flags)
 → P4.2 (memberships + invitations)
 → P4.3a (center real data + suppression mocks)
 → P4.3b (teacher workspace)
 → P4.4 (coach workspace)
 → P4.5 (assignments + submissions + feedback)
 → P4.6 (closed messaging)
 → P4.7 (notifications + audit + rate limits + E2E)
 → M6 (RLS activation)
```

Cet ordre est **contraignant** :

- P4.1 pose Circle avant tout endpoint qui le consomme.
- P4.2 pose ownership avant P4.6 (messagerie).
- P4.3a pose le pattern data layer avant P4.3b (teacher).
- P4.4 nécessite P4.2 (ownership OWNER + COACH).
- P4.6 (messagerie) nécessite storage, ownership, threat model — ne peut pas démarrer avant P4.5.
- M6 nécessite tous les sous-lots validés (activer RLS sans policies testées = casse la prod).

---

## 5. Décisions produit ouvertes

Chaque question nécessite validation humaine avant démarrage du sous-lot indiqué.

### Q1 · Un deuxième adulte peut-il modifier et supprimer les profils enfants ?

- **Recommandation** · NON par défaut. L'OWNER (parent principal) reste la seule autorité. Le deuxième ADULT lit uniquement.
- **Alternative** · OUI avec confirmation OWNER via un workflow d'approbation.
- **Risque** · si OUI, deux adultes peuvent supprimer une progression enfant · doit être audité (`CHILD_PROFILE_DELETED`).
- **Impact modèle** · aucun (permissions applicatives).
- **Impact produit** · workflow d'invitation adulte + explication onboarding.
- **Nécessaire avant** · P4.2.

### Q2 · Qui peut inviter le deuxième adulte ?

- **Recommandation** · OWNER uniquement.
- **Alternative** · OWNER + admin plateforme.
- **Risque** · si trop restrictif, isolation OWNER en cas de désaccord conjugal.
- **Impact modèle** · `HouseholdMembership.invited_by_user_id`.
- **Nécessaire avant** · P4.2.

### Q3 · Qui peut retirer le deuxième adulte ?

- **Recommandation** · OWNER seulement (le deuxième ADULT peut aussi se retirer lui-même).
- **Alternative** · l'un et l'autre symétriquement (dangerous · risque abandon).
- **Risque** · retrait unilatéral = privation d'accès enfant.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.2.

### Q4 · Le coach voit-il le prénom réel de l'enfant ou un nom d'affichage ?

- **Recommandation** · prénom réel (`ChildProfile.prenom`), pas de nom de famille.
- **Alternative** · pseudonyme (`avatarAnimal` + `initial`).
- **Risque** · pseudo peut brouiller la relation pédagogique.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.4.

### Q5 · Le parent peut-il lire tous les messages coach↔enfant ?

- **Recommandation** · OUI, obligatoirement. C'est la règle non-négociable de protection mineurs.
- **Alternative** · aucune.
- **Risque** · si NON, viole doctrine §31.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.4.

### Q6 · Un enfant peut-il envoyer librement des notes vocales dans le cercle ?

- **Recommandation** · OUI avec quota (durée max 3 min · même règle que coach).
- **Alternative** · NON, seul l'adulte peut envoyer audio pour l'enfant.
- **Risque** · si OUI sans quota, spam / stockage.
- **Impact modèle** · aucun (limite applicative).
- **Nécessaire avant** · P4.6.

### Q7 · Quelle durée de conservation pour les audios ?

- **Recommandation** · 90 jours post-retrait membership pour Circle · 12 mois pour Class Monde.
- **Alternative** · 30 jours · 6 mois.
- **Risque** · trop court = perte contexte pédagogique · trop long = risque données.
- **Impact modèle** · `StorageObject.retention_until`.
- **Nécessaire avant** · P4.5 (bucket policies).

### Q8 · Un Circle peut-il changer de langue ?

- **Recommandation** · NON. Créer un nouveau Circle par langue (favorise cohérence pédagogique).
- **Alternative** · OUI avec audit + confirmation OWNER.
- **Risque** · si OUI, progression pédagogique orpheline.
- **Impact modèle** · si NON, `Circle.language` immutable après création (contrainte applicative).
- **Nécessaire avant** · P4.1.

### Q9 · Faut-il créer un nouveau Circle lors d'un changement de langue ?

- **Recommandation** · OUI (corollaire Q8). Circle actuel `ARCHIVED`, nouveau créé.
- **Alternative** · migration in-place (déconseillé).
- **Impact modèle** · aucun changement supplémentaire.
- **Nécessaire avant** · P4.1.

### Q10 · Que devient l'historique lorsqu'un coach est remplacé ?

- **Recommandation** · conservé côté Circle (les messages coach précédent restent lisibles, marqués `authorMembership.role = COACH`, `authorMembership.status = REVOKED`).
- **Alternative** · masquage / anonymisation.
- **Risque** · anonymiser trop peut casser le contexte.
- **Impact modèle** · aucun (soft-delete membership).
- **Nécessaire avant** · P4.4.

### Q11 · Qui peut supprimer un message ?

- **Recommandation** · auteur (dans 15 min) · OWNER (à tout moment sur son Circle) · TEACHER (à tout moment sur sa Class) · ADMIN.
- **Alternative** · uniquement auteur (peu sécurisant).
- **Risque** · abus admin.
- **Impact modèle** · `AuditEvent.MESSAGE_DELETED` obligatoire.
- **Nécessaire avant** · P4.6.

### Q12 · Les centres peuvent-ils voir les messages de classe ?

- **Recommandation** · NON par défaut (privé prof↔élève). OUI si CENTER_ADMIN est aussi TEACHER de la classe.
- **Alternative** · lecture systématique par CENTER_ADMIN pour surveillance.
- **Risque** · si OUI par défaut, brise confidentialité pédagogique.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.3a.

### Q13 · Une correction peut-elle être modifiée après publication ?

- **Recommandation** · NON. Immutable. Créer un `ClassFeedback` supplémentaire lié à la même `Submission` si besoin de correction.
- **Alternative** · éditable dans les 60 min.
- **Risque** · si éditable, historique perdu · si immutable, corrections superposées lisibles.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.5.

### Q14 · Le parent peut-il répondre au feedback du coach ?

- **Recommandation** · OUI dans le fil du Circle (pas dans le feedback lui-même). Le feedback reste attaché au CircleSubmission ; la discussion se fait dans le `CircleMessage` classique.
- **Alternative** · sous-fil dédié.
- **Risque** · fragmentation UX.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.5.

### Q15 · Quelle capacité maximale de Circles par coach ?

- **Recommandation** · à cadrer P5 (contractuel avec le coach). Prévoir un compteur soft en P4.4 pour observer (`countActiveCirclesByCoach(coachUserId)`).
- **Alternative** · plafond hard 20.
- **Risque** · saturation coach = délais 48 h dépassés.
- **Impact modèle** · aucun.
- **Nécessaire avant** · P4.4 pour compteur · P5 pour plafond.

---

## 6. Plan de tests

### Unitaires

- Résolution permissions · `canAccessCircle(userId, circleId, expectedRole)` retourne les 4 valeurs attendues.
- Limites membres · fonction pure `wouldExceedAdultLimit(householdId)`.
- Statut assignment · transitions autorisées / interdites (ex. `ASSIGNED → COMPLETED` interdit sans passer par `SUBMITTED`).
- Read state · marquer lu → unread count 0.
- Quotas coach · `getCoachQuotaState(coachUserId, month)` calcule productions & rendez-vous.
- Visibilité parentale · fonction `parentCanSeeMessage(circleMessageId, parentUserId)` retourne true si parent est OWNER/ADULT du circle.

### Intégration

- Cross-center · Center A ne voit pas un étudiant de Center B (`/api/center/students?centerId=B`) → 403.
- Cross-class · Teacher X ne voit pas la Class Y d'un autre teacher → 403.
- Cross-circle · Coach C ne voit pas le Circle d'un autre foyer → 403.
- Cross-household · Parent P1 ne voit pas un ChildProfile de P2 → 404.
- Coach non assigné · POST feedback sur Submission d'un cercle non assigné → 403.
- Teacher non assigné · idem.
- Enfant retiré du cercle · GET messages → 403 (session stale bloquée).
- AccessGrant expiré · `me/racines-dashboard` retourne `mode: NO_ACCESS` correctement.

### Concurrence

- 5ᵉ enfant simultané · deux `POST /api/family/children` en parallèle → un seul aboutit, l'autre 409.
- 3ᵉ adulte simultané · idem.
- Double coach · deux `POST /api/circles/[id]/coach` simultanés → un aboutit, l'autre 409.
- Double Circle même langue · idem sur `POST /api/circles`.
- Double soumission · deux `POST /api/submissions` sur même `assignmentId` par même user → un aboutit.
- Double message · dédup impossible en base (chaque message a un cuid distinct) → mais ne pas double-poster si click 2× (idempotency-key optionnel).

### E2E (Playwright, script `p4-e2e.mjs`)

- Teacher parcours complet · crée classe → invite étudiant → crée devoir → l'étudiant soumet → teacher feedback texte + audio → étudiant lit.
- Coach parcours · l'OWNER invite coach → coach accepte → crée `CircleAssignment` → enfant soumet → coach feedback → parent lit.
- Center parcours · connexion CENTER_ADMIN → voit tableaux réels → tente d'accéder autre centre → 403.
- Parent parcours · gestion 4 enfants max, invitation 2ᵉ adulte, retrait, changement profil actif.
- Enfant parcours · sélection profil actif, envoi audio dans cercle (si Q6 = YES), lecture feedback coach.
- Monde parcours · student complet A1 module → soumission → feedback.
- Racines parcours · similaire dans Circle.
- FR/EN · toutes routes disponibles dans les deux langues.
- Mobile · 360, 390 viewports.
- Clavier · tab trace complet.
- Zoom 200 % · dashboard + Circle + Classroom.
- Pièces jointes · upload MIME valide OK · MIME invalide rejeté.
- Erreurs réseau · offline retry, 500 handled gracefully.

### Sécurité

- IDOR · pour chaque `[id]` dans les URLs P4, tenter accès avec ID d'un autre utilisateur → 403.
- Enumeration · brute force `GET /api/circles/[cuid]` → 403 systématique, pas de leak par timing.
- Upload MIME falsifié · header `content-type: audio/webm` mais bytes PDF → rejet.
- URL signée expirée · attendre TTL + 10 s puis GET → 401.
- Message après retrait · retrait membership, ancien token session encore valide, POST message → 403.
- Stale session · révocation session Supabase (côté admin), tentative POST → 401.
- Privilege escalation · LEARNER tente PATCH `ClassMembership.role = TEACHER` → 403.

---

## 7. Blockers de lancement P4

Aucun sous-lot ne peut être activé en production avec un blocker ouvert.

- [ ] 0 IDOR sur toutes les routes P4 (test §Sécurité)
- [ ] 0 cross-center leak (test §Intégration)
- [ ] 0 cross-circle leak
- [ ] 0 cross-household leak
- [ ] 0 message privé adulte-enfant possible
- [ ] RLS policies écrites et testées (M6 planifiée)
- [ ] Storage buckets privés créés avec policies
- [ ] URLs signées TTL courts systématiques
- [ ] Rate limiting actif sur endpoints messagerie
- [ ] Audit trail capture toutes les actions sensibles (`AuditEvent` §THREAT_MODEL §7)
- [ ] Feature flags à `false` par défaut jusqu'à validation
- [ ] Tests ownership complets par sous-lot (100 % pass rate)
- [ ] Décisions produit Q1-Q15 tranchées (validation humaine)

---

## 8. État de départ · fichiers créés / modifiés dans cet audit

Créés ·

- `docs/YEMA_P4_ARCHITECTURE_AUDIT.md`
- `docs/YEMA_P4_PERMISSION_MATRIX.md`
- `docs/YEMA_P4_THREAT_MODEL.md`
- `docs/YEMA_P4_IMPLEMENTATION_PLAN.md` (ce document)

Modifiés ·

- `docs/YEMA_PRODUCT_IMPLEMENTATION_ROADMAP.md` (bloc P4 uniquement)

Aucun fichier source, aucune migration, aucun package, aucun secret, aucune landing, aucun test produit modifié.

---

## 9. Décision

**P4 AUDIT READY FOR REVIEW**

- Architecture Circle · pseudo-schéma + contraintes proposés (`YEMA_P4_ARCHITECTURE_AUDIT.md §5-8`)
- Matrice permissions · complète pour tous les rôles globaux et locaux (`YEMA_P4_PERMISSION_MATRIX.md`)
- Threat model · menaces + classification CRITICAL/HIGH/MEDIUM/LOW + audit + rétention (`YEMA_P4_THREAT_MODEL.md`)
- Plan · migrations M1-M6 · feature flags · sous-lots P4.1-P4.7 · tests · blockers (ce document)
- Décisions produit ouvertes · 15 questions listées avec recommandations

Éléments **manquants** avant démarrage P4.1 (nécessite validation humaine) ·

1. Réponses aux 15 questions Q1-Q15.
2. Choix ProductCode pour coach Racines · `COACH_RACINES_ADDON` (marketing doctrine) vs `ROOTS_FOLLOWUP_ADDON` (existant Prisma) vs `CAREER_COACH_ADDON` (existant Prisma). Recommandation · réutiliser `ROOTS_FOLLOWUP_ADDON` et documenter le mapping marketing.
3. Choix `AppRole` coach Racines · `CAREER_COACH` (existant) vs nouveau `RACINES_COACH`. Recommandation · nouveau `RACINES_COACH` pour éviter confusion, migration additive à écrire dans P4-M1.
4. Décision `DependentProfile` vs `ChildProfile` · garder un des deux ou clarifier rôles. Recommandation · garder `ChildProfile` (utilisé), déprécier `DependentProfile` en P5.
5. Validation policy rétention audios (Q7) par équipe légale.

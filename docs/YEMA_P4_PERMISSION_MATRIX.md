# YEMA · Matrice d'autorisation P4

> Compagnon de `YEMA_P4_ARCHITECTURE_AUDIT.md`. Aucune ligne de code n'est modifiée par cet audit.
>
> **Portée** · définit qui peut faire quoi sur les entités P4 : `Circle`, `CircleMembership`, `CircleMessage`, `Class`, `ClassMembership`, `ClassAssignment`, `Submission`, `ClassFeedback`, `Thread`, `Message`, `LanguageCenter`, `ChildProfile`, `AccessGrant`, `Order`, `Notification`, `AuditEvent` (proposé).

Chaque case est classée · `ALLOW` · `DENY` · `CONDITIONAL` (avec condition serveur explicite) · `NOT_APPLICABLE`.

---

## 1. Rôles considérés

### Rôles globaux (`AppRole` Prisma)

| Rôle | Source Prisma | Résolu par |
|---|---|---|
| `STUDENT_MONDE` | `UserAppRole.role = LEARNER` **AND** `LearningPath.universe = MONDE` | `me/monde-dashboard` |
| `STUDENT_RACINES_SOLO` | `UserAppRole.role = LEARNER` **AND** `AccessGrant` sur produit `ROOTS_SOLO` actif | `me/racines-dashboard` |
| `PARENT_RACINES` | `UserAppRole.role = PARENT` **OR** propriétaire d'un `Household` **OR** au moins 1 `ChildProfile` où `parentUserId = user.id` | `me/racines-dashboard`, `family/*` |
| `CHILD_PROFILE` | `ChildProfile` sélectionné en `user_metadata.activeChildId` (jamais un `User` authentifié) | `me/active-child` |
| `TEACHER` | `UserAppRole.role = TEACHER` **AND** `Teacher` row existant | `teacher/*` |
| `COACH` (Racines) | **`UserAppRole.role = RACINES_COACH`** (nouveau, ajouté à l'enum en P4.4 · jamais `CAREER_COACH`) **AND** au moins 1 `CircleMembership.role = COACH ACTIVE` | `coach/*` (P4.4) |
| `CENTER_ADMIN` | `UserAppRole.role = CENTER_ADMIN` **AND** `User.centerId != null` | `center/*` |
| `ADMIN` | `UserAppRole.role = YEMA_ADMIN` | `admin/*` |
| `ANONYMOUS` | `supabase.auth.getUser() → null` | landing, `/pricing/*`, `/login` |

### Rôles locaux (par Circle et par Class)

- `CircleRole` (proposé, §5 architecture) · `OWNER`, `ADULT`, `CHILD`, `COACH`
- `ClassMemberRole` (existant Prisma) · `LEARNER`, `TEACHER`, `COACH`

Le rôle global et le rôle local sont **séparés**. Un `TEACHER` global n'a aucune permission sur un `Circle` qui ne le contient pas dans sa `CircleMembership`.

---

## 2. Matrice globale d'autorisation (P4 canonique)

Colonnes · rôles globaux. Lignes · actions produit. La condition explicite d'un `CONDITIONAL` est donnée sous la table.

| Action | STUDENT_MONDE | STUDENT_RACINES_SOLO | PARENT_RACINES | CHILD_PROFILE | TEACHER | COACH | CENTER_ADMIN | ADMIN | ANONYMOUS |
|---|---|---|---|---|---|---|---|---|---|
| Voir sa `Class` | CONDITIONAL[C1] | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | CONDITIONAL[C2] | CONDITIONAL[C3] | CONDITIONAL[C4] | ALLOW | DENY |
| Voir son `Circle` | NOT_APPLICABLE | NOT_APPLICABLE | CONDITIONAL[C5] | CONDITIONAL[C6] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Voir membre d'une classe | CONDITIONAL[C1] | DENY | DENY | DENY | CONDITIONAL[C2] | CONDITIONAL[C3] | CONDITIONAL[C4] | ALLOW | DENY |
| Voir membre d'un cercle | DENY | DENY | CONDITIONAL[C5] | CONDITIONAL[C6] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Voir `ChildProfile` | DENY | DENY | CONDITIONAL[C8] | CONDITIONAL[C9] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Voir progression enfant | DENY | DENY | CONDITIONAL[C8] | CONDITIONAL[C9] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Créer `ClassAssignment` | DENY | DENY | DENY | DENY | CONDITIONAL[C2] | DENY | DENY | ALLOW | DENY |
| Créer `CircleAssignment` (P4.5) | DENY | DENY | CONDITIONAL[C10] | DENY | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Soumettre `Submission` classe | CONDITIONAL[C1] | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY |
| Soumettre `CircleSubmission` (P4.5) | DENY | DENY | DENY | CONDITIONAL[C9] | DENY | DENY | DENY | DENY | DENY |
| Corriger (`ClassFeedback` create) | DENY | DENY | DENY | DENY | CONDITIONAL[C2] | DENY | DENY | ALLOW | DENY |
| Corriger (`CircleFeedback` create) | DENY | DENY | DENY | DENY | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Envoyer message classe | CONDITIONAL[C1] | DENY | DENY | DENY | CONDITIONAL[C2] | DENY | DENY | ALLOW | DENY |
| Envoyer message cercle | DENY | DENY | CONDITIONAL[C5] | CONDITIONAL[C6] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Envoyer audio classe | CONDITIONAL[C1] | DENY | DENY | DENY | CONDITIONAL[C2] | DENY | DENY | ALLOW | DENY |
| Envoyer audio cercle | DENY | DENY | CONDITIONAL[C5] | CONDITIONAL[C11] | DENY | CONDITIONAL[C7] | DENY | ALLOW | DENY |
| Gérer membership classe (add/remove) | DENY | DENY | DENY | DENY | CONDITIONAL[C2] | DENY | CONDITIONAL[C12] | ALLOW | DENY |
| Gérer membership cercle (add/remove) | DENY | DENY | CONDITIONAL[C10] | DENY | DENY | DENY | DENY | ALLOW | DENY |
| Assigner un teacher à une classe | DENY | DENY | DENY | DENY | DENY | DENY | CONDITIONAL[C12] | ALLOW | DENY |
| Assigner un coach à un Circle | DENY | DENY | CONDITIONAL[C10] | DENY | DENY | DENY | DENY | ALLOW | DENY |
| Voir agrégats centre | DENY | DENY | DENY | DENY | DENY | DENY | CONDITIONAL[C12] | ALLOW | DENY |
| Créer `AccessGrant` (offrir accès) | DENY | DENY | DENY | DENY | DENY | DENY | CONDITIONAL[C13] | ALLOW | DENY |
| Voir un paiement | DENY | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | DENY |

### Conditions serveur

- **C1** · l'utilisateur doit avoir une `ClassMembership.userId = user.id AND classId = <target>` avec `status = ACTIVE`.
- **C2** · `ClassMembership.userId = user.id AND classId = <target> AND role = TEACHER AND status = ACTIVE` **OR** `Class.providerUserId = user.id`.
- **C3** · `ClassMembership.userId = user.id AND classId = <target> AND role = COACH AND status = ACTIVE`.
- **C4** · le centre du user (`User.centerId` ou `Teacher.centerId`) doit correspondre à `Class` via `Classroom.centerId = user.centerId` (soft-link à valider en P4.3a).
- **C5** · `CircleMembership.userId = user.id AND circleId = <target> AND role IN (OWNER, ADULT) AND status = ACTIVE`.
- **C6** · `CircleMembership.childProfileId = user_metadata.activeChildId AND circleId = <target> AND role = CHILD AND status = ACTIVE`.
- **C7** · `CircleMembership.userId = user.id AND circleId = <target> AND role = COACH AND status = ACTIVE`. Le coach ne voit que les cercles où il est explicitement assigné.
- **C8** · `ChildProfile.parentUserId = user.id`. Un parent ne voit jamais un enfant qui n'est pas le sien.
- **C9** · `user_metadata.activeChildId = <targetChildProfileId>` **AND** ce ChildProfile est un `CircleMembership.CHILD` du même Circle que le membre parent qui a activé le profil.
- **C10** · `CircleMembership.userId = user.id AND circleId = <target> AND role = OWNER AND status = ACTIVE`. Seul l'OWNER (parent principal) invite / retire un membre du cercle.
- **C11** · CHILD peut envoyer audio si un flag produit `CHILD_MAY_SEND_AUDIO_IN_CIRCLE = true` (à trancher · voir décision Q6 dans `IMPLEMENTATION_PLAN.md`).
- **C12** · `User.centerId = <target Class/Classroom.centerId>` **AND** `UserAppRole.role = CENTER_ADMIN`. Un centre voit ses classes et enseignants uniquement.
- **C13** · `AccessGrant.beneficiaryType = USER` **AND** l'user cible est un `ClassMembership.LEARNER` d'une classe du centre (offre CENTER_SEAT).

---

## 3. Matrice Circle · rôles locaux

Colonnes · rôles CircleMembership. Lignes · actions.

| Action | OWNER | ADULT | CHILD | COACH |
|---|---|---|---|---|
| Invitation d'un adulte | ALLOW | DENY | DENY | DENY |
| Retrait d'un adulte | ALLOW | DENY | DENY | DENY |
| Ajout d'un enfant | ALLOW | CONDITIONAL[D1] | DENY | DENY |
| Retrait d'un enfant | ALLOW | CONDITIONAL[D1] | DENY | DENY |
| Assignation d'un coach | ALLOW | DENY | DENY | DENY |
| Retrait du coach | ALLOW | DENY | DENY | DENY |
| Consultation du cercle | ALLOW | ALLOW | ALLOW (scoped) | ALLOW |
| Lecture des membres | ALLOW | ALLOW | ALLOW (limited) | ALLOW |
| Lecture des messages TEXT | ALLOW | ALLOW | ALLOW | ALLOW |
| Lecture des messages AUDIO | ALLOW | ALLOW | ALLOW | ALLOW |
| Envoi de message TEXT | ALLOW | ALLOW | ALLOW | ALLOW |
| Envoi de message AUDIO | ALLOW | ALLOW | CONDITIONAL[D2] | ALLOW |
| Envoi d'annonce (`ANNOUNCEMENT`) | ALLOW | DENY | DENY | ALLOW |
| Suppression de son propre message | ALLOW | ALLOW | ALLOW | ALLOW |
| Suppression du message d'un autre | ALLOW | DENY | DENY | DENY |
| Édition (< 15 min post-envoi) | ALLOW | ALLOW | ALLOW | ALLOW |
| Création d'activité (CircleAssignment P4.5) | ALLOW | DENY | DENY | ALLOW |
| Feedback sur CircleSubmission (P4.5) | DENY | DENY | DENY | ALLOW |
| Lecture des CircleFeedback | ALLOW | ALLOW | ALLOW (seul le sien) | ALLOW |
| Gestion des enfants (via `/family`) | ALLOW | CONDITIONAL[D1] | DENY | DENY |
| Gestion des adultes (via `/family`) | ALLOW | DENY | DENY | DENY |
| Retrait du cercle (self) | DENY | ALLOW | DENY | ALLOW |
| Retrait d'un autre membre | ALLOW | DENY | DENY | DENY |
| Archivage du cercle | ALLOW | DENY | DENY | DENY |

### Conditions locales Circle

- **D1** · Q1 **validée · NON**. Le deuxième adulte voit et accompagne les profils enfants, mais **ne les modifie pas** et **ne les supprime pas**. Seul l'OWNER (parent principal) gère les profils enfants. RLS `child_profiles` restreint `UPDATE`/`DELETE` à `parent_user_id = auth.uid()`.
- **D2** · Q6 **validée · OUI avec quota 3 minutes max**. Le CHILD peut envoyer une note vocale dans le Circle (jamais hors Circle) · durée ≤ 180 s validée serveur à l'upload · visible par OWNER, ADULT, COACH et CHILD concerné.

---

## 4. Matrice Class · rôles locaux

Colonnes · rôles ClassMembership. Lignes · actions.

| Action | TEACHER | LEARNER | COACH (Career) | (Class.providerUserId owner) |
|---|---|---|---|---|
| Voir le fil `MAIN` | ALLOW | ALLOW | ALLOW | ALLOW |
| Poster dans `MAIN` | ALLOW | ALLOW | ALLOW | ALLOW |
| Créer `Thread` `ANNOUNCEMENT` | ALLOW | DENY | DENY | ALLOW |
| Poster dans `ANNOUNCEMENT` | ALLOW | DENY | DENY | ALLOW |
| Créer `ClassAssignment` | ALLOW | DENY | DENY | ALLOW |
| Publier `ClassAssignment` | ALLOW | DENY | DENY | ALLOW |
| Voir `Submission` d'un LEARNER | ALLOW | DENY (sauf la sienne) | ALLOW | ALLOW |
| Poster `ClassFeedback` | ALLOW | DENY | ALLOW | ALLOW |
| Éditer `ClassFeedback` (immutable après publication, cf. Q13) | DENY | DENY | DENY | DENY |
| Ajouter/retirer un LEARNER | ALLOW | DENY | DENY | ALLOW |
| Ajouter/retirer un COACH | ALLOW | DENY | DENY | ALLOW |
| Ajouter/retirer un TEACHER | DENY (nécessite CENTER_ADMIN ou ADMIN) | DENY | DENY | DENY |
| Archiver la classe | DENY | DENY | DENY | ALLOW |

Notes ·

- `LEARNER` = `ClassMembership.role = LEARNER`. Voir sa propre `Submission` mais jamais celle d'un autre.
- `COACH (Career)` est le `CAREER_COACH` de la doctrine — distinct du coach Racines de Circle.
- Un professeur ne peut jamais s'auto-assigner à une `Class` (assignation par CENTER_ADMIN pour classes de centre, ou par ADMIN pour classes indépendantes).

---

## 5. Matrice Center · privacy et scope

Le `CENTER_ADMIN` opère uniquement sur les entités dont `centerId = user.centerId`. Toute requête cross-centre retourne `403`.

| Action | CENTER_ADMIN |
|---|---|
| Voir liste enseignants du centre (`Teacher WHERE centerId = ?`) | ALLOW |
| Voir liste étudiants du centre (via `Classroom.centerId → ClassroomEnrollment`) | ALLOW |
| Voir liste classes du centre (`Classroom WHERE centerId = ?`) | ALLOW |
| Voir agrégats du centre | ALLOW |
| Voir une classe d'un autre centre | DENY (403) |
| Voir un étudiant d'un autre centre | DENY (403) |
| Voir un `AccessGrant` d'un étudiant du centre | CONDITIONAL[E1] |
| Voir un paiement | DENY |
| Envoyer un message dans une `Class` du centre | CONDITIONAL[E2] |
| Modérer un message dans une `Class` du centre | ALLOW |
| Voir un `Circle` Racines | DENY (les cercles n'appartiennent pas au centre) |
| Voir un `ChildProfile` | DENY |
| Lire messages classe (Q12) | DENY par défaut · CONDITIONAL[E3] si rôle safeguarding P5 + audit |

- **E3** · Q12 validée. Le Center ne lit pas les conversations de classe par défaut. Un accès exceptionnel est réservé à un rôle `SAFEGUARDING` (à créer en P5) avec audit obligatoire. En P4, `has_safeguarding_role` retourne toujours `false` — donc aucun Center admin ne lit un message pendant tout P4.

- **E1** · uniquement si `AccessGrant.sourceType = CENTER_SEAT` et `AccessGrant.sourceId = <center>`.
- **E2** · uniquement si le center admin est aussi `ClassMembership.TEACHER` de cette Class.

---

## 6. Console Teacher · autorisation détaillée P4.3b

| Ressource | Read | Write |
|---|---|---|
| `Class` où je suis TEACHER ou provider | oui | oui (métadonnées, archivage) |
| `Class` d'un autre teacher | non | non |
| `ClassMembership` de mes classes | oui | ajouter/retirer LEARNER, COACH |
| `ClassMembership` d'une autre classe | non | non |
| `User` (moi) | oui | oui (via `/settings`) |
| `User` (mes étudiants, données pédagogiques) | oui (limité : prénom, niveau, progression) | non |
| `User` (mes étudiants, données personnelles email/téléphone/adresse) | non | non |
| `User` global (recherche libre) | non | non |
| `ClassAssignment` de mes classes | oui | oui |
| `Submission` de mes assignments | oui | non (write = feedback) |
| `ClassFeedback` que j'ai écrit | oui | non (immutable, cf. Q13) |
| `Thread`, `Message` de mes classes | oui | oui (poster + supprimer siens + supprimer autres si TEACHER) |
| `Circle`, `CircleMembership`, `CircleMessage` | **non** | **non** |
| `ChildProfile` | **non** | **non** |
| `LanguageCenter` | non (sauf si CENTER_ADMIN) | non |
| `AccessGrant` (autre) | non | non |
| `Order`, `Payment` | non | non |

---

## 7. Console Coach Racines · autorisation détaillée P4.4

Feature flag associé · `COACH_WORKSPACE_ENABLED = false` par défaut. Rôle applicatif · `AppRole = RACINES_COACH` (nouveau, jamais `CAREER_COACH`).

Toutes les tables sensibles sont scopées via `CircleMembership.role = COACH AND status = ACTIVE`.

| Ressource | Read | Write |
|---|---|---|
| `Circle` où je suis COACH ACTIVE | oui | non (métadonnées gérées par OWNER) |
| `Circle` sans moi | non | non |
| `CircleMembership` de mes cercles | oui (limité : rôle + prénom / animal pour CHILD) | non |
| `CircleMembership` hors mes cercles | non | non |
| `ChildProfile` d'un enfant de mes cercles (Q4) | oui (limité : prénom / nom d'affichage, animal, âge, langue active, étape É actuelle) | non |
| `ChildProfile` global | non | non |
| `CircleAssignment` de mes cercles (P4.5) | oui | oui (créer/publier) |
| `CircleSubmission` de mes cercles | oui | non |
| `CircleFeedback` que j'écris (Q13) | oui | oui (créer uniquement · immutable · addendum = nouvelle ligne) |
| `CircleMessage` de mes cercles (Q5) | oui | oui (TEXT + AUDIO + ANNOUNCEMENT · toujours visible parent OWNER + ADULT) |
| `MessageReport` (signaler un message · Q11) | ses propres reports | oui (créer report `PENDING`) |
| `Class` Monde | non | non |
| `LanguageCenter` | non | non |
| `AccessGrant` (autre) | non | non |
| `Order`, `Payment` | non | non |
| Quotas propres (mois / semaine) | oui | non (calculés serveur) |
| Capacité coach (Q15 : 20 profils / 10 Circles) | oui | non (compteur serveur · 409 `coach_capacity_reached` à l'assignation) |

Note doctrinal · le coach n'a **jamais** accès à un enfant hors cercle assigné (Q5), ne peut **jamais** le contacter en dehors du fil du cercle (Q5 · aucun DM), ne voit **jamais** l'email/téléphone/adresse du parent, ne voit que le nom d'affichage + données pédagogiques minimales (Q4). Un retrait de coach est immédiatement effectif (Q10) · l'historique reste attribué et audité.

---

## 8. Privacy / minimisation par rôle professionnel

### Teacher

- Autorisé · prénom d'affichage, niveau CECR, progression pédagogique (modules complétés, moyennes), submissions dans ses classes uniquement.
- Refusé par défaut · adresse personnelle, données de santé, école d'un enfant (les enfants ne sont pas dans les classes Monde de toute façon), email/téléphone de l'élève.

### Coach (Racines)

- Autorisé · prénom d'affichage enfant, avatar animal, âge int, langue active, étape É actuelle, productions du cercle.
- Refusé · nom de famille, école, adresse, email personnel du parent, téléphone, données de santé, photographies, autres enfants du foyer non membres du cercle.

### Center Admin

- Autorisé · identité professionnelle des enseignants du centre, agrégats statistiques (nb étudiants, nb classes, moyennes), liste des étudiants du centre pour licences.
- Refusé · progression pédagogique fine (sauf via TEACHER), messages de classe (sauf modération), tout foyer / cercle Racines.

### Interdictions transverses (tous rôles pro)

- Email d'un profil enfant · aucun email personnel n'est stocké pour un `ChildProfile`.
- Téléphone d'un mineur · idem.
- Historique complet hors périmètre · un teacher voit sa classe, jamais les autres classes du même élève.

---

## 9. Cas particuliers explicites

### Enseignant qui est aussi parent

Fréquent. Un `User` peut avoir `UserAppRole.role = TEACHER` **et** être `Household.ownerUserId` d'un foyer distinct. Les deux ensembles de permissions sont indépendants :

- Sur `/teacher/*`, la session bascule contexte teacher, aucune donnée Racines n'apparaît.
- Sur `/famille/*`, la session bascule contexte parent, aucune donnée classe n'apparaît.
- Le bascule se fait via `/api/space/switch` (existant), et respecte `user_metadata.active_space`.

### Coach qui devient parent d'un cercle

Interdit structurellement. Un `User` avec `CircleMembership.role = COACH` sur `Circle X` ne peut pas simultanément être `CircleMembership.role = OWNER` ou `ADULT` sur le même `Circle X`. La contrainte `@@unique([circleId, userId, childProfileId])` empêche déjà les doublons, mais une garde applicative doit vérifier l'exclusivité mutuelle des rôles.

### Impersonation admin

Interdite par défaut. Si un jour un ADMIN doit ouvrir la vue d'un parent (support), l'action doit être :

- Consentie explicitement par le parent (out-of-band).
- Loguée dans `AuditEvent.ADMIN_IMPERSONATION_STARTED` / `_ENDED`.
- Rate-limitée (une session par heure max).

---

## 10. Références croisées

- `YEMA_P4_ARCHITECTURE_AUDIT.md §5-7` · pseudo-schéma Circle + contraintes.
- `YEMA_P4_THREAT_MODEL.md` · menaces qui découlent d'une case `ALLOW` mal appliquée.
- `YEMA_P4_IMPLEMENTATION_PLAN.md §Décisions ouvertes` · questions Q1, Q6, Q13 référencées ici.

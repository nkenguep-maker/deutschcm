# YEMA · Manifeste de refonte des 8 dashboards + messagerie P4.6

**Branche** : `feat/yema-dashboard-redesign-messaging` (créée depuis `feat/yema-qa-preview-personas` @ `c6c2134`, 2026-07-29)
**Cible** : Preview P-1 (`kzzagbojjkivdzzcrmxn`) — jamais Production
**Source visuelle** : `~/Downloads/YEMA - Documentation des designs.html`
**Statut** : Lot 1 (audit + tokens + shell) en cours. Aucun ancien dashboard supprimé.

---

## 1. Doctrine

- Suppression des anciens composants **uniquement après validation** de chaque remplacement (Lot 8).
- Tant qu'un ancien dashboard fonctionne et n'a pas de remplaçant validé, il reste importé et rendu.
- Chaque nouveau composant vit dans `src/features/dashboards/<persona>/`. Les primitives partagées vivent dans `src/features/dashboards/shared/`. La messagerie vit dans `src/features/messaging/`.
- Aucune modification de permission, RLS ou workflow métier pour contourner un contrôle existant.
- Les rubriques secondaires (assignments, submissions, classes, séances, facturation, etc.) sont **branchées** sur les workflows P4.5-B/P4.4/P4.3a existants, jamais dupliquées.

## 2. Manifeste de remplacement par route

Légende : ✅ existe · 🟡 partiel · ❌ absent · 🆕 à créer.

### 2.1 Super Admin — `/[locale]/admin`

| Élément | Actuel | Cible |
|---|---|---|
| Page | `src/app/[locale]/admin/page.tsx` → `AdminDashboard` (client, recharts) | `src/app/[locale]/admin/page.tsx` → server component qui délègue au nouveau `AdminDashboardView` (Lot 4) |
| Sidebar | drawer nav admin custom | `DashboardShell` + `DashboardSidebar` (partagés) |
| Rubriques | 6 placeholders (users, centers, courses, courses/generate, roles, system) | Console (par défaut), Comptes de test, Centres, Utilisateurs, Journal, Environnements |
| Data | `src/lib/*` (à identifier plus finement) + hooks recharts | `getSuperAdminOverview()` (nouveau service server-only) + réutilisation `src/lib/qa/*` pour "Tester comme…" |
| Interdits | — | Aucun secret exposé (clés, tokens, URLs DB, service-role) |
| Ancien supprimable ? | pas avant Lot 8 · dépend de la validation du nouveau `AdminDashboardView` | oui après Lot 8 |

### 2.2 Enseignant·e — `/[locale]/teacher`

| Élément | Actuel | Cible |
|---|---|---|
| Layout | `src/components/TeacherLayout.tsx` (sidebar groupée) | `DashboardShell` + `DashboardSidebar` (partagés) |
| Page dashboard | `src/app/[locale]/teacher/page.tsx` → `TeacherDashboardView` (SSR) | idem route, nouveau `TeacherDashboardView` sous `src/features/dashboards/teacher/` |
| Rubriques cibles | actives : dashboard, classrooms, assignments, submissions, students · placeholders : activities, stats, studio, resources, settings, goodbye | Tableau de bord · Mes classes · Devoirs · Corrections · Ressources · Messages (nouveau) |
| Data | `src/lib/teacher/queries.ts` (`getTeacherDashboard`) + `src/lib/permissions/teacher.ts` + `src/lib/assignments/teacher.ts` | Réutilisation intégrale, ajout `getTeacherMessagesOverview()` (Lot 6) |
| KPIs cible | À corriger · devoirs publiés · classes · taux de rendu | même 4 KPIs, alimentés depuis `getTeacherDashboard()` |
| File de correction | 12 rendus (élève, devoir, version vN) | `getTeacherSubmissionsQueue()` (nouveau, dérivé de queries existantes) |
| Workflow Assignments | DRAFT → PUBLISHED → CLOSED conservé strictement | inchangé — nouveau UI branche uniquement |
| Ancien supprimable ? | `TeacherLayout.tsx`, `TeacherDashboardView` legacy → oui après Lot 8 |

### 2.3 Coach Racines — `/[locale]/coach/racines`

| Élément | Actuel | Cible |
|---|---|---|
| Layout | `src/components/rootsCoach/RootsCoachLayout.tsx` | `DashboardShell` + variante sidebar Racines (surfaces bordeaux, mais partage la même primitive) |
| Page dashboard | `src/app/[locale]/coach/racines/page.tsx` → `RootsCoachDashboardView` | nouveau sous `src/features/dashboards/coach-racines/` |
| Rubriques cibles | actives : dashboard, circles, profiles · placeholders : activities, messages, sessions | Tableau de bord · Mes apprenants · Séances · Messages · Notes de séance |
| Data | `src/lib/rootsCoach/queries.ts` + `src/lib/permissions/rootsCoach.ts` | Réutilisation, ajout `getCoachSessionNotes()` (dérivé), `getCoachMessagesOverview()` (Lot 6) |
| Messages | placeholder `/coach/racines/messages/page.tsx` | vraie messagerie voix-d'abord (Lot 7) |
| Ancien supprimable ? | oui après Lot 8 |

### 2.4 Administrateur de centre — `/[locale]/center`

| Élément | Actuel | Cible |
|---|---|---|
| Layout | `src/components/CenterLayout.tsx` | `DashboardShell` + `DashboardSidebar` |
| Page dashboard | `src/app/[locale]/center/page.tsx` → `CenterDashboardView` | nouveau sous `src/features/dashboards/center/` |
| Rubriques cibles | actives : dashboard, teachers, students, classes · placeholders : stats, billing | Vue du centre · Élèves · Enseignants · Classes · Inscriptions · Facturation · Messages |
| Data | `src/lib/center/queries.ts` + `src/lib/permissions/center.ts` | Réutilisation, ajout `getCenterEnrollmentsPipeline()`, `getCenterBillingOverview()` (dérivés de `Order`/`Payment`), `getCenterMessagesOverview()` (Lot 6) |
| Messagerie centre | ❌ | Onglets Toutes/Interne/Paiements/Non lus, "Nouveau rappel de paiement" branché sur `Invoice`/`Order` réel |
| Ancien supprimable ? | oui après Lot 8 |

### 2.5 Élève Monde — `/[locale]/dashboard` (branche `learningPath.universe === "MONDE"`)

| Élément | Actuel | Cible |
|---|---|---|
| Page | `src/app/[locale]/dashboard/page.tsx` → dispatch `DashboardMonde` / `DashboardRacines` | même dispatch conservé ; `DashboardMonde` remplacé par nouveau `src/features/dashboards/student-monde/` |
| Rubriques | `DashboardMonde.tsx` monolithique | Mon tableau de bord · Mon cours · Mes devoirs · Mon parcours · Ma classe · Messages |
| Data | `src/lib/mondo.ts` + `src/lib/entitlements/*` + `src/lib/assignments/student.ts` | Réutilisation intégrale, ajout `getStudentMondeOverview()` (composé), `getStudentMessagesOverview()` (Lot 6) |
| Devoirs | `StudentAssignmentsView` (workflow P4.5-B) | Rubrique "Mes devoirs" branche sur la même API |
| Messages | ❌ | chat direct enseignant + chat groupe classe (Lot 6 + 7) |
| Onboarding | intact | intact |
| Ancien supprimable ? | `DashboardMonde.tsx` legacy → oui après Lot 8 |

### 2.6 Élève Racines — `/[locale]/dashboard` (branche `learningPath.universe === "RACINES"`)

| Élément | Actuel | Cible |
|---|---|---|
| Page | même dispatch | `DashboardRacines` remplacé par nouveau `src/features/dashboards/student-racines/` |
| Rubriques | `DashboardRacines.tsx` | Mon tableau de bord · Mes étapes · Écoutes · Mon coach · Cercle de palabre · Messages |
| Data | `src/lib/racines.ts` + `src/lib/rootsCoach/queries.ts` (côté apprenant) | Réutilisation, ajout `getStudentRacinesOverview()`, `getStudentCircleFeed()` |
| Messages | ❌ | voix-d'abord (Lot 7) : chat avec Coach affecté, aucun accès Monde |
| Ancien supprimable ? | `DashboardRacines.tsx` legacy → oui après Lot 8 |

### 2.7 Enfant Monde — `/[locale]/dashboard` (variante 🆕)

| Élément | Actuel | Cible |
|---|---|---|
| Route | même dispatch `/[locale]/dashboard` | branche additionnelle : `child_monde` |
| Détection persona | ❌ (pas de rôle enfant Prisma actuel) | audit préalable Lot 5 : privilégier `ChildProfile` + `DependentProfile` existants + LearningPath ou audience ; ne créer une colonne / enum que si strictement nécessaire |
| Rubriques | ❌ | Ma maison · Mes jeux · Mes histoires · Mes badges |
| Ergonomie | ❌ | boutons ≥ 44×44, texte court, ≥ Pré-A1 CECRL, missions TPR, "Je peux déjà…" à cocher à l'oral |
| Messagerie enfant | interdite dans cette phase | aucune messagerie libre |

### 2.8 Enfant Racines — `/[locale]/dashboard` (variante 🆕)

| Élément | Actuel | Cible |
|---|---|---|
| Route | même dispatch | branche additionnelle : `child_racines` |
| Détection persona | ❌ | même doctrine que Enfant Monde |
| Rubriques | ❌ | Ma case · Mes contes · Mes chansons · Mes badges |
| Pédagogie | ❌ | conte (écoute répétée, raconter à son tour), missions Dégg/Wax/Jëf, mot magique, validation avec Coach/adulte |
| Messagerie enfant | interdite dans cette phase | aucune messagerie libre |

## 3. Routes secondaires — conserver / brancher / laisser

| Domaine | Route existante | Décision |
|---|---|---|
| Assignments TEACHER | `/[locale]/teacher/assignments/*` (list, create, [id]) | **conserver** intégralement, brancher depuis nouveau menu enseignant |
| Assignments STUDENT | `/[locale]/student/assignments/*` | **conserver**, brancher depuis "Mes devoirs" |
| Submissions | `/[locale]/teacher/submissions/[id]`, `/[locale]/student/submissions/[id]` | **conserver** |
| Classes TEACHER | `/[locale]/teacher/classroom/[id]` | **conserver** |
| Classes CENTER | `/[locale]/center/classes` | **conserver** (mise à jour visuelle Lot 4) |
| Progression | `/[locale]/progress` | conserver (hors scope refonte, réutilisé) |
| Onboarding | `/[locale]/onboarding/*` | **inchangé** (contrainte brief) |
| Notifications | `/[locale]/notifications` | conserver |
| QA console | `/[locale]/qa` | conserver, mise à jour Lot 5 pour 8 personas |
| Legacy `/[locale]/classroom` | ancien | ne pas toucher pendant refonte, évaluer suppression Lot 8 seulement si aucun import |

## 4. Composants supprimables (Lot 8 uniquement)

Chacun ne sera supprimé qu'après :
1. Nouveau composant rendu sur la Preview P-1
2. Données réelles branchées
3. Permissions validées cross-tenant
4. Responsive 360/390/768/1024/1440 validé
5. Tests verts
6. Aucun import legacy restant (`grep -R`)

Cibles :

- `src/components/TeacherLayout.tsx`
- `src/components/CenterLayout.tsx`
- `src/components/rootsCoach/RootsCoachLayout.tsx`
- `src/components/mondo/DashboardMonde.tsx`
- `src/components/racines/DashboardRacines.tsx`
- `src/components/admin/AdminDashboard.tsx` (à identifier précisément)
- Toute view "*DashboardView" legacy remplacée
- Styles orphelins associés

Ne **pas** supprimer :
- services `src/lib/*`
- resolvers `src/lib/permissions/*`
- API routes `src/app/api/*`
- workflows P4.5-B, P4.4, P4.3a, P4.2
- types Prisma
- composants réutilisés ailleurs (à confirmer par grep)

## 5. Messagerie P4.6 — plan additif (Lot 6 + 7)

### 5.1 Modèles Prisma additifs (migration additive Lot 6)

Aucun `Conversation` conforme n'existe. On ajoute (noms définitifs à confirmer avec les conventions locales) :

- enum `ConversationType` : `WORLD_DIRECT`, `WORLD_CLASS`, `ROOTS_DIRECT`, `CENTER_INTERNAL`, `CENTER_BILLING`
- enum `MessageKind` : `TEXT`, `AUDIO`, `SYSTEM`, `PAYMENT_REMINDER`
- `Conversation`, `ConversationParticipant`, `Message` selon la structure du brief §18
- Indexes ciblés (§18)
- **Ne pas** dupliquer `Thread`/`Message` legacy : ils restent pour le fil de classe legacy et seront évalués Lot 8

### 5.2 Doctrine sécurité

- Feature gate → auth → autorisation → DB (ordre imposé §23)
- Resolver central `resolveMessagingActor()` (retourne `userId`, `authUserId`, `roles`, `activeRole`, `centerId`, `classroomIds`, `rootsCircleIds`, `learningUniverse`)
- Services server-only pour chaque opération (§19)
- Le client n'envoie jamais `senderId`, `participantIds`, `role`, `centerId`, `classroomId`, `rootsCircleId`, `invoice owner`
- Feature flags : `YEMA_MESSAGING_ENABLED=false`, `YEMA_MESSAGE_AUDIO_ENABLED=false` par défaut

### 5.3 Audio (Lot 7)

- 2 phases : `prepareAudioUpload` → upload bucket privé → `finalizeAudioMessage`
- MIME allowlist : `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`
- Storage key liée à la conversation, upload lié à l'utilisateur actif, finalisation unique
- URLs de lecture signées et courtes
- Aucun service-role côté client

### 5.4 Realtime (Lot 7)

- Supabase Realtime (déjà présent via `@supabase/ssr` v0.10.3)
- DB source de vérité, refetch API après reconnexion, dédup par `messageId`
- Souscription uniquement aux conversations autorisées
- Cleanup discipliné, pas de double message

## 6. Menu QA 6 → 8 personas (Lot 5)

Ajouter dans `src/lib/qa/personas.ts` :
- `child_monde` → `/dashboard` (STUDENT avec LP MONDE + variante enfant)
- `child_racines` → `/dashboard` (STUDENT avec LP RACINES + variante enfant)

Fixtures : chaque persona doit utiliser un vrai Auth user Supabase P-1, une vraie session, un vrai profil, un LearningPath distinct, permissions normales, aucun bypass RLS. Payload navigateur strictement `{ "persona": "<nom>" }`.

## 7. Feature flags

Fichier `src/lib/flags.ts` (à étendre) :

- `isYemaDashboardsRedesignActive()` — gate visuel des nouveaux dashboards (Lots 2-5) sans casser les anciens
- `isYemaMessagingEnabled()` — envelope Lots 6-7 (défaut `false`)
- `isYemaMessagingAudioEnabled()` — envelope audio (défaut `false`)

## 8. Ordre d'exécution rappel

| Lot | Contenu | Modifie route publique ? |
|---|---|---|
| 1 | audit + tokens + shell partagé + manifeste (ici) | non |
| 2 | Élève Monde + Élève Racines | oui (`/[locale]/dashboard`) — via flag |
| 3 | Enseignant + Coach Racines | oui — via flag |
| 4 | Administrateur centre + Super Admin | oui — via flag |
| 5 | Enfant Monde + Enfant Racines + personas QA | oui — via flag |
| 6 | backend messagerie texte + permissions + UI Messages | oui — via flag |
| 7 | audio privé + Realtime + non lus | oui — via flag audio |
| 8 | tests croisés + responsive + suppression legacy + Preview finale | suppression code mort |

Verdict court après chaque lot, attendre autorisation avant le suivant.

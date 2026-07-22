# YEMA · P2 · Expérience étudiant Monde

> **Livrable du lot `feat/yema-p2-world-student`** (2026-07-22, base `main@4f76d20`). Construit le dashboard, le catalogue, la progression et le verrouillage d'accès pour un étudiant Monde après le funnel P1.
>
> P2 est **volontairement lean** : on branche les composants existants sur des données Prisma réelles, on ajoute un verrou d'accès server-side, et on scelle les écarts avec des états honnêtes. Aucune messagerie complète, aucun paiement, aucune console professeur — ces briques sont P4 / P5.

## 1. Routes

| Route | Rôle | Statut |
|---|---|---|
| `/[locale]/dashboard` | Server aiguillage · Monde → `<DashboardMonde>` · Racines → `<FoyerClient>` (P3) | ✅ DONE |
| `/[locale]/courses` | Server catalog · 5 leçons a1-beta-1..5 + A2-C1 « Bientôt disponible » | ✅ DONE |
| `/[locale]/courses/[courseId]/modules/[moduleId]` | Existant (P1 audit COMPLETE) · nouveau `layout.tsx` server pour vérifier AccessGrant | ✅ DONE |
| `/[locale]/progress` | Server view · ModuleProgress réels, aucune graphique fictif | ✅ DONE |
| `GET /api/me/monde-dashboard` | Nouvel endpoint · state complet du dashboard | ✅ DONE |

## 2. Données · seams

### `src/lib/monde.ts` (nouveau)

Fonctions pures qui agrègent LP + AccessGrant + ModuleProgress :

- `computeMondeAccess(grants)` → `{ status: "ACTIVE" | "EXPIRED" | "NONE", startsAt, endsAt, daysRemaining, level }`
- `buildA1CourseList(progress)` → 5 `MondeCourseSummary` avec verrouillage séquentiel (cours N+1 s'ouvre quand N est complet)
- `nextIncompleteModule(progress)` → prochain module à faire (jamais dans un cours verrouillé)
- `overallProgress(summaries)` → pourcentage entier
- `canAccessModule(access)` → true seulement si `status === "ACTIVE"`

### `src/lib/discovery.ts` (mise à jour)

`MONDE_LEVEL_AVAILABILITY.A1.courseReady = true` (5 leçons × 5 modules confirmés dans `src/data/a1-beta-modules.ts`). A2-C1 restent `courseReady = false`. Aucun niveau n'est `purchasable` tant que P5 n'a pas branché le paiement.

## 3. Statut réel du contenu A1

| Leçon | ID | Modules réels | Statut |
|---|---|--:|---|
| Beta 1 — Willkommen! | `a1-beta-1` | 5 (LESSON · HOEREN · CONVERSATION · SCHREIBEN · QUIZ) | ✅ READY |
| Beta 2 — Meine Familie | `a1-beta-2` | 5 | ✅ READY |
| Beta 3 — Mein Alltag | `a1-beta-3` | 5 | ✅ READY |
| Beta 4 — Einkaufen & Essen | `a1-beta-4` | 5 | ✅ READY |
| Beta 5 — Deutschland-Reise | `a1-beta-5` | 5 | ✅ READY |

Contenu original, pas dérivé de manuel copyright, allemand grammaticalement correct (voir en-tête de `src/data/a1-beta-modules.ts`). Aucun contenu nouvellement inventé par P2.

## 4. Dashboard Monde

`DashboardMonde` (client) consomme `/api/me/monde-dashboard`. Blocs affichés uniquement sur données réelles :

- **En-tête** : universe kicker · greeting `firstName` · langue · niveau · badge d'accès (avec jours restants si ACTIVE)
- **Hero laiton** : progression globale % · titre « Continuer ta prochaine leçon » · CTA principal unique (Reprendre ou Activer)
- **Ton parcours** : 5 cartes cours avec status LOCKED/OPEN/IN_PROGRESS/COMPLETED
- **Préparation** : lien vers `/test-niveau` existant · aucune promesse d'examen non-existant
- **Suivi professeur** : état « Bientôt disponible » sobrement (jamais de faux prof)

## 5-7. Accès étudiant

Trois statuts calculés à partir de `AccessGrant` (beneficiary = user OR learning path) :

| Statut | Condition | UI |
|---|---|---|
| `ACTIVE` | Grant `status=ACTIVE` AND `endsAt` futur (ou null) | Contenu débloqué, jours restants affichés |
| `EXPIRED` | Grant `status=ACTIVE` mais `endsAt <= now` | Dashboard limité, contenu payant verrouillé (message honnête), progression conservée |
| `NONE` | Aucun grant | Bannière « Choisir un Passage » (renvoie sur `/activation-intent`) |

**Aucun paiement dans P2.** Les fixtures P-1 créent directement des grants marqués `TEST_P2_*` via `scripts/test-baseline/p2-access-fixtures.mjs {active|expired|none}`.

## 8. Catalogue (`/courses`)

Server component qui lit LP + AccessGrant + ModuleProgress :
- Bannière verrou si NO access
- Liste des 5 cours A1 avec status et pourcentage
- CTA « Ouvrir » / « Reprendre » si accès actif ET cours non-locked
- Bloc `A2 · B1 · B2 · C1 · Bientôt disponible` (pas cliquable, pas de faux nombre de leçons)

Racines → redirect vers `/dashboard` (P3 y ajoutera le catalogue Racines).

## 9. Modules (verrouillage server-side)

Nouveau `layout.tsx` sur `/[locale]/courses/[courseId]/modules/[moduleId]/` :
- Server component qui charge session + LP + grants avant de rendre `children`
- Si `!canAccessModule(access)` → `StateBlock kind="locked"` avec CTA `/activation-intent`
- Le composant existant (client) rend le module sans changement supplémentaire

Cette approche est **defensive** : même si un attaquant devine l'URL d'un module, le server refuse de rendre le contenu sans grant.

## 10. Progression

`ModuleProgress` (existant en Prisma) sert de source de vérité. La page `/progress` :
- Résumé chiffré (niveau, modules faits/total, XP, accès, dernière activité)
- Détail par leçon avec barre de progression
- Aucun classement, aucune comparaison, aucun streak fictif

## 11-13. Audio / examens / attestation

- **Audio** : les modules HOEREN existent avec des `content.audioUrl` (voir A1_BETA_MODULES). Le composant `AudioPlayer` existant rend uniquement quand l'asset est présent (règle P0.A / P1).
- **Test de niveau** : réutilise `/test-niveau` existant · pas un examen certifiant, wording indicatif.
- **Examens blancs** : marqués `PARTIAL — CONTENT_REVIEW_REQUIRED` · aucune fausse route ajoutée.
- **Attestation** : marquée `CONTENT_REVIEW_REQUIRED` · aucun PDF généré · aucune promesse de « diplôme ».

## 14-15. Suivi professeur / devoirs / classroom

- **Suivi professeur** : état « Bientôt disponible » sur le dashboard. Aucune console professeur, aucun faux prof assigné.
- **Devoirs / ClassAssignment** : `P4_DEPENDENCY` · les modèles existent mais l'API étudiante n'est pas branchée dans P2.
- **Classroom** : composant `ClassroomChat` existant (P0.A nettoyage) reste en `StateBlock empty`. Aucun message hardcodé.

## 16. Notifications

Aucune modification P2 · réutilise l'état honnête de P0.B (StateBlock offline + kind=empty). L'infra de push notification restera P4/P5.

## 17. Permissions et ownership

**Server-side · toutes les APIs et routes protégées vérifient** :

- Session Supabase (401 si absente)
- `UserRole.role = STUDENT AND status = ACTIVE` (403 `FORBIDDEN_NOT_STUDENT` si pas STUDENT)
- LearningPath charge via `userId = supabaseUser.id` (jamais depuis un ID client)
- AccessGrant filtré via `beneficiaryType=USER OR LEARNING_PATH` sur les IDs autoritaires
- Proxy `/dashboard`, `/courses`, `/progress` = STUDENT (déjà en place depuis P0.A/P1)

E2E confirmé :
- anon `GET /api/me/monde-dashboard` → **401**
- racines `GET /api/me/monde-dashboard` → **200** avec `hasLearningPath: false` (état honnête, jamais de fuite d'un LP Monde d'un autre user)

## 18. Fixtures P-1

Script `scripts/test-baseline/p2-access-fixtures.mjs` :

```bash
node scripts/test-baseline/p2-access-fixtures.mjs active    # AccessGrant +90 jours
node scripts/test-baseline/p2-access-fixtures.mjs expired   # AccessGrant endsAt hier
node scripts/test-baseline/p2-access-fixtures.mjs none      # supprime tous les TEST_P2 grants
```

Toutes les fixtures :
- Ciblent uniquement le user `paul+yema_test_monde@example.com`
- Créent / cherchent un `Product PASSAGE + variant EUR A1` marqué test
- Refusent la production (`assertNonProduction` via `_common.mjs`)
- Metadata `{ level, fixture: "TEST_P2_*", note }` pour cleanup ciblé

## 19. E2E · résultats (2026-07-22, P-1)

Playwright authentifié × 3 scénarios × 3 routes = 9 rendus.

| Scénario | /dashboard | /courses | /progress |
|---|---|---|---|
| **monde-ACTIVE** | pageOvf=0 · resume CTA | pageOvf=0 · A1 cards ouvertes | pageOvf=0 · modules réels |
| **monde-EXPIRED** | pageOvf=0 · lock banner | pageOvf=0 · lock banner | pageOvf=0 · progression conservée |
| **monde-NONE** | pageOvf=0 · lock banner | pageOvf=0 · lock banner | pageOvf=0 · empty state |

- **hasFakeName = false** sur les 9 rendus (aucun Sophie Tanda / Marie N.)
- **hasCourse = true** partout (« Beta 1 — Willkommen! » etc. visibles)
- Racines user `GET /fr/courses` → redirect `/fr/dashboard` ✓
- DB post-parcours : **0 order total, 0 order PAID** · **0 AccessGrant hors test**

## 20. Landing

```
Landing /fr : CANONICAL — no visual regression
Landing /en : CANONICAL — no visual regression
```

6 rendus (2 routes × 3 viewports) · `pageOverflow=0`, `leaks=0` classe P2, seul `.seuil-brasier` canonical inchangé.

## 21. Tests · 233/233

- `src/lib/__tests__/monde.test.ts` — 15 assertions (buildA1CourseList, nextIncompleteModule, computeMondeAccess ACTIVE/EXPIRED/NONE, ownership)
- `src/lib/__tests__/discovery.test.ts` — mise à jour A1 courseReady=true, A2-C1 restent false
- `src/app/__tests__/p2-world-student.test.ts` — 24 assertions (dashboard aiguillage, DashboardMonde honnête, courses server component, progress sans classement fictif, layout access enforcement, API 401/403, régression P0.A)

## 22. Statut P2 par tâche

| Point | Statut |
|---|---|
| Audit préalable | ✅ DONE |
| A1 courseReady | ✅ DONE (contenu réel dans repo) |
| A2-C1 verrouillés | ✅ DONE |
| Dashboard Monde | ✅ DONE |
| Catalogue Monde | ✅ DONE |
| Page progress | ✅ DONE |
| Layout modules · access enforcement | ✅ DONE |
| API /api/me/monde-dashboard | ✅ DONE |
| Fixtures active/expired/none | ✅ DONE |
| Bilan · reprise | ✅ DONE (nextIncompleteModule) |
| Suivi professeur | ⏳ HONEST STATE (bientôt disponible) |
| Devoirs · ClassAssignment | 🚫 P4_DEPENDENCY |
| Console professeur | 🚫 P4 |
| Messagerie / notifications réelles | 🚫 P4 |
| Examens blancs / attestation | ⚠️ CONTENT_REVIEW_REQUIRED |
| Notifications backend | 🚫 P4 |
| Paiement · achat | 🚫 P5 |
| PWA | 🚫 P6 |
| Fixtures TEST_MONDE_COMPLETED / NEW | ⚠️ PARTIAL — script actuel gère active/expired/none, les scénarios NEW/COMPLETED demandent une seed de progress séparée (à ajouter au besoin) |

## 23. Checklist pour ajouter un nouveau niveau (A2, B1, …)

1. Créer le contenu réel dans `src/data/a2-beta-modules.ts` (5 leçons × 5 modules minimum)
2. Étendre `COURSE_TO_MODULE_IDS` et `COURSE_LABELS`
3. Mettre à jour `MONDE_LEVEL_AVAILABILITY[level].courseReady = true`
4. Étendre `src/lib/monde.ts` (adapter `buildA1CourseList` en `buildLevelCourseList` OU dupliquer proprement)
5. Ajouter les tests dans `src/lib/__tests__/monde.test.ts`
6. Vérifier que le contenu passe une relecture éditoriale (voir §6 de la doctrine)
7. Aucune promotion tant que les 4 étapes ci-dessus ne sont pas satisfaites

## 24. Blocages honnêtes documentés

- **Notifications push** : infra non branchée · P4/P5
- **Messagerie de classe** : `ClassroomChat` reste vide (P0.A cleanup, P4 messagerie)
- **Suivi professeur** : commercial non ouvert, aucune console pro (P4-6)
- **Attestation** : critères produit à finaliser avec la doctrine avant de générer un PDF
- **Paiement** : `AccessGrant` créés uniquement via fixtures P-1 (P5 branchera CinetPay/Stripe)

## 25. Hardening P2 (2026-07-22)

Second passage sur la même branche · résolutions du prompt hardening :

### État EXPIRED corrigé

Le dashboard exposait un CTA « Reprendre » même quand l'accès était expiré. Refactor du hero en 5 branches distinctes :

| État hero | Détecté quand | CTA principal |
|---|---|---|
| `ACTIVE_START` | grant ACTIVE + progression 0 % | `Commencer · [lesson label]` |
| `ACTIVE_RESUME` | grant ACTIVE + progression partielle | `Reprendre · [next lesson]` |
| `ACTIVE_DONE` | grant ACTIVE + progression 100 % | `Revoir mon parcours` (→ /progress) |
| `EXPIRED` | grant présent, `endsAt <= now` | `Voir les offres` (→ /activation-intent) |
| `NO_ACCESS` | aucun grant | `Choisir un Passage` (→ /activation-intent) |

Les cartes de cours sont grayed out (`opacity: 0.55`) dès que `!active` (EXPIRED ou NO_ACCESS), pas seulement quand l'accès est absent.

### Fixtures étendues à 5 modes

`scripts/test-baseline/p2-access-fixtures.mjs` :

```bash
node scripts/test-baseline/p2-access-fixtures.mjs active     # grant +90j, progress inchangé
node scripts/test-baseline/p2-access-fixtures.mjs new        # grant +90j, TOUS ModuleProgress a1-beta-* effacés
node scripts/test-baseline/p2-access-fixtures.mjs completed  # grant +90j, 25 ModuleProgress COMPLETED seedés
node scripts/test-baseline/p2-access-fixtures.mjs expired    # grant endsAt hier
node scripts/test-baseline/p2-access-fixtures.mjs none       # aucun grant, progress cleared
```

`completed` crée aussi (si absent) le `Course TEST_A1_BETA` + 25 `Module` avec `id = a1-beta-{n}-{type}` pour que les FK `ModuleProgress.moduleId` matchent. Idempotent.

### Feedback exercice accessible

- `AdaptiveQuiz.tsx` : wrapper `role="status" aria-live="polite"` sur le bloc feedback. Texte « Correct. ✅ » / « Incorrect. ❌ » avant l'emoji pour ne pas dépendre uniquement de la couleur.
- `DiscoveryLessonClient.tsx` (P1) : idem sur les feedbacks du QCM discovery.

### E2E hardening (2026-07-22, P-1)

**Matrice 5 états × 3 routes** :

| État | dashboard hero | courses lock | progress | offers CTA |
|---|---|---|---|---|
| `new` | ACTIVE_START | A2-C1 « Bientôt » | 0 % | non |
| `active` | ACTIVE_START/RESUME (dépend progress) | A2-C1 « Bientôt » | réel | non |
| `completed` | ACTIVE_DONE (« Niveau A1 terminé ») | A2-C1 « Bientôt » | 100 % | non |
| `expired` | EXPIRED (« Ton Passage est arrivé à son terme ») | A2-C1 « Bientôt » + banner lock | réel conservé | **oui** |
| `none` | NO_ACCESS | A2-C1 + banner lock | vide/réel | **oui** |

15/15 rendus · `pageOverflow=0` partout · `hasFakeName=false` partout.

**Accès direct au module** (utilisateur EXPIRED ou NONE tentant `/fr/courses/a1-beta-1/modules/a1-beta-1-lesen`) :
- HTTP 200 avec `state-locked` StateBlock rendu
- **Aucun contenu Willkommen/Guten Tag exposé** ✓
- CTA vers `/activation-intent` présent

**E2E EN** (`/en`) :
- `/en/dashboard`, `/en/courses`, `/en/progress` rendent en anglais
- Zéro chaîne française fonctionnelle détectée (`Reprendre`, `Ma progression`, `Bientôt disponible`, `Modules terminés`)
- Locale préservée à chaque redirection

**Reprise fresh browser** :
- Setup · fixture `new` + un seul ModuleProgress `a1-beta-1-lesen` COMPLETED via ORM
- Fresh context → login → `/fr/dashboard` → **hasNextHoeren=true** (le hero pointe sur la prochaine leçon non-complétée) ✓

**Ownership + cross-role** :
- anon `GET /api/me/monde-dashboard` → **401**
- racines · `GET /api/me/monde-dashboard` → **200** avec `hasLP: false`
- teacher · `GET /api/me/monde-dashboard` → **403 FORBIDDEN_NOT_STUDENT**
- racines tentant `/fr/courses/a1-beta-1/modules/a1-beta-1-lesen` → HTTP 200 avec state-locked, aucun contenu Willkommen leaké

**DB post-parcours** :
```
orders: 0 · ordersPaid: 0 · nonTestActiveGrants: 0
```

### Tests · 249/249

- `src/app/__tests__/p2-hardening.test.ts` — 15 assertions (5 hero states, EXPIRED sans Reprendre, fixtures 5 modes, feedback role=status, régression IA/fake prof/paiement)
- Suite complète : 20 fichiers, **249 tests**

### Statut post-hardening

| Point | Statut |
|---|---|
| État EXPIRED (CTA correct) | ✅ DONE |
| État COMPLETED (revoir parcours) | ✅ DONE |
| Fixtures new + completed | ✅ DONE |
| Accès direct module refusé | ✅ DONE (server layout) |
| Feedback exercice accessible | ✅ DONE (aria-live polite + texte distinct de la couleur) |
| E2E FR/EN + reprise | ✅ DONE |
| Ownership cross-role | ✅ DONE |
| Landing intacte | ✅ DONE |
| Suivi professeur | ⏳ HONEST STATE (Bientôt disponible) |
| Devoirs, messagerie, notifs backend | 🚫 P4_DEPENDENCY |
| Examens blancs / attestation | ⚠️ CONTENT_REVIEW_REQUIRED |
| Paiement | 🚫 P5 |

## 26. Décision

```
P2 READY TO MERGE
```

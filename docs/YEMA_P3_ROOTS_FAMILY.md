# YEMA · P3 · Expérience Racines et Famille

> **Livrable du lot `feat/yema-p3-roots-family`** (base `main@83f54f7`, 2026-07-23). Construit l'espace Racines (Solo & Famille), l'architecture de progression É1-É5 et la gestion des profils enfants existants — **sans inventer de contenu culturel**.
>
> P3 est **volontairement contraint** par la doctrine §6-7 : tant qu'aucune langue Racines n'a de contenu éditorial validé (4 leçons complètes, exercices déterministes, audios approuvés, droits éditoriaux clairs), on ne rend PAS de leçons. On construit seulement le foyer, les profils, les permissions, l'architecture de progression et les états honnêtes « Bientôt disponible ».

## 1. Statut du contenu Racines

| Langue | Statut | Contenu prêt |
|---|---|---|
| Wolof | `MISSING` | 0 leçon |
| Douala | `MISSING` | 0 leçon |
| Lingala | `MISSING` | 0 leçon |
| Bambara | `MISSING` | 0 leçon |

**`anyRacinesLanguageReady() === false`** · **`P3 CONTENT BLOCKED`** au niveau langue.

Cette décision est explicitement documentée dans `src/lib/racines.ts` (`RACINES_LANG_STATUS`). Elle sera reprise par un futur lot dédié quand une langue pilote sera prête (voir checklist §14).

## 2. Routes

| Route | Rôle | Statut |
|---|---|---|
| `/[locale]/dashboard` | Server aiguillage Monde/Racines · Racines → `<DashboardRacines>` (nouveau P3) | ✅ DONE |
| `/[locale]/famille` | Écran famille existant (P1) · liste + création profils enfants | ✅ KEEP |
| `/[locale]/famille/enfant/[profilId]` | Détail profil enfant existant · ownership serveur | ✅ KEEP |
| `/[locale]/progress` | Vue progression P2 · lit ModuleProgress (Racines n'a pas encore de modules) | ✅ KEEP |
| `/[locale]/classroom` · `/[locale]/notifications` · `/[locale]/group` | États honnêtes hérités de P0.A · P2 · P4 messagerie viendra brancher | ⏳ HONEST STATE |
| `GET /api/me/racines-dashboard` | Nouvel endpoint · retourne LP + children + langStatus + steps | ✅ DONE |
| `GET/POST /api/family/children` | Existant P1 · parentUserId server-resolved | ✅ KEEP |
| `PATCH/DELETE /api/family/children/[id]` | Existant P1 · ownership 404 cross-parent confirmé | ✅ KEEP |

## 3. Étapes É1-É5 (doctrine §8)

Source unique : `src/lib/racines.ts` (`RACINES_STEP_DEFINITIONS`, réutilise `NATAL_STEPS` de `src/lib/childScales.ts` déjà existant).

| Étape | Label FR | Label EN | Rôle |
|---|---|---|---|
| **É1** | Écoute | Listen | Reconnaître, écouter, mémoriser, comprendre des éléments simples |
| **É2** | Voix | Voice | Répéter, prononcer, dire des phrases simples |
| **É3** | Récit | Tale | Comprendre et raconter une histoire courte |
| **É4** | Palabre | Talk | Dialoguer, poser des questions, participer à une conversation |
| **É5** | Foyer | Home | Transmettre, raconter aux proches, utiliser la langue en famille |

**Aucun mapping vers CECRL** · les vitest garantissent l'absence de A1..C1 dans les labels/descriptions Racines.

## 4. Dashboard Racines

`DashboardRacines` (client) consomme `/api/me/racines-dashboard`. Blocs :

- **En-tête** · universe kicker, greeting, mode (Solo/Famille), étape É actuelle + label
- **Contenu langue** · `StateBlock kind="empty"` « Ta langue Racines arrive bientôt » tant que `!anyLanguageReady`
- **Foyer** (si `mode === "FAMILY"`) · liste des profils enfants réels avec bouton « Ouvrir » + « Gérer les profils »
- **Le chemin Racines** · 5 cartes É1-É5 avec définition doctrinale, mise en évidence de l'étape active
- **Coach** · état sobre « Bientôt disponible » (RACINES_COACH_OPERATIONAL=false)
- **Cercle** · état sobre « Le cercle de ta maison sera disponible prochainement »

## 5-6. Solo vs Famille

Le mode est **dérivé** de `ChildProfile.count` :
- `count === 0` → SOLO (aucun profil enfant)
- `count >= 1` → FAMILY (au moins un profil enfant)

Cette dérivation vit dans `inferProfileMode(childrenCount)` (`src/lib/racines.ts`), testée unitairement.

### Capacité famille · doctrine

- Jusqu'à 2 adultes (HouseholdMembership OWNER + MEMBER)
- Jusqu'à 4 enfants (ChildProfile ou DependentProfile)

Le schéma Prisma actuel supporte ces règles via `Household` + `HouseholdMembership` + `ChildProfile`/`DependentProfile`. **Aucune limite n'est encore appliquée côté API** (P1 crée sans compter) — à ajouter en P4/P5 quand le paiement débloquera l'offre.

## 7. Profils enfants

Modèle utilisé : `ChildProfile` (Prisma) avec les champs :
- `prenom` (obligatoire)
- `avatarAnimal` (parmi 6 valeurs)
- `age` (int, 3-12)
- `langues` (JSON `ChildLangue[]`)
- `activeLangue` (id de la langue active)

**Ne demande pas** : nom complet, école, adresse, photographie, données de santé.

Toutes les fixtures P-1 portent le préfixe `TEST_` (ex. `TEST_Ade`, `TEST_Yara`).

## 8. Changement de profil

L'existant `/famille` gère le sélecteur « Qui apprend ce soir ? » avec persistance et navigation par carte.

Une bascule programmatique (server-side) n'est pas nécessaire en P3 : l'API `/api/family/children/[id]` PATCH permet déjà de mettre à jour `activeLangue`. Le changement de profil actif est un choix UI, pas une opération DB en P3.

## 9. Ownership et permissions

**Server-side · toutes les APIs vérifient** :

- Session Supabase (401 si absente)
- `parentUserId = supabaseUser.id` (résolu via `getParent()` dans `/api/family/children`) · un client ne peut PAS passer un `parentUserId` étranger
- `PATCH /api/family/children/[id]` sur un enfant d'un autre parent → **404** (findFirst avec parentUserId → null)
- `DELETE /api/family/children/[id]` idem → **404**
- Page `/fr/famille/enfant/[id]` d'un enfant étranger → HTTP 200 mais aucune donnée de l'enfant leaké (empty state)

**API `/api/me/racines-dashboard`** ajoute deux protections supplémentaires :
- 401 si anon
- 403 `FORBIDDEN_NOT_STUDENT` si l'utilisateur n'a pas de UserRole STUDENT ACTIVE

### Matrice de rôles

| Action | Parent principal | Adulte membre | Enfant |
|---|:-:|:-:|:-:|
| Voir le foyer (`/famille`) | ✓ | membership limité | son profil uniquement |
| Ajouter un enfant | ✓ | selon permission | ✗ |
| Modifier un enfant | ✓ (le sien) | selon permission | ✗ |
| Supprimer un enfant | ✓ (le sien) | selon règle produit | ✗ |
| Voir progression | ✓ (tous les enfants) | selon permission | son profil |
| Changer d'offre commerciale | 🚫 P5 | 🚫 P5 | ✗ |
| Gérer le coach | 🚫 P4/P5 | 🚫 P4/P5 | ✗ |

**Limitation actuelle documentée** : le concept d'« adulte membre » (deuxième adulte du foyer) est modélisé (`HouseholdMembership`) mais l'UI famille P1 ne le gère pas encore explicitement. La deuxième adulte est un enrichissement post-P5.

## 10. Coach Racines

Doctrine · reste inchangée :
- **30 000 XAF / 45 € par mois** (prix P0.A)
- `RACINES_COACH_OPERATIONAL = false`

P3 n'implémente **rien** côté coach : aucune console, aucun quota, aucune session simulée, aucun feedback fictif. Le dashboard Racines affiche uniquement un état sobre « Bientôt disponible ».

## 11. Cercle Racines — décision structurelle

Voir document dédié : **`docs/YEMA_P3_CIRCLE_DECISION.md`** (Option A `Circle` vs Option B `Class` étendu).

**Décision recommandée : Option A · nouvelle entité `Circle`.** Motifs principaux :
- Sémantique · une classe (Monde) est pédagogique et publique (rejoignable via code); un cercle (Racines) est privé au foyer + coach optionnel
- Sécurité mineurs · un cercle Racines ne peut jamais être « rejoint via code » comme une classe. Une entité distincte force le compilateur à vérifier chaque code path
- Permissions différentes (parent · enfant · coach) qui ne correspondent pas 1:1 aux permissions Class (teacher · student)

**P3 ne crée AUCUNE migration.** La décision est documentée pour être appliquée en P4-3b (dépendance de la messagerie coach).

## 12. Group / Classroom

- `/classroom` (root) · déjà nettoyé en P2 hardening · rend un état vide honnête. Aucun faux professeur.
- `/group` · reste tel quel (Monde community, hors scope Racines).
- Le composant `ClassroomChat` reste en `StateBlock empty` (P0.A cleanup).

## 13. Notifications

P3 ne crée aucune fausse notification. L'infra notif restera P4/P5.

## 14. Fixtures P-1

**Réutilisées de P1** (`scripts/test-baseline/_common.mjs` + `create-test-baseline.mjs`) :

- `paul+yema_test_racines_solo@example.com` · STUDENT Racines Solo (aucun enfant, LP RACINES/wolof)
- `paul+yema_test_racines_family@example.com` · STUDENT Racines Famille + `Household` + 2 ChildProfile (`TEST_Ade` lingala natif, `TEST_Yara` deutsch foreign)

Aucune fixture P3 supplémentaire nécessaire · les 2 comptes ci-dessus couvrent Solo, Family, cross-household, no-content.

## 15. E2E · résultats (2026-07-23, P-1)

Script Playwright : `scripts/test-baseline/p3-e2e.mjs`.

**Sweep viewports** (Family @ /fr/dashboard) : 4/4 pageOverflow=0.

**Solo + Family × 5 routes** : 10 rendus · pageOverflow=0 · `hasFakeName=false` partout · `hasCECR=false` partout.

**EN** (Family) : /en/dashboard, /en/famille · pageOverflow=0.

**Cross-household** (Solo tente accès à un enfant de Family) :
- `PATCH /api/family/children/[family-kid-id]` → **404**
- `DELETE /api/family/children/[family-kid-id]` → **404**
- Page `/fr/famille/enfant/[family-kid-id]` → HTTP 200 mais aucun nom d'enfant leaké dans le DOM

**Anonymous / cross-role** :
- anon `GET /api/me/racines-dashboard` → **401**
- monde user (STUDENT sans Racines LP) → **200** avec `hasLearningPath: false`
- teacher → **403 FORBIDDEN_NOT_STUDENT**

**DB post-parcours** :
- 0 order · 0 order PAID · 0 AccessGrant hors fixture · 2 ChildProfile (les 2 seedés TEST_)

## 16. Checklist pour activer une langue Racines

1. Produire le contenu réel dans `src/data/racines-<lang>-content.ts` (au moins 4 modules équivalents É1-É5)
2. Confirmer les droits éditoriaux (RACINES_CONTENT_APPROVED = true dans la fixture)
3. Étendre `RACINES_LANG_STATUS[lang] = "READY"` (`src/lib/racines.ts`)
4. Ajouter la route rendue lecture/exercice (à décider dans le lot dédié)
5. Vérifier `anyRacinesLanguageReady()` → true dans les tests
6. Mettre à jour le tableau §1 du présent doc
7. Ne pas activer si un seul des points précédents n'est pas satisfait

## 17. Statut P3 par tâche

| Point | Statut |
|---|---|
| Audit contenu Racines | ✅ DONE (4 langues MISSING) |
| Seam `src/lib/racines.ts` (É1-É5 + statut) | ✅ DONE |
| API `/api/me/racines-dashboard` | ✅ DONE (401, 403, ownership) |
| DashboardRacines (Solo + Family) | ✅ DONE |
| Aiguillage `/dashboard` Racines → DashboardRacines | ✅ DONE |
| `/famille` + profils enfants (existants P1) | ✅ KEEP |
| Ownership cross-household confirmé | ✅ DONE (404 sur PATCH/DELETE) |
| Sélecteur de profil enfant | ✅ KEEP (existant P1) |
| Contenu langue Racines | 🚫 CONTENT_REQUIRED + RIGHTS_REVIEW_REQUIRED |
| Récits / veillées / audios | 🚫 CONTENT_REQUIRED |
| Coach console | 🚫 P4 |
| Vraie messagerie / cercle | 🚫 P4 |
| Décision cercle A/B | ✅ DONE (docs/YEMA_P3_CIRCLE_DECISION.md) |
| Paiement Racines | 🚫 P5 |
| PWA / native | 🚫 P6 |

## 18. Décision

```
P3 READY TO MERGE
```

Le lot livre l'architecture Racines complète et honnête : structure de progression É1-É5, dashboard distinct de Monde, ownership strict des profils enfants, aiguillage par univers, décision cercle documentée. **Aucune fausse langue Racines n'est présentée comme opérationnelle** — la doctrine §6-7 est respectée à la lettre.

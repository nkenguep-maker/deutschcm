# YEMA — Feuille de route d'implémentation produit

> **La landing `/fr` et `/en` est CANONICAL et n'apparaît dans aucun lot d'implémentation sans autorisation explicite de Paul.**
>
> Compagnon direct de `YEMA_PRODUCT_DESIGN_DOCTRINE.md` et `YEMA_PRODUCT_GAP_ANALYSIS.md`. La roadmap est organisée en 7 lots (P0 à P6) avec des tâches suffisamment petites pour être implémentées et testées séparément.

Références :
- Base : `main@2776fab` (Phase A.1 mergée)
- Branche courante : `docs/yema-product-doctrine`
- Phase A.2 (`fix/yema-phase-a2-data-migration`) doit être mergée avant le lot P0.

Estimation : **S** (< 4h), **M** (4-8h), **L** (1-2 jours), **XL** (3-5 jours).

---

# Lot P-1 — Baseline authentifiée

**Objectif utilisateur** : donner à l'équipe produit et design la capacité d'observer réellement le rendu des pages authentifiées avant toute recommandation définitive. Sans cette baseline, toutes les décisions concernant les dashboards, l'espace famille, les espaces professionnels et l'admin restent provisoires (voir gap analysis, marquage `CODE_AUDITED_VISUAL_PENDING`).

**Pages concernées** : préparation environnement + comptes de test + captures. Aucune modification visuelle de page produit dans ce lot.

**Prérequis** :
- Phase A.2 (`fix/yema-phase-a2-data-migration`) mergée sur `main` (sinon `child_profiles` crashe à la création enfant).
- Accès Supabase Auth admin pour créer les comptes.
- Base de test isolée (soit Supabase de dev, soit embedded-postgres pour scénarios locaux).

## P-1.1 · Créer les comptes de test

- **Livrable** : 6 comptes documentés dans un fichier privé non tracké (ex. `.claude/test-accounts.md` avec `.gitignore`) :
  - `student-monde@yema.test` — STUDENT + LearningPath MONDE/deutsch/A1
  - `racines-solo@yema.test` — STUDENT + LearningPath RACINES/wolof + abonnement Solo
  - `racines-famille@yema.test` — STUDENT + Household FAMILY OWNER + 2 enfants (avatarAnimal, langues)
  - `teacher@yema.test` — TEACHER + Teacher profile + 1 classroom + 3 étudiants attribués
  - `center@yema.test` — CENTER + LanguageCenter + 2 enseignants rattachés
  - `admin@yema.test` — ADMIN + rôle YEMA_ADMIN
- **Fichiers** :
  - `scripts/seed-test-accounts.mjs` (nouveau, tracké) : idempotent, crée les 6 comptes via Supabase admin + Prisma en une commande.
  - `.claude/test-accounts.md` (ignoré, contient les mots de passe temporaires).
- **Critère d'acceptation** : `node scripts/seed-test-accounts.mjs` réussit et permet de se connecter aux 6 comptes.
- **Risque** : moyen — nécessite `SUPABASE_SERVICE_ROLE_KEY` correcte.
- **Estimation** : **M**.

## P-1.2 · Données de test clairement identifiées

- **Livrable** : chaque donnée créée par le seed porte un préfixe visible (ex. `[TEST]` dans les noms, `test_` dans les IDs) pour éviter la confusion avec de vraies données de démo. Documenté dans `docs/YEMA_TEST_DATA_CONVENTION.md`.
- **Critère d'acceptation** : `git grep test_` retrouve les données ; aucune donnée de test ne fuit dans les recommandations comme si elle était réelle.
- **Estimation** : **S**.

## P-1.3 · Captures Playwright authentifiées

- **Livrable** : sweep équivalente au sweep publique déjà effectuée mais avec session pour chaque compte.
- **Breakpoints obligatoires** : 360 × 800, 390 × 844, 768 × 1024, 1440 × 900.
- **Pages ciblées** :
  - `/fr/dashboard` (avec chacun des 3 profils étudiants distincts)
  - `/fr/famille` (avec racines-famille)
  - `/fr/famille/enfant/[id]`
  - `/fr/courses`, `/fr/progress`, `/fr/settings`, `/fr/notifications`
  - `/fr/classroom`, `/fr/classroom/join`, `/fr/classroom/[id]`
  - `/fr/group`, `/fr/group/create`, `/fr/group/join`
  - `/fr/teacher` + toutes les 9 pages teacher
  - `/fr/center` + les 5 pages center
  - `/fr/admin` + les 6 pages admin
  - `/fr/onboarding/*` (monde, racines, teacher, center)
- **Fichier script** : `scripts/authenticated-sweep.mjs` (tracké, réutilise l'infra de `scripts/doctrine-sweep.mjs` supprimée).
- **Sortie** : rapport tabulaire équivalent à celui du sweep publique + screenshots temporaires dans `/tmp/yema-shots/` (non commités).
- **Critère d'acceptation** : rapport listant pour chaque page-viewport : HTTP, overflow, ai_btns=0, sim_links=0, body length, H1 réel, présence des sections doctrinales attendues.
- **Estimation** : **L**.

## P-1.4 · Inventaire des placeholders

- **Livrable** : enrichir `YEMA_PRODUCT_GAP_ANALYSIS.md` §11 avec la liste exacte des fausses données observées sur chaque dashboard authentifié (ex. courses fictifs, étudiants "Alice/Bob", statistiques inventées, portraits stock).
- **Critère d'acceptation** : chaque placeholder listé avec route + fichier + capture + recommandation limitée.
- **Estimation** : **M**.

## P-1.5 · Test des permissions

- **Livrable** : matrice testant pour chaque rôle × chaque route protégée :
  - Accès autorisé ✓
  - Accès refusé ✗ (attendu 403 ou redirect)
  - Contenu leaké (bug : rôle étudiant voit données prof)
- **Fichier** : `scripts/permissions-matrix.mjs` (tracké).
- **Sortie** : `docs/YEMA_PERMISSIONS_MATRIX.md` (généré, tracké).
- **Critère d'acceptation** : aucun leak cross-rôle détecté ; toute exception documentée.
- **Estimation** : **L**.

## P-1.6 · Lever les marqueurs `CODE_AUDITED_VISUAL_PENDING`

- **Livrable** : mise à jour de `YEMA_PRODUCT_GAP_ANALYSIS.md` §4 : chaque page authentifiée voit son marqueur remplacé par `RENDERED_AUTHENTICATED` (avec date) ou reste `CODE_AUDITED_VISUAL_PENDING` si non observée.
- **Contrainte critique** : **aucune modification visuelle** dans ce lot. Uniquement observation, documentation et enrichissement des recommandations.
- **Critère d'acceptation** : gap analysis à jour, tous les items P0-P6 dont les preuves manquaient sont désormais assis sur du réel.
- **Estimation** : **S**.

**Total P-1** : **L à XL** selon capacité seed + rendu Playwright. Bloqueur pour toute décision définitive sur P2, P3, P4.

---

# Lot P0.A — Corrections fonctionnelles et commerciales

**Objectif utilisateur** : éliminer les bugs et incohérences bloquant la bêta avant toute finition UI. Ce lot ne touche à aucun design — il ajuste routes, prix, catalogue et alignement DB.

**Pages concernées** : `/enseignants` (routing), `/pricing/*` (données), catalogue Prisma, `child_profiles` (merge A.2).

**Composants créés** : aucun. **Aucun redesign.**

## P0.A-1 · Publier `/enseignants` (retirer de la protection proxy)

- **Fichier** : `src/proxy.ts`
- **Change** : ajouter `"/enseignants"` à `PUBLIC_ROUTES`.
- **API** : aucune.
- **Test** : Playwright — `/fr/enseignants` retourne H1 réel (pas "Rentrez"), body > 500.
- **Critère d'acceptation** : sweep 5 breakpoints, HTTP 200 direct, aucun redirect vers `/login`.
- **Risque** : nul.
- **Estimation** : **S** (< 30 min).

## P0.A-2 · Aligner la grille tarifaire Monde §17

- **Fichier** : `src/lib/pricing.ts` (`WORLD_PASSAGE_PRICES`)
- **Change** :
  ```
  A2: 55000 XAF / 79 €
  B1: 59000 XAF / 89 €
  B2: 69000 XAF / 109 €
  C1: 79000 XAF / 129 €
  ```
- **API** : aucune (`/api/pricing` si présent lit `pricing.ts`).
- **Test** : vitest `pricing.test.ts` snapshot des 5 niveaux + comparaison à la doctrine.
- **Critère d'acceptation** : `/fr/pricing/monde` affiche les 5 niveaux avec la nouvelle grille.
- **Risque** : bas — 4 valeurs à changer.
- **Estimation** : **S**.

## P0.A-3 · Ajouter le produit `COACH_RACINES_ADDON` (prix unique)

- **Doctrine** : "Suivi humain Racines" §1-2 : **30 000 XAF / 45 € par mois, prix unique** quelle que soit l'étape É1-É5.
- **Fichiers** :
  - `prisma/schema.prisma` : ajouter `COACH_RACINES_ADDON` à l'enum `ProductCode` si absent (nouvelle migration additive dédiée si nécessaire — pas dans A.2).
  - `prisma/seed.ts` : Product idempotent + variants XAF/EUR mensuels + entitlement rules (HUMAN_FEEDBACK mappé sur la Capability existante appropriée, AI_TEXT/AI_VOICE restent Non).
  - `src/lib/pricing.ts` : ajouter `RACINES_COACH_PRICE = { fcfa: 30000, eur: 45 }` (constant, jamais recalculé selon étape).
  - `src/app/[locale]/pricing/racines/page.tsx` : section "Suivi coach de langue" séparée du Solo/Famille, présentation conforme au bloc "§8 Présentation dans le paywall" de la spec Suivi humain.
- **Règles produit** (à respecter dans l'UI) :
  - prix identique É1→É5
  - par personne accompagnée (1 profil)
  - mensuel, renouvelable, résiliable pour le mois suivant
  - Famille : suivi couvre un seul profil sélectionné, pas les 6 membres
  - jusqu'à 8 productions/mois, max 2/semaine, oral ≤ 3 min ou écrit ≤ 250 mots
  - 1 session individuelle 30 min/mois, non cumulable
  - délai indicatif 48 h ouvrées sous réserve de capacité
- **API** : entitlements existants suffisent (relire `src/lib/entitlements/README.md`).
- **Test** : test d'intégration seed + `getEntitlements({ capability: "HUMAN_FEEDBACK", ... })`.
- **Critère d'acceptation** : `/fr/pricing/racines` affiche 3 blocs (Solo, Famille, +Coach 30 000 XAF/45 €) avec règle "prix identique É1→É5".
- **Risque** : moyen — nouvelle migration si enum modifiée.
- **Estimation** : **M**.

## P0.A-4 · Cohérence des devises §19

- **Fichier** : `src/lib/pricing.ts` (fonctions `fmtFcfa`, `fmtEur`) — vérifier utilisation partout (`/pricing/monde`, `/pricing/racines`, ActivationScreen).
- **Change** : garantir qu'une seule devise s'affiche à la fois par page, que la valeur par défaut est régionale et que le sélecteur ne convertit pas en temps réel (prix officiels préparés).
- **Test** : sweep FR + EN, contrôle qu'aucune page n'affiche `€` et `XAF` simultanément.
- **Critère d'acceptation** : conformité à §19 doctrine (sélecteur unique, formatage local correct).
- **Estimation** : **S**.

## P0.A-5 · Réserver la terminologie "Coach carrière Europe" §24.3

- **Doctrine** : le coach carrière est distinct du coach Racines et du professeur Monde. **Non lancé en bêta.**
- **Fichiers** :
  - `src/lib/roles.ts` / Prisma `AppRole` : vérifier que `CAREER_COACH` existe (déjà présent post-A.1 selon `prisma/migrations/20260721*/migration.sql:17`).
  - `docs/` : documenter dans la doctrine (déjà fait §10 Coaching carrière Europe) et dans le seed `Product.CAREER_COACH_ADDON` si présent (**ne pas exposer dans l'UI pendant la bêta**).
- **Contraintes bêta** :
  - Aucun écran carrière construit.
  - Aucune promesse d'emploi / visa / salaire.
  - Éventuelle liste d'attente discrète autorisée uniquement.
- **Critère d'acceptation** : recherche `grep -r "coach carrière\|CAREER_COACH\|coaching carrière" src/app/[locale]` ne retourne aucune page utilisateur exposée.
- **Estimation** : **S**.

## P0.A-6 · Merger Phase A.2 avant tout écran famille supplémentaire

- **Prérequis** : sur `main`.
- **Commande** : `git merge --no-ff fix/yema-phase-a2-data-migration -m "merge: yema phase a2 data migration"`.
- **Test** : `npm test && npx tsc --noEmit && npm run build` sur main.
- **Critère d'acceptation** : `child_profiles` DB aligné, `prisma.childProfile.create` ne crashe plus.
- **Estimation** : **S**.

**Total P0.A** : **M à L**. Aucun design touché.

---

# Lot P0.B — Fondations UI communes

**Objectif utilisateur** : outiller les futurs lots (P1-P6) avec les primitives strictement nécessaires (états fonctionnels, primitives responsive, accessibilité de base, progression) sans construire un design system abstrait disproportionné.

**Pages concernées** : aucune page produit modifiée. Uniquement composants transverses.

**Contrainte majeure** : ne pas créer `PremiumCard`, `ModernButton`, `FancyPanel`, `DashboardCardV2`, `UniversalLayout` — respect §33.2 doctrine.

## P0.B-1 · Compléter les états de `StateBlock` si manquants

- **Fichier** : `src/components/StateBlock.tsx` (canonical, ne pas refondre).
- **Change** : vérifier que les 5 kinds (`error`, `empty`, `loading`, `success`, `confirm`) rendent bien tous les sous-états attendus par §9 doctrine. Ajouter uniquement les variantes manquantes.
- **Test** : vitest snapshot des 5 kinds × présence/absence de `body`, `action`, `secondary`.
- **Critère d'acceptation** : chaque kind rend correctement, focus visible, aria-live sur `error`.
- **Estimation** : **S**.

## P0.B-2 · Vérifier `OnboardingProgress` pour les futurs lots §11

- **Fichier** : `src/components/OnboardingProgress.tsx` (54 lignes existantes).
- **Change** : vérifier prop `step` et `total`, ajouter variante segmentée "1/4 · 2/4 · 3/4 · 4/4" §15.3 si manquante.
- **Critère d'acceptation** : composant réutilisable par les 3 écrans du funnel (portes, langue, auto-éval) et par les 4 cours de découverte.
- **Estimation** : **S**.

## P0.B-3 · Créer l'adaptateur `getStaticQuestions` pour `AdaptiveQuiz`

- **Fichier** : `src/lib/quizAdapter.ts` (nouveau).
- **Contenu** : `getStaticQuestions(level, topic): Question[]` piochant dans la banque existante `/api/test-niveau/questions` (30 questions statiques post-A.1).
- **Callers à câbler** : `courses/[courseId]/modules/[moduleId]/page.tsx` (ligne ~1055), `quiz/demo/page.tsx`.
- **Test** : appel `getStaticQuestions("A1", "salutations")` renvoie au moins 6 questions déterministes.
- **Critère d'acceptation** : `AdaptiveQuiz` n'affiche plus l'état vide canonique dans les 2 callers connus.
- **Estimation** : **S**.

## P0.B-4 · Enrichir `AudioPlayer` (transcript, vitesse, badge) §15.4

- **Fichier** : `src/components/AudioPlayer.tsx` (post-A.1 slim).
- **Ajouts (props optionnels, rétrocompatibles)** :
  - `transcript?: string` avec section repliable
  - `speeds?: number[]` (par défaut `[0.75, 1, 1.25]`) via `playbackRate`
  - `showBadge?: boolean` pour badge "voix enregistrée"
  - `speaker?: string`, `duration?: string` pour l'en-tête
- **Test** : rendu identique quand aucun prop nouveau passé (rétrocompatibilité).
- **Critère d'acceptation** : aucune régression sur `courses/[courseId]/modules/[moduleId]`, nouvelles props fonctionnelles dans un test isolé.
- **Estimation** : **M**.

## P0.B-5 · Documenter la référence tokens / typo / grille / rayons

- **Fichier** : `docs/YEMA_TOKENS_REFERENCE.md` (nouveau, optionnel).
- **Contenu** : recopier §6 (palette) + §5.2 (typo) + §7 (grille) + §8 (rayons) sous forme de tableaux exécutables pour les futurs commits.
- **Critère d'acceptation** : chaque PR future peut renvoyer à ce doc au lieu de re-consulter la doctrine complète.
- **Estimation** : **S**.

## P0.B-6 · Audit rapide responsive commun

- **Livrable** : passe manuelle sur `/fr/discover` et `/fr/goodbye` pour identifier l'élément qui overflow à 360/390 (P2 dans le gap analysis, mais l'observation reste utile ici).
- **Change** : **aucune correction dans ce lot** — uniquement documentation dans une annexe.
- **Estimation** : **S**.

## P0.B-7 · Focus visible + cibles tactiles 44×44 §7.5

- **Livrable** : audit ciblé sur `LandingNav` + boutons `StateBlock` + inputs `login/register` — mesurer les cibles et documenter les écarts sans modifier.
- **Change** : **aucune correction dans ce lot** (corrections planifiées P3).
- **Estimation** : **S**.

**Total P0.B** : **M**. Aucun redesign, aucune nouvelle typo, aucune nouvelle palette.

---

# Lot P1 — Funnel

> **Statut d'implémentation** (branche `feat/yema-p1-funnel`, hardening 2026-07-22) :
> - P1-1 (portes) : ✅ DONE — routeur `/onboarding` avec dérivation d'état DB-first.
> - P1-2 (choix langue) : ✅ DONE — `LANGUAGES` unique source, `/decouverte/attente` honnête, disponibilité `MONDE_LEVEL_AVAILABILITY` indépendante des prix.
> - P1-3 (auto-évaluation) : ✅ DONE — vrais écrans `/onboarding/{monde,racines}/niveau` avec 5 options par univers, persistance `selfAssessmentAnswer` + `declaredLevel` + `recommendedLevel`, wording indicatif.
> - P1-4 (4 leçons découverte) : ✅ DONE deutsch A1 · 🚫 BLOCKED — CONTENT MISSING pour Racines (aucun contenu seedé), A2-C1 Monde verrouillés (`discoveryReady=false`).
> - P1-5 (bilan + activation) : ✅ DONE — verrouillage A2-C1 avec badge « Bientôt disponible », Racines `RACINES_OFFERS_AVAILABLE=false` → StateBlock empty.
> - Sécurité : ✅ DONE — proxy `/decouverte`/`/activation-intent`/`/onboarding` = STUDENT strict (ADMIN exclu), API `/api/funnel` refuse non-STUDENT (403 FORBIDDEN_NOT_STUDENT), ownership session-based.
> - Reprise : ✅ DONE — fresh browser context → next non-completed lesson.
> - Vérifications 2026-07-22 : 24/24 rendus avec `pageOverflow=0` (360/390/768/1440 × 6 routes), 0 order/entitlement en DB post-parcours, landing FR/EN CANONICAL sans régression.
> - Détail complet : voir `docs/YEMA_P1_FUNNEL.md` §15.

**Objectif utilisateur** : permettre à un nouvel inscrit d'aller de "compte créé" à "premier cours de découverte terminé" sans friction, en respectant les 6 étapes doctrinales.

**Pages concernées** : `/setup-role`, `/entree` (nouveau), `/onboarding/*`, `/decouverte/*` (nouveau), `/activation`.
**Composants réutilisés** : `OnboardingProgress`, `BrandY`, `StateBlock`, `AudioPlayer`, `DialogPlayer`, `AdaptiveQuiz`, `LessonComplete`.
**Composants à créer** : `TerritoireChoix`, `LangueChoix`, `AutoEvaluation`, `DecouverteShell`, `DecouverteFin`.

## P1-1 · Écran "portes" §12 (choix territoire)

- **Route** : refonte du fallback `/onboarding` (fichier existant) OU nouvelle `/entree`.
- **Doctrine** : §12 — Fraunces "Par où commence ton voyage ?", indicateur "Étape 1 sur 3", deux portes (Monde brass + Racines terracotta) avec interaction hover/focus premium.
- **Fichier** : `src/app/[locale]/onboarding/page.tsx` (branche fallback).
- **API** : `POST /api/onboarding` avec `{ universe: "MONDE" | "RACINES" }`.
- **Composant** : `<TerritoireChoix locale={...} progress={{step: 1, total: 3}} />`.
- **Tests** : navigation clavier, deux portes cliquables et deux liens de secours.
- **Critère d'acceptation** : depuis `/login → next=/onboarding`, un utilisateur choisit et arrive sur `/onboarding/monde` ou `/onboarding/racines`.
- **Estimation** : **M**.

## P1-2 · Écran "choix langue" §13 (Monde + Racines)

- **Routes** : `/onboarding/monde/langue`, `/onboarding/racines/langue`.
- **Doctrine** : §13 — pas de drapeaux, monogramme+nom+région+cert, active vs bientôt clairement séparés.
- **Fichier** : `src/app/[locale]/onboarding/[universe]/langue/page.tsx` (Client Component + server wrapper avec `requireSession`).
- **Registre** : `src/lib/languages.ts` déjà présent (bassa, wolof, swahili, lingala, douala, ewondo, fulfulde, yoruba pour sources ; deutsch, anglais, français pour world).
- **API** : `POST /api/learning-paths` avec `{ universe, language }` (déjà existant).
- **Composant** : `<LangueChoix territoire="monde"|"racines" active={langues actives} bientot={langues à venir} />`.
- **Critère d'acceptation** : allemand seul actif côté Monde ; côté Racines, uniquement les langues validées éditorialement (décision produit §35.1 à fermer).
- **Estimation** : **M**.

## P1-3 · Auto-évaluation déclarative §14

- **Routes** : `/onboarding/monde/depart`, `/onboarding/racines/depart`.
- **Doctrine** : §14 — pas de test, 4 options Monde (A1 zéro, A1 bases, A2 débrouille, B1 conversation), 4 options Racines (découvre, reconnaît, comprend, parle+lecture).
- **Fichier** : `src/app/[locale]/onboarding/[universe]/depart/page.tsx`.
- **API** : `PATCH /api/learning-paths` avec `{ currentLevel, onboardingAnswers.autoEval }`.
- **Composant** : `<AutoEvaluation options={[...]} onSelect={(v) => ...} />`.
- **Critère d'acceptation** : sélection persistée, back button conserve la valeur.
- **Estimation** : **M**.

## P1-4 · Parcours "quatre cours découverte" §15

- **Routes** : `/decouverte/salutations`, `/decouverte/presentation`, `/decouverte/nombres`, `/decouverte/revision`.
- **Doctrine** : §15 — contexte, audio enregistré, transcript, vocabulaire, mini-exercice, feedback immédiat, progression, prochaine étape.
- **Fichier** : `src/app/[locale]/decouverte/[step]/page.tsx` (Client Component) + `content/decouverte/monde/deutsch/*.json` (fixtures statiques).
- **API** : `POST /api/decouverte/progress` (nouvelle) pour persister l'avancement.
- **Composants** : `DecouverteShell` (progress 1/4, header, footer), réutilise `AudioPlayer` (avec `src` audio réel), `DialogPlayer`, `AdaptiveQuiz` (avec `questions` statiques).
- **Contenu** : 4 leçons statiques allemand (salutations, présentation, nombres, révision). Audios à enregistrer en amont (§35.9 décision à fermer avec locuteur natif).
- **Tests** : progression persistée dans localStorage (offline-friendly) + `/api/decouverte/progress` quand auth.
- **Critère d'acceptation** : sweep visuelle 5 breakpoints, complétion 4/4 → redirect `/decouverte/fin`.
- **Estimation** : **XL** (dépendance contenu audio réel).

## P1-5 · Écran "fin de découverte" §16

- **Route** : `/decouverte/fin`.
- **Doctrine** : §16 — progression 4/4, message dans la langue, récap thèmes, stats réelles (cours terminés, mots rencontrés, exercices réussis, minutes d'écoute), aperçu de la suite (Monde A1 ou Racines É1-É5), CTA activation.
- **Composant** : `<DecouverteFin stats={{...}} suite={{...}} />`.
- **API** : `GET /api/decouverte/stats` (calcule à partir de la progression).
- **Critère d'acceptation** : bouton "Activer Monde" → `/pricing/monde`, "Activer Racines" → `/pricing/racines`.
- **Estimation** : **L**.

## P1-6 · Câbler `AdaptiveQuiz` sur banque statique — traité par **P0.B-3**

Déplacé dans le lot P0.B (fondations UI communes). Sans cette primitive, ni P1-4 (4 cours découverte) ni P2-6 (refonte modules) ne peuvent avancer.

## P1-7 · Enrichir `AudioPlayer` — traité par **P0.B-4**

Déplacé dans le lot P0.B pour la même raison : P1-4 et P2-2 (parcours écoute) en dépendent.

## P1-8 · Kicker Fraunces "Monde · le voyage" / "Racines · le retour" dans `FoyerTopbar`

- **Fichier** : `src/components/foyer/FoyerTopbar.tsx`.
- **Ajout** : rendre un `<p class="kicker">` selon `territory`.
- **Estimation** : **S**.

---

# Lot P2 — Étudiant Monde

> **Statut d'implémentation** (branche `feat/yema-p2-world-student`, hardening 2026-07-22) :
> - Dashboard Monde 5 états distincts (ACTIVE_START / ACTIVE_RESUME / ACTIVE_DONE / EXPIRED / NO_ACCESS) : ✅ DONE — EXPIRED n'affiche plus « Reprendre », CTA « Voir les offres » à la place.
> - Catalogue (`/courses`) : ✅ DONE
> - Progression (`/progress`) : ✅ DONE
> - Layout modules server-side (AccessGrant enforcement) : ✅ DONE — un utilisateur EXPIRED ou NONE accédant directement à l'URL d'un module reçoit un state-locked, aucun contenu payant ne fuit
> - API `/api/me/monde-dashboard` : ✅ DONE (401 anon, 403 teacher)
> - Fixtures P-1 5 modes : ✅ DONE (active/expired/none/new/completed)
> - Feedback exercice accessible (role=status + aria-live polite + texte distinct couleur) : ✅ DONE
> - A1 courseReady=true (5 leçons × 5 modules)
> - Suivi professeur, devoirs, messagerie, notifications backend : 🚫 P4_DEPENDENCY
> - Examens blancs, attestation : ⚠️ CONTENT_REVIEW_REQUIRED
> - Paiement : 🚫 P5 (0 grant hors fixture confirmé en DB post-parcours)
> - Détail complet : voir `docs/YEMA_P2_WORLD_STUDENT.md` §25.

**Objectif utilisateur** : offrir à un étudiant Monde un dashboard clair, un parcours complet et un accès humain quand suivi actif.

**Pages concernées** : `/dashboard` (variant Monde à créer ici), `/courses`, `/courses/[id]/modules/[mid]`, `/monde/ecoute` (nouveau), `/monde/examens` (nouveau), `/monde/attestation` (nouveau), `/progress`.
**Composants réutilisés** : `Layout`, `StateBlock`, `LessonComplete`, `LevelUp`, `AudioPlayer` (enrichi P0.B-4), `DialogPlayer`, `AdaptiveQuiz` (câblé P0.B-3).
**Composants à créer** : `MondeDashboard`, `MondeHero`, `MondeParcoursCards`, `MondeSuiviProf`, `EcouteShell`, `ExamensBlancsShell`, `AttestationShell`, `SuiviProfPanel`.

## P2-1 · Dashboard Monde complet (dédié, distinct du Foyer)

- **Doctrine** : §20 dans son intégralité.
- **Constat gap analysis** : `/dashboard` = Foyer/Racines aujourd'hui. Aucun dashboard Monde.
- **Fichiers** :
  - `src/app/[locale]/dashboard/page.tsx` : détecter `data.activeLangue.territory === "world"` ET `!data.household` (pas de famille) → charger `<MondeDashboard>`.
  - `src/components/monde/MondeDashboard.tsx` (nouveau) : greeting + hero CECRL + 4 parcours (Leçons, Exercices, Écoute, Examens blancs) + bloc suivi prof ou invitation.
  - Sinon fallback existant : `<FoyerDashboard>` (Racines).
- **API** : `/api/me/foyer` existe pour Racines ; créer `/api/me/monde` (utilisateur + learningPath actif + progression + suivi prof).
- **Sections** : greeting, hero, 4 parcours cards, classe (avec ou sans suivi), attestation.
- **Tests** : snapshot rendu pour chacun des 3 états (avec suivi, sans suivi, sans learningPath).
- **Critère d'acceptation** : un utilisateur MONDE voit son hero A1 avec "Continuer" ; un utilisateur RACINES/FAMILLE conserve l'expérience Foyer.
- **Risque** : moyen — attention à ne pas casser le Foyer existant.
- **Estimation** : **XL**.

## P2-2 · Parcours "Écoute" §20.5

- **Route** : `/monde/ecoute` (ou `/courses/[id]/ecoute`).
- **Doctrine** : audios enregistrés, listés par niveau, progression, transcript.
- **Composant** : `<EcouteShell audios={...} />` avec `AudioPlayer` enrichi.
- **Estimation** : **L**.

## P2-3 · Examens blancs §20.5

- **Route** : `/monde/examens`.
- **Doctrine** : préparés et versionnés, état locked/unlocked selon éligibilité.
- **API** : `GET /api/monde/exams/status`.
- **Estimation** : **L**.

## P2-4 · Attestation §20.8

- **Route** : `/monde/attestation`.
- **Doctrine** : conditions, étapes restantes, éligibilité, statut, aperçu doc réel uniquement.
- **API** : `GET /api/monde/attestation/status`.
- **Composant** : `AttestationShell`.
- **Critère d'acceptation** : jamais afficher un faux document.
- **Estimation** : **L**.

## P2-5 · Suivi professeur §20.6-20.7

- **Composant** : `SuiviProfPanel` (portrait, nom, prochain devoir, correction en attente, prochain RDV, message récent, bouton "Envoyer ma production", délai indicatif).
- **Fallback sans suivi** : invitation sobre (bénéfices exacts, prix, délai correction, conditions, CTA `/pricing/monde#suivi`).
- **API** : `GET /api/teacher/mine` (nouvelle).
- **Estimation** : **L**.

## P2-6 · Refonte `courses/[id]/modules/[mid]` pour cohérence

- **Fichier** : page très longue (1200+ lignes), à ne pas réécrire globalement. Cibler :
  - Retirer chiffres décoratifs non-données.
  - Utiliser `MondeParcoursCards` pour les navigations lecteur ↔ exercice.
  - Câbler `AdaptiveQuiz` avec `getStaticQuestions`.
- **Estimation** : **L**.

---

# Lot P3 — Racines

> **Statut d'implémentation** (branche `feat/yema-p3-roots-family`, hardening 2026-07-23) :
> - Dashboard Racines (Solo + Family + NO_ACCESS + FAMILY_EMPTY) : ✅ DONE — mode dérivé de `AccessGrant.product.code` (ROOTS_SOLO/ROOTS_FAMILY), jamais de `ChildProfile.count`. 4 branches JSX distinctes.
> - Seam `src/lib/racines.ts` (É1-É5 doctrinal + statut par langue) : ✅ DONE + `resolveRacinesAccessMode()` + `summarizeRacinesHousehold()` avec détection d'incohérence SOLO+enfants
> - Foyer + profils enfants (`/famille`, `/famille/enfant/[id]`) : ✅ KEEP (existant P1, ownership serveur confirmé)
> - API `/api/me/racines-dashboard` : ✅ DONE (401 anon, 403 non-STUDENT, `resolveRacinesAccessMode` en source de vérité, expose `mode | household | activeChildId`)
> - API `/api/me/active-child` : ✅ DONE (POST vérifie ownership avant `user_metadata.activeChildId`, GET 401 anon, POST null reset au parent)
> - Ownership cross-household : ✅ DONE (PATCH/DELETE d'un enfant étranger → 404, page → 200 sans leak)
> - MAX_CHILDREN=4 · ✅ ENFORCED (409 `max_children_reached` avec `{limit,current}` — testé E2E)
> - Limite adultes 2 / coachs 1 / cercles 1-par-langue · ⚠️ **NOT_IMPLEMENTED** honnête (modèles pas encore instanciés en P3, décision structurelle documentée `YEMA_P3_CIRCLE_DECISION.md` §RECOMMANDÉES)
> - Décision cercle A vs B : ✅ DONE (`docs/YEMA_P3_CIRCLE_DECISION.md` recommande Option A + règles capacité)
> - Sweep viewports 360/390/768/1440 · ✅ 0 overflow sur `/dashboard`, `/famille`, `/progress`
> - Trace clavier · ✅ 12 tab stops, tous avec focus ring visible
> - Zoom 200% · ✅ 0 overflow
> - Parcours EN complet · ✅ /en/dashboard /en/famille /en/progress /en/classroom /en/notifications tous 200 sans fuite FR ni CECR
> - **Contenu langue Racines : 🚫 CONTENT_REQUIRED + RIGHTS_REVIEW_REQUIRED** (les 4 langues restent MISSING, `anyRacinesLanguageReady === false`, doctrine §6-7 respectée)
> - Récits, veillées, audios : 🚫 CONTENT_REQUIRED (aucun contenu inventé)
> - Coach console : 🚫 P4 (état sobre « Bientôt disponible »)
> - Vraie messagerie / cercle : 🚫 P4 (décision structurelle Option A prête à appliquer)
> - Paiement Racines : 🚫 P5
> - Détail complet : voir `docs/YEMA_P3_ROOTS_FAMILY.md`.

**Objectif utilisateur** : offrir un dashboard Racines vivant, une échelle É1-É5 lisible, des veillées éditoriales et un espace foyer distinct.

**Pages concernées** : `/dashboard` (variant Racines existant), `/famille`, `/famille/enfant/[id]`, `/racines/veillees` (nouveau), `/racines/recits` (nouveau).
**Composants réutilisés** : `FoyerHero`, `FoyerSpine`, `FoyerCapCard`, `AutreVoixStrip`, `AnimalAvatar`, `AudioPlayer`, `DialogPlayer`.
**Composants à créer** : `FoyerAujourdhui`, `VeilleeCard`, `RecitShell`, `CoachRacinesPanel`.

## P3-1 · Section "Aujourd'hui dans la maison" §21.5

- **Composant** : `FoyerAujourdhui` (un mot, une expression, un court audio, une question à un proche).
- **Placement** : après `FoyerHero` dans `/dashboard`.
- **API** : `GET /api/racines/today?langue=...`.
- **Contenu** : préparé éditorialement (à créer avec responsables éditoriaux §35.10).
- **Estimation** : **L**.

## P3-2 · Veillées §21.6

- **Route** : `/racines/veillees`, `/racines/veillees/[id]`.
- **Doctrine** : récit + audio + transcript + vocabulaire + contexte culturel + activité familiale optionnelle. Style plus éditorial que les leçons.
- **Composant** : `VeilleeCard`, `VeilleeShell`.
- **Estimation** : **XL** (contenu).

## P3-3 · Foyer Famille §21.8 (mur de profils)

- **Route** : `/famille` existante à enrichir.
- **Doctrine** : membres, progression individuelle, âge/rôle, langue, dernière activité, invitation, profil actif.
- **Fichier** : `src/app/[locale]/famille/page.tsx`.
- **Estimation** : **L**.

## P3-4 · Coach de langue Racines §21.9-21.10

- **Composant** : `CoachRacinesPanel` (portrait réel, nom, variété linguistique, disponibilité, prochaine réponse, derniers feedbacks, devoir oral, message).
- **Fallback sans coach** : invitation sobre (§21.10).
- **API** : `GET /api/racines/coach/mine`.
- **Estimation** : **L**.

## P3-5 · Représentation É1-É5 comme parcours vivant §21.4

- **Composant** : `FoyerSpine` existant à consolider.
- **Doctrine** : "pas cinq cartes identiques" — chaque étape a sa personnalité.
- **Estimation** : **M**.

---

# Lot P4 — Professionnels

> **Statut P4.1** (branche `feat/yema-p4-1-circle-security`, hardening finalisé 2026-07-23) :
> - Circle · CircleMembership · AuditEvent · StorageObject · migration additive **idempotente** appliquée à P-1 (`kzzagbojjkivdzzcrmxn`) — voir `docs/YEMA_P4_1_CIRCLE_SECURITY.md`.
> - `AppRole = RACINES_COACH` et `ProductCode = ROOTS_COACH_ADDON` ajoutés.
> - **Unicité Circle correcte** · index partiel `WHERE archivedAt IS NULL` (permet recréation après archivage · Q8/Q9).
> - **4 index partiels memberships** · OWNER unique actif · COACH unique actif · dédup user actif · dédup enfant actif. Caps ADULT (2)/CHILD (4) enforced par `lib/circles/capacity.ts`.
> - **RLS fonctionnelle** · 9 helpers `SECURITY DEFINER SET search_path` avec `REVOKE FROM PUBLIC` + `GRANT EXECUTE TO authenticated` · `GRANT SELECT` ciblés · owner/adult/coach voient leur cercle par JWT, cross-tenant et REMOVED reçoivent 0 ligne, anon reçoit 42501.
> - 6 buckets Supabase Storage privés dans P-1.
> - `src/lib/flags.ts` · 9 feature flags **tous à `false` par défaut**. API 404 quand off, vérifié end-to-end.
> - Service-role inventory · 7 usages catalogués (`docs/YEMA_P4_SERVICE_ROLE_INVENTORY.md`) · 0 blocker.
> - **358 tests pass · TypeScript clean · build vert · 19/19 smoke tests · concurrence réelle Promise.all validée**.
> - **Migration base vierge** vérifiée via `prisma dev` PGlite (PostgreSQL 17.5 WASM) · 14 migrations appliquées via `prisma migrate deploy` · second `deploy` retourne `No pending migrations` · tables/index/functions/policies/grants tous présents.
> - **Concurrence capacité** validée · 3ᵉ adulte simultané → 0 succès, 2 rejects `max_adults_reached` (état final 2). 5ᵉ enfant simultané → 0 succès, 2 rejects `max_children_reached` (état final 4).
> - **API E2E avec `CIRCLE_ENABLED=true`** · 23 checks Playwright · owner/adult/coach voient leur cercle · cross-tenant rejeté · coach non assigné rejeté · anon 401 · `body.userId` injecté ignoré · archive idempotent · recréation même langue après archive OK · membre REMOVED → 403 · AuditEvent trace CIRCLE_CREATED + CIRCLE_ARCHIVED. Flag restauré à `false` par défaut · vérifié 404 sur /api/circles/*.

> **Statut audit** (branche `feat/yema-p4-professional-spaces`, audit finalisé 2026-07-23) :
> - Audit d'architecture complet · `docs/YEMA_P4_ARCHITECTURE_AUDIT.md` (inventaire Prisma · routes · mocks · Circle Option A pseudo-schéma · classroom vs circle · Suivi Racines et rôle `RACINES_COACH`)
> - Matrice permissions · `docs/YEMA_P4_PERMISSION_MATRIX.md` (9 rôles globaux × 20+ actions · rôles locaux Circle/Class/Center · Teacher · Coach avec capacités Q15)
> - Threat model · `docs/YEMA_P4_THREAT_MODEL.md` (menaces classées CRITICAL/HIGH/MEDIUM/LOW · RLS activée dès P4.1 par migration · buckets privés · rétention Q7 · audit trail)
> - Plan d'implémentation · `docs/YEMA_P4_IMPLEMENTATION_PLAN.md` (migrations M1-M5 avec RLS intégrée · 9 feature flags · sous-lots P4.1 → P4.7 + P4.RLS revue finale · décisions Q1-Q15 **validées** · plan de tests · blockers par sous-lot)
> - **Ordre P4 final** · `P4.1 (Circle + permissions + RLS + Storage + AuditEvent + flags) → P4.2 (Memberships + invitations) → P4.3a (Center real data) → P4.3b (Teacher workspace) → P4.4 (Coach Racines workspace) → P4.5 (Assignments + submissions + feedback) → P4.6 (Closed messaging + audio) → P4.7 (Notifications + rate limiting + hardening) → P4.RLS (Final consolidation review)`
> - Codes définitifs · `ProductCode = ROOTS_COACH_ADDON` · Nom commercial « Suivi Racines » · `AppRole = RACINES_COACH` (jamais `CAREER_COACH`)
> - `ChildProfile` = représentation canonique enfants · `DependentProfile` audité et déprécié P4, aucune suppression destructive
> - `ThreadType.ONE_TO_ONE` déprécié · nouvelles créations interdites · routes désactivées · aucune suppression destructive en P4
> - Aucun code, aucune migration, aucun schéma Prisma modifié pendant l'audit
> - **Décision** · `P4 AUDIT READY TO MERGE`

**Objectif utilisateur** : offrir aux professeurs, coachs, centres et admins un espace opérationnel qui priorise l'action, pas les statistiques.

**Pages concernées** : `/teacher/*`, `/coach/*` (nouveau), `/center/*`, `/admin/*`, `/classroom/*` (câblage réel), `/famille/*` (extensions Circle).
**Composants réutilisés** : `TeacherLayout`, `CenterLayout`, `Layout` (pour admin), `StateBlock`, `Portrait`.
**Composants à créer** : `TeacherDashboardHero`, `CorrectionsQueue`, `CorrectionEditor`, `CenterMembersTable`, `AdminUsersTable`, `CoachDashboard`, `CircleFeed`, `CircleFeedback`.

**Décision structurelle** · Circle Option A confirmé (nouvelle entité vs enum `RACINES_CIRCLE` sur `Class`). Voir `docs/YEMA_P3_CIRCLE_DECISION.md` §Recommandation.

## P4-1 · Dashboard professeur §25.1

- **Doctrine** : prioriser corrections en attente, devoirs urgents, étudiants nécessitant attention, prochain RDV, messages.
- **Route** : `/teacher`.
- **Fichier** : `src/app/[locale]/teacher/page.tsx`.
- **Composant** : `TeacherDashboardHero`.
- **Estimation** : **L**.

## P4-2 · Corrections humaines §25.3

- **Route** : `/teacher/assignments/[id]/corrections`, `/teacher/assignments/[id]/corrections/[submissionId]`.
- **Composant** : `CorrectionEditor` (lecture/écoute production, annotation, feedback structuré, commentaire libre, statut, renvoi étudiant, historique).
- **API** : `POST /api/teacher/corrections/[submissionId]`.
- **Estimation** : **XL**.

## P4-3 · Espace centre §25.4

- **Routes** : `/center/teachers`, `/center/students`, `/center/classes`, `/center/billing`, `/center/stats`.
- **Composant** : `CenterMembersTable` (enseignants, étudiants).
- **Estimation** : **L**.

### P4-3a · Connexion des pages centre aux données Prisma réelles

- **Contexte** : depuis P0.B, les tables/cartes centre sont responsive mais les données proviennent encore de constantes hardcodées (`STUDENTS`, `MOCK_TEACHERS`, `CLASSES`) — 14 mock students, 7 mock teachers, 1 mock class visibles sur `/center/students`, `/center/teachers`, `/center/classes`, `/center/stats`. Voir `docs/YEMA_UI_FOUNDATIONS.md` §15 tableau final.
- **Suppression stricte** :
  - `STUDENTS` dans `src/app/[locale]/center/students/page.tsx`
  - `MOCK_TEACHERS` dans `src/app/[locale]/center/teachers/page.tsx`
  - `CLASSES` dans `src/app/[locale]/center/classes/page.tsx`
  - `PENDING` (demandes de rattachement mock)
- **APIs à créer** (data-layer via `lib/data/*.ts`, jamais Supabase direct dans les pages) :
  - `getCenterStudents(centerId)` → filtre par `users.centerId = centerId`, join `learning_paths` pour niveau/XP/streak
  - `getCenterTeachers(centerId)` → filtre par `teachers.centerId = centerId`, join `Classroom` pour compte classes/étudiants
  - `getCenterClasses(centerId)` → filtre `Classroom.centerId = centerId`
  - `getCenterPendingEnrollments(centerId)` → demandes `class_join_requests` où la classe appartient au centre
- **États alimentés par les APIs réelles** :
  - `loading` via `StateBlock kind="loading"` pendant le fetch
  - `empty` via `StateBlock kind="empty"` quand `rows.length === 0` (aucun étudiant/enseignant/classe rattaché·e)
  - `error` via `StateBlock kind="error"` sur échec réseau ou 403
- **Critères d'acceptation stricts** :
  - Aucun faux nom présenté comme réel (grep-based test `test(product)` bloque toute réintroduction de "Sophie Tanda", "Marie Nguemo", etc.)
  - Aucun faux étudiant, faux enseignant, faux chiffre centre visible sur un compte centre réel
  - Toutes les queries filtrées par `centerId` provenant de la session (`api/me`) — un centre A ne peut jamais voir les étudiants d'un centre B
  - Test cross-centre : compte centre A tente `GET /api/center/students?centerId=B` → 403
  - Test P-1 baseline mis à jour : compte `center` (TEST_CENTRE_YEMA_DEV) doit voir 0 enseignant + 0 étudiant tant qu'aucun rattachement réel n'est créé — état empty honnête
- **Estimation supplémentaire** : **L** (au-dessus de P4-3).

## P4-4 · Espace admin §25.5

- **Routes** : `/admin/users`, `/admin/applications`, `/admin/courses`, `/admin/roles`, `/admin/system`, `/admin/centers`.
- **Contrainte** : retirer les 2 lignes fake `SAVED_COURSES` dans `admin/courses/generate/page.tsx`.
- **Estimation** : **L**.

## P4-5 · Messages et fil de conversation §4.4

- **Fil intégré** aux pages classe/prof/coach.
- **Composant** : réutiliser `ClassroomChat.tsx` existant + adapter pour coach Racines.
- **Estimation** : **L**.

---

# Lot P5 — Fondations commerciales et support

**Objectif utilisateur** : paiement, récupération de mot de passe, emails transactionnels, gestion des accès, facturation, support, remboursements.

## P5-1 · Récupération mot de passe

- **Routes** : `/forgot-password`, `/reset-password/[token]`.
- **API** : `POST /api/auth/password-reset`, `POST /api/auth/password-reset/confirm`.
- **Email** : Resend template.
- **Estimation** : **L**.

## P5-2 · Paiement CinetPay (XAF) + Stripe (EUR)

- **API** : `POST /api/orders`, `POST /api/payments`.
- **Webhooks** : `POST /api/webhooks/cinetpay`, `POST /api/webhooks/stripe`.
- **UI** : `/checkout/[orderId]`.
- **Décision §35.19** : fonctionnement du paiement fractionné à fermer.
- **Estimation** : **XL**.

## P5-3 · Emails transactionnels

- **Templates Resend** : bienvenue, confirmation paiement, correction reçue, rappel RDV, expiration accès, mot de passe reset, résiliation, facture.
- **Estimation** : **L**.

## P5-4 · Gestion des accès expirés §35.17

- **Composant** : bannière discrète dans `/dashboard` quand `endsAt < now + 7j`.
- **UI** : `/renouvellement`.
- **Estimation** : **M**.

## P5-5 · Facturation et remboursements §35.20

- **Route** : `/settings/factures`.
- **API** : `GET /api/orders/mine`, `POST /api/orders/[id]/refund`.
- **Estimation** : **L**.

---

# Lot P6 — Premium et QA

**Objectif utilisateur** : finition, accessibilité, performance, tests, non-régression.

## P6-1 · Direction artistique (portraits, illustrations, mur des visages)

- **Contenu** : produire les portraits et obtenir les droits §35.12.
- **Assets** : AVIF/WebP, `<Image>` Next.
- **Estimation** : **XL** (dépendance production).

## P6-2 · Motion §10

- Micro-interactions hover/focus 120-180 ms.
- Ouvertures cartes/menus 180-240 ms.
- Célébrations leçons 500-900 ms max.
- Respect `prefers-reduced-motion`.
- **Estimation** : **M**.

## P6-3 · Accessibilité WCAG 2.2 AA complète

- Audit axe-core sur toutes les pages publiques et authentifiées.
- Cibles tactiles 44×44 px vérifiées §7.5.
- Focus visible partout §28.
- Zoom 200%.
- **Estimation** : **L**.

## P6-4 · Performance §29

- LCP < 2.5s pages prioritaires.
- CLS < 0.1.
- INP < 200 ms.
- Lighthouse audit.
- **Estimation** : **L**.

## P6-5 · Tests visuels régression Playwright baseline

- Snapshot chaque page publique + auth à 360/390/1440.
- Diff pixel-perfect en PR.
- Baseline landing IMMUTABLE.
- **Estimation** : **L**.

## P6-6 · E2E parcours critiques

- Playwright : inscription → territoire → langue → auto-éval → 4 découvertes → activation → première leçon.
- Suivi prof : envoyer production → correction reçue.
- Suivi coach : envoyer voix → feedback.
- **Estimation** : **L**.

## P6-7 · Nettoyage code mort (audit)

- 22 fichiers morts (11 Landing*, 6 Remotion, 4 hooks, 1 lib) identifiés dans `AUDIT.md`.
- Supprimer physiquement + décharger `package.json` des `@remotion/*` si tous morts.
- Retirer dépendances IA restantes (`@google/generative-ai`, `openai`) + `src/lib/ai/*`, `azureTTS.ts`, `geminiCache.ts`, `guardrails.ts`, `systemPrompt.ts`.
- **Estimation** : **M**.

## P6-8 · CI GitHub Actions

- Workflow : lint → tsc → test → build → Playwright screenshots.
- Bloquant sur PR vers `main`.
- **Estimation** : **M**.

---

# Ordre d'implémentation recommandé

**Semaine 0 (préparation)** : **P-1 Baseline authentifiée** — merger Phase A.2, créer les 6 comptes de test, capturer sweep authentifiée, inventorier placeholders, tester permissions, lever les marqueurs `CODE_AUDITED_VISUAL_PENDING`.

**Semaine 1** : **P0.A** (fix routes + prix + coach Racines catalogué) + **P0.B** (primitives strictement nécessaires : `StateBlock` complet, `OnboardingProgress` segmenté, `AudioPlayer` enrichi, `quizAdapter`, tokens documentés).

**Semaine 2** : P1-1 à P1-8 (funnel doctrinal complet : portes, langue, auto-éval, 4 découvertes, fin, activation).

**Semaine 3-4** : P2 (Étudiant Monde : dashboard dédié, écoute, examens, attestation, suivi prof) + démarrer P3 (Racines).

**Semaine 5** : P3 complet + P4 (Professionnels) démarré.

**Semaine 6-7** : P4 complet + P5 (paiement, password recovery, emails, factures).

**Semaine 8+** : P6 (premium, QA, tests visuels, CI, nettoyage code mort et IA restant).

**Bloqueurs transverses** :
1. Phase A.2 doit être mergée avant P-1.1 (seed d'un enfant Racines Famille échouerait sinon).
2. P-1 doit être complet avant P2/P3/P4 (recommandations restent provisoires sinon).
3. P0.A-3 (catalogue coach Racines) doit être fait avant P3-4 (panel coach dans dashboard Racines).

---

# Règles de backlog (rappel §13 meta-prompt)

Chaque tâche implémentée doit :
1. Avoir un critère de validation objectif.
2. Être testée aux 5 breakpoints (360, 390, 768, 1024, 1440).
3. Fournir les 4 états (loading, empty, error, success).
4. Passer les checklists §33.3 (Definition of Done) et §33.4 (Revue avant merge) de la doctrine.
5. **Ne jamais** modifier un fichier landing sans autorisation explicite.
6. Confirmer FR/EN.
7. Respecter le territoire (Monde vs Racines).
8. Aucune donnée fictive, aucun appel IA.

Étiquettes de titre acceptées :
- `feat(monde): add hero de progression dashboard`
- `feat(racines): add veillees list`
- `feat(funnel): create territoire choice screen`
- `fix(pricing): align world passage grid to doctrine`
- `chore(dead): remove Landing* legacy components`

Interdites :
- `feat: improve design`
- `feat: make it premium`
- `refactor: unify Monde and Racines`
- `feat: modernize landing`

---

# Confirmation

```
Landing /fr : CANONICAL — aucun lot ne la touche
Landing /en : CANONICAL — aucun lot ne la touche
```

Cette feuille de route est un plan. Aucun code produit n'a été modifié pendant sa rédaction. Aucune tâche n'a été exécutée. Aucun commit n'a été créé.

---

# Amendements roadmap — mobile et messagerie

Ces amendements intègrent les Amendements A (mobile-first + PWA + app native) et B (messagerie de suivi) de la doctrine. Ils étendent les lots existants et ajoutent le lot P7.

## Ajouts au lot P-1 — Baseline authentifiée

### P-1.7 · Sweep mobile authentifiée 360/390

Ajoute aux 4 breakpoints P-1.3 déjà planifiés (360/390/768/1440) les scénarios spécifiques mobiles :

- capturer les écrans mobiles réels de chaque dashboard authentifié avec chaque compte ;
- identifier les problèmes de clavier virtuel (composer masqué, formulaire register, PATCH famille, envoi message) ;
- identifier les problèmes de safe area iOS (encoche, home indicator) ;
- capturer le fil Monde s'il existe (`/classroom/[id]`) avec compte teacher et compte student ;
- capturer le cercle Racines s'il existe (probable MISSING per MSG-01, à confirmer) ;
- tester rôles professeur, coach, élève et parent sur mobile 360 ;
- tester cross-classe et cross-cercle (fuite d'ownership sur messagerie) ;
- inventorier placeholders messagerie (fake « Prof. Sophie Tanda », « Marie N. » de `ClassroomChat`) ;
- lever les marqueurs visuels uniquement après vraie capture 360.

**Livrable** : rapport tabulaire équivalent à la sweep publique + tableau spécifique mobile keyboard/safe-area.
**Estimation** : **L**.

## Ajouts au lot P0.A — Corrections fonctionnelles

### P0.A-7 · Retirer les fake messages de `ClassroomChat`

- **Fichier** : `src/components/ClassroomChat.tsx`.
- **Change** : supprimer `INITIAL_MESSAGES` hardcodés (« Prof. Sophie Tanda », « Marie N. ») ; brancher sur état vide canonique `<StateBlock kind="empty">` jusqu'à ce que l'API messagerie soit prête (P4).
- **Doctrine** : §33.3 « aucune donnée fictive présentée comme réelle ».
- **Estimation** : **S**.

## Ajouts au lot P0.B — Fondations UI communes

### P0.B-8 · Safe area iOS sur les shells de dashboard

- **Fichiers** : `src/app/globals.css`, `src/components/Layout.tsx`, `src/components/TeacherLayout.tsx`, `src/components/CenterLayout.tsx`, `src/components/foyer/FoyerSidebar.tsx`.
- **Change** : ajouter `padding-top: env(safe-area-inset-top)`, `padding-bottom: env(safe-area-inset-bottom)` sur les shells + `<meta viewport-fit="cover">` dans le root layout.
- **Test** : Playwright avec context `hasTouch: true` sur 390×844.
- **Estimation** : **S**.

### P0.B-9 · `StateBlock` variante `offline`

- **Fichier** : `src/components/StateBlock.tsx`.
- **Ajout** : nouveau `kind: "offline"` avec soul « La maison attend le réseau. *Ta progression est sauvegardée.* »
- **Estimation** : **S**.

## Ajouts au lot P2 — Étudiant Monde

### P2-7 · Messagerie de classe Monde (fil unique, mobile-first)

- **Doctrine** : §B (Monde variante §B.6).
- **Fichiers** :
  - `src/app/[locale]/classroom/[classroomId]/page.tsx` : intégrer le fil.
  - `src/components/messaging/ClassThread.tsx` (nouveau).
  - `src/components/messaging/VoiceComposer.tsx` (nouveau, mobile-first, bouton micro prioritaire).
  - `src/components/messaging/MessageBubble.tsx` (nouveau, variantes teacher/self/peer + territory).
- **API** : `GET/POST /api/threads/[classId]/messages`, `POST /api/threads/[classId]/voice-notes`, `POST /api/messages/[id]/reactions`, `PATCH /api/messages/[id]/read`.
- **Réutilise** : `AudioPlayer` enrichi P0.B-4, `StateBlock`, `Portrait`.
- **Fonctionnalités** :
  - fil chronologique ;
  - réception d'annonces ;
  - devoir oral rendu comme entrée de fil ;
  - remise vocale (`VoiceRecorder` réel, cf. MSG-03) ;
  - correction vocale reçue ;
  - statuts remis/partagé ;
  - notifications new-message.
- **Estimation** : **XL**.

## Ajouts au lot P3 — Racines

### P3-6 · Cercle Racines fermé (équivalent classe Monde)

- **Doctrine** : §B (Racines variante §B.7).
- **Fichiers** :
  - Prisma : nouvelle enum `ClassType.RACINES_CIRCLE` OU nouvelle entité `Circle` distincte (décision produit à fermer, MSG-01).
  - `src/app/[locale]/racines/cercle/[circleId]/page.tsx` (nouveau).
  - Réutilise `ClassThread`, `VoiceComposer`, `MessageBubble` créés en P2-7 avec `territory="racines"`.
- **Fonctionnalités** :
  - invitation « Fais entendre ta voix » comme entrée éditoriale du cercle ;
  - partage vocal ;
  - correction linguistique et affective coach ;
  - échanges entre proches ;
  - contrôle parental (bloquer messages privés pour profils enfants — MSG-10).
- **Estimation** : **XL**.

## Ajouts au lot P4 — Professeur et coach

### P4-6 · Console messagerie côté professeur/coach

- **Doctrine** : §B.9 permissions professeur/coach.
- **Fonctionnalités** :
  - publication (annonce, devoir oral, invitation orale) ;
  - liste des remises avec statut (remise/en attente) ;
  - correction audio + texte (implique amendement Prisma MSG-04 : `ClassFeedback.audioUrl`) ;
  - modération (épingler, retirer un message, cloturer une activité) ;
  - compteur messages non lus (implique MSG-05 : `MessageReadState`) ;
  - capacité de suivi (nombre de conversations actives par coach, ratio corrections/mois).
- **Estimation** : **XL**.

### P4-7 · Amendement Prisma messagerie

- **Nouvelle migration** : `20260723_messaging_enrich.sql` (nom indicatif).
- **Changes additifs** :
  - `ClassFeedback` : `+ audioUrl String?` ;
  - nouvelle table `MessageReaction` (messageId, userId, emoji) ;
  - nouvelle table `MessageReadState` (messageId, userId, readAt) ;
  - nouvelle table `MessageReport` (messageId, reporterId, reason, status, resolvedBy, resolvedAt) ;
  - décision `Circle` vs enum `RACINES_CIRCLE` (MSG-01) à trancher avant écriture.
- **Estimation** : **L**.

## Ajouts au lot P6 — Premium et QA

### P6-9 · PWA — installation, mode standalone, cache prudent

- **Doctrine** : §A.2 (PWA après stabilisation cœur produit).
- **Fichiers** :
  - `src/app/manifest.ts` (existant, à enrichir) : icônes 192/512, theme_color espresso, background_color seuil, display standalone, start_url `/{locale}`.
  - `public/sw.js` (nouveau, service worker minimal) : cache CSS/fonts/images, PAS de messagerie/paiement/enfants.
  - `src/app/[locale]/offline/page.tsx` (nouveau) : écran offline canonique.
- **Estimation** : **L**.

### P6-10 · QA réseau lent + microphone + uploads interrompus + Android/iOS

- **Cibles** :
  - simuler 3G lent (Playwright throttle) sur `/dashboard`, `/classroom/[id]`, upload de note vocale ;
  - tester consentement microphone Chrome Android + Safari iOS ;
  - tester upload interrompu (offline pendant envoi) → brouillon préservé ;
  - tester permissions (`Permissions API` `microphone`) ;
  - tester stockage privé (URLs signées, pas d'accès public) ;
  - vérifier accessibilité axe-core avec messagerie ;
  - vérifier protection mineurs (profil enfant ne peut pas envoyer message privé).
- **Estimation** : **XL**.

### P6-11 · Tests E2E messagerie

- Playwright : parcours prof → publie devoir → étudiant → reçoit → enregistre voix → envoie → prof → écoute → corrige (audio+texte) → étudiant → reçoit correction. Idem cercle Racines.
- Tests cross-classe : élève A n'accède pas au fil de la classe B.
- Tests cross-cercle : membre cercle X n'accède pas au fil du cercle Y.
- **Estimation** : **L**.

## Nouveau lot P7 — Application mobile YEMA

**Objectif utilisateur** : offrir une application mobile native (iOS + Android) une fois le web mobile stabilisé.

**Conditions de démarrage** (voir doctrine §A.3) :

* stabilisation du web mobile (P0-P6 terminés) ;
* validation de la rétention ;
* mesure de l'usage mobile ;
* stabilité de l'authentification ;
* stabilité des paiements ;
* stabilité des cours ;
* fonctionnement réel des coachs et professeurs ;
* validation des règles de protection des enfants.

**Approche recommandée à trancher** :

- Option A : React Native + Expo (partage code avec web via Next.js Router V13 App Directory limité).
- Option B : Capacitor (wrapper natif autour de la PWA existante — chemin le plus rapide).
- Option C : Flutter (rewrite complet, non recommandé).

**Fonctionnalités prioritaires** (doctrine §A.3) :

1. connexion et onboarding (Supabase Auth + biométrie iOS/Android) ;
2. choix Monde/Racines ;
3. cours et exercices ;
4. lecture audio (AVAudioSession + ExoPlayer) ;
5. progression (sync avec API) ;
6. mode hors ligne limité (SQLite local, sync deferred) ;
7. notifications push (APNs + FCM) ;
8. envoi de productions (upload résilient) ;
9. réception des corrections ;
10. espace foyer ;
11. profils enfants (contrôle parental natif) ;
12. rendez-vous professeur ou coach (calendar intent).

**Hors périmètre P7** : outils complexes centre, admin, création de contenu → restent sur web desktop.

**Estimation** : hors bêta. **XXL** (chantier autonome, minimum 3 mois avec équipe dédiée).

---

# Priorisation amendée

Nouvelle chronologie recommandée :

**Semaine 0 (préparation)** : P-1 Baseline authentifiée avec P-1.7 mobile sweep intégré.

**Semaine 1** : P0.A (avec P0.A-7 fake ClassroomChat cleanup) + P0.B (avec P0.B-8 safe area et P0.B-9 offline state).

**Semaine 2-3** : P1 Funnel (mobile-first appliqué systématiquement dès §11-§16).

**Semaine 4-5** : P2 Étudiant Monde (avec P2-7 messagerie classe Monde).

**Semaine 5-7** : P3 Racines (avec P3-6 cercle Racines fermé) + démarrer P4.

**Semaine 7-9** : P4 Pros (P4-6 console messagerie + P4-7 amendement Prisma messagerie).

**Semaine 9-11** : P5 (paiement, password recovery).

**Semaine 12+** : P6 QA/PWA (P6-9 PWA, P6-10 QA mobile, P6-11 E2E messagerie).

**Post-bêta** : P7 Application mobile native (uniquement après conditions §A.3).

**Nouveaux bloqueurs transverses** :
4. MSG-01 (décision `Circle` vs enum `RACINES_CIRCLE`) à fermer avant P3-6 et P4-7.
5. MSG-02 (retrait fake data ClassroomChat) à faire en P0.A-7 pour ne pas contaminer P-1 baseline.
6. Doctrine amendée §A.4 impose critères mobiles obligatoires — chaque page de P1-P4 doit passer la checklist 360/44px/safe-area/keyboard/offline avant validation.

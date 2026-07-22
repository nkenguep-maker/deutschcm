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

**Objectif utilisateur** : offrir aux professeurs, coachs, centres et admins un espace opérationnel qui priorise l'action, pas les statistiques.

**Pages concernées** : `/teacher/*`, `/center/*`, `/admin/*`.
**Composants réutilisés** : `TeacherLayout`, `CenterLayout`, `Layout` (pour admin), `StateBlock`, `Portrait`.
**Composants à créer** : `TeacherDashboardHero`, `CorrectionsQueue`, `CorrectionEditor`, `CenterMembersTable`, `AdminUsersTable`.

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

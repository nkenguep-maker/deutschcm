# YEMA · P1 · Funnel de découverte et d'activation

> **Livrable du lot `feat/yema-p1-funnel`**. Documente le parcours utilisateur de la création de compte jusqu'à l'intention d'activation. Le paiement réel est hors périmètre (P5).
>
> Base : `main@81147db` (post-P0.B merge). Aucune migration Prisma ajoutée : le funnel repose entièrement sur les modèles existants (`User`, `LearningPath`, `AccessGrant`).

## 1. Architecture

Le funnel est un **état dérivé**, jamais dupliqué. Le seul stockage supplémentaire par rapport à l'existant se fait dans `LearningPath.onboardingAnswers` (JSON), un champ déjà en place.

Étapes canoniques (voir `src/lib/funnel-state.ts`) :

| Étape | Signal DB |
|---|---|
| `ACCOUNT_READY` | Utilisateur Supabase authentifié, aucun `LearningPath` actif. |
| `UNIVERSE_SELECTED` | `LearningPath.universe` défini, `language` null. |
| `LANGUAGE_SELECTED` | `LearningPath.language` défini, niveau/étape non-choisi. |
| `SELF_ASSESSED` | `LearningPath.currentLevel` (Monde) OU `onboardingAnswers.racinesStep` (Racines). |
| `DISCOVERY_STARTED` | `onboardingAnswers.discoveryProgress` contient ≥1 numéro (< 4). |
| `DISCOVERY_COMPLETED` | `discoveryProgress` contient les 4 leçons. |
| `ACTIVATION_SELECTED` | `onboardingAnswers.activationIntent` renseigné. |
| `ACTIVATED` | Un `AccessGrant` avec `status = ACTIVE` existe pour l'utilisateur ou son learning path. |

## 2. Routes

| Route | Rôle |
|---|---|
| `/[locale]/onboarding` | Router serveur. Lit l'état, redirige vers l'étape suivante. |
| `/[locale]/onboarding/monde` | Formulaire why + startPoint (Monde). Écrit LP, dérive un niveau CECR provisoire (beginner→A1, some_basics→A2). |
| `/[locale]/onboarding/racines` | Formulaire link + startPoint (Racines). Écrit LP, dérive une étape racines (beginner→E1, some_basics→E2, test→E3). |
| `/[locale]/decouverte` | Router serveur. Envoie vers `/decouverte/[n]`, `/decouverte/bilan` ou `/decouverte/attente`. |
| `/[locale]/decouverte/[n]` | Leçon N (1..4) pour la langue active de l'utilisateur. Persiste la complétion. |
| `/[locale]/decouverte/attente` | État `StateBlock kind="empty"` pour une langue « bientôt disponible ». Aucune fausse leçon. |
| `/[locale]/decouverte/bilan` | Récapitulatif honnête basé sur les données persistées. |
| `/[locale]/activation-intent` | Sélection d'une offre (Monde `PASSAGE` ou Racines `SOLO`/`FAMILLE`). Persiste l'intention. |

## 3. Persistance

`LearningPath.onboardingAnswers` (JSON) contient au fil des étapes :

```json
{
  "why": "study | exam | envie",
  "startPoint": "beginner | some_basics | test",
  "cefrSelfAssessed": "A1 | A2 | B1 | B2 | C1",
  "racinesStep": "E1 | E2 | E3 | E4 | E5",
  "discoveryProgress": [1, 2, 3, 4],
  "activationIntent": {
    "offer": "PASSAGE",
    "cefrLevel": "A1",
    "withTeacher": false,
    "racinesOffer": "SOLO | FAMILLE",
    "racinesPeriod": "MONTH | YEAR",
    "currency": "XAF | EUR",
    "selectedAt": "2026-07-22T…"
  }
}
```

L'API `PATCH /api/funnel` accepte uniquement les clés `cefrSelfAssessed`, `racinesStep`, `discoveryProgress`, `activationIntent`. Toute autre clé est refusée (400). `discoveryProgress` se fusionne en **union triée**, jamais en remplacement destructif.

`GET /api/funnel` retourne `{ step, hasActivation, learningPath }` pour usage client.

## 4. Reprise (résumé)

| Cas | Destination |
|---|---|
| Anonyme accède à `/onboarding` ou `/decouverte/*` | `/login` (préserve la locale). |
| Nouvel utilisateur (aucun LP) | `/onboarding` (choix univers). |
| Universe choisi mais formulaire pas fini | `/onboarding/{monde,racines}` (reprise formulaire). |
| Formulaire fini, langue active | `/decouverte/[prochain non-complété]`. |
| Formulaire fini, langue non active | `/decouverte/attente`. |
| 4 leçons complètes, pas d'intention | `/decouverte/bilan`. |
| Intention persistée | `/dashboard`. |
| Utilisateur activé (grant actif) | `/dashboard` (skip funnel). |
| Rôle `TEACHER` / `CENTER` / `ADMIN` | Espace pro (proxy P0.A restrictions). |

## 5. Langues actives et « bientôt disponibles »

Source unique : `src/lib/discovery.ts` — `LANGUAGES` liste toutes les langues du produit avec un statut `active` ou `soon`.

| Univers | Langue | Statut | Contenu de découverte |
|---|---|---|---|
| Monde | Allemand (deutsch) | ✅ active | 4 leçons (Guten Tag / Meine Familie / Essen und Trinken / Meine Wohnung) |
| Monde | Anglais (anglais) | ⏳ soon | — |
| Monde | Français (francais) | ⏳ soon | — |
| Racines | Wolof | ⏳ soon | — |
| Racines | Douala | ⏳ soon | — |
| Racines | Lingala | ⏳ soon | — |
| Racines | Bambara | ⏳ soon | — |

Une langue n'est jamais promue « active » sans ses 4 leçons complètes. Les langues `soon` conduisent honnêtement à `/decouverte/attente` avec le message : « Ta langue arrive bientôt sur YEMA. »

## 6. Auto-évaluation

### Monde (CECRL A1–C1)

Actuellement dérivée du `startPoint` du formulaire existant :

| `startPoint` | Niveau CECR |
|---|---|
| `beginner` | A1 |
| `some_basics` | A2 |
| `test` | Route vers `/test-niveau` (test complet 30 questions) |

Le niveau est persisté à la fois dans `LearningPath.currentLevel` (colonne) et dans `onboardingAnswers.cefrSelfAssessed` (miroir JSON). L'utilisateur peut le corriger via le lien « Corriger mon niveau » sur `/decouverte/bilan`.

**Aucune IA, aucun score pseudo-scientifique, aucune promesse de certification.**

### Racines (Étapes É1–É5)

Actuellement dérivée du `startPoint` du formulaire existant :

| `startPoint` | Étape Racines |
|---|---|
| `beginner` | E1 (Écoute) |
| `some_basics` | E2 (Voix) |
| `test` | E3 (Récit) |

**Aucun mapping vers CECRL** — Racines a son échelle propre par doctrine.

## 7. Discovery lessons (deutsch)

Chaque leçon a :
- Titre + objectif (FR/EN)
- Intro courte (2-3 phrases)
- 4-6 mots de vocabulaire (allemand / français / anglais)
- 2 exercices MCQ déterministes avec explication
- Pas d'audio inventé (aucune leçon n'a de champ `audio` — on n'affiche pas de lecteur vide)

Contenu adapté du track A1 Beta déjà seedé (`src/data/a1-beta-modules.ts`). Rien n'est généré à la volée par une IA.

## 8. Activation

### Monde

Sélection : niveau CECR (A1..C1) + devise (XAF/EUR). Le suivi professeur est affiché comme **« Bientôt disponible »** (verrouillé) tant que la messagerie humaine n'est pas branchée.

Grille lue depuis `src/lib/pricing.ts` — `WORLD_PASSAGE_PRICES` :

| Niveau | XAF | EUR |
|---|--:|--:|
| A1 | 49 000 | 75 |
| A2 | 55 000 | 79 |
| B1 | 59 000 | 89 |
| B2 | 69 000 | 109 |
| C1 | 79 000 | 129 |

### Racines

Sélection : Solo/Famille + fréquence (mois/an) + devise (XAF/EUR). Coach de langue **« Bientôt disponible »** (verrouillé, `RACINES_COACH_OPERATIONAL = false`).

Grille lue depuis `src/lib/pricing.ts` — `AFRICAN_SOLO` et `AFRICAN_FAMILY` :

| Offre | XAF/mois | XAF/an | EUR/mois | EUR/an |
|---|--:|--:|--:|--:|
| Solo | 3 500 | 35 000 | 9,90 | 99 |
| Famille | 9 900 | 99 000 | 19,90 | 149 |

## 9. Limites paiement

P1 **ne construit pas** le paiement. À l'écran d'activation :

- Aucun ordre payé n'est créé.
- Aucun `AccessGrant` n'est accordé.
- Aucun appel Stripe, CinetPay, MTN MoMo, ni fournisseur tiers.
- Aucun message « paiement réussi ».

Le CTA final enregistre l'intention et affiche `StateBlock kind="success"` avec le message : « Ton choix est enregistré. La suite s'écrit avec toi. »

## 10. Sécurité et ownership

- Toutes les routes de découverte + activation sont protégées par le proxy Next 16 : `PROTECTED_ROUTES["/decouverte"] = ["STUDENT","ADMIN"]`, idem `/activation-intent`. TEACHER/CENTER n'y accèdent pas par défaut.
- `POST /api/funnel PATCH` valide côté serveur : (a) authentification, (b) champs whitelistés, (c) valeurs enum, (d) contraintes universe (Monde requiert PASSAGE + cefrLevel, Racines requiert offer + period).
- Les IDs de LearningPath ne sont jamais lus depuis un paramètre URL : le `PATCH` charge le LP actif de l'utilisateur authentifié, jamais autrui.
- Aucune donnée de paiement collectée dans cette phase.

## 11. Tests

Suite vitest : **154 tests dans 14 fichiers**. P1 ajoute :

- `src/lib/__tests__/funnel-state.test.ts` — 17 assertions sur la dérivation d'état (ACCOUNT_READY … ACTIVATED).
- `src/lib/__tests__/discovery.test.ts` — 13 assertions sur le contenu (statut langues, 4 leçons exactement, aucun fake).
- `src/app/__tests__/p1-routing.test.ts` — 20 assertions sur proxy, routing, validation API, absence de faux paiement.

## 12. E2E

Script Playwright : `scripts/test-baseline/p1-e2e-funnel.mjs` — parcours Monde FR sur viewports 390 et 1440.

Résultats (2026-07-22, baseline P-1) :

| Route | 390 | 1440 |
|---|--:|--:|
| `/fr/onboarding` (router → decouverte/1) | 0 pageOvf | 0 pageOvf |
| `/fr/decouverte/1` (Guten Tag !) | 0 | 0 |
| `/fr/decouverte/2` (Meine Familie) | 0 | 0 |
| `/fr/decouverte/3` (Essen und Trinken) | 0 | 0 |
| `/fr/decouverte/4` (Meine Wohnung) | 0 | 0 |
| `/fr/decouverte/bilan` | 0 (redirige vers /1 tant que 4 leçons pas faites) | 0 |
| `/fr/activation-intent` | 0 | 0 |

**14/14 rendus : pageOverflow = 0**, H1 présent partout, 1 console error par page (identique aux autres pages authentifiées — manifest icon 404 hors scope).

Landing FR/EN : **0 régression**, 0 leak de classe P1.

## 13. Checklist pour ajouter une nouvelle langue

1. Ajouter la ligne dans `LANGUAGES` (`src/lib/discovery.ts`) avec `status: "active"` et `activatedAt`.
2. Ajouter les 4 leçons complètes dans `DISCOVERY_LESSONS[langId]` — vocab réel, exercices déterministes, explications concrètes, aucun audio inventé.
3. Ajouter un cas dans `src/lib/__tests__/discovery.test.ts` (le test `for … of LANGUAGES.filter(active)` couvre automatiquement).
4. Vérifier que la langue existe dans `enum LanguageCode` Prisma. Si absente, ajouter une migration additive.
5. Vérifier `prismaLangToId` : la lowercase du code Prisma doit matcher l'id.
6. Ne pas promouvoir avant que les 4 leçons soient revues éditorialement.

## 14. Écarts P1 vs spec

État par point de la spec :

| Point | Statut | Note |
|---|---|---|
| Choix univers | ✅ DONE | Réutilise les portes existantes de `/onboarding`. |
| Choix langue avec active/soon | ✅ DONE | `/decouverte/attente` couvre les langues soon honnêtement. |
| Auto-évaluation Monde CECR | ⚠️ PARTIAL | Actuellement dérivée du `startPoint` du formulaire existant (3 options). Une vraie sélection 5-options CECR reste à ajouter en P1.5 ou P2 si le produit le décide. |
| Auto-évaluation Racines É1-É5 | ⚠️ PARTIAL | Idem, dérivée du `startPoint`. |
| 4 leçons deutsch | ✅ DONE | Contenu réel adapté du track A1 Beta. |
| 4 leçons Racines | 🚫 BLOCKED | Aucune langue Racines n'a de contenu seedé. Écran waitlist honnête à la place. |
| Bilan de découverte | ✅ DONE | Données réelles uniquement. |
| Activation Monde | ✅ DONE | Grille alignée P0.A. |
| Activation Racines | ✅ DONE | Solo/Famille + fréquence + devise. Coach = bientôt. |
| Paiement | 🚫 OUT OF SCOPE | Prévu P5. |
| Reprise d'étape | ✅ DONE | Router `/onboarding` dérive de la DB. |
| Locales FR/EN | ✅ DONE | Textes bilingues sur tous les nouveaux écrans. |
| Mobile-first | ✅ DONE | Réutilise les primitives P0.B (data-list, filter-row, safe-area). |
| Accessibilité | ✅ DONE | radiogroup + aria-checked, min-height 44px, focus-visible, StateBlock. Zoom 200% et clavier E2E via le script `p0b-a11y-check.mjs` (validé sur admin/center — les mêmes primitives valent pour le funnel). |
| Tests | ✅ DONE | 154/154 passent. |
| Landing | ✅ DONE | 0 régression. |

## 15. Décision produit à trancher plus tard

- Faut-il un vrai écran d'auto-évaluation 5 options (CECR complet) ou garder les 3 options actuelles ?
- Le mapping `beginner→A1`, `some_basics→A2` est-il assez granulaire ?
- Faut-il seeder Wolof (ou une autre langue Racines) avant de retirer l'écran waitlist ?

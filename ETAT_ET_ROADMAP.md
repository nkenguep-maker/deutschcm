# YEMA — État réel par persona + roadmap de lancement

**Audit effectué le 19 septembre 2026**  
**Branche auditée :** `fix/p4-7-social-notification-authz`  
**Commit audité :** `7738ca4be879a8e9dde08507a38af8698833ae96`  
**PR :** #29 — `feat(open-beta): public registration funnel and P4.7 hardening`

> Cette tâche est volontairement un **CONSTAT + PLAN**. Aucun correctif produit n'est inclus dans ce commit.

## Méthode et limites de l'audit

- Lecture du code réel : routes, composants, API, Prisma, accès, tests et flags.
- Vérification read-only du projet Supabase P-1 `kzzagbojjkivdzzcrmxn`.
- Vérification des GitHub Actions du commit audité.
- `AUDIT.md` n'existe pas à la racine ni dans `docs/` sur la branche auditée.
- `yema_schema_utilisateurs_v2.md` n'a pas été trouvé non plus. Le schéma réel `prisma/schema.prisma` est donc utilisé comme source de vérité technique.
- La doctrine produit existante `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md` est prise en compte quand elle contredit des hypothèses historiques.

### Légende

- ✅ fonctionne / est réellement construit
- 🟠 partiel, fragile, ou dépend d'un flag / d'un provisionnement manuel
- 🔴 cassé pour le parcours attendu / bloque le lancement de ce persona
- ⚪ pas encore construit

---

# PARTIE 1 — ÉTAT RÉEL PAR PERSONA

## 1. VISITEUR — non inscrit

### Parcours attendu

`accueil → langues → méthode → tarifs (2 portes) → offre → register avec contexte`

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Landing FR/EN | ✅ | `/fr` et `/en` sont les surfaces canoniques. `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md:1-49`. |
| Navigation Langues | ✅ | `LandingNav` route vers `/{locale}/langues`. `src/components/landing/LandingNav.tsx:99`. |
| Navigation Méthode | ✅ | Route `/{locale}/methode`. `src/components/landing/LandingNav.tsx:100`. |
| Navigation Tarifs | ✅ | Route `/{locale}/pricing`. `src/components/landing/LandingNav.tsx:101`. |
| Deux portes tarifaires | ✅ | `/pricing/monde` et `/pricing/racines` sont explicitement testées. `src/lib/__tests__/publicPricingBetaGate.test.ts:9-12`. |
| Grille Monde | ✅ | Passage A1→C1 + supplément professeur centralisés. `src/lib/pricing.ts:16-31`. |
| Grille Racines | ✅ | Solo et Famille centralisés. `src/lib/pricing.ts:43-51`. |
| Pack professeur = supplément clair | ✅ | Affiché avec `+` et CTA contextualisé `prof=1`. `src/app/[locale]/pricing/monde/page.tsx:145-163`. |
| Offre → register avec contexte | ✅ | Monde transmet `universe/plan/prof/addon`; Racines transmet `universe=racines&plan=...`. `src/app/[locale]/pricing/monde/page.tsx:158-222`; `src/app/[locale]/pricing/racines/page.tsx:45-62`. |
| Companion non public | ✅ | Aucun Companion n'est exposé dans les pages de pricing publiques ; il reste un code produit backend. |
| Mobile / overflow / WCAG | ✅ | Tests publics sur mobile 390×844 et autres viewports avec assertion overflow + WCAG. `tests/e2e/personas/public-surfaces.spec.ts:17-82`. |
| Cohérence navigation | 🟠 | Sur `/langues`, le lien qui mène aux tarifs est encore libellé **« Manifeste » / “Manifesto”**. `src/app/[locale]/langues/page.tsx:114-152`. |
| Achat depuis une offre | 🔴 | Les CTA transmettent l'intention mais **aucun checkout réel n'est activé**. La page Racines l'écrit explicitement. `src/app/[locale]/pricing/racines/page.tsx:128-139`. |

### Prix réellement codés

**Monde — Passage**

| Niveau | FCFA | EUR | Supplément prof FCFA | Supplément prof EUR |
|---|---:|---:|---:|---:|
| A1 | 49 000 | 75 € | +30 000 | +45 € |
| A2 | 55 000 | 79 € | +40 000 | +60 € |
| B1 | 59 000 | 89 € | +50 000 | +75 € |
| B2 | 69 000 | 109 € | +60 000 | +90 € |
| C1 | 79 000 | 129 € | +75 000 | +115 € |

Source : `src/lib/pricing.ts:16-31`.

**Racines**

- Solo : 3 500 XAF/mois · 35 000 XAF/an · 9,90 €/mois · 99 €/an.
- Famille : 9 900 XAF/mois · 99 000 XAF/an · 19,90 €/mois · 149 €/an.
- Coach Racines : 30 000 XAF / 45 € par mois et par personne, mais `RACINES_COACH_OPERATIONAL=false`.

Source : `src/lib/pricing.ts:34-66`.

### Ce qui bloque le lancement de ce persona

Le visiteur peut découvrir YEMA et démarrer une inscription. Il ne peut pas encore devenir **client payant réel** depuis le site, faute de checkout/provider/callback de paiement.

---

## 2. APPRENANT MONDE — visa / procédure depuis l'Afrique

### Parcours attendu

`register(monde) → onboarding Monde → dashboard → Passage → accompagnement éventuel`

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Register contextualisé Monde | ✅ | Le contexte `universe=monde`, plan et addons est lu par le formulaire puis conservé en metadata. |
| Choix persona | ✅ | Le backend crée/maintient le rôle apprenant et renvoie `/onboarding/monde`. `src/app/api/onboarding/persona/route.ts:145-158`. |
| Onboarding Monde 2 étapes | ✅ | Deux étapes, reprise du draft, création du LearningPath, puis completion. `src/app/[locale]/onboarding/monde/OnboardingMondeForm.tsx:140-230`. |
| Intention visa / départ | ✅ | `STUDIES` et `VISA` sont mappés sur `VISA_DEPART`. `src/app/[locale]/onboarding/monde/OnboardingMondeForm.tsx:175-190`. |
| LearningPath Monde | ✅ | Créé avec `universe=MONDE`, `language=DEUTSCH` et réponses d'onboarding. |
| Reconnexion vers le bon persona | ✅ | Le dashboard relit `resolvePersonaRuntime` et choisit le LearningPath de l'univers actif. `src/app/[locale]/dashboard/page.tsx:46-100`. |
| Dashboard Monde | ✅ | Dashboard réel, cours, devoirs, classe, parcours, messages. `src/features/dashboards/student-monde/StudentMondeDashboard.tsx`. |
| Cours allemand A1 | ✅ | 6 unités × 6 leçons = 36 leçons dans le registry réel. `src/data/courses/registry.ts:1-17,57-72`. |
| Passage A2→C1 | ⚪ | La grille commerciale affiche A2-C1, mais le registry pédagogique ne contient actuellement que `de-a1`. `src/data/courses/registry.ts:1-20`. |
| Accès cours par `getEntitlements` | 🟠 | Le dashboard et le viewer lisent directement `AccessGrant` et `computeMondeAccess`, avec accès technique A1, au lieu de passer exclusivement par `getEntitlements`. `src/app/api/me/monde-dashboard/route.ts:62-97`; `src/lib/course-content/server.ts:37-66`. |
| IA / Klaus | 🔴 contrat contradictoire | La doctrine actuelle dit **« aucune intelligence artificielle dans YEMA »**, mais le moteur d'entitlements contient encore `AI_TEXT/AI_VOICE` et 5 minutes gratuites Monde. `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md:9-16`; `src/lib/entitlements/index.ts:1-48,128-135`. Aucun parcours Klaus/IA complet n'a été trouvé. |
| Examens blancs | ⚪ | `MOCK_EXAMS` existe comme capability dans le modèle/tests, mais aucun parcours d'examen blanc utilisateur complet n'a été trouvé dans les routes de lancement auditées. |
| Pack professeur | 🟠 | Le backend classe/devoir/correction existe, mais l'achat du pack n'est pas branché à un paiement réel. |
| Paiement Passage | 🔴 | Aucun endpoint checkout/provider/callback de paiement réel n'a été trouvé ; seul le simulateur interne sait créer Order/Payment/AccessGrant. `src/app/api/internal-test/simulate-payment/route.ts`. |

### Capacités attendues

Le moteur `getEntitlements` sait raisonner sur `COURSE_ACCESS`, `AI_TEXT`, `AI_VOICE`, `MOCK_EXAMS`, `CLASSROOM`, `THREAD_POST`, etc. `src/lib/entitlements/index.ts`.

**Mais il n'est pas encore l'unique chemin d'autorisation runtime.** C'est une dette structurante, pas seulement une dette de test.

### Ce qui bloque le lancement de ce persona

Pour une **bêta gratuite/technique**, l'allemand A1 autonome est déjà le parcours le plus avancé.

Pour un **lancement commercial**, bloquants :
1. paiement réel absent ;
2. accès encore réparti entre `getEntitlements` et plusieurs gates ad hoc ;
3. seule la matière allemand A1 est réellement présente ;
4. contradiction produit à trancher sur l'IA.

---

## 3. APPRENANT MONDE — déjà sur place / coach de carrière

### Parcours attendu

Même socle Monde, avec intention `SUR_PLACE` puis accompagnement coach carrière.

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Onboarding “sur place” | ✅ | `NATURALIZATION` et `TOURISM` sont mappés vers `SUR_PLACE`. `src/app/[locale]/onboarding/monde/OnboardingMondeForm.tsx:175-190`. |
| Rôle `CAREER_COACH` dans le schéma | ✅ | Existe dans `AppRole`. `prisma/schema.prisma:56-63`. |
| Produit `CAREER_COACH_ADDON` | ✅ | Existe dans `ProductCode`. `prisma/schema.prisma:67-74`. |
| Activation coach dans le modèle | 🟠 | `activation.ts` sait afficher `coach_salle` / `coach_fil` pour un grant `CAREER_COACH_ADDON`, mais aucun achat réel ne produit aujourd'hui ce grant. `src/lib/entitlements/activation.ts:45-86`. |
| Persona public “Coach carrière” | ⚪ | Le persona public `coach` actuellement codé correspond à **RACINES_COACH**, pas à `CAREER_COACH`. `src/app/api/onboarding/persona/route.ts:218-235`. |
| Workspace Career Coach | ⚪ | Aucun workspace Career Coach distinct n'a été trouvé. Les fichiers Coach actuels sont exclusivement `coach/racines`. |
| Sessions / accompagnement carrière | ⚪ | Les sessions existantes sont des sessions Coach Racines, pas carrière. |
| Achat pack coach carrière | ⚪ | Aucun CTA/paiement public fonctionnel pour `CAREER_COACH_ADDON`. |

### Ce qui bloque le lancement de ce persona

Le **modèle de données a été anticipé**, mais le persona Career Coach n'est pas un produit runtime complet. Il faut le considérer comme **V2**, pas comme une variante prête du Monde actuel.

---

## 4. APPRENANT RACINES — Solo adulte

### Parcours attendu

`register(racines) → onboarding langue/lien → dashboard Racines → contenus culturels/écoutes/progression É1→É5`

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Offre Solo publique | ✅ | Solo est affiché avec prix mensuel/annuel. `src/app/[locale]/pricing/racines/page.tsx:45-62`. |
| Register Racines | ✅ | Le plan Racines est transmis au register. |
| Choix persona / route | ✅ | Le persona apprenant Racines redirige vers `/onboarding/racines`. `src/app/api/onboarding/persona/route.ts:145-158`. |
| Onboarding 2 étapes | ✅ | Flux réel avec draft, LearningPath et completion. |
| Choix réel de langue | 🔴 | L'onboarding est actuellement **hardcodé WOLOF** : metadata `language: "wolof"` et LearningPath `language: "WOLOF"`. `src/app/[locale]/onboarding/racines/OnboardingRacinesForm.tsx:140-205`. |
| Dashboard Racines | ✅ | Dashboard dédié avec ambiance Racines, étapes, écoutes, coach, cercle. `src/features/dashboards/student-racines/StudentRacinesDashboard.tsx`. |
| Progression É1→É5 | ✅ structure | Les étapes sont modélisées et affichées ; pas de pourcentage générique imposé dans le dashboard Racines. |
| Contenu Wolof | 🔴 | Statut `MISSING`. `src/lib/racines.ts:67-78`. |
| Contenu Douala | 🔴 | Statut `MISSING`. `src/lib/racines.ts:67-78`. |
| Contenu Lingala | 🔴 | Statut `MISSING`. `src/lib/racines.ts:67-78`. |
| Contenu Bambara | 🔴 | Statut `MISSING`. `src/lib/racines.ts:67-78`. |
| Activation commerciale | 🔴 | Le code bloque intentionnellement l'ouverture tant qu'aucune langue n'est `READY`. `src/lib/racines.ts:100-104`. |
| IA côté Racines | ✅ deny serveur | `getEntitlements` refuse `AI_TEXT/AI_VOICE` pour tout LearningPath Racines. `src/lib/entitlements/index.ts:128-135`. |
| Paiement Solo | 🔴 | Aucun checkout réel ; la page indique qu'aucun paiement n'est déclenché aujourd'hui. `src/app/[locale]/pricing/racines/page.tsx:128-139`. |

### Ce qui bloque le lancement de ce persona

**Le contenu.** Le dashboard est construit, mais le produit éducatif Racines n'est pas encore ouvrable : aucune langue auditée n'est `READY`.

C'est pourquoi Racines Solo **ne doit pas être dans le premier MVP public**, malgré la maturité visuelle du dashboard.

---

## 5. APPRENANT RACINES — Famille

### Parcours attendu

`offre Famille → household → adultes/enfants → profils enfants → progression séparée`

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Offre Famille publique | ✅ | Offre dédiée avec pricing. `src/app/[locale]/pricing/racines/page.tsx:45-62`. |
| Persona Famille | ✅ | Le backend ajoute `PARENT` et route vers `/onboarding/family`. `src/app/api/onboarding/persona/route.ts:162-175`. |
| Onboarding adulte | ✅ | Prénom/nom/téléphone/ville, identité confirmée réutilisée. `src/app/[locale]/onboarding/family/page.tsx:20-105`. |
| Modèle Household DB | ✅ | `Household`, `HouseholdMembership` et `DependentProfile` existent. `prisma/schema.prisma:690-750`. |
| Création Household via onboarding public | 🟠 | `/api/onboarding/complete` attribue le rôle `PARENT`, mais ne crée pas le Household. `src/app/api/onboarding/complete/route.ts:70-95`. |
| Profils enfants sans e-mail | ✅ | Création `ChildProfile` sous `parentUserId` résolu serveur ; aucun email enfant. `src/app/api/family/children/route.ts:148-180`. |
| Limites de sièges | 🟠 | `ROOTS_FAMILY` encode 4 enfants + 2 adultes. Ce n'est pas une règle “2 enfants par adulte” ; P-1 possède en plus des fallbacks techniques. `src/lib/family/seats.ts:16-29,123-164`. |
| Session enfant / PIN | ✅ | Ownership parent, PIN vérifié serveur, rate-limit et cookie signé. `src/app/api/child-session/route.ts:56-107`. |
| Univers enfant explicite | ✅ | `ChildProfile.universe` est contrôlé et résolu fail-closed. `src/lib/family/childResolvers.ts:45-78`. |
| Messagerie enfant libre | ✅ bloquée | Un `CHILD_PROFILE` ne peut pas envoyer de message `TEXT`; les autres kinds restent gouvernés par la matrice de conversation. `src/lib/messaging/messages.ts:49-61`. |
| Progression enfant réelle | 🟠 | Les dashboards enfant et profils existent, mais le produit Famille dépend des contenus disponibles dans l'univers choisi. |
| Contenu Racines famille | 🔴 | Même blocage que Solo : aucune langue Racines n'est `READY`. `src/lib/racines.ts:67-104`. |
| Paiement / grant Household | 🔴 | Pas de checkout réel ; les grants Household réels ne sont aujourd'hui générés que par simulation interne/fixtures. |

### Ce qui bloque le lancement de ce persona

1. pas de paiement réel → pas de véritable cycle commercial `ROOTS_FAMILY → Household grant` ;
2. l'onboarding Famille ne crée pas à lui seul le Household ;
3. contenu Racines absent ;
4. logique de sièges encore mélangée à des fallbacks P-1/legacy.

**Verdict : Famille est techniquement avancé, mais pas lançable commercialement.**

---

## 6. PROFESSEUR — espace prof

### Parcours attendu

`devenir prof → validation → dashboard → devoirs → corrections → classe → messages → qualité/rémunération`

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Candidature publique | ✅ | Formulaire `/enseignants` + `/api/apply/teacher`. |
| Validation avant accès | ✅ | En Production le rôle pro n'est pas auto-granté depuis le navigateur ; P-1 possède un bypass QA isolé. |
| Dashboard prof | ✅ sous flags | Workspace réel, mais `TEACHER_WORKSPACE_ENABLED` est false par défaut et la prod exige `TEACHER_RLS_CONFIRMED`. `src/lib/flags.ts:52-72`. |
| Classes / élèves | ✅ | Queries strictement scopées au `teacherId`. `src/lib/teacher/queries.ts:41-58,74-109,232-272`. |
| Créer un devoir | ✅ | UI + POST réel et ownership classroom. `src/app/api/teacher/classes/[classroomId]/assignments/route.ts:23-51`; `src/lib/assignments/teacher.ts:117-153`. |
| Publier / fermer devoir | ✅ | Transitions réelles et audit. `src/lib/assignments/teacher.ts:197-248`. |
| Lire les submissions | ✅ | API réelle par assignment. |
| Correction / feedback | ✅ partiel | CRUD feedback réel et publication disponibles. |
| File globale de corrections | 🟠 | Le composant dit explicitement que l'agrégation cross-classroom des submissions non corrigées n'a **pas d'endpoint dédié**. `src/features/dashboards/teacher/sections/TeacherCorrectionsSection.tsx:13-24`. |
| Messagerie | 🟠 | L'espace pointe vers l'inbox générique ; fonctionnement dépend du flag Messagerie et de conversations provisionnées. |
| Rémunération prof | ⚪ | Aucun modèle/surface de payout prof trouvé dans le schéma ou le dashboard. |
| Qualité / rating prof | ⚪ | Aucun workflow métier de score qualité/notation prof trouvé. |
| Achat pack prof côté élève | 🔴 | Le pack est affiché, mais pas achetable réellement. |

### Ce qui bloque le lancement de ce persona

Le cœur pédagogique prof est bien plus avancé qu'une maquette, mais le **modèle opératoire** manque : attribution d'élèves après achat, file de correction agrégée, SLA, qualité et rémunération.

---

## 7. COACH DE CARRIÈRE — pilote

### État réel

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Rôle `CAREER_COACH` | ✅ schéma | `prisma/schema.prisma:56-63`. |
| Produit `CAREER_COACH_ADDON` | ✅ schéma | `prisma/schema.prisma:67-74`. |
| Droit d'activation | 🟠 | Mapping d'activation prévu dans `src/lib/entitlements/activation.ts`. |
| Persona public distinct | ⚪ | Le persona `coach` existant est Coach **Racines**. |
| Dashboard Career Coach | ⚪ | Aucun dashboard Career Coach distinct trouvé. |
| Sessions / messages carrière | ⚪ | Aucun parcours runtime Career Coach trouvé. |
| Paiement | ⚪ | Aucun tunnel public d'achat de l'addon carrière. |

### Clarification importante

YEMA possède aujourd'hui un **Coach Racines réel** :
- route `/coach/racines` ;
- dashboard apprenants / séances / messages / notes ;
- API sessions ;
- rôle `RACINES_COACH`.

Preuves : `src/app/[locale]/coach/racines/page.tsx:1-56`; `src/features/dashboards/coach-racines/CoachRacinesDashboard.tsx:34-89`.

Ce produit ne doit pas être confondu avec le **Career Coach** du Monde.

### Ce qui bloque le lancement de ce persona

Le Career Coach est actuellement du **design de domaine**, pas un persona runtime complet.

---

## 8. CENTRE DE LANGUES — B2B

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Landing B2B | ✅ | `/landing` est dédiée aux centres. `src/app/[locale]/landing/page.tsx:3-5`. |
| Lead / demande de démo | ✅ | Formulaire → `/api/apply/center`. |
| Onboarding Centre | ✅ / 🟠 | Existe, mais rôle Centre doit être validé ; P-1 auto-approuve uniquement pour QA. |
| Dashboard Centre | ✅ sous flags | Élèves, enseignants, classes, pending, messages. `src/features/dashboards/center/CenterDashboard.tsx:42-131`. |
| Production real data | 🟠 | Requiert `CENTER_REAL_DATA_ENABLED` **et** `CENTER_RLS_CONFIRMED`. `src/lib/flags.ts:38-51`. |
| Companion | 🟠 modèle seulement | `COMPANION` existe comme produit et dans l'écran d'activation, mais n'est pas une offre publique branchée à un achat. |
| Sièges Centre achetés | ⚪ | Aucun checkout/seat purchase réel. |
| Paiement B2B | ⚪ | La landing dit explicitement **« Sans paiement en ligne »**. `src/app/[locale]/landing/page.tsx:3-5,125,200`. |

### Ce qui bloque le lancement de ce persona

Le workspace peut être piloté/provisionné manuellement, mais le produit B2B commercial complet — contrat, achat de sièges, Companion, facturation — n'est pas construit de bout en bout.

---

## 9. ADMIN — pilotage YEMA

| Capacité | Verdict | État réel / preuve |
|---|---:|---|
| Dashboard Admin | ✅ | Console réelle avec persona runtime. |
| Vue personas QA | ✅ | Comptes/personas exposés dans console. |
| Audit events | ✅ | Lit les derniers `AuditEvent`, acteur hashé. `src/lib/admin/consoleData.ts:59-82`. |
| Flags / environnement | ✅ | Affichage des flags et état bêta. |
| Invitations bêta | ✅ | APIs invitation/access/revoke réservées ADMIN. |
| Qualité enseignants | ⚪ | Pas de surface métier Admin de quality management. |
| Paiements clients | ⚪ | Pas de console de paiement/Order opérationnelle. |
| Reversements profs/coachs | ⚪ | Pas de modèle/surface payout. |
| Gestion contenus | ⚪ | Pas de CMS/console de publication pédagogique identifiée. |
| Gestion packages/prix | ⚪ | Prix actuellement en config/code + catalogue DB, sans console Admin dédiée. |

Le dashboard redesign n'offre actuellement que **Console, Comptes, Audit, Environnement**. `src/features/dashboards/admin/AdminDashboard.tsx:30-99`.

### Ce qui bloque le lancement de ce persona

L'Admin actuel est surtout une **console technique/QA/sécurité**, pas encore le cockpit opérationnel de YEMA.

---

## 10. TRANSVERSE — ACHAT & ATTRIBUTION

| Étape | Verdict | État réel / preuve |
|---|---:|---|
| Catalogue Product/ProductVariant | ✅ | Modèles et seed présents. |
| Order / OrderItem / Payment | ✅ schéma | Modèles présents dans Prisma. |
| AccessGrant | ✅ schéma + logique | Utilisé dans plusieurs domaines. |
| Écran `/activation` | ✅ | Poll réel de `/api/activation-status`, ownership et redirection. |
| Status d'activation | ✅ | Dérivé du paiement confirmé + grants actifs. `src/lib/entitlements/activation.ts`. |
| Checkout réel | ⚪ | Aucun `/api/checkout` trouvé. |
| Provider CinetPay/Mobile Money | ⚪ | Enum/provider existe, mais aucune route provider/callback réelle trouvée. |
| Carte réelle | ⚪ | Même absence de checkout/callback. |
| Création réelle Payment confirmé | 🔴 commercial | Le seul write-path complet audité est `/api/internal-test/simulate-payment`, réservé au test interne. |
| Upgrade Solo→Famille | ⚪ | L'intention peut être conservée, mais aucun flow commercial d'upgrade n'est branché. |
| Ajout pack prof payé | ⚪ | Intention et modèle existent ; pas de transaction réelle. |
| Monde + Racines même compte | 🟠 | L'intention `roots-solo` peut être attachée au même compte Monde, mais le code précise qu'aucun accès payant n'est créé avant checkout. `src/app/[locale]/pricing/monde/page.tsx:165-222`. |

### Conclusion transverse

**Le tunnel de paiement réel est absent.**  
L'écran d'activation est réel, mais il se trouve **en aval d'un Order/Payment/Grant que le parcours public ne sait pas encore créer**.

C'est le bloquant n°1 d'un **lancement payant**.

---

# PARTIE 2 — SANTÉ TECHNIQUE

## 2.1 Parcours d'entrée register → onboarding → dashboard

### Verdict : ✅ / 🟠 globalement stable en P-1

Les briques critiques sont présentes :

- `reconcileAuthenticatedUser` centralise la réconciliation d'une identité Supabase avec Prisma. `src/lib/auth/reconcileAuthenticatedUser.ts:23-72`.
- Le callback échange le code PKCE, réconcilie, résout le persona puis redirige vers home/onboarding. `src/app/auth/callback/route.ts:40-90`.
- Le login appelle `/api/auth/sync` puis le resolver home. `src/app/[locale]/login/page.tsx:73-108`.
- Le `next` est sanitizé par `authRedirect`.
- Le proxy corrige explicitement un double préfixe `/fr/fr` / `/en/en`. `src/proxy.ts:171-175`.
- Des tests couvrent reconciliation, redirect auth et onboarding router.
- Les quatre GitHub Actions du commit audité sont vertes :
  - P4.7 Security CI ✅
  - App validation ✅
  - A1 audio validation ✅
  - Restore child payloads ✅

### Fragilités restantes

- Le flow email confirmation dépend encore de Supabase Auth/SMTP ; P-1 possède un fallback QA spécifique.
- Plusieurs parcours pro sont conditionnés par des feature flags false par défaut.
- Le parcours public est stable techniquement, mais la disponibilité d'un dashboard ne signifie pas que son **produit commercial/contenu** est prêt.

---

## 2.2 Une seule vérité d'accès ?

### Verdict : 🔴 non

Le commentaire de `getEntitlements` affirme qu'il doit être **« LA fonction unique »**. `src/lib/entitlements/index.ts:1-12`.

Pourtant, au moins **5 gates runtime ad hoc** ont été constatés :

1. `src/app/api/me/monde-dashboard/route.ts` — lit directement `AccessGrant` + `computeMondeAccess`.
2. `src/lib/course-content/server.ts` — même pattern pour ouvrir/verrouiller les cours.
3. `src/app/api/me/racines-dashboard/route.ts` — lit directement les grants et résout SOLO/FAMILY.
4. `src/lib/family/seats.ts` — calcule directement les capacités de sièges depuis les grants + fallbacks.
5. `src/app/[locale]/onboarding/page.tsx:78-90` — compte directement les grants pour orienter le funnel.

`activation.ts` n'est pas compté ici : il agrège légitimement l'état post-paiement, ce n'est pas une permission d'usage métier.

**Conclusion :** le modèle d'accès est bon sur le papier, mais la migration vers une vérité unique n'est pas finie.

---

## 2.3 Contradiction produit : IA

### Verdict : 🔴 décision nécessaire avant lancement

La doctrine produit dit :

> **« Décision définitive : aucune intelligence artificielle dans YEMA. »**

Source : `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md:9-16`.

Mais le moteur d'entitlements conserve :
- `AI_TEXT`
- `AI_VOICE`
- un cap gratuit Monde de 5 minutes.

Source : `src/lib/entitlements/index.ts:1-48`.

Ce n'est pas un simple bug visuel : c'est une contradiction entre **contrat produit** et **contrat d'autorisation serveur**.

---

## 2.4 Code legacy / doublons majeurs

### Verdict : 🟠

Au moins **5 surfaces persona** ont encore un double chemin legacy/redesign gouverné par `DASHBOARD_REDESIGN_ENABLED` :

1. Monde ;
2. Racines ;
3. Teacher ;
4. Center ;
5. Admin.

Exemples :
- `src/app/[locale]/dashboard/page.tsx` garde DashboardMonde/DashboardRacines + nouveaux dashboards.
- `src/app/[locale]/teacher/page.tsx` garde `TeacherDashboardView` + `TeacherDashboard`.
- `src/app/[locale]/center/page.tsx` garde `CenterDashboardView` + `CenterDashboard`.
- `src/app/[locale]/admin/page.tsx` garde `LegacyAdminDashboard` + `AdminDashboard`.

**Logo V sur /login :** non constaté sur la branche auditée ; la page utilise `BrandLockup`. `src/app/[locale]/login/page.tsx:9,147-149`.

---

## 2.5 Tests

### État constaté

La PR #29 touche **au moins 90 fichiers de tests** :
- 82 fichiers `.test.ts/.test.tsx`
- 8 specs E2E.

Couvertures visibles :
- auth/reconciliation ;
- persona routing ;
- pricing ;
- sécurité P4.7 ;
- RLS ciblé ;
- child session/PIN ;
- messaging ;
- Teacher assignments ;
- public surfaces ;
- responsive / WCAG ;
- German A1 ;
- audio ;
- closed/open beta.

### Trous critiques non couverts de bout en bout

1. aucun vrai provider de paiement à tester ;
2. aucun callback CinetPay/carte réel ;
3. Career Coach inexistant ;
4. aucun parcours commercial Racines possible tant que contenu MISSING ;
5. Admin business ops inexistantes ;
6. pas de validation production-like des achats/upgrades/packages ;
7. la matrice complète des 9 personas existe en QA, mais plusieurs personas sont encore des workspaces techniques plutôt que des produits lançables.

---

## 2.6 Secrets / config

### Verdict : ✅ sur le diff audité

Un scan des **308 fichiers modifiés de la PR** n'a trouvé aucune valeur de secret évidente versionnée.

Seule occurrence détectée :
- `.env.p1-baseline.example` contient un placeholder `SUPABASE_SERVICE_ROLE_KEY=<coller...>`, pas une clé réelle.

Cela ne constitue pas une preuve cryptographique de tout l'historique Git, mais le diff courant ne montre pas de secret sensible hardcodé.

---

## 2.7 RLS / sécurité base P-1

### Verdict : 🔴 bloquant avant ouverture publique

La vérification live read-only de Supabase P-1 au 19/09/2026 signale :

- **51 tables du schéma `public` avec RLS désactivé**, advisory **critical** ;
- 4 tables avec RLS activé mais aucune policy : `beta_invitations`, `child_profiles`, `roots_coach_sessions`, `roots_coach_session_notes` ;
- protection contre mots de passe compromis désactivée (WARN).

Le correctif ne doit **pas** être appliqué en masse aveuglément : activer RLS sans policies casserait les accès. Il faut une migration table par table, avec policies + tests de rôle.

Référence Supabase : https://supabase.com/docs/guides/database/postgres/row-level-security

---

## 2.8 Tunnel de paiement

### Verdict : 🔴 absent en production

Confirmé :
- modèles DB présents ;
- écran d'activation présent ;
- simulateur interne présent ;
- **pas de checkout réel, pas de provider callback réel**.

Donc :
- **bêta gratuite** : peut avancer sans paiement ;
- **lancement commercial payant J1** : impossible dans l'état actuel.

---

# PARTIE 3 — ROADMAP DE LANCEMENT

## Décision de scope recommandée

### MVP recommandé : **Visiteur + Apprenant Monde autonome — allemand A1**

Pourquoi :
- funnel register/onboarding/dashboard réel ;
- contenu réel 6 unités / 36 leçons ;
- progression et reprise existantes ;
- parcours le moins dépendant d'un humain, d'un Household, du B2B ou d'un contenu manquant ;
- le test P-1 existe déjà.

### Ne pas mettre dans le MVP initial

- **Racines Solo** : aucune langue n'est `READY`.
- **Famille** : dépend de Racines + household/seat commercial.
- **Pack Professeur** : backend avancé, mais pas d'achat/attribution/rémunération.
- **Career Coach** : pas construit comme persona runtime.
- **Centre** : workspace réel mais commercial B2B/sièges absent.
- **Admin business ops** : pas encore construit.

---

## PHASE 0 — Bloquants absolus

| Item | Pourquoi / persona | Effort | Dépendances |
|---|---|---:|---|
| RLS consolidation des 51 tables exposées | Sécurité de **tous** les personas | L | Matrice de rôles, tests P-1, policies table par table |
| Trancher le contrat **Aucune IA** vs capabilities AI encore présentes | Évite de lancer un produit dont le backend contredit la doctrine | S décision / M alignement | Décision produit Paul |
| Unifier les gates d'accès autour de `getEntitlements` | Monde, Racines, Famille, achats | M/L | RLS + inventaire des 5 gates ad hoc |
| Décider **gratuit beta vs payant J1** | Détermine si le paiement est Phase 0 ou Phase 1 | S | Décision business |
| Si payant J1 : checkout + provider + webhook/callback + idempotence + grants | Tous les produits commerciaux | L | Catalogue, Order, Payment, AccessGrant déjà présents |
| Geler le scope contenu du MVP à **Allemand A1** | Évite de vendre A2-C1 / Racines non disponibles | S | Copy/pricing commerciale honnête |

### Critère de sortie Phase 0

On passe à la suite quand :
- aucune table utilisateur critique n'est publiquement exposée sans politique voulue ;
- l'architecture d'accès possède une vérité serveur claire ;
- la politique IA est cohérente code + produit ;
- le modèle de lancement gratuit/payant est décidé ;
- si payant : un paiement sandbox crée de manière idempotente `Order → Payment → AccessGrant → activation`.

---

## PHASE 1 — MVP lançable

### Personas servis

1. **Visiteur**
2. **Apprenant Monde autonome — allemand A1**

| Item | Valeur | Effort | Dépendances |
|---|---|---:|---|
| Fresh-account E2E FR + EN | Prouve acquisition→usage | M | Phase 0 |
| Register → confirmation → persona → onboarding → dashboard → relogin | Parcours cœur | S/M | Auth |
| Allemand A1 : 36 leçons, progression, reprise | Produit éducatif réel | M QA | Contenu existant |
| Responsive / a11y / mobile final | Conversion et usage Afrique/mobile | M | Surfaces MVP |
| Monitoring erreurs auth/course | Support lancement | S/M | Vercel/Supabase |
| Si lancement payant : Passage A1 réel seulement | Monétisation honnête | L déjà Phase 0 | Paiement |
| Si bêta gratuite : accès beta explicitement limité A1 | Vitesse de lancement | S | Technical beta gate |

### Critère de sortie Phase 1

Une personne avec **une adresse neuve**, sur mobile comme desktop, peut :

`landing → register → confirmation → Élève Monde → Allemand A1 → dashboard → ouvrir cours → progresser → logout → login → reprendre`

sans intervention manuelle Admin et sans accès non autorisé.

---

## PHASE 2 — Premières cohortes / humain / foyer

### 2A — Professeur Monde

- rendre le pack Prof réellement achetable ;
- attribuer la classe/prof après grant ;
- compléter la file globale de corrections ;
- SLA de feedback ;
- messagerie réelle ;
- qualité prof ;
- rémunération / reversement.

**Effort : L**

### 2B — Racines Solo

Avant lancement :
- sélectionner **une seule langue pilote** ;
- produire le contenu jusqu'au seuil `READY` défini par `racines.ts` ;
- rendre le choix de langue réel dans l'onboarding ;
- brancher ROOTS_SOLO au paiement/grant ;
- vérifier “aucune IA” de bout en bout.

**Effort : L**, principalement contenu + QA.

### 2C — Famille

- création Household canonique pendant l'activation Famille ;
- règles de sièges définitives sans fallback legacy ;
- ajout enfants + PIN + parental controls ;
- progression par enfant ;
- offre ROOTS_FAMILY réelle ;
- upgrade Solo→Famille.

**Effort : L**

### Critère de sortie Phase 2

- Prof : élève paie → prof attribué → devoir → submission → correction → message → suivi.
- Racines : au moins une langue réellement `READY` avec parcours complet.
- Famille : paiement Famille → Household/grant → enfants → session PIN → progression séparée.

---

## PHASE 3 — Échelle

### Centre / B2B

- Companion/sièges réellement commercialisés ;
- provisioning de sièges ;
- facturation B2B ;
- classes du centre ;
- Admin Centre ;
- support et reporting.

### Career Coach

- persona distinct ;
- onboarding ;
- attribution ;
- sessions ;
- messagerie ;
- paiement ;
- KPI carrière.

### Admin opérationnel

- qualité prof/coach ;
- paiements ;
- reversements ;
- packages/prix ;
- contenus/publication ;
- support comptes.

### Plateforme

- PWA/stores si la donnée d'usage le justifie ;
- suppression des 5 doubles chemins legacy/redesign ;
- consolidation schéma legacy ;
- observabilité et optimisation DB/indexes.

### Critère de sortie Phase 3

Chaque activité commerciale possède :
- propriétaire métier ;
- droit serveur ;
- facture/paiement ;
- provisioning ;
- support ;
- audit ;
- métriques.

---

# TOP 3 — CETTE SEMAINE

## 1. Sécuriser la base avant toute ouverture publique

**RLS consolidation P-1, table par table, avec policies et tests.**

C'est le risque le plus grave constaté : 51 tables `public` ont RLS désactivé dans P-1.

## 2. Prendre la décision de lancement : gratuit beta ou payant J1

Cette décision change immédiatement la roadmap :

- **gratuit beta** → YEMA peut concentrer la semaine sur German A1 + sécurité + QA ;
- **payant J1** → le checkout devient le chantier principal avant tout lancement.

## 3. Faire du German A1 le seul contrat MVP et le rejouer de bout en bout

Pas de promesse A2-C1, pas de Racines, pas de Career Coach dans le premier contrat utilisateur tant que les ressources ne sont pas prêtes.

Rejouer :
- FR + EN ;
- mobile + desktop ;
- adresse neuve ;
- confirmation ;
- onboarding ;
- cours ;
- progression ;
- reconnexion ;
- accès interdit.

---

# QUESTION OUVERTE N°1 À TRANCHER

> **YEMA lance-t-il d'abord une bêta gratuite/contrôlée de l'Allemand A1, ou doit-il encaisser un paiement réel dès le Jour 1 ?**

### Si bêta gratuite

C'est le chemin **le plus court** vers de vrais utilisateurs :
- sécurité/RLS ;
- German A1 ;
- auth ;
- QA ;
- cohortes ;
- apprendre des usages avant d'étendre.

### Si payant dès J1

Alors le tunnel :

`pricing → checkout → provider → callback → Order/Payment → AccessGrant → activation`

devient **Phase 0 obligatoire**, avant le lancement.

---

# VERDICT FINAL

YEMA n'est **pas encore lançable comme plateforme complète 9-personas commerciale**.

En revanche, le produit n'est plus un prototype superficiel :

- le funnel identité/persona existe ;
- les dashboards principaux existent ;
- l'allemand A1 possède un vrai cours ;
- Teacher assignments/corrections ont un vrai backend ;
- Famille/enfants/PIN ont un vrai socle ;
- messaging possède un modèle d'autorisation substantiel ;
- Center/Coach Racines ont de vrais workspaces ;
- l'activation post-Order existe.

Le chemin le plus court vers le marché n'est donc pas de construire davantage de personas.

Il est de :

1. **sécuriser la base** ;
2. **réduire la promesse au produit réellement prêt** ;
3. **lancer German A1 autonome** ;
4. apprendre des premières cohortes ;
5. ouvrir ensuite Racines, Prof, Famille et B2B quand leurs dépendances réelles sont prêtes.

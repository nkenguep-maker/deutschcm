# YEMA — Analyse d'écarts produit et doctrine

> **Document d'analyse — aucune modification de code, aucune correction. Compagnon direct de `YEMA_PRODUCT_DESIGN_DOCTRINE.md`.**
>
> La landing `/fr` et `/en` reste `CANONICAL` et n'apparaît dans aucune recommandation d'amélioration visuelle. Ses éventuelles anomalies sont documentées uniquement dans l'annexe A.

Base de comparaison : commit `2776fab` (Phase A.1 mergée sur main). Branche courante `docs/yema-product-doctrine`. Aucune donnée authentifiée n'a pu être atteinte pendant l'audit (voir §11).

---

## Convention de statut visuel

**Mise à jour post-P-1 (2026-07-22)** : le lot P-1 (baseline authentifiée) a été exécuté sur le projet Supabase dédié `yema-p1-baseline`. Voir `docs/YEMA_AUTHENTICATED_BASELINE.md` pour le détail. La majorité des marqueurs `CODE_AUDITED_VISUAL_PENDING` sont désormais `RENDERED_AUTHENTICATED` (avec preuves Playwright réelles à 4 breakpoints).

Convention en vigueur :

- **`RENDERED_AUTHENTICATED`** : rendu vérifié avec session Supabase réelle (cookies chunkés `sb-<ref>-auth-token`) sur au moins un compte de test, à 360/390/768/1440.
- **`CODE_AUDITED_VISUAL_PENDING`** (résiduel) : source lue mais non observé en runtime authentifié — soit id dynamique non ciblé par le sweep (`/famille/enfant/[id]`, `/classroom/[id]/assignment/[aid]`, `/discover/{center,class,group}/[id]`, `/test-niveau/results`, `/activation`), soit onboarding partiel (`/onboarding/{monde,racines,teacher,center}` derrière le router `/onboarding`).
- Le rendu visuel non vérifié **reste explicitement noté**.

Périmètre `CODE_AUDITED_VISUAL_PENDING` :

```text
/dashboard
/famille
/famille/enfant/[profilId]
/classroom
/classroom/join
/classroom/[classroomId]
/classroom/[classroomId]/assignment/[assignmentId]
/group
/group/create
/group/join
/teacher
/teacher/*  (10 pages incluant classrooms, students, assignments, stats, resources, studio, settings, activities, classroom/new, classroom/[id])
/center
/center/*  (5 pages : teachers, students, classes, billing, stats)
/admin
/admin/*   (6 pages : users, courses, applications, roles, system, centers, courses/generate)
/onboarding/monde
/onboarding/racines
/onboarding/teacher
/onboarding/center
/test-niveau/results
/activation
/settings
/notifications
/discover/center/[centerId]
/discover/class/[classroomId]
/discover/group/[groupId]
```

Une fois P-1 exécuté (roadmap) et les baselines authentifiées capturées, ce marqueur pourra être levé page par page.

---

## 1. Résumé exécutif

YEMA dispose déjà de fondations solides : une landing canonique publiée, un système de tokens Kaffeehaus (espresso / brass / terre / terracotta) documenté dans `globals.css`, des composants d'états unifiés (`StateBlock`, `LessonComplete`, `LevelUp`), un funnel Racines réel (`/famille`), un ensemble de layouts par territoire (`Layout`, `TeacherLayout`, `CenterLayout`, `FoyerSidebar`) et une page pricing scindée par univers (Monde / Racines). Sur le plan technique, la Phase A.1 (zéro IA) et la Phase A.2 (alignement `child_profiles`) préparent une bêta cohérente.

Trois écarts structurels dominent l'audit :

1. **Le dashboard `/dashboard` est le dashboard Foyer/Racines**, pas le dashboard Monde décrit en §20 de la doctrine. Aucun dashboard Monde dédié (greeting Monde, hero de progression CECRL, 4 parcours Leçons/Exercices/Écoute/Examens blancs, bloc suivi professeur) n'est aujourd'hui rendu. FONCTIONNEL P0.
2. **Le funnel canonique de la doctrine §11-14 (seuil → territoire → langue → auto-évaluation → 4 cours découverte → activation) n'est pas encore matérialisé côte à côte** : `/setup-role` cible un rôle (STUDENT/TEACHER/CENTER), `/onboarding` aiguille vers Monde/Racines, `/onboarding/monde` demande "pourquoi + point de départ", mais il n'existe ni écran "choix territoire" en portes visuelles, ni écran "choix langue" pour Racines, ni écran "auto-évaluation Racines déclarative", ni "quatre cours de découverte" gratuits contigus. FONCTIONNEL P1.
3. **Les tarifs Monde présents dans `src/lib/pricing.ts` divergent de la grille doctrinale §17** sur A2/B1/B2/C1. Le coach de langue Racines à **prix unique 30 000 XAF / 45 € par mois** (spec Suivi humain §1-2) n'est ni catalogué (`prisma/seed.ts`) ni exposé dans `/pricing/racines`. DONNÉES/COMMERCE P0.

À côté, plusieurs pages authentifiées (`/dashboard`, `/famille`, `/teacher/*`, `/center/*`, `/admin/*`) n'ont pu être rendues sans session : l'audit visuel de leur état réel reste à compléter avec des credentials de test.

Zéro appel IA restant côté runtime. Zéro lien `/simulateur` visible dans la sweep. `AUDIT.md` non tracké préservé.

---

## 2. Landing page canonique — principes extraits

La landing (`src/app/[locale]/page.tsx` + `src/components/seuil/*` + `src/components/maison/*` + `LandingNav` + `LandingFooter`) porte le langage YEMA à préserver :

| Principe extrait | Manifestation | Fichier |
|---|---|---|
| Écran d'accueil immersif comme rituel d'entrée | `<Seuil>` avec greeting polyglotte et film de veillée | `src/components/seuil/Seuil.tsx` |
| Six pièces narratives de « la maison » | MaisonCouture · MaisonVeillee · MaisonVisages · MaisonEchelle · Teaser · MaisonPorte | `src/components/maison/*` |
| Fraunces pour l'âme, Manrope pour la fonction | H1 « L'Afrique parle. Toutes ses langues. » | `MaisonCouture.tsx` |
| Dualité Monde/Racines représentée par deux échelles côte à côte, pas fondues | CECRL A1-C1 vs YEMA É1-É5 dans la même section | `MaisonEchelle.tsx` |
| Mur des visages : photographie réelle assumée comme signature | Portraits + légendes | `MaisonVisages.tsx` |
| Ton éditorial « chaleureux, direct, digne » | Copy Fraunces italic pour les grands moments (« Entrez, la maison est ouverte ») | `MaisonPorte.tsx` |
| Palette Kaffeehaus, jamais SaaS | Fonds espresso/terre, hairlines brass/terracotta | `globals.css` (var --world-*, --roots-*) |
| Navigation minimale, footer discret | 5-6 items nav maximum, footer factuel | `LandingNav.tsx`, `LandingFooter.tsx` |

Corollaire : les dashboards et espaces produits doivent partager cet ADN sans **copier** la structure marketing narrative. Ils portent la fonction ; la landing porte le récit.

---

## 3. Pages déjà solides

| Route | Fichier | Classification | Territoire | Justification |
|---|---|---|---|---|
| `/fr`, `/en` | `[locale]/page.tsx` | **CANONICAL** | seuil + monde/racines | Validée par Paul. Structure fixe, ADN complet. À ne jamais modifier. |
| `/fr/pricing`, `/en/pricing` | `[locale]/pricing/page.tsx` | GOOD_BUT_INCOMPLETE | seuil (deux portes, BrandY confluent) | Structure "seuil" propre, réutilise Landing­Nav/Footer, aucun prix visible. Manque : ancrage clair vers `/pricing/monde` et `/pricing/racines` avec la nouvelle grille tarifaire (§17) et le coach Racines. |
| `/fr/pricing/monde` | `pricing/monde/page.tsx` | GOOD_BUT_INCOMPLETE | monde | Rend "Un niveau complet, à votre rythme." Structure cohérente Kaffeehaus. **Écart** : prix A2-C1 divergent de la doctrine. |
| `/fr/pricing/racines` | `pricing/racines/page.tsx` | GOOD_BUT_INCOMPLETE | racines | H1 "Habiter la langue. La transmettre." Structure cohérente. **Écart** : suivi coach de langue Racines (30 000/45 €) non exposé séparément. |
| `/fr/login`, `/en/login` | `[locale]/login/page.tsx` | GOOD_BUT_INCOMPLETE | seuil | H1 "Rentrez. On vous attendait." Belle direction. Manque état loading/error explicites autres que texte, et password recovery lien absent. |
| `/fr/register`, `/en/register` | `[locale]/register/page.tsx` | GOOD_BUT_INCOMPLETE | seuil | H1 "Créer votre compte." Formulaire fonctionnel. Manque étape immédiate post-register (redirection setup-role/onboarding a été observée). |
| `/fr/methode` | `[locale]/methode/page.tsx` | GOOD_BUT_INCOMPLETE | monde/racines | 401 lignes, "Six principes. Toutes les langues." Densité éditoriale forte, à valider photo/portrait. |
| `/fr/langues` | `[locale]/langues/page.tsx` | GOOD_BUT_INCOMPLETE | monde/racines | 359 lignes, deux territoires côte à côte, sans drapeaux (conforme §13). |
| `/fr/manifeste` | `[locale]/manifeste/page.tsx` | GOOD_BUT_INCOMPLETE | seuil | H1 "Le continent qui apprend. Le monde qui écoute." Cohérent avec la landing. |
| `/fr/privacy`, `/fr/terms` | `[locale]/{privacy,terms}/page.tsx` | GOOD_BUT_INCOMPLETE | légal | Rendus stables (body ~3000), utilisent `LegalShell`. |
| `/fr/goodbye` | `[locale]/goodbye/page.tsx` | GOOD_BUT_INCOMPLETE | seuil | Écran post-logout propre. Overflow=1 mobile 360/390 (pré-A.1, à traiter en polish P6). |
| `/fr/quiz/demo`, `/fr/schreiben/demo`, `/fr/hoeren/demo` | `[locale]/{quiz,schreiben,hoeren}/demo/page.tsx` | FUNCTIONALLY_INCOMPLETE | démonstration | Fonctionnent post-A.1 (StateBlock canonique côté quiz, éditeur écrit dépouillé). Contenu très maigre (`quiz/demo` body=210). |

---

## 4. Pages incomplètes ou hors doctrine

Colonne « Statut visuel » : `RENDERED` = capturé Playwright réellement · `CODE_AUDITED_VISUAL_PENDING` = source lue, rendu authentifié non vérifié (voir Convention de statut visuel ci-dessus).

| Route | Fichier | Classification | Statut visuel | Écart doctrinal principal |
|---|---|---|---|---|
| `/fr/dashboard` | `[locale]/dashboard/page.tsx` (151l) | **FUNCTIONALLY_INCOMPLETE** | `CODE_AUDITED_VISUAL_PENDING` | Rend le dashboard Foyer/Racines (FoyerTopbar + FoyerHero + FoyerSpine + FoyerCapCard + ClasseStrip + AutreVoixStrip + FoyerTools). Aucune structure Monde §20 (greeting Monde, hero CECRL, 4 parcours). Territoire basculé via `data.activeLangue.territory` seulement. Recommandation provisoire jusqu'à baseline authentifiée. |
| `/fr/famille` | `[locale]/famille/page.tsx` (351l) | GOOD_BUT_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Sélecteur "Qui apprend ce soir ?" présent, création de profil enfant fonctionnelle post-A.2. À aligner sur §21.8 (Foyer Famille) : mur de profils, âge, dernière activité, invitation. Rendu non observé en authentifié. |
| `/fr/courses`, `/fr/courses/[courseId]/modules/[moduleId]` | `courses/*` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Rendus non atteignables (auth). Doctrine §20.5 exige entrées "Leçons/Exercices/Écoute/Examens blancs" avec état locked/unlocked, progression et prochaine action — à confirmer sur les rendus authentifiés. |
| `/fr/progress` | `progress/page.tsx` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Idem, non rendu sans session. Doctrine §22 exige représentation CECRL vs YEMA distincte. |
| `/fr/settings`, `/fr/notifications` | pages présentes | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only, non observables sans compte de test. |
| `/fr/discover` | `discover/page.tsx` | GOOD_BUT_INCOMPLETE | `RENDERED` | Publique (200), body 1227, mais overflow=1 sur mobile 360/390. |
| `/fr/enseignants` | `enseignants/page.tsx` | **FUNCTIONALLY_INCOMPLETE** | `RENDERED` (résultat : redirect login → dû au proxy) | Page marketing d'accréditation professeur qui **redirige vers `/login`** parce que absente de `PUBLIC_ROUTES` dans `src/proxy.ts`. Body 178, H1 "Rentrez." → invisible pour un prospect prof non-connecté. Régression parcours. |
| `/fr/setup-role` | `setup-role/page.tsx` | FUNCTIONALLY_INCOMPLETE | `RENDERED` | Publique et rendue (200 body 281 "Choisis ton rôle."). Concept OK, mais concurrence sémantiquement le "choix Monde/Racines" §12 : il faut clarifier l'articulation setup-role (STUDENT/TEACHER/CENTER) vs choix territoire (MONDE/RACINES). |
| `/fr/onboarding` | `onboarding/page.tsx` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` (page auth-only) | Router SSR aiguille vers `/onboarding/monde`, `/onboarding/racines`, `/onboarding/teacher`, `/onboarding/center` selon `user_metadata.universe` ou `learning_paths`. **Aucun écran "portes" §12 avec Fraunces titre "Par où commence ton voyage ?"** — le fallback (60 lignes) est sobre mais ne suit pas la doctrine des portes premium. |
| `/fr/onboarding/monde` | `onboarding/monde/OnboardingMondeForm.tsx` (371l) | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Deux étapes "pourquoi + point de départ". La langue est **assumée** = deutsch. Aucun écran "choix langue" §13 (badge "A1 découverte gratuite", pas de drapeau, langue active vs bientôt). Auto-évaluation §14 partiellement présente. |
| `/fr/onboarding/racines` | `onboarding/racines/*` (16l wrapper) | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Existe mais taille wrapper minimale. Non observable sans session. Aucun mapping É1-É5 visible dans le code parcouru. |
| `/fr/test-niveau` | `test-niveau/page.tsx` | FUNCTIONALLY_INCOMPLETE | `RENDERED` (résultat : redirect register) | Redirige vers register pour anonymes. Contenu statique post-A.1 (30 questions), mais **la doctrine §11 dit "aucun test de niveau obligatoire à l'entrée"** — le rôle du test-niveau à cet endroit doit être clarifié : diagnostic post-inscription ou outil dashboard. |
| `/fr/test-niveau/results` | `test-niveau/results/page.tsx` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Post-quiz, requiert sessionStorage `testResult`. |
| `/fr/activation` | `activation/page.tsx` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Écran post-paiement, non observable anon (comportement voulu). |
| `/fr/classroom`, `/fr/classroom/join`, `/fr/classroom/[id]`, `/fr/classroom/[id]/assignment/[aid]` | `classroom/*` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only, non observables. `classroom/join` a été nettoyée post-A.1 (lien /simulateur retiré). |
| `/fr/teacher`, `/fr/teacher/*` | `teacher/*` (10 pages) | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only. Doctrine §25.1 priorise "corrections en attente" — cohérence à confirmer sur rendu authentifié. |
| `/fr/center`, `/fr/center/*` | `center/*` (6 pages) | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only. §25.4 exige gestion enseignants/classes/étudiants/licences. |
| `/fr/admin`, `/fr/admin/*` | `admin/*` (7 pages) | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only. `/admin/courses/generate` a été neutralisée post-A.1 (IA supprimée). |
| `/fr/group`, `/fr/group/create`, `/fr/group/join` | `group/*` | FUNCTIONALLY_INCOMPLETE | `CODE_AUDITED_VISUAL_PENDING` | Auth-only. |
| `/fr/dev/lesson-complete` | `dev/lesson-complete/page.tsx` | DEV_ONLY | `CODE_AUDITED_VISUAL_PENDING` (dev route) | Preview interne du composant `LessonComplete`. Ne doit pas apparaître dans les priorités produit. |

---

## 5. Pages manquantes (doctrine → aucun fichier correspondant)

| Nom doctrinal | Route probable | Classification |
|---|---|---|
| Choix du territoire §12 (portes premium "Par où commence ton voyage ?") | à créer, ex. `/(locale)/entree` ou remaniement `/onboarding` | **MISSING** |
| Choix de langue §13 (Racines) | à créer, ex. `/(locale)/onboarding/racines/langue` | **MISSING** |
| Auto-évaluation Racines §14 déclarative | à créer, ex. `/(locale)/onboarding/racines/depart` | **MISSING** |
| Quatre cours de découverte §15 (salutations, présentation, nombres, révision) publics ou post-inscription légère | à créer, ex. `/(locale)/decouverte/[step]` | **MISSING** |
| Fin de découverte §16 (récap stats réelles + CTA activation) | à créer, ex. `/(locale)/decouverte/fin` | **MISSING** |
| Dashboard Monde §20 (greeting + hero progression + Leçons/Exercices/Écoute/Examens blancs + bloc suivi prof) | à créer ou à extraire de `/dashboard` en variante `territory=world` | **MISSING** |
| Dashboard Racines §21 (échelle É1-É5, "Aujourd'hui dans la maison", veillées éditoriales) | partiellement présent dans `/dashboard` Foyer, à compléter | **MISSING (partiel)** |
| Veillées §21.6 (récit + audio + transcript + vocabulaire + contexte + activité familiale) | à créer, ex. `/(locale)/racines/veillees` | **MISSING** |
| Attestation §20.8 Monde (conditions, éligibilité, aperçu quand réel) | à créer | **MISSING** |
| Examens blancs §20.5 comme parcours structuré | à créer | **MISSING** |
| Écoute §20.5 comme parcours dédié (hors leçon) | à créer, ex. `/(locale)/monde/ecoute` | **MISSING** |
| Correction humaine côté professeur §25.3 (annotation, feedback structuré) | à créer sous `/teacher/assignments/[id]/corrections` | **MISSING** |
| Coach carrière Europe §Suivi §10 (diagnostic 59 €, préparation entretien 99 €, pack candidature 149 €) | **NON PRIORITAIRE bêta** — juste réservation terminologique | **MISSING (post-bêta assumé)** |

---

## 6. Incohérences fonctionnelles

| ID | Finding | Route | Fichier | Preuve | Impact utilisateur | Priorité | Recommandation limitée |
|---|---|---|---|---|---|---|---|
| FUNC-01 | Le dashboard `/dashboard` est le Foyer, pas le dashboard Monde | `/fr/dashboard` | `src/app/[locale]/dashboard/page.tsx` | Utilise `FoyerTopbar`, `FoyerHero`, `FoyerSpine`, `FoyerCapCard`. Aucun composant "hero CECRL Monde". | Un étudiant Monde ne voit pas son parcours A1 ni "Continuer" vers la prochaine leçon | P0 | Créer une variante `MondeDashboard` distincte et router selon `activeSpace`/`activeLangue.territory === 'world'`. Le Foyer reste pour Racines. |
| FUNC-02 | `/enseignants` protégée par le proxy → redirection `/login` | `/fr/enseignants` | `src/proxy.ts` `PUBLIC_ROUTES` | H1 sweep = "Rentrez. On vous attendait." body=178 | Prospect professeur invisible pour la page marketing d'accréditation | P0 | Ajouter `"/enseignants"` à `PUBLIC_ROUTES` dans `src/proxy.ts`. |
| FUNC-03 | Test de niveau positionné avant l'inscription | `/fr/test-niveau` | `src/app/[locale]/test-niveau/*` | Sweep : H1 "Créer votre compte" → renvoie register | Doctrine §11 dit "aucun test obligatoire à l'entrée" | P1 | Repositionner `/test-niveau` comme outil dashboard uniquement, ou intégrer comme quatrième cours de découverte optionnel. |
| FUNC-04 | Coach de langue Racines absent du catalogue | tarification | `prisma/seed.ts`, `src/lib/pricing.ts` | Aucune référence "coach racines 30000 XAF" dans le seed | Doctrine "Suivi humain" §2 : prix unique 30 000 XAF/45 € par mois par personne | P0 | Ajouter Product `COACH_RACINES_ADDON` + variant XAF/EUR mensuel dans le seed et exposer dans `/pricing/racines`. |
| FUNC-05 | Grille tarifaire Monde divergente | `/fr/pricing/monde` | `src/lib/pricing.ts` | pricing.ts A2=54000/78, doctrine=55000/79 ; B1=58/85 vs 59/89 ; B2=64/99 vs 69/109 ; C1=72/119 vs 79/129 | Prix affiché ≠ prix doctrinal → confusion commerciale | P0 | Aligner `WORLD_PASSAGE_PRICES` sur la grille §17. |
| FUNC-06 | Setup-role vs choix territoire potentiellement redondants | `/fr/setup-role` + `/fr/onboarding` | pages | `setup-role` traite STUDENT/TEACHER/CENTER, `onboarding` traite MONDE/RACINES | Deux "premiers choix" côte à côte, confusion cognitive | P1 | Clarifier : setup-role pour rôle de compte, choix territoire uniquement pour STUDENT après register. Doctrine §11 impose un seul funnel. |
| FUNC-07 | Simulateur historique référencé dans `PROTECTED_ROUTES` ⇢ maintenant en public route | `src/proxy.ts` | déjà corrigé Phase A.1 | — | Pas un défaut, à noter | ✅ résolu | Aucune action. |
| FUNC-08 | Aucun password recovery visible | login | `src/app/[locale]/login/page.tsx` | Pas de lien "mot de passe oublié" détecté dans les 200 lignes | Utilisateur bloqué en cas d'oubli | P1 | Ajouter flux `POST /api/auth/password-reset` + page `/reset-password`. (Hors scope de cette tâche, déjà connu.) |
| FUNC-09 | Pas d'écran "quatre cours découverte" avant activation | funnel | absent | Doctrine §15 exige 4 cours contigus avant activation | Utilisateur voit paywall avant d'avoir "senti" la méthode | P1 | Créer un mini-parcours découverte reusing `AudioPlayer` + `DialogPlayer` + `AdaptiveQuiz` avec 4 leçons statiques. |
| FUNC-10 | `AdaptiveQuiz` accepte prop `questions` optionnelle mais aucun caller ne l'utilise | quiz/demo, courses modules | grep : callers passent `level`, `topic`, sans questions | Depuis A.1, sans données → état vide "aucune question disponible" | P1 | Câbler un adaptateur `getStaticQuestions(level, topic)` qui pioche dans la banque `/api/test-niveau/questions` (30 questions statiques déjà présentes). |
| FUNC-11 | `/api/family/children` DELETE existe mais UI de suppression enfant non observée | famille | `src/app/api/family/children/[id]/route.ts` | API OK, page non atteignable sans session | À confirmer sur rendu authentifié | P2 | Vérifier + compléter le flux depuis `/famille` (bouton "retirer" avec confirmation). |
| FUNC-12 | Aucune section "Aujourd'hui dans la maison" §21.5 dans le foyer visible | `/dashboard` | `dashboard/page.tsx` + `FoyerHero` | Composant absent | Manque du "petit rituel quotidien" §21.5 | P3 | Créer `FoyerAujourdhui` : mot + expression + audio + question à un proche. |

---

## 7. Incohérences visuelles

| ID | Finding | Route(s) | Preuve | Priorité | Recommandation |
|---|---|---|---|---|---|
| VIS-01 | Territoire non explicitement signalé sur `/dashboard` | `/fr/dashboard` | Utilise `.territory-world`/`.territory-sources` mais pas de kicker "Monde · le voyage" ni "Racines · le retour" | P1 | Ajouter kicker Fraunces italic dans `FoyerTopbar` selon `activeLangue.territory`. |
| VIS-02 | `enseignants` invisible visuellement (bloc login) | `/fr/enseignants` | body=178 | P0 | Même fix que FUNC-02. |
| VIS-03 | `/fr/discover` overflow 1 élément à 360/390 | `/fr/discover` | Sweep : ovf=1 sur 360 et 390 | P2 | Enquêter sur l'élément coupable (probable grid non `min-w-0`). |
| VIS-04 | `/fr/goodbye` overflow 1 élément à 360/390 | `/fr/goodbye` | idem | P2 | Idem. |
| VIS-05 | `quiz/demo` body=210 → écran vide ou quasi | `/fr/quiz/demo` | body=210 vs `hoeren/demo`=1448 | P1 | Câbler la banque statique 30 questions comme démo. |
| VIS-06 | Sweep signale 0 bouton IA visible → conforme post-A.1 ✅ | toutes | 0 partout | résolu | Aucune action. |
| VIS-07 | Sweep signale 0 lien `/simulateur` actif → conforme post-A.1 ✅ | toutes | 0 partout | résolu | Aucune action. |

---

## 8. Problèmes responsive

Résultats sweep 360 × 800 (mobile étroit) et 390 × 844 (mobile standard) :

| Page | Overflow détecté | Cause probable | Priorité |
|---|---|---|---|
| `/fr` (landing) | 1 élément | Voir annexe A (non modifiable) | — |
| `/en` (landing) | 1 élément | Voir annexe A (non modifiable) | — |
| `/fr/discover` | 1 élément | Grid ou carte non `min-w-0` | P2 |
| `/fr/goodbye` | 1 élément | Idem, préexistant Phase A.1 | P2 |
| Toutes les autres pages publiques | 0 | ✅ | — |

Pages authentifiées : non testées faute de session. **Point aveugle majeur à combler avant merge produit.**

Tablette 768 et desktop 1024/1440 : aucun overflow détecté sur les pages publiques.

---

## 9. Problèmes FR/EN

| ID | Route(s) | Écart |
|---|---|---|
| I18N-01 | `/fr/enseignants` seul (pas d'équivalent `/en/enseignants` observable, wording FR-only pour le nom de route) | Nom de route en français uniquement. Choix éditorial à confirmer (Kongoss, Japap conservent souvent le FR pour l'affect). |
| I18N-02 | `/fr/methode` seul (pas de `/en/methode`) | Idem — cohérence avec `/manifeste`, `/langues`. À valider comme choix produit. |
| I18N-03 | Pages authentifiées non testées EN | Chaque page auth doit prouver son EN équivalent. |
| I18N-04 | Copy Fraunces italic non testée pour ligature EN | Vérifier `renderSoul` sur `*fragment*` avec typographie anglaise (guillemets, apostrophes). |

Zéro texte "TODO" ou placeholder FR-mixed-EN détecté sur les pages publiques rendues.

---

## 10. Problèmes d'accessibilité

Audit statique — audit runtime axe-core non exécuté dans cette passe.

| ID | Zone | Preuve | Priorité |
|---|---|---|---|
| A11Y-01 | Aucune vérification `prefers-reduced-motion` sur `Seuil` (auto-play VeilleeFilm) | à confirmer via runtime axe | P2 |
| A11Y-02 | Focus visible sur boutons Fraunces italic non vérifié en pratique | à tester au clavier | P2 |
| A11Y-03 | Cibles tactiles 44×44 px doctrine §7.5 non vérifiées systématiquement | à mesurer par page | P1 |
| A11Y-04 | Landmarks `<main>`, `<nav>`, `<footer>` présents sur la landing ✅ | source vérifié | résolu |
| A11Y-05 | `StateBlock` respecte `role="alert"` + `aria-live="polite"` sur erreur ✅ | code lu | résolu |
| A11Y-06 | Icônes Fraunces (emojis lucide) : alternatives textuelles non systématiques | à passer en revue | P2 |

Le prompt §17-18 du meta-doctrine impose axe-core + WCAG 2.2 AA — audit dédié P6.

---

## 11. Placeholders et fausses données

Après lecture du code observable :

| Route/Composant | Type | Fichier | Priorité |
|---|---|---|---|
| `/fr/admin/courses/generate` | Placeholder post-A.1 (message "génération IA supprimée") ✅ | admin/courses/generate/page.tsx | résolu |
| `SAVED_COURSES` dans `admin/courses/generate` | 2 lignes en dur ("Netzwerk neu A1 · L1 — Guten Tag!" fake status "publié") | doctrine §25.5 : "aucune donnée de démonstration présentée comme réelle" | P2 |
| Portraits/photos `Portrait`, `PortraitSpeaking` | À confirmer si contenus réels ou stock | à vérifier | P2 |
| Dashboards authentifiés : contenus fictifs éventuels | non observable | à auditer avec credentials | P0 |
| `enseignants/page.tsx` : chiffres publics | doctrine §7.2 dit "aucun chiffre en public" — à vérifier ligne par ligne | fichier lu, comportement conforme (pas de chiffres visibles) | ✅ résolu |

---

## 12. Composants réutilisables (canoniques)

Système déjà en place dans `src/components/*`, classification par doctrine §10 :

| Composant | Fichier | Rôle | Territoire | Recommandation |
|---|---|---|---|---|
| `StateBlock` | `StateBlock.tsx` (141l) | Unique façon d'afficher loading/empty/error/success/confirm avec soul Fraunces italic | universel | **CONSERVER** — canonical, ADN YEMA. |
| `LessonComplete` | `LessonComplete.tsx` (189l) | Écran fin de leçon (stats, XP, prochaine étape) | monde | CONSERVER — à cabler sur données réelles. |
| `LevelUp` | `LevelUp.tsx` (125l) | Célébration passage de niveau | monde/racines | CONSERVER — variante Racines É→É+1 à ajouter. |
| `Layout` | `Layout.tsx` (381l) | Layout étudiant (nav sidebar + topbar + main) | monde/racines | CONSERVER — l'item "Pratique orale" a été retiré post-A.1. |
| `TeacherLayout` | `TeacherLayout.tsx` (189l) | Layout professeur | professeur | CONSERVER. |
| `CenterLayout` | `CenterLayout.tsx` | Layout centre | centre | CONSERVER. |
| `FoyerSidebar`, `FoyerTopbar`, `FoyerHero`, `FoyerCapCard`, `FoyerSpine`, `FoyerTools`, `AutreVoixStrip`, `ClasseStrip`, `Braise` | `components/foyer/*` | Système complet de dashboard Foyer/Racines | racines | CONSERVER — c'est le socle du dashboard Racines §21. |
| `AudioPlayer` | `AudioPlayer.tsx` (post-A.1 slim) | Lecture audio statique (src préenregistré) | universel | COMPLÉTER — ajouter transcript repliable, vitesse 0.75/1/1.25, badge "voix enregistrée" §15.4. |
| `DialogPlayer` | `DialogPlayer.tsx` (post-A.1) | Lecture séquentielle de dialogues avec transcript | universel | CONSERVER — API supporte `line.src` optionnel. |
| `AdaptiveQuiz` | `AdaptiveQuiz.tsx` (post-A.1) | Quiz basé sur prop `questions` optionnelle | monde | COMPLÉTER — cabler adaptateur banque statique (FUNC-10). |
| `SchreibenEditor` | `SchreibenEditor.tsx` (post-A.1 slim) | Consigne + textarea + exemple éditorial | monde | CONSERVER — pas d'IA, workflow "envoyer au prof" à ajouter quand suivi actif. |
| `VoiceRecorder` | `VoiceRecorder.tsx` (post-A.1 slim) | Saisie texte fallback + coming-soon vocal | monde | CONSERVER — enregistrement local à ajouter quand infra prête. |
| `BrandY` | `brand/BrandY.tsx` (173l) | Symbole Y multi-variantes (world/roots/mono) et états (static/loader) | seuil/onboarding/erreurs | CONSERVER — respecter §33.2 : ne pas généraliser dans les dashboards. |
| `BrandLockup` | `brand/BrandLockup.tsx` (50l) | Lockup horizontal Y + wordmark | header login | CONSERVER. |
| `Seuil`, `SeuilGreeting`, `SeuilPolyglot`, `VeilleeFilm` | `components/seuil/*` | Écran d'entrée immersif | landing **SACROSANCTE** | NE PAS MODIFIER. |
| `MaisonCouture`, `MaisonVeillee`, `MaisonVisages`, `MaisonEchelle`, `MaisonPorte`, `Teaser` | `components/maison/*` | Pièces narratives landing | landing **SACROSANCTE** | NE PAS MODIFIER. |
| `LandingNav`, `LandingFooter`, `LegalShell` | `components/landing/*` (utilisés hors landing pour `/pricing`, `/methode`) | Nav et footer partagés | landing + public | CONSERVER — utilisation transverse. |
| `NotificationBell` | `NotificationBell.tsx` (173l) | Icône notif avec badge count | universel | CONSERVER. |
| `SpaceSwitcher` | `SpaceSwitcher.tsx` (166l) | Bascule espace multi-rôles | topbar | CONSERVER. |
| `OnboardingProgress` | `OnboardingProgress.tsx` (54l) | Barre "Étape N sur M" | funnel | CONSERVER — à utiliser sur les portes §12 quand créées. |
| `AnimalAvatar` | `famille/AnimalAvatar.tsx` | Avatar enfant (chouette, tortue…) | famille | CONSERVER. |
| `Portrait`, `PortraitSpeaking` | `Portrait*.tsx` | Portraits professeurs/coachs | humain §4.4 | CONSERVER — sources réelles à confirmer. |

**Composants dead à traiter séparément (audit `AUDIT.md`)** : `LandingHero`, `LandingFeatures`, `LandingLevels`, `LandingLanguages`, `LandingSimulator`, `LandingProblems`, `LandingVision`, `LandingWhyGermany`, `LandingFinalCta`, `LandingFaq`, `LandingCenters`, `CefrSpine`, `YemaSpine`, `SpineItem`, `CefrStrip`, `LanguageProvider`, `useLanguage`, `useSpeechRecognition`, Remotion compositions. À supprimer dans une passe de nettoyage dédiée (hors scope).

---

## 13. Composants à consolider

| Composant | Écart / manque | Recommandation |
|---|---|---|
| `AudioPlayer` | Manque transcript repliable, vitesse variable, badge "voix enregistrée" §15.4 | Ajouter props optionnels `transcript?: string`, `speeds?: [0.75, 1, 1.25]`, `showBadge?: boolean`. Ne pas remplacer. |
| `AdaptiveQuiz` | Aucun adaptateur pour brancher la banque statique | Créer `lib/quizAdapter.ts` : `getStaticQuestionsFor(level, topic)`. |
| `LessonComplete` | À valider si connecté à des stats réelles | Vérifier props et sources. |
| `FoyerHero` | Ne présente pas encore le "coach actif" §21.9 (portrait, prochaine réponse) | Étendre pour rendre le bloc coach quand `data.coach` présent. |
| `ClasseStrip` | Ne présente pas encore prochain devoir / message §20.6 | Étendre pour dashboard Monde. |
| `Layout` (student) | N'a pas de section "hero de progression" §20.4 pour Monde | Créer wrapper `MondeDashboard` réutilisant Layout. |

Aucun nouveau composant à créer avec préfixes proscrits (`PremiumCard`, `ModernButton`, `FancyPanel`, `DashboardCardV2`, `UniversalLayout`) — §33.2.

---

## 14. Améliorations premium possibles (autorisées §34)

Priorité selon impact utilisateur :

| Amélioration | Cible | Priorité |
|---|---|---|
| Ajouter kicker Fraunces italic "Monde · le voyage" / "Racines · le retour" dans `FoyerTopbar` | dashboard | P1 |
| Hairline brass/terracotta sur bordures actives (cartes Passage, Solo, Famille) | pricing | P2 |
| Micro-animation 180-240 ms sur ouverture du picker langue (§10) | onboarding | P3 |
| Portraits réels professeurs/coachs (§26.1) au lieu d'avatars vectoriels si en stock | teacher pages, coach panel foyer | P2 |
| Rythme vertical 8/12/16/24/32/48 documenté et respecté par carte | tous dashboards | P2 |
| État vide canonique pour "Aujourd'hui dans la maison" quand pas encore de contenu | dashboard Racines | P3 |
| Segmented progress "1/4 · 2/4 · 3/4 · 4/4" (§15.3) dans les leçons de découverte | découverte | P1 |
| Icônes cohérence de trait (§26.4) — passer en revue lucide vs custom | universel | P3 |
| Meilleur formatage devise (§19) : `Intl.NumberFormat` FR avec insécables (déjà présent dans `pricing.ts`) — étendre partout | pricing, checkout | P2 |

---

## 15. Risques techniques

| Risque | Impact | Mitigation |
|---|---|---|
| **Phase A.2 non mergée** : `child_profiles` reste divergent en prod tant que le PR n'est pas mergé | crash P2022 sur `/api/family/children` en prod | Merger `fix/yema-phase-a2-data-migration` avant d'implémenter tout écran famille supplémentaire. |
| Dérive `users.plan` séparée (hors DATA-001) | `prisma.user.create` avec `plan` échoue en prod si non aligné | Traiter dans une passe DATA-002 dédiée. |
| Dépendances IA encore présentes (`@google/generative-ai`, `openai`) | Bundle plus lourd que nécessaire, risque de réintroduction | Passe P6 : `npm uninstall` + supprimer `src/lib/ai/*`, `azureTTS.ts`, `geminiCache.ts`. |
| Absence de tests visuels régression (Playwright screenshots baseline) | Une PR peut casser la landing sans signal | Configurer un flow CI avec baseline capture. |
| Absence de vraie CI | Le lint / tsc / test tournent seulement en local | Ajouter GitHub Actions minimal (hors scope de cette tâche). |
| Prisma 7 + Turbopack + Next 16 : combinaison encore récente | Régressions non détectées | Tests E2E prioritaires. |

---

## 16. Dépendances entre parcours

Graphe :

```
[compte OK]  ─→  [choix rôle setup-role]
                    │
                    ├─→ STUDENT ─→ [choix territoire §12]
                    │                 ├─→ MONDE  ─→ [choix langue §13] ─→ [auto-éval §14] ─→ [4 cours découverte §15] ─→ [fin découverte §16] ─→ [activation Monde §17] ─→ [dashboard Monde §20]
                    │                 └─→ RACINES ─→ [choix langue §13 racines] ─→ [auto-éval §14 racines] ─→ [4 cours découverte] ─→ [fin découverte] ─→ [activation Racines §18] ─→ [dashboard Racines §21]
                    ├─→ TEACHER ─→ [/onboarding/teacher] ─→ [dashboard prof §25.1]
                    └─→ CENTER  ─→ [/onboarding/center] ─→ [dashboard centre §25.4]
```

Nœuds bloquants pour la bêta :
1. **Choix territoire §12** → sans cet écran, MONDE et RACINES sont indistinguables au 1er contact.
2. **4 cours découverte §15** → sans cette étape, l'utilisateur passe directement au paywall sans "sentir" la méthode (violation §4.2).
3. **Dashboard Monde §20** → sans, un étudiant Monde n'a pas de "prochaine action" claire.
4. **Coach Racines dans catalogue** → sans, l'offre Racines n'est pas monétisée conformément à la doctrine.

Chaînes existantes fonctionnelles :
- Prix scindés Monde vs Racines (`/pricing` → `/pricing/monde` ou `/pricing/racines`) ✅
- Système d'états canonique (`StateBlock`) ✅
- Layouts par rôle ✅
- Foyer/Famille (post-A.2) ✅

---

## 17. Pages à ne surtout pas modifier

**Landing sacrosancte (§0 doctrine)** :

```
src/app/[locale]/page.tsx
src/components/seuil/Seuil.tsx
src/components/seuil/SeuilGreeting.tsx
src/components/seuil/SeuilPolyglot.tsx
src/components/seuil/VeilleeFilm.tsx
src/components/maison/MaisonCouture.tsx
src/components/maison/MaisonVeillee.tsx
src/components/maison/MaisonVisages.tsx
src/components/maison/MaisonEchelle.tsx
src/components/maison/MaisonPorte.tsx
src/components/maison/Teaser.tsx
src/components/landing/LandingNav.tsx
src/components/landing/LandingFooter.tsx
src/components/landing/typo.ts
src/components/landing/icons.tsx
src/components/brand/BrandY.tsx (utilisé par la landing)
src/components/brand/BrandLockup.tsx (utilisé par la landing)
```

Aucune modification sans autorisation explicite de Paul.

**Fichiers de contenu tarifaire** (à éditer prudemment) :
- `src/lib/pricing.ts` : contient des données produit. Chaque changement doit s'accompagner d'une trace dans `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md`.
- `prisma/seed.ts` : source de vérité du catalogue.

**Migrations Prisma existantes** : aucune modification (règle A.2 étendue).

---

## 18. Recommandations par priorité

### P0 — Bloque le parcours (bêta impossible sans)

| # | Recommandation | Fichier probable |
|---|---|---|
| P0-1 | Rendre `/enseignants` publique (ajouter à `PUBLIC_ROUTES` dans `src/proxy.ts`) | `src/proxy.ts` |
| P0-2 | Aligner `WORLD_PASSAGE_PRICES` sur la grille doctrinale §17 (A2 55000/79, B1 59000/89, B2 69000/109, C1 79000/129) | `src/lib/pricing.ts` |
| P0-3 | Ajouter le Product `COACH_RACINES_ADDON` (30 000 XAF / 45 € par mois, prix unique) dans le seed + entitlement rules + exposition `/pricing/racines` | `prisma/seed.ts`, `src/lib/pricing.ts`, `src/app/[locale]/pricing/racines/page.tsx` |
| P0-4 | Créer un dashboard Monde dédié (structure §20 : greeting, hero CECRL, 4 parcours, bloc suivi prof) | nouvelle page ou variante `/dashboard` avec route conditionnelle |
| P0-5 | Merger Phase A.2 (`fix/yema-phase-a2-data-migration`) pour aligner `child_profiles` avant tout écran famille supplémentaire | git merge |

### P1 — Nécessaire à la bêta

| # | Recommandation | Fichier probable |
|---|---|---|
| P1-1 | Créer l'écran "portes" §12 avec Fraunces "Par où commence ton voyage ?" | `src/app/[locale]/entree/page.tsx` ou refonte `/onboarding` fallback |
| P1-2 | Créer les écrans "choix langue" §13 pour Monde et Racines | `src/app/[locale]/onboarding/{monde,racines}/langue/page.tsx` |
| P1-3 | Créer les écrans "auto-évaluation" §14 déclarative | idem `/depart` |
| P1-4 | Créer le parcours "4 cours découverte" §15 réutilisant `AudioPlayer`, `DialogPlayer`, `AdaptiveQuiz` + banque statique | `src/app/[locale]/decouverte/[step]/page.tsx` + contenus statiques `content/decouverte/*.json` |
| P1-5 | Créer l'écran "fin de découverte" §16 avec stats réelles + CTA activation | `src/app/[locale]/decouverte/fin/page.tsx` |
| P1-6 | Câbler `AdaptiveQuiz` sur la banque statique 30 questions (FUNC-10) | `src/lib/quizAdapter.ts` |
| P1-7 | Ajouter kicker Fraunces "Monde · le voyage" ou "Racines · le retour" dans `FoyerTopbar` | `src/components/foyer/FoyerTopbar.tsx` |
| P1-8 | Ajouter transcript repliable + vitesse variable §15.4 à `AudioPlayer` | `src/components/AudioPlayer.tsx` |

### P2 — Amélioration importante

| # | Recommandation | Fichier probable |
|---|---|---|
| P2-1 | Créer une véritable "correction humaine" côté prof §25.3 (annotation, feedback, statut, renvoi) | `src/app/[locale]/teacher/assignments/[id]/corrections/` |
| P2-2 | Créer les veillées §21.6 (récit + audio + transcript + vocabulaire + contexte + activité familiale) | `src/app/[locale]/racines/veillees/*` |
| P2-3 | Créer l'attestation Monde §20.8 (conditions, éligibilité, statut) | `src/app/[locale]/monde/attestation/page.tsx` |
| P2-4 | Créer les examens blancs §20.5 (parcours structuré, écran locked/unlocked) | `src/app/[locale]/monde/examens/*` |
| P2-5 | Corriger overflow mobile sur `/fr/discover` et `/fr/goodbye` | pages correspondantes |
| P2-6 | Retirer les 2 lignes fake dans `SAVED_COURSES` (`admin/courses/generate`) | admin page |
| P2-7 | Vérifier cibles tactiles 44×44 px §7.5 sur toutes les pages publiques | audit CSS |

### P3 — Premium ou post-bêta

| # | Recommandation | Fichier probable |
|---|---|---|
| P3-1 | Créer "Aujourd'hui dans la maison" §21.5 (mot + expression + audio + question à un proche) | `src/components/foyer/FoyerAujourdhui.tsx` |
| P3-2 | Micro-animations 180-240 ms sur ouvertures cartes/menus §10.2 | tous |
| P3-3 | Hairlines brass/terracotta sur bordures cartes actives §6.4 | tous |
| P3-4 | Audit axe-core WCAG 2.2 AA complet | CI |
| P3-5 | Réserver la terminologie "Coach carrière Europe" §Suivi §10 sans construire le produit | `src/lib/roles.ts` + AppRole (déjà `CAREER_COACH` présent) |
| P3-6 | Tests visuels régression baseline Playwright | CI |
| P3-7 | Supprimer les 22 fichiers morts (Landing*, Remotion, LanguageProvider…) | passe DEAD_CODE dédiée |

---

## Annexe A — Landing page : anomalies observées, aucune correction autorisée

Conformément à §3 doctrine et §7.1 du meta-prompt, la landing est intouchable. Les observations ci-dessous sont **notées à titre documentaire** et **ne doivent pas** être traitées sans autorisation explicite de Paul.

| Observation | Route | Preuve | Statut |
|---|---|---|---|
| **A-01** Overflow horizontal 1 élément à 360 × 800 et 390 × 844 | `/fr`, `/en` | Sweep Playwright : `ovf=1` sur les deux mobiles, `ovf=0` sur 768/1024/1440 | Documenté, aucune correction. |
| A-02 Ticker/marquee dépasse dans une section (candidat) | idem | Comportement volontaire probable si présent (motif visuel) | Documenté. |
| A-03 Body length ~2400 chars à tous les viewports | idem | Cohérent avec le contenu narratif | RAS. |
| A-04 Zéro appel externe IA détecté | idem | Sweep externals=0 | RAS ✅. |
| A-05 H1 correctement rendu FR et EN | idem | "L'Afrique parle. Toutes ses langues." / "Africa speaks. All her tongues." | RAS ✅. |

Toute correction future de A-01/A-02 devra fournir : anomalie objectivement reproduite, routes et fichiers exacts, capture avant, explication d'impact utilisateur, proposition limitée, capture après, autorisation explicite de Paul.

---

## Confirmation

```
Landing /fr : CANONICAL — aucun fichier modifié
Landing /en : CANONICAL — aucun fichier modifié
```

Aucun fichier produit modifié. `AUDIT.md` non tracké préservé. Seuls les 3 fichiers `docs/*.md` sont ajoutés dans cette passe.

---

# Annexe B — Amendements produit (mobile + messagerie)

Cette annexe complète l'analyse d'écarts avec les deux décisions produit prises après le commit initial de doctrine, désormais formalisées dans les Amendements A et B de `YEMA_PRODUCT_DESIGN_DOCTRINE.md`.

## B.1 Écarts mobile

Doctrine amendée §A pose YEMA comme **mobile-first**. Constats sur le produit actuel :

| ID | Finding | Route(s) | Preuve | Priorité | Recommandation limitée |
|---|---|---|---|---|---|
| MOB-01 | Sweep publique révèle overflow horizontal à 360/390 px sur `/fr/discover` et `/fr/goodbye` (1 élément chacun) | `/fr/discover`, `/fr/goodbye` | Sweep Playwright §8 tableau | P2 | Enquêter sur l'élément coupable (probable grid non `min-w-0`). |
| MOB-02 | Anomalie landing `/fr` et `/en` à 360/390 (1 élément overflow) | `/fr`, `/en` | Sweep annexe A | — | Non modifiable (landing CANONICAL). Documentée. |
| MOB-03 | Toutes les pages authentifiées `CODE_AUDITED_VISUAL_PENDING` — aucun rendu 360/390 vérifié | dashboards, foyer, teacher, center, admin | 19 marqueurs §4 | P0 | À couvrir par P-1 (baseline authentifiée) avec sweep 360/390/768/1440 sur session réelle. |
| MOB-04 | Manifest PWA existe mais non validé pour installation | `src/app/manifest.ts` | fichier présent, à auditer | P3 | Vérifier icônes, theme_color, start_url, display standalone. |
| MOB-05 | Aucun service worker détecté (pas de cache offline) | racine app | grep `serviceWorker` = 0 hit | P3 | Prévoir en P6 QA/PWA. |
| MOB-06 | Aucune stratégie explicite pour clavier iOS/Android sur formulaires longs (register, onboarding, composer messagerie) | `/register`, `/onboarding/monde`, `/onboarding/racines` | audit statique + `CODE_AUDITED_VISUAL_PENDING` | P1 | Vérifier `inputMode`, `autocomplete`, positionnement du composer sur clavier ouvert. |
| MOB-07 | Aucune gestion safe area iOS observée dans les composants globaux (`Layout.tsx`, `FoyerSidebar.tsx`) | tous dashboards | grep `env(safe-area-` = 0 hit dans `globals.css` visible | P1 | Ajouter `padding: env(safe-area-inset-*)` sur les shells de dashboard. |
| MOB-08 | Aucun état hors connexion explicite | tous | grep `offline\|navigator.onLine` = 0 hit runtime | P3 | Prévoir en P6 QA/PWA (composant `StateBlock kind="offline"` à créer). |
| MOB-09 | Actions principales pas toujours accessibles au pouce (à confirmer P-1) | dashboards, pricing, checkout | non observable sans session | P1 | À vérifier dans la baseline authentifiée. |
| MOB-10 | Aucun test Playwright configuré pour 360×800 en régression | CI | pas de CI, pas de baseline | P3 | Prévoir en P6 QA. |

## B.2 État de la messagerie existante dans le code

Grep exhaustif sur `message`, `messages`, `conversation`, `chat`, `thread`, `classroom`, `group`, `assignment`, `submission`, `voice`, `audio`, `reaction`, `notification`.

### Modèles Prisma existants (`prisma/schema.prisma`)

Structure V2 (yema_v1_core) :

| Modèle | @@map | Champs clés | Statut vs doctrine §B.11 |
|---|---|---|---|
| `Thread` (l.726) | `threads` | `classId`, `threadType` (MAIN/ANNOUNCEMENT/ASSIGNMENT/ONE_TO_ONE), `title` | GOOD_BUT_INCOMPLETE — `threadType` couvre 4 usages, mais aucun fil « cercle Racines » explicite (les cercles Racines n'existent pas encore comme entité — voir MSG-01). |
| `Message` (l.740) | `messages` | `threadId`, `authorUserId`, `messageType` (TEXT/AUDIO), `body`, `audioUrl` | GOOD_BUT_INCOMPLETE — supporte texte et audio via `audioUrl`, mais **pas de `VoiceMessage` séparé** (pas de duration, pas de waveform stockée, pas de statut lecture). Manque : `MessageReaction`, `MessageReadState`, `MessageReport`, `MessageAttachment`. |
| `ClassAssignment` (l.755) | `class_assignments` | `classId`, `title`, `description`, `dueAt` | GOOD_BUT_INCOMPLETE — pas de type « invitation orale » explicite. Doctrine §B.5 exige types annonce/devoir/invitation. |
| `Submission` (l.770) | `submissions` | `assignmentId`, `userId`, `body`, `audioUrl` | GOOD_BUT_INCOMPLETE — supporte remise texte ou audio, mais pas de durée, waveform, ni référence croisée bidirectionnelle. Contrainte `@@unique([assignmentId, userId])` : un seul submission par user par assignment (règle métier à valider). |
| `ClassFeedback` (l.786) | `class_feedback` | `submissionId`, `authorUserId`, `score`, `body` | GOOD_BUT_INCOMPLETE — feedback texte seulement, **pas de champ `audioUrl`** → correction vocale coach impossible sans amendement schéma. Doctrine §B.4 exige correction vocale 5 min max. |
| `Class` (l.688) | `classes` | `classType` (TEACHER/CAREER_COACH/CENTER), `providerUserId`, `language`, `level` | GOOD_BUT_INCOMPLETE — pas d'entité « cercle Racines » (`classType` n'inclut pas `RACINES_CIRCLE` ou équivalent). |
| `ClassMembership` (l.708) | `class_memberships` | `classId`, `userId`, `learningPathId`, `role` (LEARNER/TEACHER/COACH), `status` | GOOD_BUT_INCOMPLETE — `role` couvre partiellement les besoins doctrine §B.9, manque distinction « profil enfant » pour contrôle parental. |
| `Notification` | `notifications` (existe) | — | À auditer. |

Structure V1 legacy encore présente : `Classroom`, `ClassroomEnrollment`, `Assignment`, `AssignmentSubmission`, `StudentGroup`, `StudentGroupMember`, `ClassJoinRequest`, `StudyGroupInvite`. **Coexistence V1/V2 à clarifier** avant P4 messagerie (risque de duplication).

### Composants messagerie existants (`src/components/`)

| Composant | Fichier | Statut | Preuve |
|---|---|---|---|
| `ClassroomChat.tsx` | 251 lignes | **PLACEHOLDER** | Données hardcodées : `INITIAL_MESSAGES` contient « Prof. Sophie Tanda » + « Marie N. » fake. Utilise `subscribeToClassroom` / `broadcastMessage` de `@/lib/supabase/realtime`. Réactions frontend uniquement `["👍","🎯","💪","🔥"]`, pas persistées Prisma. Violation doctrine §33.3 « aucune donnée fictive présentée comme réelle ». |
| `NotificationBell.tsx` | 173 lignes | GOOD_BUT_INCOMPLETE | Icône notif avec badge count, ne charge pas de vraies notifications messagerie. |
| `AudioPlayer.tsx` (post-A.1 slim) | ~90 lignes | GOOD_BUT_INCOMPLETE | Joue une `src` audio statique. Manque support notes vocales : waveform, durée dynamique, badge « auteur », statut lu/non-lu, loading spécifique. |
| `VoiceRecorder.tsx` (post-A.1 slim) | ~75 lignes | **PLACEHOLDER** | Coming-soon banner + textarea fallback. **Aucun enregistrement microphone réel.** Doctrine §B.4 exige note vocale 3 min max avec réécoute et annulation. |

### API existantes (`src/app/api/`)

| Route | Statut | Preuve |
|---|---|---|
| `GET/POST /api/classroom` | GOOD_BUT_INCOMPLETE | Liste enrolled classrooms + `POST` supporte « join or send message ». Le send message ne semble pas produire de `Message` Prisma via `Thread`. |
| `POST /api/classroom/join` | GOOD_BUT_INCOMPLETE | Rejoint via code, crée enrollment pending. |
| `GET /api/classroom/check-code/[code]` | GOOD_BUT_INCOMPLETE | Preview classroom avant join. |
| `GET/POST /api/teacher` | GOOD_BUT_INCOMPLETE | GET profil + classrooms, POST crée classroom ou assignment. |
| **Pas de route** `/api/messages`, `/api/threads`, `/api/conversations`, `/api/voice`, `/api/reactions`, `/api/read-states`, `/api/reports` | **MISSING** | Grep confirme leur absence. |

### Realtime existant (`src/lib/supabase/realtime`)

| Fonction | Statut | Preuve |
|---|---|---|
| `subscribeToClassroom` | GOOD_BUT_INCOMPLETE | Utilisé uniquement par `ClassroomChat` avec fake data. Pas de persistance backend. |
| `broadcastMessage` | GOOD_BUT_INCOMPLETE | Idem. |
| `ChatMessage` type | GOOD_BUT_INCOMPLETE | Type frontend uniquement, pas de mapping Prisma explicite. |

### Écrans manquants (par rapport à la doctrine §B)

| Nom doctrinal | Route probable | Classification |
|---|---|---|
| Fil unique classe Monde §B.2 (annonces + devoirs + notes vocales + corrections chronologiques) | à intégrer dans `/classroom/[id]` avec architecture Thread/Message | **MISSING** (le chat actuel ne joue pas ce rôle) |
| Cercle Racines fermé §B.7 (équivalent Racines) | à créer, ex. `/racines/cercle/[id]` | **MISSING** — aucune entité `Circle` n'existe |
| Composer mobile avec micro prioritaire §B.4 | à créer `<VoiceComposer>` | **MISSING** |
| Correction vocale coach + texte §B.4 | à créer `<CorrectionVocaleEditor>` + amendement `ClassFeedback.audioUrl` | **MISSING** (feedback texte seulement) |
| Contrôle parental profil enfant sur messagerie §B.9 | à créer, blocage messages privés | **MISSING** |
| Signalement §B.10 (`MessageReport`) | à créer | **MISSING** |
| Modération admin/centre avec audit log §B.9 | à créer | **MISSING** |
| Statuts lu/non-lu §B.12 (`MessageReadState`) | à créer | **MISSING** |
| Réactions persistées Prisma §B.5 (`MessageReaction`) | à créer (existe seulement en frontend fake) | **MISSING** |

### Findings messagerie synthétiques

| ID | Finding | Route/Fichier | Preuve | Priorité | Recommandation limitée |
|---|---|---|---|---|---|
| MSG-01 | Aucune entité « cercle Racines » (Class limitée à TEACHER/CAREER_COACH/CENTER) | `prisma/schema.prisma` enum `ClassType` | grep confirme | P0 | Amender le schéma pour distinguer classe Monde et cercle Racines (soit nouvelle enum `RACINES_CIRCLE`, soit nouvelle entité `Circle` distincte). Décision produit à fermer. |
| MSG-02 | `ClassroomChat` contient de fausses données présentées comme réelles | `src/components/ClassroomChat.tsx` | INITIAL_MESSAGES hardcoded « Prof. Sophie Tanda », « Marie N. » | P0 | Retirer les fake messages, brancher sur `Thread`/`Message` réels via `/api/messages` (à créer). |
| MSG-03 | `VoiceRecorder` est coming-soon sans enregistrement réel | `src/components/VoiceRecorder.tsx` | code lu post-A.1 | P0 | Implémenter enregistrement microphone (MediaRecorder API), consentement, réécoute, annulation, envoi. |
| MSG-04 | `ClassFeedback` n'a pas de champ `audioUrl` → correction vocale coach impossible | `prisma/schema.prisma` l.786 | schéma lu | P0 | Ajouter `audioUrl String?` sur `ClassFeedback` (nouvelle migration additive). |
| MSG-05 | Aucun `MessageReaction`, `MessageReadState`, `MessageReport` Prisma | schéma | grep confirme | P1 | Créer les 3 modèles avec relations `Message` + `User`. |
| MSG-06 | Aucun `VoiceMessage` séparé (durée, waveform, statut) | schéma | `Message.audioUrl` seul | P1 | Soit enrichir `Message` (`durationMs`, `waveform`), soit créer `VoiceMessage`. |
| MSG-07 | Aucune API messagerie (`/api/messages`, `/api/threads`, `/api/voice`, `/api/reactions`, `/api/read-states`, `/api/reports`) | `src/app/api/` | absents | P0 | Créer les routes en P4. |
| MSG-08 | Coexistence V1 (`Classroom`, `Assignment`, `AssignmentSubmission`) et V2 (`Class`, `ClassAssignment`, `Submission`) | `prisma/schema.prisma` | grep confirme les 2 séries | P1 | Clarifier la migration V1→V2, choisir la structure canonique, migrer les données legacy (nouvelle passe DATA-003 si nécessaire). |
| MSG-09 | Realtime Supabase branché sur fake data | `src/lib/supabase/realtime` | `subscribeToClassroom` utilisé uniquement par ClassroomChat placeholder | P1 | Cabler sur inserts réels de `Message` via Supabase Realtime avec ownership check. |
| MSG-10 | Aucune protection profil enfant sur messagerie | permissions | grep confirme | P0 | Bloquer messages privés pour enfants (déjà interdits par §B.9), permettre uniquement les échanges dans le groupe classe/cercle autorisé. |
| MSG-11 | Aucune séparation Monde/Racines dans le rendu chat | `ClassroomChat.tsx` | pas de `territory` prop | P1 | Variantes visuelles espresso/brass (Monde) vs terre/terracotta (Racines) par territoire. |
| MSG-12 | `Notification` model existe mais non utilisée pour messagerie | schéma | `NotificationBell` ne charge rien | P1 | Câbler notifications new-message, correction-received, mention. |

**Classification globale messagerie** : **PLACEHOLDER** (chat frontend fake) + **FUNCTIONALLY_INCOMPLETE** (fondations Prisma partielles) + **MISSING** (cercle Racines, correction vocale, réactions persistées, statuts, signalement, contrôle parental).

---

## Confirmation amendée

```
Landing /fr : CANONICAL — aucun fichier modifié
Landing /en : CANONICAL — aucun fichier modifié
```

Aucun fichier produit modifié pendant l'ajout de l'annexe B. Seuls les 3 fichiers `docs/*.md` sont concernés.

# YEMA · Lot 6 · Runbook Preview P-1 + validation 9 personas

**Objectif** : déployer la branche `feat/yema-dashboard-redesign-messaging`
sur une Preview Vercel P-1 dédiée avec les 2 flags `YEMA_QA_MODE_ENABLED=true`
et `YEMA_DASHBOARD_REDESIGN_ENABLED=true`, puis valider réellement les 9
personas (desktop 1440×900 + mobile 390×844 + captures 360/768/1024).

Ce document est un runbook opérateur — commandes prêtes à l'emploi.
Rien n'est déployé automatiquement par un commit : chaque étape s'exécute
manuellement, sous ton contrôle, avec fail-closed sur toute référence
Production.

---

## 0. Pré-requis

- Node ≥ 20, `npx` disponible.
- Fichier local `.env.p1-baseline` présent et à jour (variables Supabase
  P-1 uniquement — `kzzagbojjkivdzzcrmxn`).
- Variable env `YEMA_QA_ADMIN_EMAIL` définie dans ton shell
  (mail admin YEMA qui recevra les magic links) :
  ```sh
  export YEMA_QA_ADMIN_EMAIL="ton.email@example.com"
  ```
- Projet Vercel déjà lié (`.vercel/project.json` présent).

---

## 1. Bake QA fixtures P-1 (idempotent)

Rejoue les 9 personas + le foyer QA sur P-1 (crée / met à jour ce qui
manque, ne touche à rien d'autre) :

```sh
node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off \
  -- node scripts/test-baseline/yema-qa-fixtures.mjs
```

Attendu (stderr) :
- `P-1 ENVIRONMENT VERIFIED · projectRef=kzzagbojjkivdzzcrmxn`
- Bloc `family` avec :
  - `householdId: test_yema_qa_household_family`
  - `seatGrantId: test_yema_qa_grant_user_family_seat_owner` (siège adulte Racines attribué)
  - `familyWorldGrantId: test_yema_qa_grant_hh_family_world` (3 sièges Enfant Monde)
  - `childMondeId` + `childRacinesId`
  - `rootsFamilyVariant` + `familyWorldVariant` (Product IDs)

Aucun mot de passe ni PIN loggué. Le mot de passe des personas P-1 est lu
depuis `.env.p1-baseline` (`P1_TEST_PASSWORD`).

Si le seed catalogue n'est pas encore à jour (produits `CHILD_WORLD_SINGLE`
+ `FAMILY_WORLD` absents), lance d'abord :

```sh
node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off -- npx prisma db seed
```

---

## 2. Déploiement Preview Vercel P-1

Le wrapper `scripts/qa/deploy-qa-preview.mjs` fait tout :
- valide fail-closed que toutes les URLs sont P-1 (blacklist prod strict)
- génère les 3 secrets QA (session, link, child) via `crypto.randomBytes`
- lance `vercel build` puis `vercel deploy --prebuilt --env KEY=VALUE ...`
- injecte les env vars UNIQUEMENT dans ce déploiement (jamais persistées
  côté projet Vercel)

```sh
export YEMA_QA_ADMIN_EMAIL="ton.email@example.com"
node scripts/qa/deploy-qa-preview.mjs
```

Le script imprime sur stdout un JSON compact du type :
```json
{
  "deploymentUrl": "https://deutschcm-XXX-yema.vercel.app",
  "deploymentId": "dpl_XXX",
  "deploymentHost": "deutschcm-XXX-yema.vercel.app"
}
```

Toutes les autres écritures vont sur stderr (progression, sans jamais
révéler de secret). Note le `deploymentUrl` pour la suite.

**Vérifications post-déploiement** :

```sh
# 1) La Preview répond bien
curl -sI "https://<HOST>/fr/login" | head -1
# → HTTP/2 200

# 2) Le project ref Supabase est P-1
curl -s "https://<HOST>/api/qa/status" | head -c 200
# Doit contenir "kzzagbojjkivdzzcrmxn" et projectRef P-1, JAMAIS
# sbjhvlrkbyjckdxujjsk ni mamofhrurksyuuolucea ni qggwvonfumuimjfsgpdz.

# 3) Les endpoints QA sont accessibles (pas 404 gate off)
curl -sI "https://<HOST>/api/qa/status" | head -1
# → HTTP/2 200 (gate active) ; en Production ce serait HTTP/2 404
```

---

## 3. Génération du lien Preview QA (magic link bootstrap)

```sh
# Le script deploy stash déjà les secrets si tu passes --stash-secrets ;
# sinon régénère un lien via generate-preview-qa-link.mjs.
node scripts/qa/generate-preview-qa-link.mjs \
  --host "<HOST_SANS_HTTPS>" \
  --admin-email "$YEMA_QA_ADMIN_EMAIL"
```

Ce lien magic ouvre la console QA. Il expire en 10 minutes (nonces
durables + antirejeu). Utilise-le une seule fois pour établir ta session
QA admin dans le navigateur.

---

## 4. Validation visuelle 9 personas

Depuis la console QA (`https://<HOST>/fr/qa`) authentifié admin :

| Persona           | Destination                              | Attendu                                                   |
| ----------------- | ---------------------------------------- | --------------------------------------------------------- |
| Super Admin       | `/fr/admin`                              | AdminDashboard YEMA (4 sections, 9 personas listés)       |
| Enseignant        | `/fr/teacher`                            | TeacherDashboard (6 rubriques + assignments P4.5-B)       |
| Coach Racines     | `/fr/coach/racines`                      | CoachRacinesDashboard (surfaces bordeaux)                 |
| Center Admin      | `/fr/center`                             | CenterDashboard (7 rubriques, aucune fausse facturation)  |
| Famille           | `/fr/family`                             | FamilyDashboard (2 enfants, sièges Monde+Racines)         |
| Élève Monde       | `/fr/dashboard`                          | StudentMondeDashboard                                     |
| Élève Racines     | `/fr/dashboard`                          | StudentRacinesDashboard                                   |
| Enfant Monde      | `/api/qa/child-session?child=monde` → 303 `/fr/dashboard` | ChildMondeDashboard (cookie enfant set) |
| Enfant Racines    | `/api/qa/child-session?child=racines` → 303 `/fr/dashboard` | ChildRacinesDashboard (universe=racines) |

Pour chaque persona, prends une capture desktop 1440×900 et une mobile
390×844 dans DevTools. Nomme les fichiers selon la convention du brief :

```
super-admin-desktop.png    super-admin-mobile.png
teacher-desktop.png        teacher-mobile.png
coach-racines-desktop.png  coach-racines-mobile.png
center-desktop.png         center-mobile.png
family-desktop.png         family-mobile.png
student-monde-desktop.png  student-monde-mobile.png
student-racines-desktop.png student-racines-mobile.png
child-monde-desktop.png    child-monde-mobile.png
child-racines-desktop.png  child-racines-mobile.png
```

Le dossier `screenshots/` est gitignoré → les captures ne polluent pas
le commit (voir §11 du brief).

---

## 5. Playwright automatisé — smoke Preview + fallback local

Un spec smoke non-authentifié tourne déjà via
`playwright.lot-6-preview.config.ts` :

```sh
# Contre serveur local (via wrapper P-1, prod build) :
npx playwright test --config playwright.lot-6-preview.config.ts

# Ou contre la Preview déployée :
PLAYWRIGHT_BASE_URL="https://<HOST>" \
  npx playwright test --config playwright.lot-6-preview.config.ts
```

Le spec vérifie :
- 15 combinaisons (3 pages publiques × 5 viewports) sans overflow horizontal
- 3 endpoints QA sans 5xx ni fuite de secret

La validation authentifiée 9 personas + captures nécessite un bake
Playwright storage state qui n'est pas fait dans ce lot (nécessite email
+ verifyOtp). Elle peut être ajoutée dans un futur lot avec le harness
p4-5-b2 étendu aux personas `family`, `child_monde`, `child_racines`.

---

## 6. Contrôles Production (jamais toucher, juste vérifier)

Depuis un navigateur privé, sans session QA :

```sh
curl -sI "https://<HOST_PROD>/api/qa/status" | head -1
# → HTTP/2 404 (gate off en Prod = résultat correct)

curl -s "https://<HOST_PROD>/api/qa/status"
# → {"error":"Not found"}

curl -sI "https://<HOST_PROD>/api/qa/impersonate" -X POST | head -1
# → HTTP/2 404
```

Aucune interaction avec la base Production. Aucun déploiement.
`sbjhvlrkbyjckdxujjsk` (prod deutschcm) reste intouché.

---

## 7. Rollback / nettoyage

Une Preview Vercel n'a pas besoin d'être "rollback" — elle expire
d'elle-même (Vercel garde les 30 derniers déploiements Preview).

Pour retirer les fixtures QA de P-1 après la campagne :

```sh
node scripts/test-baseline/run-p4-5-b2-p1.mjs --flag off \
  -- node scripts/test-baseline/yema-qa-cleanup.mjs
```

Cleanup supprime uniquement les rows préfixées `test_yema_qa_` sur P-1.
Aucune action en Production.

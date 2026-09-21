# P-1 Baseline authentifiée — scripts

Ces scripts créent, vérifient et nettoient une baseline de comptes de test sur le projet Supabase **`yema-p1-baseline`** dédié, ref canonique **`kzzagbojjkivdzzcrmxn`**.

Les refs historiques `qggwvonfumuimjfsgpdz`, `mamofhrurksyuuolucea` et `sbjhvlrkbyjckdxujjsk` sont explicitement bloquées par les garde-fous. Ne les utilisez pas pour P-1.

**Refuse d'exécuter sur Production.** Chaque script exige `P1_BASELINE_CONFIRMED_NOT_PRODUCTION=true` dans `.env.p1-baseline` (gitignoré), puis vérifie que toutes les URLs Supabase/Postgres pointent exclusivement vers `kzzagbojjkivdzzcrmxn`.

## Prérequis

```bash
# .env.p1-baseline doit exister avec :
#   P1_BASELINE_CONFIRMED_NOT_PRODUCTION=true
#   NEXT_PUBLIC_SUPABASE_URL=https://kzzagbojjkivdzzcrmxn.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY    (JWT anon P-1)
#   SUPABASE_SERVICE_ROLE_KEY        (JWT service_role P-1)
#   DIRECT_URL                       (postgres session pool P-1)
#   DATABASE_URL                     (postgres transaction pool P-1)
#   P1_TEST_PASSWORD                 (24+ caractères aléatoires recommandé; minimum 12)
#   YEMA_CHILD_SESSION_SECRET        (32+ caractères pour les scénarios enfant/runtime)

set -a; source .env.p1-baseline; set +a
```

Ne mettez jamais de secret réel dans le dépôt. Utilisez `.env.p1-baseline` localement ou le coffre de secrets CI dédié à P-1.

## Gate de release canonique

```bash
node scripts/test-release-gate-p1.mjs
```

Le wrapper charge uniquement `.env.p1-baseline`, rejette toute ref non P-1, puis exécute en fail-fast : tests, TypeScript, build, admission QA bêta, 9 personas runtime/visuel, assignments, Realtime, audio et browser acceptance.

## Baseline historique

Les scripts historiques suivants restent disponibles pour créer/vérifier/nettoyer le socle minimal :

```bash
# Créer les comptes + données représentatives
node scripts/test-baseline/create-test-baseline.mjs

# Vérifier l'intégrité de la baseline
node scripts/test-baseline/verify-test-baseline.mjs

# Supprimer les fixtures test uniquement
node scripts/test-baseline/cleanup-test-baseline.mjs
```

## Convention de nommage

Toutes les données de test doivent conserver des marqueurs explicites :

- Emails : préfixes `test_yema_qa_...` ou historiques `paul+yema_test_...`
- Prénoms : `TEST_...`
- Classes / centres : `TEST_...`

Le cleanup et les helpers de mutation **refusent** de toucher les entités qui ne correspondent pas aux conventions de test.

## Personas actuels du sweep canonique

Le gate de release couvre les 9 personas YEMA :

1. Super Admin
2. Teacher
3. Coach Racines
4. Center Admin
5. Student Monde
6. Student Racines
7. Family
8. Child Monde
9. Child Racines

Les enfants utilisent une vraie session parent + PIN sur P-1. Les flags Coach/Centre requis par le sweep sont activés uniquement dans le serveur QA P-1.

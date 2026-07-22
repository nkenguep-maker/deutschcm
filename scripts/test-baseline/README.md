# P-1 Baseline authentifiée — scripts

Ces scripts créent, vérifient et nettoient une baseline de 6 comptes de test
sur le projet Supabase **`yema-p1-baseline`** dédié (ref `qggwvonfumuimjfsgpdz`).

**Refuse d'exécuter sur la production.** Chaque script exige la variable
d'environnement `P1_BASELINE_CONFIRMED_NOT_PRODUCTION=true` définie dans
`.env.p1-baseline` (gitignoré).

## Prérequis

```bash
# .env.p1-baseline doit exister avec :
#   P1_BASELINE_CONFIRMED_NOT_PRODUCTION=true
#   NEXT_PUBLIC_SUPABASE_URL         (placeholder https://xxx.supabase.co)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY    (placeholder JWT anon)
#   SUPABASE_SERVICE_ROLE_KEY        (placeholder JWT service_role)
#   DIRECT_URL                       (postgres session pool)
#   DATABASE_URL                     (postgres transaction pool)

set -a; source .env.p1-baseline; set +a
```

## Utilisation

```bash
# 1. Créer les 6 comptes + données représentatives
node scripts/test-baseline/create-test-baseline.mjs

# 2. Vérifier l'intégrité de la baseline
node scripts/test-baseline/verify-test-baseline.mjs

# 3. Supprimer tout (Auth + DB) — refuse tout compte sans préfixe test
node scripts/test-baseline/cleanup-test-baseline.mjs
```

## Convention de nommage

Toutes les données créées sont préfixées de manière visible :

- Emails : `paul+yema_test_<rôle>@example.com`
- Prénoms : `TEST_<Rôle>`
- Nom de classe : `TEST_KLASSE_A1`
- Nom de centre : `TEST_CENTRE_YEMA_DEV`

Le cleanup **refuse** de supprimer toute entité qui ne matche pas ces préfixes.

## 6 profils créés

| Compte email | Rôle | Territoire | Données représentatives |
|---|---|---|---|
| `paul+yema_test_monde@example.com` | STUDENT | Monde | LearningPath deutsch A1 + progression partielle |
| `paul+yema_test_racines_solo@example.com` | STUDENT | Racines | LearningPath wolof É1 + Solo grant |
| `paul+yema_test_racines_family@example.com` | STUDENT | Racines Famille | Household + 2 profils enfants (TEST_Ade, TEST_Yara) |
| `paul+yema_test_teacher@example.com` | TEACHER | Monde | Teacher + 1 classroom V2 + 3 étudiants + 1 assignment |
| `paul+yema_test_center@example.com` | CENTER | — | LanguageCenter TEST_CENTRE_YEMA_DEV + 1 prof rattaché |
| `paul+yema_test_admin@example.com` | ADMIN | — | Rôle ADMIN + userRoles |

Mots de passe stockés en local (`.env.p1-baseline` généré au create).

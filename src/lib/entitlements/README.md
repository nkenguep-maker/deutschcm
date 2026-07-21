# Socle YEMA V1 · Users, catalogue, grants, entitlements

**Doctrine** : le profil oriente · le package finance · **le grant prouve** · l'entitlement autorise.
Aucun accès à la main. Toutes les routes qui décident d'un accès passent par `getEntitlements`.

## Modèle en 4 étages

```
User ── UserAppRole[]                    (LEARNER, PARENT, TEACHER, CAREER_COACH, CENTER_ADMIN, YEMA_ADMIN)
  │
  ├─ LearningPath[]                      (universe, language, currentLevel, intention)
  │
  ├─ Order → OrderItem → ProductVariant  (achat · Passage/Teacher/Solo/Famille/Followup)
  │            │
  │            └─ AccessGrant             (créé par Payment.confirmedAt → grantFromOrderItem)
  │
  └─ Household → HouseholdMembership     (2 adultes max, 4 enfants max)
              └─ DependentProfile        (enfants : pas d'auth, pas de paiement, pas de messagerie)
```

## Catalogue (source de vérité : `prisma/seed.ts`)

| Produit                | Univers  | Facturation  | Capacités V1                                     |
|------------------------|----------|--------------|--------------------------------------------------|
| `PASSAGE`              | MONDE    | ONE_TIME     | COURSE_ACCESS, AI_TEXT, AI_VOICE, MOCK_EXAMS, CERTIFICATE |
| `TEACHER_ADDON`        | MONDE    | ONE_TIME     | CLASSROOM, THREAD_POST, HOMEWORK                 |
| `CAREER_COACH_ADDON`   | MONDE    | ONE_TIME     | CLASSROOM, THREAD_POST, HOMEWORK · **inactif V1** |
| `ROOTS_SOLO`           | RACINES  | SUBSCRIPTION | COURSE_ACCESS, VEILLEE_CONTENT                   |
| `ROOTS_FAMILY`         | RACINES  | SUBSCRIPTION | COURSE_ACCESS, VEILLEE_CONTENT, CHILD_PROFILES   |
| `ROOTS_FOLLOWUP_ADDON` | RACINES  | ONE_TIME     | CLASSROOM, THREAD_POST, HOMEWORK                 |
| `COMPANION`            | (aucun)  | SEAT         | COURSE_ACCESS · **réservé V2** (centres)         |

Prix Passage / Teacher : voir §PASSAGE_LEVELS / TEACHER_ADDON_LEVELS dans `prisma/seed.ts`.
Rejouer le seed est **idempotent** : `npx tsx prisma/seed.ts` (ou `npm run seed`).

## Comment ajouter un produit

1. Ajouter la valeur au enum `ProductCode` dans `prisma/schema.prisma`.
2. Créer une migration (raw SQL) qui `ALTER TYPE "ProductCode" ADD VALUE ...`.
3. Étendre `CATALOG` dans `prisma/seed.ts` : produit + variantes + `capabilities: []`.
4. Rejouer le seed.
5. Si add-on avec prérequis : étendre `validateAddonPurchase()` dans `src/lib/entitlements/index.ts`.

## Comment lire un droit (dans une route)

```ts
import { getEntitlements } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const r = await getEntitlements({
    userId: dbUser.id,
    learningPathId: req.nextUrl.searchParams.get("pathId") ?? undefined,
    capability: "AI_TEXT",
  });
  if (!r.allowed) return NextResponse.json({ error: r.reason }, { status: 403 });

  // r.limits.remaining / r.limits.max sont dispos pour les caps limitées
  // r.limits.grantId identifie le grant qui autorise (null si gratuit)
}
```

## Comment créer un grant (uniquement système)

Un `access_grant` n'est créé QUE par :

1. Un `Payment` qui bascule à `CONFIRMED` (webhook Cinetpay / callback carte).
2. Une promo auditée (audit trail dans `metadata`).

```ts
import { grantFromOrderItem } from "@/lib/entitlements/grants";

// Dans le webhook de confirmation de paiement, après avoir mis order.status = "PAID"
for (const item of order.items) {
  await grantFromOrderItem(item.id);
}
```

**Interdit** : `prisma.accessGrant.create(...)` en dehors des flux payment/promo.

## Comment créer / réconcilier la ligne `users` Prisma

**LE mécanisme unique et idempotent :** `src/lib/reconcileDbUser.ts`.

```ts
import { reconcileDbUser } from "@/lib/reconcileDbUser";

const { user: dbUser, path } = await reconcileDbUser({
  authUser,               // User Supabase (obtenu via supabase.auth.getUser())
  defaultRole: "STUDENT", // rôle par défaut si UserRole absent
  patch: { onboardingDone: true }, // optionnel
});
```

Il gère 3 cas dans cet ordre :
1. `matched_supabase_id` — la ligne existe et son `supabaseId` correspond → renvoie tel quel (+ patch)
2. `adopted_orphan_email` — une ligne existe avec le même `email` mais un autre `supabaseId` (compte Supabase supprimé/recréé pendant des tests) → **adopte** le nouveau `supabaseId` sur la ligne existante
3. `created_fresh` — aucune ligne, création propre

Dans les 3 cas, un `UserRole` correspondant au `defaultRole` est créé si absent (via `grantRole`, idempotent).

**Interdit désormais** : `prisma.user.upsert({ where: { supabaseId }, ... })` direct dans une route. Cela crashera P2002 sur `email` si une ligne orpheline existe. Toujours passer par `reconcileDbUser`.

Routes qui l'utilisent : `/api/learning-paths`, `/api/onboarding/complete`, `/auth/callback`.

## Codes d'erreur des routes API

Les routes qui font des mutations DB renvoient un body structuré :

```json
{ "error": "unique constraint violation", "code": "DB_CONFLICT", "detail": {...} }
```

Codes stables (à consommer côté client sans parser le message) :
- `UNAUTHORIZED` (401) · session absente/invalide
- `VALIDATION_ERROR` (400) · champ hors enum, format invalide (`detail.field`, `detail.got`)
- `DB_CONFLICT` (500) · contrainte unique · souvent résolu par `reconcileDbUser` mais garde le code pour audit
- `INTERNAL` (500) · toute autre erreur non identifiée

Toute erreur est loggée serveur avec `code`, `message`, `meta`, `stack` (voir `console.error("[route-name] FAIL", …)`).

## Règles serveur absolues (jamais contournées)

- **Univers racines → deny(AI_TEXT, AI_VOICE)** — même si l'user a un Passage allemand actif.
- **actor.type = DEPENDENT_PROFILE → deny(THREAD_POST)** — les enfants n'ont pas de messagerie.
- **Foyer** : 2 adultes max · 2 enfants/adulte · 4 enfants/foyer — enforced dans `household.ts`.

## Deux entrées gratuites (résout la contradiction v1)

| Univers | Sans grant, l'user a droit à …                                           |
|---------|-------------------------------------------------------------------------|
| MONDE   | COURSE_ACCESS (1re leçon) · AI_TEXT + AI_VOICE limité à **5 min**       |
| RACINES | COURSE_ACCESS (1re leçon) · VEILLEE_CONTENT · **jamais d'IA**           |

## Endpoint `/api/activation-status?orderId=xxx`

Retourne l'état d'un order : items + grants créés + statut paiement. Utilisé par l'écran
d'attribution (prochaine étape) pour poller après un paiement Cinetpay.

## Refactor à faire (routes ad hoc → getEntitlements)

Fichiers à migrer identifiés :

- `src/app/api/me/route.ts`
- `src/app/api/group/route.ts`
- `src/app/api/center/route.ts`
- `src/app/api/roles/revoke/route.ts`
- `src/app/api/classroom/{route,join,validate,check-code}/route.ts`
- `src/app/api/ambassade/route.ts`
- `src/app/api/social/route.ts`
- `src/app/[locale]/demo/page.tsx`
- `src/app/[locale]/discover/group/[groupId]/page.tsx`
- `src/app/[locale]/simulateur/page.tsx`
- `src/app/[locale]/group/page.tsx`
- `src/app/[locale]/admin/page.tsx`
- `src/lib/ai/gemini.ts`
- `src/components/SpaceSwitcher.tsx`
- `src/components/PlanGate.tsx`, `src/hooks/usePermissions.ts`

Discipline n°1 : chaque `if (role === …)` / `if (isPaid)` / `if (plan === …)` → `getEntitlements(…)`.

## Tests

```
npm test              # vitest run
npm run test:watch    # mode watch
```

Couverture V1 (`src/lib/entitlements/__tests__/entitlements.test.ts`, 7 tests) :

- Passage payé → COURSE_ACCESS allowed sur bon parcours · denied ailleurs
- TEACHER_ADDON refusé sans Passage · accepté avec · refusé sur mauvais niveau
- Racines → AI_TEXT/AI_VOICE denied malgré Passage allemand actif
- Famille : 3e adulte refusé · 5e enfant refusé · dependent ne peut pas THREAD_POST
- Gratuit MONDE : IA 5 min · Gratuit RACINES : VEILLEE_CONTENT, aucune IA
- Grant expiré → capability denied
- Famille : follow-up refusé avant, accepté après Family · CHILD_PROFILES accordé au parent via HOUSEHOLD

## Notes techniques

- **Prisma 7** : URL DB dans `prisma.config.ts` via `process.env["DIRECT_URL"]`, **jamais** dans `schema.prisma`.
- **Shadow DB** : Supabase-hosted Postgres → shadow DB fail (schéma `auth` absent). Les migrations
  sont donc appliquées via `prisma db execute --file …` puis marquées `--applied`.
- **Adapter** : `PrismaPg` obligatoire en Prisma 7 (`{ adapter, log }` dans le constructor).

## Différé V2 (noms réservés, tables non créées)

- `organizations` · `organization_memberships` · `center_contracts` · `seat_allocations`
- `subscriptions` (vraie mécanique récurrente) · `subscription_items` · `subscription_events`
- `refunds` (V1 : révocation manuelle de grant + note admin)
- `provider_accreditations`
- `moderation_status` sur messages · rôle OBSERVER
- Pack coach public

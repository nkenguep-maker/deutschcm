# Écran d'activation · post-paiement / post-upgrade

Écran de transition entre un achat (ou un changement de package) et le
tableau de bord. Vérifie l'état RÉEL des droits (grants) et ne bascule que
quand tout est prêt — jamais de fausse progression.

## Route

`/[locale]/activation?orderId=<orderId>`

- Sans `orderId` → redirige vers `/dashboard`.
- `orderId` inconnu / non possédé (401/403/404) → redirige vers `/dashboard`.
- OK → poll `/api/activation-status?orderId=<orderId>` toutes ~1s (backoff
  léger à partir du 8e tir).
- `tout_pret === true` **et** min 2.5s d'affichage atteintes → redirection
  automatique vers `espace_cible` après ~600ms de respiration.
- Timeout de grâce à 20s → panneau « c'est un peu plus long » + bouton
  « Aller à mon espace ».
- Échec réel (`payments.status === "FAILED"` ou `orders.status === "CANCELLED"`)
  → écran d'échec dédié (pas de redirection auto).

## Comment câbler un vrai flux de paiement (à faire quand le tunnel arrive)

**Callback CinetPay / carte :**

```ts
// dans le handler POST /api/payments/webhook (à créer)
await prisma.$transaction(async (tx) => {
  await tx.payment.update({
    where: { id: paymentId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
});

// hors transaction pour éviter les timeouts sur la création de multiples grants
for (const item of order.items) {
  await grantFromOrderItem(item.id);
}

// puis rediriger le navigateur (ou renvoyer un JSON avec l'URL) :
//   /{locale}/activation?orderId=<order.id>
```

**Upgrade / changement de package depuis l'espace :**

Même chose — la route qui traite l'upgrade crée l'order (statut PAID une
fois l'appel API abouti), appelle `grantFromOrderItem` pour chaque item,
puis renvoie l'URL `/activation?orderId=…` au client qui fait
`router.push(...)`.

## Route dev-only pour tester

`POST /api/dev/simulate-order` (bloquée en production) :

```bash
curl -X POST http://localhost:3000/api/dev/simulate-order \
  -H "Content-Type: application/json" \
  -d '{"preset":"passage_prof","scenario":"slow"}'
```

Presets : `passage_seul`, `passage_prof`, `roots_solo`, `roots_family`,
`roots_famille_prof`.

Scénarios :
- `instant` — tout confirmé, grants créés → `tout_pret` d'entrée.
- `slow` — paiement confirmé, grants créés en différé (1.2s / item).
- `grace` — paiement confirmé, aucun grant créé (déclenche le timeout 20s).
- `failed` — payment `FAILED`.
- `cancelled` — order `CANCELLED`.

La réponse contient l'URL à ouvrir (`/activation?orderId=…`).

## Fichiers

| Rôle | Fichier |
|---|---|
| Helper de dérivation | `src/lib/entitlements/activation.ts` |
| Endpoint | `src/app/api/activation-status/route.ts` |
| Route dev-only | `src/app/api/dev/simulate-order/route.ts` |
| Page | `src/app/[locale]/activation/page.tsx` |
| Composant visuel | `src/components/activation/ActivationScreen.tsx` |
| Copy | `messages/{fr,en}.json` clé `activation` |
| CSS | `src/app/globals.css` section « ÉCRAN D'ACTIVATION » |
| Tests | `src/lib/entitlements/__tests__/activation.test.ts` |

## Doctrine appliquée

- La vérité vient des `access_grants` + `payments.confirmedAt`. Jamais un
  compteur qui coche seul.
- Le Confluent (BrandY) joue la partition `signature` au montage puis passe
  en `loader` (braise pulse) tant que `!tout_pret`. `static` juste avant la
  redirection. `prefers-reduced-motion` : dégradation en `static` complet.
- Deux ambiances : `territory-world` (espresso + laiton) ou
  `territory-sources` (terre + cuivre) — dérivée du produit acheté
  (RACINES → sources).
- Redirections via `useRouter` de `@/navigation` (next-intl) — chemins
  nus, jamais `/fr/fr`.

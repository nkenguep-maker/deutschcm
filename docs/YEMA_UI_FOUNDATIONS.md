# YEMA · Fondations UI · Responsive et accessibilité

> **Livrable du lot P0.B** (`fix/yema-p0b-ui-foundations`). Documente les primitives responsive introduites après la baseline authentifiée P-1, les règles d'accessibilité qui les gouvernent et la checklist qu'une page authentifiée doit satisfaire avant merge.
>
> Ce document ne dédouble pas `docs/YEMA_PRODUCT_DESIGN_DOCTRINE.md`. Il concentre uniquement ce dont on a besoin pour bâtir une page responsive et accessible sans réinventer le vocabulaire commun.

## 1. Principes mobile-first

- Le viewport de référence est **390 × 844** (iPhone 15/16). On teste également **360 × 800** (Android bas de gamme), **768 × 1024** (tablette) et **1440 × 900** (desktop).
- Un tableau desktop **doit** exister lorsqu'il y a une lecture croisée réelle (comparer plusieurs lignes sur plusieurs colonnes). En dessous de 768 px, on remplace la table par une **liste de cartes** structurées, jamais une table compressée.
- Un composant n'invente pas son propre système : il utilise les primitives ci-dessous ou une classe globale existante. En cas de doute, une paire de lignes CSS locale au fichier reste préférable à une abstraction prématurée.

## 2. Tableaux desktop et listes mobiles

### Desktop (≥ 768 px)

```tsx
<div className="data-table-wrap desktop-only">
  <div className="data-table-scroll">
    <table className="data-table">
      <thead>…</thead>
      <tbody>…</tbody>
    </table>
  </div>
</div>
```

- `.data-table-wrap` porte la bordure, le radius et le fond ; `overflow: hidden` empêche les enfants de s'échapper.
- `.data-table-scroll` autorise un scroll horizontal local si vraiment nécessaire.
- Les cellules `td` évitent tout `min-width` en pixels. Si un contenu doit rester lisible, utiliser `text-wrap-anywhere` ou `white-space: nowrap` sur cette **cellule** uniquement.

### Mobile (< 768 px)

```tsx
<ul className="data-list mobile-only" aria-label="Apprenant·e·s">
  {rows.map((row) => (
    <li key={row.id} className="data-card">
      <div className="data-card-head">
        <span className="mono-avatar" aria-hidden="true">…</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="data-card-title">{row.name}</p>
          <p className="data-card-sub">{row.email}</p>
        </div>
        <span className="status-pill active">{row.level}</span>
      </div>
      <dl className="data-card-rows">
        <dt>XP</dt><dd>{row.xp}</dd>
        …
      </dl>
      <div className="data-card-actions">
        <Link href="…" className="row-btn">Profil</Link>
      </div>
    </li>
  ))}
</ul>
```

- **Une seule source de données** pour la table et pour les cartes ; ne jamais dupliquer le filtrage ou la pagination.
- La carte doit rester lisible sans scroll horizontal à 360 px.
- Aucune donnée essentielle n'est cachée derrière une ellipse. Les longs contenus s'enroulent avec `overflow-wrap: anywhere` (classe `text-wrap-anywhere`).

## 3. `filter-row`

Remplace un `flex` avec largeurs fixes (200 px / 150 px / 170 px…). Chaque enfant devient `flex: 1 1 200px` et passe automatiquement en pleine largeur sous 480 px.

```tsx
<div className="filter-row">
  <input type="search" … />
  <select …>…</select>
  <button …>Réinitialiser</button>
</div>
```

## 4. Cible tactile 44 × 44 px

- Utiliser `.tap-target` sur les boutons icônes, chevrons et actions de ligne dont la surface visible est inférieure à 44 × 44 px.
- L'icône reste petite ; c'est la zone interactive qui s'élargit (par `min-width` et `min-height`).
- Ne pas cumuler `.tap-target` avec un padding déjà généreux.

## 5. Focus visible

- La classe `.focus-ring:focus-visible` fournit un anneau brass 2 px avec offset. À poser sur toute cible interactive dont le style ne prévoit pas déjà un `outline`.
- Ne jamais retirer un `outline` sans remplacement accessible.
- Les composants qui gèrent leur propre focus (menus, modaux) doivent restaurer le focus au déclencheur à la fermeture.

## 6. Safe areas iOS

- Le root layout expose `viewport-fit=cover` (voir `src/app/layout.tsx`).
- Les shells authentifiés (`.app-sidebar`, `.app-header`) intègrent déjà `env(safe-area-inset-*)`. La landing n'est pas concernée (elle vit dans son propre viewport standard).
- Utilitaires disponibles : `.safe-area-top`, `.safe-area-bottom`, `.safe-area-x`, `.safe-area-inset`.
- Ne pas appliquer un padding safe-area à toutes les pages : réserver aux éléments fixes ou sticky.

## 7. Clavier mobile

- Les champs texte ne doivent pas être cachés sous un composant fixe quand le clavier s'ouvre. Éviter les `height: 100vh` sur les conteneurs — préférer `100dvh` ou `100svh` quand un plein écran est réellement voulu.
- Les formulaires modaux doivent supporter un scroll interne ; toucher hors champ ne doit pas fermer sans confirmation lorsqu'une saisie est en cours.

## 8. États fonctionnels

Une seule primitive : `<StateBlock />` (voir `src/components/StateBlock.tsx`). Sept kinds :

| kind | Rôle | Aria |
|---|---|---|
| `error` | Erreur bloquante · action de récupération. | `role="alert"` + `aria-live="polite"` |
| `empty` | Contenu attendu mais vide (pas d'erreur). | — |
| `loading` | Chargement long, rendu avec `BrandY` en braise. | — |
| `success` | Confirmation d'une action utilisateur. | — |
| `confirm` | Attente d'une confirmation utilisateur (destructif). | — |
| `offline` | Réseau indisponible · progression sauvegardée. | `role="status"` + `aria-live="polite"` |
| `locked` | Fonction non débloquée pour ce compte. | — |

Règles :

- Titre utile (fragment brass entre `*…*`).
- Explication concrète — pas de « erreur backend », pas d'anglais dans la version FR.
- Bouton primaire seulement quand une action est réellement possible.
- Aucune donnée fictive pour remplir un état vide. Le rôle doit être clair.

## 9. Progression segmentée

Le composant `OnboardingProgress` reste la source unique pour indiquer « étape N sur M » dans un funnel. Il est réutilisable par les futurs parcours du funnel (P1) et de découverte (P2) sans nouvelle primitive. On n'invente pas d'autre barre de progression sans avoir démontré qu'aucune variante existante ne suffit.

## 10. Offline

`StateBlock kind="offline"` est le rendu canonique en cas de coupure réseau côté client :

```tsx
<StateBlock
  kind="offline"
  centered
  soul="La maison attend le réseau. *Ta progression est sauvegardée.*"
  body="Impossible de récupérer les données. Reconnecte-toi pour charger les dernières valeurs — rien n'est perdu."
  action={{ label: "Réessayer", onClick: retry }}
/>
```

Ne jamais prétendre qu'un contenu est disponible hors ligne si aucun cache n'existe. `/notifications` intègre déjà ce squelette (voir `src/app/[locale]/notifications/page.tsx`).

## 11. Bloc technique

`/admin/system` (et futures pages qui affichent identifiants, tokens, JSON) utilise `.tech-block` : scroll horizontal local, wrap agressif, jamais d'overflow de page.

## 12. Checklist d'une page authentifiée

Avant merge, une page modifiée doit satisfaire :

- [ ] Aucun overflow horizontal de page à 360 / 390 / 768 / 1440.
- [ ] Table desktop conservée là où la lecture croisée est utile.
- [ ] Variante mobile via `.data-list` + `.data-card` (source unique).
- [ ] Filtres via `.filter-row`, jamais de `width: 200px`.
- [ ] Longs contenus (emails, codes, URLs, noms) enrouler via `.text-wrap-anywhere` ou `overflow-wrap: anywhere`.
- [ ] Actions tactiles ≥ 44 × 44 px (via `.tap-target` si nécessaire).
- [ ] États `loading`, `empty`, `error`, `offline` couverts par `StateBlock`.
- [ ] Aucune donnée fictive dans une vue authentifiée.
- [ ] Pas de `width: 100vh` ou hauteurs fixes qui empêcheraient le clavier mobile.
- [ ] Safe-area gérée pour tout élément `fixed` ou `sticky`.

## 13. Usages interdits

- Ajouter un `PremiumTable`, `ModernDashboard`, `FancyMobileCard`, `UniversalResponsiveSystemV2`. Ces noms parlent de style, pas de fonction. On les refuse en revue.
- Cacher une donnée métier essentielle uniquement avec `text-overflow: ellipsis`.
- Introduire un nouveau breakpoint sans mise à jour de ce document et du composant `docs/YEMA_UI_FOUNDATIONS.md`.
- Copier / coller un tableau existant vers un rendu mobile ad hoc : la mobile-card list vit à côté du tableau, jamais à la place, jamais en fork.
- Utiliser `.data-list` dans la landing (`/fr`, `/en`). La landing garde sa propre grille éditoriale.

## 14. Portée exclusive P0.B

Ce lot n'a pas :

- refait un dashboard,
- créé le funnel,
- branché la messagerie ou le microphone,
- modifié les prix, entitlements, Prisma, ni la landing.

Les primitives ci-dessus sont conçues pour être réutilisées par P1 (funnel), P2 (dashboards), P3 (Racines) et P4 (messagerie) sans réécriture.

## 15. Vérification visuelle post-merge P0.B

Vérification exécutée sur baseline P-1 réauthentifiée (2026-07-22) — Playwright
authentifié × 3 rôles × 12 routes × 4 viewports = **48 rendus**. Critère
principal : `document.documentElement.scrollWidth <= clientWidth`.

| Route | 360 | 390 | 768 | 1440 | Page overflow | Local overflow | Résultat |
|---|--:|--:|--:|--:|--:|--:|---|
| `/center/students` | 3 | 0 | 46 | 0 | 0 sur 4 vp | table > 768 dans `.data-table-scroll` | ✓ |
| `/center/teachers` | 3 | 0 | 37 | 0 | 0 sur 4 vp | table > 768 dans `.data-table-scroll` | ✓ |
| `/center/classes` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/center/billing` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/admin` | 63 | 61 | 0 | 0 | 0 sur 4 vp | sidebar 240 px hardcodée (hors scope P0.B) | ⚠ |
| `/admin/users` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/admin/centers` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/admin/applications` | 0 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/admin/system` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/notifications` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/group` | 3 | 0 | 0 | 0 | 0 sur 4 vp | — | ✓ |
| `/discover` | 4 | 1 | 1 | 0 | 0 sur 4 vp | .seuil-brasier animation | ✓ |

- Le « 3 » qui apparaît sur presque toutes les pages à 360 px correspond aux
  actions du shell `.app-header-actions` (LanguageChooser + SpaceSwitcher +
  LanguageSwitcher + NotificationBell = 295 px de largeur alors qu'il ne reste
  que ~296 px après hamburger + padding). Cette contrainte est portée par le
  Layout partagé, existait avant P0.B, et est contenue par
  `body { overflow-x: hidden }`. À traiter dans une passe Layout dédiée.
- `/admin` conserve sa propre shell interne (sidebar 240 px inline, ne suit pas
  `.app-shell`). Le fix P0.B a rendu la grille KPI fluide (auto-fit minmax 140)
  mais la sidebar hardcodée reste. Refactor complet planifié pour P2/P3.
- Sur les tables desktop à 768 px (`center/students`, `center/teachers`), la
  table dépasse la largeur du viewport tablette et scrolle horizontalement DANS
  `.data-table-scroll` — comportement voulu par la doctrine §5 (« scroll
  horizontal local uniquement si réellement nécessaire »).

**Landing `/fr` et `/en`** (3 viewports × 2 routes = 6 rendus) : 0 leak de
classe P0.B, 0 page-overflow, seul l'élément canonique `.seuil-brasier`
(animation braise) déborde de son container en 360/390 comme avant P0.B.

**Lint objectif** (diff main vs branche sur 11 fichiers modifiés partagés) :
0 nouveau error, 0 nouveau warning. Total identique 45 errors + 14 warnings
tous pré-existants (`any`, `unused-vars`, `no-html-link-for-pages`,
`no-unescaped-entities`). Le nouveau fichier
`src/app/__tests__/responsive-foundations.test.ts` produit 0 finding.

**Données mock encore visibles** (non introduites par P0.B, à traiter par un lot
de branchement DB ultérieur) :

| Route | Mock names visibles | Fichier source |
|---|---|---|
| `/center/students` | 14 (Marie Nguemo, Sophie Tanda, …) | `src/app/[locale]/center/students/page.tsx` const `STUDENTS` |
| `/center/teachers` | 7 (Dr. Beatrice Momo, …) | `src/app/[locale]/center/teachers/page.tsx` const `MOCK_TEACHERS` |
| `/center/classes` | 1 (Jean Mbarga) | `src/app/[locale]/center/classes/page.tsx` const `CLASSES` |
| `/center/stats` | 15 | idem `/center/students` référencé pour stats |
| `/center/billing` | 0 | — |

Ces valeurs proviennent des constantes hardcodées de démonstration qui
existent depuis avant P0.B (voir `docs/YEMA_AUTHENTICATED_BASELINE.md` §110).
Elles seront remplacées par des queries Prisma réelles quand le branchement
back-office centre sera priorisé — hors scope P0.A/P0.B/P1.


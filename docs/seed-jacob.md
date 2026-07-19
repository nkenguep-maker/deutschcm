# Seed Jacob · tester Le Foyer sur les 4 profils

Ce guide décrit le compte de test qui alimente `/dashboard` avec des
données réelles (jamais simulées) pour valider les quatre configs de
cap.

## Créer / réinitialiser le compte

```bash
# Crée ou met à jour Jacob (idempotent — ne casse pas les données
# existantes ; ré-affecte cap, activeLanguage, streak, écrits).
node scripts/seed-jacob.mjs

# Rebuilds from scratch — supprime Prisma User + Supabase auth user
# avant de recréer.
node scripts/seed-jacob.mjs --reset
```

Requiert dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Ce que le seed crée

| Élément | Valeur |
|---|---|
| Email | `jacob@yema.test` |
| Mot de passe | `JacobFoyer-2026!` |
| Niveau | Allemand B1 |
| Cap par défaut | Franchir |
| Langues supportées | `deutsch`, `bassa` (permet de tester la bascule world ↔ sources) |
| Classe | `Deutsch B1 · Groupe du soir` · code `DE-B1-SOIR-2026` |
| Prof | Marie Kamdem (compte `marie.k@yema.test`, mot de passe `MarieProf-2026!`) |
| Braise | 12 modules `COMPLETED` sur 12 jours consécutifs (jusqu'à aujourd'hui inclus → respiration 7s active) |
| Écrits corrigés | 3 `AssignmentSubmission` avec score + feedback |

## Basculer entre les 4 caps

Chaque cap change la voix du hero, les compteurs de la CapCard et la
trousse d'outils. Utiliser le helper :

```bash
node scripts/set-cap.mjs jacob@yema.test franchir
node scripts/set-cap.mjs jacob@yema.test grandir
node scripts/set-cap.mjs jacob@yema.test transmettre
node scripts/set-cap.mjs jacob@yema.test moi
```

Recharger `/dashboard` après chaque bascule. Les changements attendus :

- **Franchir** — fond espresso · hero `Reprendre` + `Encore N leçons avant votre examen blanc B1.` · outils simulateur/quiz/examen blanc/historique
- **Grandir** — fond espresso · hero `À votre rythme, ce soir.` · outils simulateur/écrit/procédure/veillée
- **Transmettre** — fond **terre** forcé (même si langue = deutsch) · hero `Ce soir · Le conte — {titre}.` · outils contes/chansons/jeux/nos mots
- **Moi** — fond espresso · hero `Une porte parmi d'autres — à votre main.` · outils simulateur/quiz/veillée/historique

## Basculer entre langues (world ↔ sources)

Trois options :

1. **Via l'UI** — sur `/dashboard`, la bande "L'autre voix" propose de
   passer au Bassa (ou Deutsch selon la langue active). Clic →
   `POST /api/language/switch` + couture 240ms sur le fond.
2. **Via le helper** —

   ```bash
   node scripts/set-cap.mjs jacob@yema.test transmettre --lang bassa
   node scripts/set-cap.mjs jacob@yema.test franchir  --lang deutsch
   ```

3. **Direct fetch** dans la console browser (Jacob connecté) —

   ```js
   await fetch("/api/language/switch", {
     method: "POST",
     headers: { "content-type": "application/json" },
     body: JSON.stringify({ languageId: "bassa" }),
   });
   window.location.reload();
   ```

## Matrice de test recommandée

Ces huit combinaisons couvrent toutes les branches visuelles du foyer :

| Cap | Langue | Fond attendu | Échelle |
|---|---|---|---|
| Franchir | deutsch | espresso | CefrSpine (A1→C1) |
| Franchir | bassa | terre | YemaSpine (É1→É5) |
| Grandir | deutsch | espresso | CefrSpine |
| Grandir | bassa | terre | YemaSpine |
| Transmettre | deutsch | **terre** (cap force) | CefrSpine |
| Transmettre | bassa | terre | YemaSpine |
| Moi | deutsch | espresso | CefrSpine |
| Moi | bassa | terre | YemaSpine |

## Vérifier la braise vivante

- **Aujourd'hui inclus dans les 12 jours** → braise `on`, respiration
  7s active (visible sur `.braise-dot`). Coupée par
  `prefers-reduced-motion`.
- **Rejeu au J+1** (relancer le seed le lendemain matin sans terminer
  de module) → braise `off`, statique ternie. Un `StateBlock` doux
  apparaît une seule fois (session storage `yema.braise.assoupie.seen`).
- **Jours = 0** (compte neuf jamais utilisé) → braise `new`,
  éteinte, invitation neutre.

## Nettoyer

```bash
node scripts/seed-jacob.mjs --reset
# supprime Prisma User (cascade) + Supabase auth user. La classe reste,
# la prof reste. Utile pour repartir d'un compte vierge.
```

Pour effacer aussi Marie et la classe :

```sql
delete from classroom_enrollments where classroom_id in
  (select id from classrooms where code = 'DE-B1-SOIR-2026');
delete from classrooms where code = 'DE-B1-SOIR-2026';
delete from teachers where user_id in
  (select id from users where email = 'marie.k@yema.test');
delete from users where email in ('jacob@yema.test','marie.k@yema.test');
```

Puis supprimer les deux users Supabase auth manuellement (ou via
`admin.auth.admin.deleteUser`).

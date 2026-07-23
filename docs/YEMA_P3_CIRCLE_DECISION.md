# YEMA · Décision structurelle · Cercle Racines

> **Annexe technique du lot P3** (docs/YEMA_P3_ROOTS_FAMILY.md §11). Ne produit **aucune migration** — décision documentée pour être appliquée quand P4 branche la messagerie et l'accompagnement humain Racines.

## Contexte

Le funnel Racines et le dashboard Racines sont livrés en P3. Reste à décider comment modéliser le **cercle Racines** : l'unité de vie sociale privée d'un foyer (parent + enfants + éventuellement coach), analogue mais distincte d'une classe Monde.

Deux options structurelles :

- **Option A** · nouvelle entité `Circle` (avec ses propres relations)
- **Option B** · extension de `Class` avec un discriminant `ClassType` incluant une valeur `RACINES_CIRCLE`

Cette décision doit être prise **avant** la migration Prisma de la messagerie Racines pour éviter un lourd refactor P4.

## Critères d'évaluation

1. **Sémantique produit** · un cercle Racines et une classe Monde sont-ils la même chose ?
2. **Sécurité mineurs** · comment prévenir qu'un enfant Racines soit exposé au flux d'une classe publique Monde ?
3. **Permissions** · les permissions parent · enfant · coach correspondent-elles 1:1 aux permissions teacher · student ?
4. **Compatibilité v1/v2** · risque de casser les tests, l'admin, les invitations, la messagerie ?
5. **Migration** · quelle taille et quel risque ?
6. **Évolutivité** · quelle option supporte le mieux la messagerie P4 puis les rituels foyer P5/P6 ?

---

## Option A · nouvelle entité `Circle`

Ajouter des tables dédiées Racines :

```prisma
model Circle {
  id            String   @id @default(cuid())
  householdId   String   @unique
  household     Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  language      LanguageCode
  status        CircleStatus  @default(ACTIVE)
  coachUserId   String?
  coach         User?         @relation(fields: [coachUserId], references: [id], onDelete: SetNull)
  createdAt     DateTime      @default(now())
  memberships   CircleMembership[]
  messages      CircleMessage[]
}

model CircleMembership {
  id         String  @id @default(cuid())
  circleId   String
  userId     String?                  // adulte (parent / coach)
  childProfileId String?              // enfant (via son profil)
  role       CircleRole               // PARENT | CHILD | COACH
  joinedAt   DateTime @default(now())
  @@unique([circleId, userId, childProfileId])
}
```

### Avantages

- **Sémantique claire** · un `Circle` n'a jamais de code d'invitation public, jamais de « rejoindre » par un tiers. La sécurité mineurs est portée par la structure du modèle
- **Permissions distinctes** · rôles PARENT · CHILD · COACH sans confusion avec TEACHER · STUDENT
- **Adaptabilité** · les tables `CircleMessage`, `CircleRitual`, `CircleFeedback` peuvent évoluer indépendamment des besoins Monde
- **Analytique cléane** · aucune requête ne mélange audience privée (foyer) et publique (classe)
- **Test cases** · le compilateur TS refuse d'utiliser un `Circle` là où une `Class` est attendue, réduisant la surface de bugs

### Coût

- Nouvelle migration additive (2-3 tables + 2 enums)
- Duplication apparente avec `Class` sur les messages (mais les semantiques divergent en P4-P5)
- Deux endpoints messagerie séparés (`/api/circles/[id]/messages` vs `/api/classes/[id]/messages`)

---

## Option B · extension de `Class` avec `RACINES_CIRCLE`

Ajouter un `ClassType` enum :

```prisma
enum ClassType {
  MONDE_CLASS
  RACINES_CIRCLE
}

model Class {
  // existant + type
  type ClassType @default(MONDE_CLASS)
  // ...
}
```

Les cercles Racines partagent tables + endpoints avec les classes Monde, seul le discriminant change.

### Avantages

- Aucune duplication apparente
- Une seule migration additive (ajout enum + colonne)
- Réutilisation de la messagerie existante (si elle existe déjà)
- Moins de code à maintenir en apparence

### Coût

- **Sécurité mineurs fragile** · chaque endpoint doit vérifier `type === RACINES_CIRCLE` avant d'appliquer les règles enfants. Un oubli expose un enfant Racines au flux public d'une classe Monde. La vérification devient une préoccupation runtime, pas structurelle.
- **Permissions confuses** · les rôles TEACHER / STUDENT ne suffisent pas · il faut ajouter PARENT / CHILD / COACH · résultat : un enum unifié `ClassRole = TEACHER | STUDENT | PARENT | CHILD | COACH` peu lisible et facile à mal utiliser
- **Messagerie ambivalente** · une classe Monde peut avoir un « code d'invitation » public. Un cercle Racines ne DOIT pas. Cette contrainte devient un check runtime dans plusieurs endpoints
- **Analytique polluée** · toute requête « classes actives » doit filtrer par type · risque de fuites de données Racines dans un reporting Monde
- **Debug plus dur** · un ticket « bug messagerie classe » exige de trancher entre les deux types avant investigation

---

## Recommandation

**Option A · nouvelle entité `Circle`.**

Justifications principales :

1. **La sécurité mineurs est portée par la structure**, pas par le comportement runtime. Un cercle ne peut pas accidentellement devenir une classe publique parce que le compilateur TypeScript refuse.
2. **Les permissions distinctes** (PARENT, CHILD, COACH) sont modélisées proprement au lieu d'être un enum unifié artificiel.
3. **Coût comparable** · une migration additive avec 2-3 tables reste petite. Le « coût de duplication » de messagerie est illusoire · les deux flux divergeront dès la P4-6 (correction vocale Racines, invitations « Fais entendre ta voix » du cercle, absence de code d'invitation public).
4. **Évolutivité P5-P6** · le foyer Racines aura probablement des rituels de transmission (« La leçon du grand-père », rituels de semaine), sans équivalent Monde. Une entité dédiée absorbe ces enrichissements sans polluer `Class`.

## Décision · à appliquer en P4 (ou lot dédié P3.5 si le paiement démarre avant P4)

**A · Créer `Circle` + `CircleMembership` + `CircleMessage` en migration additive.** Aucun changement de `Class` ni de `Classroom`.

## Non-décisions (à trancher plus tard)

- Combien d'enfants max par `Circle` (probablement 4, aligné avec l'offre Famille §12) — à confirmer avec la doctrine commerciale P5
- Un cercle peut-il avoir plusieurs coachs simultanément ? — probablement non, mais à confirmer avec l'équipe pédagogique
- Un `Circle` peut-il changer de langue ? — probablement non, chaque `Household` a un `Circle` par langue s'il y en a plusieurs
- Le coach a-t-il un dashboard partagé pour ses cercles ? — probablement oui, à cadrer avec P4-6 (console coach)

## Règles de capacité RECOMMANDÉES (P3 hardening §17)

À enforcer côté modèle en P4 (contraintes DB) et côté API dès la création du foyer :

| Ressource                         | Plafond  | Enforcement actuel                                | À faire en P4                              |
|-----------------------------------|----------|---------------------------------------------------|--------------------------------------------|
| Enfants par foyer / cercle        | **4**    | ✅ `src/app/api/family/children/route.ts` (409 `max_children_reached`) | Ajouter contrainte DB `CircleMembership` `role=CHILD` COUNT ≤ 4 |
| Adultes par foyer / cercle        | **2**    | ⚠️ `HouseholdMembership` existe mais pas de garde-fou runtime | Ajouter garde API dès la création du 3ᵉ adulte |
| Coachs actifs par cercle          | **1**    | ⚠️ Pas encore de coach en P3 (rôle absent) | Contrainte `Circle.coachUserId` unique + garde API |
| Langues actives par enfant        | **4**    | ✅ `src/app/api/family/children/route.ts` (400 `too_many_langues`) | Rester runtime, pas besoin de DB |
| Cercles actifs par foyer          | **1 par langue** | ⚠️ Non implémenté (pas de messagerie P3) | Contrainte `(Household, language)` unique sur `Circle` |

### Justification des plafonds

- **4 enfants** · aligné avec le pricing offre Famille P5 (déjà annoncé) et avec la taille moyenne d'un foyer camerounais/afrodescendant (source : recensements 2020s, moyenne 3-5 enfants). Au-delà, on quitte le cas d'usage « foyer » pour tomber dans « institution » — domaine d'un lot Centre (P8).
- **2 adultes** · un foyer YEMA correspond aux deux personnes principales responsables des enfants. Une communauté élargie (grands-parents, oncles) reste possible via des **invités lecteurs**, pas via des membres administrateurs. Cela protège la surface d'attaque : plus il y a d'adultes admins, plus le risque de compromission d'un compte enfant augmente.
- **1 coach** · un cercle a une voix pédagogique unique pour cohérence. Un changement de coach nécessite un handoff explicite (à cadrer P4) plutôt qu'une co-animation.
- **4 langues par enfant** · limite douce de lisibilité UI. Un enfant qui apprend > 4 langues simultanément a besoin d'un accompagnement individualisé qui sort du produit self-serve.
- **1 cercle par (foyer, langue)** · un foyer bilingue kikongo + swahili peut avoir 2 cercles distincts (correction vocale par langue), mais pas 2 cercles kikongo — cela créerait des flux dupliqués et une confusion pédagogique.

### État d'implémentation P3

Les gardes runtime **4 enfants** et **4 langues** sont actives et testées (voir `scripts/test-baseline/p3-hardening-e2e.mjs` §4). Les gardes **2 adultes**, **1 coach**, **1 cercle par langue** sont **NOT_IMPLEMENTED** en P3 (marqué honnêtement dans le code et les tests) car les modèles correspondants (`HouseholdMembership` adultes, `Circle`) ne sont pas encore instanciés dans le parcours utilisateur. Ils seront ajoutés en P4 avec les contraintes DB associées.

## Impact sur les autres lots

- **P4-6** (messagerie coach/prof) · construire `CircleMessage` + endpoints dédiés au lieu de réutiliser les endpoints Classe
- **P4-7** (amendement Prisma messagerie) · ajouter `CircleMessageReaction`, `CircleMessageReadState` en parallèle de leurs équivalents Classe
- **P5** (paiement) · l'AccessGrant PROMO/PAID pour l'offre Famille rattache un Circle au `Household` payant

Décision datée : **2026-07-23** · à re-valider dans P4 avant la migration effective.

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

## Impact sur les autres lots

- **P4-6** (messagerie coach/prof) · construire `CircleMessage` + endpoints dédiés au lieu de réutiliser les endpoints Classe
- **P4-7** (amendement Prisma messagerie) · ajouter `CircleMessageReaction`, `CircleMessageReadState` en parallèle de leurs équivalents Classe
- **P5** (paiement) · l'AccessGrant PROMO/PAID pour l'offre Famille rattache un Circle au `Household` payant

Décision datée : **2026-07-23** · à re-valider dans P4 avant la migration effective.

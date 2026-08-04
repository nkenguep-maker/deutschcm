# Routage des pages personas

Les neuf espaces personas utilisent désormais une page distincte par rubrique afin d’éviter de charger tout le contenu dans un seul écran et de permettre l’intégration progressive des cours et des données réelles.

## Convention d’URL

La route racine de chaque espace affiche sa première rubrique : Accueil, Maison, Case, Centre ou Console selon le persona.

Les autres rubriques utilisent la convention suivante :

```text
/{locale}/{espace}/view/{rubrique}
```

Exemples :

```text
/fr/dashboard/view/mon-cours
/fr/dashboard/view/missions
/fr/teacher/view/corrections
/fr/coach/racines/view/seances
/fr/center/view/facturation
/fr/admin/view/audit
/fr/family/view/progression
```

## Espaces couverts

- Élève Monde
- Élève Racines
- Enfant Monde
- Enfant Racines
- Enseignant
- Coach Racines
- Administrateur de centre
- Super administrateur
- Famille

## Navigation

Sur ordinateur, chaque élément du menu latéral ouvre sa page dédiée. Sur mobile, toutes les rubriques restent disponibles dans une navigation horizontale, tandis que la barre inférieure conserve les entrées principales du persona.

## Intégration des contenus

Chaque page conserve un identifiant de rubrique stable. Les cours, activités, devoirs, messages, séances, paiements et données de progression pourront donc remplacer progressivement les fixtures internes sans modifier les URLs ni la structure de navigation.

Les routes de prévisualisation QA restent désactivées en Production.
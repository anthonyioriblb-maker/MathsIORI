# Guide d'utilisation : Disposition en 2 colonnes

## Description
Les nouvelles classes CSS permettent de créer des dispositions en 2 colonnes pour mieux utiliser l'espace horizontal de l'écran en mode paysage.

---

## Classes disponibles

### 1. `.two-columns` - Deux colonnes égales
Crée deux colonnes de largeur égale (50% / 50%)

### 2. `.two-columns-left` - Colonne gauche plus large
La colonne gauche prend 60% et la droite 40%

### 3. `.two-columns-right` - Colonne droite plus large
La colonne gauche prend 40% et la droite 60%

---

## Comment utiliser

### Exemple basique avec 2 colonnes égales :

```html
<div class="two-columns">
    <div class="column">
        <div class="definition">
            <strong>Définition :</strong><br>
            Le contenu de gauche...
        </div>
    </div>

    <div class="column">
        <div class="example">
            <strong>Exemple :</strong><br>
            Le contenu de droite...
        </div>
    </div>
</div>
```

### Exemple avec plusieurs éléments dans chaque colonne :

```html
<div class="two-columns">
    <div class="column">
        <div class="definition">
            <strong>Définition 1 :</strong><br>
            Première définition...
        </div>
        <div class="definition">
            <strong>Définition 2 :</strong><br>
            Deuxième définition...
        </div>
    </div>

    <div class="column">
        <div class="example">
            <strong>Exemple 1 :</strong><br>
            Premier exemple...
        </div>
        <div class="example">
            <strong>Exemple 2 :</strong><br>
            Deuxième exemple...
        </div>
    </div>
</div>
```

### Exemple avec colonne gauche plus large :

```html
<div class="two-columns-left">
    <div class="column">
        <div class="method">
            <strong>Méthode détaillée :</strong><br>
            Cette colonne est plus large pour contenir plus d'informations...
        </div>
    </div>

    <div class="column">
        <div class="remarque">
            <strong>Remarque :</strong><br>
            Points importants...
        </div>
    </div>
</div>
```

### Exemple avec image et texte :

```html
<div class="two-columns">
    <div class="column">
        <img src="image.png" alt="Schéma">
    </div>

    <div class="column">
        <div class="important">
            <strong>À retenir :</strong><br>
            Explication du schéma...
        </div>
    </div>
</div>
```

---

## Avantages

✅ **Meilleure utilisation de l'espace horizontal** en mode paysage
✅ **Comparaison facile** : définition à gauche, exemple à droite
✅ **Plus de contenu visible** sur un même slide
✅ **Responsive** : repasse automatiquement en 1 colonne sur petits écrans
✅ **Compatible** avec toutes les classes existantes (definition, example, important, etc.)

---

## Quand utiliser les 2 colonnes ?

### Situations idéales :
- Comparer deux méthodes ou approches
- Montrer une définition avec un exemple côte à côte
- Afficher un schéma avec son explication
- Présenter des propriétés mathématiques et leurs applications
- Lister des avantages / inconvénients

### À éviter :
- Trop de texte dans chaque colonne (difficile à lire)
- Plus de 2-3 blocs par colonne
- Contenu qui nécessite une lecture séquentielle

---

## Espacement

Les colonnes ont un espacement de 25px entre elles pour une bonne séparation visuelle.
Les éléments à l'intérieur des colonnes ont un espacement de 12px entre eux.

---

## Note technique

Le système utilise CSS Grid, ce qui permet une disposition flexible et responsive.
Sur les écrans de moins de 1000px de large, les colonnes repassent automatiquement en disposition verticale (1 colonne).

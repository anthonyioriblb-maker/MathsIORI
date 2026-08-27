# Audit — Cours de 4e vs programme officiel (cycle 4, ajustements 2019)

**Important — calendrier de la réforme :** le nouveau programme cycle 4 (BO n°10 du 5 mars 2026) entre en application de façon progressive : 5e à la rentrée 2026-2027, **4e à la rentrée 2027-2028**, 3e à la rentrée 2028-2029. Cette année (2026-2027), la 4e est donc encore régie par l'**ancien programme** : programme cycle 4 initial (BO spécial n°11 du 26 novembre 2015) tel qu'ajusté et définitivement fixé par la **note de service n°2019-072 du 28 mai 2019 (BO n°22 du 29 mai 2019)**, en vigueur depuis la rentrée 2019-2020 — c'est ce texte qui sert de référence ci-dessous, pas le nouveau BO 2026 utilisé pour l'audit de 5e. Les 3 chapitres déjà préparés dans `nouveau-programme/` (Développement et factorisation, Fonctions affines, Racine carrée) anticipent la réforme 2027 et ne sont pas comptés dans cet audit puisqu'ils ne concernent pas cette année scolaire.

Source : [Attendus de fin d'année — 4e (éduscol)](https://eduscol.education.gouv.fr/sites/default/files/document/16-maths-4e-attendus-eduscol1114746pdf-74682.pdf), [Programme cycle 4 initial (BO spécial n°11, 2015)](https://pedagogie.ac-strasbourg.fr/fileadmin/pedagogie/mathematiques/College/Programmes_Documents_officiels/Maths_cycle4_BO_SPE_11_26-11-2015.pdf), [Note de service n°2019-072 du 28-5-2019 (BO n°22 du 29-5-2019)](https://www.education.gouv.fr/bo/19/Hebdo22/MENE1913283N.htm).

Comparaison de tes 15 chapitres actuels (ordre de `classe-4e.html`, contenu retrouvé dans `Archives/MathsIORI/4e/` + `Chapitre10- Puissances/` en ligne) aux attendus de fin de 4e.

## Ce qui est déjà bien couvert

- **Les nombres relatifs** (ch.1) : addition, soustraction, multiplication, division, priorités opératoires, coordonnées d'un point — conforme pour « calcule avec les nombres rationnels ».
- **Puissances** (ch.10) : puissance positive/négative (définition, calculatrice, signe, cas particuliers), puissances de 10, notation scientifique, préfixes des unités — très complet, conforme à « utilise les puissances de 10 d'exposants positifs ou négatifs » et au lien décimal/scientifique.
- **Pythagore 1 et 2** (ch.2, ch.4) : théorème, carré et racine carrée, calcul de longueur, réciproque, contraposée — conforme et complet.
- **Cosinus d'un angle aigu** (ch.8) : vocabulaire, définition, calculatrice, exemples — conforme.
- **Théorème de Thalès** (ch.14) : cas d'égalité des triangles, théorème, réciproque — bonne base pour « utilise un rapport d'agrandissement/réduction ».
- **Arithmétique** (ch.13) : divisibilité, nombres premiers, décomposition en facteurs premiers, PGCD, PPCM — conforme et complet.
- **Équations** (ch.12) : qu'est-ce qu'une équation, vérifier une solution, résoudre, mettre un problème en équation — conforme à « résout algébriquement une équation du premier degré ».
- **Géométrie dans l'espace** (ch.7) : pyramide, cône, volumes — conforme à « calcule le volume d'une pyramide, d'un cône ».
- **Probabilités** (dans ch.6) : vocabulaire, lien probabilité/fréquence — conforme.

## Manques à l'intérieur de chapitres existants

- **Nombres relatifs (ch.1)** : pas de section dédiée à « comparer, ranger, encadrer des nombres rationnels » — le chapitre traite les 4 opérations mais pas explicitement la comparaison/l'encadrement.
- **Calcul littéral (ch.15)** : couvre la distributivité simple, la double distributivité et le carré d'une somme, mais **aucune section « factoriser »** — l'attendu « factorise une somme » (mise en évidence d'un facteur commun) n'apparaît pas dans les titres.
- **Statistiques et probabilités (ch.6)** : le vocabulaire et les probabilités sont là, mais ni **diagramme circulaire** ni **médiane d'une série** n'apparaissent dans les titres, alors que ce sont deux attendus explicites de 4e.
- **Proportionnalité (ch.11)** : couvre reconnaître/compléter un tableau/applications, mais pas explicitement « reconnaître sur un graphique une situation de proportionnalité ou de non-proportionnalité ».
- **Géométrie dans l'espace (ch.7)** : pas de section sur le **repérage dans un pavé droit** (vocabulaire abscisse/ordonnée/altitude), qui est un attendu explicite de 4e.

## Domaines/notions entièrement absents cette année

1. **Notion de fonction (dépendance entre deux grandeurs)** : l'attendu « produit une formule littérale représentant la dépendance de deux grandeurs » et « représente la dépendance de deux grandeurs par un graphique » n'a pas de chapitre dédié en 4e cette année (le chapitre Fonctions affines, dans `nouveau-programme/`, est prévu pour la réforme 2027, pas pour cette année). C'est une notion légère à ce niveau (souvent introduite en fin de proportionnalité), à vérifier si elle est traitée en classe sans support écrit dédié.
2. **Algorithmique et programmation** : aucun chapitre dédié pour la 4e (contrairement à la 6e qui a « Pensée informatique »). C'est un domaine à part entière du programme (3 niveaux progressifs : blocs simples → variables/événements → blocs personnalisés/boucles imbriquées), totalement absent de la liste actuelle.

## Résumé — priorités suggérées

1. Ajouter une section « factoriser » dans Calcul littéral (ch.15) — retouche rapide.
2. Compléter Statistiques (ch.6) avec diagramme circulaire et médiane.
3. Ajouter un point « repérage dans l'espace » dans Géométrie dans l'espace (ch.7).
4. Vérifier/formaliser la notion de fonction (dépendance de deux grandeurs, représentation graphique) — potentiellement à ajouter en fin de Proportionnalité (ch.11).
5. Créer un chapitre Algorithmique/programmation pour la 4e, comme en 6e — c'est le manque le plus structurel.

Sources : [Attendus 4e — éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/16-maths-4e-attendus-eduscol1114746pdf-74682.pdf), [Programme cycle 4 — BO spécial n°11 du 26/11/2015](https://pedagogie.ac-strasbourg.fr/fileadmin/pedagogie/mathematiques/College/Programmes_Documents_officiels/Maths_cycle4_BO_SPE_11_26-11-2015.pdf), [calendrier d'application du nouveau programme cycle 4](https://sites.ac-corse.fr/maths/2026/03/05/nouveau-programme-pour-le-cycle-4/).

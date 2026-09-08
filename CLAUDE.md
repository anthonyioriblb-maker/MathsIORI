# Instructions consolidées — MathsIORI & COURSPRESENTATION

> **Fichier maître.** Ce fichier existe à l'identique à trois endroits pour être sûr d'être lu quel que soit le dossier de travail :
> - `C:\Users\antho\Documents\GitHub\CLAUDE.md` (racine)
> - `C:\Users\antho\Documents\GitHub\MathsIORI\CLAUDE.md`
> - `C:\Users\antho\Documents\GitHub\COURSPRESENTATION\CLAUDE.md`
>
> **En cas de modification** (nouvelle règle, erreur corrigée) : mettre à jour les **trois copies**, pas une seule.

---

## Vue d'ensemble des deux projets

- **MathsIORI** = les cours (`cours.html` par chapitre, par niveau `3°/4°/5°/6°`). C'est la **source**.
- **COURSPRESENTATION** = les mêmes cours reproduits en diaporama interactif (slides, étapes au clic). C'est une **copie fidèle**, jamais une réécriture.

### Source de référence académique (créé sept. 2026)
Site officiel de l'académie de Reims pour les mathématiques : **https://mathematiquesreims.fr/** (édité par l'IA-IPR de maths). Sections utiles : « Enseigner » (programmes officiels, ressources par niveau — école/collège/lycée), orientations sur l'évaluation et les automatismes.
→ À consulter, en complément du programme officiel BOEN (déjà cité dans `3°/audit_programme_3e.md`, `4°/audit_programme_4e.md`, `5°/audit_programme_5e.md`), pour vérifier que les cours, progressions, automatismes et autres contenus produits restent cohérents avec les attentes académiques de Reims — pas seulement avec le texte national brut.

**Documents déjà repérés et archivés (sept. 2026)** dans `MathsIORI/références_reims/` (pas besoin de re-parcourir le site pour ceux-ci) :
- `DNB_2026_liste_indicative_automatismes.pdf` — liste indicative d'automatismes DNB (toutes séries) : nombres et calculs, espace et géométrie, organisation/gestion de données et probabilités, proportionnalité/fonctions, algorithmique. Référence de contenu pour les automatismes 4e/3e — déjà globalement cohérente avec `automatismes/3e/` (créé sept. 2026).
- `Progression_6e_academie_reims_rentree2025.pdf` — proposition académique de progression 6e (19 séquences avec durées en semaines), incluant une liste officielle d'« automatismes pouvant être travaillés dès la rentrée de septembre » (réactivation des acquis du CM2). Confirme le principe « début d'année = révision du niveau précédent » déjà appliqué pour les automatismes 5e/3e créés sept. 2026.
  → Cette proposition Reims (19 séquences fines) est un recoupement pédagogique complémentaire ; elle ne remplace pas et n'a pas vocation à réordonner `progression_6eme_2026-2027.pdf` (progression perso en 17 chapitres, programme BO avril 2025, déjà dans MathsIORI) — les deux découpages sont juste différents, pas contradictoires.

### Règle n°0 — Déclencheur automatique
Dès qu'un `cours.html` dans MathsIORI est **terminé ou modifié** (contenu, image remplacée par une animation, correction quelconque), la présentation `COURSPRESENTATION` correspondante doit être créée ou mise à jour pour refléter exactement ce changement. **Ne pas attendre qu'on le demande.**

Même principe pour la fiche « images à coller » (voir section « MathsIORI — spécifique aux cours » ci-dessous) : dès qu'un `cours.html` avec des images statiques est terminé ou modifié, le PDF correspondant dans `a distribuer/` doit être créé ou mis à jour. **Ne pas attendre qu'on le demande.**

## Automatismes — règles spécifiques

Les fiches d'automatismes (`automatismes/<niveau>/data/N*.html`, plus leur copie intégrée dans `automatismes/<niveau>-automatisme.html` — les **deux fichiers doivent toujours être mis à jour ensemble**, le second n'est pas régénéré automatiquement à partir du premier) suivent ces règles :

**1. Toujours écrire les fractions en vraies fractions**
→ Jamais en écriture inline type `18/24`. Utiliser le patron déjà en place (`automatismes/5e/data/N01.html`) :
```html
<span class="frac"><span class="num">18</span><span class="fracbar">/</span><span class="den">24</span></span>
```
```css
.frac, .fraction { display: inline-block; margin-left: .1em; margin-right: .1em; vertical-align: middle; text-align: center; }
.frac > .num, .frac > .numerateur { display: block; padding: 0 .1em; border-bottom: 1px solid black; padding-bottom: 2px; }
.frac > .den, .frac > .denominateur { display: block; padding: 0 .1em; padding-top: 2px; }
.frac > .fracbar { display: block; height: 0; margin: 0; border: 0; border-bottom: .1em solid; overflow: hidden; }
```
→ Cette CSS doit être présente à **trois endroits** si elle n'y est pas déjà : le `<style>` du fichier `data/N*.html`, le `<style>` du fichier `<niveau>-automatisme.html`, et la variable JS `var css = "..."` de ce même fichier (utilisée pour l'impression/export) — sinon la fraction s'affiche correctement à l'écran mais pas à l'impression (ou inversement).

**2. Vérifier systématiquement que chaque notion utilisée a déjà été vue**
→ Avant d'inclure un exercice, vérifier qu'il ne fait appel qu'à des notions déjà traitées en classe à ce moment de l'année scolaire — jamais une notion du chapitre en cours (sauf si l'exercice révise volontairement ce qui a déjà été fait dans ce chapitre) ou d'un chapitre à venir. Se référer à la progression du niveau (`progression_<niveau>eme_2026-2027.pdf/docx`) et à l'ordre des chapitres du dossier `<niveau>°/` pour savoir ce qui est déjà acquis.
→ Rappel du principe déjà appliqué pour les automatismes 5e/6e/3e créés sept. 2026 : **début d'année = révision du niveau précédent**, jamais d'anticipation sur une notion du programme de l'année en cours qui n'a pas encore été enseignée.
→ Exception accordée par l'enseignant (sept. 2026) : en 4e, les statistiques et probabilités simples (moyenne, probabilité d'un événement équiprobable — dé, pièce, sac de boules) sont autorisées en révision même si les chapitres 5e correspondants (`5°/chapitre07 - Statistiques`, `5°/chapitre17 - Probabilites`) n'ont pas de `cours.html` rédigé — privilégier les probabilités aux statistiques pour ce niveau, sur demande expresse de l'enseignant. Cette exception est spécifique à la 4e ; pour les autres niveaux, continuer à exiger un chapitre rédigé (`cours.html` non vide) avant d'utiliser une notion en révision.
→ Erreur commise (sept. 2026, automatisme 4e N2) : une question sur l'hypoténuse (théorème de Pythagore, chapitre 2 non traité à ce stade de l'année), un calcul `3&sup2; + 2&sup3;` (puissances, chapitre 10, très loin dans l'année) et une fraction écrite en `18/24` au lieu d'une vraie fraction. Corrigé en remplaçant Pythagore par un calcul d'aire du même triangle (formule déjà connue) et les puissances par un calcul avec priorités opératoires.

---

## Règles communes aux deux projets (animations, notation)

**1. Point en mathématiques**
→ Toujours une croix `×` (deux `<line>` en diagonale), jamais un cercle.
→ Référence : `MathsIORI/6°/chapitre03 - Bases de geometrie/animations/animation-angles-droites-secantes.html`

**2. Notation d'un angle**
→ Utiliser la classe `.angle` déjà définie dans `styles.css` (chapeau `^` étiré via `::before`), jamais le symbole `∠` ni un dessin fait main.
→ Couleurs reprises à l'identique du cours (`red`, `blue`, `black`, `green`...), jamais de teinte inventée.

**3. Iframe d'animation collée à gauche avec espace vide à droite** (bug rencontré juillet 2026)
→ Un `<iframe>` sans `display:block; margin:auto` reste aligné à gauche même dans un conteneur large → grand espace vide à droite, animation qui semble minuscule.
→ Toujours centrer comme les images (`display:block; margin:0 auto` ou `margin:16px auto 0`) et choisir une `width` qui remplit réellement l'espace disponible (pas une valeur arbitrairement petite comme 480px si le conteneur fait plus de 1000px). Adapter en conséquence le `max-width` du `.wrap` interne.
→ Toujours ajouter `scrolling="no"` et calculer une `height` généreuse (padding du wrap + hauteur SVG + boîte de nom + boutons + texte + padding body) pour éviter tout ascenseur. Mieux vaut prévoir large que trop juste.

**4. `.step-box` avec `display: flex` → espaces avalés autour des `<strong>`**
→ Toujours garder `display: block` sur `.step-box` (centrage vertical via `min-height` + `line-height`, jamais `flex`). Avec `flex`, les nœuds de texte ne contenant qu'un espace deviennent des items flex vides et disparaissent dans certains navigateurs.
→ Audit complet effectué le 19/07/2026 sur les 24 fichiers `.step-box` du projet (MathsIORI + COURSPRESENTATION) : tous conformes.

**5. Boutons obligatoires des animations pas-à-pas** (juillet 2026)
→ Toute animation `animation-*.html` doit avoir **4 boutons**, dans cet ordre, avec ces couleurs exactes :
```html
<button class="btn-anim" id="btnPrec" onclick="prevStep()" disabled>◀ Étape précédente</button>
<button class="btn-anim" onclick="nextStep()">Étape suivante ▶</button>
<button class="btn-auto" id="btnAuto" onclick="toggleAuto()">⏵ Automatique</button>
<button class="btn-reset" onclick="resetAnimation()">Recommencer ↺</button>
```
```css
.btn-reset { background: #e74c3c; color: white; }
.btn-reset:hover { background: #c0392b; }
.btn-auto  { background: #4caf50; color: white; }
.btn-auto:hover { background: #388e3c; }
```
→ **Recommencer = rouge** (`#e74c3c`), **Automatique = vert** (`#4caf50`), qui passe en orange (`#ff9800`) + texte `⏸ Pause` pendant la lecture automatique (`toggleAuto()`/`stopAuto()`).
→ `nextStep()` garde le comportement animé d'origine (CSS keyframes, `setTimeout` en cascade) — ne jamais le modifier pour l'avance normale.
→ `prevStep()` ne peut pas "rejouer à l'envers" une animation faite de classes CSS/`setTimeout` chaînés (ordre non déterministe). Utiliser une fonction `renderStep(n)` qui recalcule **instantanément** (sans classes d'animation ni délais) l'état visuel final de l'étape `n`, en repartant de zéro (tout cacher, puis ne montrer que ce qui doit l'être à `n`). `toggleAuto()` relance simplement `nextStep()`/`advanceStep()` à intervalle régulier.
→ Piège : un élément dont la visibilité ne dépend **que** d'une classe d'animation CSS (ex. `#sweepLine72.sweep-active { animation: ... forwards; }`, sans règle `#sweepLine72 { opacity: 0; }` par défaut) réapparaît à son état de repos si on retire juste la classe dans `renderStep()` — il faut le masquer explicitement (`el.style.opacity = '0'`).
→ Exemples de référence complets : `MathsIORI/6°/chapitre07 - Les angles/animations/` (6 fichiers) et `MathsIORI/6°/chapitre08 - Fractions partie 1/animations/animation-placer-fraction-demi-droite.html`.

**6. Animations compas — règles absolues** (juin 2026, long à corriger)
→ Le compas ne se referme **jamais** pendant une animation. L'écartement, une fois pris, reste constant jusqu'au prochain "prise d'écartement" explicite.
→ Séquence correcte pour le symétrique avec compas seul (arcs en A puis en B) :
1. Pointe en A, **ouvrir** jusqu'à M (`compassOpen`) — montre la prise d'écartement AM
2. **Pivoter** autour de A à écartement constant (`compassPivot`) — jamais `compassMove` pour un pivot
3. Tracer l'arc en A (`compassSweep`)
4. **Transporter** de A→B en gardant la même direction (dxA, dyA = direction fin d'arc A) — écartement R_A constant
5. En B, **ajuster** la mine de sa direction vers M (`compassMove(B, penAtB, B, M)`) — montre la prise d'écartement BM
6. **Pivoter** autour de B à écartement constant R_B (`compassPivot`)
7. Tracer l'arc en B (`compassSweep`)

→ Pourquoi `compassMove` est interdit pour les pivots : interpole la position en ligne droite (corde < arc) → écartement diminue → compas semble se refermer. `compassPivot` interpole l'angle → écartement exactement constant.
```javascript
async function compassPivot(tip, radius, a1, a2, duration) {
    const N = 50;
    for (let i = 0; i <= N; i++) {
        const angle = a1 + (a2 - a1) * (i / N);
        setCompass(tip, { x: tip.x + radius * Math.cos(angle),
                          y: tip.y + radius * Math.sin(angle) });
        await sleep(duration / N);
    }
}
```
(Dupliquer avec le préfixe adapté : `eqCompassPivot`, `csCompassPivot`, etc.)

→ Séquence correcte équerre + compas :
1. Équerre le long de (d), glisse jusqu'à aligner avec M
2. Tracer la perpendiculaire (droite rouge pointillés **prolongée** au-delà de M et M')
3. **Ranger l'équerre EN PREMIER**, puis faire apparaître le codage de l'angle droit — jamais l'inverse
4. Compas : `compassOpen` de I vers M, `compassPivot`, `compassSweep`

---

## MathsIORI — spécifique aux cours

**Au début d'une session de travail sur un `cours.html`**
→ Archiver d'abord la version actuelle, avec la date **et l'heure** (pas de suffixe a/b/c) :
```
Archives/MathsIORI/<niveau>°/chapitre<N> - <Nom>/cours_<YYYY-MM-DD>_<HHhMM>.html
```
Exemple : `Archives/MathsIORI/6°/chapitre10 - Les angles/cours_2026-05-06_14h32.html`

→ **Une seule archive par session de travail**, pas une à chaque modification. Si on enchaîne plusieurs modifications d'affilée sur le même chapitre dans la même session, on archive uniquement au début (avant la toute première modification). On réarchive seulement quand une **nouvelle session de travail** démarre sur ce chapitre (reprise un autre jour, ou après une interruption nette du travail).

**Numérotation des titres h2/h3**
→ `MathsIORI/styles.css` ajoute **automatiquement** le préfixe via CSS counter : `h2::before` → `I.`, `II.`... et `h3::before` → `1)`, `2)`...
→ Conséquence : les `<h2>` et `<h3>` dans `cours.html` ne doivent **jamais** contenir le préfixe en dur.
  - ✅ `<h2>Construction du symétrique d'un point</h2>`
  - ❌ `<h2>II. Construction du symétrique d'un point</h2>` → affiche "II. II. Construction…"

**Fiche « images à coller » (PDF à imprimer, à découper et coller dans le cahier)** (créé sept. 2026)
→ Dès qu'un `cours.html` contenant des images statiques (`images/*.png`, schémas/tableaux trop complexes à redessiner à la main) est terminé ou modifié, générer/mettre à jour automatiquement le PDF correspondant — **ne pas attendre qu'on le demande** (même principe que la Règle n°0).
→ Script réutilisable : `MathsIORI/build_a_coller_pdf.py "<dossier du chapitre>"`. Il lit toutes les `<img src="images/...">` du `cours.html` dans leur ordre d'apparition et génère le PDF.
→ **Une seule page A4, sans titre.** Chaque image entourée d'une bordure pointillée (guide de découpe) avec une petite marge intérieure.
→ Taille par défaut par image : largeur max ~420pt, hauteur max ~130pt → les images presque carrées (ex. cubes de numération) sont donc automatiquement plus petites que les images larges (tableaux, demi-droites graduées), pour rester proportionnées entre elles.
→ Si tout ne tient pas sur une page à taille normale, réduction **uniforme** de toutes les images (jamais de passage à une 2ᵉ page).
→ Réglage manuel possible image par image (`img_overrides` dans le script) si le rendu automatique ne convient pas pour un chapitre précis — cas vécu : chapitre 1 (6ème), 2 premières images réduites à la main.
→ Nom de sortie : `Chapitre_<N>_<niveau>_images_a_coller.pdf`, dans `MathsIORI/<niveau>°/chapitre<N> - <Nom>/a distribuer/`.
→ Certains chapitres n'ont aucune image statique à coller (tout est en animations interactives, ex. chapitre07 - Les angles) : dans ce cas, rien à générer.

---

## COURSPRESENTATION — spécifique aux présentations

**Références absolues (modèles à toujours relire avant de produire/corriger une présentation)** :
- Chapitre 11 Proportionnalité 4ᵉ (`COURSPRESENTATION/4/Chapitre11_Proportionnalite/`)
  - Source : `MathsIORI/4°/chapitre11 - Proportionnalite/cours.html`
  - Cible : `Chapitre_11_proportionnalite_presentation.html` + `script-proportionnalite.js`
- Chapitres 1 à 4 — 6ᵉ (`COURSPRESENTATION/6/Chapitre1_Nombres_Entiers/`, `Chapitre2_Gestion_De_Donnees/`, `Chapitre3_Bases_Geometrie/`, `Chapitre4_Nombres_Decimaux/`) — vérifiés et corrigés le 2026-07-21, servent aussi de modèle.

### Règle n°1 — Aucune initiative
La présentation contient **exactement** le même contenu que le cours : mêmes phrases, définitions, valeurs, exemples, SVG, animations, couleurs.
- Pas de reformulation, simplification, ajout d'explications, remplacement de valeurs, modification d'images/SVG.
- Si doute → poser une question, ne **jamais** improviser.

### Règle n°2 — Découpage en slides
**Une slide par titre.** Chaque nouveau titre (`h2`, `h3`, `h4`) démarre une nouvelle slide, **sauf le premier sous-titre qui suit immédiatement son parent sans contenu intercalaire** (dans ce cas il partage la slide du parent).
> Si du contenu (intro, exemple, définition…) se glisse entre le `h2` et son premier `h3`, le `h2` reste seul sur sa slide avec ce contenu, et le `h3` démarre une nouvelle slide. Idem entre `h3` et premier `h4`.

Exemple concret (Chapitre 11) :
| Slide | Titres présents |
|---|---|
| 1 | `h1` Titre du chapitre |
| 2 | `h2` I. + `h3` 1) |
| 3 | `h3` 2) |
| 4 | `h3` 3) |
| 5 | `h2` II. + intro (sans son h3, intro entre les deux) |
| 6 | `h3` 1) |
| 7 | `h3` 2) |
| 8 | `h2` III. + `h3` 1) |
| 9-10 | `h3` 2), 3) |
| 11 | `h3` 4) + `h4` a) |
| 12 | `h4` b) |
| 13 | `h3` 5) |

Numérotation en dur dans le HTML de la présentation (contrairement à MathsIORI) :
- `h2` → `I.`, `II.`, `III.` (chiffres romains)
- `h3` → `1)`, `2)`, `3)` (réinitialisé à chaque `h2`)
- `h4` → `a)`, `b)`... (numérotation conservée du cours)

### Règle n°3 — Apparition étape par étape
Le contenu apparaît **phrase par phrase / bloc par bloc** à la flèche droite ou Espace.
> ⚠️ **OBLIGATION ABSOLUE** : chaque phrase dans son propre `<div class="step">`. Toujours. Sans exception. Ne jamais regrouper deux phrases dans un même step. C'est la règle la plus importante de toute la présentation.

- Chaque phrase / bloc logique distinct = `<div class="step">…</div>`
- **Calcul (calcul-detail)** : chaque ligne d'égalité = un step séparé (la première ligne = step externe qui déclenche la boîte, les suivantes = steps imbriqués).
- **Chaîne d'égalités inline** (ex. `a/b = a×k/b×k = c/d`) : première fraction dans le step parent, puis chaque terme après `=` dans un `<span class="step-inline">`.
- **Méthode** : intro = un step, puis chaque item de liste = un step séparé (`<ol start="N">` pour la numérotation).
- **Propriété** : intro = un step, chaque règle/puce = un step séparé.
- **Remarque** : deux phrases distinctes = deux steps.
- **Exercice** : énoncé = un step, chaque question/puce = un step séparé.
- **Règle absolue** : un `<br><br>` ou `<br>` entre deux phrases = signal de deux steps distincts.
- Pour faire apparaître un mot précis dans une phrase déjà visible (résultat numérique en vert) : `<span class="step-inline" style="color:green;"><strong>X</strong></span>`.

CSS minimal (en complément de `../../styles.css`) :
```css
.step-inline { opacity: 0; transition: opacity 0.5s; }
.step-inline.visible { opacity: 1; }
tr.step { display: table-row !important; opacity: 0; transition: opacity 0.5s; }
tr.step.visible { opacity: 1; }
.anim-fullbleed { display: block; width: 100%; }
```

### Règle n°4 — Animations interactives identiques
Tous les SVG, boutons, fonctions d'animation du cours sont **recopiés à l'identique** : mêmes IDs, coordonnées, couleurs, JS. Aucune simplification.
- Animations synchronisées aux steps (ex. pilules de coefficient) : steps invisibles déclencheurs `<div class="step pilule-trigger" data-pid="1" style="height:0;overflow:hidden;margin:0;padding:0;"></div>`, puis dans `updateSlide` compter les `.pilule-trigger.visible` et appeler `syncPiluleAnim(n)`.
- Animations indépendantes (graphique, produit en croix) gardent leurs boutons interactifs, fonctionnent comme dans le cours.
- Squelette de boutons obligatoire : voir section « Règles communes » n°5 ci-dessus — toute animation MathsIORI qui suit ce patron doit être copiée telle quelle ici.

### Règle n°5 — Architecture des fichiers
```
COURSPRESENTATION/
├── styles.css                          ← feuille commune
├── <niveau>/                           ← 3, 4, 5, 6
│   └── Chapitre<N>_<Nom>/
│       ├── Chapitre_<N>_<nom>_presentation.html
│       └── script-<nom>.js

Archives/COURSPRESENTATION/                  ← dossier séparé, au même niveau que MathsIORI/ et COURSPRESENTATION/
└── <niveau>/
    └── Chapitre<N>_<Nom>/
        ├── Chapitre_<N>_<nom>_presentation_<YYYY-MM-DD>_<HHhMM>.html
        └── script-<nom>_<YYYY-MM-DD>_<HHhMM>.js
```
Chemin CSS dans le HTML : `<link rel="stylesheet" href="../../styles.css">` (deux niveaux à remonter).

### Règle n°6 — Squelette HTML obligatoire
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Chapitre N - Nom</title>
    <link rel="stylesheet" href="../../styles.css">
    <style>
        /* CSS minimal de la règle 3 */
    </style>
</head>
<body>
    <div class="container">
        <div class="content">

            <div class="slide active">
                <h1>Chapitre N : Nom</h1>
            </div>

            <div class="slide">
                <h2>I. ...</h2>
                <h3>1) ...</h3>
                <div class="definition">
                    <div class="step">…</div>
                </div>
                <div class="example">
                    <div class="step">…</div>
                </div>
            </div>

            <!-- … autres slides … -->

        </div>

        <div class="controls">
            <div class="controls-left">
                <button id="prevBtn" onclick="changeSlide(-1)">← Précédent</button>
                <button class="btn-reset" onclick="resetSlide()">⟲</button>
            </div>
            <div class="progress">
                <span><span id="currentSlide">1</span> / <span id="totalSlides">N</span></span>
                <span class="step-indicator" id="stepIndicator"></span>
            </div>
            <div class="controls-right">
                <button class="btn-menu" onclick="openMenu()">📋 Menu</button>
                <button class="btn-menu" onclick="openHelp()">❓ Aide</button>
                <button id="nextBtn" onclick="changeSlide(1)">Suivant →</button>
            </div>
        </div>
    </div>

    <div class="slide-menu" id="slideMenu">
        <div class="menu-content">
            <h2>Sélectionner une diapositive</h2>
            <div class="slide-list" id="slideList"></div>
            <button class="close-menu" onclick="closeMenu()">Fermer</button>
        </div>
    </div>

    <div class="help-overlay" id="helpOverlay">
        <div class="help-content">
            <h2>Raccourcis clavier</h2>
            <ul>
                <li><kbd>→</kbd> ou <kbd>Espace</kbd> : Étape/Slide suivante</li>
                <li><kbd>←</kbd> : Étape/Slide précédente</li>
                <li><kbd>M</kbd> : Ouvrir le menu des slides</li>
                <li><kbd>R</kbd> : Réinitialiser la slide actuelle</li>
                <li><kbd>H</kbd> ou <kbd>?</kbd> : Afficher cette aide</li>
                <li><kbd>Échap</kbd> : Fermer les menus</li>
            </ul>
            <button class="close-menu" onclick="closeHelp()">Fermer</button>
        </div>
    </div>

    <script src="script-<nom>.js"></script>
</body>
</html>
```

### Règle n°7 — Squelette du script JS
Toujours présent, structure identique d'un chapitre à l'autre. Copier depuis `COURSPRESENTATION/4/Chapitre11_Proportionnalite/script-proportionnalite.js` puis adapter :
- `slideTitles` (un titre par slide, dans l'ordre)
- Les fonctions d'animations spécifiques (`init...`, `show...`, `reset...`, `sync...`)
- Tout le reste (navigation, raccourcis clavier, menu, aide) reste **identique mot pour mot**.

### Règle n°8 — Au début d'une session de travail : archiver (les deux fichiers)
**S'applique aux DEUX fichiers : présentation ET cours source.**

Structure archive COURSPRESENTATION (date **et heure** dans le nom de fichier, pas de suffixe a/b/c) :
```
Archives/COURSPRESENTATION/<niveau>/Chapitre<N>_<Nom>/
    Chapitre_<N>_<nom>_presentation_<YYYY-MM-DD>_<HHhMM>.html
    script-<nom>_<YYYY-MM-DD>_<HHhMM>.js
```
Exemple : `Archives/COURSPRESENTATION/6/Chapitre10_Angles/Chapitre_10_angles_presentation_2026-05-06_14h32.html`

Structure archive MathsIORI : voir section « MathsIORI » ci-dessus.

→ **Une seule archive par session de travail** (au début, avant la première modification), pas une à chaque modification individuelle — voir section « MathsIORI » ci-dessus pour le détail de cette règle, qui s'applique identiquement ici.

> **Erreur commise (mai 2026)** : cours.html modifié sans archive → impossible de revenir à l'état précédent sans reconstruire manuellement. Archiver TOUJOURS les deux fichiers au début d'une session de modification.

### Règle n°9 — Workflow type pour produire une nouvelle présentation
1. Lire le fichier source `MathsIORI/<niveau>°/chapitre<N> - <Nom>/cours.html`.
2. Si une présentation existe déjà → l'archiver d'abord.
3. Créer le dossier `COURSPRESENTATION/<niveau>/Chapitre<N>_<Nom>/`.
4. Découper le contenu en slides selon la règle n°2.
5. Copier-coller chaque section, en encapsulant chaque phrase/bloc dans un `<div class="step">` (règle n°3).
6. Recopier à l'identique SVG / animations / boutons / fonctions JS (règle n°4).
7. Créer `script-<nom>.js` à partir du modèle, mettre à jour `slideTitles`, porter les animations spécifiques.
8. Vérifier visuellement que rien n'a été ajouté/retiré par rapport au cours.

### Règle n°10 — Classes CSS disponibles dans styles.css
Classes de boîtes définies dans `COURSPRESENTATION/styles.css` (`font-size: 2.5em`, fond coloré, bordure gauche). Utiliser **uniquement** ces classes — jamais en inventer une nouvelle sans l'ajouter en même temps dans `styles.css` :

| Classe | Fond | Bordure | Texte | Usage |
|---|---|---|---|---|
| `.definition` | bleu clair `#d4ebf7` | bleu `#2980b9` | bleu | Définitions |
| `.example` | vert clair `#e8f8f0` | vert `#27ae60` | noir | Exemples |
| `.important` | jaune `#fff3b8` | orange `#f39c12` | bleu | Points importants |
| `.remarque` | gris clair `#e8e8e8` | gris `#555` | noir | Remarques |
| `.method` | gris `#c8c8c8` | noir `#000` | noir | Méthodes |
| `.calcul-detail` | gris `#f0f0f0` | gris `#7f8c8d` | noir | Détails de calcul |
| `.property` | jaune `#fff3b8` | orange `#e67e22` | bleu | Propriétés |
| `.exercice` | rose `#fce4ec` | rose foncé `#c2185b` | noir | Exercices |

> **Erreur courante (Chapitre 12, mai 2026)** : `.property` utilisée dans le HTML sans être définie dans le CSS → texte minuscule. Toujours vérifier que la classe HTML existe dans `styles.css`.

### Règle n°11 — Numérotation des titres h2/h3 : deux CSS différents
- **MathsIORI** : préfixe ajouté automatiquement par CSS counter → jamais de préfixe en dur dans `cours.html` (voir section « MathsIORI » ci-dessus).
- **COURSPRESENTATION** : aucun CSS counter → le préfixe **doit** être écrit en dur dans le HTML de la présentation.
  - ✅ `<h2>II. Construction du symétrique d'un point</h2>`
  - ❌ `<h2>Construction du symétrique d'un point</h2>` → titre sans numéro

> **Erreur commise (juin 2026)** : chapitre 12, les h2/h3 de `cours.html` écrits avec préfixes en dur → doublon visible ("III. III. Construction…").

---

## Erreurs fréquentes supplémentaires (COURSPRESENTATION uniquement)

**1. Bouton "Étape suivante" qui disparaît hors écran**
→ Quand une animation révèle plusieurs `calcul-detail` successifs (ex. résolution d'équation), le bouton doit se déplacer physiquement dans le DOM après chaque nouvelle étape.
→ Patron : `id` sur le conteneur du bouton (ex. `s3btnContainer`) et sur chaque étape (`s3step0`, `s3step1`…). Dans `nextStepX()`, après affichage de l'étape, `el.after(btnContainer)`. Scroller avec `el.scrollIntoView({ behavior: 'smooth', block: 'center' })`. Dans `resetSolveX()`, remettre le bouton avant la première étape (`step0.before(btnContainer)`).

**2. Numéros de liste `<ol>` coupés par la bordure gauche des boîtes**
→ `padding-left: 80px` sur `ul` ET `ol` dans `styles.css`. Ne jamais réduire cette valeur.

**3. Titre `h2` combiné (`— N) Mot`) qui se coupe mal à la ligne**
→ Quand le libellé après le tiret est court (un mot), le navigateur peut couper entre le numéro `N)` et son mot.
→ Remplacer l'espace par une espace insécable : `— 1)&nbsp;Définitions`.

---

## Ce qu'il ne faut JAMAIS faire (COURSPRESENTATION)
- Ajouter du contenu absent du cours (exemples, définitions, transitions, slides de récap, "à retenir"…).
- Reformuler ou raccourcir des phrases.
- Remplacer un SVG par une version simplifiée.
- Changer les couleurs ou la typographie.
- Ajouter des slides de plan / sommaire / conclusion absentes du cours.
- Modifier la numérotation des sections par rapport au cours.
- Oublier d'archiver avant modification.

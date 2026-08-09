# Règles pour les animations et cours MathsIORI

> Voir aussi `COURSPRESENTATION/CLAUDE.md` pour les règles communes aux animations interactives (points, couleurs, notation des angles) : les mêmes conventions s'appliquent ici.

> **Rappel important (Règle n°0 de COURSPRESENTATION/CLAUDE.md)** : dès qu'un chapitre `cours.html` est terminé ou modifié ici, il faut créer/mettre à jour la présentation correspondante dans `COURSPRESENTATION`, sans attendre qu'on le demande.

---

## Erreurs fréquentes à éviter

**1. Iframe d'animation collée à gauche avec espace vide à droite (juillet 2026)**
→ Un `<iframe>` inséré sans `display:block; margin:auto` reste aligné à gauche dans son conteneur (comportement par défaut d'un élément remplacé), même si le conteneur est large → grand espace vide à droite, animation qui semble minuscule et mal centrée.
→ Toujours centrer comme les images du cours (`display:block; margin:0 auto` ou `margin:16px auto 0`) et choisir une `width` qui remplit réellement l'espace disponible (pas une valeur arbitrairement petite comme 480px si le conteneur fait plus de 1000px) : adapter en conséquence le `max-width` du `.wrap` interne de l'animation pour qu'il remplisse cette largeur.
→ Toujours ajouter `scrolling="no"` sur l'iframe et calculer une `height` généreuse (somme : padding du wrap + hauteur du SVG mis à l'échelle + boîte de nom + boutons + texte + padding du body) pour éviter tout ascenseur. Mieux vaut prévoir large que trop juste.

**2. Point en mathématiques**
→ Toujours une croix `×` (deux `<line>` en diagonale), jamais un cercle. Voir `chapitre03 - Bases de geometrie/animations/animation-angles-droites-secantes.html` pour un exemple correct.

**3. Notation d'un angle**
→ Utiliser la classe `.angle` déjà définie dans `styles.css` (chapeau `^` étiré via `::before`), pas de symbole `∠` ni de dessin fait main. Couleurs à reprendre à l'identique du cours (`red`, `blue`, `black`, `green`, etc.), jamais de teintes inventées.

**4. Avant toute modification d'un `cours.html`**
→ Archiver d'abord dans `Archives/MathsIORI/<niveau>°/chapitre<N> - <Nom>/cours_<YYYY-MM-DD>.html`.

**5. `.step-box` avec `display: flex` → espaces avalés autour des `<strong>`**
→ Le modèle de référence utilise `display: block` pour `.step-box`. Si on le remplace par `display: flex; align-items: center;` pour centrer verticalement, les espaces entre le texte et les balises `<strong>` injectées via `innerHTML` disparaissent visuellement (les nœuds de texte ne contenant qu'un espace deviennent des items flex vides et sont ignorés par certains navigateurs).
→ Toujours garder `display: block` sur `.step-box` (le centrage vertical vient de `min-height` + `line-height`, pas de flex).
→ **Audit complet effectué le 19/07/2026** : ce bug préexistait aussi dans `chapitre02 - Gestion de donnees` (4 animations) et `chapitre07 - Les angles/cours.html`, et leurs équivalents dans COURSPRESENTATION. Tous corrigés (`display: block`). Les 24 fichiers `.step-box` du projet (MathsIORI + COURSPRESENTATION) sont désormais conformes.

**6. Boutons obligatoires des animations pas-à-pas (juillet 2026)**
→ Toute animation `animation-*.html` doit avoir **4 boutons**, dans cet ordre, avec ces couleurs exactes :
```html
<button class="btn-anim" id="btnPrec" onclick="prevStep()" disabled>◀ Étape précédente</button>
<button class="btn-anim" onclick="nextStep()">Étape suivante ▶</button>
<button class="btn-auto" id="btnAuto" onclick="toggleAuto()">⏵ Automatique</button>
<button class="btn-reset" onclick="resetAnimation()">Recommencer ↺</button>
```
```css
.btn-reset { background: #e74c3c; color: white; /* ... */ }
.btn-reset:hover { background: #c0392b; }
.btn-auto  { background: #4caf50; color: white; /* ... */ }
.btn-auto:hover { background: #388e3c; }
```
→ **Recommencer = rouge** (`#e74c3c`), **Automatique = vert** (`#4caf50`), qui passe en orange (`#ff9800`) + texte `⏸ Pause` pendant la lecture automatique (`toggleAuto()`/`stopAuto()`).
→ `nextStep()` garde le comportement animé d'origine (CSS keyframes, `setTimeout` en cascade) — ne jamais le modifier pour l'avance normale.
→ `prevStep()` ne peut pas "rejouer à l'envers" une animation faite de classes CSS/`setTimeout` chaînés (ordre non déterministe, marques qui réapparaissent au mauvais endroit). Utiliser à la place une fonction `renderStep(n)` qui recalcule **instantanément** (sans classes d'animation ni délais) l'état visuel final de l'étape `n`, en repartant de zéro (tout cacher, puis ne montrer que ce qui doit l'être à `n`). `toggleAuto()` relance simplement `nextStep()`/`advanceStep()` à intervalle régulier (adapter la durée à la durée réelle de chaque étape).
→ Piège rencontré : un élément dont la visibilité ne dépend **que** d'une classe d'animation CSS (ex. `#sweepLine72.sweep-active { animation: ... forwards; }`, sans règle `#sweepLine72 { opacity: 0; }` par défaut) réapparaît à son état de repos (opacité 1 par défaut) si on retire juste la classe dans `renderStep()` — il faut alors le masquer explicitement (`el.style.opacity = '0'`).
→ Exemples de référence complets : `6°/chapitre07 - Les angles/animations/` (les 6 fichiers) et `6°/chapitre08 - Fractions partie 1/animations/animation-placer-fraction-demi-droite.html`.

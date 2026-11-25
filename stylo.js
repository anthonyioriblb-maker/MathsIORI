/* ===================================================================
   STYLO — annotations à main levée sur les présentations (COURSPRESENTATION)
   -------------------------------------------------------------------
   Fichier PARTAGÉ. Pour l'activer sur une présentation, ajouter en fin
   de <body>, après le script du chapitre :
       <script src="../../stylo.js"></script>

   - Barre d'outils placée dans la barre du bas, à la place de l'indicateur
     « Étape / Slide » (masqué). À défaut, bouton ✏️ flottant à gauche.
   - ✏️ active le stylo (✖ pour quitter) ; choisir une couleur l'active aussi.
   - Deux outils d'écriture : stylo (6 couleurs) et surligneur (4 couleurs fluo,
     transparent, passe sous les traits de stylo). 3 épaisseurs par outil.
   - Gomme à 3 tailles (choisies avec les boutons d'épaisseur quand la gomme
     est active), « tout effacer » (diapo courante).
   - Souris, stylet et doigt (TBI / écran tactile).
   - Les annotations sont gardées par diapo tant que la page est ouverte.
   - Chaque trait est accroché à l'élément sur lequel il commence (étape,
     encadré, titre…) : si le texte se décale (nouvelle étape affichée,
     redimensionnement), le trait suit. Un trait posé sur une étape est
     masqué quand on revient avant cette étape.
   - Stylo actif : il capte les clics sur la diapo (boutons des animations
     inclus). Les boutons du bas et le clavier (flèches, espace) restent actifs.
   - 📝 Brouillon (touche B) : feuille plein écran par-dessus la diapo, fond au
     choix (blanc, petits carreaux, Seyès, repère), plusieurs pages ; on y écrit
     avec les mêmes outils. Échap ou 📝 pour revenir à la diapo (brouillon gardé).
   - Raccourcis : P = stylo, S = surligneur, G = gomme, B = brouillon, Échap = quitter.
   =================================================================== */
(function () {
    'use strict';

    var PALETTES = {
        stylo:      ['#222222', '#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'],
        surligneur: ['#ffe600', '#7dff4a', '#ff6ec7', '#4fd8ff']
    };
    var TAILLES = {
        stylo:      [3, 6, 11],
        surligneur: [14, 24, 36],
        gomme:      [34, 70, 130]
    };
    var OPACITE_SURLIGNEUR = 0.38;

    // zone d'écriture : .content (présentations) ou un élément marqué data-stylo (ex. automatismes MathsIORI)
    var content = document.querySelector('.content') || document.querySelector('[data-stylo]');
    if (!content) return;
    if (getComputedStyle(content).position === 'static') content.style.position = 'relative';

    var canvas = document.createElement('canvas');
    canvas.id = 'styloCanvas';
    content.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var actif = false, outil = 'stylo';           // 'stylo' | 'surligneur' | 'gomme'
    var ecriture = 'stylo';                         // dernier outil d'écriture utilisé
    var choix = {                                   // couleur et taille retenues pour chaque outil
        stylo:      { couleur: PALETTES.stylo[1], taille: 0 },
        surligneur: { couleur: PALETTES.surligneur[0], taille: 1 },
        gomme:      { taille: 1 }
    };
    function tailleGomme() { return TAILLES.gomme[choix.gomme.taille]; }
    var dessins = {};          // index de diapo -> liste de traits
    var trait = null;          // trait en cours
    var diapoCourante = -1;

    // ---------- styles ----------
    var css = document.createElement('style');
    css.textContent =
        '#styloCanvas{position:absolute;left:0;top:0;pointer-events:none;z-index:50;}' +
        // place de la barre de défilement toujours réservée : évite qu'elle apparaisse/disparaisse en boucle
        '.content{scrollbar-gutter:stable;}' +
        '#styloCanvas.on{pointer-events:auto;touch-action:none;cursor:crosshair;}' +
        '#styloCanvas.on.gomme{cursor:cell;}' +
        '#styloBar{position:fixed;left:14px;top:50%;transform:translateY(-50%);z-index:2000;display:flex;flex-direction:column;align-items:center;gap:8px;' +
        'background:rgba(44,62,80,0.92);padding:8px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.3);}' +
        '#styloBar button{all:unset;box-sizing:border-box;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;' +
        'cursor:pointer;font-size:20px;color:#fff;background:rgba(255,255,255,0.08);}' +
        '#styloBar button:hover{background:rgba(255,255,255,0.22);}' +
        '#styloBar button.sel{outline:3px solid #fff;outline-offset:-3px;}' +
        '#styloBar .pastille{width:22px;height:22px;border-radius:50%;border:2px solid #fff;}' +
        '#styloBar .trait{background:#fff;border-radius:4px;width:24px;}' +
        '#styloBar .couleurs{display:contents;}' +
        '#styloBar .pastille.fluo{border-radius:4px;width:24px;height:14px;}' +
        '#styloBar .gomme-taille{display:block;border:2px dashed #fff;border-radius:50%;}' +
        '#styloBar .outils{display:none;flex-direction:column;align-items:center;gap:8px;}' +
        '#styloBar.ouvert .outils{display:flex;}' +
        '#styloBar hr{width:30px;border:none;border-top:1px solid rgba(255,255,255,0.3);margin:0;}' +
        // version intégrée à la barre du bas
        '#styloBar.integre{position:static;transform:none;flex-direction:row;flex-wrap:nowrap;gap:4px;padding:0;background:none;box-shadow:none;border-radius:0;}' +
        '#styloBar.integre .outils{display:flex;flex-direction:row;gap:4px;}' +
        '#styloBar.integre button{width:34px;height:34px;font-size:17px;border-radius:8px;}' +
        '#styloBar.integre .pastille{width:18px;height:18px;}' +
        '#styloBar.integre .trait{width:20px;}' +
        '#styloBar.integre .pastille.fluo{width:20px;height:12px;}' +
        '#styloBar.integre hr{width:0;height:24px;border-top:none;border-left:1px solid rgba(255,255,255,0.3);margin:0 2px;}' +
        '#brouillon{position:absolute;left:0;top:0;z-index:45;display:none;background:#fff;}' +
        '#brouillon.ouvert{display:block;}' +
        '#brouillon.carreaux{background-color:#fff;background-image:linear-gradient(#cfe0f5 1px,transparent 1px),linear-gradient(90deg,#cfe0f5 1px,transparent 1px);background-size:32px 32px;}' +
        '#brouillon.seyes{background-color:#fff;background-image:linear-gradient(90deg,transparent 119px,#e57373 119px,#e57373 121px,transparent 121px),' +
            'linear-gradient(#9fb8e0 1px,transparent 1px),linear-gradient(90deg,#c9d6ee 1px,transparent 1px),linear-gradient(#dfe7f5 1px,transparent 1px);' +
            'background-size:100% 100%,48px 48px,48px 48px,12px 12px;background-position:0 0,1px 1px,1px 1px,1px 1px;}' +
        '#brouillon svg{position:absolute;left:0;top:0;}' +
        '#brouillonBar{position:absolute;left:0;right:0;bottom:0;z-index:60;display:none;gap:4px;align-items:center;justify-content:center;background:rgba(44,62,80,.95);padding:5px 8px;}' +
        '#brouillonBar button{all:unset;cursor:pointer;color:#fff;font-size:15px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,.1);}' +
        '#brouillonBar button:hover{background:rgba(255,255,255,.25);}' +
        '#brouillonBar button.sel{outline:2px solid #fff;outline-offset:-2px;}' +
        '#brouillonBar span{color:#fff;font:bold 14px sans-serif;padding:0 4px;}' +
        
        '#brRep{display:none;align-items:center;gap:2px;margin-left:18px;padding-left:14px;border-left:1px solid rgba(255,255,255,.35);}' +
        '#brRep.vu{display:flex;}' +
        '#brRep input{width:42px;font:14px sans-serif;text-align:center;border:none;border-radius:5px;padding:3px 2px;}' +
        '#brRep .sep{margin-left:10px;}' +
        '#brouillonBar.ouvert{display:flex;}' +
        '#styloBrouillon.sel{outline:3px solid #fff;outline-offset:-3px;}' +
        '@media print{#styloBar,#styloCanvas,#brouillon{display:none !important;}}';
    document.head.appendChild(css);

    // ---------- barre d'outils ----------
    var bar = document.createElement('div');
    bar.id = 'styloBar';
    var html = '<button id="styloToggle" title="Stylo (P)">✏️</button><div class="outils">' +
        '<button class="mode" data-o="stylo" title="Stylo (P)">🖊️</button>' +
        '<button class="mode" data-o="surligneur" title="Surligneur (S)">🖍️</button><hr>' +
        '<span class="couleurs"></span><hr>';
    [0, 1, 2].forEach(function (i) {
        html += '<button class="epaisseur" data-i="' + i + '" title="Épaisseur"><span class="trait" style="height:' + [2, 5, 9][i] + 'px"></span></button>';
    });
    html += '<hr><button id="styloGomme" title="Gomme (G) — taille avec les boutons d\'épaisseur">🧽</button>' +
            '<button id="styloEffacer" title="Tout effacer sur cette diapo">🗑️</button></div>' +
            '<button id="styloBrouillon" title="Brouillon (B)">📝</button>';
    bar.innerHTML = html;
    var progress = document.querySelector('.controls .progress');
    if (progress) {
        progress.style.display = 'none';           // « Étape x/y – Slide x/y » remplacé par les outils
        bar.classList.add('integre');
        progress.parentNode.insertBefore(bar, progress.nextSibling);
    } else {
        document.body.appendChild(bar);
    }

    var btnToggle = document.getElementById('styloToggle');
    var btnGomme = document.getElementById('styloGomme');

    var zoneCouleurs = bar.querySelector('.couleurs');
    function construireCouleurs() {
        var h = '';
        PALETTES[ecriture].forEach(function (c, i) {
            h += '<button class="couleur" data-i="' + i + '" title="Couleur"><span class="pastille' +
                 (ecriture === 'surligneur' ? ' fluo' : '') + '" style="background:' + c + '"></span></button>';
        });
        zoneCouleurs.innerHTML = h;
        zoneCouleurs.dataset.pour = ecriture;
        zoneCouleurs.querySelectorAll('.couleur').forEach(function (b) {
            b.addEventListener('click', function () {
                choix[ecriture].couleur = PALETTES[ecriture][b.dataset.i];
                outil = ecriture; setActif(true);
            });
        });
    }
    function majBarre() {
        if (zoneCouleurs.dataset.pour !== ecriture) construireCouleurs();
        bar.classList.toggle('ouvert', actif);
        btnToggle.classList.toggle('sel', actif);
        btnToggle.textContent = actif ? '✖' : '✏️';
        btnToggle.title = actif ? 'Quitter le stylo (Échap)' : 'Stylo (P)';
        canvas.classList.toggle('on', actif);
        canvas.classList.toggle('gomme', outil === 'gomme');
        btnGomme.classList.toggle('sel', outil === 'gomme');
        bar.querySelectorAll('.mode').forEach(function (b) {
            b.classList.toggle('sel', outil === b.dataset.o);
        });
        bar.querySelectorAll('.couleur').forEach(function (b) {
            b.classList.toggle('sel', outil !== 'gomme' && PALETTES[ecriture][b.dataset.i] === choix[ecriture].couleur);
        });
        var cle = outil === 'gomme' ? 'gomme' : ecriture;
        bar.querySelectorAll('.epaisseur').forEach(function (b) {
            b.classList.toggle('sel', +b.dataset.i === choix[cle].taille);
            b.title = outil === 'gomme' ? 'Taille de la gomme' : 'Épaisseur';
            var sp = b.firstChild;
            if (outil === 'gomme') { var d = [10, 16, 24][b.dataset.i]; sp.className = 'gomme-taille'; sp.style.width = d + 'px'; sp.style.height = d + 'px'; }
            else { sp.className = 'trait'; sp.style.width = ''; sp.style.height = [2, 5, 9][b.dataset.i] + 'px'; }
        });
    }
    function setActif(v) { actif = v; if (v) dimensionner(); majBarre(); }
    function choisirEcriture(o) { ecriture = o; outil = o; setActif(true); }

    btnToggle.addEventListener('click', function () { setActif(!actif); });
    bar.querySelectorAll('.mode').forEach(function (b) {
        b.addEventListener('click', function () { choisirEcriture(b.dataset.o); });
    });
    bar.querySelectorAll('.epaisseur').forEach(function (b) {
        b.addEventListener('click', function () {
            choix[outil === 'gomme' ? 'gomme' : ecriture].taille = +b.dataset.i;
            setActif(true);
        });
    });
    btnGomme.addEventListener('click', function () { outil = (outil === 'gomme') ? ecriture : 'gomme'; setActif(true); });
    document.getElementById('styloEffacer').addEventListener('click', function () {
        dessins[diapoCourante] = [];
        redessiner();
    });

    // ---------- diapo courante & taille du canevas ----------
    function indexDiapo() {
        if (brouillon.ouvert) return 'b' + brouillon.page;
        var s = content.querySelectorAll('.slide');
        for (var i = 0; i < s.length; i++) if (s[i].classList.contains('active')) return i;
        return 0;
    }
    function dimensionner() {
        var dpr = window.devicePixelRatio || 1;
        var w = content.clientWidth;
        var slide = brouillon.ouvert ? null : content.querySelectorAll('.slide')[diapoCourante];
        var bas = slide ? slide.offsetTop + slide.offsetHeight : 0;   // pas de marge en plus : elle créait une barre de défilement
        // à 125 %, 150 %… les tailles tombent entre deux pixels : on reste 1 px sous la hauteur visible
        // pour ne jamais créer à nous seuls une barre de défilement
        var h = bas > content.clientHeight ? Math.ceil(bas) : content.clientHeight - 1;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            redessiner();
        }
    }
    function verifierDiapo() {
        var i = indexDiapo();
        if (i !== diapoCourante) {
            trait = null;
            diapoCourante = i;
            dimensionner();
            redessiner();
        }
    }

    // ---------- ancrage des traits sur le texte ----------
    function versHTML(el) {
        while (el && !(el instanceof HTMLElement)) el = el.parentElement;
        return el;
    }
    function ancreSous(x, y) {            // x, y : coordonnées écran
        if (brouillon.ouvert) return null;
        canvas.style.pointerEvents = 'none';
        var el = document.elementFromPoint(x, y);
        canvas.style.pointerEvents = '';
        el = versHTML(el);
        // on ignore les étapes pas encore affichées (elles occupent la place mais sont invisibles)
        var st = el && el.closest('.step');
        while (st && !st.classList.contains('visible')) {
            el = st.parentElement;
            st = el && el.closest('.step');
        }
        if (!el || el === content || !content.contains(el) || el.classList.contains('slide')) return null;
        return el;                        // l'élément le plus précis sous le trait (mot, fraction, encadré…)
    }
    function pos(el) {                    // position dans .content, sans les transformations CSS
        var x = 0, y = 0;
        while (el && el !== content) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        return [x, y];
    }
    function visible(t) {
        var a = t.ancre;
        if (!a) return true;
        if (!a.isConnected || a.offsetParent === null) return false;
        var st = a.closest('.step');
        return !st || st.classList.contains('visible');
    }
    function decalage(t) {
        if (!t.ancre) return [0, 0];
        var p = pos(t.ancre);
        return [p[0] - t.ax, p[1] - t.ay];
    }

    // ---------- dessin ----------
    function tracer(t) {
        if (!visible(t)) return;
        var d = decalage(t), dx = d[0], dy = d[1];
        var p = t.pts;
        if (!p.length) return;
        ctx.save();
        if (t.surligneur) ctx.globalAlpha = OPACITE_SURLIGNEUR;
        ctx.strokeStyle = t.couleur;
        ctx.fillStyle = t.couleur;
        ctx.lineWidth = t.epaisseur;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (p.length === 1) {
            ctx.beginPath();
            ctx.arc(p[0][0] + dx, p[0][1] + dy, t.epaisseur / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(p[0][0] + dx, p[0][1] + dy);
            for (var i = 1; i < p.length - 1; i++) {
                var mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
                ctx.quadraticCurveTo(p[i][0] + dx, p[i][1] + dy, mx + dx, my + dy);
            }
            ctx.lineTo(p[p.length - 1][0] + dx, p[p.length - 1][1] + dy);
            ctx.stroke();
        }
        ctx.restore();
    }
    function redessiner() {
        var dpr = window.devicePixelRatio || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var liste = dessins[diapoCourante] || [];
        liste.forEach(function (t) { if (t.surligneur) tracer(t); });     // surligneur sous l'encre
        if (trait && trait.surligneur) tracer(trait);
        liste.forEach(function (t) { if (!t.surligneur) tracer(t); });
        if (trait && !trait.surligneur) tracer(trait);
        if (gommeCurseur) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(gommeCurseur[0], gommeCurseur[1], tailleGomme() / 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
        }
    }
    function point(e) {
        var r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    }
    // points rapprochés (≤ 3 px) pour que la gomme coupe proprement
    function densifier(pts) {
        var out = [pts[0]];
        for (var i = 1; i < pts.length; i++) {
            var a = out[out.length - 1], b = pts[i];
            var d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(d / 3);
            for (var k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / (n + 1), a[1] + (b[1] - a[1]) * k / (n + 1)]);
            out.push(b);
        }
        return out;
    }

    // ---------- gomme : coupe les traits là où elle passe ----------
    var gommeCurseur = null, gommeDernier = null;
    function gommer(c) {
        var liste = dessins[diapoCourante];
        if (!liste) return;
        var res = [];
        liste.forEach(function (t) {
            if (!visible(t)) { res.push(t); return; }
            var d = decalage(t), r = tailleGomme() / 2 + t.epaisseur / 2;
            var morceau = [], touche = false;
            t.pts.forEach(function (p) {
                if (Math.hypot(p[0] + d[0] - c[0], p[1] + d[1] - c[1]) <= r) {
                    touche = true;
                    if (morceau.length) res.push(copie(t, morceau));
                    morceau = [];
                } else morceau.push(p);
            });
            if (!touche) { res.push(t); return; }
            if (morceau.length) res.push(copie(t, morceau));
        });
        dessins[diapoCourante] = res;
    }
    function copie(t, pts) {
        return { couleur: t.couleur, epaisseur: t.epaisseur, surligneur: t.surligneur, ancre: t.ancre, ax: t.ax, ay: t.ay, pts: pts };
    }
    function gommerVers(c) {              // interpole entre deux positions de la gomme
        if (gommeDernier) {
            var d = Math.hypot(c[0] - gommeDernier[0], c[1] - gommeDernier[1]);
            var n = Math.ceil(d / (tailleGomme() / 3));
            for (var k = 1; k < n; k++) gommer([gommeDernier[0] + (c[0] - gommeDernier[0]) * k / n, gommeDernier[1] + (c[1] - gommeDernier[1]) * k / n]);
        }
        gommer(c);
        gommeDernier = c;
    }

    canvas.addEventListener('pointerdown', function (e) {
        if (!actif || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        verifierDiapo();
        canvas.setPointerCapture(e.pointerId);
        var p = point(e);
        if (outil === 'gomme' || e.button === 5) {      // 5 = bouton gomme d'un stylet
            gommeEnCours = true; gommeDernier = null; gommeCurseur = p;
            gommerVers(p);
        } else {
            var an = ancreSous(e.clientX, e.clientY), ap = an ? pos(an) : [0, 0];
            var o = ecriture;
            trait = { couleur: choix[o].couleur, epaisseur: TAILLES[o][choix[o].taille], surligneur: o === 'surligneur',
                      ancre: an, ax: ap[0], ay: ap[1], pts: [p] };
        }
        redessiner();
    });
    var gommeEnCours = false;
    canvas.addEventListener('pointermove', function (e) {
        var p = point(e);
        if (gommeEnCours) { e.preventDefault(); gommeCurseur = p; gommerVers(p); redessiner(); return; }
        if (actif && outil === 'gomme') { gommeCurseur = p; redessiner(); return; }
        if (!trait) return;
        e.preventDefault();
        trait.pts.push(p);
        redessiner();
    });
    canvas.addEventListener('pointerleave', function () { if (gommeCurseur && !gommeEnCours) { gommeCurseur = null; redessiner(); } });
    function finTrait() {
        if (gommeEnCours) { gommeEnCours = false; gommeDernier = null; redessiner(); return; }
        if (!trait) return;
        trait.pts = densifier(trait.pts);
        (dessins[diapoCourante] = dessins[diapoCourante] || []).push(trait);
        trait = null;
        redessiner();
    }
    canvas.addEventListener('pointerup', finTrait);
    canvas.addEventListener('pointercancel', finTrait);

    // ---------- brouillon ----------
    var brouillon = { ouvert: false, page: 0, pages: 1, fond: 'blanc', scroll: 0, overflow: '',
                      rep: { xmin: -5, xmax: 5, px: 1, ymin: -4, ymax: 4, py: 1 } };
    var feuille = document.createElement('div');
    feuille.id = 'brouillon';
    content.appendChild(feuille);
    var bb = document.createElement('div');
    bb.id = 'brouillonBar';
    bb.innerHTML =
        '<button data-f="blanc" title="Feuille blanche">⬜</button>' +
        '<button data-f="carreaux" title="Petits carreaux">▦</button>' +
        '<button data-f="seyes" title="Lignes Seyès">☰</button>' +
        '<button data-f="repere" title="Repère">✛</button>' +
        '<button id="brPrec" title="Page précédente">◀</button><span id="brNum">1/1</span>' +
        '<button id="brSuiv" title="Page suivante">▶</button>' +
        '<button id="brAjout" title="Nouvelle page">+ page</button>' +
        '<button id="brFermer" title="Revenir à la diapo (Échap)">✖</button>' +
        '<div id="brRep">' +
        '<span>x : de</span><input data-k="xmin"><span>à</span><input data-k="xmax"><span>pas</span><input data-k="px">' +
        '<span class="sep">y : de</span><input data-k="ymin"><span>à</span><input data-k="ymax"><span>pas</span><input data-k="py">' +
        '</div>';
    content.appendChild(bb);                 // hors de la feuille : doit rester cliquable au-dessus du canevas
    var btnBrouillon = document.getElementById('styloBrouillon');

    function nb(v) { var t = Math.round(v * 1000) / 1000; return String(t).replace('.', ',').replace('-', '−'); }
    function dessinerRepere() {
        var old = feuille.querySelector('svg'); if (old) old.remove();
        if (brouillon.fond !== 'repere') return;
        var R = brouillon.rep, w = feuille.clientWidth, h = feuille.clientHeight - bb.offsetHeight, m = 34;   // bandeau des réglages en bas
        if (!(R.xmax > R.xmin) || !(R.ymax > R.ymin) || !(R.px > 0) || !(R.py > 0)) return;
        var sx = (w - 2 * m) / (R.xmax - R.xmin), sy = (h - 2 * m) / (R.ymax - R.ymin);
        var X = function (x) { return m + (x - R.xmin) * sx; }, Y = function (y) { return h - m - (y - R.ymin) * sy; };
        var ax = Y(Math.min(Math.max(0, R.ymin), R.ymax)), ay = X(Math.min(Math.max(0, R.xmin), R.xmax));   // position des axes
        var g = '', t = '', k, v;
        // pas d'affichage des nombres si les graduations sont trop serrées
        var ex = Math.max(1, Math.ceil(28 / (R.px * sx))), ey = Math.max(1, Math.ceil(22 / (R.py * sy)));
        var i0 = Math.ceil(R.xmin / R.px - 1e-9), i1 = Math.floor(R.xmax / R.px + 1e-9);
        for (k = i0; k <= i1 && k - i0 < 400; k++) {
            v = k * R.px; var x = X(v);
            g += '<line x1="' + x + '" y1="' + m + '" x2="' + x + '" y2="' + (h - m) + '" stroke="#dde6f3"/>';
            t += '<line x1="' + x + '" y1="' + (ax - 4) + '" x2="' + x + '" y2="' + (ax + 4) + '" stroke="#333"/>';
            if (k && k % ex === 0) t += '<text x="' + x + '" y="' + (ax + 19) + '" font-size="14" text-anchor="middle" font-family="Arial">' + nb(v) + '</text>';
        }
        var j0 = Math.ceil(R.ymin / R.py - 1e-9), j1 = Math.floor(R.ymax / R.py + 1e-9);
        for (k = j0; k <= j1 && k - j0 < 400; k++) {
            v = k * R.py; var y = Y(v);
            g += '<line x1="' + m + '" y1="' + y + '" x2="' + (w - m) + '" y2="' + y + '" stroke="#dde6f3"/>';
            t += '<line x1="' + (ay - 4) + '" y1="' + y + '" x2="' + (ay + 4) + '" y2="' + y + '" stroke="#333"/>';
            if (k && k % ey === 0) t += '<text x="' + (ay - 8) + '" y="' + (y + 5) + '" font-size="14" text-anchor="end" font-family="Arial">' + nb(v) + '</text>';
        }
        var o = (R.xmin <= 0 && R.xmax >= 0 && R.ymin <= 0 && R.ymax >= 0) ?
            '<text x="' + (ay - 8) + '" y="' + (ax + 19) + '" font-size="15" text-anchor="end" font-family="Arial">O</text>' : '';
        feuille.insertAdjacentHTML('afterbegin',
            '<svg width="' + w + '" height="' + h + '">' + g + t + o +
            '<line x1="' + (m - 14) + '" y1="' + ax + '" x2="' + (w - m + 18) + '" y2="' + ax + '" stroke="#333" stroke-width="1.6"/>' +
            '<line x1="' + ay + '" y1="' + (h - m + 14) + '" x2="' + ay + '" y2="' + (m - 18) + '" stroke="#333" stroke-width="1.6"/>' +
            '<polygon points="' + (w - m + 24) + ',' + ax + ' ' + (w - m + 14) + ',' + (ax - 5) + ' ' + (w - m + 14) + ',' + (ax + 5) + '" fill="#333"/>' +
            '<polygon points="' + ay + ',' + (m - 24) + ' ' + (ay - 5) + ',' + (m - 14) + ' ' + (ay + 5) + ',' + (m - 14) + '" fill="#333"/></svg>');
    }
    // page « autonome » (zone data-stylo dans une page qui défile, ex. automatismes) :
    // la feuille couvre la zone visible de l'écran, page bloquée pendant le brouillon
    var autonome = !content.classList.contains('content');
    function placerFeuille() {
        feuille.style.width = content.clientWidth + 'px';
        var h = content.clientHeight;
        if (autonome) {
            var haut = Math.max(0, -content.getBoundingClientRect().top);
            h = Math.min(content.clientHeight - haut, window.innerHeight - Math.max(0, content.getBoundingClientRect().top));
            feuille.style.top = haut + 'px';
            bb.style.bottom = 'auto'; bb.style.top = (haut + h) + 'px'; bb.style.transform = 'translateY(-100%)';
        }
        feuille.style.height = h + 'px';
        dessinerRepere();
    }
    function majBrouillon() {
        feuille.className = brouillon.ouvert ? 'ouvert ' + brouillon.fond : brouillon.fond;
        btnBrouillon.classList.toggle('sel', brouillon.ouvert);
        bb.classList.toggle('ouvert', brouillon.ouvert);
        bb.querySelectorAll('[data-f]').forEach(function (b) { b.classList.toggle('sel', b.dataset.f === brouillon.fond); });
        document.getElementById('brNum').textContent = (brouillon.page + 1) + '/' + brouillon.pages;
        document.getElementById('brRep').classList.toggle('vu', brouillon.fond === 'repere');
        if (brouillon.ouvert) dessinerRepere();
    }
    function ouvrirBrouillon(v) {
        if (v === brouillon.ouvert) return;
        brouillon.ouvert = v;
        if (v) {
            if (autonome) {
                brouillon.overflow = document.documentElement.style.overflow;
                document.documentElement.style.overflow = 'hidden';
            } else {
                brouillon.scroll = content.scrollTop;
                brouillon.overflow = content.style.overflow;
                content.scrollTop = 0;
                content.style.overflow = 'hidden';
            }
            placerFeuille();
            if (!actif || outil === 'gomme') { outil = ecriture; }
            setActif(true);
        } else if (autonome) {
            document.documentElement.style.overflow = brouillon.overflow;
        } else {
            content.style.overflow = brouillon.overflow;
            content.scrollTop = brouillon.scroll;
        }
        majBrouillon();
        trait = null; diapoCourante = -1;
        verifierDiapo(); dimensionner(); redessiner();
    }
    function allerPage(n) {
        brouillon.page = Math.max(0, Math.min(brouillon.pages - 1, n));
        majBrouillon(); verifierDiapo(); redessiner();
    }
    btnBrouillon.addEventListener('click', function () { ouvrirBrouillon(!brouillon.ouvert); });
    bb.querySelectorAll('[data-f]').forEach(function (b) {
        b.addEventListener('click', function () { brouillon.fond = b.dataset.f; majBrouillon(); dessinerRepere(); });
    });
    document.getElementById('brPrec').addEventListener('click', function () { allerPage(brouillon.page - 1); });
    document.getElementById('brSuiv').addEventListener('click', function () { allerPage(brouillon.page + 1); });
    document.getElementById('brAjout').addEventListener('click', function () { brouillon.pages++; allerPage(brouillon.pages - 1); });
    document.getElementById('brFermer').addEventListener('click', function () { ouvrirBrouillon(false); });
    window.addEventListener('resize', function () { if (brouillon.ouvert) placerFeuille(); });
    bb.querySelectorAll('#brRep input').forEach(function (inp) {
        inp.value = nb(brouillon.rep[inp.dataset.k]);
        // les touches tapées dans les champs ne doivent pas changer de diapo ni d'outil
        inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
        inp.addEventListener('input', function () {
            var v = parseFloat(inp.value.replace(',', '.').replace('−', '-'));
            if (!isNaN(v)) { brouillon.rep[inp.dataset.k] = v; dessinerRepere(); }
        });
    });
    majBrouillon();

    // ---------- clavier ----------
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target && e.target.tagName;
        if (t === 'INPUT' || t === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
        if (e.key === 'p' || e.key === 'P') { if (actif && outil === 'stylo') setActif(false); else choisirEcriture('stylo'); }
        else if (e.key === 's' || e.key === 'S') { if (actif && outil === 'surligneur') setActif(false); else choisirEcriture('surligneur'); }
        else if (e.key === 'g' || e.key === 'G') { outil = 'gomme'; setActif(true); }
        else if (e.key === 'b' || e.key === 'B') { ouvrirBrouillon(!brouillon.ouvert); }
        else if (e.key === 'Escape' && brouillon.ouvert) { ouvrirBrouillon(false); }
        else if (e.key === 'Escape' && actif) { setActif(false); }
    });

    // ---------- suivi des changements de diapo / de taille ----------
    // Toute modification de la mise en page (étape affichée, redimensionnement,
    // iframe qui grandit…) → on recalcule la taille et on redessine (traits recalés).
    var rafPrevu = false;
    function actualiser() {
        if (rafPrevu) return;
        rafPrevu = true;
        requestAnimationFrame(function () {
            rafPrevu = false;
            verifierDiapo();
            dimensionner();
            redessiner();
        });
    }
    new MutationObserver(actualiser)
        .observe(content, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'height', 'width'] });
    window.addEventListener('resize', actualiser);
    if (window.ResizeObserver) {
        var ro = new ResizeObserver(actualiser);
        ro.observe(content);
        content.querySelectorAll('.slide').forEach(function (sl) { ro.observe(sl); });
    }

    verifierDiapo();
    majBarre();
})();

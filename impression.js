/* === Bouton « Imprimer » commun à tous les cours MathsIORI ===
   - Ajoute un bouton en haut à droite (invisible sur la feuille imprimée).
   - Avant d'imprimer, fait avancer chaque animation (iframe animations/*.html)
     jusqu'à sa dernière étape, pour imprimer la version terminée.
   - Les animations sans bouton « suivant » (manipulations libres) sont imprimées telles quelles.
   - Après l'impression, les animations sont remises à zéro.
   Chargé par une seule ligne avant </body> : <script src="../../impression.js"></script> */
(function () {
    if (window.__impressionIORI) return;
    window.__impressionIORI = true;

    var style = document.createElement('style');
    style.textContent =
        '#btnImprimerIORI{position:fixed;top:14px;right:14px;z-index:10000;background:#2980b9;color:#fff;border:none;' +
        'border-radius:8px;padding:10px 16px;font:bold 15px "Segoe UI",Tahoma,sans-serif;cursor:pointer;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.25)}' +
        '#btnImprimerIORI:hover{background:#1f6391}' +
        '#btnImprimerIORI:disabled{background:#7f8c8d;cursor:wait}' +
        '@media print{#btnImprimerIORI,#symFloatingCtrl,#floatAnimCtrl,.home-button{display:none!important}}' +
        '.garde-entier{display:block;break-inside:avoid;page-break-inside:avoid}';
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'btnImprimerIORI';
    btn.type = 'button';
    btn.textContent = '🖨 Imprimer';
    btn.addEventListener('click', imprimer);

    /* Images (schémas, tableaux) jamais coupées entre deux pages, y compris sous Firefox :
       chaque image affichée en bloc est enveloppée dans un <div class="garde-entier">
       (break-inside:avoid sur l'image seule n'est pas respecté par tous les navigateurs). */
    function protegerImages() {
        Array.prototype.forEach.call(document.querySelectorAll('img'), function (img) {
            if (getComputedStyle(img).display !== 'block') return;
            var p = img.parentElement;
            if (!p || p.classList.contains('garde-entier')) return;
            var w = document.createElement('div');
            w.className = 'garde-entier';
            p.insertBefore(w, img);
            w.appendChild(img);
        });
    }

    function ajouterBouton() { protegerImages(); document.body.appendChild(btn); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ajouterBouton);
    else ajouterBouton();

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function boutonSuivant(doc) {
        var ids = ['nextBtn', 'btnNext', 'btnSuivant', 'btnSuiv'];
        for (var i = 0; i < ids.length; i++) {
            var el = doc.getElementById(ids[i]);
            if (el) return el;
        }
        var btns = Array.prototype.slice.call(doc.querySelectorAll('button'));
        for (var j = 0; j < btns.length; j++) {
            if (/nextStep|suivant\s*\(|next\s*\(|goNext|advanceStep/i.test(btns[j].getAttribute('onclick') || '')) return btns[j];
        }
        for (var k = 0; k < btns.length; k++) {
            if (/suivant/i.test(btns[k].textContent)) return btns[k];
        }
        return null;
    }

    async function attendreActif(b, maxMs) {
        var t = 0;
        while (b.disabled && t < maxMs) { await sleep(50); t += 50; }
        return !b.disabled;
    }

    async function terminer(frame) {
        var win, doc;
        try { win = frame.contentWindow; doc = frame.contentDocument; } catch (e) { return; }
        if (!doc || !doc.body) return;                       // inaccessible (fichier ouvert en local)

        try { if (typeof win.stopAuto === 'function') win.stopAuto(); } catch (e) {}

        // Accélérer : plus de transitions CSS, temporisations divisées
        var st = doc.createElement('style');
        st.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;' +
                         'animation-duration:1ms!important;animation-delay:0s!important}';
        doc.head.appendChild(st);
        var origST = win.setTimeout;
        win.setTimeout = function (f, d) {
            var args = Array.prototype.slice.call(arguments, 2);
            return origST.apply(win, [f, Math.min((d || 0) / 40, 40)].concat(args));
        };

        try {
            var next = boutonSuivant(doc);
            if (!next) return;                                // animation sans fin : telle quelle
            if (next.disabled) {                              // animation à démarrer d'abord
                var play = doc.getElementById('btnPlay');
                if (play) { play.click(); await sleep(100); }
            }
            var inchange = 0;
            if (next.disabled && !(await attendreActif(next, 3000))) return;
            for (var i = 0; i < 300; i++) {
                next = boutonSuivant(doc);
                if (!next || next.offsetParent === null || next.disabled) break;
                var avant = doc.body.innerHTML;
                next.click();
                await sleep(60);
                if (!(await attendreActif(next, 3000))) break;  // bouton resté grisé : dernière étape atteinte
                if (doc.body.innerHTML === avant) { if (++inchange >= 2) break; } else inchange = 0;
            }
        } finally {
            win.setTimeout = origST;
            await sleep(100);
            st.remove();
        }
    }

    var LARGEUR_PAPIER = 640;   // largeur utile approximative d'une page A4 (px CSS)

    var HAUTEUR_MAX = 600;      // hauteur maximale d'une animation sur papier (px CSS) : évite les grands blancs

    /* Prépare une animation pour le papier : boutons masqués (inutiles à l'impression),
       puis réduction si elle est trop large ou trop haute pour tenir sur la page. */
    function reduire(frame) {
        var doc;
        try { doc = frame.contentDocument; } catch (e) { return null; }
        if (!doc || !doc.documentElement || !doc.body) return null;
        var sauvegarde = { width: frame.style.width, height: frame.style.height, maxWidth: frame.style.maxWidth };
        var st = doc.createElement('style');
        st.textContent = 'button{display:none!important}';
        doc.head.appendChild(st);
        Array.prototype.forEach.call(doc.querySelectorAll('div'), function (d) {
            var enfants = Array.prototype.slice.call(d.children);
            if (enfants.length && enfants.every(function (c) { return c.tagName === 'BUTTON'; })) d.style.display = 'none';
        });
        var largeur = frame.getBoundingClientRect().width;
        var hauteur = doc.body.scrollHeight;
        var z = Math.min(1, LARGEUR_PAPIER / largeur, HAUTEUR_MAX / hauteur);
        doc.documentElement.style.zoom = z;
        frame.style.maxWidth = 'none';
        frame.style.width = Math.floor(largeur * z) + 'px';
        frame.style.marginLeft = 'auto';
        frame.style.marginRight = 'auto';
        return { frame: frame, doc: doc, sauvegarde: sauvegarde };
    }

    function fixerHauteur(r) {
        var h = r.doc.documentElement.getBoundingClientRect().height;
        r.frame.style.height = Math.ceil(h) + 6 + 'px';
    }

    async function imprimer() {
        btn.disabled = true;
        btn.textContent = '⏳ Préparation…';
        var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[src*="animations/"]'));
        await Promise.all(frames.map(function (f) {             // toutes les animations en même temps
            return terminer(f).catch(function (e) { console.warn('Impression : animation ignorée', e); });
        }));
        await sleep(600);                                     // laisser les iframes se redimensionner
        var reduits = frames.map(reduire).filter(Boolean);    // animations sans boutons, réduites pour tenir sur la feuille
        await sleep(300);
        reduits.forEach(fixerHauteur);
        btn.disabled = false;
        btn.textContent = '🖨 Imprimer';
        window.print();
        if (frames.length) {                                  // remise à zéro des animations
            setTimeout(function () {
                reduits.forEach(function (r) {
                    r.frame.style.width = r.sauvegarde.width;
                    r.frame.style.height = r.sauvegarde.height;
                    r.frame.style.maxWidth = r.sauvegarde.maxWidth;
                });
                frames.forEach(function (f) { f.src = f.src; });
            }, 500);
        }
    }
})();

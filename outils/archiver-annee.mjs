#!/usr/bin/env node
/* ===================================================================
   ARCHIVAGE ANNUEL — « livres » des années antérieures (MathsIORI)
   -------------------------------------------------------------------
   Fige l'état du site à une date donnée (un commit git) et fabrique,
   pour chaque niveau, un « livre » : une seule page qui contient tous
   les chapitres mis en ligne cette année-là (cours, exercices,
   corrections, évaluations, quiz, devoirs), plus une version PDF.

   Résultat :
     annees-anterieures/
       index.html                  ← liste des années (régénérée)
       annees.json                 ← registre des années archivées
       2025-2026/
         index.html                ← les 4 livres de l'année
         6°/livre.html             ← le livre de 6e (sommaire + chapitres)
         6°/livre-6e-2025-2026.pdf ← version imprimable (option --pdf)
         6°/chapitre…/…            ← copie figée des fichiers utilisés
         styles.css, …             ← copie figée des fichiers communs

   Les fichiers copiés gardent leurs chemins d'origine : tous les liens
   relatifs (images, animations, styles) continuent de fonctionner, et
   modifier un cours de l'année en cours ne change jamais l'archive.

   Utilisation :
     node outils/archiver-annee.mjs                       (état actuel, année qui se termine)
     node outils/archiver-annee.mjs --ref 9cebd1c --annee 2025-2026 --pdf
   Options :
     --ref <commit|branche>  état à archiver (défaut : HEAD)
     --annee AAAA-AAAA       nom de l'année (défaut : calculé d'après la date du commit)
     --pdf                   fabrique aussi les PDF (nécessite playwright + pdf-lib)
     --force                 remplace une archive déjà existante pour cette année
   Lancé automatiquement le premier jour des vacances d'été par .github/workflows/archive-annuelle.yml
   =================================================================== */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT_BASE = path.join(ROOT, 'annees-anterieures');
const NIVEAUX = ['6', '5', '4', '3'];
const NOM_NIVEAU = { 6: '6e', 5: '5e', 4: '4e', 3: '3e' };
const CATEGORIES = {
    cours: 'Cours', activites: 'Activités', activite: 'Activité', exercices: 'Exercices',
    evaluations: 'Évaluations', quiz: 'Quiz', evenement: 'Évaluation', devoirs: 'Devoirs'
};
const PAS_DANS_LE_PDF = new Set(['quiz']);   // pages interactives : en ligne seulement

// ---------- arguments
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const flag = n => argv.includes('--' + n);
const REF = opt('ref', 'HEAD');
const WITH_PDF = flag('pdf');
const FORCE = flag('force');

// ---------- accès git (on lit l'état du commit, pas le dossier de travail)
const git = (args, enc = 'utf8') => execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: ROOT, encoding: enc, maxBuffer: 1 << 30 });
const TREE = new Set(git(['ls-tree', '-r', '--name-only', REF]).split('\n').filter(Boolean));
const lire = p => git(['show', `${REF}:${p}`], 'buffer');
const lireTexte = p => lire(p).toString('utf8');

function anneeParDefaut() {
    const d = new Date(git(['log', '-1', '--format=%cI', REF]).trim());
    const y = d.getFullYear();
    return d.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;   // de janvier à juillet : l'année scolaire qui se termine
}
const ANNEE = opt('annee', '') || anneeParDefaut();
if (!/^\d{4}-\d{4}$/.test(ANNEE)) { console.error('Année invalide : ' + ANNEE); process.exit(1); }
const OUT = path.join(OUT_BASE, ANNEE);

if (fs.existsSync(OUT)) {
    if (!FORCE) { console.log(`L'année ${ANNEE} est déjà archivée (utiliser --force pour la refaire).`); process.exit(0); }
    fs.rmSync(OUT, { recursive: true, force: true });
}

// ---------- lecture de la configuration d'une page classe-Xe.html
function extraireLitteral(src, nom) {
    const i = src.search(new RegExp(`(const|let|var)\\s+${nom}\\s*=`));
    if (i < 0) return null;
    const ouv = src.slice(i).search(/[[{]/) + i;
    const open = src[ouv], close = open === '{' ? '}' : ']';
    let d = 0, k = ouv, str = null;
    for (; k < src.length; k++) {
        const c = src[k];
        if (str) { if (c === '\\') { k++; continue; } if (c === str) str = null; continue; }
        if (c === '"' || c === "'" || c === '`') { str = c; continue; }
        if (c === open) d++; else if (c === close) { d--; if (!d) break; }
    }
    try { return vm.runInNewContext('(' + src.slice(ouv, k + 1) + ')'); } catch (e) { console.warn(`  ⚠ ${nom} illisible : ${e.message}`); return null; }
}

function normaliser(p) { return path.posix.normalize(p).replace(/^\.\//, ''); }
function existe(p) { return TREE.has(p); }

function documentsDuNiveau(n) {
    const page = `${n}°/classe-${n}e.html`;
    if (!existe(page)) return null;
    const src = lireTexte(page);
    const config = extraireLitteral(src, 'configChapitres') || {};
    const devoirs = extraireLitteral(src, 'configDevoirs') || [];
    const chapitres = [];
    const vu = new Set();
    const ajouter = (liste, categorie, titre, fichier) => {
        if (!fichier) return;
        const p = normaliser(`${n}°/${decodeURI(String(fichier).split(/[?#]/)[0])}`);
        if (!existe(p) || vu.has(p)) return;
        vu.add(p);
        liste.push({ categorie, titre, chemin: p });
    };
    for (const ch of Object.values(config)) {
        if (!ch || !ch.disponible) continue;
        const docs = [];
        for (const [cle, val] of Object.entries(ch)) {
            if (!val || typeof val !== 'object' || val.actif === false) continue;
            const cat = CATEGORIES[cle] || cle;
            if (val.fichier) ajouter(docs, cle, cat, val.fichier);
            if (Array.isArray(val.items)) val.items.forEach(it => it && ajouter(docs, cle, it.titre || cat, it.fichier));
        }
        if (docs.length) chapitres.push({ titre: ch.titre, description: ch.description || '', emoji: ch.emoji || '', docs });
    }
    const devs = [];
    for (const d of devoirs) {
        if (!d) continue;
        for (const k of ['sujet', 'correction']) {
            if (d[k] && d[k].actif !== false) ajouter(devs, 'devoirs', `${d.titre} — ${k === 'sujet' ? 'Sujet' : 'Correction'}`, d[k].fichier);
        }
    }
    if (devs.length) chapitres.push({ titre: 'Devoirs', description: '', emoji: '📝', docs: devs });
    return chapitres;
}

// ---------- copie figée d'un fichier et de tout ce dont il dépend
const copies = new Set();
const EXCLUS = /(^|\/)(index\.html|classe-[^/]*\.html)$/;   // pages de navigation du site : remplacées dans l'archive
function dependances(p, texte) {
    const dir = path.posix.dirname(p);
    const refs = new Set();
    const re = /(?:src|href|data-src|poster)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)["']?\s*\)|["'`]((?:\.\.\/|\.\/)?[^"'`\s<>]+?\.(?:html|png|jpe?g|gif|svg|webp|css|js|json|pdf|mp4|mp3|ggb))["'`]/gi;
    let m;
    while ((m = re.exec(texte))) {
        let u = (m[1] || m[2] || m[3] || '').trim();
        if (!u || /^(?:[a-z]+:|\/\/|#|data:|\$\{)/i.test(u) || u.includes('${')) continue;
        u = u.split(/[?#]/)[0];
        try { u = decodeURI(u); } catch (e) {}
        const cible = normaliser(u.startsWith('/') ? u.slice(1) : path.posix.join(dir, u));
        if (cible.startsWith('..')) continue;
        refs.add(cible);
    }
    return refs;
}
// Lien cassé à l'époque (ex. <img src="6-11.png"> alors que l'image est dans images/) :
// on cherche le fichier du même nom dans un sous-dossier images/ ou dans le dossier parent.
function trouverRemplacant(p) {
    const dir = path.posix.dirname(p), nom = path.posix.basename(p);
    for (const c of [`${dir}/images/${nom}`, `${path.posix.dirname(dir)}/images/${nom}`, `${path.posix.dirname(dir)}/${nom}`]) if (existe(c)) return c;
    return null;
}
function copier(p) {
    if (copies.has(p)) return;
    let source = p;
    if (!existe(p)) { source = trouverRemplacant(p); if (!source) return; }
    copies.add(p);
    const buf = lire(source);
    const dest = path.join(OUT, p);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    if (/\.(html?|css|js)$/i.test(p)) {
        for (const d of dependances(p, buf.toString('utf8'))) if (!EXCLUS.test(d)) copier(d);
    }
}

// ---------- pages générées
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS_COMMUN = `
:root{--fond:#f4f6fb;--carte:#fff;--texte:#1f2a44;--doux:#5b6785;--ligne:#dfe4ef;--accent:#3b5bdb;--accent2:#e8edff}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--fond);color:var(--texte);font:16px/1.5 "Segoe UI",system-ui,Arial,sans-serif;padding:0 16px 40px}
a{color:var(--accent)}
header.top{max-width:1100px;margin:0 auto;padding:22px 0 10px;display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between}
header.top h1{margin:0;font-size:28px}
.annee{color:var(--doux);font-weight:600}
.retour{font-size:14px;text-decoration:none}
main{max-width:1100px;margin:0 auto}
.note{color:var(--doux);font-size:14px;margin:0 0 14px}
`;

function pageLivre(n, chapitres, pdfNom) {
    const sommaire = chapitres.map((c, i) => `
        <li><a href="#ch${i + 1}">${esc(c.emoji)} ${esc(c.titre)}</a>
          <span class="mini">${c.docs.map((d, j) => `<a href="#ch${i + 1}-${j + 1}">${esc(d.titre)}</a>`).join(' · ')}</span></li>`).join('');
    const corps = chapitres.map((c, i) => `
    <section class="chapitre" id="ch${i + 1}">
      <h2>${c.titre === 'Devoirs' ? '' : `<span class="num">Chapitre ${i + 1}</span>`}${esc(c.emoji)} ${esc(c.titre)}</h2>
      ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ''}
      ${c.docs.map((d, j) => {
        const rel = path.posix.relative(`${n}°`, d.chemin).split('/').map(encodeURIComponent).join('/');
        const ouvert = d.categorie === 'cours';
        return `
      <details class="doc ${esc(d.categorie)}" id="ch${i + 1}-${j + 1}"${ouvert ? ' open' : ''}>
        <summary><span class="cat">${esc(CATEGORIES[d.categorie] || d.categorie)}</span> ${esc(d.titre)}
          <a class="ouvrir" href="${rel}" target="_blank" rel="noopener">Ouvrir seul ↗</a></summary>
        <iframe data-src="${rel}" title="${esc(c.titre + ' — ' + d.titre)}" loading="lazy" scrolling="no"></iframe>
      </details>`;
      }).join('')}
    </section>`).join('');
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mathématiques ${NOM_NIVEAU[n]} — ${ANNEE}</title>
<style>${CSS_COMMUN}
.outils{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-weight:600;font-size:14px;border:0;cursor:pointer}
.btn.clair{background:var(--accent2);color:var(--accent)}
nav.sommaire{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;padding:14px 18px;margin-bottom:22px}
nav.sommaire h2{margin:0 0 8px;font-size:18px}
nav.sommaire ol{margin:0;padding-left:22px;columns:2 320px;column-gap:28px}
nav.sommaire li{break-inside:avoid;margin:0 0 8px}
nav.sommaire li>a{font-weight:600;text-decoration:none}
.mini{display:block;font-size:13px;color:var(--doux)}
.mini a{color:var(--doux)}
section.chapitre{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;padding:16px 18px;margin:0 0 22px;scroll-margin-top:12px}
section.chapitre h2{margin:0 0 4px;font-size:22px}
.num{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--doux)}
.desc{margin:0 0 10px;color:var(--doux)}
details.doc{border-top:1px solid var(--ligne);padding:8px 0;scroll-margin-top:12px}
details.doc summary{cursor:pointer;font-weight:600;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.cat{font-size:12px;background:var(--accent2);color:var(--accent);border-radius:6px;padding:2px 8px}
.ouvrir{margin-left:auto;font-size:13px;font-weight:400}
details.doc iframe{display:block;width:100%;height:400px;border:0;margin-top:8px;background:#fff}
@media print{.outils,nav.sommaire,.ouvrir{display:none}body{background:#fff}}
</style>
</head>
<body>
<header class="top">
  <h1>Mathématiques ${NOM_NIVEAU[n]} <span class="annee">· ${ANNEE}</span></h1>
  <a class="retour" href="../index.html">← Années antérieures</a>
</header>
<main>
  <p class="note">Les cours, exercices et évaluations de l'année ${ANNEE}, tels qu'ils étaient en fin d'année.</p>
  <div class="outils">
    ${pdfNom ? `<a class="btn" href="${encodeURIComponent(pdfNom)}" target="_blank" rel="noopener">📄 Livre complet en PDF</a>` : ''}
    <button class="btn clair" type="button" id="toutOuvrir">Tout déplier</button>
    <button class="btn clair" type="button" id="toutFermer">Tout replier</button>
  </div>
  <nav class="sommaire"><h2>Sommaire</h2><ol>${sommaire}</ol></nav>
  ${corps}
</main>
<script>
(function () {
  // Charge un document quand on déplie sa rubrique, puis ajuste la hauteur à son contenu.
  function ajuster(f) {
    try {
      var d = f.contentDocument; if (!d) return;
      var h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0);
      if (h) f.style.height = (h + 8) + 'px';
    } catch (e) { f.style.height = '900px'; f.setAttribute('scrolling', 'yes'); }
  }
  function charger(det) {
    var f = det.querySelector('iframe');
    if (!f || f.src) return;
    f.addEventListener('load', function () {
      try {   // les liens « retour » du site n'ont pas de sens dans le livre
        Array.prototype.forEach.call(f.contentDocument.querySelectorAll('a[href]'), function (a) {
          if (/(^|\/)(classe-[^/]*|index)\.html$/.test(a.getAttribute('href').split(/[?#]/)[0])) a.style.display = 'none';
        });
      } catch (e) {}
      ajuster(f);
      try {
        var d = f.contentDocument;
        if (window.ResizeObserver) new ResizeObserver(function () { ajuster(f); }).observe(d.body);
        setTimeout(function () { ajuster(f); }, 800);
      } catch (e) {}
    });
    f.src = f.getAttribute('data-src');
  }
  var docs = Array.prototype.slice.call(document.querySelectorAll('details.doc'));
  docs.forEach(function (det) {
    if (det.open) charger(det);
    det.addEventListener('toggle', function () { if (det.open) charger(det); });
  });
  // Lien du sommaire vers un document replié : on le déplie
  function depuisAncre() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if (el && el.tagName === 'DETAILS') { el.open = true; charger(el); }
  }
  window.addEventListener('hashchange', depuisAncre); depuisAncre();
  document.getElementById('toutOuvrir').onclick = function () { docs.forEach(function (d) { d.open = true; charger(d); }); };
  document.getElementById('toutFermer').onclick = function () { docs.forEach(function (d) { d.open = false; }); };
})();
</script>
</body>
</html>
`;
}

function pageAnnee(niveaux) {
    const cartes = niveaux.map(({ n, chapitres, pdf }) => `
    <li class="carte">
      <a class="titre" href="${encodeURIComponent(n + '°')}/livre.html">${NOM_NIVEAU[n]}</a>
      <span class="info">${chapitres.filter(c => c.titre !== 'Devoirs').length} chapitres · ${chapitres.reduce((s, c) => s + c.docs.length, 0)} documents</span>
      <span class="liens"><a href="${encodeURIComponent(n + '°')}/livre.html">Ouvrir le livre</a>${pdf ? ` · <a href="${encodeURIComponent(n + '°')}/${encodeURIComponent(pdf)}" target="_blank" rel="noopener">PDF</a>` : ''}</span>
    </li>`).join('');
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mathématiques — ${ANNEE}</title>
<style>${CSS_COMMUN}
ul.niveaux{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.carte{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:4px}
.carte .titre{font-size:26px;font-weight:700;text-decoration:none}
.info{color:var(--doux);font-size:14px}
.liens{font-size:14px}
</style>
</head>
<body>
<header class="top"><h1>Année ${ANNEE}</h1><a class="retour" href="../index.html">← Années antérieures</a></header>
<main><ul class="niveaux">${cartes}</ul></main>
</body>
</html>
`;
}

function pageIndexGeneral(registre) {
    const annees = Object.keys(registre).sort().reverse();
    const lignes = annees.map(a => `
    <li class="carte">
      <a class="titre" href="${a}/index.html">${a}</a>
      <span class="liens">${registre[a].niveaux.map(n => `<a href="${a}/${encodeURIComponent(n + '°')}/livre.html">${NOM_NIVEAU[n]}</a>`).join(' · ')}</span>
    </li>`).join('');
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Années antérieures</title>
<style>${CSS_COMMUN}
ul.annees{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.carte{background:var(--carte);border:1px solid var(--ligne);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:6px}
.carte .titre{font-size:24px;font-weight:700;text-decoration:none}
.liens{font-size:15px}
</style>
</head>
<body>
<header class="top"><h1>📚 Années antérieures</h1><a class="retour" href="../index.html">← Accueil</a></header>
<main>
  <p class="note">Pour chaque année, un livre par niveau avec tous les cours, exercices et évaluations.</p>
  <ul class="annees">${lignes}</ul>
</main>
</body>
</html>
`;
}

// Pages de navigation d'origine (classe-Xe.html, index.html) : dans l'archive elles renvoient au livre
function redirection(vers) {
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${vers}"><title>Redirection</title></head><body><a href="${vers}">Ouvrir le livre</a></body></html>\n`;
}

// ---------- PDF (option --pdf) : impression de chaque document puis assemblage
async function fabriquerPdf(n, chapitres) {
    let chromium, PDFDocument;
    try { ({ chromium } = await import('playwright')); ({ PDFDocument } = await import('pdf-lib')); }
    catch (e) { console.warn('  ⚠ PDF ignoré : installer playwright et pdf-lib (npm i playwright pdf-lib)'); return null; }

    // petit serveur http sur l'archive (les animations ne s'impriment pas bien en file://)
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.json': 'application/json', '.pdf': 'application/pdf' };
    const impressionJs = fs.existsSync(path.join(ROOT, 'impression.js')) ? fs.readFileSync(path.join(ROOT, 'impression.js')) : null;
    const serveur = http.createServer((req, res) => {
        let u = decodeURIComponent(req.url.split('?')[0]);
        if (u === '/__impression.js' && impressionJs) { res.writeHead(200, { 'Content-Type': types['.js'] }); return res.end(impressionJs); }
        const f = path.join(OUT, u);
        if (!f.startsWith(OUT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(f).pipe(res);
    });
    await new Promise(r => serveur.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${serveur.address().port}/`;
    const navigateur = await chromium.launch();
    const livre = await PDFDocument.create();
    try {
        for (const c of chapitres) {
            for (const d of c.docs) {
                if (PAS_DANS_LE_PDF.has(d.categorie)) continue;
                const page = await navigateur.newPage({ viewport: { width: 1100, height: 900 } });
                try {
                    await page.goto(base + d.chemin.split('/').map(encodeURIComponent).join('/'), { waitUntil: 'networkidle', timeout: 60000 });
                    await page.waitForTimeout(800);
                    // animations terminées et réduites, comme le bouton « Imprimer » du site
                    const aDesAnimations = await page.evaluate(() => !!document.querySelector('iframe[src*="animations/"]'));
                    if (aDesAnimations && impressionJs) {
                        const dejaLa = await page.evaluate(() => !!document.getElementById('btnImprimerIORI'));
                        if (!dejaLa) { await page.addScriptTag({ url: base + '__impression.js' }); await page.waitForTimeout(300); }
                        await page.evaluate(() => { window.__imprime = false; window.print = () => { window.__imprime = true; }; });
                        const btn = await page.$('#btnImprimerIORI');
                        if (btn) { await btn.click(); await page.waitForFunction(() => window.__imprime, null, { timeout: 120000 }).catch(() => {}); }
                    }
                    await page.emulateMedia({ media: 'print' });
                    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
                    const doc = await PDFDocument.load(pdf);
                    (await livre.copyPages(doc, doc.getPageIndices())).forEach(p => livre.addPage(p));
                    console.log(`    PDF + ${d.chemin}`);
                } catch (e) {
                    console.warn(`    ⚠ PDF : ${d.chemin} ignoré (${e.message.split('\n')[0]})`);
                } finally { await page.close(); }
            }
        }
    } finally { await navigateur.close(); serveur.close(); }
    if (!livre.getPageCount()) return null;
    livre.setTitle(`Mathématiques ${NOM_NIVEAU[n]} — ${ANNEE}`);
    const nom = `livre-${NOM_NIVEAU[n]}-${ANNEE}.pdf`;
    fs.writeFileSync(path.join(OUT, `${n}°`, nom), await livre.save());
    return nom;
}

// ---------- programme principal
console.log(`Archivage ${ANNEE} à partir de ${REF} (${git(['log', '-1', '--format=%h du %cd', '--date=short', REF]).trim()})`);
const niveaux = [];
for (const n of NIVEAUX) {
    const chapitres = documentsDuNiveau(n);
    if (!chapitres || !chapitres.length) { console.log(`  ${NOM_NIVEAU[n]} : rien à archiver`); continue; }
    chapitres.forEach(c => c.docs.forEach(d => copier(d.chemin)));
    fs.mkdirSync(path.join(OUT, `${n}°`), { recursive: true });
    fs.writeFileSync(path.join(OUT, `${n}°`, `classe-${n}e.html`), redirection('livre.html'));
    const nbDocs = chapitres.reduce((s, c) => s + c.docs.length, 0);
    console.log(`  ${NOM_NIVEAU[n]} : ${chapitres.length} rubriques, ${nbDocs} documents`);
    niveaux.push({ n, chapitres, pdf: null });
}
if (!niveaux.length) { console.error('Aucun niveau trouvé : archive annulée.'); fs.rmSync(OUT, { recursive: true, force: true }); process.exit(1); }
fs.writeFileSync(path.join(OUT, 'index.html'), pageAnnee(niveaux));   // remplace un éventuel index.html du site

if (WITH_PDF) {
    for (const niv of niveaux) {
        console.log(`  PDF ${NOM_NIVEAU[niv.n]}…`);
        niv.pdf = await fabriquerPdf(niv.n, niv.chapitres);
    }
    fs.writeFileSync(path.join(OUT, 'index.html'), pageAnnee(niveaux));
}
for (const { n, chapitres, pdf } of niveaux) fs.writeFileSync(path.join(OUT, `${n}°`, 'livre.html'), pageLivre(n, chapitres, pdf));

// registre des années + page d'accueil des archives
const regFichier = path.join(OUT_BASE, 'annees.json');
const registre = fs.existsSync(regFichier) ? JSON.parse(fs.readFileSync(regFichier, 'utf8')) : {};
registre[ANNEE] = { ref: git(['rev-parse', '--short', REF]).trim(), niveaux: niveaux.map(x => x.n), archive_le: new Date().toISOString().slice(0, 10) };
fs.writeFileSync(regFichier, JSON.stringify(registre, null, 2) + '\n');
fs.writeFileSync(path.join(OUT_BASE, 'index.html'), pageIndexGeneral(registre));
console.log(`Terminé : ${path.relative(ROOT, OUT)} (${copies.size} fichiers copiés)`);

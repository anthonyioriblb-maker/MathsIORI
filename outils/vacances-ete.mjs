#!/usr/bin/env node
/* ===================================================================
   Premier jour des vacances d'été (académie de Reims)
   -------------------------------------------------------------------
   Utilisé par .github/workflows/archive-annuelle.yml : l'archivage de
   l'année se fait le premier jour des vacances d'été.
   Source : calendrier scolaire officiel (data.education.gouv.fr).
   Si le site ne répond pas : premier samedi de juillet.

   Affiche la date (AAAA-MM-JJ). Avec --aujourdhui, écrit aussi
   « archiver=true|false » dans $GITHUB_OUTPUT : true si on est le
   premier jour des vacances ou après (l'archive n'est jamais faite deux
   fois : le script d'archivage s'arrête si l'année existe déjà).
   =================================================================== */
import fs from 'node:fs';

const ACADEMIE = 'Reims';
const parisJour = d => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const aujourdhui = parisJour(new Date());
const annee = Number(aujourdhui.slice(0, 4));

function premierSamediDeJuillet(y) {
    const d = new Date(Date.UTC(y, 6, 1, 12));
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

async function depuisCalendrierOfficiel(y) {
    const url = new URL('https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records');
    url.searchParams.set('where', `location="${ACADEMIE}" and annee_scolaire="${y - 1}-${y}"`);
    url.searchParams.set('limit', '100');
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const ete = (data.results || []).filter(x => /[ée]t[ée]/i.test(x.description || '') && (!x.population || /élèves|-/i.test(x.population)));
    if (!ete.length) throw new Error('vacances d\'été introuvables');
    // start_date = veille au soir (ex. 2027-07-02T22:00:00+00:00) → jour à Paris = premier jour de vacances
    return ete.map(x => parisJour(new Date(x.start_date))).sort()[0];
}

let debut, source;
try { debut = await depuisCalendrierOfficiel(annee); source = 'calendrier officiel'; }
catch (e) { debut = premierSamediDeJuillet(annee); source = `repli premier samedi de juillet (${e.message})`; }

console.log(`Vacances d'été ${annee} (${ACADEMIE}) : ${debut} — ${source}. Aujourd'hui : ${aujourdhui}.`);
if (process.argv.includes('--aujourdhui')) {
    const archiver = aujourdhui >= debut;
    console.log(archiver ? '→ archivage' : '→ pas encore les vacances');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `archiver=${archiver}\n`);
}

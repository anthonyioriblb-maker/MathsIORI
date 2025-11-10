const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = 'pdfs';
const NIVEAUX = ['3°', '4°', '5°', '6°'];

// Fonction pour créer le dossier de sortie
function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

// Fonction pour obtenir tous les fichiers de cours (exclure les quiz et pages de classe)
function getCourseFiles(niveau = null) {
    const files = [];
    const niveauxToProcess = niveau ? [niveau] : NIVEAUX;

    for (const niv of niveauxToProcess) {
        if (!fs.existsSync(niv)) continue;

        const niveauFiles = fs.readdirSync(niv)
            .filter(file => {
                return file.endsWith('.html') &&
                       file.includes('chapitre') &&
                       !file.includes('quiz') &&
                       !file.includes('classe-') &&
                       !file.includes('exercice') &&
                       !file.includes('correction');
            })
            .map(file => ({
                niveau: niv,
                filename: file,
                fullPath: path.join(niv, file),
                outputName: `${niv.replace('°', 'e')}-${file.replace('.html', '.pdf')}`
            }));

        files.push(...niveauFiles);
    }

    return files;
}

// Fonction pour générer un PDF à partir d'un fichier HTML
async function generatePDF(browser, fileInfo) {
    const { fullPath, outputName } = fileInfo;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    console.log(`📄 Génération de ${outputName}...`);

    try {
        const page = await browser.newPage();

        // Charger le fichier HTML
        const absolutePath = path.resolve(fullPath);
        await page.goto(`file://${absolutePath}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Générer le PDF avec options optimisées
        await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            preferCSSPageSize: false
        });

        console.log(`✅ ${outputName} généré avec succès`);
        await page.close();
        return true;
    } catch (error) {
        console.error(`❌ Erreur lors de la génération de ${outputName}:`, error.message);
        return false;
    }
}

// Fonction principale
async function main() {
    const args = process.argv.slice(2);
    let niveau = null;

    // Parser les arguments
    if (args.includes('--niveau')) {
        const niveauIndex = args.indexOf('--niveau');
        const niveauValue = args[niveauIndex + 1];
        niveau = `${niveauValue}°`;
    }

    console.log('🚀 Démarrage de la génération de PDFs...\n');

    ensureOutputDir();

    // Obtenir la liste des fichiers à convertir
    const files = getCourseFiles(niveau);

    if (files.length === 0) {
        console.log('⚠️  Aucun fichier de cours trouvé.');
        return;
    }

    console.log(`📚 ${files.length} cours trouvés à convertir\n`);

    // Lancer Puppeteer
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let successCount = 0;
    let failureCount = 0;

    // Générer les PDFs
    for (const file of files) {
        const success = await generatePDF(browser, file);
        if (success) {
            successCount++;
        } else {
            failureCount++;
        }
    }

    await browser.close();

    console.log('\n📊 Résumé:');
    console.log(`   ✅ ${successCount} PDF(s) généré(s) avec succès`);
    if (failureCount > 0) {
        console.log(`   ❌ ${failureCount} échec(s)`);
    }
    console.log(`\n📁 Les PDFs sont disponibles dans le dossier: ${OUTPUT_DIR}/`);
}

// Point d'entrée
main().catch(console.error);

// Script commun pour toutes les pages classe-*.html
// Génération automatique des chapitres depuis la configuration

// La configuration des chapitres doit être définie avant d'inclure ce script
// via une variable globale : window.configChapitres

document.addEventListener('DOMContentLoaded', function() {
    console.log('[classe-page.js] Script chargé');

    if (typeof configChapitres === 'undefined') {
        console.error('Configuration des chapitres non trouvée. Définissez window.configChapitres avant d\'inclure ce script.');
        return;
    }

    console.log('[classe-page.js] Configuration trouvée:', configChapitres);

    const container = document.getElementById('chaptersContainer');

    if (!container) {
        console.error('Element #chaptersContainer non trouvé dans la page.');
        return;
    }

    // Filtrer uniquement les chapitres disponibles
    const chapitresDisponibles = Object.keys(configChapitres).filter(key => configChapitres[key].disponible);

    chapitresDisponibles.forEach((key, index) => {
        const chapitre = configChapitres[key];
        const chapitreNum = index + 1;

        // Créer l'élément du chapitre
        const card = document.createElement('div');
        card.className = 'chapter-card';

        // Bouton cours (ne pas afficher si inactif et fichier vide)
        let coursBtn = '';
        if (chapitre.cours.actif) {
            coursBtn = `<a href="${chapitre.cours.fichier}" class="action-button cours">📖 Cours</a>`;
        } else if (chapitre.cours.fichier) {
            coursBtn = `<span class="action-button cours disabled">📖 Cours</span>`;
        }

        // Menu déroulant exercices ou activité (pour Scratch)
        let exercicesBtn = '';
        if (chapitre.activite) {
            // Mode Scratch : bouton Activité
            if (chapitre.activite.actif) {
                console.log('[classe-page.js] Génération lien activité:', chapitre.activite.fichier);
                exercicesBtn = `<a href="${chapitre.activite.fichier}" class="action-button exercices">🎨 Activité</a>`;
            } else {
                exercicesBtn = `<span class="action-button exercices disabled">🎨 Activité</span>`;
            }
        } else if (chapitre.exercices && chapitre.exercices.actif && chapitre.exercices.items.length > 0) {
            const exercicesItems = chapitre.exercices.items.map(exo =>
                `<a href="${exo.fichier}" class="dropdown-item exercices-item">✏️ ${exo.titre}</a>`
            ).join('');

            exercicesBtn = `
                <div class="dropdown-wrapper">
                    <button class="action-button exercices">
                        ✏️ Exercices <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        ${exercicesItems}
                    </div>
                </div>
            `;
        } else if (chapitre.exercices) {
            exercicesBtn = `<span class="action-button exercices disabled">✏️ Exercices</span>`;
        }

        // Menu déroulant quiz ou correction (pour Scratch)
        let quizBtn = '';
        if (chapitre.correction) {
            // Mode Scratch : bouton Correction
            if (chapitre.correction.actif) {
                quizBtn = `<a href="${chapitre.correction.fichier}" class="action-button quiz">✅ Correction</a>`;
            } else {
                quizBtn = `<span class="action-button quiz disabled">✅ Correction</span>`;
            }
        } else if (chapitre.quiz && chapitre.quiz.actif && chapitre.quiz.items.length > 0) {
            const quizItems = chapitre.quiz.items.map(q =>
                `<a href="${q.fichier}" class="dropdown-item quiz-item">🎯 ${q.titre}</a>`
            ).join('');

            quizBtn = `
                <div class="dropdown-wrapper">
                    <button class="action-button quiz">
                        🎯 Quiz <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        ${quizItems}
                    </div>
                </div>
            `;
        } else if (chapitre.quiz) {
            quizBtn = `<span class="action-button quiz disabled">🎯 Quiz</span>`;
        }

        card.innerHTML = `
            <div class="chapter-number">${chapitreNum}</div>
            <div class="chapter-header">
                <div class="chapter-title">
                    <span class="emoji">${chapitre.emoji}</span>${chapitre.titre}
                </div>
                <div class="chapter-desc">${chapitre.description}</div>
            </div>
            <div class="chapter-actions">
                ${coursBtn}
                ${exercicesBtn}
                ${quizBtn}
            </div>
        `;

        container.appendChild(card);
    });
});

/**
 * Visitor Counter with Firebase Realtime Database
 * Global visitor counting with real-time updates
 */

class VisitorCounter {
    constructor() {
        this.elementId = 'visitor-count';
        this.firebaseInitialized = false;
        this.db = null;
        this.counterRef = null;
        this.lastVisitKey = 'mathsiori_derniere_visite_comptee';
        this.delaiMs = 2 * 60 * 60 * 1000; // une nouvelle visite n'est comptée qu'après 2 heures
    }

    /**
     * Vrai si ce navigateur a déjà été compté il y a moins de 2 heures
     */
    dejaCompte() {
        try {
            const derniere = parseInt(localStorage.getItem(this.lastVisitKey), 10);
            return !isNaN(derniere) && (Date.now() - derniere) < this.delaiMs;
        } catch (e) {
            return false;
        }
    }

    /**
     * Mémorise l'heure de la visite comptée
     */
    marquerCompte() {
        try {
            localStorage.setItem(this.lastVisitKey, Date.now().toString());
        } catch (e) {}
    }

    /**
     * Initialize the counter - try Firebase, fallback to localStorage
     */
    async init() {
        // Check if Firebase is configured
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
            try {
                // Check if config is filled
                if (firebaseConfig.apiKey !== 'VOTRE_API_KEY') {
                    await this.initFirebase();
                    return;
                }
            } catch (error) {
                console.error('Erreur Firebase:', error);
            }
        }

        // Fallback to localStorage
        console.log('Firebase non configuré, utilisation du compteur local');
        this.useLocalStorage();
    }

    /**
     * Initialize Firebase and set up the counter
     */
    async initFirebase() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.database();
            this.counterRef = this.db.ref('visitors/count');

            // Listen for real-time updates
            this.counterRef.on('value', (snapshot) => {
                const count = snapshot.val() || 0;
                this.displayCount(count);
            });

            // Increment counter on visit
            await this.incrementFirebaseCounter();

            this.firebaseInitialized = true;
        } catch (error) {
            console.error('Erreur initialisation Firebase:', error);
            throw error;
        }
    }

    /**
     * Increment the Firebase counter (au plus une fois toutes les 2 heures par navigateur)
     */
    async incrementFirebaseCounter() {
        try {
            // Compté seulement si la dernière visite comptée date de plus de 2 heures
            if (!this.dejaCompte()) {
                // Use transaction to safely increment
                await this.counterRef.transaction((currentCount) => {
                    return (currentCount || 0) + 1;
                });

                this.marquerCompte();
            } else {
                console.log('Visiteur déjà compté il y a moins de 2 heures');
            }
        } catch (error) {
            console.error('Erreur incrémentation Firebase:', error);
        }
    }

    /**
     * Use localStorage for counting (fallback method)
     */
    useLocalStorage() {
        const storageKey = 'mathsiori_visits';

        // Get current count
        let count = 0;
        try { count = parseInt(localStorage.getItem(storageKey)) || 0; } catch (e) {}

        // Compté seulement si la dernière visite comptée date de plus de 2 heures
        if (!this.dejaCompte()) {
            count++;
            try { localStorage.setItem(storageKey, count.toString()); } catch (e) {}
            this.marquerCompte();
        } else {
            console.log('Visiteur déjà compté il y a moins de 2 heures');
        }

        // Display count
        this.displayCount(count);

        // Add indicator that this is local count
        this.addLocalIndicator();
    }

    /**
     * Display the visitor count on the page
     * @param {number} count - The visitor count to display
     */
    displayCount(count) {
        const element = document.getElementById(this.elementId);
        if (element) {
            element.textContent = this.formatNumber(count);
            element.classList.add('loaded');

            // Remove loading animation
            element.style.animation = 'none';
        }
    }

    /**
     * Add a small indicator that this is a local count
     */
    addLocalIndicator() {
        const element = document.getElementById(this.elementId);
        if (element && element.parentElement) {
            const label = element.parentElement.previousElementSibling;
            if (label && !label.textContent.includes('*')) {
                label.textContent += ' *';
                label.title = 'Compteur local (ce navigateur uniquement)';
                label.style.cursor = 'help';
            }
        }
    }

    /**
     * Format number with thousands separator
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return num.toLocaleString('fr-FR');
    }

    /**
     * Clean up Firebase listeners
     */
    destroy() {
        if (this.counterRef) {
            this.counterRef.off();
        }
    }
}

// Initialize counter when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const counter = new VisitorCounter();
    counter.init();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.visitorCounter) {
        window.visitorCounter.destroy();
    }
});

/**
 * Visitor Counter - Multi-method approach
 * Tries multiple counting services, falls back to localStorage
 */

class VisitorCounter {
    constructor() {
        this.elementId = 'visitor-count';
        this.storageKey = 'mathsiori_visits';

        // Multiple API endpoints to try
        this.apiEndpoints = [
            'https://api.countapi.xyz/hit/mathsiori.github.io/visits',
            'https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=mathsiori.github.io&count_bg=%23764BA2&title_bg=%23667EEA',
        ];
    }

    /**
     * Initialize the counter - try APIs then fallback to localStorage
     */
    async init() {
        try {
            // Try to fetch from APIs
            const count = await this.fetchFromApis();
            if (count !== null) {
                this.displayCount(count);
                return;
            }
        } catch (error) {
            console.log('API non disponible, utilisation du compteur local');
        }

        // Fallback to localStorage
        this.useLocalStorage();
    }

    /**
     * Try multiple APIs in sequence
     * @returns {Promise<number|null>} The visitor count or null if all fail
     */
    async fetchFromApis() {
        for (const url of this.apiEndpoints) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });

                if (response.ok) {
                    const text = await response.text();

                    // Try to parse as JSON
                    try {
                        const data = JSON.parse(text);
                        if (data.value || data.count) {
                            return data.value || data.count;
                        }
                    } catch {
                        // Not JSON, try to extract number from SVG or text
                        const match = text.match(/\d+/);
                        if (match) {
                            return parseInt(match[0]);
                        }
                    }
                }
            } catch (error) {
                // Try next API
                continue;
            }
        }

        return null;
    }

    /**
     * Use localStorage for counting (fallback method)
     */
    useLocalStorage() {
        // Get current count
        let count = parseInt(localStorage.getItem(this.storageKey)) || 0;

        // Increment count
        count++;

        // Save back to localStorage
        localStorage.setItem(this.storageKey, count.toString());

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
}

// Initialize counter when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const counter = new VisitorCounter();
    counter.init();
});

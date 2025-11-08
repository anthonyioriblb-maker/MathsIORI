/**
 * Visitor Counter using CountAPI
 * Free visitor counting service - no registration required
 */

class VisitorCounter {
    constructor(namespace = 'mathsiori', key = 'visits') {
        this.apiUrl = `https://countapi.mileshilliard.com/api/v1/hit/${namespace}/${key}`;
        this.elementId = 'visitor-count';
    }

    /**
     * Initialize the counter - fetch and display visitor count
     */
    async init() {
        try {
            const count = await this.fetchCount();
            this.displayCount(count);
        } catch (error) {
            console.error('Erreur lors du chargement du compteur:', error);
            this.displayError();
        }
    }

    /**
     * Fetch the current visitor count from API
     * @returns {Promise<number>} The visitor count
     */
    async fetchCount() {
        const response = await fetch(this.apiUrl);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.count || 0;
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
     * Display an error message if counter fails to load
     */
    displayError() {
        const element = document.getElementById(this.elementId);
        if (element) {
            element.textContent = '---';
            element.classList.add('error');
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

/**
 * DebugManager Class
 * Handles debug functionality and testing tools
 */
class DebugManager {
    constructor(currencyManager = null) {
        this.currencyManager = currencyManager;
        
        // Use the global DisplayUtils instance
        this.displayUtils = DisplayUtils_Instance;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Currency cheat buttons
        const add1kBtn = document.getElementById('debug-add-1k');
        const add10kBtn = document.getElementById('debug-add-10k');
        const add100kBtn = document.getElementById('debug-add-100k');
        const add1mBtn = document.getElementById('debug-add-1m');
        const add1e100Btn = document.getElementById('debug-add-1e100');
        const doubleCoinsBtn = document.getElementById('debug-double-coins');
        const resetBtn = document.getElementById('debug-reset');
        const resetStreakBtn = document.getElementById('debug-reset-streak');

        if (add1kBtn) add1kBtn.addEventListener('click', () => this.addCurrency(1000));
        if (add10kBtn) add10kBtn.addEventListener('click', () => this.addCurrency(10000));
        if (add100kBtn) add100kBtn.addEventListener('click', () => this.addCurrency(100000));
        if (add1mBtn) add1mBtn.addEventListener('click', () => this.addCurrency(1000000));
        if (add1e100Btn) add1e100Btn.addEventListener('click', () => this.addCurrency(1e100));
        if (doubleCoinsBtn) doubleCoinsBtn.addEventListener('click', () => this.doubleCoins());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());
        if (resetStreakBtn) resetStreakBtn.addEventListener('click', () => this.resetStreak());

        // Forced outcome buttons
        const forceHeadsBtn = document.getElementById('debug-force-heads');
        const forceTailsBtn = document.getElementById('debug-force-tails');
        const forceEdgeBtn = document.getElementById('debug-force-edge');

        if (forceHeadsBtn) forceHeadsBtn.addEventListener('click', () => this.forceOutcome('heads'));
        if (forceTailsBtn) forceTailsBtn.addEventListener('click', () => this.forceOutcome('tails'));
        if (forceEdgeBtn) forceEdgeBtn.addEventListener('click', () => this.forceOutcome('edge'));
    }

    /**
     * Add currency for testing purposes
     * @param {number} amount - Amount of currency to add
     */
    addCurrency(amount) {
        if (!this.currencyManager) {
            console.warn('Currency manager not available');
            return;
        }

        this.currencyManager.addCurrency(amount);
        this.showMessage(`Added ${this.displayUtils.formatCurrency(amount)} currency!`, 'success');
        console.log(`Debug: Added ${amount} currency`);
    }

    /**
     * Double the current currency amount
     */
    doubleCoins() {
        if (!this.currencyManager) {
            console.warn('Currency manager not available');
            return;
        }

        const currentCurrency = this.currencyManager.getCurrency();
        
        if (currentCurrency === 0) {
            this.showMessage('No coins to double! Add some coins first.', 'warning');
            return;
        }

        // Add the current amount to effectively double it
        this.currencyManager.addCurrency(currentCurrency);
        this.showMessage(`Doubled coins! Now have ${this.displayUtils.formatCurrency(currentCurrency * 2)} currency!`, 'success');
        console.log(`Debug: Doubled currency from ${currentCurrency} to ${currentCurrency * 2}`);
    }

        /**
     * Force a specific coin flip outcome
     * @param {string} outcome - The outcome to force ('heads', 'tails', 'edge')
     */
    forceOutcome(outcome) {
        if (!window.coinFlipper) {
            this.showMessage('Coin flipper not available!', 'error');
            return;
        }

        if (window.coinFlipper.isFlipping) {
            this.showMessage('Coin is already flipping!', 'warning');
            return;
        }

        window.coinFlipper.forceFlip(outcome);
        this.showMessage(`Forced ${outcome.toUpperCase()} outcome!`, 'success');
        console.log(`Debug: Forced ${outcome} outcome`);
    }

    /**
     * Reset the entire game
     */
    resetGame() {
        const confirmed = confirm('Are you sure you want to reset all game progress? This cannot be undone!');
        
        if (confirmed) {
            // Reset currency and streaks
            if (this.currencyManager) {
                this.currencyManager.setCurrency(0);
                this.currencyManager.setTotalEarned(0);
                // Reset all coin streaks
                this.currencyManager.coinStreaks = [];
                this.currencyManager.updateDisplay();
            }

            // Reset upgrades (if upgrade manager is available)
            if (window.upgradeManager) {
                const resetState = {
                    coinValue: { level: 0 },
                    coinMultiplier: { level: 0 },
                    edgeMultiplier: { level: 0 },
                    autoFlipper: { level: 0 }
                };
                window.upgradeManager.setState(resetState);
            }

            // Reset coin flipper stats (if coin flipper is available)
            if (window.coinFlipper) {
                window.coinFlipper.resetStats();
            }

            this.showMessage('Game reset successfully!', 'warning');
            console.log('Debug: Game reset');
        }
    }

    /**
     * Reset all coin streaks for testing purposes
     */
    resetStreak() {
        if (!this.currencyManager) {
            this.showMessage('Currency manager not available!', 'error');
            return;
        }

        this.currencyManager.coinStreaks = [];
        this.currencyManager.updateDisplay();
        this.showMessage('All coin streaks reset!', 'success');
        console.log('Debug: All coin streaks reset');
    }

    /**
     * Show a temporary message to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of message (success, warning, error)
     */
    showMessage(message, type = 'success') {
        // Create message element if it doesn't exist
        let messageEl = document.getElementById('debug-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'debug-message';
            messageEl.className = 'debug-message';
            document.body.appendChild(messageEl);
        }

        // Set message content and type
        messageEl.textContent = message;
        messageEl.className = `debug-message debug-message-${type}`;
        messageEl.style.display = 'block';

        // Hide message after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }

    /**
     * Format currency for display (deprecated - use DisplayUtils directly)
     * @deprecated Use DisplayUtils_Instance.formatCurrency() instead
     * @param {number} amount - Amount to format
     * @returns {string} - Formatted currency string
     */
    formatCurrency(amount) {
        return this.displayUtils.formatCurrency(amount);
    }

    /**
     * Get debug information about the current game state
     * @returns {object} - Debug information object
     */
    getDebugInfo() {
        const info = {
            timestamp: new Date().toISOString(),
            currency: this.currencyManager ? this.currencyManager.getCurrency() : 0,
            totalEarned: this.currencyManager ? this.currencyManager.getTotalEarned() : 0,
            streaks: this.currencyManager ? this.currencyManager.getAllStreakInfo() : { streaks: [], totalCoins: 0, activeStreaks: 0 },
            upgrades: window.upgradeManager ? window.upgradeManager.getState() : {},
            stats: window.coinFlipper ? window.coinFlipper.getStats() : {}
        };

        console.log('Debug Info:', info);
        return info;
    }

    /**
     * Export game state for debugging
     * @returns {string} - JSON string of game state
     */
    exportGameState() {
        const state = this.getDebugInfo();
        const jsonString = JSON.stringify(state, null, 2);
        console.log('Exported Game State:', jsonString);
        return jsonString;
    }
} 
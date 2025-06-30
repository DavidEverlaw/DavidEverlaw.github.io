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

        // Save/Load buttons
        const saveGameBtn = document.getElementById('debug-save-game');
        const loadGameBtn = document.getElementById('debug-load-game');
        const exportSaveBtn = document.getElementById('debug-export-save');
        const importSaveBtn = document.getElementById('debug-import-save');
        const deleteSaveBtn = document.getElementById('debug-delete-save');

        if (saveGameBtn) saveGameBtn.addEventListener('click', () => this.saveGame());
        if (loadGameBtn) loadGameBtn.addEventListener('click', () => this.loadGame());
        if (exportSaveBtn) exportSaveBtn.addEventListener('click', () => this.exportSave());
        if (importSaveBtn) importSaveBtn.addEventListener('click', () => this.importSave());
        if (deleteSaveBtn) deleteSaveBtn.addEventListener('click', () => this.deleteSave());
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
     * Reset the entire game (including prestige data)
     */
    async resetGame() {
        const message = 'This will reset ALL progress including:\n' +
                       '• All currency and upgrades\n' +
                       '• All prestige levels and points\n' +
                       '• All statistics\n\n' +
                       'This action cannot be undone!';

        const confirmed = await DisplayUtils_Instance.showConfirmDialog('Complete Game Reset', message);
        
        if (confirmed) {
            // Reset prestige data first
            if (window.prestigeManager) {
                const resetPrestigeState = {
                    prestigeLevel: 0,
                    prestigePoints: 0,
                    totalPrestigePoints: 0,
                    prestigeCount: 0,
                    coinBonus: { level: 0 },
                    flipSpeed: { level: 0 },
                    edgeBonus: { level: 0 },
                    upgradeDiscount: { level: 0 },
                    startingBonus: { level: 0 },
                    autoFlipBonus: { level: 0 }
                };
                window.prestigeManager.setState(resetPrestigeState);
            }

            // Perform the standard prestige reset (which resets everything else)
            if (window.prestigeManager) {
                window.prestigeManager.performPrestigeReset();
            } else {
                // Fallback if prestige manager isn't available
                this.performStandardReset();
            }

            // Clear save data using save manager
            if (window.saveManager) {
                window.saveManager.deleteSave();
            }

            // Clear any other localStorage data (fallback)
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('coinFlipIdle') && key !== 'coinFlipIdleSettings') {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
            }

            this.showMessage('Complete game reset performed! Everything has been wiped clean.', 'warning');
            console.log('Debug: Complete game reset (including prestige) performed');
        }
    }

    /**
     * Perform standard reset (used as fallback)
     */
    performStandardReset() {
        // Stop all auto-flippers first to clear intervals
        if (window.upgradeManager) {
            window.upgradeManager.stopAllAutoFlippers();
        }

        // Reset currency and streaks
        if (this.currencyManager) {
            this.currencyManager.setCurrency(0);
            this.currencyManager.setTotalEarned(0);
            this.currencyManager.coinStreaks = [];
            this.currencyManager.updateDisplay();
        }

        // Reset upgrades completely
        if (window.upgradeManager) {
            const resetState = {
                coinValue: { level: 0 },
                coinMultiplier: { level: 0 },
                edgeMultiplier: { level: 0 },
                autoFlipper: { level: 0 },
                additionalCoins: { level: 0 },
                headsChance: { level: 0 },
                edgeChance: { level: 0 },
                streakMultiplier: { level: 0 },
                streakLength: { level: 0 },
                doubleValueChance: { level: 0 },
                autoFlipperCount: { level: 0 }
            };
            window.upgradeManager.setState(resetState);
            
            window.upgradeManager.autoFlipIntervals = [];
            window.upgradeManager.coinAutoFlipperStates = [];
            window.upgradeManager.hideAllAutoFlipperIndicators();
        }

        // Reset coin flipper stats and states
        if (window.coinFlipper) {
            window.coinFlipper.resetStats();
            window.coinFlipper.coinFlipStates = [];
            window.coinFlipper.isFlipping = false;
            
            if (window.coinFlipper.multiCoinVisualizer) {
                const coinResults = document.querySelectorAll('.coin-result');
                coinResults.forEach(result => {
                    if (result.hideTimeout) {
                        clearTimeout(result.hideTimeout);
                        result.hideTimeout = null;
                    }
                    result.style.display = 'none';
                    result.textContent = '';
                    result.className = 'coin-result';
                });
                
                if (window.coinFlipper.multiCoinVisualizer.resizeTimeout) {
                    clearTimeout(window.coinFlipper.multiCoinVisualizer.resizeTimeout);
                    window.coinFlipper.multiCoinVisualizer.resizeTimeout = null;
                }
                
                window.coinFlipper.multiCoinVisualizer.coinStates = [];
                window.coinFlipper.multiCoinVisualizer.currentCoinCount = 0;
                
                const coins = document.querySelectorAll('.multi-coin .coin');
                coins.forEach(coin => {
                    coin.style.transition = 'none';
                    coin.style.transform = 'rotateY(0deg)';
                });
                
                const coinTimers = document.querySelectorAll('.coin-timer');
                coinTimers.forEach(timer => {
                    timer.style.display = 'none';
                    timer.textContent = '';
                });
                
                window.coinFlipper.multiCoinVisualizer.updateCoinDisplay();
            }
            
            window.coinFlipper.resetCoinPosition();
        }

        // Force update all displays
        if (this.currencyManager) {
            this.currencyManager.updateDisplay();
        }
        if (window.upgradeManager) {
            window.upgradeManager.updateDisplay();
        }
        if (window.coinFlipper) {
            window.coinFlipper.updateStats();
        }
        if (window.prestigeManager) {
            window.prestigeManager.updateDisplay();
        }
        
        // Re-initialize auto-flipper system after all displays are updated
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
            if (window.upgradeManager) {
                console.log('Debug: Re-initializing auto-flipper system after reset');
                window.upgradeManager.updateAutoFlipper();
            }
        }, 100);
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

    /**
     * Manually save the game
     */
    saveGame() {
        if (!window.saveManager) {
            this.showMessage('Save manager not available!', 'error');
            return;
        }

        window.saveManager.saveGame();
        this.showMessage('Game saved manually!', 'success');
        console.log('Debug: Manual save performed');
    }

    /**
     * Manually load the game
     */
    loadGame() {
        if (!window.saveManager) {
            this.showMessage('Save manager not available!', 'error');
            return;
        }

        const success = window.saveManager.loadGame();
        if (success) {
            this.showMessage('Game loaded successfully!', 'success');
            console.log('Debug: Manual load performed');
        } else {
            this.showMessage('No save data found!', 'warning');
        }
    }

    /**
     * Export save data to clipboard
     */
    async exportSave() {
        if (!window.saveManager) {
            this.showMessage('Save manager not available!', 'error');
            return;
        }

        const saveData = window.saveManager.exportSave();
        if (!saveData) {
            this.showMessage('Failed to export save data!', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(saveData);
            this.showMessage('Save data copied to clipboard!', 'success');
            console.log('Debug: Save data exported to clipboard');
        } catch (error) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = saveData;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showMessage('Save data copied to clipboard!', 'success');
                console.log('Debug: Save data exported to clipboard (fallback)');
            } catch (fallbackError) {
                this.showMessage('Failed to copy to clipboard. Check console for save data.', 'warning');
                console.log('Save Data:', saveData);
            }
            document.body.removeChild(textArea);
        }
    }

    /**
     * Import save data from clipboard
     */
    async importSave() {
        if (!window.saveManager) {
            this.showMessage('Save manager not available!', 'error');
            return;
        }

        let saveData;
        try {
            saveData = await navigator.clipboard.readText();
        } catch (error) {
            // Fallback: prompt user to paste data
            saveData = prompt('Paste your save data here:');
            if (!saveData) {
                this.showMessage('Import cancelled.', 'warning');
                return;
            }
        }

        const success = window.saveManager.importSave(saveData);
        if (success) {
            this.showMessage('Save data imported successfully!', 'success');
            console.log('Debug: Save data imported');
        } else {
            this.showMessage('Failed to import save data! Check format.', 'error');
        }
    }

    /**
     * Delete save data
     */
    async deleteSave() {
        if (!window.saveManager) {
            this.showMessage('Save manager not available!', 'error');
            return;
        }

        const confirmed = await this.displayUtils.showConfirmDialog(
            'Delete Save Data',
            'Are you sure you want to delete your save data?\n\nThis action cannot be undone!'
        );

        if (confirmed) {
            window.saveManager.deleteSave();
            this.showMessage('Save data deleted!', 'warning');
            console.log('Debug: Save data deleted');
        }
    }
} 
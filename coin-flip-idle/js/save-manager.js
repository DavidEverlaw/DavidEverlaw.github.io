/**
 * SaveManager Class
 * Handles automatic saving and loading of game state
 */
class SaveManager {
    constructor() {
        this.saveKey = 'coinFlipIdleSave';
        this.autoSaveInterval = null;
        this.autoSaveDelay = 5000; // Auto-save every 5 seconds
        this.lastSaveTime = 0;
        
        // References to game managers (will be set by Game class)
        this.currencyManager = null;
        this.upgradeManager = null;
        this.prestigeManager = null;
        this.coinFlipper = null;
        this.settingsManager = null;
        
        console.log('SaveManager initialized');
    }

    /**
     * Set references to game managers
     * @param {object} managers - Object containing all game manager references
     */
    setManagers(managers) {
        this.currencyManager = managers.currencyManager;
        this.upgradeManager = managers.upgradeManager;
        this.prestigeManager = managers.prestigeManager;
        this.coinFlipper = managers.coinFlipper;
        this.settingsManager = managers.settingsManager;
        
        console.log('SaveManager: Game manager references set');
    }

    /**
     * Start auto-saving
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, this.autoSaveDelay);
        
        console.log(`SaveManager: Auto-save started (every ${this.autoSaveDelay / 1000} seconds)`);
    }

    /**
     * Stop auto-saving
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        console.log('SaveManager: Auto-save stopped');
    }

    /**
     * Save the complete game state
     */
    saveGame() {
        try {
            const gameState = this.getGameState();
            localStorage.setItem(this.saveKey, JSON.stringify(gameState));
            this.lastSaveTime = Date.now();
            
            console.log('Game saved successfully');
            this.showSaveIndicator();
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showSaveError();
        }
    }

    /**
     * Load the complete game state
     * @returns {boolean} - Whether loading was successful
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) {
                console.log('No save data found');
                return false;
            }
            
            const gameState = JSON.parse(savedData);
            this.setGameState(gameState);
            
            console.log('Game loaded successfully');
            this.showLoadIndicator();
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            this.showLoadError();
            return false;
        }
    }

    /**
     * Get the complete game state
     * @returns {object} - Complete game state object
     */
    getGameState() {
        const gameState = {
            version: '1.0.0',
            timestamp: Date.now(),
            currency: null,
            upgrades: null,
            prestige: null,
            stats: null,
            settings: null
        };

        // Save currency manager state
        if (this.currencyManager) {
            gameState.currency = this.currencyManager.getState();
        }

        // Save upgrade manager state
        if (this.upgradeManager) {
            gameState.upgrades = this.upgradeManager.getState();
        }

        // Save prestige manager state
        if (this.prestigeManager) {
            gameState.prestige = this.prestigeManager.getState();
        }

        // Save coin flipper stats
        if (this.coinFlipper) {
            gameState.stats = this.coinFlipper.getStats();
        }

        // Save settings
        if (this.settingsManager) {
            gameState.settings = this.settingsManager.getSettings();
        }

        return gameState;
    }

    /**
     * Set the complete game state
     * @param {object} gameState - Complete game state object
     */
    setGameState(gameState) {
        // Load currency manager state
        if (gameState.currency && this.currencyManager) {
            this.currencyManager.setState(gameState.currency);
        }

        // Load upgrade manager state
        if (gameState.upgrades && this.upgradeManager) {
            this.upgradeManager.setState(gameState.upgrades);
        }

        // Load prestige manager state
        if (gameState.prestige && this.prestigeManager) {
            this.prestigeManager.setState(gameState.prestige);
        }

        // Load coin flipper stats
        if (gameState.stats && this.coinFlipper) {
            this.coinFlipper.stats = {
                totalFlips: gameState.stats.totalFlips || 0,
                heads: gameState.stats.heads || 0,
                tails: gameState.stats.tails || 0,
                edge: gameState.stats.edge || 0
            };
            this.coinFlipper.updateStats();
        }

        // Load settings
        if (gameState.settings && this.settingsManager) {
            Object.assign(this.settingsManager.settings, gameState.settings);
            this.settingsManager.updateUI();
            this.settingsManager.applySettings();
        }

        console.log('Game state loaded from save data');
    }

    /**
     * Check if save data exists
     * @returns {boolean} - Whether save data exists
     */
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    /**
     * Delete save data
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Save data deleted');
            this.showDeleteIndicator();
        } catch (error) {
            console.error('Failed to delete save data:', error);
        }
    }

    /**
     * Export save data as JSON string
     * @returns {string} - JSON string of save data
     */
    exportSave() {
        try {
            const gameState = this.getGameState();
            return JSON.stringify(gameState, null, 2);
        } catch (error) {
            console.error('Failed to export save:', error);
            return null;
        }
    }

    /**
     * Import save data from JSON string
     * @param {string} saveData - JSON string of save data
     * @returns {boolean} - Whether import was successful
     */
    importSave(saveData) {
        try {
            const gameState = JSON.parse(saveData);
            this.setGameState(gameState);
            this.saveGame(); // Save the imported data
            console.log('Save data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }

    /**
     * Show a brief save indicator
     */
    showSaveIndicator() {
        this.showIndicator('Game Saved', 'save-indicator');
    }

    /**
     * Show a brief load indicator
     */
    showLoadIndicator() {
        this.showIndicator('Game Loaded', 'load-indicator');
    }

    /**
     * Show a brief delete indicator
     */
    showDeleteIndicator() {
        this.showIndicator('Save Deleted', 'delete-indicator');
    }

    /**
     * Show a save error indicator
     */
    showSaveError() {
        this.showIndicator('Save Failed!', 'error-indicator');
    }

    /**
     * Show a load error indicator
     */
    showLoadError() {
        this.showIndicator('Load Failed!', 'error-indicator');
    }

    /**
     * Show a temporary indicator message
     * @param {string} message - The message to show
     * @param {string} className - CSS class for styling
     */
    showIndicator(message, className) {
        // Remove any existing indicator
        const existingIndicator = document.getElementById('save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.className = `save-indicator ${className}`;
        indicator.textContent = message;
        
        // Style the indicator
        indicator.style.position = 'fixed';
        indicator.style.top = '20px';
        indicator.style.right = '20px';
        indicator.style.padding = '10px 15px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontSize = '14px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '10000';
        indicator.style.transition = 'opacity 0.3s ease';
        
        // Set colors based on type
        if (className.includes('error')) {
            indicator.style.backgroundColor = '#ff4444';
            indicator.style.color = 'white';
        } else {
            indicator.style.backgroundColor = '#4CAF50';
            indicator.style.color = 'white';
        }
        
        // Add to page
        document.body.appendChild(indicator);
        
        // Remove after 2 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Get save information
     * @returns {object|null} - Save information or null if no save exists
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;
            
            const gameState = JSON.parse(savedData);
            return {
                version: gameState.version || 'Unknown',
                timestamp: gameState.timestamp || 0,
                lastSaved: new Date(gameState.timestamp || 0).toLocaleString(),
                currency: gameState.currency?.currency || 0,
                totalEarned: gameState.currency?.totalEarned || 0,
                prestigeLevel: gameState.prestige?.prestigeLevel || 0,
                totalFlips: gameState.stats?.totalFlips || 0
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopAutoSave();
        console.log('SaveManager destroyed');
    }
} 
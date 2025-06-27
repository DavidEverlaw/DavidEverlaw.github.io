/**
 * Main Game Initialization
 * Sets up the game and manages the overall game state
 */

// Global game instances for easy access
let gameInstance = null;
let tabManager = null;
let coinFlipper = null;
let currencyManager = null;
let upgradeManager = null;
let debugManager = null;
let settingsManager = null;

/**
 * Game Class
 * Main game controller that manages all game systems
 */
class Game {
    constructor() {
        this.coinFlipper = null;
        this.currencyManager = null;
        this.upgradeManager = null;
        this.debugManager = null;
        this.tabManager = null;
        this.settingsManager = null;
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            console.warn('Game already initialized');
            return;
        }

        try {
            // Initialize the tab manager first
            this.tabManager = new TabManager();
            
            // Initialize the currency manager
            this.currencyManager = new CurrencyManager();
            
            // Initialize the upgrade manager with currency manager
            this.upgradeManager = new UpgradeManager(this.currencyManager);
            
            // Set up the circular reference between currency and upgrade managers
            this.currencyManager.setUpgradeManager(this.upgradeManager);
            
            // Initialize the coin flipper with currency manager
            this.coinFlipper = new CoinFlipper(this.currencyManager);
            
            // Set the upgrade manager reference in coin flipper
            this.coinFlipper.setUpgradeManager(this.upgradeManager);
            
            // Set the coin flipper reference in upgrade manager
            this.upgradeManager.setCoinFlipper(this.coinFlipper);
            
            // Initialize the debug manager with currency manager
            this.debugManager = new DebugManager(this.currencyManager);
            
            // Initialize the settings manager
            this.settingsManager = new SettingsManager();
            
            // Set global references for easy access from debug manager
            window.coinFlipper = this.coinFlipper;
            window.currencyManager = this.currencyManager;
            window.upgradeManager = this.upgradeManager;
            window.debugManager = this.debugManager;
            window.tabManager = this.tabManager;
            window.settingsManager = this.settingsManager;
            
            // Store global references
            coinFlipper = this.coinFlipper;
            currencyManager = this.currencyManager;
            upgradeManager = this.upgradeManager;
            debugManager = this.debugManager;
            tabManager = this.tabManager;
            settingsManager = this.settingsManager;
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
            
            // Future: Initialize other game systems here
            // this.saveManager = new SaveManager();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    // Getter methods for accessing game systems
    getCoinFlipper() {
        return this.coinFlipper;
    }

    getCurrencyManager() {
        return this.currencyManager;
    }

    getUpgradeManager() {
        return this.upgradeManager;
    }

    getDebugManager() {
        return this.debugManager;
    }

    getTabManager() {
        return this.tabManager;
    }

    getSettingsManager() {
        return this.settingsManager;
    }

    getStats() {
        const stats = {};
        
        if (this.coinFlipper) {
            stats.flips = this.coinFlipper.getStats();
        }
        
        if (this.currencyManager) {
            stats.currency = {
                current: this.currencyManager.getCurrency(),
                totalEarned: this.currencyManager.getTotalEarned()
            };
        }
        
        if (this.upgradeManager) {
            stats.upgrades = this.upgradeManager.getUpgrades();
        }
        
        return stats;
    }
}

/**
 * Initialize the game when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Coin Flip Idle...');
    
    gameInstance = new Game();
    gameInstance.initialize();
    
    console.log('Coin Flip Idle ready!');
    console.log('Press "D" to switch to debug tab');
});

// Export for potential future module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, CoinFlipper, CurrencyManager, UpgradeManager, DebugManager, TabManager };
} 
import GameController from './GameController.js';

/**
 * Main entry point for the Street Names Game
 * Initializes the game controller and handles application startup
 */
class StreetNamesApp {
    constructor() {
        this.gameController = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            // Show loading indicator if needed
            this.showInitialLoading();

            // Initialize game controller
            this.gameController = new GameController();

            // Mark as initialized
            this.isInitialized = true;

            // Hide loading indicator
            this.hideInitialLoading();

            console.log('Street Names Game initialized successfully');

            // Add global reference for debugging
            if (typeof window !== 'undefined') {
                window.streetNamesGame = this.gameController;
            }

        } catch (error) {
            console.error('Failed to initialize Street Names Game:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Show initial loading indicator
     */
    showInitialLoading() {
        // Could show a splash screen or loading indicator
        console.log('Initializing Street Names Game...');
    }

    /**
     * Hide initial loading indicator
     */
    hideInitialLoading() {
        // Hide any loading indicators
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        const errorMessage = 'Failed to load the game. Please refresh the page and try again.';
        
        // Try to show error in UI if possible
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorElement.innerHTML = `
            <h3>Initialization Error</h3>
            <p>${errorMessage}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff4444;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorElement);
    }

    /**
     * Cleanup and destroy the application
     */
    destroy() {
        if (this.gameController) {
            this.gameController.destroy();
            this.gameController = null;
        }
        this.isInitialized = false;

        // Remove global reference
        if (typeof window !== 'undefined' && window.streetNamesGame) {
            delete window.streetNamesGame;
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasGameController: !!this.gameController,
            timestamp: new Date().toISOString()
        };
    }
}

// Create and initialize the application when DOM is ready
let app = null;

/**
 * Initialize the application
 */
function initializeApp() {
    if (app) {
        console.warn('App already exists');
        return;
    }

    app = new StreetNamesApp();
    app.init();
}

/**
 * Handle DOM ready state
 */
function handleDOMReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // DOM is already ready
        initializeApp();
    }
}

// Start the application
handleDOMReady();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (app && app.gameController) {
        if (document.hidden) {
            // Page is hidden, could pause game or save state
            console.log('Page hidden - game paused');
        } else {
            // Page is visible again
            console.log('Page visible - game resumed');
        }
    }
});

// Handle before page unload
window.addEventListener('beforeunload', (e) => {
    if (app && app.gameController && app.gameController.gameState.isPlaying) {
        // Save game progress before leaving
        app.gameController.dataManager.saveGameProgress(app.gameController.gameState);
    }
});

// Export for potential module use
export default StreetNamesApp;

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Could send error reports to a logging service
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // Could send error reports to a logging service
}); 
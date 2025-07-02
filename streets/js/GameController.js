import GameState from './GameState.js';
import UIManager from './UIManager.js';
import GameLogic from './GameLogic.js';
import DataManager from './DataManager.js';
import EventManager from './EventManager.js';
import MapManager from './MapManager.js';
import Utils from './Utils.js';

/**
 * GameController - Main controller that orchestrates all game modules
 */
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.ui = new UIManager();
        this.gameLogic = new GameLogic();
        this.dataManager = new DataManager();
        this.mapManager = new MapManager();
        
        // Initialize event manager last so it can bind to all components
        this.eventManager = new EventManager(this);
        
        this.gameStartTime = null;
        this.init();
    }

    /**
     * Initialize the game controller
     */
    init() {
        this.showLandingPage();
        this.loadSavedProgress();
    }

    /**
     * Load saved game progress if available
     */
    loadSavedProgress() {
        const savedProgress = this.dataManager.loadGameProgress();
        if (savedProgress && savedProgress.region) {
            // Optionally restore saved progress
            console.log('Found saved progress for region:', savedProgress.region);
        }
    }

    /**
     * Show landing page
     */
    showLandingPage() {
        this.ui.showLandingPage();
        this.gameState.reset();
    }

    /**
     * Select a region and start loading
     */
    async selectRegion(region) {
        if (!this.dataManager.isValidRegion(region)) {
            this.ui.showError(`Region "${region}" is not available`);
            return;
        }

        this.ui.showLoadingScreen();
        
        try {
            console.log('Loading region data for:', region);
            const streetsData = await this.dataManager.loadRegionData(region);
            console.log('Region data loaded, streets count:', streetsData?.length);
            
            this.gameState.setRegionData(region, streetsData);
            console.log('GameState updated, streetsData count:', this.gameState.streetsData?.length);
            
            await this.startGame();
        } catch (error) {
            console.error('Error loading region data:', error);
            this.ui.showError('Failed to load region data. Please try again.');
        }
    }

    /**
     * Start the game
     */
    async startGame() {
        this.gameState.startNewGame();
        this.gameStartTime = Date.now();
        
        this.ui.showGameInterface();
        await this.initializeMap();
        this.updateDisplay();
        
        // Mark performance
        Utils.performance.mark('game-start');
    }

    /**
     * Initialize the map with street data
     */
    async initializeMap() {
        try {
            // Wait for Leaflet to be available
            console.log('Waiting for Leaflet to load...');
            await this.mapManager.waitForLeaflet();
            console.log('Leaflet loaded successfully');
            
            // Initialize the map with current region
            console.log('Initializing map for region:', this.gameState.currentRegion);
            this.mapManager.initializeMap('map', this.gameState.currentRegion);
            console.log('Map initialized');
            
            // Load street data onto the map
            console.log('Loading street data, count:', this.gameState.streetsData?.length);
            this.mapManager.loadStreetData(this.gameState.streetsData);
            console.log('Street data loaded onto map');
            
            // Handle responsive layout
            window.addEventListener('resize', () => {
                this.mapManager.invalidateSize();
            });
            
        } catch (error) {
            console.error('Error initializing map:', error);
            this.ui.showError('Failed to initialize map. Please refresh and try again.');
        }
    }

    /**
     * Handle street guess from user
     */
    handleStreetGuess(guess) {
        const result = this.gameLogic.processGuess(guess, this.gameState);
        
        if (result.success) {
            // Enhanced feedback with data
            this.ui.showFeedback(result.message, 'success', {
                percentageAdded: result.percentageAdded,
                streets: result.streets
            });
            
            // Celebrate the discovery
            this.ui.celebrateStreetDiscovery(result.streets);
            
            this.updateDisplay();
            this.checkGameCompletion();
            
            // Update map to show discovered streets with highlight effect
            const discoveredStreetIds = result.streets.map(street => street.id);
            this.mapManager.updateStreetDiscovery(discoveredStreetIds);
            
            // Highlight the newly discovered streets briefly
            result.streets.forEach(street => {
                this.mapManager.highlightStreet(street.id, 3000);
            });
            
            // Save progress
            this.dataManager.saveGameProgress(this.gameState);
            
            // Dispatch custom event with enhanced data
            this.eventManager.dispatchCustomEvent('streetDiscovered', {
                streets: result.streets,
                totalMiles: result.totalMiles,
                percentageAdded: result.percentageAdded,
                completionPercentage: this.gameState.getCompletionPercentage()
            });
        } else {
            this.ui.showFeedback(result.message, 'error');
        }
        
        this.ui.clearStreetInput();
    }

    /**
     * Update all display elements
     */
    updateDisplay() {
        this.ui.updateProgressDisplay(this.gameState);
        
        const discoveredStreets = this.gameState.getDiscoveredStreets();
        const sortedStreets = this.gameLogic.sortStreets(discoveredStreets, this.gameState.sortOrder);
        this.ui.updateStreetsList(sortedStreets);
    }

    /**
     * Update sort order
     */
    updateSortOrder(sortOrder) {
        this.gameState.sortOrder = sortOrder;
        this.updateDisplay();
    }

    /**
     * Check if game is completed
     */
    checkGameCompletion() {
        if (this.gameState.isGameComplete()) {
            setTimeout(() => {
                this.handleGameCompletion();
            }, 1000);
        }
    }

    /**
     * Handle game completion
     */
    handleGameCompletion() {
        // Mark performance
        Utils.performance.mark('game-end');
        const duration = Utils.performance.measure('game-duration', 'game-start', 'game-end');
        
        const score = this.gameLogic.calculateScore(this.gameState, this.gameStartTime);
        
        this.ui.showGameCompletion(this.gameState);
        
        // Clear saved progress
        this.dataManager.clearGameProgress();
        
        // Dispatch completion event
        this.eventManager.dispatchCustomEvent('gameCompleted', {
            duration,
            score,
            stats: this.gameState.getStatistics()
        });
    }

    /**
     * Start new game
     */
    async startNewGame() {
        this.hideMenu();
        if (this.gameState.currentRegion) {
            await this.selectRegion(this.gameState.currentRegion);
        }
    }

    /**
     * Show menu
     */
    showMenu() {
        this.ui.showMenu();
    }

    /**
     * Hide menu
     */
    hideMenu() {
        this.ui.hideMenu();
    }

    /**
     * Toggle progress panel
     */
    toggleProgressPanel() {
        this.ui.toggleProgressPanel();
    }

    /**
     * Show how to play
     */
    showHowToPlay() {
        this.ui.showHowToPlay();
    }

    /**
     * Show statistics
     */
    showStatistics() {
        const stats = this.gameState.getStatistics();
        this.ui.showStatistics(stats);
    }

    /**
     * Handle errors
     */
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.ui.showError(`An error occurred${context ? ` in ${context}` : ''}. Please try again.`);
    }

    /**
     * Get game status for debugging
     */
    getDebugInfo() {
        return {
            gameState: {
                currentRegion: this.gameState.currentRegion,
                isPlaying: this.gameState.isPlaying,
                discoveredCount: this.gameState.discoveredStreets.size,
                totalStreets: this.gameState.streetsData.length,
                completionPercentage: this.gameState.getCompletionPercentage()
            },
            performance: {
                cacheSize: this.dataManager.getCacheSize(),
                gameStartTime: this.gameStartTime,
                currentTime: Date.now()
            },
            ui: {
                isMobile: Utils.isMobile(),
                viewport: Utils.getViewportSize()
            }
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.eventManager.destroy();
        this.mapManager.destroy();
        this.dataManager.clearCache();
    }
}

export default GameController; 
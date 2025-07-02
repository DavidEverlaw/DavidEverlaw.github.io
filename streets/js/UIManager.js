/**
 * UIManager - Handles UI interactions and DOM manipulation
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.cacheElements();
        this.animationTimeouts = new Set();
        this.lastStreetHighlight = null;
        this.lastDiscoveredCount = 0; // Track number of streets for incremental updates
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        // Landing page elements
        this.elements.landingPage = document.getElementById('landing-page');
        this.elements.gameInterface = document.getElementById('game-interface');
        this.elements.loadingScreen = document.getElementById('loading-screen');
        
        // Game interface elements
        this.elements.menuBtn = document.getElementById('menu-btn');
        this.elements.streetInput = document.getElementById('street-input');
        this.elements.inputFeedback = document.getElementById('input-feedback');
        this.elements.progressPanel = document.getElementById('progress-panel');
        this.elements.closePanel = document.getElementById('close-panel');
        this.elements.menuModal = document.getElementById('menu-modal');
        this.elements.closeMenu = document.getElementById('close-menu');
        
        // Progress tracking elements
        this.elements.milesDiscovered = document.getElementById('miles-discovered');
        this.elements.totalMiles = document.getElementById('total-miles');
        this.elements.progressFill = document.getElementById('progress-fill');
        this.elements.progressPercentage = document.getElementById('progress-percentage');
        this.elements.streetsList = document.getElementById('streets-list');
        this.elements.sortSelect = document.getElementById('sort-select');
        
        // Menu options
        this.elements.newGame = document.getElementById('new-game');
        this.elements.changeRegion = document.getElementById('change-region');
        this.elements.howToPlay = document.getElementById('how-to-play');
        this.elements.statistics = document.getElementById('statistics');
        
        // Map container
        this.elements.mapContainer = document.getElementById('map-container');
        this.elements.map = document.getElementById('map');
    }

    /**
     * Show landing page
     */
    showLandingPage() {
        this.elements.landingPage?.classList.remove('hidden');
        this.elements.gameInterface?.classList.add('hidden');
        this.elements.loadingScreen?.classList.add('hidden');
        this.hideMenu();
    }

    /**
     * Show game interface
     */
    showGameInterface() {
        this.elements.landingPage?.classList.add('hidden');
        this.elements.gameInterface?.classList.remove('hidden');
        this.hideLoadingScreen();
        
        // Focus on street input
        this.elements.streetInput?.focus();
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        this.elements.loadingScreen?.classList.remove('hidden');
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        this.elements.loadingScreen?.classList.add('hidden');
    }

    /**
     * Show menu modal
     */
    showMenu() {
        this.elements.menuModal?.classList.remove('hidden');
    }

    /**
     * Hide menu modal
     */
    hideMenu() {
        this.elements.menuModal?.classList.add('hidden');
    }

    /**
     * Toggle progress panel visibility
     */
    toggleProgressPanel() {
        if (window.innerWidth <= 768) {
            this.elements.progressPanel?.classList.toggle('open');
        }
    }

    /**
     * Enhanced feedback with animations and better styling
     */
    showFeedback(message, type, data = {}) {
        if (!this.elements.inputFeedback) return;
        
        // Clear any existing animation timeouts
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts.clear();
        
        // Create enhanced message with percentage if available
        let displayMessage = message;
        if (type === 'success' && data.percentageAdded) {
            displayMessage = message; // Message already includes percentage from GameLogic
        }
        
        this.elements.inputFeedback.textContent = displayMessage;
        this.elements.inputFeedback.className = `input-feedback show ${type}`;
        
        // Add shake animation for errors
        if (type === 'error') {
            this.elements.streetInput?.classList.add('shake');
            const shakeTimeout = setTimeout(() => {
                this.elements.streetInput?.classList.remove('shake');
            }, 600);
            this.animationTimeouts.add(shakeTimeout);
        }
        
        // Add success pulse animation
        if (type === 'success') {
            this.elements.inputFeedback.classList.add('pulse');
            const pulseTimeout = setTimeout(() => {
                this.elements.inputFeedback?.classList.remove('pulse');
            }, 600);
            this.animationTimeouts.add(pulseTimeout);
        }
        
        const hideTimeout = setTimeout(() => {
            this.elements.inputFeedback?.classList.remove('show');
        }, type === 'success' ? 4000 : 3000); // Show success messages longer
        this.animationTimeouts.add(hideTimeout);
    }

    /**
     * Clear street input
     */
    clearStreetInput() {
        if (this.elements.streetInput) {
            this.elements.streetInput.value = '';
        }
    }

    /**
     * Get street input value
     */
    getStreetInputValue() {
        return this.elements.streetInput?.value.trim() || '';
    }

    /**
     * Enhanced progress display with percentage focus
     */
    updateProgressDisplay(gameState) {
        const percentage = gameState.getCompletionPercentage();
        const streetsFound = gameState.discoveredStreets.size;
        const totalStreets = gameState.streetsData.length;

        // Update percentage prominently
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${percentage.toFixed(1)}%`;
        }
        
        // Update miles with better formatting
        if (this.elements.milesDiscovered) {
            this.elements.milesDiscovered.textContent = gameState.discoveredMiles.toFixed(1);
        }
        
        if (this.elements.totalMiles) {
            this.elements.totalMiles.textContent = gameState.totalMiles.toFixed(1);
        }
        
        // Animate progress bar
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
            
            // Add color changes based on progress
            this.elements.progressFill.className = 'progress-fill';
            if (percentage >= 100) {
                this.elements.progressFill.classList.add('complete');
            } else if (percentage >= 75) {
                this.elements.progressFill.classList.add('high');
            } else if (percentage >= 50) {
                this.elements.progressFill.classList.add('medium');
            }
        }

        // Update document title with progress
        document.title = `${percentage.toFixed(1)}% - Name SF Streets`;
    }

    /**
     * Update streets list with discovered streets
     * Uses smooth insertion for new streets when possible
     */
    updateStreetsList(discoveredStreets) {
        if (!this.elements.streetsList) return;

        // Check if this is an incremental update (new streets discovered)
        const isIncremental = discoveredStreets.length > this.lastDiscoveredCount && this.lastDiscoveredCount > 0;
        
        if (isIncremental && this.getSortOrder() === 'discovery') {
            // Smooth insertion for new streets in discovery order
            this.insertNewStreetsSmooth(discoveredStreets);
        } else {
            // Full re-render for other cases
            this.renderFullStreetsList(discoveredStreets);
        }
        
        this.lastDiscoveredCount = discoveredStreets.length;
    }

    /**
     * Smoothly insert new streets at the top of the list
     */
    insertNewStreetsSmooth(discoveredStreets) {
        const sortedStreets = window.streetNamesGame?.gameLogic?.sortStreets(discoveredStreets, 'discovery') || discoveredStreets;
        const newStreets = sortedStreets.slice(0, discoveredStreets.length - this.lastDiscoveredCount);
        
        // Update header count
        const header = this.elements.streetsList.querySelector('.streets-list-header h4');
        if (header) {
            header.textContent = `${discoveredStreets.length} Street${discoveredStreets.length !== 1 ? 's' : ''} Found`;
        }
        
        // Insert new streets at the top with a simple slide-in animation
        newStreets.forEach((street, index) => {
            const streetItem = this.createStreetItem(street, index, discoveredStreets);
            
            // Start with the item hidden above the viewport
            streetItem.style.transform = 'translateY(-60px)';
            streetItem.style.opacity = '0';
            
            // Insert after header
            const header = this.elements.streetsList.querySelector('.streets-list-header');
            if (header && header.nextSibling) {
                this.elements.streetsList.insertBefore(streetItem, header.nextSibling);
            } else {
                this.elements.streetsList.appendChild(streetItem);
            }
            
            // Animate in after a brief delay
            setTimeout(() => {
                streetItem.style.transform = 'translateY(0)';
                streetItem.style.opacity = '1';
                streetItem.style.transition = 'all 0.3s ease-out';
                
                // Clean up after animation
                setTimeout(() => {
                    streetItem.style.transition = '';
                    streetItem.style.transform = '';
                    streetItem.style.opacity = '';
                }, 300);
            }, 50);
        });
    }

    /**
     * Render the complete streets list (full re-render)
     */
    renderFullStreetsList(discoveredStreets) {
        // Clear existing list
        this.elements.streetsList.innerHTML = '';

        if (discoveredStreets.length === 0) {
            this.elements.streetsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🗺️</div>
                    <div class="empty-text">No streets discovered yet</div>
                    <div class="empty-hint">Start typing street names to begin!</div>
                </div>
            `;
            return;
        }

        // Sort streets based on current sort order
        const sortOrder = this.getSortOrder();
        const sortedStreets = window.streetNamesGame?.gameLogic?.sortStreets(discoveredStreets, sortOrder) || discoveredStreets;

        // Add header
        const headerElement = document.createElement('div');
        headerElement.className = 'streets-list-header';
        headerElement.innerHTML = `
            <h4>${discoveredStreets.length} Street${discoveredStreets.length !== 1 ? 's' : ''} Found</h4>
        `;
        this.elements.streetsList.appendChild(headerElement);

        // Add each street with enhanced presentation
        sortedStreets.forEach((street, index) => {
            const streetItem = this.createStreetItem(street, index, discoveredStreets);
            this.elements.streetsList.appendChild(streetItem);
        });
    }

    /**
     * Create a street item element with all necessary styling and events
     */
    createStreetItem(street, index, allDiscoveredStreets) {
        const streetItem = document.createElement('div');
        streetItem.className = 'street-item';
        streetItem.dataset.streetId = street.id; // Store street ID for hover effects
        
        // Calculate percentage this street represents of the total game miles
        const totalGameMiles = window.streetNamesGame?.gameState?.totalMiles || allDiscoveredStreets.reduce((sum, s) => sum + s.length, 0);
        const streetPercentage = (street.length / totalGameMiles * 100);
        
        streetItem.innerHTML = `
            <div class="street-main">
                <div class="street-name">${street.fullName}</div>
                <div class="street-percentage">+${streetPercentage.toFixed(2)}%</div>
            </div>
            <div class="street-details">
                <span class="street-length">${street.length.toFixed(1)} miles</span>
            </div>
        `;
        
        // Add hover effects to trigger map street hover
        streetItem.addEventListener('mouseenter', () => {
            if (window.streetNamesGame && window.streetNamesGame.mapManager) {
                window.streetNamesGame.mapManager.triggerStreetHover(street.id);
            }
        });
        
        streetItem.addEventListener('mouseleave', () => {
            if (window.streetNamesGame && window.streetNamesGame.mapManager) {
                window.streetNamesGame.mapManager.removeStreetHover(street.id);
            }
        });
        
        // Add animation delay for staggered appearance (only for full renders)
        if (!streetItem.classList.contains('street-item-inserting')) {
            streetItem.style.animationDelay = `${Math.min(index * 50, 500)}ms`;
            streetItem.classList.add('street-item-animate');
        }
        
        return streetItem;
    }



    /**
     * Show enhanced game completion with statistics
     */
    showGameCompletion(gameState) {
        const completionTime = Date.now() - (gameState.startTime || Date.now());
        const minutes = Math.floor(completionTime / 60000);
        const seconds = Math.floor((completionTime % 60000) / 1000);
        
        const message = `🎉 Congratulations! You've discovered all ${gameState.streetsData.length} streets in ${gameState.currentRegion.replace('-', ' ').toUpperCase()}!\n\nTotal miles: ${gameState.totalMiles.toFixed(1)}\nTime: ${minutes}:${seconds.toString().padStart(2, '0')}\n\nWell done! 🚗`;
        
        // Create custom completion modal
        this.showCompletionModal(gameState, completionTime);
    }

    /**
     * Create and show completion modal
     */
    showCompletionModal(gameState, completionTime) {
        // Remove existing modal if any
        const existingModal = document.getElementById('completion-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'completion-modal';
        modal.className = 'completion-modal';
        
        const minutes = Math.floor(completionTime / 60000);
        const seconds = Math.floor((completionTime % 60000) / 1000);
        
        modal.innerHTML = `
            <div class="completion-content">
                <div class="completion-header">
                    <div class="completion-emoji">🎉</div>
                    <h2>Congratulations!</h2>
                    <p>You've discovered all ${gameState.streetsData.length} streets!</p>
                </div>
                <div class="completion-stats">
                    <div class="stat-row">
                        <span class="stat-label">Total Miles:</span>
                        <span class="stat-value">${gameState.totalMiles.toFixed(1)} mi</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Completion Time:</span>
                        <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Region:</span>
                        <span class="stat-value">${gameState.currentRegion.replace('-', ' ').toUpperCase()}</span>
                    </div>
                </div>
                <div class="completion-actions">
                    <button class="completion-btn primary" onclick="window.streetNamesGame.startNewGame()">Play Again</button>
                    <button class="completion-btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => modal.classList.add('show'), 100);
    }

    /**
     * Initialize the map (handled by MapManager now)
     */
    initializeMap() {
        // Map initialization is now handled by MapManager
        // This method is kept for compatibility but does nothing
    }

    /**
     * Handle responsive layout changes
     */
    handleResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && this.elements.progressPanel) {
            this.elements.progressPanel.classList.remove('open');
        }
    }

    /**
     * Show error with enhanced styling
     */
    showError(message) {
        this.showFeedback(message, 'error');
        console.error('UI Error:', message);
    }

    /**
     * Show how to play modal with better content
     */
    showHowToPlay() {
        alert(`How to Play Street Names Game:

1. 🗺️ Look at the map showing your selected region
2. 💭 Think of street names in that area
3. ⌨️ Type the street name in the input box
4. ✅ Press Enter to submit your guess
5. 🎯 Correct guesses will highlight streets on the map
6. 📊 Track your progress in the side panel
7. 🏆 Try to discover all streets to complete the game!

Tips:
• You don't need to include street suffixes (St, Ave, etc.)
• Try common abbreviations (MLK for Martin Luther King)
• Use the progress panel to see which streets you've found
• Streets are grouped by name, so finding one segment reveals all segments

Good luck! 🍀`);
    }

    /**
     * Show statistics with enhanced presentation
     */
    showStatistics(stats) {
        const message = `📊 Game Statistics:

🎯 Streets Found: ${stats.streetsFound}/${stats.totalStreets}
📏 Miles Discovered: ${stats.milesDiscovered.toFixed(1)}/${stats.totalMiles.toFixed(1)}
📈 Completion: ${stats.completionPercentage.toFixed(1)}%
⏱️ Playing Time: ${Math.floor(stats.playingTime / 60000)}:${Math.floor((stats.playingTime % 60000) / 1000).toString().padStart(2, '0')}
🏆 Efficiency: ${((stats.totalStreets / Math.max(1, stats.guessCount)) * 100).toFixed(1)}%`;

        alert(message);
    }

    /**
     * Get current sort order
     */
    getSortOrder() {
        return this.elements.sortSelect?.value || 'discovery';
    }

    /**
     * Add visual feedback for successful street discovery
     */
    celebrateStreetDiscovery(streets) {
        // Add a brief celebration animation to the input
        if (this.elements.streetInput) {
            this.elements.streetInput.classList.add('success-pulse');
            setTimeout(() => {
                this.elements.streetInput?.classList.remove('success-pulse');
            }, 800);
        }

        // Flash the progress bar
        if (this.elements.progressFill) {
            this.elements.progressFill.classList.add('flash');
            setTimeout(() => {
                this.elements.progressFill?.classList.remove('flash');
            }, 600);
        }
    }

    /**
     * Clean up animations and timeouts
     */
    cleanup() {
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts.clear();
    }
}

export default UIManager; 
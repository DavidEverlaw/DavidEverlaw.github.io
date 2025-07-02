/**
 * EventManager - Manages all event listeners and user interactions
 */
class EventManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.boundMethods = {};
        this.init();
    }

    /**
     * Initialize event listeners
     */
    init() {
        this.bindLandingPageEvents();
        this.bindGameInterfaceEvents();
        this.bindMenuEvents();
        this.bindKeyboardEvents();
        this.bindResponsiveEvents();
    }

    /**
     * Bind landing page events
     */
    bindLandingPageEvents() {
        // Handle region button clicks using event delegation
        document.addEventListener('click', (e) => {
            const regionBtn = e.target.closest('.region-btn');
            if (regionBtn) {
                const region = regionBtn.dataset.region;
                this.gameController.selectRegion(region);
            }
        });
    }

    /**
     * Bind game interface events
     */
    bindGameInterfaceEvents() {
        const ui = this.gameController.ui;

        // Menu button
        ui.elements.menuBtn?.addEventListener('click', () => {
            this.gameController.showMenu();
        });

        // Close progress panel
        ui.elements.closePanel?.addEventListener('click', () => {
            this.gameController.toggleProgressPanel();
        });

        // Street input events
        if (ui.elements.streetInput) {
            // Convert input to uppercase
            ui.elements.streetInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });

            // Handle Enter key for guess submission
            ui.elements.streetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const guess = ui.getStreetInputValue();
                    this.gameController.handleStreetGuess(guess);
                }
            });
        }

        // Sort functionality
        ui.elements.sortSelect?.addEventListener('change', (e) => {
            this.gameController.updateSortOrder(e.target.value);
        });
    }

    /**
     * Bind menu events
     */
    bindMenuEvents() {
        const ui = this.gameController.ui;

        // Close menu button
        ui.elements.closeMenu?.addEventListener('click', () => {
            this.gameController.hideMenu();
        });

        // Menu options
        ui.elements.newGame?.addEventListener('click', () => {
            this.gameController.startNewGame();
        });

        ui.elements.changeRegion?.addEventListener('click', () => {
            this.gameController.showLandingPage();
        });

        ui.elements.howToPlay?.addEventListener('click', () => {
            this.gameController.showHowToPlay();
        });

        ui.elements.statistics?.addEventListener('click', () => {
            this.gameController.showStatistics();
        });

        // Close modal on outside click
        ui.elements.menuModal?.addEventListener('click', (e) => {
            if (e.target === ui.elements.menuModal) {
                this.gameController.hideMenu();
            }
        });
    }

    /**
     * Bind keyboard events
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    this.gameController.hideMenu();
                    break;
                case 'Tab':
                    if (this.gameController.gameState.isPlaying) {
                        this.gameController.toggleProgressPanel();
                        e.preventDefault();
                    }
                    break;
                case 'F1':
                    // Quick help
                    this.gameController.showHowToPlay();
                    e.preventDefault();
                    break;
            }
        });
    }

    /**
     * Bind responsive events
     */
    bindResponsiveEvents() {
        // Handle window resize
        const handleResize = () => {
            this.gameController.ui.handleResponsiveLayout();
        };

        window.addEventListener('resize', handleResize);
        
        // Initial check
        handleResize();
    }

    /**
     * Bind custom events for game state changes
     */
    bindCustomEvents() {
        // Listen for game state changes
        document.addEventListener('gameStateChanged', (e) => {
            this.handleGameStateChange(e.detail);
        });

        // Listen for street discovery
        document.addEventListener('streetDiscovered', (e) => {
            this.handleStreetDiscovery(e.detail);
        });

        // Listen for game completion
        document.addEventListener('gameCompleted', (e) => {
            this.handleGameCompletion(e.detail);
        });
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(detail) {
        // Update UI based on game state changes
        if (detail.type === 'progress') {
            this.gameController.updateDisplay();
        }
    }

    /**
     * Handle street discovery
     */
    handleStreetDiscovery(detail) {
        // Could trigger animations or sound effects
        console.log('Street discovered:', detail.streets);
    }

    /**
     * Handle game completion
     */
    handleGameCompletion(detail) {
        // Could trigger celebration animations
        console.log('Game completed!', detail);
    }

    /**
     * Dispatch custom event
     */
    dispatchCustomEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Remove all event listeners (cleanup)
     */
    destroy() {
        // Remove specific event listeners if needed
        // This would be useful for single-page applications
        Object.values(this.boundMethods).forEach(method => {
            // Remove listeners if we stored references
        });
    }

    /**
     * Add event listener with automatic cleanup tracking
     */
    addManagedEventListener(element, event, handler, options = {}) {
        if (!element) return;

        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);

        // Store reference for cleanup
        const key = `${element.constructor.name}_${event}_${Date.now()}`;
        this.boundMethods[key] = {
            element,
            event,
            handler: boundHandler,
            options
        };

        return key;
    }

    /**
     * Remove managed event listener
     */
    removeManagedEventListener(key) {
        const listener = this.boundMethods[key];
        if (listener) {
            listener.element.removeEventListener(
                listener.event,
                listener.handler,
                listener.options
            );
            delete this.boundMethods[key];
        }
    }
}

export default EventManager; 
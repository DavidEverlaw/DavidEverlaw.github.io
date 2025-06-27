/**
 * TabManager Class
 * Handles tab switching functionality for the sidebar
 */
class TabManager {
    constructor() {
        this.currentTab = 'upgrades';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add click event listeners to all tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Keep the 'D' key functionality for debug tab
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only trigger if not typing in an input field
                if (document.activeElement.tagName !== 'INPUT' && 
                    document.activeElement.tagName !== 'TEXTAREA' && 
                    document.activeElement.tagName !== 'SELECT') {
                    this.switchTab('debug');
                }
            }
        });
    }

    /**
     * Switch to a specific tab
     * @param {string} tabName - The name of the tab to switch to
     */
    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // Remove active class from current tab button and panel
        const currentButton = document.querySelector(`.tab-button[data-tab="${this.currentTab}"]`);
        const currentPanel = document.getElementById(`tab-${this.currentTab}`);
        
        if (currentButton) currentButton.classList.remove('active');
        if (currentPanel) currentPanel.classList.remove('active');

        // Add active class to new tab button and panel
        const newButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        const newPanel = document.getElementById(`tab-${tabName}`);
        
        if (newButton) newButton.classList.add('active');
        if (newPanel) newPanel.classList.add('active');

        // Update current tab
        this.currentTab = tabName;

        console.log(`Switched to ${tabName} tab`);
    }

    /**
     * Get the currently active tab
     * @returns {string} - The name of the current tab
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Check if a specific tab is active
     * @param {string} tabName - The name of the tab to check
     * @returns {boolean} - True if the tab is active
     */
    isTabActive(tabName) {
        return this.currentTab === tabName;
    }
} 
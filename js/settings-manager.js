/**
 * SettingsManager Class
 * Handles game settings and preferences
 */
class SettingsManager {
    constructor() {
        this.settings = {
            soundEffects: true,
            showStatistics: true
        };
        
        this.setupEventListeners();
        this.loadSettings();
        this.applySettings();
    }

    setupEventListeners() {
        // Sound effects setting
        const soundEffectsCheckbox = document.getElementById('sound-effects');
        if (soundEffectsCheckbox) {
            soundEffectsCheckbox.addEventListener('change', (e) => {
                this.updateSetting('soundEffects', e.target.checked);
            });
        }

        // Show statistics setting
        const showStatisticsCheckbox = document.getElementById('show-statistics');
        if (showStatisticsCheckbox) {
            showStatisticsCheckbox.addEventListener('change', (e) => {
                this.updateSetting('showStatistics', e.target.checked);
            });
        }
    }

    /**
     * Update a specific setting
     * @param {string} key - The setting key
     * @param {any} value - The new value
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
        console.log(`Setting updated: ${key} = ${value}`);
    }

    /**
     * Apply current settings to the game
     */
    applySettings() {
        // Apply statistics visibility
        this.applyStatisticsVisibility();
        
        // Sound effects would be applied here when implemented
        // this.applySoundEffects();
    }



    /**
     * Apply statistics visibility setting
     */
    applyStatisticsVisibility() {
        const statsSection = document.getElementById('stats-section');
        if (statsSection) {
            statsSection.style.display = this.settings.showStatistics ? 'flex' : 'none';
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('coinFlipIdleSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('coinFlipIdleSettings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsedSettings };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
        
        this.updateUI();
    }

    /**
     * Update the UI to reflect current settings
     */
    updateUI() {
        // Update sound effects checkbox
        const soundEffectsCheckbox = document.getElementById('sound-effects');
        if (soundEffectsCheckbox) {
            soundEffectsCheckbox.checked = this.settings.soundEffects;
        }

        // Update show statistics checkbox
        const showStatisticsCheckbox = document.getElementById('show-statistics');
        if (showStatisticsCheckbox) {
            showStatisticsCheckbox.checked = this.settings.showStatistics;
        }
    }

    /**
     * Get current settings
     * @returns {object} - Current settings object
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.settings = {
            soundEffects: true,
            showStatistics: true
        };
        
        this.saveSettings();
        this.updateUI();
        this.applySettings();
        
        console.log('Settings reset to defaults');
    }
} 
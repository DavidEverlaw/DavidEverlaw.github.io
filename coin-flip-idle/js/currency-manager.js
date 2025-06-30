/**
 * CurrencyManager Class
 * Handles currency tracking, earnings, and display
 */
class CurrencyManager {
    constructor(upgradeManager = null) {
        this.currency = 0;
        this.totalEarned = 0;
        this.upgradeManager = upgradeManager;
        
        // Streak tracking - array to track streak for each coin
        this.coinStreaks = []; // Array of streak counts for each coin
        
        // Get DOM elements
        this.currencyDisplay = document.getElementById('currency-amount');
        this.totalEarnedDisplay = document.getElementById('total-earned');
        
        // Use the global DisplayUtils instance
        this.displayUtils = DisplayUtils_Instance;
        
        this.updateDisplay();
    }

    /**
     * Set the upgrade manager reference (called from Game class)
     * @param {UpgradeManager} upgradeManager - The upgrade manager instance
     */
    setUpgradeManager(upgradeManager) {
        this.upgradeManager = upgradeManager;
    }

    /**
     * Update streak for a specific coin based on flip outcome
     * @param {number} coinIndex - The index of the coin (0-based)
     * @param {string} outcome - The flip outcome ('heads', 'tails', 'edge')
     */
    updateCoinStreak(coinIndex, outcome) {
        const config = GameConfig.MECHANICS;
        
        // Ensure the coinStreaks array is large enough
        while (this.coinStreaks.length <= coinIndex) {
            this.coinStreaks.push(0);
        }
        
        if (outcome === 'heads' || outcome === 'edge') {
            // Both heads and edge contribute to the streak
            this.coinStreaks[coinIndex] += 1;
            
            // Get effective max streak length (base + upgrade bonus)
            let maxStreakLength = config.STREAK_MAX_COUNT;
            if (this.upgradeManager) {
                maxStreakLength = this.upgradeManager.getEffectiveMaxStreakLength();
            }
            
            // Check if we've reached the max streak - if so, reset to 1 (new streak)
            if (this.coinStreaks[coinIndex] > maxStreakLength) {
                this.coinStreaks[coinIndex] = 1;
            }
        } else if (outcome === 'tails' && config.STREAK_RESET_ON_TAILS) {
            // Reset streak on tails - set to 0 so next heads/edge starts at 1
            this.coinStreaks[coinIndex] = 0;
        }
    }

    /**
     * Get streak multiplier for a specific coin
     * @param {number} coinIndex - The index of the coin (0-based)
     * @returns {number} - The multiplier based on coin's streak
     */
    getCoinStreakMultiplier(coinIndex) {
        const streak = this.coinStreaks[coinIndex] || 0;
        
        if (streak <= 1) {
            return 1.0; // No bonus for streak of 1 or less
        }
        
        // Get effective streak multiplier (base + upgrade bonus)
        let multiplierPerLevel = GameConfig.MECHANICS.STREAK_MULTIPLIER_PER_LEVEL;
        if (this.upgradeManager) {
            multiplierPerLevel = this.upgradeManager.getEffectiveStreakMultiplier();
        }
        
        // Calculate multiplier: 1 + (streak - 1) * multiplier_per_level
        // This means streak of 2 gives first bonus, streak of 5 gives max bonus
        const bonusLevels = streak - 1;
        const multiplier = 1.0 + (bonusLevels * multiplierPerLevel);
        return multiplier;
    }

    /**
     * Get streak information for all coins
     * @returns {object} - Object containing streak info for all coins
     */
    getAllStreakInfo() {
        return {
            streaks: [...this.coinStreaks],
            totalCoins: this.coinStreaks.length,
            activeStreaks: this.coinStreaks.filter(streak => streak > 1).length
        };
    }

    /**
     * Get streak information for display (backwards compatibility)
     * Returns info about the highest streak for display purposes
     * @returns {object} - Object containing streak info
     */
    getStreakInfo() {
        const maxStreak = Math.max(0, ...this.coinStreaks);
        const maxStreakIndex = this.coinStreaks.indexOf(maxStreak);
        
        return {
            count: maxStreak,
            type: 'success',
            multiplier: maxStreakIndex >= 0 ? this.getCoinStreakMultiplier(maxStreakIndex) : 1.0
        };
    }

    /**
     * Add currency based on flip outcome for a specific coin
     * @param {string} outcome - The flip outcome ('heads', 'tails', 'edge')
     * @param {number} coinIndex - The index of the coin (0-based, optional for backwards compatibility)
     */
    processFlipOutcome(outcome, coinIndex = 0) {
        // Update streak for this specific coin first (before calculating earnings)
        this.updateCoinStreak(coinIndex, outcome);
        
        let baseEarnings = 0;
        
        switch (outcome) {
            case 'heads':
                baseEarnings = GameConfig.MECHANICS.BASE_CURRENCY_PER_HEAD;
                break;
            case 'tails':
                baseEarnings = GameConfig.MECHANICS.BASE_CURRENCY_PER_TAIL;
                break;
            case 'edge':
                // Edge is a multiplier of the current heads value (including upgrades)
                const headsValue = GameConfig.MECHANICS.BASE_CURRENCY_PER_HEAD;
                let headsWithUpgrades = headsValue;
                
                // Add coin value bonus if upgrade manager exists
                if (this.upgradeManager) {
                    headsWithUpgrades += this.upgradeManager.getCoinValueBonus();
                }
                
                // Get edge multiplier (base + upgrades)
                const edgeMultiplier = this.upgradeManager ? 
                    this.upgradeManager.getEdgeMultiplier() : 
                    GameConfig.MECHANICS.BASE_EDGE_MULTIPLIER;
                
                baseEarnings = headsWithUpgrades * edgeMultiplier;
                break;
        }
        
        // Apply coin multiplier upgrade if upgrade manager exists and we have earnings
        let finalEarnings = baseEarnings;
        if (this.upgradeManager && baseEarnings > 0 && outcome !== 'edge') {
            // For non-edge outcomes, apply the full upgrade calculation
            finalEarnings = this.upgradeManager.calculateFinalEarnings(baseEarnings);
        } else if (outcome === 'edge' && this.upgradeManager && baseEarnings > 0) {
            // For edge outcomes, only apply the coin multiplier (not the flat bonus)
            finalEarnings = baseEarnings * this.upgradeManager.getCoinMultiplier();
            
            // Apply prestige edge bonus to edge outcomes
            if (window.prestigeManager) {
                finalEarnings *= window.prestigeManager.getEdgeBonusMultiplier();
            }
        }
        
        // Apply prestige coin bonus to all earnings
        if (finalEarnings > 0 && window.prestigeManager) {
            finalEarnings *= window.prestigeManager.getCoinBonusMultiplier();
        }
        
        // Apply streak multiplier if we have earnings and a streak for this coin
        const coinStreak = this.coinStreaks[coinIndex] || 0;
        if (finalEarnings > 0 && coinStreak > 1) {
            const streakMultiplier = this.getCoinStreakMultiplier(coinIndex);
            finalEarnings *= streakMultiplier;
        }
        
        // Apply double value chance if we have earnings and upgrade manager
        let wasDoubled = false;
        if (finalEarnings > 0 && this.upgradeManager) {
            if (this.upgradeManager.shouldDoubleValue()) {
                finalEarnings *= 2;
                wasDoubled = true;
            }
        }
        
        if (finalEarnings > 0) {
            this.addCurrency(Math.floor(finalEarnings));
        }
        
        // Return earnings info including whether it was doubled
        return {
            earnings: Math.floor(finalEarnings),
            wasDoubled: wasDoubled
        };
    }

    /**
     * Add currency to the player's total
     * @param {number} amount - Amount to add
     */
    addCurrency(amount) {
        this.currency += amount;
        this.totalEarned += amount;
        this.updateDisplay();
        
        // Update upgrade display when currency changes
        if (this.upgradeManager) {
            this.upgradeManager.updateDisplay();
        }
        
        // Update prestige display when currency changes
        if (window.prestigeManager) {
            window.prestigeManager.updateDisplay();
        }
    }

    /**
     * Spend currency (for upgrade system)
     * @param {number} amount - Amount to spend
     * @returns {boolean} - Whether the purchase was successful
     */
    spendCurrency(amount) {
        if (this.currency >= amount) {
            this.currency -= amount;
            this.updateDisplay();
            
            // Update upgrade display when currency changes
            if (this.upgradeManager) {
                this.upgradeManager.updateDisplay();
            }
            
            return true;
        }
        return false;
    }

    /**
     * Update the currency display in the UI
     */
    updateDisplay() {
        if (this.currencyDisplay) {
            this.currencyDisplay.textContent = this.displayUtils.formatCurrency(this.currency);
        }
        if (this.totalEarnedDisplay) {
            this.totalEarnedDisplay.textContent = this.displayUtils.formatCurrency(this.totalEarned);
        }
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

    // Getter methods
    getCurrency() {
        return this.currency;
    }

    getTotalEarned() {
        return this.totalEarned;
    }

    // Setter methods (for debug purposes)
    setCurrency(amount) {
        this.currency = amount;
        this.updateDisplay();
    }

    setTotalEarned(amount) {
        this.totalEarned = amount;
        this.updateDisplay();
    }

    // For save/load system (future)
    getState() {
        return {
            currency: this.currency,
            totalEarned: this.totalEarned,
            coinStreaks: [...this.coinStreaks]
        };
    }

    setState(state) {
        this.currency = state.currency || 0;
        this.totalEarned = state.totalEarned || 0;
        this.coinStreaks = state.coinStreaks ? [...state.coinStreaks] : [];
        this.updateDisplay();
    }
} 
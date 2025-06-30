/**
 * UpgradeManager Class
 * Handles all upgrade logic, costs, and effects
 */
class UpgradeManager {
    constructor(currencyManager = null) {
        this.currencyManager = currencyManager;
        this.autoFlipIntervals = []; // Array of intervals for individual coin auto-flippers
        this.coinAutoFlipperStates = []; // Array to track each coin's auto-flipper state
        this.coinFlipper = null; // Reference to coin flipper for individual flips
        
        // Use the global DisplayUtils instance
        this.displayUtils = DisplayUtils_Instance;
        
        // Upgrade levels
        this.upgrades = {
            coinValue: {
                level: 0,
                baseCost: GameConfig.UPGRADES.COIN_VALUE.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.COIN_VALUE.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.COIN_VALUE.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.COIN_VALUE.MAX_LEVEL,
                name: "Coin Value",
                description: "More coins per heads"
            },
            coinMultiplier: {
                level: 0,
                baseCost: GameConfig.UPGRADES.COIN_MULTIPLIER.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.COIN_MULTIPLIER.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.COIN_MULTIPLIER.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.COIN_MULTIPLIER.MAX_LEVEL,
                name: "Coin Multiplier",
                description: "Multiply all earnings"
            },
            edgeMultiplier: {
                level: 0,
                baseCost: GameConfig.UPGRADES.EDGE_MULTIPLIER.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.EDGE_MULTIPLIER.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.EDGE_MULTIPLIER.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.EDGE_MULTIPLIER.MAX_LEVEL,
                name: "Edge Multiplier",
                description: "Bigger edge jackpots"
            },
            autoFlipper: {
                level: 0,
                baseCost: GameConfig.UPGRADES.AUTO_FLIPPER.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.AUTO_FLIPPER.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.AUTO_FLIPPER.REDUCTION_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.AUTO_FLIPPER.MAX_LEVEL,
                name: "Auto Flipper",
                description: "Automatic coin flips"
            },
            additionalCoins: {
                level: 0,
                baseCost: GameConfig.UPGRADES.ADDITIONAL_COINS.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.ADDITIONAL_COINS.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.ADDITIONAL_COINS.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.ADDITIONAL_COINS.MAX_LEVEL,
                name: "Additional Coins",
                description: "More coins per flip"
            },
            headsChance: {
                level: 0,
                baseCost: GameConfig.UPGRADES.HEADS_CHANCE.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.HEADS_CHANCE.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.HEADS_CHANCE.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.HEADS_CHANCE.MAX_LEVEL,
                name: "Heads Chance",
                description: "Better heads odds"
            },
            edgeChance: {
                level: 0,
                baseCost: GameConfig.UPGRADES.EDGE_CHANCE.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.EDGE_CHANCE.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.EDGE_CHANCE.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.EDGE_CHANCE.MAX_LEVEL,
                name: "Edge Chance",
                description: "Better edge odds"
            },
            streakMultiplier: {
                level: 0,
                baseCost: GameConfig.UPGRADES.STREAK_MULTIPLIER.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.STREAK_MULTIPLIER.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.STREAK_MULTIPLIER.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.STREAK_MULTIPLIER.MAX_LEVEL,
                name: "Streak Power",
                description: "Stronger streak bonus"
            },
            streakLength: {
                level: 0,
                baseCost: GameConfig.UPGRADES.STREAK_LENGTH.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.STREAK_LENGTH.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.STREAK_LENGTH.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.STREAK_LENGTH.MAX_LEVEL,
                name: "Streak Length",
                description: "Longer max streaks"
            },
            doubleValueChance: {
                level: 0,
                baseCost: GameConfig.UPGRADES.DOUBLE_VALUE_CHANCE.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.DOUBLE_VALUE_CHANCE.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.DOUBLE_VALUE_CHANCE.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.DOUBLE_VALUE_CHANCE.MAX_LEVEL,
                name: "Double Value",
                description: "Chance to double coins"
            },
            autoFlipperCount: {
                level: 0,
                baseCost: GameConfig.UPGRADES.AUTO_FLIPPER_COUNT.BASE_COST,
                costMultiplier: GameConfig.UPGRADES.AUTO_FLIPPER_COUNT.COST_MULTIPLIER,
                baseEffect: GameConfig.UPGRADES.AUTO_FLIPPER_COUNT.EFFECT_PER_LEVEL,
                maxLevel: GameConfig.UPGRADES.AUTO_FLIPPER_COUNT.MAX_LEVEL,
                name: "Auto Flipper Count",
                description: "More auto flippers"
            }
        };
        
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Coin Value upgrade button
        const coinValueBtn = document.getElementById('upgrade-coin-value');
        if (coinValueBtn) {
            coinValueBtn.addEventListener('click', () => this.purchaseUpgrade('coinValue'));
        }

        // Coin Multiplier upgrade button
        const coinMultiplierBtn = document.getElementById('upgrade-coin-multiplier');
        if (coinMultiplierBtn) {
            coinMultiplierBtn.addEventListener('click', () => this.purchaseUpgrade('coinMultiplier'));
        }

        // Edge Multiplier upgrade button
        const edgeMultiplierBtn = document.getElementById('upgrade-edge-multiplier');
        if (edgeMultiplierBtn) {
            edgeMultiplierBtn.addEventListener('click', () => this.purchaseUpgrade('edgeMultiplier'));
        }

        // Auto Flipper upgrade button
        const autoFlipperBtn = document.getElementById('upgrade-auto-flipper');
        if (autoFlipperBtn) {
            autoFlipperBtn.addEventListener('click', () => this.purchaseUpgrade('autoFlipper'));
        }

        // Additional Coins upgrade button
        const additionalCoinsBtn = document.getElementById('upgrade-additional-coins');
        if (additionalCoinsBtn) {
            additionalCoinsBtn.addEventListener('click', () => this.purchaseUpgrade('additionalCoins'));
        }

        // Heads Chance upgrade button
        const headsChanceBtn = document.getElementById('upgrade-heads-chance');
        if (headsChanceBtn) {
            headsChanceBtn.addEventListener('click', () => this.purchaseUpgrade('headsChance'));
        }

        // Edge Chance upgrade button
        const edgeChanceBtn = document.getElementById('upgrade-edge-chance');
        if (edgeChanceBtn) {
            edgeChanceBtn.addEventListener('click', () => this.purchaseUpgrade('edgeChance'));
        }

        // Streak Multiplier upgrade button
        const streakMultiplierBtn = document.getElementById('upgrade-streak-multiplier');
        if (streakMultiplierBtn) {
            streakMultiplierBtn.addEventListener('click', () => this.purchaseUpgrade('streakMultiplier'));
        }

        // Streak Length upgrade button
        const streakLengthBtn = document.getElementById('upgrade-streak-length');
        if (streakLengthBtn) {
            streakLengthBtn.addEventListener('click', () => this.purchaseUpgrade('streakLength'));
        }

        // Double Value Chance upgrade button
        const doubleValueChanceBtn = document.getElementById('upgrade-double-value-chance');
        if (doubleValueChanceBtn) {
            doubleValueChanceBtn.addEventListener('click', () => this.purchaseUpgrade('doubleValueChance'));
        }

        // Auto Flipper Count upgrade button
        const autoFlipperCountBtn = document.getElementById('upgrade-auto-flipper-count');
        if (autoFlipperCountBtn) {
            autoFlipperCountBtn.addEventListener('click', () => this.purchaseUpgrade('autoFlipperCount'));
        }
    }

    /**
     * Purchase an upgrade if player has enough currency
     * @param {string} upgradeType - The type of upgrade to purchase
     */
    purchaseUpgrade(upgradeType) {
        if (!this.upgrades[upgradeType] || !this.currencyManager) {
            return false;
        }

        const upgrade = this.upgrades[upgradeType];
        
        // Check if upgrade is at maximum level
        if (upgrade.level >= upgrade.maxLevel) {
            console.log(`${upgrade.name} is already at maximum level (${upgrade.maxLevel})`);
            return false;
        }

        const cost = this.getUpgradeCost(upgradeType);

        if (this.currencyManager.spendCurrency(cost)) {
            upgrade.level++;
            this.updateDisplay();
            
            // Special handling for auto-flipper upgrades
            if (upgradeType === 'autoFlipper' || upgradeType === 'autoFlipperCount') {
                this.updateAutoFlipper();
            }
            
            // Special handling for additional coins - update the coin flipper display
            if (upgradeType === 'additionalCoins' && window.coinFlipper) {
                window.coinFlipper.updateCoinsPerFlip();
                // Update auto-flipper assignments for new coins
                this.updateAutoFlipper();
            }
            
            // Special handling for heads chance - update probability display
            if (upgradeType === 'headsChance' && window.coinFlipper) {
                window.coinFlipper.updateProbabilities();
            }
            
            // Special handling for edge chance - update probability display
            if (upgradeType === 'edgeChance' && window.coinFlipper) {
                window.coinFlipper.updateProbabilities();
            }
            
            console.log(`Purchased ${upgrade.name} level ${upgrade.level} for ${cost} coins`);
            return true;
        }

        return false;
    }

    /**
     * Get the cost of the next level of an upgrade
     * @param {string} upgradeType - The type of upgrade
     * @returns {number} - The cost of the next level
     */
    getUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade) return 0;
        
        let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
        
        // Apply prestige upgrade discount
        if (window.prestigeManager) {
            cost = Math.floor(cost * window.prestigeManager.getUpgradeDiscountMultiplier());
        }
        
        return cost;
    }

    /**
     * Calculate the total coin value bonus from upgrades
     * @returns {number} - Additional coins per heads flip
     */
    getCoinValueBonus() {
        const upgrade = this.upgrades.coinValue;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Calculate the total multiplier from upgrades
     * @returns {number} - Total multiplier for all earnings
     */
    getCoinMultiplier() {
        const upgrade = this.upgrades.coinMultiplier;
        return 1 + (upgrade.level * upgrade.baseEffect);
    }

    /**
     * Calculate the edge multiplier from upgrades
     * @returns {number} - Total edge multiplier
     */
    getEdgeMultiplier() {
        const upgrade = this.upgrades.edgeMultiplier;
        return GameConfig.MECHANICS.BASE_EDGE_MULTIPLIER + (upgrade.level * upgrade.baseEffect);
    }

    /**
     * Calculate the heads chance bonus from upgrades
     * @returns {number} - Additional heads probability (0.0 to 1.0)
     */
    getHeadsChanceBonus() {
        const upgrade = this.upgrades.headsChance;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Calculate the edge chance bonus from upgrades
     * @returns {number} - Additional edge probability (0.0 to 1.0)
     */
    getEdgeChanceBonus() {
        const upgrade = this.upgrades.edgeChance;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Calculate the streak multiplier bonus from upgrades
     * @returns {number} - Additional streak multiplier per level
     */
    getStreakMultiplierBonus() {
        const upgrade = this.upgrades.streakMultiplier;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Get the effective streak multiplier per level (base + upgrade bonus)
     * @returns {number} - Total multiplier per streak level
     */
    getEffectiveStreakMultiplier() {
        const baseMultiplier = GameConfig.MECHANICS.STREAK_MULTIPLIER_PER_LEVEL;
        const bonus = this.getStreakMultiplierBonus();
        return baseMultiplier + bonus;
    }

    /**
     * Calculate the streak length bonus from upgrades
     * @returns {number} - Additional max streak length
     */
    getStreakLengthBonus() {
        const upgrade = this.upgrades.streakLength;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Get the effective maximum streak length (base + upgrade bonus)
     * @returns {number} - Total maximum streak length
     */
    getEffectiveMaxStreakLength() {
        const baseMaxStreak = GameConfig.MECHANICS.STREAK_MAX_COUNT;
        const bonus = this.getStreakLengthBonus();
        return baseMaxStreak + bonus;
    }

    /**
     * Calculate the double value chance from upgrades
     * @returns {number} - Chance to double value (0.0 to 1.0)
     */
    getDoubleValueChance() {
        const upgrade = this.upgrades.doubleValueChance;
        return upgrade.level * upgrade.baseEffect;
    }

    /**
     * Check if earnings should be doubled based on upgrade chance
     * @returns {boolean} - Whether to double the earnings
     */
    shouldDoubleValue() {
        const chance = this.getDoubleValueChance();
        if (chance <= 0) return false;
        return Math.random() < chance;
    }

    /**
     * Get the current adjusted probabilities for heads, tails, and edge
     * @returns {object} - Object with heads, tails, and edge probabilities
     */
    getCurrentProbabilities() {
        const { HEADS, TAILS, EDGE } = GameConfig.COIN_PROBABILITIES;
        
        // Apply upgrade bonuses
        const headsBonus = this.getHeadsChanceBonus();
        const edgeBonus = this.getEdgeChanceBonus();
        
        // Apply edge bonus first (edge has priority)
        const adjustedEdge = Math.min(EDGE + edgeBonus, 0.8); // Cap edge at 80% to leave room for heads/tails
        
        // Apply heads bonus to remaining probability space
        const remainingSpace = 1.0 - adjustedEdge;
        const baseHeadsRatio = HEADS / (HEADS + TAILS); // Original ratio of heads to heads+tails
        const adjustedHeads = Math.min(HEADS + headsBonus, remainingSpace * 0.9); // Cap heads to leave some space for tails
        
        // Adjust tails probability to maintain total probability of 1.0
        const adjustedTails = 1.0 - adjustedEdge - adjustedHeads;
        
        return {
            heads: adjustedHeads,
            tails: Math.max(adjustedTails, 0.01), // Ensure tails never goes below 1%
            edge: adjustedEdge
        };
    }

    /**
     * Calculate the auto-flip interval based on upgrade level
     * @returns {number} - Interval in milliseconds
     */
    getAutoFlipInterval() {
        const upgrade = this.upgrades.autoFlipper;
        const baseInterval = GameConfig.UPGRADES.AUTO_FLIPPER.BASE_INTERVAL;
        const reductionPerLevel = GameConfig.UPGRADES.AUTO_FLIPPER.REDUCTION_PER_LEVEL;
        const minInterval = GameConfig.UPGRADES.AUTO_FLIPPER.MIN_INTERVAL;
        
        // If no speed upgrades, use base interval (auto-flippers work at base speed)
        if (upgrade.level === 0) {
            let interval = baseInterval;
            
            // Apply prestige auto-flip bonus even without upgrades
            if (window.prestigeManager) {
                const prestigeBonus = window.prestigeManager.getAutoFlipBonusMultiplier();
                interval = interval / prestigeBonus; // Faster flipping = lower interval
                interval = Math.max(interval, minInterval); // Still respect minimum
            }
            
            return Math.round(interval);
        }
        
        // Calculate reduction: each level reduces interval by reductionPerLevel percentage
        const reductionFactor = Math.pow(1 - reductionPerLevel, upgrade.level);
        let interval = Math.max(baseInterval * reductionFactor, minInterval);
        
        // Apply prestige auto-flip bonus (reduces interval further)
        if (window.prestigeManager) {
            const prestigeBonus = window.prestigeManager.getAutoFlipBonusMultiplier();
            interval = interval / prestigeBonus; // Faster flipping = lower interval
            interval = Math.max(interval, minInterval); // Still respect minimum
        }
        
        return Math.round(interval);
    }

    /**
     * Get the total number of coins (base + additional)
     * @returns {number} - Total number of coins
     */
    getTotalCoins() {
        const upgrade = this.upgrades.additionalCoins;
        return 1 + upgrade.level; // Base coin + additional coins
    }

    /**
     * Get the total number of auto-flippers
     * @returns {number} - Total auto-flippers
     */
    getTotalAutoFlippers() {
        // Auto-flipper speed upgrade doesn't give auto-flippers, only affects speed
        // You need to buy Auto Flipper Count to actually get auto-flippers
        return this.upgrades.autoFlipperCount.level;
    }

    /**
     * Update the auto-flipper functionality
     */
    updateAutoFlipper() {
        const interval = this.getAutoFlipInterval();
        const totalAutoFlippers = this.getTotalAutoFlippers();
        const totalCoins = this.getTotalCoins();
        
        // Update visual indicators
        this.updateAutoFlipStatus(interval);
        
        if (interval > 0 && totalAutoFlippers > 0) {
            // Assign auto-flippers to coins (one per coin up to the number of auto-flippers)
            const coinsToAutoFlip = Math.min(totalAutoFlippers, totalCoins);
            
            // Update existing auto-flippers with new interval (they'll use it on their next cycle)
            for (let i = 0; i < this.coinAutoFlipperStates.length; i++) {
                if (this.coinAutoFlipperStates[i] && this.coinAutoFlipperStates[i].isActive) {
                    this.coinAutoFlipperStates[i].interval = interval;
                }
            }
            
            // Start new auto-flippers for coins that don't have them yet
            for (let i = 0; i < coinsToAutoFlip; i++) {
                if (!this.coinAutoFlipperStates[i] || !this.coinAutoFlipperStates[i].isActive) {
                    // Add random offset to desynchronize new auto-flippers (0-50% of interval)
                    const randomOffset = Math.random() * (interval * 0.5);
                    
                    // Initialize state for this coin
                    this.coinAutoFlipperStates[i] = {
                        isActive: true,
                        interval: interval
                    };
                    
                    // Show the auto-flipper indicator
                    this.showAutoFlipperIndicator(i);
                    
                    // Start the auto-flipper after the random offset
                    setTimeout(() => {
                        this.scheduleNextAutoFlip(i);
                    }, randomOffset);
                }
            }
            
            // Stop auto-flippers for coins that should no longer have them
            for (let i = coinsToAutoFlip; i < this.coinAutoFlipperStates.length; i++) {
                if (this.coinAutoFlipperStates[i] && this.coinAutoFlipperStates[i].isActive) {
                    this.stopAutoFlipper(i);
                }
            }
            
            console.log(`Auto-flippers updated: ${coinsToAutoFlip} flippers with ${interval}ms interval`);
        } else {
            // Stop all auto-flippers when disabled
            this.stopAllAutoFlippers();
        }
    }

    /**
     * Show the auto-flipper indicator for a specific coin
     * @param {number} coinIndex - Index of the coin
     */
    showAutoFlipperIndicator(coinIndex) {
        const indicatorElement = document.getElementById(`coin-timer-${coinIndex}`);
        console.log(`Debug: Trying to show auto-flipper indicator for coin ${coinIndex}, element found:`, !!indicatorElement);
        if (indicatorElement) {
            indicatorElement.classList.add('active', 'auto-flipper-indicator');
            indicatorElement.textContent = '🤖';
            indicatorElement.style.background = '#4a5568';
            // Override any inline display:none style from reset
            indicatorElement.style.display = 'flex';
            console.log(`Debug: Auto-flipper indicator shown for coin ${coinIndex}`);
        } else {
            console.warn(`Debug: Could not find coin-timer-${coinIndex} element`);
        }
    }

    /**
     * Hide the auto-flipper indicator for a specific coin
     * @param {number} coinIndex - Index of the coin
     */
    hideAutoFlipperIndicator(coinIndex) {
        const indicatorElement = document.getElementById(`coin-timer-${coinIndex}`);
        if (indicatorElement) {
            indicatorElement.classList.remove('active', 'auto-flipper-indicator');
            indicatorElement.textContent = '';
            indicatorElement.style.display = 'none';
        }
    }

    /**
     * Hide all auto-flipper indicators
     */
    hideAllAutoFlipperIndicators() {
        for (let i = 0; i < 100; i++) { // Check up to 100 coins
            this.hideAutoFlipperIndicator(i);
        }
    }

    /**
     * Schedule the next auto-flip for a specific coin
     * @param {number} coinIndex - Index of the coin
     */
    scheduleNextAutoFlip(coinIndex) {
        // Check if this coin still has an active auto-flipper
        if (!this.coinAutoFlipperStates[coinIndex] || !this.coinAutoFlipperStates[coinIndex].isActive) {
            return;
        }

        // Only schedule if auto-flippers are still enabled and we have a coin flipper
        if (!this.coinFlipper) {
            return;
        }

        // Get the current interval for this coin
        const interval = this.coinAutoFlipperStates[coinIndex].interval;

        // Only auto-flip if the specific coin isn't already flipping
        if (!this.coinFlipper.isCoinFlipping(coinIndex)) {
            // Start the flip
            this.coinFlipper.flipCoin(coinIndex);
            
            // Schedule the next flip after the animation completes + interval
            const nextFlipDelay = GameConfig.ANIMATION.FLIP_DURATION + interval;
            const timeoutId = setTimeout(() => {
                this.scheduleNextAutoFlip(coinIndex);
            }, nextFlipDelay);
            
            // Store the timeout ID so we can clear it later
            this.autoFlipIntervals[coinIndex] = timeoutId;
        } else {
            // Coin is still flipping, try again in a short while
            const retryDelay = 100;
            const timeoutId = setTimeout(() => {
                this.scheduleNextAutoFlip(coinIndex);
            }, retryDelay);
            
            this.autoFlipIntervals[coinIndex] = timeoutId;
        }
    }

    /**
     * Stop auto-flipper for a specific coin
     * @param {number} coinIndex - Index of the coin
     */
    stopAutoFlipper(coinIndex) {
        // Mark as inactive
        if (this.coinAutoFlipperStates[coinIndex]) {
            this.coinAutoFlipperStates[coinIndex].isActive = false;
        }

        // Clear any pending timeout
        if (this.autoFlipIntervals[coinIndex]) {
            clearTimeout(this.autoFlipIntervals[coinIndex]);
            clearInterval(this.autoFlipIntervals[coinIndex]);
            this.autoFlipIntervals[coinIndex] = null;
        }

        // Hide the indicator
        this.hideAutoFlipperIndicator(coinIndex);
    }

    /**
     * Stop all auto-flippers
     */
    stopAllAutoFlippers() {
        for (let i = 0; i < this.coinAutoFlipperStates.length; i++) {
            this.stopAutoFlipper(i);
        }
        this.coinAutoFlipperStates = [];
        this.autoFlipIntervals = [];
    }

    /**
     * Update the auto-flip status indicator
     * @param {number} interval - Current auto-flip interval in milliseconds
     */
    updateAutoFlipStatus(interval) {
        const intervalElement = document.getElementById('auto-flip-interval');
        const coinContainer = document.getElementById('coin-container');
        
        if (interval > 0) {
            // Update interval display in stats
            if (intervalElement) {
                intervalElement.textContent = this.displayUtils.formatTime(interval / 1000);
                intervalElement.setAttribute('data-value', 'active');
            }
            // Add visual effect to coin
            if (coinContainer) {
                coinContainer.classList.add('auto-flipping');
            }
        } else {
            // Show "Off" status when no upgrade
            if (intervalElement) {
                intervalElement.textContent = 'Off';
                intervalElement.setAttribute('data-value', 'Off');
            }
            // Remove visual effect from coin
            if (coinContainer) {
                coinContainer.classList.remove('auto-flipping');
            }
        }
    }

    /**
     * Calculate final earnings after all upgrades
     * @param {number} baseEarnings - Base earnings before upgrades
     * @returns {number} - Final earnings after upgrades
     */
    calculateFinalEarnings(baseEarnings) {
        if (baseEarnings === 0) return 0;

        // Add flat bonus (only for heads, not edge or tails)
        let earnings = baseEarnings;
        if (baseEarnings === GameConfig.MECHANICS.BASE_CURRENCY_PER_HEAD) {
            earnings += this.getCoinValueBonus();
        }

        // Apply multiplier to all earnings (heads, tails, and edge)
        earnings *= this.getCoinMultiplier();

        return Math.floor(earnings);
    }

    /**
     * Update the upgrade display in the UI
     */
    updateDisplay() {
        this.updateUpgradeButton('coinValue');
        this.updateUpgradeButton('coinMultiplier');
        this.updateUpgradeButton('edgeMultiplier');
        this.updateUpgradeButton('autoFlipper');
        this.updateUpgradeButton('additionalCoins');
        this.updateUpgradeButton('headsChance');
        this.updateUpgradeButton('edgeChance');
        this.updateUpgradeButton('streakMultiplier');
        this.updateUpgradeButton('streakLength');
        this.updateUpgradeButton('doubleValueChance');
        this.updateUpgradeButton('autoFlipperCount');
        
        // Update stats display when upgrades change
        if (this.coinFlipper) {
            this.coinFlipper.updateStats();
        }
    }

    /**
     * Update a specific upgrade button
     * @param {string} upgradeType - The type of upgrade to update
     */
    updateUpgradeButton(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        const cost = this.getUpgradeCost(upgradeType);
        const isMaxLevel = upgrade.level >= upgrade.maxLevel;
        const canAfford = this.currencyManager ? this.currencyManager.getCurrency() >= cost : false;

        // Update level display with "Lv Curr / Max" format
        const levelElement = document.getElementById(`${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-level`);
        if (levelElement) {
            levelElement.textContent = `${upgrade.level} / ${upgrade.maxLevel}`;
        }

        // Update effect display with current -> (next) format or "MAX" for maxed upgrades
        const effectElement = document.getElementById(`${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-effect`);
        if (effectElement) {
            if (isMaxLevel) {
                effectElement.textContent = 'MAX';
            } else if (upgradeType === 'coinValue') {
                const currentBonus = this.getCoinValueBonus();
                const nextBonus = currentBonus + upgrade.baseEffect;
                const baseCoins = GameConfig.MECHANICS.BASE_CURRENCY_PER_HEAD;
                const currentTotal = baseCoins + currentBonus;
                const nextTotal = baseCoins + nextBonus;
                
                effectElement.textContent = this.displayUtils.formatRange(currentTotal, nextTotal, 'formatCurrency');
            } else if (upgradeType === 'coinMultiplier') {
                const currentMultiplier = this.getCoinMultiplier();
                const nextMultiplier = currentMultiplier + upgrade.baseEffect;
                
                effectElement.textContent = this.displayUtils.formatRange(currentMultiplier, nextMultiplier, 'formatMultiplier');
            } else if (upgradeType === 'edgeMultiplier') {
                const currentMultiplier = this.getEdgeMultiplier();
                const nextMultiplier = currentMultiplier + upgrade.baseEffect;
                
                effectElement.textContent = this.displayUtils.formatRange(currentMultiplier, nextMultiplier, 'formatMultiplier');
            } else if (upgradeType === 'autoFlipper') {
                const currentInterval = this.getAutoFlipInterval();
                const nextLevel = upgrade.level + 1;
                
                // Calculate next interval with prestige bonuses
                const baseInterval = GameConfig.UPGRADES.AUTO_FLIPPER.BASE_INTERVAL;
                const reductionPerLevel = GameConfig.UPGRADES.AUTO_FLIPPER.REDUCTION_PER_LEVEL;
                const minInterval = GameConfig.UPGRADES.AUTO_FLIPPER.MIN_INTERVAL;
                
                let nextInterval;
                if (nextLevel === 1) {
                    // If going from level 0 to 1, use base interval
                    nextInterval = baseInterval;
                } else {
                    // Calculate reduction for next level
                    const nextReductionFactor = Math.pow(1 - reductionPerLevel, nextLevel);
                    nextInterval = Math.max(baseInterval * nextReductionFactor, minInterval);
                }
                
                // Apply prestige auto-flip bonus to next interval (same as current)
                if (window.prestigeManager) {
                    const prestigeBonus = window.prestigeManager.getAutoFlipBonusMultiplier();
                    nextInterval = nextInterval / prestigeBonus; // Faster flipping = lower interval
                    nextInterval = Math.max(nextInterval, minInterval); // Still respect minimum
                }
                
                nextInterval = Math.round(nextInterval);
                
                effectElement.textContent = this.displayUtils.formatRange(currentInterval / 1000, nextInterval / 1000, 'formatTime');
            } else if (upgradeType === 'additionalCoins') {
                const currentCoins = this.getTotalCoins();
                const nextCoins = currentCoins + upgrade.baseEffect;
                
                effectElement.textContent = this.displayUtils.formatRange(currentCoins, nextCoins, 'formatNumber', { forceInteger: true });
            } else if (upgradeType === 'headsChance') {
                const currentBonus = this.getHeadsChanceBonus();
                const nextBonus = currentBonus + upgrade.baseEffect;
                const baseChance = GameConfig.COIN_PROBABILITIES.HEADS;
                const currentChance = baseChance + currentBonus;
                const nextChance = baseChance + nextBonus;
                
                effectElement.textContent = `${(currentChance * 100).toFixed(1)}% -> (${(nextChance * 100).toFixed(1)}%)`;
            } else if (upgradeType === 'edgeChance') {
                const currentBonus = this.getEdgeChanceBonus();
                const nextBonus = currentBonus + upgrade.baseEffect;
                const baseChance = GameConfig.COIN_PROBABILITIES.EDGE;
                const currentChance = baseChance + currentBonus;
                const nextChance = baseChance + nextBonus;
                
                effectElement.textContent = `${(currentChance * 100).toFixed(1)}% -> (${(nextChance * 100).toFixed(1)}%)`;
            } else if (upgradeType === 'streakMultiplier') {
                const currentBonus = this.getStreakMultiplierBonus();
                const nextBonus = currentBonus + upgrade.baseEffect;
                const baseMultiplier = GameConfig.MECHANICS.STREAK_MULTIPLIER_PER_LEVEL;
                const currentTotal = baseMultiplier + currentBonus;
                const nextTotal = baseMultiplier + nextBonus;
                
                effectElement.textContent = `${(currentTotal * 100).toFixed(0)}% -> (${(nextTotal * 100).toFixed(0)}%)`;
            } else if (upgradeType === 'streakLength') {
                const currentBonus = this.getStreakLengthBonus();
                const nextBonus = currentBonus + upgrade.baseEffect;
                const baseMaxStreak = GameConfig.MECHANICS.STREAK_MAX_COUNT;
                const currentMaxStreak = baseMaxStreak + currentBonus;
                const nextMaxStreak = baseMaxStreak + nextBonus;
                
                effectElement.textContent = `${currentMaxStreak} -> (${nextMaxStreak})`;
            } else if (upgradeType === 'doubleValueChance') {
                const currentChance = this.getDoubleValueChance();
                const nextChance = currentChance + upgrade.baseEffect;
                
                effectElement.textContent = `${(currentChance * 100).toFixed(1)}% -> (${(nextChance * 100).toFixed(1)}%)`;
            } else if (upgradeType === 'autoFlipperCount') {
                const currentCount = this.getTotalAutoFlippers();
                const nextCount = currentCount + upgrade.baseEffect;
                
                effectElement.textContent = `${currentCount} -> (${nextCount})`;
            }
        }

        // Update button state
        const buttonElement = document.getElementById(`upgrade-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        if (buttonElement) {
            if (isMaxLevel) {
                buttonElement.disabled = true;
                buttonElement.classList.remove('affordable');
                buttonElement.textContent = 'MAX LEVEL';
            } else {
                buttonElement.disabled = !canAfford;
                buttonElement.classList.toggle('affordable', canAfford);
                // Update cost display
                const costElement = document.getElementById(`${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-cost`);
                if (costElement) {
                    costElement.textContent = this.displayUtils.formatCurrency(cost);
                }
            }
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
    getUpgrades() {
        return { ...this.upgrades };
    }

    getUpgradeLevel(upgradeType) {
        return this.upgrades[upgradeType] ? this.upgrades[upgradeType].level : 0;
    }

    // For save/load system (future)
    getState() {
        const state = {};
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            state[key] = { level: upgrade.level };
        }
        return state;
    }

    setState(state) {
        for (const [key, data] of Object.entries(state)) {
            if (this.upgrades[key]) {
                this.upgrades[key].level = data.level || 0;
            }
        }
        this.updateDisplay();
        this.updateAutoFlipper(); // Restart auto-flipper if needed
    }

    // Set coin flipper reference
    setCoinFlipper(coinFlipper) {
        this.coinFlipper = coinFlipper;
    }

    // Cleanup method
    destroy() {
        this.stopAllAutoFlippers();
    }
} 
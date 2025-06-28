/**
 * PrestigeManager Class
 * Handles the prestige system including prestige currency, upgrades, and reset mechanics
 */
class PrestigeManager {
    constructor(currencyManager = null, upgradeManager = null) {
        this.currencyManager = currencyManager;
        this.upgradeManager = upgradeManager;
        
        // Prestige state
        this.prestigeLevel = 0;
        this.prestigePoints = 0;
        this.totalPrestigePoints = 0; // All-time prestige points earned
        this.prestigeCount = 0; // Total number of prestiges performed
        
        // Prestige upgrades
        this.prestigeUpgrades = {
            coinBonus: {
                level: 0,
                baseCost: 1,
                costMultiplier: 2.0,
                effectPerLevel: 0.5, // +50% coin earnings per level
                maxLevel: 50,
                name: "Coin Bonus",
                description: "Permanent coin earnings boost"
            },
            flipSpeed: {
                level: 0,
                baseCost: 2,
                costMultiplier: 2.5,
                effectPerLevel: 0.1, // +10% flip speed per level
                maxLevel: 25,
                name: "Flip Speed",
                description: "Faster coin flip animations"
            },
            edgeBonus: {
                level: 0,
                baseCost: 5,
                costMultiplier: 3.0,
                effectPerLevel: 1.0, // +100% edge multiplier per level
                maxLevel: 20,
                name: "Edge Bonus",
                description: "Bigger edge jackpots"
            },
            upgradeDiscount: {
                level: 0,
                baseCost: 3,
                costMultiplier: 2.2,
                effectPerLevel: 0.05, // 5% discount per level
                maxLevel: 30,
                name: "Upgrade Discount",
                description: "Cheaper upgrades"
            },
            startingBonus: {
                level: 0,
                baseCost: 10,
                costMultiplier: 4.0,
                effectPerLevel: 1000, // +1000 starting coins per level
                maxLevel: 15,
                name: "Starting Bonus",
                description: "Start with more coins"
            },
            autoFlipBonus: {
                level: 0,
                baseCost: 8,
                costMultiplier: 3.5,
                effectPerLevel: 0.2, // +20% auto-flip speed per level
                maxLevel: 20,
                name: "Auto-Flip Bonus",
                description: "Faster auto-flippers"
            }
        };
        
        // Use the global DisplayUtils instance
        this.displayUtils = DisplayUtils_Instance;
        
        this.setupEventListeners();
        this.updateDisplay();
        
        // Apply flip speed on initialization
        this.applyFlipSpeed();
    }

    /**
     * Set up event listeners for prestige functionality
     */
    setupEventListeners() {
        // Prestige button
        const prestigeBtn = document.getElementById('prestige-button');
        if (prestigeBtn) {
            prestigeBtn.addEventListener('click', () => this.performPrestige());
        }

        // Prestige upgrade buttons
        Object.keys(this.prestigeUpgrades).forEach(upgradeType => {
            const buttonId = `prestige-upgrade-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => this.purchasePrestigeUpgrade(upgradeType));
            }
        });
    }

    /**
     * Calculate how many prestige points would be earned from current progress
     * @returns {number} - Prestige points that would be earned
     */
    calculatePrestigePointsGain() {
        if (!this.currencyManager) return 0;
        
        const totalEarned = this.currencyManager.getTotalEarned();
        
        // Prestige points are based on total coins earned
        // Formula: sqrt(totalEarned / 1000000) rounded down
        // This means first prestige at 1M coins gives 1 point
        const basePoints = Math.floor(Math.sqrt(totalEarned / 1000000));
        
        // Bonus points based on current prestige level (diminishing returns)
        const levelBonus = Math.floor(this.prestigeLevel * 0.1);
        
        return Math.max(0, basePoints + levelBonus);
    }

    /**
     * Check if prestige is available
     * @returns {boolean} - Whether prestige can be performed
     */
    canPrestige() {
        return this.calculatePrestigePointsGain() > 0;
    }

    /**
     * Perform a prestige reset
     */
    async performPrestige() {
        const pointsGain = this.calculatePrestigePointsGain();
        
        if (pointsGain <= 0) {
            this.showMessage('You need to earn more coins before you can prestige!', 'error');
            return;
        }

        const message = `You will gain ${pointsGain} Prestige Points.\n` +
                       `All upgrades and currency will be reset, but you'll keep your prestige bonuses.\n\n` +
                       `This action cannot be undone!`;

        const confirmed = await this.displayUtils.showConfirmDialog('Prestige Confirmation', message);

        if (!confirmed) return;

        // Award prestige points
        this.prestigePoints += pointsGain;
        this.totalPrestigePoints += pointsGain;
        this.prestigeLevel++;
        this.prestigeCount++;

        // Perform the reset (similar to debug reset but keep prestige data)
        this.performPrestigeReset();

        // Apply starting bonus if purchased
        this.applyStartingBonus();

        // Update prestige display after reset is complete
        this.updateDisplay();

        this.showMessage(`Prestige complete! Gained ${pointsGain} Prestige Points.`, 'success');
        console.log(`Prestige performed: Level ${this.prestigeLevel}, gained ${pointsGain} points`);
    }

    /**
     * Perform the actual reset (similar to debug reset but preserve prestige)
     */
    performPrestigeReset() {
        // Stop all auto-flippers first
        if (this.upgradeManager) {
            this.upgradeManager.stopAllAutoFlippers();
        }

        // Reset currency and streaks
        if (this.currencyManager) {
            this.currencyManager.setCurrency(0);
            this.currencyManager.setTotalEarned(0);
            this.currencyManager.coinStreaks = [];
            this.currencyManager.updateDisplay();
        }

        // Reset upgrades completely
        if (this.upgradeManager) {
            const resetState = {
                coinValue: { level: 0 },
                coinMultiplier: { level: 0 },
                edgeMultiplier: { level: 0 },
                autoFlipper: { level: 0 },
                additionalCoins: { level: 0 },
                headsChance: { level: 0 },
                edgeChance: { level: 0 },
                streakMultiplier: { level: 0 },
                streakLength: { level: 0 },
                doubleValueChance: { level: 0 },
                autoFlipperCount: { level: 0 }
            };
            this.upgradeManager.setState(resetState);
            
            // Clear auto-flipper states
            this.upgradeManager.autoFlipIntervals = [];
            this.upgradeManager.coinAutoFlipperStates = [];
            this.upgradeManager.hideAllAutoFlipperIndicators();
        }

        // Reset coin flipper stats and states
        if (window.coinFlipper) {
            window.coinFlipper.resetStats();
            window.coinFlipper.coinFlipStates = [];
            window.coinFlipper.isFlipping = false;
            
            // Reset multi-coin visualizer
            if (window.coinFlipper.multiCoinVisualizer) {
                const coinResults = document.querySelectorAll('.coin-result');
                coinResults.forEach(result => {
                    if (result.hideTimeout) {
                        clearTimeout(result.hideTimeout);
                        result.hideTimeout = null;
                    }
                    result.style.display = 'none';
                    result.textContent = '';
                    result.className = 'coin-result';
                });
                
                if (window.coinFlipper.multiCoinVisualizer.resizeTimeout) {
                    clearTimeout(window.coinFlipper.multiCoinVisualizer.resizeTimeout);
                    window.coinFlipper.multiCoinVisualizer.resizeTimeout = null;
                }
                
                window.coinFlipper.multiCoinVisualizer.coinStates = [];
                window.coinFlipper.multiCoinVisualizer.currentCoinCount = 0;
                
                const coins = document.querySelectorAll('.multi-coin .coin');
                coins.forEach(coin => {
                    coin.style.transition = 'none';
                    coin.style.transform = 'rotateY(0deg)';
                });
                
                const coinTimers = document.querySelectorAll('.coin-timer');
                coinTimers.forEach(timer => {
                    timer.style.display = 'none';
                    timer.textContent = '';
                });
                
                window.coinFlipper.multiCoinVisualizer.updateCoinDisplay();
            }
            
            window.coinFlipper.resetCoinPosition();
        }

        // Force update all displays
        if (this.currencyManager) {
            this.currencyManager.updateDisplay();
        }
        if (this.upgradeManager) {
            this.upgradeManager.updateDisplay();
        }
        if (window.coinFlipper) {
            window.coinFlipper.updateStats();
        }
        
        // Re-initialize auto-flipper system after all displays are updated
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
            if (this.upgradeManager) {
                console.log('Prestige: Re-initializing auto-flipper system after reset');
                this.upgradeManager.updateAutoFlipper();
            }
        }, 100);
    }

    /**
     * Apply starting bonus from prestige upgrades
     */
    applyStartingBonus() {
        const startingBonusLevel = this.prestigeUpgrades.startingBonus.level;
        if (startingBonusLevel > 0 && this.currencyManager) {
            const bonusAmount = startingBonusLevel * this.prestigeUpgrades.startingBonus.effectPerLevel;
            this.currencyManager.addCurrency(bonusAmount);
        }
    }

    /**
     * Purchase a prestige upgrade
     * @param {string} upgradeType - The type of prestige upgrade
     */
    purchasePrestigeUpgrade(upgradeType) {
        const upgrade = this.prestigeUpgrades[upgradeType];
        if (!upgrade) return;

        const cost = this.getPrestigeUpgradeCost(upgradeType);
        
        if (upgrade.level >= upgrade.maxLevel) {
            this.showMessage('Upgrade is already at maximum level!', 'error');
            return;
        }

        if (this.prestigePoints < cost) {
            this.showMessage('Not enough Prestige Points!', 'error');
            return;
        }

        // Purchase the upgrade
        this.prestigePoints -= cost;
        upgrade.level++;

        this.updateDisplay();
        
        // Special handling for auto-flip bonus - update auto-flipper system
        if (upgradeType === 'autoFlipBonus' && this.upgradeManager) {
            this.upgradeManager.updateAutoFlipper();
        }
        
        // Special handling for flip speed - update animation duration
        if (upgradeType === 'flipSpeed') {
            this.applyFlipSpeed();
        }
        
        this.showMessage(`${upgrade.name} upgraded to level ${upgrade.level}!`, 'success');
        console.log(`Prestige upgrade purchased: ${upgradeType} level ${upgrade.level}`);
    }

    /**
     * Get the cost of a prestige upgrade
     * @param {string} upgradeType - The type of upgrade
     * @returns {number} - The cost of the upgrade
     */
    getPrestigeUpgradeCost(upgradeType) {
        const upgrade = this.prestigeUpgrades[upgradeType];
        if (!upgrade) return 0;
        
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
    }

    /**
     * Get the coin bonus multiplier from prestige upgrades
     * @returns {number} - The multiplier (1.0 = no bonus)
     */
    getCoinBonusMultiplier() {
        const level = this.prestigeUpgrades.coinBonus.level;
        const effectPerLevel = this.prestigeUpgrades.coinBonus.effectPerLevel;
        return 1.0 + (level * effectPerLevel);
    }

    /**
     * Get the flip speed multiplier from prestige upgrades
     * @returns {number} - The multiplier (1.0 = no bonus)
     */
    getFlipSpeedMultiplier() {
        const level = this.prestigeUpgrades.flipSpeed.level;
        const effectPerLevel = this.prestigeUpgrades.flipSpeed.effectPerLevel;
        return 1.0 + (level * effectPerLevel);
    }

    /**
     * Apply flip speed to animation duration
     * Updates GameConfig.ANIMATION.FLIP_DURATION based on prestige upgrade
     */
    applyFlipSpeed() {
        const speedMultiplier = this.getFlipSpeedMultiplier();
        const baseDuration = 1500; // Base flip duration in ms
        
        // Higher speed multiplier = faster animation = shorter duration
        const newDuration = Math.round(baseDuration / speedMultiplier);
        const minDuration = 200; // Minimum duration to keep animation visible
        
        // Update the config
        if (typeof GameConfig !== 'undefined' && GameConfig.ANIMATION) {
            GameConfig.ANIMATION.FLIP_DURATION = Math.max(newDuration, minDuration);
        }
    }

    /**
     * Get the edge bonus multiplier from prestige upgrades
     * @returns {number} - The multiplier (1.0 = no bonus)
     */
    getEdgeBonusMultiplier() {
        const level = this.prestigeUpgrades.edgeBonus.level;
        const effectPerLevel = this.prestigeUpgrades.edgeBonus.effectPerLevel;
        return 1.0 + (level * effectPerLevel);
    }

    /**
     * Get the upgrade discount multiplier from prestige upgrades
     * @returns {number} - The discount multiplier (1.0 = no discount, 0.5 = 50% discount)
     */
    getUpgradeDiscountMultiplier() {
        const level = this.prestigeUpgrades.upgradeDiscount.level;
        const effectPerLevel = this.prestigeUpgrades.upgradeDiscount.effectPerLevel;
        return Math.max(0.1, 1.0 - (level * effectPerLevel)); // Minimum 10% of original cost
    }

    /**
     * Get the auto-flip bonus multiplier from prestige upgrades
     * @returns {number} - The multiplier (1.0 = no bonus)
     */
    getAutoFlipBonusMultiplier() {
        const level = this.prestigeUpgrades.autoFlipBonus.level;
        const effectPerLevel = this.prestigeUpgrades.autoFlipBonus.effectPerLevel;
        return 1.0 + (level * effectPerLevel);
    }

    /**
     * Update the prestige display
     */
    updateDisplay() {
        // Update prestige level and points
        const prestigeLevelElement = document.getElementById('prestige-level');
        const prestigePointsElement = document.getElementById('prestige-points');
        const prestigeGainElement = document.getElementById('prestige-gain');
        
        if (prestigeLevelElement) {
            prestigeLevelElement.textContent = this.prestigeLevel.toString();
        }
        
        if (prestigePointsElement) {
            prestigePointsElement.textContent = this.displayUtils.formatNumber(this.prestigePoints);
        }

        if (prestigeGainElement) {
            const gain = this.calculatePrestigePointsGain();
            prestigeGainElement.textContent = this.displayUtils.formatNumber(gain);
        }

        // Update prestige button
        const prestigeButton = document.getElementById('prestige-button');
        if (prestigeButton) {
            const canPrestige = this.canPrestige();
            const gain = this.calculatePrestigePointsGain();
            
            prestigeButton.disabled = !canPrestige;
            prestigeButton.textContent = canPrestige ? 
                `Prestige (+${gain} Points)` : 
                'Need More Progress';
        }

        // Update prestige upgrade buttons
        this.updatePrestigeUpgradeButtons();
    }

    /**
     * Update prestige upgrade buttons
     */
    updatePrestigeUpgradeButtons() {
        Object.keys(this.prestigeUpgrades).forEach(upgradeType => {
            const upgrade = this.prestigeUpgrades[upgradeType];
            const cost = this.getPrestigeUpgradeCost(upgradeType);
            const isMaxLevel = upgrade.level >= upgrade.maxLevel;
            const canAfford = this.prestigePoints >= cost;

            // Update level display
            const levelElement = document.getElementById(`prestige-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-level`);
            if (levelElement) {
                levelElement.textContent = `${upgrade.level} / ${upgrade.maxLevel}`;
            }

            // Update effect display
            const effectElement = document.getElementById(`prestige-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-effect`);
            if (effectElement) {
                if (isMaxLevel) {
                    effectElement.textContent = 'MAX';
                } else {
                    const currentEffect = upgrade.level * upgrade.effectPerLevel;
                    const nextEffect = (upgrade.level + 1) * upgrade.effectPerLevel;
                    
                    if (upgradeType === 'coinBonus' || upgradeType === 'flipSpeed' || 
                        upgradeType === 'edgeBonus' || upgradeType === 'autoFlipBonus') {
                        effectElement.textContent = `+${(currentEffect * 100).toFixed(0)}% → (+${(nextEffect * 100).toFixed(0)}%)`;
                    } else if (upgradeType === 'upgradeDiscount') {
                        effectElement.textContent = `${(currentEffect * 100).toFixed(0)}% → (${(nextEffect * 100).toFixed(0)}%)`;
                    } else if (upgradeType === 'startingBonus') {
                        effectElement.textContent = `${this.displayUtils.formatCurrency(currentEffect)} → (${this.displayUtils.formatCurrency(nextEffect)})`;
                    }
                }
            }

            // Update button
            const buttonElement = document.getElementById(`prestige-upgrade-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (buttonElement) {
                if (isMaxLevel) {
                    buttonElement.disabled = true;
                    buttonElement.classList.remove('affordable');
                    buttonElement.textContent = 'MAX LEVEL';
                } else {
                    buttonElement.disabled = !canAfford;
                    buttonElement.classList.toggle('affordable', canAfford);
                    
                    const costElement = document.getElementById(`prestige-${upgradeType.replace(/([A-Z])/g, '-$1').toLowerCase()}-cost`);
                    if (costElement) {
                        costElement.textContent = this.displayUtils.formatNumber(cost);
                    }
                }
            }
        });
    }

    /**
     * Show a message to the user
     * @param {string} message - The message to show
     * @param {string} type - The type of message ('success', 'error', 'warning')
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageElement = document.getElementById('prestige-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'prestige-message';
            messageElement.className = 'prestige-message';
            
            const prestigeContainer = document.querySelector('.prestige-container');
            if (prestigeContainer) {
                prestigeContainer.appendChild(messageElement);
            }
        }

        messageElement.textContent = message;
        messageElement.className = `prestige-message ${type}`;
        messageElement.style.display = 'block';

        // Hide message after 3 seconds
        setTimeout(() => {
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }, 3000);
    }

    /**
     * Get prestige state for saving
     * @returns {object} - Prestige state object
     */
    getState() {
        const state = {
            prestigeLevel: this.prestigeLevel,
            prestigePoints: this.prestigePoints,
            totalPrestigePoints: this.totalPrestigePoints,
            prestigeCount: this.prestigeCount
        };

        // Add prestige upgrade levels
        for (const [key, upgrade] of Object.entries(this.prestigeUpgrades)) {
            state[key] = { level: upgrade.level };
        }

        return state;
    }

    /**
     * Set prestige state from loading
     * @param {object} state - Prestige state object
     */
    setState(state) {
        this.prestigeLevel = state.prestigeLevel || 0;
        this.prestigePoints = state.prestigePoints || 0;
        this.totalPrestigePoints = state.totalPrestigePoints || 0;
        this.prestigeCount = state.prestigeCount || 0;

        // Restore prestige upgrade levels
        for (const [key, data] of Object.entries(state)) {
            if (this.prestigeUpgrades[key] && data.level !== undefined) {
                this.prestigeUpgrades[key].level = data.level;
            }
        }

        this.updateDisplay();
        
        // Apply flip speed after loading state
        this.applyFlipSpeed();
    }

    /**
     * Set currency manager reference
     * @param {CurrencyManager} currencyManager - The currency manager instance
     */
    setCurrencyManager(currencyManager) {
        this.currencyManager = currencyManager;
    }

    /**
     * Set upgrade manager reference
     * @param {UpgradeManager} upgradeManager - The upgrade manager instance
     */
    setUpgradeManager(upgradeManager) {
        this.upgradeManager = upgradeManager;
    }
} 
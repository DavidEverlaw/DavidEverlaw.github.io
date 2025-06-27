/**
 * CoinFlipper Class
 * Handles the core coin flipping mechanics, animations, and outcome generation
 */
class CoinFlipper {
    constructor(currencyManager = null) {
        this.isFlipping = false;
        this.currencyManager = currencyManager;
        this.upgradeManager = null; // Will be set later
        this.coinFlipStates = []; // Array to track individual coin flip states
        this.stats = {
            totalFlips: 0,
            heads: 0,
            tails: 0,
            edge: 0
        };
        
        this.coin = document.getElementById('coin');
        this.coinContainer = document.getElementById('coin-container');
        
        // Use the global DisplayUtils instance
        this.displayUtils = DisplayUtils_Instance;
        
        // Initialize multi-coin visualizer
        this.multiCoinVisualizer = null;
        
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        this.coinContainer.addEventListener('click', () => {
            // Always use individual coin flipping for coin 0 (main coin)
            this.flipCoin(0);
        });
    }

    /**
     * Check if a specific coin is currently flipping
     * @param {number} coinIndex - Index of the coin to check
     * @returns {boolean} - True if the coin is flipping
     */
    isCoinFlipping(coinIndex) {
        return this.coinFlipStates[coinIndex] || false;
    }

    /**
     * Flip a specific coin by index
     * @param {number} coinIndex - Index of the coin to flip
     */
    flipCoin(coinIndex) {
        if (this.isCoinFlipping(coinIndex)) return;

        // Set the coin as flipping
        this.coinFlipStates[coinIndex] = true;

        // Generate outcome for this specific coin
        const outcome = this.generateOutcome();
        
        // Execute the flip for this coin
        this.executeSingleCoinFlip(coinIndex, outcome);
    }

    /**
     * Execute a flip for a single coin
     * @param {number} coinIndex - Index of the coin
     * @param {string} outcome - The flip outcome
     */
    executeSingleCoinFlip(coinIndex, outcome) {
        // Update flip stats immediately
        this.stats.totalFlips++;
        this.stats[outcome]++;
        this.updateStats();

        // Always use multi-coin visualizer if available (handles both single and multiple coins)
        if (this.multiCoinVisualizer) {
            // Animate the specific coin
            this.multiCoinVisualizer.animateSingleCoin(coinIndex, outcome);
        } else {
            // Fallback to main coin animation if multi-coin visualizer not available
            this.resetCoinPosition();
            this.coin.offsetHeight; // Force reflow
            this.animateCoin(outcome);
        }

        // Process currency and show results after animation
        setTimeout(() => {
            let earnings = 0;
            let wasDoubled = false;
            if (this.currencyManager) {
                const result = this.currencyManager.processFlipOutcome(outcome, coinIndex);
                if (typeof result === 'object') {
                    earnings = result.earnings;
                    wasDoubled = result.wasDoubled;
                } else {
                    earnings = result;
                }
            }
            
            // Show result on the appropriate coin
            if (this.multiCoinVisualizer) {
                this.multiCoinVisualizer.showCoinResult(coinIndex, outcome, earnings, wasDoubled);
            } else {
                this.showMainCoinResult(outcome, earnings, wasDoubled);
            }
            
            // Mark coin as no longer flipping
            this.coinFlipStates[coinIndex] = false;
        }, GameConfig.ANIMATION.FLIP_DURATION);
    }

    flip() {
        if (this.isFlipping) return;

        this.isFlipping = true;

        // Get number of coins to flip
        const numCoins = this.upgradeManager ? this.upgradeManager.getTotalCoins() : 1;
        
        // Generate outcomes for all coins
        const outcomes = [];
        for (let i = 0; i < numCoins; i++) {
            outcomes.push(this.generateOutcome());
        }
        
        this.executeMultiFlip(outcomes);
    }

    /**
     * Force a specific outcome (for debug purposes)
     * @param {string} forcedOutcome - The outcome to force ('heads', 'tails', 'edge')
     */
    forceFlip(forcedOutcome) {
        // Get number of coins to flip (same as regular flip)
        const numCoins = this.upgradeManager ? this.upgradeManager.getTotalCoins() : 1;
        
        // Force flip all coins with the same outcome
        for (let i = 0; i < numCoins; i++) {
            if (!this.isCoinFlipping(i)) {
                // Set the coin as flipping
                this.coinFlipStates[i] = true;
                
                // Execute the forced flip for this coin
                this.executeSingleCoinFlip(i, forcedOutcome);
            }
        }
    }

    /**
     * Execute multiple coin flips with given outcomes
     * @param {string[]} outcomes - Array of flip outcomes
     */
    executeMultiFlip(outcomes) {
        // Update flip stats immediately (but not currency yet)
        const outcomeCount = { heads: 0, tails: 0, edge: 0 };
        outcomes.forEach(outcome => {
            this.stats.totalFlips++;
            this.stats[outcome]++;
            outcomeCount[outcome]++;
        });
        this.updateStats();

        // Use multi-coin visualizer if available, otherwise fall back to single coin
        if (this.multiCoinVisualizer) {
            this.multiCoinVisualizer.animateCoins(outcomes);
        } else {
            // Reset coin position first to ensure animation plays
            this.resetCoinPosition();
            
            // Force a reflow to ensure the reset is applied
            this.coin.offsetHeight;
            
            // Animate the coin (use the first outcome for animation, or edge if any)
            const displayOutcome = outcomes.includes('edge') ? 'edge' : outcomes[0];
            this.animateCoin(displayOutcome);
        }

        // Update display and process currency after animation completes
        setTimeout(() => {
            // Process currency earnings for all outcomes with coin indices
            const coinEarnings = [];
            const coinDoubled = [];
            
            if (this.currencyManager) {
                outcomes.forEach((outcome, coinIndex) => {
                    const result = this.currencyManager.processFlipOutcome(outcome, coinIndex);
                    if (typeof result === 'object') {
                        coinEarnings[coinIndex] = result.earnings;
                        coinDoubled[coinIndex] = result.wasDoubled;
                    } else {
                        // Backwards compatibility
                        coinEarnings[coinIndex] = result;
                        coinDoubled[coinIndex] = false;
                    }
                });
            }
            
            // Show results - use main coin for single coin, multi-coin visualizer for multiple
            if (outcomes.length === 1) {
                // Single coin - show result on main coin
                this.showMainCoinResult(
                    outcomes[0], 
                    coinEarnings[0] || 0, 
                    coinDoubled[0] || false
                );
            } else if (this.multiCoinVisualizer) {
                // Multiple coins - show results on multi-coin visualizer
                for (let i = 0; i < outcomes.length; i++) {
                    this.multiCoinVisualizer.showCoinResult(
                        i, 
                        outcomes[i], 
                        coinEarnings[i] || 0, 
                        coinDoubled[i] || false
                    );
                }
            }
            
            this.isFlipping = false;
        }, GameConfig.ANIMATION.FLIP_DURATION);
    }

    /**
     * Execute the flip with a given outcome
     * @param {string} outcome - The flip outcome
     */
    executeFlip(outcome) {
        // Update flip stats immediately (but not currency yet)
        this.stats.totalFlips++;
        this.stats[outcome]++;
        this.updateStats();

        // Reset coin position first to ensure animation plays
        this.resetCoinPosition();
        
        // Force a reflow to ensure the reset is applied
        this.coin.offsetHeight;
        
        // Animate the coin
        this.animateCoin(outcome);

        // Update display and process currency after animation completes
        setTimeout(() => {
            // Process currency earnings after animation (coin index 0 for single coin)
            let earnings = 0;
            let wasDoubled = false;
            if (this.currencyManager) {
                const result = this.currencyManager.processFlipOutcome(outcome, 0);
                if (typeof result === 'object') {
                    earnings = result.earnings;
                    wasDoubled = result.wasDoubled;
                } else {
                    // Backwards compatibility
                    earnings = result;
                }
            }
            
            // Show result on the main coin
            this.showMainCoinResult(outcome, earnings, wasDoubled);
            this.isFlipping = false;
        }, GameConfig.ANIMATION.FLIP_DURATION);
    }

    resetCoinPosition() {
        // Remove any existing transform and transition
        this.coin.style.transition = 'none';
        this.coin.style.transform = 'rotateY(0deg)';
    }

    generateOutcome() {
        const rand = Math.random();
        
        // Get current probabilities from upgrade manager (includes all bonuses)
        if (this.upgradeManager) {
            const probabilities = this.upgradeManager.getCurrentProbabilities();
            
            if (rand < probabilities.edge) {
                return 'edge';
            } else if (rand < probabilities.edge + probabilities.heads) {
                return 'heads';
            } else {
                return 'tails';
            }
        } else {
            // Fallback to base probabilities if no upgrade manager
            const { HEADS, TAILS, EDGE } = GameConfig.COIN_PROBABILITIES;
            
            if (rand < EDGE) {
                return 'edge';
            } else if (rand < EDGE + HEADS) {
                return 'heads';
            } else {
                return 'tails';
            }
        }
    }

    animateCoin(outcome) {
        let rotation;
        switch (outcome) {
            case 'heads':
                rotation = 'rotateY(720deg)'; // 2 full spins
                break;
            case 'tails':
                rotation = 'rotateY(900deg)'; // 2.5 spins
                break;
            case 'edge':
                rotation = 'rotateY(810deg)'; // 2.25 spins
                break;
        }
        
        // Set the transition and then apply the transform
        this.coin.style.transition = `transform ${GameConfig.ANIMATION.FLIP_DURATION}ms ${GameConfig.ANIMATION.TRANSITION_EASING}`;
        this.coin.style.transform = rotation;
    }

    /**
     * Show result on the main coin
     * @param {string} outcome - The flip outcome ('heads', 'tails', 'edge')
     * @param {number} earnings - Amount earned from the flip
     * @param {boolean} wasDoubled - Whether the earnings were doubled
     */
    showMainCoinResult(outcome, earnings = 0, wasDoubled = false) {
        const resultElement = document.getElementById('coin-result-main');
        if (!resultElement) return;
        
        // Clear any existing timeout for this result
        if (resultElement.hideTimeout) {
            clearTimeout(resultElement.hideTimeout);
        }
        
        // Get streak information for coin index 0 (main coin)
        let streakInfo = null;
        if (this.currencyManager) {
            const streak = this.currencyManager.coinStreaks[0] || 0;
            if (streak > 1) {
                const multiplier = this.currencyManager.getCoinStreakMultiplier(0);
                streakInfo = { count: streak, multiplier };
            }
        }
        
        // Create compact result display
        const compactResult = this.createCompactResultText(outcome, earnings, wasDoubled, streakInfo);
        
        resultElement.innerHTML = compactResult.html;
        resultElement.className = `coin-result ${compactResult.className}`;
        
        // Show the result
        setTimeout(() => {
            resultElement.classList.add('show');
        }, 50);
        
        // Hide the result after 2 seconds (matches animation duration)
        resultElement.hideTimeout = setTimeout(() => {
            resultElement.classList.remove('show');
        }, 2000);
    }

    /**
     * Create compact result text with all flip information
     * @param {string} outcome - The flip outcome
     * @param {number} earnings - Amount earned
     * @param {boolean} wasDoubled - Whether earnings were doubled
     * @param {object} streakInfo - Streak information {count, multiplier}
     * @returns {object} - {html: string, className: string}
     */
    createCompactResultText(outcome, earnings = 0, wasDoubled = false, streakInfo = null) {
        let resultParts = [];
        let className = '';
        
        // Set className based on outcome (but don't display outcome text/icon)
        switch (outcome) {
            case 'heads':
                className = 'heads-result';
                break;
            case 'tails':
                className = 'tails-result';
                break;
            case 'edge':
                className = 'edge-result';
                break;
        }
        
        // 1. Streak information
        if (streakInfo && streakInfo.count > 1) {
            const multiplierPercent = Math.round(streakInfo.multiplier * 100);
            resultParts.push(`<span class="streak-info">🔥${streakInfo.count} (${multiplierPercent}%)</span>`);
        }
        
        // 2. Earnings with special indicators
        if (earnings > 0) {
            const formattedEarnings = this.displayUtils.formatCurrency(earnings);
            let earningsText = `<span class="earnings">+${formattedEarnings}</span>`;
            
            // Add special indicators
            const indicators = [];
            if (outcome === 'edge') {
                indicators.push('<span class="edge-bonus">⚡</span>');
            }
            if (wasDoubled) {
                indicators.push('<span class="double-bonus">💰</span>');
            }
            
            if (indicators.length > 0) {
                earningsText += indicators.join('');
            }
            
            resultParts.push(earningsText);
        } else if (earnings === 0) {
            resultParts.push('<span class="no-earnings">+0</span>');
        }
        
        return {
            html: resultParts.join(' '),
            className: className
        };
    }



    updateStats() {
        document.getElementById('total-flips').textContent = this.displayUtils.formatNumber(this.stats.totalFlips, { forceInteger: true });
        document.getElementById('heads-count').textContent = this.displayUtils.formatNumber(this.stats.heads, { forceInteger: true });
        document.getElementById('tails-count').textContent = this.displayUtils.formatNumber(this.stats.tails, { forceInteger: true });
        document.getElementById('edge-count').textContent = this.displayUtils.formatNumber(this.stats.edge, { forceInteger: true });
        this.updateCoinsPerFlip();
        this.updateProbabilities();
    }

    updateProbabilities() {
        if (this.upgradeManager) {
            const probabilities = this.upgradeManager.getCurrentProbabilities();
            
            const headsElement = document.getElementById('heads-probability');
            const tailsElement = document.getElementById('tails-probability');
            const edgeElement = document.getElementById('edge-probability');
            
            if (headsElement) {
                headsElement.textContent = `${(probabilities.heads * 100).toFixed(1)}%`;
            }
            if (tailsElement) {
                tailsElement.textContent = `${(probabilities.tails * 100).toFixed(1)}%`;
            }
            if (edgeElement) {
                edgeElement.textContent = `${(probabilities.edge * 100).toFixed(1)}%`;
            }
        }
    }

    updateCoinsPerFlip() {
        const coinsPerFlip = this.upgradeManager ? this.upgradeManager.getTotalCoins() : 1;
        const coinsPerFlipElement = document.getElementById('coins-per-flip');
        if (coinsPerFlipElement) {
            coinsPerFlipElement.textContent = this.displayUtils.formatNumber(coinsPerFlip, { forceInteger: true });
        }
        
        // Update coin flip states array
        this.updateCoinFlipStates();
        
        // Update multi-coin visualizer display
        if (this.multiCoinVisualizer) {
            this.multiCoinVisualizer.onCoinCountChanged();
        }
    }

    // Setter for currency manager (to be called from Game class)
    setCurrencyManager(currencyManager) {
        this.currencyManager = currencyManager;
    }

    // Setter for upgrade manager (to be called from Game class)
    setUpgradeManager(upgradeManager) {
        this.upgradeManager = upgradeManager;
        
        // Always initialize multi-coin visualizer (handles both single and multiple coins)
        if (typeof MultiCoinVisualizer !== 'undefined') {
            this.multiCoinVisualizer = new MultiCoinVisualizer(this, this.upgradeManager);
        }
        
        // Update probabilities display now that we have the upgrade manager
        this.updateProbabilities();
        
        // Update coin flip states array
        this.updateCoinFlipStates();
    }

    /**
     * Update the coin flip states array to match the current number of coins
     */
    updateCoinFlipStates() {
        const totalCoins = this.upgradeManager ? this.upgradeManager.getTotalCoins() : 1;
        
        // Resize the coin flip states array
        while (this.coinFlipStates.length < totalCoins) {
            this.coinFlipStates.push(false);
        }
        
        // Trim if we have too many
        if (this.coinFlipStates.length > totalCoins) {
            this.coinFlipStates = this.coinFlipStates.slice(0, totalCoins);
        }
    }

    // Getter methods for external access to stats
    getStats() {
        return { ...this.stats };
    }

    getLastOutcome() {
        // This would need to be tracked if we want to expose the last outcome
        // For now, we'll return null as this is a basic implementation
        return null;
    }

    // Reset all statistics (for debug purposes)
    resetStats() {
        this.stats = {
            totalFlips: 0,
            heads: 0,
            tails: 0,
            edge: 0
        };
        this.updateStats();
    }
} 
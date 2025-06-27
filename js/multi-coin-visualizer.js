/**
 * MultiCoinVisualizer Class
 * Handles displaying coin visualizations for any number of coins owned
 * Uses a unified approach that works for single coins and multiple coins
 */
class MultiCoinVisualizer {
    constructor(coinFlipper = null, upgradeManager = null) {
        this.coinFlipper = coinFlipper;
        this.upgradeManager = upgradeManager;
        this.coinElements = []; // Array to store individual coin elements
        this.currentCoinCount = 0;
        this.isFlipping = false;
        
        // Create unified coin container
        this.coinContainer = null;
        this.setupCoinContainer();
        
        // Track individual coin states for animations
        this.coinStates = []; // Array of coin states for animation
        
        // Add resize listener for responsive sizing
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        this.updateCoinDisplay();
    }

    /**
     * Set up the unified coin container structure
     */
    setupCoinContainer() {
        // Find the original coin container to replace it
        const originalContainer = document.getElementById('coin-container');
        
        // Create unified container for all coins
        this.coinContainer = document.createElement('div');
        this.coinContainer.className = 'multi-coin-container';
        this.coinContainer.id = 'coin-container';
        
        // Replace the original container
        if (originalContainer && originalContainer.parentNode) {
            originalContainer.parentNode.replaceChild(this.coinContainer, originalContainer);
        } else {
            // Fallback: append to body if original container not found
            document.body.appendChild(this.coinContainer);
        }
        
        // Set initial display
        this.coinContainer.style.display = 'flex';
    }

    /**
     * Create a single coin element
     * @param {number} index - The index of this coin
     * @returns {HTMLElement} - The coin element
     */
    createCoinElement(index) {
        const coinContainer = document.createElement('div');
        coinContainer.className = 'coin-container multi-coin';
        coinContainer.dataset.coinIndex = index;
        
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.id = `coin-${index}`;
        
        // Create faces
        const headsFace = document.createElement('div');
        headsFace.className = 'face heads';
        headsFace.textContent = 'H';
        
        const tailsFace = document.createElement('div');
        tailsFace.className = 'face tails';
        tailsFace.textContent = 'T';
        
        // Create edge
        const edge = document.createElement('div');
        edge.className = 'edge';
        const edgeSurface = document.createElement('div');
        edgeSurface.className = 'edge-surface';
        edge.appendChild(edgeSurface);
        
        // Assemble coin
        coin.appendChild(headsFace);
        coin.appendChild(tailsFace);
        coin.appendChild(edge);
        coinContainer.appendChild(coin);
        
        // Create result display element
        const resultDisplay = document.createElement('div');
        resultDisplay.className = 'coin-result';
        resultDisplay.id = `coin-result-${index}`;
        coinContainer.appendChild(resultDisplay);
        
        // Create countdown timer element
        const timerElement = document.createElement('div');
        timerElement.className = 'coin-timer';
        timerElement.id = `coin-timer-${index}`;
        coinContainer.appendChild(timerElement);
        
        // Add click handler for individual coins
        coinContainer.addEventListener('click', () => {
            if (this.coinFlipper && !this.coinFlipper.isCoinFlipping(index)) {
                this.coinFlipper.flipCoin(index);
            }
        });
        
        return coinContainer;
    }

    /**
     * Update the coin display based on current coin count
     */
    updateCoinDisplay() {
        const totalCoins = this.upgradeManager ? this.upgradeManager.getTotalCoins() : 1;
        
        // Always use unified coin display for any number of coins
        this.showCoins(totalCoins);
        this.currentCoinCount = totalCoins;
    }

    /**
     * Show coins display
     * @param {number} totalCoins - Total number of coins to display
     */
    showCoins(totalCoins) {
        this.coinContainer.style.display = 'flex';
        
        // Display all coins - no limit
        const coinsToDisplay = totalCoins;
        
        // If we need more coins, add them
        while (this.coinElements.length < coinsToDisplay) {
            const coinElement = this.createCoinElement(this.coinElements.length);
            this.coinElements.push(coinElement);
            this.coinStates.push({ outcome: 'heads', isAnimating: false });
            this.coinContainer.appendChild(coinElement);
        }
        
        // If we need fewer coins, remove them
        while (this.coinElements.length > coinsToDisplay) {
            const coinElement = this.coinElements.pop();
            this.coinStates.pop();
            if (coinElement && coinElement.parentNode) {
                coinElement.parentNode.removeChild(coinElement);
            }
        }
        
        // Update coin sizes based on total count
        this.updateCoinSizes(coinsToDisplay);
        
        // Remove any existing overflow indicator since we show all coins
        this.removeOverflowIndicator();
    }

    /**
     * Update coin sizes based on the number of coins displayed
     * @param {number} coinCount - Number of coins being displayed
     */
    updateCoinSizes(coinCount) {
        // Get available space for coins
        const containerDimensions = this.getAvailableSpace();
        
        // Calculate optimal coin size based on available space and coin count
        const optimalSize = this.calculateOptimalCoinSize(coinCount, containerDimensions);
        
        const coinSize = optimalSize.size;
        const fontSize = optimalSize.fontSize;
        const borderWidth = optimalSize.borderWidth;
        const edgeWidth = optimalSize.edgeWidth;
        const gap = optimalSize.gap;
        
        // Apply sizes to all coin elements
        this.coinElements.forEach(coinElement => {
            coinElement.style.width = `${coinSize}px`;
            coinElement.style.height = `${coinSize}px`;
            
            const coin = coinElement.querySelector('.coin');
            const faces = coinElement.querySelectorAll('.face');
            const edgeSurface = coinElement.querySelector('.edge-surface');
            
            faces.forEach(face => {
                face.style.fontSize = `${fontSize}px`;
                face.style.border = `${borderWidth}px solid #c4a600`;
            });
            
            if (edgeSurface) {
                edgeSurface.style.width = `${edgeWidth}px`;
                edgeSurface.style.height = `${coinSize}px`;
                edgeSurface.style.transform = `translateX(-${edgeWidth/2}px)`;
            }
        });
        
        // Apply gap from calculated optimal size
        this.coinContainer.style.gap = `${gap}px`;
    }

    /**
     * Get available space for coin display
     * @returns {Object} - Object with width, height, and mobile status
     */
    getAvailableSpace() {
        const isMobile = window.innerWidth <= 768;
        const gameMain = document.querySelector('.game-main');
        
        if (!gameMain) {
            // Fallback dimensions
            return {
                width: isMobile ? 300 : 800,
                height: isMobile ? 200 : 400,
                isMobile
            };
        }
        
        const rect = gameMain.getBoundingClientRect();
        const padding = isMobile ? 15 : 20; // Account for padding
        
        return {
            width: rect.width - (padding * 2),
            height: rect.height * (isMobile ? 0.7 : 0.8), // Use more of available height
            isMobile
        };
    }

    /**
     * Calculate optimal coin size based on available space and coin count
     * @param {number} coinCount - Number of coins to display
     * @param {Object} containerDimensions - Available space dimensions
     * @returns {Object} - Object with size, fontSize, borderWidth, edgeWidth, and gap
     */
    calculateOptimalCoinSize(coinCount, containerDimensions) {
        const { width, height, isMobile } = containerDimensions;
        
        // Define minimum and maximum coin sizes
        const minSize = isMobile ? 35 : 50;
        const maxSize = isMobile ? 120 : 200; // Increased max size for single coins
        
        // Special handling for single coin - make it larger like the original
        if (coinCount === 1) {
            const singleCoinSize = isMobile ? 120 : 200;
            return {
                size: singleCoinSize,
                fontSize: isMobile ? 48 : 80,
                borderWidth: isMobile ? 4 : 6,
                edgeWidth: isMobile ? 12 : 20,
                gap: 0,
                layout: { cols: 1, rows: 1 }
            };
        }
        
        // Calculate optimal layout - prioritize width utilization
        let optimalLayout = this.findOptimalLayout(coinCount, width, height);
        
        // Calculate dynamic gap based on coin count and available space
        const baseGap = isMobile ? 8 : 12;
        const maxGap = isMobile ? 15 : 25;
        const gapSize = Math.max(baseGap, Math.min(maxGap, Math.floor(width / (optimalLayout.cols * 6))));
        
        // Calculate available space after gaps
        const availableWidth = width - (gapSize * (optimalLayout.cols - 1));
        const availableHeight = height - (gapSize * (optimalLayout.rows - 1));
        
        const maxWidthPerCoin = availableWidth / optimalLayout.cols;
        const maxHeightPerCoin = availableHeight / optimalLayout.rows;
        
        // Use the smaller dimension to ensure coins fit, but favor width utilization
        let optimalSize = Math.floor(Math.min(maxWidthPerCoin, maxHeightPerCoin));
        
        // If we have extra height, allow slightly larger coins
        if (maxHeightPerCoin > maxWidthPerCoin * 1.2) {
            optimalSize = Math.floor(maxWidthPerCoin);
        }
        
        // Clamp to min/max bounds
        optimalSize = Math.max(minSize, Math.min(maxSize, optimalSize));
        
        // Calculate proportional values based on coin size
        const fontSize = Math.max(
            isMobile ? 14 : 18,
            Math.floor(optimalSize * 0.4)
        );
        
        const borderWidth = Math.max(
            isMobile ? 2 : 3,
            Math.floor(optimalSize * 0.06)
        );
        
        const edgeWidth = Math.max(
            isMobile ? 4 : 6,
            Math.floor(optimalSize * 0.12)
        );
        
        return {
            size: optimalSize,
            fontSize,
            borderWidth,
            edgeWidth,
            gap: gapSize,
            layout: optimalLayout
        };
    }

    /**
     * Find optimal grid layout for coins
     * @param {number} coinCount - Number of coins
     * @param {number} width - Available width
     * @param {number} height - Available height
     * @returns {Object} - {cols, rows} optimal layout
     */
    findOptimalLayout(coinCount, width, height) {
        const aspectRatio = width / height;
        
        // Try different column counts and find the best fit
        let bestLayout = { cols: 1, rows: coinCount };
        let bestScore = 0;
        
        for (let cols = 1; cols <= coinCount; cols++) {
            const rows = Math.ceil(coinCount / cols);
            
            // Skip if this layout would be too tall
            if (rows > cols * 2) continue;
            
            // Calculate how well this layout uses the available space
            const layoutAspectRatio = cols / rows;
            const aspectScore = 1 - Math.abs(layoutAspectRatio - aspectRatio) / Math.max(layoutAspectRatio, aspectRatio);
            
            // Prefer layouts that fill more cells (less empty space)
            const fillScore = coinCount / (cols * rows);
            
            // Prefer wider layouts for better space utilization
            const widthScore = cols / coinCount;
            
            // Combined score
            const score = aspectScore * 0.4 + fillScore * 0.4 + widthScore * 0.2;
            
            if (score > bestScore) {
                bestScore = score;
                bestLayout = { cols, rows };
            }
        }
        
        return bestLayout;
    }

    /**
     * Remove any existing overflow indicator
     */
    removeOverflowIndicator() {
        const overflowIndicator = document.getElementById('coin-overflow-indicator');
        if (overflowIndicator && overflowIndicator.parentNode) {
            overflowIndicator.parentNode.removeChild(overflowIndicator);
        }
    }

    /**
     * Animate coins with given outcomes
     * @param {string[]} outcomes - Array of outcomes for each coin
     */
    animateCoins(outcomes) {
        // Reset all coin states to ensure animation always triggers
        for (let i = 0; i < this.coinElements.length; i++) {
            const coinElement = this.coinElements[i];
            const coin = coinElement.querySelector('.coin');
            
            // Reset each coin's position
            coin.style.transition = 'none';
            coin.style.transform = 'rotateY(0deg)';
            
            this.coinStates[i] = { outcome: 'heads', isAnimating: false };
        }
        
        // Force reflow to ensure all resets are applied
        if (this.coinElements.length > 0) {
            this.coinElements[0].offsetHeight;
        }

        // Animate coins
        const coinsToAnimate = Math.min(outcomes.length, this.coinElements.length);
        
        for (let i = 0; i < coinsToAnimate; i++) {
            const coinElement = this.coinElements[i];
            const coin = coinElement.querySelector('.coin');
            const outcome = outcomes[i];
            
            this.coinStates[i] = { outcome, isAnimating: true };
            this.animateCoinElement(coin, outcome);
        }
        
        // Mark animation as complete after duration
        setTimeout(() => {
            for (let i = 0; i < coinsToAnimate; i++) {
                this.coinStates[i].isAnimating = false;
            }
            // Results will be shown by the coin flipper after processing earnings
        }, GameConfig.ANIMATION.FLIP_DURATION);
    }

    /**
     * Animate a single coin by index
     * @param {number} coinIndex - The index of the coin to animate
     * @param {string} outcome - The outcome to animate to
     */
    animateSingleCoin(coinIndex, outcome) {
        const coinElement = this.coinElements[coinIndex];
        if (!coinElement) return;
        
        this.animateCoinElement(coinElement, outcome);
    }

    /**
     * Animate a single coin element
     * @param {HTMLElement} coinElement - The coin element to animate
     * @param {string} outcome - The outcome to animate to
     */
    animateCoinElement(coinElement, outcome) {
        // Get the actual coin element inside the container
        const coin = coinElement.querySelector ? coinElement.querySelector('.coin') : coinElement;
        
        // Reset position first - remove transition and transform
        coin.style.transition = 'none';
        coin.style.transform = 'rotateY(0deg)';
        
        // Force reflow to ensure reset is applied
        coin.offsetHeight;
        
        // Apply animation based on outcome - match original coin flipper rotations
        let rotation = '';
        switch (outcome) {
            case 'heads':
                rotation = 'rotateY(720deg)'; // 2 full spins to heads (matches original)
                break;
            case 'tails':
                rotation = 'rotateY(900deg)'; // 2.5 spins to tails (matches original)
                break;
            case 'edge':
                rotation = 'rotateY(810deg)'; // 2.25 spins to edge (matches original)
                break;
        }
        
        // Set transition and apply transform
        coin.style.transition = `transform ${GameConfig.ANIMATION.FLIP_DURATION}ms ${GameConfig.ANIMATION.TRANSITION_EASING}`;
        coin.style.transform = rotation;
    }

    /**
     * Show result on a specific coin
     * @param {number} coinIndex - Index of the coin to show result on
     * @param {string} outcome - The flip outcome ('heads', 'tails', 'edge')
     * @param {number} earnings - Amount earned from the flip (optional)
     * @param {boolean} wasDoubled - Whether the earnings were doubled (optional)
     */
    showCoinResult(coinIndex, outcome, earnings = 0, wasDoubled = false) {
        const resultElement = document.getElementById(`coin-result-${coinIndex}`);
        if (!resultElement) return;
        
        // Clear any existing timeout for this result
        if (resultElement.hideTimeout) {
            clearTimeout(resultElement.hideTimeout);
        }
        
        // Get streak information for this specific coin
        let streakInfo = null;
        if (this.coinFlipper && this.coinFlipper.currencyManager) {
            const streak = this.coinFlipper.currencyManager.coinStreaks[coinIndex] || 0;
            if (streak > 1) {
                const multiplier = this.coinFlipper.currencyManager.getCoinStreakMultiplier(coinIndex);
                streakInfo = { count: streak, multiplier };
            }
        }
        
        // Create compact result display using the same method as single coin
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
            const displayUtils = DisplayUtils_Instance;
            const formattedEarnings = displayUtils.formatCurrency(earnings);
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

    /**
     * Get the number of coins currently being displayed
     * @returns {number} - Number of displayed coins
     */
    getDisplayedCoinCount() {
        return this.currentCoinCount;
    }

    /**
     * Check if any coins are currently animating
     * @returns {boolean} - True if any coins are animating
     */
    isAnyAnimating() {
        return this.coinStates.some(state => state.isAnimating);
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Debounce resize events
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            if (this.currentCoinCount > 1) {
                this.updateCoinSizes(this.currentCoinCount);
            }
        }, 150);
    }

    /**
     * Update the visualizer when coin count changes
     */
    onCoinCountChanged() {
        this.updateCoinDisplay();
    }

    /**
     * Set the upgrade manager reference
     * @param {UpgradeManager} upgradeManager - The upgrade manager instance
     */
    setUpgradeManager(upgradeManager) {
        this.upgradeManager = upgradeManager;
        this.updateCoinDisplay();
    }

    /**
     * Set the coin flipper reference
     * @param {CoinFlipper} coinFlipper - The coin flipper instance
     */
    setCoinFlipper(coinFlipper) {
        this.coinFlipper = coinFlipper;
    }

    /**
     * Clean up the visualizer
     */
    destroy() {
        // Remove resize listener
        window.removeEventListener('resize', this.handleResize);
        
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        if (this.coinContainer && this.coinContainer.parentNode) {
            this.coinContainer.parentNode.removeChild(this.coinContainer);
        }
        this.coinElements = [];
        this.coinStates = [];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiCoinVisualizer;
} 
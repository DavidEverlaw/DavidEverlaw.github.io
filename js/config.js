/**
 * Game Configuration
 * Centralized configuration for all game settings
 */

const GameConfig = {
    // Coin flip probabilities (must sum to 1.0)
    COIN_PROBABILITIES: {
        HEADS: 0.499,  // 49.9%
        TAILS: 0.499,  // 49.9%
        EDGE: 0.002    // 0.2%
    },

    // Animation settings
    ANIMATION: {
        FLIP_DURATION: 1500, // milliseconds
        HOVER_SCALE: 1.05,
        TRANSITION_EASING: 'cubic-bezier(0.3, 0, 0.3, 1)'
    },

    // Visual settings
    VISUAL: {
        COIN_SIZE: 200, // pixels
        PERSPECTIVE: 1000 // pixels
    },

    // Game mechanics
    MECHANICS: {
        BASE_CURRENCY_PER_HEAD: 1,
        BASE_CURRENCY_PER_TAIL: 0,
        BASE_EDGE_MULTIPLIER: 20, // Edge gives 20x the current heads value
        
        // Streak system
        STREAK_MAX_COUNT: 5, // Maximum streak before reset
        STREAK_MULTIPLIER_PER_LEVEL: 0.2, // +20% multiplier per streak level
        STREAK_RESET_ON_TAILS: true // Whether tails breaks the streak
    },

    // Upgrade costs and effects
    UPGRADES: {
        COIN_VALUE: {
            BASE_COST: 10,
            COST_MULTIPLIER: 1.5,
            EFFECT_PER_LEVEL: 1,
            MAX_LEVEL: 500
        },
        COIN_MULTIPLIER: {
            BASE_COST: 100,
            COST_MULTIPLIER: 2.0,
            EFFECT_PER_LEVEL: 0.5,
            MAX_LEVEL: 500
        },
        EDGE_MULTIPLIER: {
            BASE_COST: 500,
            COST_MULTIPLIER: 2.5,
            EFFECT_PER_LEVEL: 5, // +5x multiplier per level
            MAX_LEVEL: 500
        },
        AUTO_FLIPPER: {
            BASE_COST: 50,
            COST_MULTIPLIER: 1.8,
            BASE_INTERVAL: 5500, // 5 seconds base interval
            REDUCTION_PER_LEVEL: 0.1, // 1% reduction per level
            MIN_INTERVAL: 10, // Minimum 10ms between flips
            MAX_LEVEL: 60
        },
        ADDITIONAL_COINS: {
            BASE_COST: 25,
            COST_MULTIPLIER: 2.0,
            EFFECT_PER_LEVEL: 1, // +1 coin per level
            MAX_LEVEL: 50
        },
        HEADS_CHANCE: {
            BASE_COST: 200,
            COST_MULTIPLIER: 3.0,
            EFFECT_PER_LEVEL: 0.01, // +1% heads chance per level
            MAX_LEVEL: 25 // Max 25% increase (49.9% -> 74.9%)
        },
        EDGE_CHANCE: {
            BASE_COST: 1000,
            COST_MULTIPLIER: 4.0,
            EFFECT_PER_LEVEL: 0.001, // +0.1% edge chance per level
            MAX_LEVEL: 50 // Max 5% increase (0.2% -> 5.2%)
        },
        STREAK_MULTIPLIER: {
            BASE_COST: 300,
            COST_MULTIPLIER: 2.5,
            EFFECT_PER_LEVEL: 0.05, // +5% streak multiplier per level
            MAX_LEVEL: 40 // Max +200% streak multiplier (20% -> 220% per streak level)
        },
        STREAK_LENGTH: {
            BASE_COST: 500,
            COST_MULTIPLIER: 3.5,
            EFFECT_PER_LEVEL: 1, // +1 max streak length per level
            MAX_LEVEL: 20 // Max +20 streak length (5 -> 25)
        },
        DOUBLE_VALUE_CHANCE: {
            BASE_COST: 750,
            COST_MULTIPLIER: 3.0,
            EFFECT_PER_LEVEL: 0.01, // +1% double value chance per level
            MAX_LEVEL: 30 // Max 30% chance to double value
        },
        AUTO_FLIPPER_COUNT: {
            BASE_COST: 150,
            COST_MULTIPLIER: 2.2,
            EFFECT_PER_LEVEL: 1, // +1 auto flipper per level
            MAX_LEVEL: 100
        }
    },

    // Validation method to ensure probabilities sum to 1.0
    validateProbabilities() {
        const total = this.COIN_PROBABILITIES.HEADS + 
                     this.COIN_PROBABILITIES.TAILS + 
                     this.COIN_PROBABILITIES.EDGE;
        
        if (Math.abs(total - 1.0) > 0.001) {
            console.error('Coin probabilities must sum to 1.0, got:', total);
            return false;
        }
        return true;
    }
};

// Validate configuration on load
if (!GameConfig.validateProbabilities()) {
    throw new Error('Invalid coin flip probabilities in configuration');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
} 
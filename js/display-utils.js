/**
 * DisplayUtils Class
 * Centralized utility for consistent number and string formatting throughout the game
 */
class DisplayUtils {
    constructor() {
        // Configuration for number formatting
        this.config = {
            // Suffixes for large numbers (ordered from largest to smallest for proper lookup)
            suffixes: [
                { value: 1e303, suffix: 'Ce', name: 'centillion' },
                { value: 1e300, suffix: 'NoNg', name: 'novemnonagintillion' },
                { value: 1e297, suffix: 'OcNg', name: 'octononagintillion' },
                { value: 1e294, suffix: 'SpNg', name: 'septennonagintillion' },
                { value: 1e291, suffix: 'SxNg', name: 'sexnonagintillion' },
                { value: 1e288, suffix: 'QiNg', name: 'quinnonagintillion' },
                { value: 1e285, suffix: 'QaNg', name: 'quattuornonagintillion' },
                { value: 1e282, suffix: 'TNg', name: 'trenonagintillion' },
                { value: 1e279, suffix: 'DNg', name: 'duononagintillion' },
                { value: 1e276, suffix: 'UNg', name: 'unnonagintillion' },
                { value: 1e273, suffix: 'Ng', name: 'nonagintillion' },
                { value: 1e270, suffix: 'NoOg', name: 'novemoctogintillion' },
                { value: 1e267, suffix: 'OcOg', name: 'octooctogintillion' },
                { value: 1e264, suffix: 'SpOg', name: 'septenoctogintillion' },
                { value: 1e261, suffix: 'SxOg', name: 'sexoctogintillion' },
                { value: 1e258, suffix: 'QiOg', name: 'quinoctogintillion' },
                { value: 1e255, suffix: 'QaOg', name: 'quattuoroctogintillion' },
                { value: 1e252, suffix: 'TOg', name: 'treoctogintillion' },
                { value: 1e249, suffix: 'DOg', name: 'duooctogintillion' },
                { value: 1e246, suffix: 'UOg', name: 'unoctogintillion' },
                { value: 1e243, suffix: 'Og', name: 'octogintillion' },
                { value: 1e240, suffix: 'NoSp', name: 'novemseptuagintillion' },
                { value: 1e237, suffix: 'OcSp', name: 'octoseptuagintillion' },
                { value: 1e234, suffix: 'SpSp', name: 'septenseptuagintillion' },
                { value: 1e231, suffix: 'SxSp', name: 'sexseptuagintillion' },
                { value: 1e228, suffix: 'QiSp', name: 'quinseptuagintillion' },
                { value: 1e225, suffix: 'QaSp', name: 'quattuorseptuagintillion' },
                { value: 1e222, suffix: 'TSp', name: 'treseptuagintillion' },
                { value: 1e219, suffix: 'DSp', name: 'duoseptuagintillion' },
                { value: 1e216, suffix: 'USp', name: 'unseptuagintillion' },
                { value: 1e213, suffix: 'Sp', name: 'septuagintillion' },
                { value: 1e210, suffix: 'NoSx', name: 'novemsexagintillion' },
                { value: 1e207, suffix: 'OcSx', name: 'octosexagintillion' },
                { value: 1e204, suffix: 'SpSx', name: 'septensexagintillion' },
                { value: 1e201, suffix: 'SxSx', name: 'sexsexagintillion' },
                { value: 1e198, suffix: 'QiSx', name: 'quinsexagintillion' },
                { value: 1e195, suffix: 'QaSx', name: 'quattuorsexagintillion' },
                { value: 1e192, suffix: 'TSx', name: 'tresexagintillion' },
                { value: 1e189, suffix: 'DSx', name: 'duosexagintillion' },
                { value: 1e186, suffix: 'USx', name: 'unsexagintillion' },
                { value: 1e183, suffix: 'Sx', name: 'sexagintillion' },
                { value: 1e180, suffix: 'NoQiq', name: 'novemquinquagintillion' },
                { value: 1e177, suffix: 'OcQiq', name: 'octoquinquagintillion' },
                { value: 1e174, suffix: 'SpQiq', name: 'septenquinquagintillion' },
                { value: 1e171, suffix: 'SxQiq', name: 'sexquinquagintillion' },
                { value: 1e168, suffix: 'QiQiq', name: 'quinquinquagintillion' },
                { value: 1e165, suffix: 'QaQiq', name: 'quattuorquinquagintillion' },
                { value: 1e162, suffix: 'TQiq', name: 'trequinquagintillion' },
                { value: 1e159, suffix: 'DQiq', name: 'duoquinquagintillion' },
                { value: 1e156, suffix: 'UQiq', name: 'unquinquagintillion' },
                { value: 1e153, suffix: 'Qiq', name: 'quinquagintillion' },
                { value: 1e150, suffix: 'NoQag', name: 'novemquadragintillion' },
                { value: 1e147, suffix: 'OcQag', name: 'octoquadragintillion' },
                { value: 1e144, suffix: 'SpQag', name: 'septenquadragintillion' },
                { value: 1e141, suffix: 'SxQag', name: 'sexquadragintillion' },
                { value: 1e138, suffix: 'QiQag', name: 'quinquadragintillion' },
                { value: 1e135, suffix: 'QaQag', name: 'quattuorquadragintillion' },
                { value: 1e132, suffix: 'TQag', name: 'trequadragintillion' },
                { value: 1e129, suffix: 'DQag', name: 'duoquadragintillion' },
                { value: 1e126, suffix: 'UQag', name: 'unquadragintillion' },
                { value: 1e123, suffix: 'Qag', name: 'quadragintillion' },
                { value: 1e120, suffix: 'NoTg', name: 'novemtrigintillion' },
                { value: 1e117, suffix: 'OcTg', name: 'octotrigintillion' },
                { value: 1e114, suffix: 'SpTg', name: 'septentrigintillion' },
                { value: 1e111, suffix: 'SxTg', name: 'sextrigintillion' },
                { value: 1e108, suffix: 'QiTg', name: 'quintrigintillion' },
                { value: 1e105, suffix: 'QaTg', name: 'quattuortrigintillion' },
                { value: 1e102, suffix: 'TTg', name: 'tretrigintillion' },
                { value: 1e99, suffix: 'DTg', name: 'duotrigintillion' },
                { value: 1e96, suffix: 'UTg', name: 'untrigintillion' },
                { value: 1e93, suffix: 'Tg', name: 'trigintillion' },
                { value: 1e90, suffix: 'NoVg', name: 'novemvigintillion' },
                { value: 1e87, suffix: 'OcVg', name: 'octovigintillion' },
                { value: 1e84, suffix: 'SpVg', name: 'septenvigintillion' },
                { value: 1e81, suffix: 'SxVg', name: 'sexvigintillion' },
                { value: 1e78, suffix: 'QiVg', name: 'quinvigintillion' },
                { value: 1e75, suffix: 'QaVg', name: 'quattuorvigintillion' },
                { value: 1e72, suffix: 'TVg', name: 'trevigintillion' },
                { value: 1e69, suffix: 'DVg', name: 'duovigintillion' },
                { value: 1e66, suffix: 'UVg', name: 'unvigintillion' },
                { value: 1e63, suffix: 'Vg', name: 'vigintillion' },
                { value: 1e60, suffix: 'NoDc', name: 'novemdecillion' },
                { value: 1e57, suffix: 'OcDc', name: 'octodecillion' },
                { value: 1e54, suffix: 'SpDc', name: 'septendecillion' },
                { value: 1e51, suffix: 'SxDc', name: 'sexdecillion' },
                { value: 1e48, suffix: 'QiDc', name: 'quindecillion' },
                { value: 1e45, suffix: 'QaDc', name: 'quattuordecillion' },
                { value: 1e42, suffix: 'TDc', name: 'tredecillion' },
                { value: 1e39, suffix: 'DDc', name: 'duodecillion' },
                { value: 1e36, suffix: 'UDc', name: 'undecillion' },
                { value: 1e33, suffix: 'Dc', name: 'decillion' },
                { value: 1e30, suffix: 'No', name: 'nonillion' },
                { value: 1e27, suffix: 'Oc', name: 'octillion' },
                { value: 1e24, suffix: 'Sp', name: 'septillion' },
                { value: 1e21, suffix: 'Sx', name: 'sextillion' },
                { value: 1e18, suffix: 'Qi', name: 'quintillion' },
                { value: 1e15, suffix: 'Qa', name: 'quadrillion' },
                { value: 1e12, suffix: 'T', name: 'trillion' },
                { value: 1e9, suffix: 'B', name: 'billion' },
                { value: 1e6, suffix: 'M', name: 'million' }
            ],
            
            // Default precision settings
            precision: {
                currency: 0,        // Default precision for currency (whole numbers)
                multiplier: 1,      // Precision for multipliers (1.5x)
                percentage: 1,      // Precision for percentages (49.9%)
                time: 1,           // Precision for time (2.5s)
                suffix: 2,         // Precision for numbers with suffixes (1.23M)
                large: 2,          // Precision for large numbers with suffixes
                small: 2           // Precision for smaller numbers with suffixes
            },
            
            // Thresholds for when to start using suffixes
            thresholds: {
                useSuffix: 1000000, // Start using M, B, T at 1 million
                useCommas: 1000     // Use commas for numbers >= 1,000 (if not using suffixes)
            }
        };
    }

    /**
     * Format a number as currency with appropriate suffixes
     * @param {number} amount - The amount to format
     * @param {object} options - Formatting options
     * @param {number} options.precision - Override default precision
     * @param {boolean} options.forceNoSuffix - Force no suffix even for large numbers
     * @param {boolean} options.useCommas - Use comma separators instead of suffixes
     * @returns {string} - Formatted currency string
     */
    formatCurrency(amount, options = {}) {
        // For currency formatting, we want to use suffix precision when the number will get a suffix
        const willUseSuffix = !options.forceNoSuffix && Math.abs(amount) >= this.config.thresholds.useSuffix;
        const defaultPrecision = willUseSuffix ? this.config.precision.suffix : this.config.precision.currency;
        
        return this.formatNumber(amount, {
            precision: options.precision ?? defaultPrecision,
            forceNoSuffix: options.forceNoSuffix,
            useCommas: options.useCommas
        });
    }

    /**
     * Format a number with appropriate suffixes and precision
     * @param {number} value - The number to format
     * @param {object} options - Formatting options
     * @param {number} options.precision - Number of decimal places
     * @param {boolean} options.forceNoSuffix - Force no suffix even for large numbers
     * @param {boolean} options.useCommas - Use comma separators instead of suffixes
     * @param {boolean} options.forceInteger - Round to integer (no decimals)
     * @returns {string} - Formatted number string
     */
    formatNumber(value, options = {}) {
        // Handle edge cases
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        
        if (value === 0) {
            return '0';
        }

        // Handle negative numbers
        const isNegative = value < 0;
        const absValue = Math.abs(value);
        
        // Force integer if requested
        const workingValue = options.forceInteger ? Math.floor(absValue) : absValue;
        
        // Check if we should use suffixes
        if (!options.forceNoSuffix && workingValue >= this.config.thresholds.useSuffix) {
            return this._formatWithSuffix(workingValue, options.precision, isNegative);
        }
        
        // Automatically use commas for numbers 1,000 to 999,999 (unless explicitly disabled)
        if (!options.forceNoSuffix && !options.useCommas && workingValue >= this.config.thresholds.useCommas && workingValue < this.config.thresholds.useSuffix) {
            return this._formatWithCommas(workingValue, options.precision, isNegative);
        }
        
        // Check if we should use commas (when explicitly requested)
        if (options.useCommas && workingValue >= this.config.thresholds.useCommas) {
            return this._formatWithCommas(workingValue, options.precision, isNegative);
        }
        
        // Format as regular number
        const precision = options.precision ?? 0;
        let formatted;
        
        if (precision > 0) {
            formatted = workingValue.toFixed(precision);
        } else if (options.forceInteger || precision === 0) {
            formatted = Math.floor(workingValue).toString();
        } else {
            // For currency with no specified precision, use whole numbers
            formatted = Math.floor(workingValue).toString();
        }
        
        return isNegative ? '-' + formatted : formatted;
    }

    /**
     * Format a multiplier value (e.g., "2.5x")
     * @param {number} multiplier - The multiplier value
     * @param {object} options - Formatting options
     * @param {number} options.precision - Override default precision
     * @returns {string} - Formatted multiplier string
     */
    formatMultiplier(multiplier, options = {}) {
        const precision = options.precision ?? this.config.precision.multiplier;
        const formatted = this.formatNumber(multiplier, { precision, forceNoSuffix: true });
        return formatted + 'x';
    }

    /**
     * Format a percentage value (e.g., "49.9%")
     * @param {number} percentage - The percentage value (0-100)
     * @param {object} options - Formatting options
     * @param {number} options.precision - Override default precision
     * @returns {string} - Formatted percentage string
     */
    formatPercentage(percentage, options = {}) {
        const precision = options.precision ?? this.config.precision.percentage;
        const formatted = this.formatNumber(percentage, { precision, forceNoSuffix: true });
        return formatted + '%';
    }

    /**
     * Format a time value in seconds (e.g., "2.5s", "500ms", "1.2μs", "500ns")
     * @param {number} seconds - Time in seconds
     * @param {object} options - Formatting options
     * @param {number} options.precision - Override default precision
     * @param {boolean} options.useMinutes - Convert to minutes if >= 60 seconds
     * @param {boolean} options.autoScale - Automatically scale to appropriate unit (default: true)
     * @returns {string} - Formatted time string
     */
    formatTime(seconds, options = {}) {
        const autoScale = options.autoScale ?? true;
        
        // Handle minutes for large values
        if (options.useMinutes && seconds >= 60) {
            const minutes = seconds / 60;
            const precision = options.precision ?? this.config.precision.time;
            const formatted = this.formatNumber(minutes, { precision, forceNoSuffix: true });
            return formatted + 'm';
        }
        
        // Auto-scale to appropriate time unit
        if (autoScale) {
            // Nanoseconds (< 1 microsecond)
            if (seconds < 1e-6) {
                const nanoseconds = seconds * 1e9;
                const precision = options.precision ?? 0; // Whole nanoseconds by default
                const formatted = this.formatNumber(nanoseconds, { precision, forceNoSuffix: true });
                return formatted + 'ns';
            }
            // Microseconds (< 1 millisecond)
            else if (seconds < 1e-3) {
                const microseconds = seconds * 1e6;
                const precision = options.precision ?? 1; // 1 decimal place for microseconds
                const formatted = this.formatNumber(microseconds, { precision, forceNoSuffix: true });
                return formatted + 'μs';
            }
            // Milliseconds (< 1 second)
            else if (seconds < 1) {
                const milliseconds = seconds * 1000;
                const precision = options.precision ?? 0; // Whole milliseconds by default
                const formatted = this.formatNumber(milliseconds, { precision, forceNoSuffix: true });
                return formatted + 'ms';
            }
        }
        
        // Default to seconds
        const precision = options.precision ?? this.config.precision.time;
        const formatted = this.formatNumber(seconds, { precision, forceNoSuffix: true });
        return formatted + 's';
    }

    /**
     * Format a range display (e.g., "5 -> (6)" or "1.2x -> (1.7x)")
     * @param {number} current - Current value
     * @param {number} next - Next value
     * @param {string} formatter - Formatter method name ('formatCurrency', 'formatMultiplier', etc.)
     * @param {object} options - Options to pass to the formatter
     * @returns {string} - Formatted range string
     */
    formatRange(current, next, formatter = 'formatNumber', options = {}) {
        const currentFormatted = this[formatter](current, options);
        const nextFormatted = this[formatter](next, options);
        return `${currentFormatted} -> (${nextFormatted})`;
    }

    /**
     * Format an upgrade effect description
     * @param {string} effectType - Type of effect ('currency', 'multiplier', 'time', etc.)
     * @param {number} current - Current value
     * @param {number} next - Next value
     * @param {string} description - Description template
     * @returns {string} - Formatted effect description
     */
    formatUpgradeEffect(effectType, current, next, description) {
        let range;
        
        switch (effectType) {
            case 'currency':
                range = this.formatRange(current, next, 'formatCurrency');
                break;
            case 'multiplier':
                range = this.formatRange(current, next, 'formatMultiplier');
                break;
            case 'time':
                range = this.formatRange(current, next, 'formatTime');
                break;
            case 'count':
                range = this.formatRange(current, next, 'formatNumber', { forceInteger: true });
                break;
            default:
                range = this.formatRange(current, next);
        }
        
        return `${range} ${description}`;
    }

    /**
     * Private method to format numbers with suffixes (optimized with Math.log10)
     * @private
     */
    _formatWithSuffix(value, precision, isNegative) {
        // Calculate the exponent using log10 for O(1) performance
        const exponent = Math.floor(Math.log10(value));
        
        // Calculate which suffix index we need (every 3 orders of magnitude starting from 1e6)
        const suffixIndex = Math.floor((exponent - 6) / 3);
        
        // Map to our suffix array index (which is ordered largest to smallest)
        // suffixIndex 0 = 1e6 (M), 1 = 1e9 (B), 2 = 1e12 (T), etc.
        const actualIndex = this.config.suffixes.length - 1 - Math.min(suffixIndex, this.config.suffixes.length - 1);
        
        // Bounds check and verify the value is actually >= the threshold
        if (actualIndex >= 0 && actualIndex < this.config.suffixes.length) {
            const { value: threshold, suffix } = this.config.suffixes[actualIndex];
            if (value >= threshold) {
                const scaledValue = value / threshold;
                const finalPrecision = precision !== undefined ? precision : this.config.precision.suffix;
                const formatted = scaledValue.toFixed(finalPrecision);
                return (isNegative ? '-' : '') + formatted + suffix;
            }
        }
        
        // Fallback for edge cases (values between suffix thresholds)
        // This handles cases where log calculation might be slightly off due to floating point precision
        for (const { value: threshold, suffix } of this.config.suffixes) {
            if (value >= threshold) {
                const scaledValue = value / threshold;
                const finalPrecision = precision !== undefined ? precision : this.config.precision.suffix;
                const formatted = scaledValue.toFixed(finalPrecision);
                return (isNegative ? '-' : '') + formatted + suffix;
            }
        }
        
        // Final fallback (shouldn't reach here if thresholds are set correctly)
        const formatted = precision !== undefined ? value.toFixed(precision) : Math.floor(value).toString();
        return (isNegative ? '-' : '') + formatted;
    }

    /**
     * Private method to format numbers with comma separators
     * @private
     */
    _formatWithCommas(value, precision, isNegative) {
        let formatted;
        if (precision !== undefined && precision > 0) {
            formatted = value.toFixed(precision);
        } else {
            // For comma-separated numbers (1,000 to 999,999), use whole numbers
            formatted = Math.floor(value).toString();
        }
        const withCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return (isNegative ? '-' : '') + withCommas;
    }

    /**
     * Get a human-readable description of a number's magnitude
     * @param {number} value - The number to describe
     * @returns {string} - Description like "thousands", "millions", etc.
     */
    getNumberMagnitude(value) {
        const absValue = Math.abs(value);
        
        for (const { value: threshold, name } of this.config.suffixes) {
            if (absValue >= threshold) {
                return name;
            }
        }
        
        return 'ones';
    }

    /**
     * Update configuration settings
     * @param {object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get current configuration
     * @returns {object} - Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Create a singleton instance for global use
const DisplayUtils_Instance = new DisplayUtils();

// Export both the class and the singleton instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DisplayUtils, DisplayUtils_Instance };
} 
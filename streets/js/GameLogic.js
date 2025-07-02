/**
 * GameLogic - Contains core game logic and street matching
 */
class GameLogic {
    constructor() {
        // Common street suffixes for normalization
        this.streetSuffixes = [
            'HIGHWAY', 'HWY', 'BLVD', 'BOULEVARD', 'TERRACE', 'ST', 'STREET', 
            'WAY', 'TUNNEL', 'AVE', 'AVENUE', 'FREEWAY', 'FWY', 'CIR', 'CIRCLE', 
            'ALLEY', 'ALY', 'ROAD', 'RD', 'PARK', 'LOOP', 'LANE', 'LN', 
            'STAIRWAY', 'STAIRS', 'COURT', 'CT', 'PLACE', 'PL', 'PROMENADE', 
            'DRIVE', 'DR'
        ];

        // Common prefix variations
        this.prefixVariations = [
            ['E', 'EAST'],
            ['W', 'WEST'], 
            ['N', 'NORTH'],
            ['S', 'SOUTH']
        ];

        // Street name replacements for common variations
        this.nameReplacements = [
            ['JFK', 'JOHN F KENNEDY'],
            ['MARTIN LUTHER KING', 'MARTIN LUTHER KING JUNIOR'],
            ['MARTIN LUTHER KING JR', 'MARTIN LUTHER KING JUNIOR'],
            ['MLK JR', 'MARTIN LUTHER KING JUNIOR'],
            ['MLKJR', 'MARTIN LUTHER KING JUNIOR'],
            ['MLKJUNIOR', 'MARTIN LUTHER KING JUNIOR'],
            ['MLK JUNIOR', 'MARTIN LUTHER KING JUNIOR'],
            ['MLK', 'MARTIN LUTHER KING JUNIOR'],
            ['ST FRANCIS', 'SAINT FRANCIS'],
            ['SO VAN NESS', 'SOUTH VAN NESS'],
            ['UPPER GREAT', 'GREAT'],
            ['LOWER GREAT', 'GREAT'],
            ['EMBARCADERO', 'THE EMBARCADERO']
        ];

        // Ordinal number conversions
        this.ordinalReplacements = [
            ['FIRST', '1ST'],
            ['SECOND', '2ND'], 
            ['THIRD', '3RD'],
            ['FOURTH', '4TH'],
            ['FIFTH', '5TH'],
            ['SIXTH', '6TH'],
            ['SEVENTH', '7TH'],
            ['EIGHTH', '8TH'],
            ['NINTH', '9TH'],
            ['TENTH', '10TH'],
            ['ELEVENTH', '11TH'],
            ['TWELFTH', '12TH'],
            ['TWELVETH', '12TH'] // Common misspelling
        ];
    }

    /**
     * Advanced street name normalization based on Carvin's approach
     */
    normalizeStreetName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }

        let normalized = name.trim().toUpperCase();

        // Remove common prefixes like "THE"
        normalized = normalized.replace(/^THE\s+/, '');

        // Handle directional prefixes
        this.prefixVariations.forEach(([short, long]) => {
            const shortPattern = new RegExp(`^${short}\\s+`, 'g');
            const longPattern = new RegExp(`^${long}\\s+`, 'g');
            if (shortPattern.test(normalized)) {
                normalized = normalized.replace(shortPattern, `${long} `);
            }
        });

        // Remove common suffixes for matching
        this.streetSuffixes.forEach(suffix => {
            const pattern = new RegExp(`\\s+${suffix}$`, 'i');
            normalized = normalized.replace(pattern, '');
        });

        // Handle "ST" -> "SAINT" conversion
        if (normalized.startsWith('ST ')) {
            normalized = 'SAINT ' + normalized.slice(3);
        }

        // Handle "DOCTOR" -> "DR" conversion  
        if (normalized.startsWith('DOCTOR ')) {
            normalized = 'DR ' + normalized.slice(7);
        }

        // Apply name replacements for common variations
        this.nameReplacements.forEach(([from, to]) => {
            if (normalized === from) {
                normalized = to;
            }
        });

        // Handle ordinal numbers
        this.ordinalReplacements.forEach(([word, ordinal]) => {
            const wordPattern = new RegExp(`\\b${word}\\b`, 'g');
            normalized = normalized.replace(wordPattern, ordinal);
        });

        // Clean up extra spaces
        normalized = normalized.replace(/\s+/g, ' ').trim();

        return normalized;
    }

    /**
     * Create multiple normalized variations of a street name for better matching
     */
    createNameVariations(name) {
        const variations = new Set();
        const base = this.normalizeStreetName(name);
        variations.add(base);

        // Add variation without ordinal conversion
        let withoutOrdinals = name.trim().toUpperCase();
        withoutOrdinals = withoutOrdinals.replace(/^THE\s+/, '');
        this.streetSuffixes.forEach(suffix => {
            const pattern = new RegExp(`\\s+${suffix}$`, 'i');
            withoutOrdinals = withoutOrdinals.replace(pattern, '');
        });
        withoutOrdinals = withoutOrdinals.replace(/\s+/g, ' ').trim();
        variations.add(withoutOrdinals);

        // Add variation with original ordinals but normalized suffixes
        let originalOrdinals = name.trim().toUpperCase();
        originalOrdinals = originalOrdinals.replace(/^THE\s+/, '');
        this.streetSuffixes.forEach(suffix => {
            const pattern = new RegExp(`\\s+${suffix}$`, 'i');
            originalOrdinals = originalOrdinals.replace(pattern, '');
        });
        this.nameReplacements.forEach(([from, to]) => {
            if (originalOrdinals === from) {
                originalOrdinals = to;
            }
        });
        originalOrdinals = originalOrdinals.replace(/\s+/g, ' ').trim();
        variations.add(originalOrdinals);

        return Array.from(variations).filter(v => v.length > 0);
    }

    /**
     * Find streets matching any variation of the normalized name
     */
    findMatchingStreets(inputName, streetsData) {
        const inputVariations = this.createNameVariations(inputName);
        
        return streetsData.filter(street => {
            if (street.discovered) return false;
            
            const streetVariations = this.createNameVariations(street.name);
            
            // Check for exact matches first (highest priority)
            const exactMatch = inputVariations.some(inputVar => 
                streetVariations.some(streetVar => inputVar === streetVar)
            );
            
            if (exactMatch) return true;
            
            // Check if the input is a prefix of the street name (medium priority)
            // This handles cases like "MARKET" matching "MARKET ST"
            const prefixMatch = inputVariations.some(inputVar => {
                if (inputVar.length < 2) return false; // Avoid single letter matches
                return streetVariations.some(streetVar => 
                    streetVar.startsWith(inputVar + ' ') || // "MARKET" matches "MARKET ST"
                    streetVar.startsWith(inputVar) && streetVar.length <= inputVar.length + 3 // Allow small suffix
                );
            });
            
            if (prefixMatch) return true;
            
            // For multi-word inputs, check if all words are present in order (lowest priority)
            // This handles complex names like "MARTIN LUTHER KING"
            const multiWordMatch = inputVariations.some(inputVar => {
                if (inputVar.split(' ').length < 2) return false; // Only for multi-word inputs
                
                return streetVariations.some(streetVar => {
                    const inputWords = inputVar.split(' ');
                    const streetWords = streetVar.split(' ');
                    
                    // Check if all input words appear in the street name in order
                    let streetIndex = 0;
                    for (const inputWord of inputWords) {
                        let found = false;
                        for (let i = streetIndex; i < streetWords.length; i++) {
                            if (streetWords[i] === inputWord || streetWords[i].startsWith(inputWord)) {
                                streetIndex = i + 1;
                                found = true;
                                break;
                            }
                        }
                        if (!found) return false;
                    }
                    return true;
                });
            });
            
            return multiWordMatch;
        });
    }

    /**
     * Process a street guess with improved feedback
     */
    processGuess(guess, gameState) {
        if (!guess || !gameState.isPlaying) {
            return { success: false, message: 'Invalid guess or game not active' };
        }

        const matchingStreets = this.findMatchingStreets(guess, gameState.streetsData);

        if (matchingStreets.length > 0) {
            const totalMiles = gameState.discoverStreets(matchingStreets);
            const percentageAdded = (totalMiles / gameState.totalMiles * 100);
            
            return {
                success: true,
                streets: matchingStreets,
                totalMiles,
                percentageAdded: percentageAdded.toFixed(2),
                message: matchingStreets.length === 1 
                    ? `${matchingStreets[0].fullName} (+${percentageAdded.toFixed(2)}%)`
                    : `Found ${matchingStreets.length} streets: ${matchingStreets.map(s => s.fullName).join(', ')} (+${percentageAdded.toFixed(2)}%)`
            };
        } else {
            // Provide helpful suggestions for close matches
            const suggestions = this.findSimilarStreets(guess, gameState.streetsData);
            const suggestionText = suggestions.length > 0 
                ? ` Did you mean: ${suggestions.slice(0, 3).map(s => s.fullName).join(', ')}?`
                : '';
            
            return {
                success: false,
                message: `"${guess}" not found.${suggestionText}`
            };
        }
    }

    /**
     * Find similar street names for suggestions
     */
    findSimilarStreets(inputName, streetsData) {
        const inputNormalized = this.normalizeStreetName(inputName);
        const availableStreets = streetsData.filter(s => !s.discovered);
        
        // Find streets that start with the input (most relevant)
        const startsWith = availableStreets.filter(street => {
            const streetNormalized = this.normalizeStreetName(street.name);
            return streetNormalized.startsWith(inputNormalized) && 
                   streetNormalized !== inputNormalized; // Don't suggest exact matches
        });
        
        if (startsWith.length > 0) {
            return startsWith.sort((a, b) => a.name.length - b.name.length);
        }
        
        // If no prefix matches, find streets containing the input as a whole word
        const containsAsWord = availableStreets.filter(street => {
            const streetNormalized = this.normalizeStreetName(street.name);
            const inputWords = inputNormalized.split(' ');
            const streetWords = streetNormalized.split(' ');
            
            // Check if any complete input word appears in the street name
            return inputWords.some(inputWord => 
                inputWord.length > 2 && // Only suggest for words longer than 2 characters
                streetWords.some(streetWord => streetWord === inputWord)
            );
        });
        
        // Sort by relevance (shorter names first, then by how many words match)
        return containsAsWord.sort((a, b) => {
            const aWords = this.normalizeStreetName(a.name).split(' ');
            const bWords = this.normalizeStreetName(b.name).split(' ');
            const inputWords = inputNormalized.split(' ');
            
            const aMatches = aWords.filter(word => inputWords.includes(word)).length;
            const bMatches = bWords.filter(word => inputWords.includes(word)).length;
            
            // First sort by number of matching words (more matches = better)
            if (aMatches !== bMatches) {
                return bMatches - aMatches;
            }
            
            // Then by length (shorter = better)
            return a.name.length - b.name.length;
        });
    }

    /**
     * Sort streets based on selected order
     */
    sortStreets(streets, sortOrder) {
        const sortedStreets = [...streets]; // Create a copy to avoid mutating original
        
        switch (sortOrder) {
            case 'alphabetical':
                sortedStreets.sort((a, b) => a.fullName.localeCompare(b.fullName));
                break;
            case 'length':
                sortedStreets.sort((a, b) => b.length - a.length);
                break;
            case 'discovery':
            default:
                sortedStreets.sort((a, b) => (b.discoveryTime || 0) - (a.discoveryTime || 0));
                break;
        }
        
        return sortedStreets;
    }

    /**
     * Validate street name input
     */
    validateStreetName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, message: 'Street name must be a non-empty string' };
        }

        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return { valid: false, message: 'Street name cannot be empty' };
        }

        if (trimmed.length > 100) {
            return { valid: false, message: 'Street name is too long' };
        }

        return { valid: true, normalizedName: this.normalizeStreetName(trimmed) };
    }

    /**
     * Calculate game score based on completion time and efficiency
     */
    calculateScore(gameState, startTime) {
        if (!gameState.isGameComplete()) {
            return 0;
        }

        const completionTime = Date.now() - startTime;
        const timeInMinutes = completionTime / (1000 * 60);
        const baseScore = 1000;
        const timeBonus = Math.max(0, 500 - timeInMinutes * 5);
        const efficiencyBonus = (gameState.streetsData.length / Math.max(1, gameState.discoveredStreets.size)) * 100;

        return Math.round(baseScore + timeBonus + efficiencyBonus);
    }
}

export default GameLogic; 
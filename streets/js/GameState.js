/**
 * GameState - Manages game state and data
 */
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentRegion = null;
        this.isPlaying = false;
        this.discoveredStreets = new Set();
        this.totalMiles = 0;
        this.discoveredMiles = 0;
        this.streetsData = [];
        this.sortOrder = 'discovery';
    }

    /**
     * Set region data
     */
    setRegionData(region, streetsData) {
        this.currentRegion = region;
        this.streetsData = streetsData;
        this.totalMiles = streetsData.reduce((sum, street) => sum + street.length, 0);
    }

    /**
     * Mark streets as discovered
     */
    discoverStreets(streets) {
        let totalMiles = 0;
        
        streets.forEach(street => {
            street.discovered = true;
            street.discoveryTime = Date.now();
            this.discoveredStreets.add(street.id);
            totalMiles += street.length;
        });

        this.discoveredMiles += totalMiles;
        return totalMiles;
    }

    /**
     * Get discovered streets
     */
    getDiscoveredStreets() {
        return this.streetsData.filter(street => street.discovered);
    }

    /**
     * Get completion percentage
     */
    getCompletionPercentage() {
        return this.totalMiles > 0 
            ? (this.discoveredMiles / this.totalMiles) * 100 
            : 0;
    }

    /**
     * Check if game is complete
     */
    isGameComplete() {
        return this.discoveredStreets.size === this.streetsData.length;
    }

    /**
     * Get game statistics
     */
    getStatistics() {
        return {
            region: this.currentRegion,
            streetsFound: this.discoveredStreets.size,
            totalStreets: this.streetsData.length,
            milesDiscovered: this.discoveredMiles,
            totalMiles: this.totalMiles,
            completionPercentage: Math.round(this.getCompletionPercentage())
        };
    }

    /**
     * Start new game
     */
    startNewGame() {
        this.isPlaying = true;
        this.discoveredStreets.clear();
        this.discoveredMiles = 0;
        
        // Reset street discovery status
        this.streetsData.forEach(street => {
            street.discovered = false;
            street.discoveryTime = null;
        });
    }
}

export default GameState; 
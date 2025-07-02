/**
 * DataManager - Handles data loading and management
 */
class DataManager {
    constructor() {
        this.cache = new Map();
        this.filters = null; // Will store loaded filter data
    }

    /**
     * Load region data
     */
    async loadRegionData(region) {
        // Check cache first
        if (this.cache.has(region)) {
            return this.cache.get(region);
        }

        try {
            // Load filters if not already loaded
            if (!this.filters) {
                await this.loadFilters();
            }
            
            // Simulate API call delay
            await this.simulateLoadingDelay();
            
            // Map region identifiers to the new naming convention
            const regionMapping = {
                'san_francisco_ca': { city: 'san_francisco', state: 'ca' },
                'berkeley_ca': { city: 'berkeley', state: 'ca' },
                'los_angeles_ca': { city: 'los_angeles', state: 'ca' },
                'oakland_ca': { city: 'oakland', state: 'ca' },
                'new_york_ny': { city: 'new_york', state: 'ny' },
                'seattle_wa': { city: 'seattle', state: 'wa' }
            };
            
            const regionInfo = regionMapping[region];
            if (!regionInfo) {
                throw new Error(`Region "${region}" is not supported`);
            }
            
            const streetsData = await this.loadCityData(regionInfo.city, regionInfo.state);

            // Apply filters to the data
            const filteredData = this.applyFilters(streetsData, region);

            // Cache the filtered data
            this.cache.set(region, filteredData);
            return filteredData;
            
        } catch (error) {
            console.error('Error loading region data:', error);
            throw error;
        }
    }

    /**
     * Simulate loading delay for better UX
     */
    async simulateLoadingDelay() {
        const delay = Math.random() * 1000 + 1000; // 1-2 seconds
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Load street filters from JSON file
     */
    async loadFilters() {
        try {
            const response = await fetch('./street_data/street_filters.json');
            if (!response.ok) {
                console.warn('Street filters file not found, proceeding without filters');
                this.filters = {};
                return;
            }
            
            this.filters = await response.json();
            console.log('Loaded street filters:', Object.keys(this.filters));
        } catch (error) {
            console.warn('Error loading street filters, proceeding without filters:', error);
            this.filters = {};
        }
    }

    /**
     * Apply filters to street data based on region
     */
    applyFilters(streetsData, region) {
        if (!this.filters || !this.filters[region]) {
            console.log(`No filters found for region: ${region}`);
            return streetsData;
        }

        const filtersForRegion = this.filters[region];
        const originalCount = streetsData.length;
        
        // Filter out streets whose full_name exactly matches any filter
        const filteredData = streetsData.filter(street => {
            return !filtersForRegion.includes(street.fullName);
        });

        const filteredCount = originalCount - filteredData.length;
        console.log(`Applied filters for ${region}: filtered out ${filteredCount} streets (${originalCount} -> ${filteredData.length})`);
        
        if (filteredCount > 0) {
            console.log('Filtered street names:', 
                streetsData
                    .filter(street => filtersForRegion.includes(street.fullName))
                    .map(street => street.fullName)
                    .slice(0, 10) // Show first 10 as example
            );
        }

        return filteredData;
    }

    /**
     * Load city street data from JSON file using new naming convention
     */
    async loadCityData(city, state) {
        const filename = `${city}_${state}_streets.json`;
        const fallbackFilename = `${city.replace('_', '-')}_streets.json`; // Fallback to old naming
        
        try {
            // Try new naming convention first
            let response = await fetch(`./street_data/data/${filename}`);
            
            // If new naming fails, try old naming convention
            if (!response.ok && response.status === 404) {
                console.warn(`File ${filename} not found, trying fallback naming`);
                response = await fetch(`./street_data/data/${fallbackFilename}`);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filename}`);
            }
            
            const data = await response.json();
            
            // Transform the data to match the expected format with enhanced properties
            const transformedData = data.streets.map(street => ({
                id: street.id,
                name: street.name,
                cleanName: this.normalizeStreetName(street.name), // For better matching
                suffix: street.suffix || '',
                fullName: street.full_name,
                length: street.length,
                coordinates: street.coordinates,
                city: street.city,
                state: street.state,
                discovered: false, // Always start as undiscovered
                discoveryTime: null,
                // Add display properties for better UI
                displayName: street.full_name,
                percentOfTotal: 0 // Will be calculated after loading all streets
            }));
            
            // Calculate percentage of total for each street
            const totalLength = transformedData.reduce((sum, street) => sum + street.length, 0);
            transformedData.forEach(street => {
                street.percentOfTotal = (street.length / totalLength * 100);
            });
            
            // Group streets by clean name for better matching
            const streetGroups = this.groupStreetsByName(transformedData);
            
            console.log(`Loaded ${transformedData.length} streets from ${filename}`);
            console.log(`Grouped into ${Object.keys(streetGroups).length} unique street names`);
            console.log(`Total miles: ${data.total_miles || 'unknown'}`);
            console.log('Sample street data:', transformedData[0]);
            console.log('Street groups sample:', Object.keys(streetGroups).slice(0, 5));
            
            return transformedData;
            
        } catch (error) {
            console.error(`Error loading street data for ${city}, ${state}:`, error);
            
            // Fallback to mock data only for San Francisco
            if (city === 'san_francisco' && state === 'ca') {
                console.warn('Falling back to mock San Francisco data');
                return this.generateSanFranciscoData();
            } else {
                throw new Error(`Failed to load street data for ${city}, ${state}. Please ensure the data file exists.`);
            }
        }
    }

    /**
     * Normalize street name for better matching (simplified version of GameLogic normalization)
     */
    normalizeStreetName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }

        return name
            .toUpperCase()
            .replace(/^THE\s+/, '') // Remove "THE" prefix
            .replace(/\s+(ST|AVE|DR|RD|BLVD|WAY|PL|CT|LN|STREET|AVENUE|DRIVE|ROAD|BOULEVARD|PLACE|COURT|LANE)$/i, '') // Remove suffixes
            .replace(/\bMLK\b/g, 'MARTIN LUTHER KING')
            .replace(/\bJFK\b/g, 'JOHN F KENNEDY')
            .replace(/\b1ST\b/g, 'FIRST')
            .replace(/\b2ND\b/g, 'SECOND')
            .replace(/\b3RD\b/g, 'THIRD')
            .trim();
    }

    /**
     * Group streets by their normalized names for better matching
     */
    groupStreetsByName(streets) {
        const groups = {};
        
        streets.forEach(street => {
            const cleanName = street.cleanName;
            if (!groups[cleanName]) {
                groups[cleanName] = [];
            }
            groups[cleanName].push(street);
        });
        
        return groups;
    }

    /**
     * Generate mock street data for San Francisco (fallback)
     */
    generateSanFranciscoData() {
        return [
            { id: '1', name: 'MARKET', suffix: 'ST', fullName: 'MARKET ST', length: 3.2, discovered: false },
            { id: '2', name: 'LOMBARD', suffix: 'ST', fullName: 'LOMBARD ST', length: 1.1, discovered: false },
            { id: '3', name: 'BROADWAY', suffix: '', fullName: 'BROADWAY', length: 2.8, discovered: false },
            { id: '4', name: 'CALIFORNIA', suffix: 'ST', fullName: 'CALIFORNIA ST', length: 4.1, discovered: false },
            { id: '5', name: 'FILLMORE', suffix: 'ST', fullName: 'FILLMORE ST', length: 2.3, discovered: false },
            { id: '6', name: 'GEARY', suffix: 'BLVD', fullName: 'GEARY BLVD', length: 5.7, discovered: false },
            { id: '7', name: 'VAN NESS', suffix: 'AVE', fullName: 'VAN NESS AVE', length: 3.9, discovered: false },
            { id: '8', name: 'MISSION', suffix: 'ST', fullName: 'MISSION ST', length: 6.2, discovered: false },
            { id: '9', name: 'POLK', suffix: 'ST', fullName: 'POLK ST', length: 2.1, discovered: false },
            { id: '10', name: 'UNION', suffix: 'ST', fullName: 'UNION ST', length: 1.8, discovered: false },
            { id: '11', name: 'DIVISADERO', suffix: 'ST', fullName: 'DIVISADERO ST', length: 3.5, discovered: false },
            { id: '12', name: 'VALENCIA', suffix: 'ST', fullName: 'VALENCIA ST', length: 4.8, discovered: false },
            { id: '13', name: 'CASTRO', suffix: 'ST', fullName: 'CASTRO ST', length: 2.7, discovered: false },
            { id: '14', name: 'HAIGHT', suffix: 'ST', fullName: 'HAIGHT ST', length: 2.9, discovered: false },
            { id: '15', name: 'CHESTNUT', suffix: 'ST', fullName: 'CHESTNUT ST', length: 2.4, discovered: false }
        ];
    }

    /**
     * Save game progress to local storage
     */
    saveGameProgress(gameState) {
        try {
            const progressData = {
                region: gameState.currentRegion,
                discoveredStreets: Array.from(gameState.discoveredStreets),
                discoveredMiles: gameState.discoveredMiles,
                sortOrder: gameState.sortOrder,
                timestamp: Date.now()
            };
            
            localStorage.setItem('streetNamesGame_progress', JSON.stringify(progressData));
            return true;
        } catch (error) {
            console.error('Error saving game progress:', error);
            return false;
        }
    }

    /**
     * Load game progress from local storage
     */
    loadGameProgress() {
        try {
            const progressData = localStorage.getItem('streetNamesGame_progress');
            if (progressData) {
                return JSON.parse(progressData);
            }
            return null;
        } catch (error) {
            console.error('Error loading game progress:', error);
            return null;
        }
    }

    /**
     * Clear saved game progress
     */
    clearGameProgress() {
        try {
            localStorage.removeItem('streetNamesGame_progress');
            return true;
        } catch (error) {
            console.error('Error clearing game progress:', error);
            return false;
        }
    }

    /**
     * Get available regions
     */
    getAvailableRegions() {
        return [
            {
                id: 'san_francisco_ca',
                name: 'San Francisco',
                description: 'California, USA',
                available: true,
                filename: 'san_francisco_ca_streets.json'
            },
            {
                id: 'berkeley_ca',
                name: 'Berkeley',
                description: 'California, USA',
                available: true,
                filename: 'berkeley_ca_streets.json'
            },
            {
                id: 'los_angeles_ca',
                name: 'Los Angeles',
                description: 'California, USA',
                available: true,
                filename: 'los_angeles_ca_streets.json'
            },
            {
                id: 'oakland_ca',
                name: 'Oakland',
                description: 'California, USA',
                available: true,
                filename: 'oakland_ca_streets.json'
            },
            {
                id: 'new_york_ny',
                name: 'New York',
                description: 'New York, USA',
                available: true,
                filename: 'new_york_ny_streets.json'
            },
            {
                id: 'seattle_wa',
                name: 'Seattle',
                description: 'Washington, USA',
                available: true,
                filename: 'seattle_wa_streets.json'
            }
            // Future regions can be added here
        ];
    }

    /**
     * Validate region
     */
    isValidRegion(region) {
        const availableRegions = this.getAvailableRegions();
        return availableRegions.some(r => r.id === region);
    }
    
    /**
     * Check if region data is available
     */
    async checkRegionAvailability(region) {
        const availableRegions = this.getAvailableRegions();
        const regionInfo = availableRegions.find(r => r.id === region);
        
        if (!regionInfo) {
            return false;
        }
        
        try {
            // Try to fetch the data file to check if it exists
            const response = await fetch(`./street_data/data/${regionInfo.filename}`, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get regions with actual data availability
     */
    async getAvailableRegionsWithData() {
        const regions = this.getAvailableRegions();
        const regionsWithAvailability = await Promise.all(
            regions.map(async (region) => ({
                ...region,
                available: await this.checkRegionAvailability(region.id)
            }))
        );
        
        return regionsWithAvailability;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.filters = null; // Also clear filters so they get reloaded
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }

    /**
     * Reload filters from file
     */
    async reloadFilters() {
        this.filters = null;
        await this.loadFilters();
        // Clear cache so data gets refiltered on next load
        this.cache.clear();
    }

    /**
     * Get current filters
     */
    getFilters() {
        return this.filters;
    }
}

export default DataManager; 
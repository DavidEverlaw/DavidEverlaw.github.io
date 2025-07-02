/**
 * MapManager - Handles OpenStreetMap integration using Leaflet.js with performance optimizations
 */
class MapManager {
    constructor() {
        this.map = null;
        this.streetLayers = new Map(); // Store street layers by street ID
        this.streetData = [];
        this.discoveredStreets = new Set();
        this.hoverTooltip = null; // Store hover tooltip reference
        this.currentRegion = null; // Store current region
        
        // Performance optimization properties
        this.renderingEnabled = true;
        this.lastViewportBounds = null;
        this.visibleStreets = new Set(); // Track currently visible streets
        this.renderQueue = new Set(); // Queue of streets to render
        this.isRendering = false;
        this.maxStreetsPerFrame = 400; // Limit streets rendered per animation frame
        this.viewportBuffer = 0.2; // 10% buffer around viewport for smooth panning
        
        // Performance metrics
        this.performanceMetrics = {
            totalStreets: 0,
            renderedStreets: 0,
            lastRenderTime: 0,
            averageRenderTime: 0,
            renderCount: 0
        };
        
        // Debounce timers
        this.zoomDebounceTimer = null;
        this.viewportDebounceTimer = null;
        
        // Level of detail settings
        this.lodSettings = {
            // At low zoom levels, show fewer streets for better performance
            minZoomForAllStreets: 13,
            lowZoomStreetLimit: 500,  // Show max 500 streets at low zoom
            mediumZoomStreetLimit: 1500, // Show max 1500 streets at medium zoom
            streetImportanceThreshold: 0.3 // Miles - prioritize longer streets
        };
        
        // Define bounds for each region
        this.regionBounds = {
            'san_francisco_ca': {
                center: [37.7749, -122.4194],
                zoom: 12,
                minZoom: 10,
                maxZoom: 18,
                bounds: [
                    [37.708, -122.515], // Southwest
                    [37.835, -122.355]  // Northeast
                ],
                panBounds: [
                    [37.3, -122.8], // Southwest - extends to San Jose area
                    [38.1, -121.9]  // Northeast - extends to Sacramento area
                ]
            },
            'berkeley_ca': {
                center: [37.8715, -122.2730],
                zoom: 13,
                minZoom: 11,
                maxZoom: 18,
                bounds: [
                    [37.845, -122.310], // Southwest
                    [37.895, -122.235]  // Northeast
                ],
                panBounds: [
                    [37.8, -122.35], // Southwest
                    [37.95, -122.2]  // Northeast
                ]
            },
            'los_angeles_ca': {
                center: [34.0522, -118.2437],
                zoom: 11,
                minZoom: 9,
                maxZoom: 18,
                bounds: [
                    [33.7, -118.7], // Southwest
                    [34.4, -117.8]  // Northeast
                ],
                panBounds: [
                    [33.5, -119.0], // Southwest
                    [34.6, -117.5]  // Northeast
                ]
            },
            'new_york_ny': {
                center: [40.7128, -74.0060],
                zoom: 11,
                minZoom: 9,
                maxZoom: 18,
                bounds: [
                    [40.47, -74.26], // Southwest
                    [40.92, -73.70]  // Northeast
                ],
                panBounds: [
                    [40.4, -74.4], // Southwest
                    [41.0, -73.5]  // Northeast
                ]
            },
            'oakland_ca': {
                center: [37.8044, -122.2712],
                zoom: 12,
                minZoom: 10,
                maxZoom: 18,
                bounds: [
                    [37.754, -122.355], // Southwest
                    [37.885, -122.114]  // Northeast
                ],
                panBounds: [
                    [37.7, -122.4], // Southwest
                    [37.95, -122.0] // Northeast
                ]
            },
            'seattle_wa': {
                center: [47.6062, -122.3321],
                zoom: 11,
                minZoom: 9,
                maxZoom: 18,
                bounds: [
                    [47.48, -122.46], // Southwest
                    [47.73, -122.23]  // Northeast
                ],
                panBounds: [
                    [47.4, -122.6], // Southwest
                    [47.8, -122.1]  // Northeast
                ]
            }
        };
    }

    /**
     * Wait for Leaflet to be available
     */
    async waitForLeaflet(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (typeof L !== 'undefined') {
                resolve();
                return;
            }

            const checkInterval = 100;
            let elapsed = 0;
            
            const interval = setInterval(() => {
                if (typeof L !== 'undefined') {
                    clearInterval(interval);
                    resolve();
                } else if (elapsed >= timeout) {
                    clearInterval(interval);
                    reject(new Error('Leaflet library failed to load within timeout period'));
                }
                elapsed += checkInterval;
            }, checkInterval);
        });
    }

    /**
     * Get bounds for current region or fallback to San Francisco
     */
    getCurrentRegionBounds() {
        return this.regionBounds[this.currentRegion] || this.regionBounds['san_francisco_ca'];
    }

    /**
     * Set current region
     */
    setRegion(region) {
        if (this.regionBounds[region]) {
            this.currentRegion = region;
            console.log(`MapManager region set to: ${region}`);
        } else {
            console.warn(`Unknown region: ${region}, using San Francisco as fallback`);
            this.currentRegion = 'san_francisco_ca';
        }
    }

    /**
     * Initialize the map with performance optimizations for large datasets
     */
    initializeMap(containerId = 'map', region = null) {
        // Set region if provided
        if (region) {
            this.setRegion(region);
        }
        
        const bounds = this.getCurrentRegionBounds();
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            throw new Error('Leaflet library is not loaded. Make sure the Leaflet script is included before initializing the map.');
        }

        // Check if the container exists
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Map container with id "${containerId}" not found.`);
        }

        // Remove existing map if any
        if (this.map) {
            this.map.remove();
        }

        try {
            // Create the map with performance optimizations
            this.map = L.map(containerId, {
                center: bounds.center,
                zoom: bounds.zoom,
                minZoom: bounds.minZoom,
                maxZoom: bounds.maxZoom,
                zoomControl: true,
                attributionControl: false, // Remove attribution for cleaner look
                preferCanvas: true, // Use canvas renderer for better performance
                zoomSnap: 0.5, // Allow smoother zoom levels
                wheelPxPerZoomLevel: 120, // Smoother mouse wheel zoom
                
                // Performance optimizations
                renderer: L.canvas({ padding: 0.2, tolerance: 10 }), // Canvas with tolerance for touch
                fadeAnimation: false, // Disable fade animations for performance
                zoomAnimation: true, // Keep zoom animations for UX
                markerZoomAnimation: false, // Disable marker zoom animations
                trackResize: true // Track container resize
            });

            // Add custom tile layer with minimal styling
            this.addOptimizedTileLayer();

            // Set generous bounds for panning - allow exploring the broader region
            this.map.setMaxBounds(bounds.panBounds);

            // Add custom zoom control in better position
            this.addCustomZoomControl();

            // Add optimized event listeners with debouncing
            this.addOptimizedEventListeners();

            console.log('Map initialized successfully with performance optimizations');
            return this.map;
        } catch (error) {
            console.error('Error creating Leaflet map:', error);
            throw error;
        }
    }

    /**
     * Add optimized tile layer with minimal features and no text
     */
    addOptimizedTileLayer() {
        const bounds = this.getCurrentRegionBounds();
        
        // Use CartoDB Positron for clean, minimal styling
        const positronLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: bounds.maxZoom,
            minZoom: bounds.minZoom,
            
            // Performance optimizations
            updateWhenIdle: true,             // Better performance during panning
            unloadInvisibleTiles: false,       // Save memory
            detectRetina: true,               // Better display on high-DPI screens
            // keepBuffer: 1,                    // Reduce memory usage slightly
            updateInterval: 150,              // Slightly faster updates than default
            
            // Visual enhancements
            opacity: 1,                     // Slightly transparent to let street colors show better
            interactive: false,
            
            // Error handling
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 transparent PNG
        });

        // Add water color overlay for areas outside the region
        const waterLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: bounds.maxZoom,
            minZoom: bounds.minZoom,
            opacity: 0 // Start with no labels
        });

        positronLayer.addTo(this.map);
        
        // Create a polygon to mask areas outside current region bounds
        this.addRegionMask();
    }

    /**
     * Add a mask to hide areas outside current region
     */
    addRegionMask() {
        const bounds = this.getCurrentRegionBounds();
        
        // Create a polygon that covers the broader area except current region
        // This allows generous panning while still showing the game region clearly
        
        // Calculate world bounds based on pan bounds (make them larger)
        const panBounds = bounds.panBounds;
        const worldBounds = [
            [panBounds[0][0] - 2, panBounds[0][1] - 2], // SW - extend further
            [panBounds[0][0] - 2, panBounds[1][1] + 2], // SE - extend further  
            [panBounds[1][0] + 2, panBounds[1][1] + 2], // NE - extend further
            [panBounds[1][0] + 2, panBounds[0][1] - 2], // NW - extend further
            [panBounds[0][0] - 2, panBounds[0][1] - 2]  // Close
        ];
        
        const regionBounds = [
            [bounds.bounds[0][0], bounds.bounds[0][1]], // SW
            [bounds.bounds[0][0], bounds.bounds[1][1]], // SE  
            [bounds.bounds[1][0], bounds.bounds[1][1]], // NE
            [bounds.bounds[1][0], bounds.bounds[0][1]], // NW
            [bounds.bounds[0][0], bounds.bounds[0][1]]  // Close
        ];

        const maskPolygon = L.polygon([worldBounds, regionBounds], {
            // Enhanced water-like appearance
            color: '#4a90a4',                 // Slightly darker border for definition
            fillColor: '#a8dadc',
            fillOpacity: 0.7,                 // Slightly more opaque for better masking
            weight: 1,                        // Thin border for subtle definition
            opacity: 0.8,                     // Semi-transparent border
            
            // Smooth, polished look
            lineCap: 'round',
            lineJoin: 'round',
            
            // Performance and interaction
            interactive: false,               // Keep non-interactive
            
            // Custom styling
            className: 'region-mask',         // For custom CSS if needed
            
            // Ensure it stays in background
            pane: 'tilePane'                  // Put it with tiles, behind overlays
        });

        maskPolygon.addTo(this.map);
    }

    /**
     * Add custom zoom control with better positioning
     */
    addCustomZoomControl() {
        // Remove default zoom control
        this.map.zoomControl.remove();
        
        // Add new zoom control in top-right position
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);
    }

    /**
     * Add optimized event listeners with debouncing for performance
     */
    addOptimizedEventListeners() {
        // Debounced zoom event
        this.map.on('zoomend', () => {
            if (this.zoomDebounceTimer) {
                clearTimeout(this.zoomDebounceTimer);
            }
            this.zoomDebounceTimer = setTimeout(() => {
                this.onZoomChange();
            }, 100); // 100ms debounce
        });

        // Debounced viewport change events
        this.map.on('moveend', () => {
            if (this.viewportDebounceTimer) {
                clearTimeout(this.viewportDebounceTimer);
            }
            this.viewportDebounceTimer = setTimeout(() => {
                this.onViewportChange();
            }, 150); // 150ms debounce for smoother panning
        });

        // Immediate zoom start for UI feedback
        this.map.on('zoomstart', () => {
            this.renderingEnabled = false; // Pause rendering during zoom
        });

        // Immediate move start for UI feedback
        this.map.on('movestart', () => {
            this.renderingEnabled = false; // Pause rendering during move
        });
    }

    /**
     * Handle zoom changes with performance optimization
     */
    onZoomChange() {
        this.renderingEnabled = true;
        const currentZoom = this.map.getZoom();
        
        // Update street weights for visible streets only
        this.updateVisibleStreetWeights();
        
        // Trigger viewport-based rendering with level-of-detail
        this.updateViewportRendering(true);
        
        console.log(`Zoom changed to ${currentZoom}, rendered ${this.visibleStreets.size} streets`);
    }

    /**
     * Handle viewport changes with intelligent rendering
     */
    onViewportChange() {
        this.renderingEnabled = true;
        this.updateViewportRendering();
    }

    /**
     * Update viewport-based rendering with level-of-detail
     */
    updateViewportRendering(forceUpdate = false) {
        if (!this.renderingEnabled || this.isRendering) {
            return;
        }

        const currentBounds = this.map.getBounds();
        
        // Skip if viewport hasn't changed significantly
        if (!forceUpdate && this.lastViewportBounds && 
            this.boundsEqual(currentBounds, this.lastViewportBounds, 0.001)) {
            return;
        }

        this.lastViewportBounds = currentBounds;
        
        // Start performance timing
        const startTime = performance.now();
        
        // Calculate which streets should be visible
        const streetsToShow = this.calculateVisibleStreets(currentBounds);
        
        // Render streets in batches for smooth performance
        this.renderStreetsInBatches(streetsToShow, () => {
            // Update performance metrics
            const renderTime = performance.now() - startTime;
            this.updatePerformanceMetrics(renderTime, streetsToShow.length);
        });
    }

    /**
     * Calculate which streets should be visible based on viewport and level-of-detail
     */
    calculateVisibleStreets(viewportBounds) {
        const currentZoom = this.map.getZoom();
        const expandedBounds = this.expandBounds(viewportBounds, this.viewportBuffer);
        
        // Apply level-of-detail filtering
        let candidateStreets = this.streetData.filter(street => 
            this.isStreetInViewport(street, expandedBounds)
        );

        // Apply zoom-based street limiting for performance
        if (currentZoom < this.lodSettings.minZoomForAllStreets) {
            const maxStreets = currentZoom < 11 ? 
                this.lodSettings.lowZoomStreetLimit : 
                this.lodSettings.mediumZoomStreetLimit;
            
            // Prioritize longer/more important streets at lower zoom levels
            candidateStreets = this.prioritizeStreets(candidateStreets, maxStreets);
        }

        return candidateStreets;
    }

    /**
     * Prioritize streets by length and discovery status for level-of-detail
     */
    prioritizeStreets(streets, maxCount) {
        // Sort by importance: discovered first, then by length
        const sortedStreets = streets.sort((a, b) => {
            const aDiscovered = this.discoveredStreets.has(a.id) ? 1 : 0;
            const bDiscovered = this.discoveredStreets.has(b.id) ? 1 : 0;
            
            if (aDiscovered !== bDiscovered) {
                return bDiscovered - aDiscovered; // Discovered streets first
            }
            
            // Then by length (longer streets first)
            return b.length - a.length;
        });

        return sortedStreets.slice(0, maxCount);
    }

    /**
     * Check if street intersects with viewport bounds
     */
    isStreetInViewport(street, bounds) {
        if (!street.coordinates || street.coordinates.length === 0) {
            return false;
        }

        const swLat = bounds.getSouth();
        const swLng = bounds.getWest();
        const neLat = bounds.getNorth();
        const neLng = bounds.getEast();

        // Check if this is MultiLineString format
        if (street.coordinates[0] && Array.isArray(street.coordinates[0][0])) {
            return street.coordinates.some(lineString => 
                lineString.some(coord => {
                    const lat = coord[0], lng = coord[1];
                    return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
                })
            );
        } else {
            // Legacy format
            return street.coordinates.some(coord => {
                const lat = coord[0], lng = coord[1];
                return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
            });
        }
    }

    /**
     * Render streets in batches to avoid blocking the UI
     */
    renderStreetsInBatches(streetsToShow, onComplete) {
        this.isRendering = true;
        
        // Remove streets that are no longer visible
        this.removeInvisibleStreets(streetsToShow);
        
        // Add new streets that should be visible
        const newStreets = streetsToShow.filter(street => !this.visibleStreets.has(street.id));
        
        if (newStreets.length === 0) {
            this.isRendering = false;
            if (onComplete) onComplete();
            return;
        }

        let batchIndex = 0;
        const batchSize = this.maxStreetsPerFrame;
        
        const processBatch = () => {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, newStreets.length);
            
            // Render batch of streets
            for (let i = startIndex; i < endIndex; i++) {
                try {
                    this.addStreetToMap(newStreets[i]);
                    this.visibleStreets.add(newStreets[i].id);
                } catch (error) {
                    console.error(`Error rendering street ${newStreets[i].fullName}:`, error);
                }
            }
            
            batchIndex++;
            
            // Continue with next batch or complete
            if (endIndex < newStreets.length) {
                requestAnimationFrame(processBatch);
            } else {
                this.isRendering = false;
                if (onComplete) onComplete();
            }
        };
        
        // Start first batch
        requestAnimationFrame(processBatch);
    }

    /**
     * Remove streets that are no longer visible
     */
    removeInvisibleStreets(visibleStreetsList) {
        const visibleIds = new Set(visibleStreetsList.map(s => s.id));
        
        for (const streetId of this.visibleStreets) {
            if (!visibleIds.has(streetId)) {
                const layer = this.streetLayers.get(streetId);
                if (layer && this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                }
                this.visibleStreets.delete(streetId);
            }
        }
    }

    /**
     * Load and display street data with performance optimizations
     */
    loadStreetData(streetsData) {
        if (!streetsData || !Array.isArray(streetsData)) {
            console.error('Invalid street data provided to loadStreetData:', streetsData);
            return;
        }

        this.streetData = streetsData;
        this.clearStreetLayers();
        
        // Update performance metrics
        this.performanceMetrics.totalStreets = streetsData.length;
        
        console.log(`Loading ${streetsData.length} streets with performance optimizations`);
        
        // Filter streets to only show those within current region bounds
        const filteredStreets = streetsData.filter(street => this.isStreetInBounds(street));
        
        console.log(`Filtered to ${filteredStreets.length}/${streetsData.length} streets in region bounds`);
        
        // Instead of loading all streets immediately, use viewport-based rendering
        if (this.map && filteredStreets.length > 0) {
            // Trigger initial viewport rendering
            setTimeout(() => {
                this.updateViewportRendering(true);
            }, 100);
        }
        
        console.log(`Street data loaded with viewport-based rendering enabled`);
    }

    /**
     * Check if street coordinates are within current region bounds
     * Handles both MultiLineString format (array of LineStrings) and legacy format
     */
    isStreetInBounds(street) {
        if (!street.coordinates || !Array.isArray(street.coordinates) || street.coordinates.length === 0) {
            return false;
        }

        const regionBounds = this.getCurrentRegionBounds();
        const bounds = regionBounds.bounds;
        const swLat = bounds[0][0], swLng = bounds[0][1];
        const neLat = bounds[1][0], neLng = bounds[1][1];

        // Check if this is MultiLineString format (array of LineStrings)
        if (street.coordinates[0] && Array.isArray(street.coordinates[0][0])) {
            // MultiLineString: check if any coordinate in any LineString is within bounds
            return street.coordinates.some(lineString => 
                lineString.some(coord => {
                    const lat = coord[0], lng = coord[1];
                    return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
                })
            );
        } else {
            // Legacy format: single LineString
            return street.coordinates.some(coord => {
                const lat = coord[0], lng = coord[1];
                return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
            });
        }
    }

    /**
     * Add a single street to the map with optimized styling
     * Handles both MultiLineString format (array of LineStrings) and legacy format
     */
    addStreetToMap(street) {
        if (!street.coordinates || !Array.isArray(street.coordinates) || street.coordinates.length === 0) {
            console.warn(`Street ${street.fullName} has invalid coordinates`);
            return;
        }

        try {
            let leafletLayer;
            
            // Check if this is MultiLineString format (array of LineStrings)
            if (street.coordinates[0] && Array.isArray(street.coordinates[0][0])) {
                // MultiLineString: create a polyline for each LineString and group them
                const polylines = [];
                
                street.coordinates.forEach(lineString => {
                    if (lineString.length >= 2) {
                        // Convert coordinates to Leaflet format [lat, lng]
                        const latLngs = lineString.map(coord => [coord[0], coord[1]]);
                        
                        const polyline = L.polyline(latLngs, this.getStreetStyle(street));
                        
                        // Add hover effects
                        this.addStreetHoverEffects(polyline, street);
                        
                        polylines.push(polyline);
                    }
                });
                
                if (polylines.length === 0) {
                    console.warn(`Street ${street.fullName} has no valid LineStrings`);
                    return;
                }
                
                // Create a feature group to handle multiple polylines as one entity
                leafletLayer = L.featureGroup(polylines);
                
            } else {
                // Legacy format: single LineString
                if (street.coordinates.length < 2) {
                    console.warn(`Street ${street.fullName} has insufficient coordinates`);
                    return;
                }
                
                // Convert coordinates to Leaflet format [lat, lng]
                const latLngs = street.coordinates.map(coord => [coord[0], coord[1]]);
                
                leafletLayer = L.polyline(latLngs, this.getStreetStyle(street));
                
                // Add hover effects
                this.addStreetHoverEffects(leafletLayer, street);
            }

            // Add enhanced popup with street information
            leafletLayer.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 1.1rem;">${street.fullName}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #718096; font-size: 0.9rem;">${street.length.toFixed(2)} miles</span>
                        <span style="font-size: 1.2rem;">${street.discovered ? '✅' : '❓'}</span>
                    </div>
                    <div style="margin-top: 8px; color: #a0aec0; font-size: 0.8rem;">
                        ${street.coordinates[0] && Array.isArray(street.coordinates[0][0]) 
                            ? `${street.coordinates.length} segment${street.coordinates.length > 1 ? 's' : ''}` 
                            : 'Single segment'}
                    </div>
                </div>
            `, {
                closeButton: true,
                autoClose: true,
                closeOnEscapeKey: true,
                maxWidth: 300,
                minWidth: 200,
                autoPan: true,
                keepInView: true,
                offset: [0, -10],
                className: 'street-popup',
                autoPanPadding: [20, 20]
            });

            // Add to map
            leafletLayer.addTo(this.map);
            
            // Store reference
            this.streetLayers.set(street.id, leafletLayer);

        } catch (error) {
            console.error(`Error adding street ${street.fullName} to map:`, error);
        }
    }

    /**
     * Get enhanced styling for streets
     */
    getStreetStyle(street) {
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        
        return {
            // Color based on discovery status
            color: isDiscovered ? '#10b981' : '#94a3b8',
            weight: this.getStreetWeight(street),
            opacity: 1.0,
            
            // Enhanced visual styling
            lineCap: 'round',
            lineJoin: 'round',
            smoothFactor: 2,
            
            // Only discovered streets are interactive
            interactive: isDiscovered,
            
            // CSS class for additional styling
            className: `street-layer ${isDiscovered ? 'discovered-street' : 'undiscovered-street'}`,
            
            // // Subtle dash pattern for undiscovered streets
            // dashArray: isDiscovered ? null : '1, 3'
        };
    }

    /**
     * Add hover effects to street layers (only for discovered streets)
     */
    addStreetHoverEffects(layer, street) {
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        
        // Only add hover effects to discovered streets
        if (!isDiscovered) {
            return;
        }
        
        layer.on('mouseover', (e) => {
            const currentStyle = this.getStreetStyle(street);
            e.target.setStyle({
                weight: currentStyle.weight * 2, // Make it twice as thick
                opacity: 1.0,
                color: '#f59e0b', // Gold color for hover
                dashArray: null
            });
            
            // Bring the hovered street to front (highest z-index)
            if (e.target.bringToFront) {
                e.target.bringToFront();
            } else if (layer.bringToFront) {
                // For feature groups
                layer.bringToFront();
            }
            
            // Show hover tooltip at mouse position
            this.showHoverTooltip(street, e.latlng);
        });
        
        layer.on('mousemove', (e) => {
            // Update tooltip position to follow mouse
            if (this.hoverTooltip && this.map.hasLayer(this.hoverTooltip)) {
                this.hoverTooltip.setLatLng(e.latlng);
            }
        });
        
        layer.on('mouseout', (e) => {
            // Recalculate the current style instead of using cached originalStyle
            const currentStyle = this.getStreetStyle(street);
            e.target.setStyle(currentStyle);
            
            // Hide hover tooltip
            this.hideHoverTooltip();
            
            // Note: We don't send it back since other streets might be hovered
        });
    }

    /**
     * Get optimized line weight for street based on zoom level
     */
    getStreetWeight(street) {
        const currentZoom = this.map ? this.map.getZoom() : 12;
        
        // All streets have the same base weight
        const baseWeight = 2;
        
        // Zoom-based scaling
        let zoomMultiplier;
        if (currentZoom <= 11) {
            zoomMultiplier = 0.8; // Thinner at low zoom
        } else if (currentZoom <= 13) {
            zoomMultiplier = 1.0; // Normal thickness
        } else if (currentZoom <= 15) {
            zoomMultiplier = 2.0; // Thicker at medium-high zoom
        } else if (currentZoom <= 17) {
            zoomMultiplier = 2.7; // Much thicker at high zoom
        } else {
            zoomMultiplier = 3.3; // Very thick at maximum zoom
        }
        
        return Math.round(baseWeight * zoomMultiplier);
    }

    /**
     * Update street discovery status with enhanced visual feedback
     * Handles both single polylines and feature groups (MultiLineString)
     */
    updateStreetDiscovery(streetIds) {
        if (!Array.isArray(streetIds)) {
            streetIds = [streetIds];
        }

        streetIds.forEach(streetId => {
            this.discoveredStreets.add(streetId);
            const layer = this.streetLayers.get(streetId);
            
            if (layer) {
                // Get the new discovered style
                const street = this.streetData.find(s => s.id === streetId);
                if (street) {
                    const newStyle = this.getStreetStyle(street);
                    
                    // Apply discovery animation
                    this.animateStreetDiscovery(layer, newStyle);
                    
                    // Update hover effects with new discovery status
                    this.updateStreetHoverEffects(layer, street);

                    // Update popup content
                    layer.setPopupContent(`
                        <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
                            <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 1.1rem;">${street.fullName}</h4>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #718096; font-size: 0.9rem;">${street.length.toFixed(2)} miles</span>
                                <span style="font-size: 1.2rem;">✅</span>
                            </div>
                            <div style="margin-top: 8px; color: #a0aec0; font-size: 0.8rem;">
                                ${street.coordinates[0] && Array.isArray(street.coordinates[0][0]) 
                                    ? `${street.coordinates.length} segment${street.coordinates.length > 1 ? 's' : ''}` 
                                    : 'Single segment'}
                            </div>
                            <div style="margin-top: 8px; color: #10b981; font-size: 0.8rem; font-weight: 600;">
                                🎉 Discovered!
                            </div>
                        </div>
                    `);
                }
            }
        });
    }

    /**
     * Animate street discovery with a pulsing effect
     */
    animateStreetDiscovery(layer, finalStyle) {
        // Bring discovered street to front so it's not obscured by undiscovered streets
        if (layer.bringToFront) {
            layer.bringToFront();
        } else if (layer.eachLayer) {
            // For feature groups, bring each child layer to front
            layer.eachLayer(childLayer => {
                if (childLayer.bringToFront) {
                    childLayer.bringToFront();
                }
            });
        }
        
        // Animation sequence: pulse effect
        const pulseStyle = {
            ...finalStyle,
            weight: finalStyle.weight + 3,
            opacity: 1.0,
            color: '#f59e0b' // Gold color for discovery pulse
        };
        
        // Apply pulse style
        this.updateLayerStyle(layer, pulseStyle);
        
        // Fade to final style
        setTimeout(() => {
            this.updateLayerStyle(layer, finalStyle);
        }, 300);
        
        // Add a subtle second pulse
        setTimeout(() => {
            this.updateLayerStyle(layer, {
                ...finalStyle,
                weight: finalStyle.weight + 1,
                opacity: 1.0,
                color: '#f59e0b'
            });
        }, 600);
        
        // Final style - ensure we end with the correct weight
        setTimeout(() => {
            this.updateLayerStyle(layer, finalStyle);
        }, 900);
    }

    /**
     * Update hover effects for a street after discovery status changes
     */
    updateStreetHoverEffects(layer, street) {
        // Remove existing event listeners
        layer.off('mouseover mouseout click');
        
        // Re-add with updated discovery status (will only add if discovered)
        this.addStreetHoverEffects(layer, street);
        
        // Update the layer's interactive property
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        if (layer.setStyle) {
            // For single polylines
            layer.options.interactive = isDiscovered;
        } else if (layer.eachLayer) {
            // For feature groups (MultiLineString)
            layer.eachLayer(childLayer => {
                if (childLayer.options) {
                    childLayer.options.interactive = isDiscovered;
                }
            });
        }
    }

    /**
     * Helper method to update style for both single polylines and feature groups
     */
    updateLayerStyle(layer, style) {
        if (layer instanceof L.FeatureGroup) {
            // Feature group: update all child layers
            layer.eachLayer(childLayer => {
                if (childLayer.setStyle) {
                    childLayer.setStyle(style);
                }
            });
        } else if (layer.setStyle) {
            // Single polyline
            layer.setStyle(style);
        }
    }

    /**
     * Helper method to get weight from layer (handles both polylines and feature groups)
     */
    getLayerWeight(layer) {
        if (layer instanceof L.FeatureGroup) {
            // Get weight from first child layer
            let weight = 2; // default
            layer.eachLayer(childLayer => {
                if (childLayer.options && childLayer.options.weight) {
                    weight = childLayer.options.weight;
                    return false; // break
                }
            });
            return weight;
        } else if (layer.options && layer.options.weight) {
            return layer.options.weight;
        }
        return 2; // default
    }

    /**
     * Highlight a street temporarily
     * Handles both single polylines and feature groups (MultiLineString)
     */
    highlightStreet(streetId, duration = 2000) {
        const layer = this.streetLayers.get(streetId);
        if (!layer) return;

        const originalWeight = this.getLayerWeight(layer);
        const originalStyle = {
            color: '#10b981', // Discovered color
            weight: originalWeight,
            opacity: 0.9
        };

        // Apply highlight style
        this.updateLayerStyle(layer, {
            color: '#f59e0b',
            weight: originalWeight + 2,
            opacity: 1
        });

        // Revert after duration
        setTimeout(() => {
            this.updateLayerStyle(layer, originalStyle);
        }, duration);
    }

    /**
     * Fit map to show all streets
     */
    fitToStreets() {
        if (this.streetLayers.size === 0) return;

        const group = new L.featureGroup(Array.from(this.streetLayers.values()));
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    /**
     * Focus on a specific street
     */
    focusOnStreet(streetId) {
        const layer = this.streetLayers.get(streetId);
        if (layer) {
            this.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
            layer.openPopup();
        }
    }

    /**
     * Clear all street layers and reset performance tracking
     */
    clearStreetLayers() {
        this.streetLayers.forEach(layer => {
            if (this.map && this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });
        this.streetLayers.clear();
        this.discoveredStreets.clear();
        this.visibleStreets.clear();
        this.renderQueue.clear();
        
        // Reset performance metrics
        this.performanceMetrics.renderedStreets = 0;
        this.isRendering = false;
        
        // Clear debounce timers
        if (this.zoomDebounceTimer) {
            clearTimeout(this.zoomDebounceTimer);
            this.zoomDebounceTimer = null;
        }
        if (this.viewportDebounceTimer) {
            clearTimeout(this.viewportDebounceTimer);
            this.viewportDebounceTimer = null;
        }
    }

    /**
     * Get map bounds
     */
    getBounds() {
        return this.map ? this.map.getBounds() : null;
    }

    /**
     * Get map center
     */
    getCenter() {
        return this.map ? this.map.getCenter() : null;
    }

    /**
     * Get map zoom level
     */
    getZoom() {
        return this.map ? this.map.getZoom() : null;
    }

    /**
     * Resize map (useful for responsive layouts)
     */
    invalidateSize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Destroy the map and clean up performance resources
     */
    destroy() {
        // Clear debounce timers first
        if (this.zoomDebounceTimer) {
            clearTimeout(this.zoomDebounceTimer);
            this.zoomDebounceTimer = null;
        }
        if (this.viewportDebounceTimer) {
            clearTimeout(this.viewportDebounceTimer);
            this.viewportDebounceTimer = null;
        }
        
        if (this.map) {
            this.clearStreetLayers();
            this.map.remove();
            this.map = null;
        }
        
        // Reset all properties
        this.streetData = [];
        this.discoveredStreets.clear();
        this.visibleStreets.clear();
        this.renderQueue.clear();
        this.lastViewportBounds = null;
        this.isRendering = false;
        this.renderingEnabled = true;
        
        // Reset performance metrics
        this.performanceMetrics = {
            totalStreets: 0,
            renderedStreets: 0,
            lastRenderTime: 0,
            averageRenderTime: 0,
            renderCount: 0
        };
    }

    /**
     * Get statistics about map state with performance metrics
     */
    getMapStats() {
        return {
            totalStreets: this.streetData.length,
            discoveredStreets: this.discoveredStreets.size,
            mapCenter: this.getCenter(),
            mapZoom: this.getZoom(),
            layersCount: this.streetLayers.size,
            visibleStreets: this.visibleStreets.size,
            performance: {
                ...this.performanceMetrics,
                renderingEnabled: this.renderingEnabled,
                isRendering: this.isRendering
            }
        };
    }

    /**
     * Utility method to expand bounds by a percentage
     */
    expandBounds(bounds, factor) {
        const center = bounds.getCenter();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        
        const latDiff = (ne.lat - sw.lat) * factor;
        const lngDiff = (ne.lng - sw.lng) * factor;
        
        return L.latLngBounds([
            [sw.lat - latDiff, sw.lng - lngDiff],
            [ne.lat + latDiff, ne.lng + lngDiff]
        ]);
    }

    /**
     * Utility method to check if two bounds are approximately equal
     */
    boundsEqual(bounds1, bounds2, tolerance = 0.001) {
        const sw1 = bounds1.getSouthWest();
        const ne1 = bounds1.getNorthEast();
        const sw2 = bounds2.getSouthWest();
        const ne2 = bounds2.getNorthEast();
        
        return Math.abs(sw1.lat - sw2.lat) < tolerance &&
               Math.abs(sw1.lng - sw2.lng) < tolerance &&
               Math.abs(ne1.lat - ne2.lat) < tolerance &&
               Math.abs(ne1.lng - ne2.lng) < tolerance;
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(renderTime, streetsRendered) {
        this.performanceMetrics.renderCount++;
        this.performanceMetrics.lastRenderTime = renderTime;
        this.performanceMetrics.renderedStreets = streetsRendered;
        
        // Calculate rolling average
        if (this.performanceMetrics.renderCount === 1) {
            this.performanceMetrics.averageRenderTime = renderTime;
        } else {
            // Use exponential moving average for smoother metrics
            const alpha = 0.1;
            this.performanceMetrics.averageRenderTime = 
                alpha * renderTime + (1 - alpha) * this.performanceMetrics.averageRenderTime;
        }
    }

    /**
     * Toggle performance optimizations
     */
    setPerformanceMode(enabled) {
        this.renderingEnabled = enabled;
        
        if (enabled) {
            console.log('Performance optimizations enabled');
            this.updateViewportRendering(true);
        } else {
            console.log('Performance optimizations disabled - rendering all streets');
            // Render all streets in region
            const allStreets = this.streetData.filter(street => this.isStreetInBounds(street));
            this.renderStreetsInBatches(allStreets);
        }
    }

    /**
     * Get performance recommendations based on current metrics
     */
    getPerformanceRecommendations() {
        const recommendations = [];
        const stats = this.getMapStats();
        
        if (stats.totalStreets > 5000) {
            recommendations.push('Large dataset detected. Consider enabling aggressive LOD filtering.');
        }
        
        if (this.performanceMetrics.averageRenderTime > 100) {
            recommendations.push('Slow rendering detected. Consider reducing maxStreetsPerFrame.');
        }
        
        if (stats.visibleStreets > 1000) {
            recommendations.push('Many visible streets. Consider increasing viewport buffer or zoom level limits.');
        }
        
        return recommendations;
    }

    /**
     * Update street weights dynamically when the user zooms (optimized for visible streets only)
     */
    updateStreetWeights() {
        // Legacy method - kept for backward compatibility
        this.updateVisibleStreetWeights();
    }

    /**
     * Update street weights for visible streets only
     */
    updateVisibleStreetWeights() {
        this.visibleStreets.forEach(streetId => {
            const layer = this.streetLayers.get(streetId);
            const street = this.streetData.find(s => s.id === streetId);
            if (street && layer) {
                const newWeight = this.getStreetWeight(street);
                const newStyle = this.getStreetStyle(street);
                newStyle.weight = newWeight;
                this.updateLayerStyle(layer, newStyle);
            }
        });
    }

    /**
     * Create hover tooltip for street information
     */
    createHoverTooltip() {
        if (this.hoverTooltip) {
            this.map.removeLayer(this.hoverTooltip);
        }
        
        this.hoverTooltip = L.tooltip({
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            opacity: 0.95,
            className: 'street-hover-tooltip'
        });
    }

    /**
     * Show hover tooltip with street information
     */
    showHoverTooltip(street, latlng) {
        if (!this.hoverTooltip) {
            this.createHoverTooltip();
        }
        
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        const discoveryStatus = isDiscovered ? '✅ Discovered' : '❓ Undiscovered';
        
        const content = `
            <div class="hover-tooltip-content">
                <div class="tooltip-name">${street.fullName}</div>
                <div class="tooltip-details">
                    <span class="tooltip-length">${street.length.toFixed(2)} miles</span>
                    <span class="tooltip-status">${discoveryStatus}</span>
                </div>
            </div>
        `;
        
        this.hoverTooltip
            .setContent(content)
            .setLatLng(latlng)
            .addTo(this.map);
    }

    /**
     * Hide hover tooltip
     */
    hideHoverTooltip() {
        if (this.hoverTooltip && this.map.hasLayer(this.hoverTooltip)) {
            this.map.removeLayer(this.hoverTooltip);
        }
    }

    /**
     * Get the center point of a street for tooltip positioning
     */
    getStreetCenter(street) {
        if (!street.coordinates || street.coordinates.length === 0) {
            return null;
        }
        
        let allCoords = [];
        
        // Handle both MultiLineString and single LineString formats
        if (street.coordinates[0] && Array.isArray(street.coordinates[0][0])) {
            // MultiLineString: flatten all coordinates
            street.coordinates.forEach(lineString => {
                allCoords = allCoords.concat(lineString);
            });
        } else {
            // Single LineString
            allCoords = street.coordinates;
        }
        
        if (allCoords.length === 0) {
            return null;
        }
        
        // Calculate center point
        const centerIndex = Math.floor(allCoords.length / 2);
        const centerCoord = allCoords[centerIndex];
        
        return [centerCoord[0], centerCoord[1]]; // [lat, lng]
    }

    /**
     * Programmatically trigger street hover effect (for external UI elements)
     */
    triggerStreetHover(streetId) {
        const layer = this.streetLayers.get(streetId);
        const street = this.streetData.find(s => s.id === streetId);
        
        if (!layer || !street) return;
        
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        if (!isDiscovered) return; // Only discovered streets can be hovered
        
        const currentStyle = this.getStreetStyle(street);
        this.updateLayerStyle(layer, {
            weight: currentStyle.weight * 2, // Make it twice as thick
            opacity: 1.0,
            color: '#f59e0b', // Gold color for hover
            dashArray: null
        });
        
        // Bring the hovered street to front (highest z-index)
        if (layer.bringToFront) {
            layer.bringToFront();
        }
    }

    /**
     * Programmatically remove street hover effect (for external UI elements)
     */
    removeStreetHover(streetId) {
        const layer = this.streetLayers.get(streetId);
        const street = this.streetData.find(s => s.id === streetId);
        
        if (!layer || !street) return;
        
        const isDiscovered = street.discovered || this.discoveredStreets.has(street.id);
        if (!isDiscovered) return;
        
        // Restore normal style
        const currentStyle = this.getStreetStyle(street);
        this.updateLayerStyle(layer, currentStyle);
    }
}

export default MapManager; 
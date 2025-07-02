#!/usr/bin/env python3
"""
City Boundary Fetcher
======================

This module fetches city boundary polygons from a pre-validated GeoJSON repository
on GitHub. It provides accurate city boundaries that have been pre-processed and
validated for use with the OSM Street Fetcher.

Author: Street Names Challenge Team
License: MIT
"""

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union
import requests
from shapely.geometry import Polygon, MultiPolygon, shape

logger = logging.getLogger(__name__)


@dataclass
class CityBoundary:
    """Represents a city boundary with its polygon geometry."""
    name: str
    state: Optional[str]
    country: str
    geometry: Dict  # GeoJSON geometry
    bbox: List[float]  # [south, west, north, east] for compatibility
    area_km2: float


class CityBoundaryFetcher:
    """Fetches city boundary data from pre-validated GeoJSON repository."""
    
    # Base URL for the GeoJSON repository
    BASE_URL = "https://raw.githubusercontent.com/generalpiston/geojson-us-city-boundaries/refs/heads/master/cities"
    
    # State code mapping for common state names
    STATE_CODES = {
        'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar',
        'california': 'ca', 'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de',
        'florida': 'fl', 'georgia': 'ga', 'hawaii': 'hi', 'idaho': 'id',
        'illinois': 'il', 'indiana': 'in', 'iowa': 'ia', 'kansas': 'ks',
        'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
        'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
        'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv',
        'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny',
        'north carolina': 'nc', 'north dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok',
        'oregon': 'or', 'pennsylvania': 'pa', 'rhode island': 'ri', 'south carolina': 'sc',
        'south dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut',
        'vermont': 'vt', 'virginia': 'va', 'washington': 'wa', 'west virginia': 'wv',
        'wisconsin': 'wi', 'wyoming': 'wy', 'district of columbia': 'dc'
    }
    
    def __init__(self, boundary_dir: str = 'boundary'):
        """Initialize the boundary fetcher.
        
        Args:
            boundary_dir: Directory to store boundary files (default: 'boundary')
        """
        self.boundary_dir = boundary_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'StreetNamesChallenge/1.0 (Educational Game; contact@example.com)'
        })
        
        # Create boundary directory if it doesn't exist
        os.makedirs(boundary_dir, exist_ok=True)
    
    def get_city_boundary(self, city_name: str, state: Optional[str] = None, country: str = "United States") -> Optional[CityBoundary]:
        """
        Get the boundary polygon for a US city from the pre-validated repository.
        
        Args:
            city_name: Name of the city (e.g., "San Francisco")
            state: State name or abbreviation (e.g., "California" or "CA")
            country: Country name (currently only supports "United States")
            
        Returns:
            CityBoundary object with polygon geometry, or None if not found
        """
        if country.lower() != "united states":
            logger.error(f"Only United States cities are supported, got: {country}")
            return None
            
        if not state:
            logger.error("State is required for US city boundary lookup")
            return None
        
        logger.info(f"Fetching boundary for {city_name}, {state}")
        
        # Normalize state to lowercase code
        state_code = self._normalize_state_code(state)
        if not state_code:
            logger.error(f"Could not determine state code for: {state}")
            return None
        
        # Normalize city name for URL
        city_slug = self._normalize_city_name(city_name)
        
        # Construct URL
        url = f"{self.BASE_URL}/{state_code}/{city_slug}.json"
        logger.debug(f"Fetching from URL: {url}")
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            geojson_data = response.json()
            
            # Process the GeoJSON data
            boundary = self._process_geojson_data(geojson_data, city_name, state, country)
            if boundary:
                logger.info(f"Successfully fetched boundary for {boundary.name}")
                logger.info(f"Area: {boundary.area_km2:.2f} km²")
                logger.info(f"Bounding box: {boundary.bbox}")
                return boundary
            else:
                logger.error(f"Could not process GeoJSON data for {city_name}")
                return None
                
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.error(f"City boundary not found: {city_name}, {state}")
                logger.info(f"Tried URL: {url}")
                logger.info("Check if the city name and state are correct, or if the city is available in the repository")
            else:
                logger.error(f"HTTP error fetching boundary: {e}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error fetching boundary: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching boundary: {e}")
            return None
    
    def _normalize_state_code(self, state: str) -> Optional[str]:
        """Convert state name or abbreviation to lowercase 2-letter code."""
        state_lower = state.lower().strip()
        
        # If it's already a 2-letter code
        if len(state_lower) == 2 and state_lower.isalpha():
            return state_lower
        
        # Look up full state name
        return self.STATE_CODES.get(state_lower)
    
    def _normalize_city_name(self, city_name: str) -> str:
        """Normalize city name for URL format."""
        # Convert to lowercase
        normalized = city_name.lower().strip()
        
        # Replace spaces and special characters with hyphens
        normalized = re.sub(r'[^\w\s-]', '', normalized)  # Remove special chars except hyphens
        normalized = re.sub(r'\s+', '-', normalized)      # Replace spaces with hyphens
        normalized = re.sub(r'-+', '-', normalized)       # Collapse multiple hyphens
        normalized = normalized.strip('-')                # Remove leading/trailing hyphens
        
        return normalized
    
    def _process_geojson_data(self, geojson_data: Dict, city_name: str, state: str, country: str) -> Optional[CityBoundary]:
        """Process GeoJSON data into a CityBoundary object."""
        try:
            # The repository format should be a FeatureCollection or Feature
            if geojson_data.get('type') == 'FeatureCollection':
                features = geojson_data.get('features', [])
                if not features:
                    logger.error("No features found in FeatureCollection")
                    return None
                # Use the first feature
                feature = features[0]
            elif geojson_data.get('type') == 'Feature':
                feature = geojson_data
            else:
                logger.error(f"Unexpected GeoJSON type: {geojson_data.get('type')}")
                return None
            
            geometry = feature.get('geometry')
            if not geometry:
                logger.error("No geometry found in feature")
                return None
            
            # Calculate bounding box and area
            bbox = self._calculate_bbox(geometry)
            area = self._calculate_area(geometry)
            
            # Get city name from properties if available, otherwise use provided name
            properties = feature.get('properties', {})
            actual_city_name = properties.get('name', city_name)
            
            boundary = CityBoundary(
                name=actual_city_name,
                state=state,
                country=country,
                geometry=geometry,
                bbox=bbox,
                area_km2=area
            )
            
            return boundary
            
        except Exception as e:
            logger.error(f"Error processing GeoJSON data: {e}")
            return None
    
    def _calculate_bbox(self, geometry: Dict) -> List[float]:
        """Calculate bounding box [south, west, north, east] from geometry."""
        try:
            geom = shape(geometry)
            bounds = geom.bounds  # (minx, miny, maxx, maxy)
            return [bounds[1], bounds[0], bounds[3], bounds[2]]  # [south, west, north, east]
        except Exception as e:
            logger.error(f"Error calculating bounding box: {e}")
            return [0, 0, 0, 0]
    
    def _calculate_area(self, geometry: Dict) -> float:
        """Calculate area in km² from geometry."""
        try:
            geom = shape(geometry)
            # Convert to a projected coordinate system for accurate area calculation
            # This is a rough approximation using degrees
            area_deg2 = geom.area
            # Very rough conversion from square degrees to km² (varies by latitude)
            # 1 degree ≈ 111 km at equator
            area_km2 = area_deg2 * (111 ** 2)
            return area_km2
        except Exception as e:
            logger.error(f"Error calculating area: {e}")
            return 0.0
    
    def save_boundary(self, boundary: CityBoundary, filename: Optional[str] = None) -> str:
        """Save boundary data to a GeoJSON file in the boundary directory.
        
        Args:
            boundary: CityBoundary object to save
            filename: Optional custom filename. If not provided, generates from city name.
        
        Returns:
            str: Full path to the saved file
        """
        if filename is None:
            # Generate filename from city name
            safe_name = boundary.name.lower().replace(' ', '_').replace(',', '')
            if boundary.state:
                safe_state = boundary.state.lower().replace(' ', '_')
                filename = f"{safe_name}_{safe_state}.geojson"
            else:
                filename = f"{safe_name}.geojson"
        
        # Ensure filename has .geojson extension
        if not filename.endswith('.geojson'):
            filename += '.geojson'
        
        filepath = os.path.join(self.boundary_dir, filename)
        
        feature = {
            "type": "Feature",
            "properties": {
                "name": boundary.name,
                "state": boundary.state,
                "country": boundary.country,
                "area_km2": boundary.area_km2,
                "bbox": boundary.bbox
            },
            "geometry": boundary.geometry
        }
        
        geojson_data = {
            "type": "FeatureCollection",
            "features": [feature]
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved boundary to {filepath}")
        return filepath
    
    def load_boundary(self, filename: str) -> Optional[CityBoundary]:
        """Load boundary data from a GeoJSON file in the boundary directory.
        
        Args:
            filename: Name of the GeoJSON file to load
            
        Returns:
            CityBoundary object if successful, None otherwise
        """
        if not filename.endswith('.geojson'):
            filename += '.geojson'
        
        filepath = os.path.join(self.boundary_dir, filename)
        
        if not os.path.exists(filepath):
            logger.error(f"Boundary file not found: {filepath}")
            return None
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data.get('type') != 'FeatureCollection' or not data.get('features'):
                logger.error(f"Invalid GeoJSON format in {filepath}")
                return None
            
            feature = data['features'][0]
            props = feature.get('properties', {})
            geometry = feature.get('geometry')
            
            if not geometry:
                logger.error(f"No geometry found in {filepath}")
                return None
            
            boundary = CityBoundary(
                name=props.get('name', 'Unknown'),
                state=props.get('state'),
                country=props.get('country', 'Unknown'),
                geometry=geometry,
                bbox=props.get('bbox', [0, 0, 0, 0]),
                area_km2=props.get('area_km2', 0.0)
            )
            
            logger.info(f"Loaded boundary from {filepath}")
            return boundary
            
        except Exception as e:
            logger.error(f"Error loading boundary from {filepath}: {e}")
            return None
    
    def list_saved_boundaries(self) -> List[str]:
        """List all saved boundary files in the boundary directory.
        
        Returns:
            List of boundary filenames (without .geojson extension)
        """
        if not os.path.exists(self.boundary_dir):
            return []
        
        boundaries = []
        for filename in os.listdir(self.boundary_dir):
            if filename.endswith('.geojson'):
                boundaries.append(filename[:-8])  # Remove .geojson extension
        
        return sorted(boundaries)
    
    def get_available_cities(self, state: str) -> List[str]:
        """Get a list of available cities for a given state from the repository.
        
        This method attempts to fetch the directory listing, but note that
        GitHub doesn't provide directory listings via their raw content API.
        This is more of a placeholder for potential future enhancement.
        
        Args:
            state: State name or abbreviation
            
        Returns:
            List of available city names (empty if not supported)
        """
        logger.warning("get_available_cities is not implemented - GitHub raw API doesn't support directory listings")
        return []


def main():
    """Example usage of the CityBoundaryFetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch city boundary data from pre-validated GeoJSON repository')
    parser.add_argument('city', help='City name')
    parser.add_argument('--state', required=True, help='State name or abbreviation (required)')
    parser.add_argument('--country', default='United States', help='Country name (default: United States)')
    parser.add_argument('--boundary-dir', default='boundary', help='Directory to store boundary files')
    parser.add_argument('--output', help='Custom output filename (will be saved in boundary directory)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)
    
    try:
        fetcher = CityBoundaryFetcher(args.boundary_dir)
        boundary = fetcher.get_city_boundary(args.city, args.state, args.country)
        
        if boundary:
            print(f"✅ Successfully fetched boundary for {boundary.name}")
            print(f"📐 Area: {boundary.area_km2:.2f} km²")
            print(f"📦 Bounding box: {boundary.bbox}")
            print(f"🗺️ Geometry type: {boundary.geometry['type']}")
            
            saved_path = fetcher.save_boundary(boundary, args.output)
            print(f"💾 Saved to {saved_path}")
        else:
            print(f"❌ Could not fetch boundary for {args.city}, {args.state}")
            return 1
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main()) 
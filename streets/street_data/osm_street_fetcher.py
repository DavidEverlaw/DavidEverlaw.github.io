#!/usr/bin/env python3
"""
OpenStreetMap Street Data Fetcher
=================================

This script fetches street data from OpenStreetMap for specified regions
and converts it to the format required by the Street Names Challenge game.

Author: Street Names Challenge Team
License: MIT
"""

import json
import logging
import os
import sys
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
import requests
from geopy.distance import geodesic
from city_boundary_fetcher import CityBoundaryFetcher, CityBoundary


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('osm_fetch.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class StreetSegment:
    """Represents a street segment with game-specific metadata.
    
    The coordinates field contains MultiLineString geometry:
    - For complete streets: List[List[List[float]]] where each inner list is a LineString
    - For single segments: List[List[List[float]]] with one LineString
    """
    id: str
    name: str
    suffix: str
    full_name: str
    coordinates: List[List[List[float]]]  # MultiLineString format
    length: float  # in miles
    city: str
    state: str
    discovered: bool = False
    discovery_time: Optional[int] = None


class OSMStreetFetcher:
    """Fetches and processes street data from OpenStreetMap using city boundaries."""
    
    # Predefined regions for backward compatibility
    REGIONS = {
        'san-francisco': {
            'name': 'San Francisco',
            'bbox': [37.7049, -122.5096, 37.8084, -122.3573],  # Fallback bbox
            'city': 'San Francisco',
            'state': 'CA'
        }
    }
    
    # Common street suffixes and their standardized forms
    STREET_SUFFIXES = {
        'street': 'ST',
        'st': 'ST',
        'avenue': 'AVE',
        'ave': 'AVE',
        'boulevard': 'BLVD',
        'blvd': 'BLVD',
        'drive': 'DR',
        'dr': 'DR',
        'road': 'RD',
        'rd': 'RD',
        'way': 'WAY',
        'place': 'PL',
        'pl': 'PL',
        'court': 'CT',
        'ct': 'CT',
        'lane': 'LN',
        'ln': 'LN',
        'circle': 'CIR',
        'cir': 'CIR',
        'terrace': 'TER',
        'ter': 'TER'
    }
    
    def __init__(self, output_dir: str = 'data', boundary_dir: str = 'boundary'):
        """Initialize the fetcher with output and boundary directories."""
        self.output_dir = output_dir
        self.boundary_dir = boundary_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'StreetNamesChallenge/1.0 (Educational Game; contact@example.com)'
        })
        
        # Initialize boundary fetcher
        self.boundary_fetcher = CityBoundaryFetcher(boundary_dir)
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    def fetch_streets_for_region(self, region: str) -> List[StreetSegment]:
        """Fetch street data for a specific region using city boundaries."""
        if region not in self.REGIONS:
            raise ValueError(f"Region '{region}' not supported. Available: {list(self.REGIONS.keys())}")
        
        region_info = self.REGIONS[region]
        logger.info(f"Fetching street data for {region_info['name']}")
        
        # Try to get city boundary, fall back to bbox if not available
        boundary = self._get_or_fetch_boundary(region_info)
        
        if boundary:
            logger.info(f"Using city boundary polygon ({boundary.geometry['type']})")
            query = self._build_overpass_query_with_polygon(boundary.geometry)
        else:
            logger.warning(f"Using fallback bounding box for {region_info['name']}")
            bbox = region_info['bbox']
            query = self._build_overpass_query_with_bbox(bbox)
        
        # Fetch data from Overpass API
        raw_data = self._fetch_from_overpass(query)
        
        # Process the raw data
        streets = self._process_overpass_data(raw_data, region_info, boundary)
        
        # Filter streets to only include those within the city boundary
        if boundary:
            streets = self._filter_streets_by_boundary(streets, boundary)
            logger.info(f"Filtered to {len(streets)} streets within city boundary")
        
        logger.info(f"Processed {len(streets)} street segments")
        return streets
    
    def fetch_streets_for_city(self, city_name: str, state: Optional[str] = None, country: str = "United States") -> List[StreetSegment]:
        """Fetch street data for a city using its boundary polygon.
        
        Args:
            city_name: Name of the city (e.g., "San Francisco")
            state: State name or abbreviation (e.g., "CA")
            country: Country name (default: "United States")
            
        Returns:
            List of StreetSegment objects
        """
        logger.info(f"Fetching street data for {city_name}, {state}")
        
        # Get or fetch city boundary
        boundary = self.boundary_fetcher.get_city_boundary(city_name, state, country)
        
        if not boundary:
            logger.error(f"Could not get boundary for {city_name}, {state}")
            return []
        
        # Save boundary for future use
        self.boundary_fetcher.save_boundary(boundary)
        
        # Create region info from boundary
        region_info = {
            'name': boundary.name,
            'city': boundary.name,
            'state': boundary.state or state,
            'bbox': boundary.bbox
        }
        
        logger.info(f"Using city boundary polygon ({boundary.geometry['type']})")
        query = self._build_overpass_query_with_polygon(boundary.geometry)
        
        # Fetch data from Overpass API
        raw_data = self._fetch_from_overpass(query)
        
        # Process the raw data
        streets = self._process_overpass_data(raw_data, region_info, boundary)
        
        # Filter streets to only include those within the city boundary
        if boundary:
            streets = self._filter_streets_by_boundary(streets, boundary)
            logger.info(f"Filtered to {len(streets)} streets within city boundary")
        
        logger.info(f"Processed {len(streets)} street segments for {boundary.name}")
        return streets
    
    def _get_or_fetch_boundary(self, region_info: Dict) -> Optional[CityBoundary]:
        """Get city boundary from saved data or fetch it from OSM."""
        city_name = region_info['city']
        state = region_info.get('state')
        
        # Generate expected filename
        safe_name = city_name.lower().replace(' ', '_').replace(',', '')
        if state:
            safe_state = state.lower().replace(' ', '_')
            filename = f"{safe_name}_{safe_state}"
        else:
            filename = safe_name
        
        # Try to load existing boundary
        boundary = self.boundary_fetcher.load_boundary(filename)
        
        if boundary:
            logger.info(f"Loaded existing boundary for {city_name}")
            return boundary
        
        # Fetch new boundary
        logger.info(f"Fetching new boundary for {city_name}, {state}")
        boundary = self.boundary_fetcher.get_city_boundary(city_name, state)
        
        if boundary:
            # Save for future use
            self.boundary_fetcher.save_boundary(boundary)
            logger.info(f"Saved new boundary for {city_name}")
            return boundary
        
        logger.warning(f"Could not fetch boundary for {city_name}, {state}")
        return None
    
    def _build_overpass_query_with_polygon(self, geometry: Dict) -> str:
        """Build Overpass API query using a polygon boundary."""
        try:
            # Convert GeoJSON geometry to Overpass polygon format
            polygon_coords = self._geojson_to_overpass_polygon(geometry)
            
            if not polygon_coords:
                raise ValueError("Could not convert geometry to Overpass polygon format")
            
            logger.info(f"Using polygon boundary for Overpass query with {len(polygon_coords.split())} coordinate pairs")
            
            # Include all street types that could be city streets - including primary roads like Market St
            # Use polygon area filter instead of bounding box
            query = f"""
            [out:json][timeout:120];
            (
              // Get all city streets within the polygon area
              // Include primary roads (like Market Street) but exclude motorways/trunks
              way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street)$"]
                  ["name"]
                  (poly:"{polygon_coords}");
              
              // Get associatedStreet relations which group street segments
              relation["type"="associatedStreet"]
                  ["name"]
                  (poly:"{polygon_coords}");
            );
            
            // Output with full geometry including member ways for relations
            (._;>;);
            out geom;
            """
            return query
            
        except Exception as e:
            logger.error(f"Error processing geometry for Overpass polygon query: {e}")
            logger.warning("Falling back to bounding box query")
            
            # Fallback to bounding box if polygon conversion fails
            from shapely.geometry import shape
            try:
                geom = shape(geometry)
                bounds = geom.bounds  # (minx, miny, maxx, maxy)
                south, west, north, east = bounds[1], bounds[0], bounds[3], bounds[2]
                
                logger.info(f"Using fallback bounding box: {south:.4f},{west:.4f},{north:.4f},{east:.4f}")
                
                query = f"""
                [out:json][timeout:120];
                (
                  way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street)$"]
                      ["name"]
                      ({south},{west},{north},{east});
                  
                  relation["type"="associatedStreet"]
                      ["name"]
                      ({south},{west},{north},{east});
                );
                
                (._;>;);
                out geom;
                """
                return query
            except Exception as e2:
                logger.error(f"Error with fallback bounding box query: {e2}")
                # Last resort: simple query without spatial filtering
                query = """
                [out:json][timeout:120];
                (
                  way["highway"~"^(secondary|tertiary|unclassified|residential|living_street)$"]["name"];
                  relation["type"="associatedStreet"]["name"];
                );
                (._;>;);
                out geom;
                """
                return query
    
    def _build_overpass_query_with_bbox(self, bbox: List[float]) -> str:
        """Build Overpass API query using bounding box (fallback method)."""
        south, west, north, east = bbox
        
        # Include all street types that could be city streets - including primary roads
        query = f"""
        [out:json][timeout:120];
        (
          // Get all city streets including primary roads like Market Street
          way["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street)$"]
              ["name"]
              ({south},{west},{north},{east});
          
          // Get associatedStreet relations which group street segments
          relation["type"="associatedStreet"]
              ["name"]
              ({south},{west},{north},{east});
        );
        
        // Output with full geometry including member ways for relations
        (._;>;);
        out geom;
        """
        return query
    
    def _geojson_to_overpass_polygon(self, geometry: Dict) -> str:
        """Convert GeoJSON geometry to Overpass polygon format.
        
        Overpass polygon format expects: "lat1 lon1 lat2 lon2 lat3 lon3 ..."
        Note: For very complex polygons with many coordinates, we may need to simplify.
        """
        coords_list = []
        
        try:
            if geometry['type'] == 'Polygon':
                # Use outer ring only for simplicity
                coords = geometry['coordinates'][0]
                # GeoJSON uses [lon, lat] but Overpass expects lat lon
                for lon, lat in coords:
                    coords_list.append(f"{lat}")
                    coords_list.append(f"{lon}")
            
            elif geometry['type'] == 'MultiPolygon':
                # Use the largest polygon (by number of coordinates) as the primary boundary
                largest_polygon = max(geometry['coordinates'], key=lambda p: len(p[0]))
                coords = largest_polygon[0]  # outer ring of largest polygon
                # GeoJSON uses [lon, lat] but Overpass expects lat lon
                for lon, lat in coords:
                    coords_list.append(f"{lat}")
                    coords_list.append(f"{lon}")
            
            else:
                logger.warning(f"Unsupported geometry type for polygon query: {geometry['type']}")
                return ""
            
            # Overpass has limits on polygon complexity
            # If we have too many coordinates, simplify by taking every Nth point
            # Note: coords_list has alternating lat/lon values, so we need pairs
            max_coords = 400  # Conservative limit to avoid Overpass timeouts (200 coordinate pairs)
            if len(coords_list) > max_coords:
                # Keep coordinate pairs together by working with pairs
                original_pairs = len(coords_list) // 2
                target_pairs = max_coords // 2
                step = max(1, original_pairs // target_pairs)
                
                # Extract every step-th coordinate pair
                simplified_coords = []
                for i in range(0, len(coords_list), 2):  # Step through pairs
                    pair_index = i // 2
                    if pair_index % step == 0:
                        simplified_coords.append(coords_list[i])      # lat
                        simplified_coords.append(coords_list[i + 1])  # lon
                
                coords_list = simplified_coords
                logger.info(f"Simplified polygon from {original_pairs} to {len(coords_list)//2} coordinate pairs")
            
            result = " ".join(coords_list)
            logger.debug(f"Generated polygon string with {len(coords_list)//2} coordinate pairs")
            return result
            
        except Exception as e:
            logger.error(f"Error converting GeoJSON to Overpass polygon: {e}")
            return ""
    
    def _filter_streets_by_boundary(self, streets: List[StreetSegment], boundary: CityBoundary) -> List[StreetSegment]:
        """Filter streets to only include those within or significantly intersecting the city boundary."""
        from shapely.geometry import shape, Point, LineString
        
        try:
            # Create shapely geometry from boundary
            boundary_geom = shape(boundary.geometry)
            filtered_streets = []
            
            for street in streets:
                # Check if street should be included based on boundary intersection
                should_include = False
                total_length = 0.0
                intersecting_length = 0.0
                
                for line_coords in street.coordinates:
                    # Convert coordinates to shapely LineString
                    # Note: street coordinates are [lat, lon] but shapely expects [lon, lat]
                    shapely_coords = [(lon, lat) for lat, lon in line_coords]
                    
                    if len(shapely_coords) >= 2:
                        line = LineString(shapely_coords)
                        line_length = line.length
                        total_length += line_length
                        
                        # Check intersection with boundary
                        if boundary_geom.intersects(line):
                            # Calculate how much of the line is within the boundary
                            try:
                                intersection = boundary_geom.intersection(line)
                                if hasattr(intersection, 'length'):
                                    intersecting_length += intersection.length
                                else:
                                    # For complex geometries or points, use a conservative estimate
                                    # This handles MultiLineString, GeometryCollection, Point, etc.
                                    intersecting_length += line_length * 0.1
                            except:
                                # If intersection calculation fails, assume the line intersects
                                intersecting_length += line_length * 0.1  # Conservative estimate
                
                # Include street if:
                # 1. Any part intersects with boundary, OR
                # 2. At least 25% of the street is within the boundary, OR  
                # 3. At least 100 meters of the street is within the boundary (rough conversion)
                if intersecting_length > 0:
                    intersection_ratio = intersecting_length / total_length if total_length > 0 else 0
                    # Rough conversion: 1 degree ≈ 111km, so 0.001 degrees ≈ 111 meters
                    intersecting_meters = intersecting_length * 111000
                    
                    if intersection_ratio >= 0.25 or intersecting_meters >= 100:
                        should_include = True
                        
                if should_include:
                    filtered_streets.append(street)
            
            logger.info(f"Filtered {len(streets)} streets to {len(filtered_streets)} within boundary")
            return filtered_streets
            
        except Exception as e:
            logger.warning(f"Error filtering streets by boundary: {e}")
            logger.warning("Returning all streets without boundary filtering")
            return streets
    
    def _fetch_from_overpass(self, query: str, max_retries: int = 3) -> Dict:
        """Fetch data from Overpass API with retry logic."""
        url = "https://overpass-api.de/api/interpreter"
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching data from Overpass API (attempt {attempt + 1}/{max_retries})")
                
                response = self.session.post(url, data=query, timeout=120)
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Successfully fetched {len(data.get('elements', []))} elements")
                return data
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.info(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    raise
        
        raise Exception("Failed to fetch data after all retries")
    
    def _process_overpass_data(self, data: Dict, region_info: Dict, boundary: Optional[CityBoundary] = None) -> List[StreetSegment]:
        """Process raw Overpass API data into StreetSegment objects with MultiLineString geometry."""
        streets = []
        processed_names = set()
        elements = data.get('elements', [])
        
        # Create lookup for nodes and ways
        nodes = {el['id']: el for el in elements if el.get('type') == 'node'}
        ways = {el['id']: el for el in elements if el.get('type') == 'way'}
        relations = [el for el in elements if el.get('type') == 'relation']
        
        # Process relations first (complete streets)
        processed_way_ids = set()
        
        for relation in relations:
            tags = relation.get('tags', {})
            name = tags.get('name', '').strip()
            
            if not name or len(name) < 2:
                continue
            
            # Skip highways, freeways, and other non-street roads by name
            if self._is_highway_or_freeway(name):
                logger.debug(f"Skipping highway/freeway: {name}")
                continue
                
            # Parse street name and suffix
            parsed_name, suffix = self._parse_street_name(name)
            
            if not parsed_name:
                continue
            
            # Get member ways and build MultiLineString
            member_ways = []
            for member in relation.get('members', []):
                if member.get('type') == 'way' and member.get('ref') in ways:
                    way = ways[member['ref']]
                    if 'geometry' in way:
                        member_ways.append(way)
                        processed_way_ids.add(way['id'])
            
            if not member_ways:
                continue
            
            # Convert to MultiLineString coordinates
            multilinestring_coords = []
            total_length = 0.0
            
            for way in member_ways:
                line_coords = []
                for node in way['geometry']:
                    line_coords.append([node['lat'], node['lon']])
                
                if len(line_coords) >= 2:
                    multilinestring_coords.append(line_coords)
                    total_length += self._calculate_length(line_coords)
            
            if not multilinestring_coords or total_length < 0.01:
                continue
            
            # Skip very long routes (likely bus routes or highways that span multiple cities)
            if total_length > 50:  # Skip routes longer than 50 miles
                logger.debug(f"Skipping long route: {name} ({total_length:.2f} miles)")
                continue
            
            # Create street segment with MultiLineString geometry
            street_id = f"{region_info['city'].lower().replace(' ', '_')}_rel_{relation['id']}"
            
            street = StreetSegment(
                id=street_id,
                name=parsed_name,
                suffix=suffix,
                full_name=f"{parsed_name} {suffix}".strip() if suffix else parsed_name,
                coordinates=multilinestring_coords,  # This is now a MultiLineString
                length=round(total_length, 2),
                city=region_info['city'],
                state=region_info['state']
            )
            
            streets.append(street)
            processed_names.add(parsed_name)
        
        # Process individual ways that weren't part of relations
        for way in ways.values():
            if way['id'] in processed_way_ids or 'geometry' not in way:
                continue
                
            tags = way.get('tags', {})
            name = tags.get('name', '').strip()
            
            if not name or len(name) < 2:
                continue
            
            # Skip highways, freeways, and other non-street roads by name
            if self._is_highway_or_freeway(name):
                logger.debug(f"Skipping highway/freeway: {name}")
                continue
            
            # Parse street name and suffix
            parsed_name, suffix = self._parse_street_name(name)
            
            if not parsed_name:
                continue
            
            # Extract coordinates as single LineString in MultiLineString format
            coordinates = []
            for node in way['geometry']:
                coordinates.append([node['lat'], node['lon']])
            
            if len(coordinates) < 2:
                continue
            
            # Calculate length in miles
            length = self._calculate_length(coordinates)
            
            if length < 0.01:  # Skip very short segments (less than ~50 feet)
                continue
            
            # Skip very long routes (likely bus routes or highways that span multiple cities)
            if length > 50:  # Skip routes longer than 50 miles
                logger.debug(f"Skipping long route: {name} ({length:.2f} miles)")
                continue
            
            # Create street segment with MultiLineString geometry (single line)
            street_id = f"{region_info['city'].lower().replace(' ', '_')}_way_{way['id']}"
            
            street = StreetSegment(
                id=street_id,
                name=parsed_name,
                suffix=suffix,
                full_name=f"{parsed_name} {suffix}".strip() if suffix else parsed_name,
                coordinates=[coordinates],  # Wrap single line in array for MultiLineString format
                length=round(length, 2),
                city=region_info['city'],
                state=region_info['state']
            )
            
            streets.append(street)
            processed_names.add(parsed_name)
        
        logger.info(f"Found {len(processed_names)} unique street names")
        logger.info(f"Processed {len([s for s in streets if len(s.coordinates) > 1])} MultiLineString streets")
        logger.info(f"Processed {len([s for s in streets if len(s.coordinates) == 1])} single LineString streets")
        
        return self._deduplicate_and_merge_streets(streets)
    
    def _is_highway_or_freeway(self, name: str) -> bool:
        """Check if a street name indicates a highway, freeway, or other non-city street."""
        name_upper = name.upper()
        
        # Only filter out clear highways and freeways - be very conservative
        highway_patterns = [
            # Explicit freeway/highway names
            ' FREEWAY', ' HIGHWAY', ' EXPRESSWAY',
            'INTERSTATE ', 'STATE ROUTE',
            
            # Specific numbered routes that are definitely highways
            'WA 520', 'WA 522', 'WA 305', 'WA 304',
            'US 101', 'US 1', 'I-5', 'I-405', 'I-90',
            
            # Specific named highways (full exact names)
            'LINCOLN HIGHWAY', 'PACIFIC HIGHWAY', 'COAST HIGHWAY',
            'PANORAMIC HIGHWAY', 'SHORELINE HIGHWAY', 'REDWOOD HIGHWAY',
            'EASTSHORE HIGHWAY', 'GREAT HIGHWAY',
            
            # Freeway names
            'GOLDEN STATE FREEWAY', 'HARBOR FREEWAY', 'HOLLYWOOD FREEWAY',
            'SANTA MONICA FREEWAY', 'SAN DIEGO FREEWAY', 'VENTURA FREEWAY',
            'BAYSHORE FREEWAY', 'NIMITZ FREEWAY', 'EASTSHORE FREEWAY',
            'HUNTERS POINT EXPRESSWAY',
            
            # Historic routes
            'FORMER PRIMARY STATE HIGHWAY', 'FORMER SECONDARY STATE HIGHWAY',
            
            # Scenic drives that are highways
            '49 MILE SCENIC'
        ]
        
        # Special case for scenic trails with "MILE" in the name
        if 'MILE' in name_upper and 'SCENIC' in name_upper:
            return True
        
        # Check for highway patterns (exact matches)
        for pattern in highway_patterns:
            if pattern in name_upper:
                return True
        
        # Check for pure numbered routes (like "520", "101") but not numbered streets
        # Only if the entire name is just a number (not like "1ST ST" or "42ND AVE")
        stripped_name = name_upper.replace(' ', '')
        if (stripped_name.isdigit() and 
            len(stripped_name) <= 4 and 
            not any(suffix in name_upper for suffix in ['ST', 'AVE', 'BLVD', 'RD', 'WAY', 'PL', 'CT', 'LN', 'DR', 'TER'])):
            return True
        
        return False

    def _parse_street_name(self, full_name: str) -> Tuple[str, str]:
        """Parse street name into base name and suffix."""
        # Normalize the name
        name = full_name.upper().strip()
        
        # Handle special cases - streets that don't have traditional suffixes
        special_cases = [
            'BROADWAY', 'THE EMBARCADERO', 'LOMBARD', 'MARKET', 'MISSION',
            'VALENCIA', 'CASTRO', 'FILLMORE', 'DIVISADERO', 'GEARY',
            'CALIFORNIA', 'SACRAMENTO', 'CLAY', 'WASHINGTON', 'JACKSON',
            'PACIFIC', 'UNION', 'GREEN', 'VALLEJO', 'BROADWAY',
            'THE PRESIDIO', 'GOLDEN GATE PARK', 'LINCOLN PARK'
        ]
        
        if name in special_cases:
            return name, ''
        
        # Split into parts
        parts = name.split()
        if len(parts) < 2:
            return name, ''
        
        # Check if last part is a known suffix
        last_part = parts[-1].lower()
        if last_part in self.STREET_SUFFIXES:
            base_name = ' '.join(parts[:-1])
            suffix = self.STREET_SUFFIXES[last_part]
            return base_name, suffix
        
        # Handle numbered streets (like "1ST", "2ND", "3RD", etc.)
        if last_part.endswith(('st', 'nd', 'rd', 'th')) and len(last_part) >= 3:
            # Check if it's a numbered street
            number_part = last_part[:-2]
            if number_part.isdigit():
                return name, ''  # Treat as complete name without suffix
        
        # No recognized suffix
        return name, ''
    
    def _calculate_length(self, coordinates) -> float:
        """Calculate the length of a street segment in miles.
        
        Args:
            coordinates: Either List[List[float]] for LineString or 
                        List[List[List[float]]] for MultiLineString
        """
        total_distance = 0.0
        
        # Check if this is a MultiLineString (nested array) or LineString
        if coordinates and isinstance(coordinates[0][0], list):
            # MultiLineString: iterate through each LineString
            for line_coords in coordinates:
                total_distance += self._calculate_linestring_length(line_coords)
        else:
            # Single LineString
            total_distance = self._calculate_linestring_length(coordinates)
        
        return total_distance
    
    def _calculate_linestring_length(self, coordinates: List[List[float]]) -> float:
        """Calculate the length of a single LineString in miles."""
        total_distance = 0.0
        
        for i in range(len(coordinates) - 1):
            point1 = (coordinates[i][0], coordinates[i][1])
            point2 = (coordinates[i + 1][0], coordinates[i + 1][1])
            distance = geodesic(point1, point2).miles
            total_distance += distance
        
        return total_distance
    
    def _deduplicate_and_merge_streets(self, streets: List[StreetSegment]) -> List[StreetSegment]:
        """Deduplicate and merge street segments with the same base name."""
        # Group by base name
        name_groups = {}
        for street in streets:
            if street.name not in name_groups:
                name_groups[street.name] = []
            name_groups[street.name].append(street)
        
        merged_streets = []
        for name, segments in name_groups.items():
            if len(segments) == 1:
                merged_streets.append(segments[0])
            else:
                # Merge segments with the same name
                merged = self._merge_street_segments(segments)
                merged_streets.extend(merged)
        
        return sorted(merged_streets, key=lambda s: s.name)
    
    def _merge_street_segments(self, segments: List[StreetSegment]) -> List[StreetSegment]:
        """Merge street segments with the same name but different suffixes."""
        # Group by suffix
        suffix_groups = {}
        for segment in segments:
            key = f"{segment.name}_{segment.suffix}"
            if key not in suffix_groups:
                suffix_groups[key] = []
            suffix_groups[key].append(segment)
        
        merged = []
        for key, group in suffix_groups.items():
            if len(group) == 1:
                merged.append(group[0])
            else:
                # Combine segments with same name and suffix
                base_segment = group[0]
                total_length = sum(s.length for s in group)
                
                # Combine all MultiLineString coordinates
                combined_coordinates = []
                for segment in group:
                    # Each segment now has MultiLineString format coordinates
                    combined_coordinates.extend(segment.coordinates)
                
                merged_segment = StreetSegment(
                    id=base_segment.id,
                    name=base_segment.name,
                    suffix=base_segment.suffix,
                    full_name=base_segment.full_name,
                    coordinates=combined_coordinates,  # Combined MultiLineString
                    length=round(total_length, 2),
                    city=base_segment.city,
                    state=base_segment.state
                )
                merged.append(merged_segment)
        
        return merged
    
    def save_streets_data(self, streets: List[StreetSegment], region: str) -> str:
        """Save streets data to JSON file."""
        # Convert to dictionaries
        streets_data = {
            "region": region,
            "generated_at": int(time.time()),
            "total_streets": len(streets),
            "total_miles": round(sum(s.length for s in streets), 2),
            "streets": [asdict(street) for street in streets]
        }
        
        # Save to file
        filename = f"{region}_streets.json"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(streets_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(streets)} streets to {filepath}")
        logger.info(f"Total miles: {streets_data['total_miles']}")
        
        return filepath
    
    def generate_summary_report(self, streets: List[StreetSegment], region: str):
        """Generate a summary report of the fetched data."""
        total_miles = sum(s.length for s in streets)
        
        # Count by suffix
        suffix_counts = {}
        for street in streets:
            suffix = street.suffix or 'NO_SUFFIX'
            suffix_counts[suffix] = suffix_counts.get(suffix, 0) + 1
        
        # Top 10 longest streets
        longest_streets = sorted(streets, key=lambda s: s.length, reverse=True)[:10]
        
        print("\n" + "="*60)
        print(f"STREET DATA SUMMARY FOR {region.upper().replace('-', ' ')}")
        print("="*60)
        print(f"Total Streets: {len(streets)}")
        print(f"Total Miles: {total_miles:.2f}")
        print(f"Average Length: {total_miles/len(streets):.2f} miles")
        
        print(f"\nStreet Types:")
        for suffix, count in sorted(suffix_counts.items()):
            print(f"  {suffix}: {count}")
        
        print(f"\nLongest Streets:")
        for i, street in enumerate(longest_streets, 1):
            print(f"  {i:2d}. {street.full_name}: {street.length:.2f} miles")
        print("="*60)


def main():
    """Main function to run the street data fetcher."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fetch street data from OpenStreetMap using city boundaries')
    
    # Add mutually exclusive group for region vs city
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--region', 
                           help='Predefined region to fetch (e.g., san-francisco)')
    input_group.add_argument('--city', 
                           help='City name to fetch (e.g., "San Francisco")')
    
    parser.add_argument('--state', 
                       help='State name or abbreviation (required when using --city)')
    parser.add_argument('--country', default='United States',
                       help='Country name (default: United States)')
    parser.add_argument('--output-dir', default='data',
                       help='Output directory for data files (default: data)')
    parser.add_argument('--boundary-dir', default='boundary',
                       help='Directory for boundary files (default: boundary)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate arguments
    if args.city and not args.state:
        parser.error("--state is required when using --city")
    
    try:
        # Initialize fetcher
        fetcher = OSMStreetFetcher(args.output_dir, args.boundary_dir)
        
        # Fetch streets data
        if args.region:
            logger.info(f"Fetching streets for predefined region: {args.region}")
            streets = fetcher.fetch_streets_for_region(args.region)
            output_name = args.region
        else:
            logger.info(f"Fetching streets for city: {args.city}, {args.state}")
            streets = fetcher.fetch_streets_for_city(args.city, args.state, args.country)
            # Generate output name from city
            safe_city = args.city.lower().replace(' ', '_').replace(',', '')
            safe_state = args.state.lower().replace(' ', '_')
            output_name = f"{safe_city}_{safe_state}"
        
        if not streets:
            logger.error("No street data was fetched!")
            sys.exit(1)
        
        # Save data
        filepath = fetcher.save_streets_data(streets, output_name)
        
        # Generate summary
        fetcher.generate_summary_report(streets, output_name)
        
        print(f"\n✅ Successfully generated street data!")
        print(f"📁 Data saved to: {filepath}")
        print(f"🗺️ Using city boundary polygons for accurate results!")
        print(f"🎮 Ready to integrate with the Street Names Challenge game!")
        
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main() 
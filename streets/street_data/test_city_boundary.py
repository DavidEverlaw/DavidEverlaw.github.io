#!/usr/bin/env python3
"""
Test script for the City Boundary Fetcher
==========================================

This script demonstrates how to use the CityBoundaryFetcher to get city boundaries
and how it can be integrated with the OSM Street Fetcher.
"""

import logging
import sys
from city_boundary_fetcher import CityBoundaryFetcher

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_city_boundary():
    """Test fetching city boundaries for different cities."""
    
    fetcher = CityBoundaryFetcher('boundary')
    
    # Test cities
    test_cities = [
        ("San Francisco", "CA"),
        ("New York", "NY"),
        ("Seattle", "WA"),
        ("Austin", "TX")
    ]
    
    for city_name, state in test_cities:
        try:
            logger.info(f"\n{'='*50}")
            logger.info(f"Testing: {city_name}, {state}")
            logger.info(f"{'='*50}")
            
            boundary = fetcher.get_city_boundary(city_name, state)
            
            if boundary:
                print(f"✅ Successfully fetched boundary for {boundary.name}")
                print(f"   State: {boundary.state}")
                print(f"   Area: {boundary.area_km2:.2f} km²")
                print(f"   Geometry type: {boundary.geometry['type']}")
                print(f"   Bounding box: {boundary.bbox}")
                
                # Save to file (will automatically go to boundary folder)
                saved_path = fetcher.save_boundary(boundary)
                print(f"   Saved to: {saved_path}")
                
            else:
                print(f"❌ Could not fetch boundary for {city_name}")
                
        except Exception as e:
            logger.error(f"Error processing {city_name}: {e}")
            continue


def demonstrate_integration():
    """Demonstrate how the boundary fetcher can be integrated with the OSM street fetcher."""
    
    print(f"\n{'='*60}")
    print("INTEGRATION EXAMPLE")
    print(f"{'='*60}")
    
    fetcher = CityBoundaryFetcher('boundary')
    
    # Get San Francisco boundary
    boundary = fetcher.get_city_boundary("San Francisco", "CA")
    
    if boundary:
        print("Here's how you could integrate this with the OSM Street Fetcher:")
        print()
        print("# Instead of using a rectangular bounding box:")
        print(f"# bbox = [37.7049, -122.5096, 37.8084, -122.3573]")
        print()
        print("# You could use the actual city boundary:")
        print(f"boundary = fetcher.get_city_boundary('San Francisco', 'CA')")
        print(f"geometry = boundary.geometry  # GeoJSON polygon")
        print(f"bbox = boundary.bbox  # Still available for compatibility: {boundary.bbox}")
        print()
        print("# Then modify the Overpass query to use the polygon instead of bbox")
        print("# This would give you more accurate results that don't include")
        print("# streets from neighboring cities within the bounding box.")
        
        # Show geometry type and coordinate count
        if boundary.geometry['type'] == 'Polygon':
            coords = boundary.geometry['coordinates'][0]
            print(f"# Polygon has {len(coords)} coordinate points")
        elif boundary.geometry['type'] == 'MultiPolygon':
            total_coords = sum(len(poly[0]) for poly in boundary.geometry['coordinates'])
            print(f"# MultiPolygon has {len(boundary.geometry['coordinates'])} polygons")
            print(f"# with a total of {total_coords} coordinate points")


def demonstrate_loading():
    """Demonstrate loading saved boundary data."""
    
    print(f"\n{'='*60}")
    print("LOADING SAVED BOUNDARIES")
    print(f"{'='*60}")
    
    fetcher = CityBoundaryFetcher('boundary')
    
    # List all saved boundaries
    saved_boundaries = fetcher.list_saved_boundaries()
    
    if saved_boundaries:
        print(f"Found {len(saved_boundaries)} saved boundaries:")
        for boundary_name in saved_boundaries:
            print(f"  📄 {boundary_name}")
        
        # Load the first one as an example
        first_boundary = saved_boundaries[0]
        print(f"\n🔄 Loading '{first_boundary}' as an example...")
        
        boundary = fetcher.load_boundary(first_boundary)
        if boundary:
            print(f"✅ Successfully loaded {boundary.name}")
            print(f"   State: {boundary.state}")
            print(f"   Area: {boundary.area_km2:.2f} km²")
            print(f"   Geometry type: {boundary.geometry['type']}")
        else:
            print(f"❌ Failed to load {first_boundary}")
    else:
        print("No saved boundaries found. Run the test first to create some boundary files.")


if __name__ == '__main__':
    try:
        test_city_boundary()
        demonstrate_integration()
        
        # Demonstrate loading saved boundaries
        demonstrate_loading()
        
        print(f"\n{'='*60}")
        print("✅ Test completed successfully!")
        print("💡 You can now integrate this with osm_street_fetcher.py")
        print("   to get more accurate city boundaries instead of bounding boxes.")
        print(f"📁 All boundary files are saved in the 'boundary' folder")
        print(f"{'='*60}")
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test failed: {e}")
        sys.exit(1) 
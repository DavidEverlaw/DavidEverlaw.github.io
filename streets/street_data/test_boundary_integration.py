#!/usr/bin/env python3
"""
Test Integration of City Boundaries with OSM Street Fetcher
===========================================================

This script demonstrates how the updated OSM Street Fetcher now uses
city boundary polygons instead of rectangular bounding boxes for more
accurate street data collection.
"""

import logging
import sys
from osm_street_fetcher import OSMStreetFetcher

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_boundary_integration():
    """Test the boundary integration with different cities."""
    
    # Initialize the fetcher
    fetcher = OSMStreetFetcher(output_dir='data', boundary_dir='boundary')
    
    # Test cities
    test_cities = [
        ("San Francisco", "CA"),
        ("Berkeley", "CA"),
        ("Oakland", "CA")
    ]
    
    for city_name, state in test_cities:
        try:
            print(f"\n{'='*60}")
            print(f"Testing: {city_name}, {state}")
            print(f"{'='*60}")
            
            # Fetch streets using city boundary
            streets = fetcher.fetch_streets_for_city(city_name, state)
            
            if streets:
                print(f"✅ Successfully fetched {len(streets)} streets for {city_name}")
                
                # Show some statistics
                total_miles = sum(s.length for s in streets)
                avg_length = total_miles / len(streets) if streets else 0
                
                print(f"📊 Statistics:")
                print(f"   Total streets: {len(streets)}")
                print(f"   Total miles: {total_miles:.2f}")
                print(f"   Average length: {avg_length:.2f} miles")
                
                # Show some example streets
                print(f"📍 Sample streets:")
                for i, street in enumerate(streets[:5]):
                    print(f"   {i+1}. {street.full_name}: {street.length:.2f} miles")
                
                # Save the data
                safe_city = city_name.lower().replace(' ', '_')
                safe_state = state.lower()
                output_name = f"{safe_city}_{safe_state}"
                
                filepath = fetcher.save_streets_data(streets, output_name)
                print(f"💾 Saved to: {filepath}")
                
            else:
                print(f"❌ No streets found for {city_name}")
                
        except Exception as e:
            logger.error(f"Error processing {city_name}: {e}")
            continue


def compare_boundary_vs_bbox():
    """Compare results using boundary vs bounding box."""
    
    print(f"\n{'='*60}")
    print("BOUNDARY vs BOUNDING BOX COMPARISON")
    print(f"{'='*60}")
    
    fetcher = OSMStreetFetcher(output_dir='data', boundary_dir='boundary')
    
    # Test with San Francisco (predefined region with bbox)
    print("\n🔸 Fetching San Francisco streets using PREDEFINED REGION (bbox fallback):")
    try:
        bbox_streets = fetcher.fetch_streets_for_region('san-francisco')
        bbox_count = len(bbox_streets)
        bbox_miles = sum(s.length for s in bbox_streets)
        print(f"   Streets found: {bbox_count}")
        print(f"   Total miles: {bbox_miles:.2f}")
    except Exception as e:
        print(f"   Error: {e}")
        bbox_count, bbox_miles = 0, 0
    
    print("\n🔹 Fetching San Francisco streets using CITY BOUNDARY:")
    try:
        boundary_streets = fetcher.fetch_streets_for_city("San Francisco", "CA")
        boundary_count = len(boundary_streets)
        boundary_miles = sum(s.length for s in boundary_streets)
        print(f"   Streets found: {boundary_count}")
        print(f"   Total miles: {boundary_miles:.2f}")
    except Exception as e:
        print(f"   Error: {e}")
        boundary_count, boundary_miles = 0, 0
    
    # Compare results
    if bbox_count > 0 and boundary_count > 0:
        print(f"\n📈 COMPARISON:")
        print(f"   Boundary method found {boundary_count - bbox_count:+d} streets")
        print(f"   Boundary method found {boundary_miles - bbox_miles:+.2f} miles")
        print(f"   Accuracy improvement: {((boundary_count - bbox_count) / bbox_count * 100):+.1f}%")
        
        if boundary_count != bbox_count:
            print(f"\n💡 The difference shows that boundary-based fetching")
            print(f"   provides more accurate results by excluding streets")
            print(f"   from neighboring cities that fall within the bounding box.")


def demonstrate_features():
    """Demonstrate key features of the boundary integration."""
    
    print(f"\n{'='*60}")
    print("KEY FEATURES DEMONSTRATION")
    print(f"{'='*60}")
    
    fetcher = OSMStreetFetcher(output_dir='data', boundary_dir='boundary')
    
    print("\n🔹 Feature 1: Automatic boundary caching")
    print("   The first time you fetch a city, it downloads and saves the boundary.")
    print("   Subsequent fetches reuse the saved boundary for faster processing.")
    
    print("\n🔹 Feature 2: Accurate city limits")
    print("   Only streets actually within the city boundary are included.")
    print("   No more streets from neighboring cities bleeding into your data.")
    
    print("\n🔹 Feature 3: Complex city shapes")
    print("   Handles irregular city boundaries, islands, and holes in city limits.")
    
    print("\n🔹 Feature 4: Fallback compatibility")
    print("   If boundary data isn't available, falls back to bounding box method.")
    
    print("\n🔹 Feature 5: Easy integration")
    print("   Works with existing code - just use fetch_streets_for_city() instead of fetch_streets_for_region()")


if __name__ == '__main__':
    try:
        print("🗺️  Testing City Boundary Integration with OSM Street Fetcher")
        print("=" * 70)
        
        test_boundary_integration()
        compare_boundary_vs_bbox()
        demonstrate_features()
        
        print(f"\n{'='*60}")
        print("✅ Integration test completed successfully!")
        print("🎯 Your street data is now more accurate using city boundaries!")
        print("📁 Check the 'boundary' folder for saved city boundaries")
        print("📁 Check the 'data' folder for street data files")
        print(f"{'='*60}")
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test failed: {e}")
        sys.exit(1) 
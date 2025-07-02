#!/usr/bin/env python3
"""
Quick test script for boundary integration
"""

import logging
from osm_street_fetcher import OSMStreetFetcher

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_sf_fetch():
    """Test fetching San Francisco streets with boundary."""
    print("Testing San Francisco street fetch with city boundary...")
    
    fetcher = OSMStreetFetcher(output_dir='data', boundary_dir='boundary')
    
    try:
        # Fetch streets using city boundary
        streets = fetcher.fetch_streets_for_city("San Francisco", "CA")
        
        if streets:
            print(f"✅ Successfully fetched {len(streets)} streets")
            print(f"📊 Total miles: {sum(s.length for s in streets):.2f}")
            
            # Show first few streets
            print("📍 Sample streets:")
            for i, street in enumerate(streets[:5]):
                print(f"   {i+1}. {street.full_name}: {street.length:.2f} miles")
            
            # Save the data
            filepath = fetcher.save_streets_data(streets, "san_francisco_ca")
            print(f"💾 Saved to: {filepath}")
            
        else:
            print("❌ No streets found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_sf_fetch() 
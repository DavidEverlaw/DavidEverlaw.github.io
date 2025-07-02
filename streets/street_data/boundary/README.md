# City Boundary Data

This folder contains GeoJSON files with city boundary polygons fetched from OpenStreetMap.

## File Naming Convention

Boundary files are automatically named using the pattern:
- `{city_name}_{state}.geojson` - For cities with state information
- `{city_name}.geojson` - For cities without state information

Examples:
- `san_francisco_ca.geojson`
- `new_york_ny.geojson`
- `seattle_wa.geojson`

## File Format

Each file contains a GeoJSON FeatureCollection with:

### Properties
- `name`: City name
- `state`: State abbreviation (if available)
- `country`: Country name
- `osm_id`: OpenStreetMap ID
- `osm_type`: OSM element type (relation, way, or node)
- `area_km2`: Area in square kilometers
- `bbox`: Bounding box [south, west, north, east]

### Geometry
- GeoJSON Polygon or MultiPolygon representing the city boundary
- Coordinates in WGS84 (EPSG:4326) format

## Usage

### Fetching New Boundaries
```bash
# Fetch San Francisco boundary
python city_boundary_fetcher.py "San Francisco" --state CA

# Fetch with custom boundary directory
python city_boundary_fetcher.py "Seattle" --state WA --boundary-dir custom_boundaries
```

### Loading Existing Boundaries
```python
from city_boundary_fetcher import CityBoundaryFetcher

fetcher = CityBoundaryFetcher('boundary')

# List all saved boundaries
boundaries = fetcher.list_saved_boundaries()
print(boundaries)  # ['san_francisco_ca', 'new_york_ny', ...]

# Load a specific boundary
boundary = fetcher.load_boundary('san_francisco_ca')
if boundary:
    print(f"Loaded {boundary.name}: {boundary.area_km2:.2f} km²")
```

### Integration with Street Fetcher
```python
from city_boundary_fetcher import CityBoundaryFetcher

# Get city boundary instead of rectangular bbox
boundary_fetcher = CityBoundaryFetcher('boundary')
boundary = boundary_fetcher.get_city_boundary("San Francisco", "CA")

# Use the polygon geometry for more accurate street queries
geometry = boundary.geometry
bbox = boundary.bbox  # Still available for compatibility
```

## Benefits Over Bounding Boxes

1. **Accuracy**: Only includes streets actually within city limits
2. **No Overlap**: Avoids streets from neighboring cities
3. **Complex Shapes**: Handles cities with irregular boundaries
4. **Islands/Holes**: Supports MultiPolygon geometries for complex city shapes

## File Management

- Files are automatically created when fetching new boundaries
- Existing files can be reloaded without re-fetching from OSM
- Files are human-readable GeoJSON format
- Can be viewed in GIS software or web mapping tools 
# Street Data Fetcher

This directory contains tools for fetching and processing street data from OpenStreetMap for the Street Names Challenge game.

## Files

- `osm_street_fetcher.py` - Main Python script for fetching street data
- `requirements.txt` - Python dependencies
- `README.md` - This file
- `san-francisco_streets.json` - Generated street data for San Francisco (created after running the script)

## Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the street data fetcher:
   ```bash
   python osm_street_fetcher.py
   ```

## Usage

### Basic Usage
```bash
# Fetch San Francisco street data (default)
python osm_street_fetcher.py

# Fetch with verbose logging
python osm_street_fetcher.py --verbose

# Specify output directory
python osm_street_fetcher.py --output-dir /path/to/output
```

### Command Line Options

- `--region` - Region to fetch data for (default: san-francisco)
- `--output-dir` - Output directory for data files (default: street_data/data)
- `--verbose` - Enable verbose logging

## Output Format

The script generates a JSON file with the following structure:

```json
{
  "region": "san-francisco",
  "generated_at": 1234567890,
  "total_streets": 150,
  "total_miles": 250.5,
  "streets": [
    {
      "id": "san_francisco_12345",
      "name": "MARKET",
      "suffix": "ST",
      "full_name": "MARKET ST",
      "coordinates": [[37.7749, -122.4194], [37.7750, -122.4195]],
      "length": 3.2,
      "city": "San Francisco",
      "state": "CA",
      "discovered": false,
      "discovery_time": null
    }
  ]
}
```

## Data Processing

The script performs the following processing steps:

1. **Fetch Data**: Queries OpenStreetMap via the Overpass API for street data within the specified region
2. **Filter Streets**: Only includes major road types (primary, secondary, tertiary, residential, trunk, unclassified)
3. **Parse Names**: Extracts base street names and standardizes suffixes (ST, AVE, BLVD, etc.)
4. **Calculate Lengths**: Computes accurate street lengths in miles using geodesic distance
5. **Deduplicate**: Merges street segments with the same name and suffix
6. **Format Output**: Converts to the game's expected JSON format

## Adding New Regions

To add support for new regions, modify the `REGIONS` dictionary in `osm_street_fetcher.py`:

```python
REGIONS = {
    'san-francisco': {
        'name': 'San Francisco',
        'bbox': [37.7049, -122.5096, 37.8084, -122.3573],  # [south, west, north, east]
        'city': 'San Francisco',
        'state': 'CA'
    },
    'new-region': {
        'name': 'New Region',
        'bbox': [lat_south, lng_west, lat_north, lng_east],
        'city': 'City Name',
        'state': 'ST'
    }
}
```

## API Rate Limits

The script respects OpenStreetMap's usage policies:
- Uses appropriate User-Agent header
- Implements retry logic with exponential backoff
- Includes reasonable timeout values
- Logs all API interactions

## Troubleshooting

### Common Issues

1. **Network Timeout**: The Overpass API can be slow during peak times. The script will retry automatically.

2. **Empty Results**: Check that the bounding box coordinates are correct and in the right order (south, west, north, east).

3. **Missing Dependencies**: Make sure all required packages are installed:
   ```bash
   pip install -r requirements.txt
   ```

### Logs

The script creates detailed logs in `osm_fetch.log` for debugging purposes.

## Integration with Game

Once the data is generated, the game's `DataManager.js` can be updated to load the real street data instead of using mock data:

```javascript
// Replace the generateSanFranciscoData() method with:
async loadRealStreetData(region) {
    const response = await fetch(`street_data/data/${region}_streets.json`);
    const data = await response.json();
    return data.streets;
}
``` 
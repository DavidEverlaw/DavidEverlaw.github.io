# Street Filtering System

## Overview

The street filtering system allows you to exclude specific streets from being loaded into the game. This is useful for removing streets that might not be suitable for gameplay, such as private roads, service roads, or other non-public streets.

## Configuration

### Filter File Location
The filters are defined in `street_data/street_filters.json`

### Filter File Format
```json
{
  "_comment": "Optional comment explaining the filters",
  "city_state": [
    "EXACT STREET NAME 1",
    "EXACT STREET NAME 2"
  ]
}
```

### Key Format
- Keys must match the `city_state` naming convention used in the data files
- Examples: `san_francisco_ca`, `berkeley_ca`, `oakland_ca`, etc.

### Value Format
- Values are arrays of exact street name matches
- Street names must match the `full_name` field exactly (case-sensitive)
- Examples: `"MARKET ST"`, `"LOMBARD ST"`, `"PRIVATE RD"`

## How It Works

1. When `DataManager.loadRegionData()` is called, it automatically loads the filter file
2. After loading the street data, it applies the filters for the specific region
3. Streets whose `full_name` exactly matches any filter are removed from the dataset
4. The filtered data is cached and returned to the game

## Usage Examples

### Adding a Filter
To exclude "ACTON CRESCENT" from Berkeley:
```json
{
  "berkeley_ca": [
    "PRIVATE RD",
    "UNNAMED ST", 
    "SERVICE RD",
    "ACTON CRESCENT"
  ]
}
```

### Adding a New Region
```json
{
  "new_city_state": [
    "FILTER STREET 1",
    "FILTER STREET 2"
  ]
}
```

## API Methods

### DataManager Methods
- `loadFilters()` - Loads the filter file (called automatically)
- `applyFilters(streetsData, region)` - Applies filters to street data
- `reloadFilters()` - Manually reloads filters and clears cache
- `getFilters()` - Returns the current filter configuration

### Console Output
The system logs filtering activity:
- Number of streets filtered out
- Examples of filtered street names
- Filter loading status

## Error Handling

- If the filter file doesn't exist, the system continues without filtering
- If there's an error loading filters, it logs a warning and continues
- If no filters exist for a region, no filtering is applied

## Performance

- Filters are loaded once and cached
- Filtered data is cached to avoid reprocessing
- Filtering adds minimal overhead to data loading 
# Street Names Game - Game Specification

## Game Overview

**Game Title:** Street Names Challenge  
**Genre:** Educational Geography Game  
**Platform:** Web Browser (HTML5, CSS3, JavaScript)  
**Target Audience:** Geography enthusiasts, city planners, general public

## Game Objective

Players enter street names to discover and claim all streets with matching names across a city or region. The goal is to achieve 100% coverage of all available street miles by systematically identifying street names.

## Core Game Mechanics

### 1. Street Name Input System
- **Input Method:** Text input field
- **Name Normalization:** 
  - Ignore common suffixes: "ST", "AVE", "DR", "RD", "BLVD", "WAY", "PL", "CT", "LN"
  - Case-insensitive matching (Force ALL caps inputs)
  - Ignore common prefixes: "THE"
  - Handle common abbreviations (e.g., "1ST" = "FIRST", "MLK" = "MARTIN LUTHER KING")
- **Validation:** Check against available street database
- **Feedback:** Immediate visual and audio feedback for valid/invalid entries

### 2. Street Discovery and Visualization
- **Map Display:** Interactive map showing the game area
- **Street Highlighting:** 
  - Unfound streets: Gray/transparent
  - Found streets: Colored by discovery order or category
  - Recently found: Animated highlight effect
- **Street Labels:** Display street names on found streets
- **Zoom and Pan:** Allow players to explore the map

### 3. Progress Tracking System
- **Overall Progress:** Percentage of total street miles discovered
- **Individual Street Breakdown:**
  - Street name with suffix (e.g., "1ST ST", "1ST AVE")
  - Individual length in miles
  - Discovery timestamp
  - Running total of miles for that base name
- **Statistics Dashboard:**
  - Total streets found vs. available
  - Total miles covered vs. available

### 4. Scoring and Achievement System (Future Enhancement)
- **Base Score:** Points per mile of street discovered
- **Bonus Multipliers:**
  - Streak bonus for consecutive correct guesses
  - Speed bonus for quick discoveries
  - Completion bonus for finding all instances of a street name
- **Achievements:**
  - "First Mile" - Discover first street
  - "Neighborhood Explorer" - Find 10 different street names
  - "Mile Master" - Discover 100 miles of streets
  - "Completionist" - Find all streets in the area

## User Interface Requirements

### 1. Game Layout
- **Map view:** Full page background is map view that is zoomable/pannable
- **Top of screen:** Menu Icon (Top-Left), Street input text box (Top-Center) with placeholder text: "ENTER A STREET" (forces ALL CAPS)
- **Progress Tracker:** Right Side Panel, shows % of miles of street named, progress bar, a sortable (order found, alpha, length) list of streets found so far.

### 2. Landing screen
- **Region Selector:** selector for what region we will be playing. (initially just San Francisco, but will expand)


## Data Requirements

### 1. Street Data Structure
```javascript
{
  "streets": [
    {
      "id": "unique_street_id",
      "name": "MAIN",
      "suffix": "ST",
      "fullName": "MAIN ST",
      "coordinates": [[lat, lng], [lat, lng], ...],
      "length": 1.25, // miles
      "city": "CityName",
      "state": "ST",
      "discovered": false,
      "discoveryTime": null
    }
  ]
}
```

### 2. Data Sources
- **Primary:** OpenStreetMap (OSM) data
- **Secondary:** Municipal GIS databases
- **Format:** GeoJSON with additional game metadata
- **Coverage:** Configurable geographic boundaries

### 3. Data Processing
- **Preprocessing:** Convert raw street data to game format
- **Indexing:** Create searchable index by street base names
- **Optimization:** Simplify coordinates for performance
- **Validation:** Ensure data quality and completeness

## Technical Specifications

### 1. Frontend Architecture
- **Framework:** Vanilla JavaScript (ES6+) or lightweight framework
- **Mapping Library:** Leaflet.js with OpenStreetMap tiles
- **UI Components:** Custom CSS components with CSS Grid/Flexbox
- **State Management:** Local state with browser storage for persistence

### 2. Performance Requirements
- **Load Time:** < 3 seconds for initial game load
- **Map Rendering:** Smooth interaction at 60fps
- **Search Response:** < 100ms for street name lookup
- **Memory Usage:** < 100MB for street data in browser

### 3. Browser Compatibility
- **Minimum Support:** Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **Progressive Enhancement:** Core functionality without JavaScript
- **Fallbacks:** Text-based interface for unsupported browsers

### 4. Data Management
- **Storage:** IndexedDB for offline capability
- **Caching:** Service Worker for map tiles and street data
- **Updates:** Versioned data updates without full reload
- **Synchronization:** Optional cloud save for progress

## Game Modes and Variations

### 1. Standard Mode
- **Objective:** Find all streets in the selected area
- **Time Limit:** None (relaxed exploration)
- **Hints:** Unlimited hints available (Future Enhancement)

### 2. Time Challenge Mode (Future Enhancement)
- **Objective:** Find as many streets as possible in time limit
- **Time Limit:** 5, 10, or 15 minutes
- **Hints:** Limited hint usage

### 3. Neighborhood Focus Mode (Future Enhancement)
- **Objective:** Complete specific neighborhoods or districts
- **Area:** Smaller, focused geographic areas
- **Difficulty:** Progressive unlocking of areas

### 4. Multiplayer Mode (Future Enhancement)
- **Collaborative:** Multiple players work together
- **Competitive:** Race to find streets first
- **Real-time:** Live updates of other players' discoveries

## Success Metrics

### 1. Engagement Metrics
- **Session Duration:** Average time spent playing
- **Return Rate:** Percentage of players who return
- **Completion Rate:** Percentage who reach 100% discovery

### 2. Learning Metrics
- **Geographic Knowledge:** Improvement in street recognition
- **Area Familiarity:** Increased knowledge of local geography
- **Discovery Patterns:** Analysis of how players explore

### 3. Technical Metrics
- **Performance:** Load times, rendering speed, responsiveness
- **Reliability:** Error rates, crash frequency
- **Accessibility:** Usage by assistive technologies

## Future Enhancements

### 1. Educational Features
- **Historical Information:** Street naming history and significance
- **Demographic Data:** Population and development information
- **Municipal Context:** City planning and infrastructure details

### 2. Social Features
- **Leaderboards:** Global and local high scores
- **Sharing:** Share discoveries and achievements
- **Community:** User-generated content and street stories

### 3. Advanced Gameplay
- **Dynamic Events:** Temporary bonus areas or challenges
- **Seasonal Content:** Holiday-themed street collections
- **User-Generated Maps:** Custom areas created by players 
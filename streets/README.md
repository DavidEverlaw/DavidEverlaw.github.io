# Street Names Challenge 🗺️

**Discover and claim all the streets in your city!**

Street Names Challenge is an interactive geography puzzle game where players explore cities by naming streets. Type in a street name, and watch as all streets with that name light up on the map. Your goal: achieve 100% coverage by discovering every street mile in the city.

![Street Names Challenge](assets/game-preview.png)

## 🎮 How to Play

1. **Choose Your City**: Select from available regions (San Francisco, Berkeley, Los Angeles, New York, Oakland, Seattle)
2. **Name That Street**: Type street names into the input box (e.g., "MARKET", "1ST", "MAIN")
3. **Watch Streets Light Up**: All matching streets will be highlighted on the interactive map
4. **Track Your Progress**: Monitor your completion percentage and discovered street miles
5. **Achieve 100%**: Discover every street name to complete the challenge!

## 🚀 Quick Start

### Play Online
Simply open `index.html` in your web browser - no installation required!

### Local Development
```bash
# Clone the repository
git clone [your-repo-url]
cd streets

# Open in browser
open index.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

## 🏙️ Available Cities

- **San Francisco, CA** - The city by the bay with its iconic streets
- **Berkeley, CA** - Home to UC Berkeley and the Free Speech Movement
- **Los Angeles, CA** - The sprawling metropolis of Southern California  
- **New York, NY** - The city that never sleeps
- **Oakland, CA** - The diverse heart of the East Bay
- **Seattle, WA** - The emerald city of the Pacific Northwest

## 🎯 Game Features

### Intelligent Street Matching
- **Smart Name Recognition**: Handles common abbreviations (MLK → Martin Luther King Jr.)
- **Suffix Flexibility**: Matches streets regardless of suffix (ST, AVE, BLVD, etc.)
- **Ordinal Conversion**: Recognizes both "1ST" and "FIRST"
- **Directional Prefixes**: Handles E/EAST, W/WEST variations

### Interactive Mapping
- **Real Street Data**: Powered by OpenStreetMap with accurate street geometries
- **Zoom & Pan**: Fully interactive map for exploration
- **Visual Feedback**: Undiscovered streets appear gray, discovered streets light up in color
- **Clean Design**: Simplified map view focusing on streets and major landmarks

### Progress Tracking
- **Completion Percentage**: Track your progress toward 100% coverage
- **Miles Discovered**: See exactly how many street miles you've found
- **Sortable Street List**: View discovered streets by discovery order, alphabetically, or by length
- **Discovery Timestamps**: Remember when you found each street

## 🔧 Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript (ES6+) with modular architecture
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **Data**: Pre-processed GeoJSON from OpenStreetMap

### Browser Support
- Chrome 70+
- Firefox 65+  
- Safari 12+
- Edge 79+

### Performance Optimizations
- Efficient street data indexing for fast lookups
- Optimized map rendering for smooth 60fps interaction
- Smart coordinate simplification for reduced memory usage
- Lazy loading of street data by region

## 📊 Street Data

### Data Sources
Street data is sourced from **OpenStreetMap** and processed through our custom pipeline:

- **Coverage**: Major road types (primary, secondary, tertiary, residential, trunk)
- **Accuracy**: Geodesic distance calculations for precise street lengths
- **Processing**: Name normalization, deduplication, and game format conversion
- **Updates**: Data can be refreshed by running the included Python scripts

### Data Processing Pipeline
```bash
cd street_data
pip install -r requirements.txt
python osm_street_fetcher.py --region san_francisco_ca
```

The pipeline handles:
- Fetching raw data from OpenStreetMap Overpass API
- Filtering relevant road types and removing pedestrian-only paths
- Calculating accurate street lengths in miles
- Normalizing street names and suffixes
- Generating game-ready JSON format

## 🎨 Game Modes

### Standard Mode
- **Objective**: Discover all streets in the selected region
- **Time Limit**: None - explore at your own pace
- **Difficulty**: Progressive discovery with intelligent street matching

### Future Enhancements
- **Time Challenge**: Race against the clock
- **Neighborhood Focus**: Complete specific districts
- **Multiplayer**: Collaborate or compete with other players
- **Historical Mode**: Learn about street naming history

## 🏗️ Project Structure

```
streets/
├── index.html              # Main game interface
├── css/styles.css          # Game styling
├── js/                     # Game logic modules
│   ├── main.js            # Application entry point
│   ├── GameController.js  # Game state management
│   ├── GameLogic.js       # Street matching algorithms
│   ├── MapManager.js      # Map rendering and interaction
│   ├── DataManager.js     # Street data loading/processing
│   └── UIManager.js       # User interface management
├── street_data/           # Street data and processing tools
│   ├── data/             # Generated street data files
│   ├── boundary/         # City boundary definitions
│   └── *.py              # Data processing scripts
└── assets/               # Game assets and images
```

## 🎓 Educational Value

Street Names Challenge helps players:
- **Learn Local Geography**: Discover streets in their city or explore new ones
- **Understand Urban Planning**: See how cities are organized and connected
- **Build Spatial Awareness**: Develop mental maps of urban environments
- **Appreciate City History**: Many street names reflect local history and culture

## 🤝 Contributing

We welcome contributions! Areas where you can help:

- **New Cities**: Add support for additional regions
- **Game Features**: Implement new game modes or mechanics  
- **UI/UX**: Improve the user interface and experience
- **Performance**: Optimize map rendering and data processing
- **Documentation**: Improve guides and documentation

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **OpenStreetMap**: For providing comprehensive street data
- **Leaflet.js**: For the excellent mapping library
- **OSM Community**: For maintaining accurate geographic data
- **Beta Testers**: For feedback and suggestions

---

**Ready to explore your city like never before?** Open `index.html` and start the Street Names Challenge! 🗺️✨ 
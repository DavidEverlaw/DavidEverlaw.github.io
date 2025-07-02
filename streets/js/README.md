# JavaScript Architecture

This directory contains the reorganized JavaScript code for the Street Names Game, following modern best practices and separation of concerns.

## File Structure

```
js/
├── main.js           # Main entry point and application initialization
├── GameController.js # Central orchestrator that coordinates all modules
├── GameState.js      # Game state management and data storage
├── UIManager.js      # UI interactions and DOM manipulation
├── GameLogic.js      # Core game logic and street matching algorithms
├── DataManager.js    # Data loading, caching, and persistence
├── EventManager.js   # Event handling and user interactions
├── Utils.js          # Utility functions and helper methods
└── README.md         # This file
```

## Architecture Overview

### Separation of Concerns

The code is organized into distinct modules, each with a specific responsibility:

1. **GameState** - Pure data management
2. **UIManager** - DOM manipulation and UI updates
3. **GameLogic** - Business logic and algorithms
4. **DataManager** - Data operations and persistence
5. **EventManager** - Event handling and user interactions
6. **Utils** - Reusable utility functions
7. **GameController** - Orchestrates all modules

### Module System

- Uses ES6 modules with import/export
- Each module is self-contained and has a clear interface
- Dependencies are explicitly declared through imports
- Supports modern JavaScript features

### Key Benefits

1. **Maintainability** - Each module has a single responsibility
2. **Testability** - Modules can be tested in isolation
3. **Reusability** - Modules can be reused across different parts of the application
4. **Scalability** - Easy to add new features without affecting existing code
5. **Debugging** - Easier to locate and fix issues

## Module Details

### main.js
- Application entry point
- Handles initialization and startup
- Global error handling
- Page lifecycle management

### GameController.js
- Central coordinator for all modules
- Manages game flow and state transitions
- Handles communication between modules
- Provides public API for the game

### GameState.js
- Manages all game state and data
- Provides methods for state manipulation
- Handles game statistics and progress tracking
- Pure data operations without side effects

### UIManager.js
- Handles all DOM manipulation
- Manages UI state and updates
- Provides methods for showing/hiding elements
- Handles responsive layout changes

### GameLogic.js
- Contains core game algorithms
- Street name normalization and matching
- Score calculation and game completion logic
- Pure functions without side effects

### DataManager.js
- Handles data loading and caching
- Manages local storage operations
- Provides data validation and error handling
- Simulates API calls for region data

### EventManager.js
- Manages all event listeners
- Handles user interactions
- Provides custom event system
- Manages event cleanup and memory leaks

### Utils.js
- Collection of utility functions
- Helper methods for common operations
- Performance helpers and debugging tools
- Validation and formatting functions

## Usage

The game is initialized automatically when the DOM is ready. The main entry point creates all necessary modules and sets up the game.

```javascript
// Global access for debugging (available in browser console)
window.streetNamesGame.getDebugInfo()
```

## Development

### Adding New Features

1. Identify which module should handle the new functionality
2. Add methods to the appropriate module
3. Update the GameController if coordination is needed
4. Add event handlers in EventManager if user interaction is required

### Testing

Each module can be imported and tested independently:

```javascript
import GameLogic from './GameLogic.js';
const gameLogic = new GameLogic();
// Test methods...
```

### Debugging

- Use browser developer tools to inspect modules
- Access `window.streetNamesGame` for runtime debugging
- Each module has clear method names and documentation
- Console logging is available throughout the codebase

## Migration from Original Code

The original monolithic `script.js` has been refactored into this modular architecture while maintaining all existing functionality. The backup file `script.js.backup` contains the original code for reference.

## Future Enhancements

This architecture supports easy addition of:
- New regions and data sources
- Advanced game features
- Better error handling and user feedback
- Performance optimizations
- Testing frameworks
- Build tools and bundlers 
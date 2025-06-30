# Coin Flip Idle - Implementation Notes

## Current Implementation (Phase 1 - Complete Core Game + Debug System)

### Project Structure
```
roguelike/
├── index.html              # Main HTML file (clean, minimal)
├── css/
│   └── style.css           # All styling and visual effects
├── js/
│   ├── config.js           # Game configuration and settings
│   ├── currency-manager.js # Currency tracking and earnings
│   ├── upgrade-manager.js  # Upgrade system and progression
│   ├── debug-manager.js    # Debug tools and testing utilities
│   ├── coin-flipper.js     # Core coin flipping logic
│   └── game.js             # Main game initialization
├── README.md               # Project overview
├── GAME_DESIGN_DOCUMENT.md # Detailed game design
└── IMPLEMENTATION_NOTES.md # This file
```

### Features Implemented

#### 1. Coin Flipping System ✅
- **Three Outcomes**: Heads (49.9%), Tails (49.9%), Edge (0.2%)
- **Visual Animation**: 3D coin flip with realistic physics
- **Click Interaction**: Coin can be clicked to trigger flips
- **Animation Prevention**: Prevents multiple simultaneous flips

#### 2. Currency System ✅
- **Earnings from Flips**: 
  - Heads: Base 1 coin + upgrades
  - Tails: 0 coins
  - Edge: 100 coins base + upgrades and multipliers
- **Currency Display**: Real-time currency and total earned tracking
- **Formatted Display**: Automatic K/M formatting for large numbers
- **Earnings Feedback**: Result messages show exact earnings
- **Upgrade Integration**: Currency earnings affected by upgrades

#### 3. Upgrade System ✅
- **Coin Value Upgrade**: 
  - Cost: 10 coins (base), 1.5x multiplier per level
  - Effect: +1 coin per heads flip per level
  - Applies only to heads (not edge)
- **Coin Multiplier Upgrade**:
  - Cost: 100 coins (base), 2.0x multiplier per level  
  - Effect: +50% to all earnings per level
  - Applies to both heads and edge earnings
- **Dynamic Pricing**: Exponential cost scaling
- **Visual Feedback**: Buttons change color based on affordability
- **Real-time Updates**: Costs and effects update immediately

#### 4. Debug System ✅
- **Debug Panel Toggle**: 
  - Button in top-right corner
  - Keyboard shortcut: Press "D" key
  - Hidden by default for clean gameplay
- **Currency Cheats**:
  - +1K coins button
  - +10K coins button  
  - +100K coins button
  - +1M coins button
- **Game Control**:
  - Reset Game button (with confirmation)
  - Resets all progress (currency, upgrades, stats)
- **Visual Feedback**:
  - Success/warning/error messages
  - Hover effects and animations
  - Color-coded buttons

#### 5. Statistics Tracking ✅
- **Total Flips**: Running count of all flips
- **Outcome Counts**: Individual counts for heads, tails, and edge
- **Currency Stats**: Current currency and total earned
- **Upgrade Levels**: Displayed on upgrade cards
- **Real-time Updates**: All stats update immediately after each flip

#### 6. Modular Architecture ✅
- **Separation of Concerns**: HTML, CSS, and JS are separate
- **Configuration-Driven**: Probabilities and settings in config file
- **Extensible Design**: Easy to add new features and systems
- **System Integration**: All managers work together seamlessly

### Key Classes and Components

#### CoinFlipper Class (`js/coin-flipper.js`)
- **Purpose**: Handles all coin flipping logic
- **Key Methods**:
  - `flip()`: Main flip method with animation, stats, and currency
  - `generateOutcome()`: Probability-based outcome generation
  - `animateCoin()`: 3D coin animation
  - `showResult()`: Display outcome messages with earnings
  - `updateStats()`: Update statistics display
- **Integration**: Works with CurrencyManager to process earnings

#### CurrencyManager Class (`js/currency-manager.js`)
- **Purpose**: Handles currency tracking and earnings
- **Key Methods**:
  - `processFlipOutcome()`: Calculate earnings based on flip result and upgrades
  - `addCurrency()`: Add currency and update totals
  - `spendCurrency()`: Spend currency for upgrades
  - `formatCurrency()`: Format large numbers (K/M notation)
  - `updateDisplay()`: Update currency UI elements
- **Integration**: Works with UpgradeManager to apply bonuses
- **Features**: 
  - Automatic number formatting
  - Total earned tracking
  - Upgrade bonus application

#### UpgradeManager Class (`js/upgrade-manager.js`)
- **Purpose**: Handles all upgrade logic and progression
- **Key Methods**:
  - `purchaseUpgrade()`: Buy upgrades if affordable
  - `getUpgradeCost()`: Calculate exponential costs
  - `calculateFinalEarnings()`: Apply all upgrade bonuses
  - `getCoinValueBonus()`: Get flat coin bonus
  - `getCoinMultiplier()`: Get earnings multiplier
  - `updateDisplay()`: Update upgrade UI elements
- **Features**:
  - Exponential cost scaling
  - Multiple upgrade types
  - Real-time affordability checking
  - Dynamic effect calculations

#### DebugManager Class (`js/debug-manager.js`)
- **Purpose**: Provides testing and development tools
- **Key Methods**:
  - `toggleDebugPanel()`: Show/hide debug panel
  - `addCurrency()`: Add currency for testing
  - `resetGame()`: Reset all game progress
  - `showDebugMessage()`: Display feedback messages
  - `getDebugInfo()`: Get current game state info
- **Features**:
  - Keyboard shortcut (D key)
  - Multiple currency amounts
  - Confirmation for destructive actions
  - Visual feedback system

#### Game Class (`js/game.js`)
- **Purpose**: Main game controller and initialization
- **Systems Managed**: CoinFlipper, CurrencyManager, UpgradeManager, DebugManager
- **Integration**: Connects all systems with proper initialization order

#### GameConfig (`js/config.js`)
- **Purpose**: Centralized configuration
- **Key Settings**:
  - Coin flip probabilities
  - Currency values and multipliers
  - Animation durations
  - Visual settings

### Debug System Details

#### Access Methods
- **Button**: Click "🐛 Debug (Press D)" in top-right corner
- **Keyboard**: Press "D" key (works anywhere except input fields)
- **Toggle**: Can be shown/hidden repeatedly

#### Currency Cheats
- **+1K**: Adds 1,000 coins instantly
- **+10K**: Adds 10,000 coins instantly  
- **+100K**: Adds 100,000 coins instantly
- **+1M**: Adds 1,000,000 coins instantly

#### Game Control
- **Reset Game**: 
  - Resets currency to 0
  - Resets all upgrade levels to 0
  - Resets all flip statistics
  - Requires confirmation dialog
  - Cannot be undone

#### Visual Feedback
- **Success Messages**: Green notifications for currency additions
- **Warning Messages**: Orange notifications for resets
- **Error Messages**: Red notifications for failures
- **Auto-Hide**: Messages disappear after 2 seconds

### How to Test with Debug Tools

1. **Start the game**: Open in browser
2. **Access debug**: Press "D" or click debug button
3. **Test progression**:
   - Add 1K coins → Buy coin value upgrades
   - Add 10K coins → Buy multiplier upgrades
   - Test high-level upgrade costs
4. **Test reset**: Use reset button to start fresh
5. **Test edge cases**: Add 1M coins to test large number formatting

### Development Workflow

#### Testing Upgrades
1. Add currency with debug tools
2. Purchase upgrades to test effects
3. Verify calculations are correct
4. Reset and repeat with different combinations

#### Testing Balance
1. Use debug tools to simulate different game states
2. Test upgrade costs at various levels
3. Verify progression feels appropriate
4. Adjust config values as needed

#### Testing Edge Cases
1. Add large amounts of currency
2. Test number formatting (K/M display)
3. Test upgrade calculations at high levels
4. Verify UI doesn't break with large numbers

### Visual Design

#### Debug Panel
- **Position**: Fixed top-right corner
- **Style**: Purple theme to distinguish from game UI
- **Layout**: Organized sections for different tool types
- **Responsive**: Adapts to smaller screens

#### Debug Messages
- **Position**: Below debug toggle button
- **Animation**: Fade in/out with smooth transitions
- **Color Coding**: Green/orange/red for different message types
- **Timing**: Auto-hide after 2 seconds

### Security Considerations

#### Debug Access
- **Development Only**: Debug tools should be disabled in production
- **No Server Impact**: All debug functions are client-side only
- **Local Storage**: Debug doesn't affect save/load (when implemented)

### Next Steps for Extension

#### Phase 2: Advanced Features
1. **Auto-Flip System**: Automated coin flipping
2. **Save System**: Persistent game state
3. **More Upgrade Types**: Auto-flip speed, edge chance, etc.
4. **Debug Enhancements**: Save/load testing, upgrade level controls

#### Phase 3: Production Ready
1. **Debug Disable**: Remove debug tools for production
2. **Performance Optimization**: Optimize for mobile devices
3. **Error Handling**: Comprehensive error management

### Code Quality Features

- **Modular Design**: Each system is separate and focused
- **Configuration-Driven**: Easy to adjust settings without code changes
- **Error Handling**: Basic error checking and validation
- **Documentation**: Clear comments and structure
- **Extensible**: Easy to add new features and systems
- **Integration**: Systems work together seamlessly
- **Performance**: Efficient calculations and updates
- **Testing Tools**: Debug system for easy development

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **CSS Features**: Uses modern CSS3 (transforms, gradients, flexbox)
- **JavaScript**: ES6+ features (classes, arrow functions, destructuring)
- **Keyboard Events**: Standard keydown event handling

---

*This implementation now includes a complete debug system that makes development and testing much easier. The debug tools allow for rapid iteration and testing of game balance without spending time manually earning currency. The system is designed to be easily removable for production builds.* 
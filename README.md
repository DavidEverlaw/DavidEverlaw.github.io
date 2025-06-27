# Coin Flip Idle

A captivating idle game centered around the simple yet addictive mechanic of flipping coins. Flip coins to earn currency, with three possible outcomes: Heads (currency gain), Tails (no gain), and the rare Edge landing (massive jackpot bonus). Features deep progression systems including upgrades, prestige mechanics, and strategic decision-making.

## How to Play

### Option 1: Quick Start (Recommended)
1. **Run the server**: `./start-server.sh` or `python3 -m http.server 8000`
2. **Open your browser** and go to `http://localhost:8000`
3. **Click the coin** to flip it manually
4. **Watch for outcomes**:
   - **Heads (50%)**: Earn currency
   - **Tails (49.5%)**: No earnings
   - **Edge (0.5%)**: Massive jackpot bonus!
5. **Upgrade your flipping** to earn more and flip faster
6. **Enable auto-flipping** to continue earning while away

### Option 2: Alternative Server Methods
- **Python 3**: `python3 -m http.server 8000`
- **Python 2**: `python -m http.server 8000`
- **Node.js**: `npx http-server -p 8000`
- **PHP**: `php -S localhost:8000`

### Option 3: Direct File (Limited)
- Open `index.html` directly in your browser (some features may not work due to CORS restrictions)

## Current Features (Phase 1)

- [ ] **Coin Flipping System** with three outcomes (Heads/Tails/Edge)
- [ ] **Manual clicking** with visual feedback and animations
- [ ] **Basic upgrade system** (Coin Value and auto-flipper)
- [ ] **Save/Load system** (auto-saves every 30 seconds)
- [ ] **Responsive UI** with real-time currency updates
- [ ] **Visual effects** including coin animations and click feedback
- [ ] **Debug Menu** (Press 'D' to toggle) with cheat functions for testing
- [ ] **Smooth animations** with delta time-based game loop
- [ ] **Comprehensive configuration system** for easy customization

## Game Mechanics

- **Coin Flipping**: Click to flip coins manually or upgrade auto-flipping
- **Three Outcomes**:
  - **Heads (49.9%)**: Earn base currency amount
  - **Tails (49.9%)**: No currency earned
  - **Edge (0.2%)**: Massive jackpot bonus (e.g. 10x-100x normal earnings)
- **Coin Value**: How much currency you earn per successful flip
- **Flip Speed**: How many coins you can flip per second
- **Upgrade Costs**: Increase exponentially with each purchase

## Debug Features

Press **'D'** to toggle the debug menu, which includes:
- **+$100,000**: Add 100,000 instantly
- **Reset Game**: Reset all progress

## Technical Details

- **Frontend**: HTML5 Canvas + JavaScript (ES6)
- **Graphics**: Custom coin rendering with gradients, animations, and visual effects
- **Storage**: Local browser storage (localStorage)
- **Performance**: 60 FPS game loop with delta time for smooth animations
- **Architecture**: Modular class-based design with configuration objects

## Development Roadmap

### Phase 1: Core Foundation (PLANNED)
- [ ] Coin flipping system with three outcomes
- [ ] Basic upgrade system (Coin Value and auto-flipper)
- [ ] Save/load functionality with auto-save
- [ ] Simple coin representation
- [ ] Debug menu for testing and development

### Phase 2: Advanced Mechanics (PLANNED)
- [ ] Secondary currencies (Prestige Tokens and Achievement Points)
- [ ] Multiple upgrade categories and progression trees
- [ ] Statistics tracking and analytics

### Phase 3: Prestige & Progression (PLANNED)
- [ ] Prestige system with permanent bonuses
- [ ] Achievement system with milestones and rewards
- [ ] Advanced upgrades using secondary currencies
- [ ] Balance optimization and fine-tuning

### Phase 4: Polish & Enhancement (PLANNED)
- [ ] Enhanced visual effects and animations
- [ ] Sound design and audio feedback
- [ ] Mobile responsiveness and optimization
- [ ] Performance optimizations and additional content

## File Structure

```
flipper/
├── index.html          # Main HTML file
├── js/
│   └── game.js         # Main game logic with all systems
├── css/
│   └── style.css       # Styling
├── package.json        # Project configuration
├── start-server.sh     # Quick server startup script
├── README.md           # This file
└── GAME_DESIGN_DOCUMENT.md  # Detailed game design
```

## Troubleshooting

### CORS Error
If you see a CORS error, you need to run the game through a local server:
1. Use the `start-server.sh` script
2. Or run `python3 -m http.server 8000`
3. Then access the game at `http://localhost:8000`

### Server Won't Start
Make sure you have Python or Node.js installed:
- **Ubuntu/Debian**: `sudo apt install python3`
- **macOS**: `brew install python3`
- **Windows**: Download from python.org

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

The game uses modern JavaScript features, so a recent browser version is recommended.

---

*Enjoy flipping coins and chasing those rare edge landings!* 🪙 
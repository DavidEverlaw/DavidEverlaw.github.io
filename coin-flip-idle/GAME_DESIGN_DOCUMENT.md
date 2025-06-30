# Coin Flip Idle - Game Design Document

## Game Overview
A captivating idle game centered around the simple yet addictive mechanic of flipping coins. Players flip coins to earn currency, with three possible outcomes: Heads (currency gain), Tails (no gain), and the rare Edge landing (massive jackpot bonus). The game features deep progression systems including multiple currencies, upgrade trees, prestige mechanics, and strategic decision-making.

## Core Game Mechanics

### 1. Coin Flipping System
- **Manual Flipping**: Players click to flip coins manually
- **Auto-Flipping**: Automated coin flipping that continues when player is away or not clicking
- **Three Outcomes**:
  - **Heads (49.9%)**: Earn base currency amount
  - **Tails (49.9%)**: No currency earned
  - **Edge (0.2%)**: Massive jackpot bonus (10x-100x normal earnings)
- **Visual Feedback**: Animated coin flip with realistic physics and sound effects

### 2. Currency System
- **Primary Currency**: Coins earned from successful flips and edge landings
- **Secondary Currencies**: 
  - **Prestige Tokens**: Earned through prestige resets, provide permanent bonuses
  - **Achievement Points**: Earned from milestones, unlock special features
- **Currency Multipliers**: Various upgrades that multiply earnings

### 3. Upgrade System
- **Coin Value**: Increases currency earned per successful flip
- **Coin Weighting**: Increases chance of landing on Heads
- **Edge Weighting**: Increases chance of landing on Edge
- **Auto-Flip**: Enables auto-flipper
- **Multiplier Upgrades**: Permanent multipliers for all earnings
- **Special Upgrades**: Unique effects unlocked with Achievement Points

### 4. Prestige System
- **Prestige Reset**: Reset all progress for permanent bonuses
- **Prestige Multipliers**: Permanent multipliers that stack across resets
- **Prestige Tokens**: Currency earned from prestige that can be spent on permanent upgrades
- **Prestige Milestones**: Special bonuses unlocked at certain prestige levels

## Technical Architecture

### 1. Core Systems
- **Game State Management**: Save/load functionality with auto-save
- **Currency Management**: Real-time currency generation and spending
- **Upgrade System**: Cost calculation, effect application, and progression tracking
- **Prestige System**: Reset logic and permanent bonus management
- **Achievement System**: Milestone tracking and reward distribution

### 2. UI Components
- **Coin Display**: Large, clickable coin with flip animation
- **Currency Counters**: Real-time display of all currencies
- **Upgrade Panels**: Organized upgrade categories with cost displays
- **Statistics Panel**: Detailed stats about flips, earnings, and achievements
- **Prestige Panel**: Prestige information and reset options
- **Achievement Panel**: Progress tracking and rewards

### 3. Data Structures
- **Game State**: All currencies, upgrades, and progress data
- **Upgrade Definitions**: Costs, effects, and requirements for each upgrade
- **Achievement Definitions**: Milestones and rewards
- **Prestige Data**: Permanent bonuses and multipliers

### 4. Game Loop
- **Click Handling**: Manual coin flip events
- **Auto-Flip Updates**: Automated coin flipping when enabled
- **Currency Updates**: Real-time currency generation
- **Save System**: Periodic auto-save functionality

## Visual Design

### Style Guidelines
- **Theme**: Clean, modern interface with coin-themed elements
- **Color Scheme**: Gold and silver tones with accent colors for different currencies
- **Layout**: Coin prominently displayed, UI panels organized around it
- **Animations**: Smooth coin flip animations with realistic physics

### Key Visual Elements
- **Animated Coin**: 3D-style coin with realistic flip animation
- **Currency Icons**: Distinct icons for each currency type
- **Upgrade Buttons**: Clear cost displays and effect descriptions
- **Progress Bars**: Visual indicators for achievement progress
- **Particle Effects**: Special effects for edge landings and milestones

## Implementation Phases

### Phase 1: Core Foundation
1. **Basic Coin Flipping**: Manual clicking with three outcomes
2. **Currency System**: Primary currency generation and display
3. **Basic Upgrades**: Flip Power upgrades
4. **Save/Load System**: Game state persistence

### Phase 2: Advanced Mechanics
1. **Auto-Flip System**: Automated coin flipping with energy management
2. **Secondary Currencies**: Luck Points and Achievement Points
3. **Upgrade Trees**: Multiple upgrade categories and progression
4. **Statistics Tracking**: Detailed stats and analytics

### Phase 3: Prestige & Progression
1. **Prestige System**: Reset mechanics with permanent bonuses
2. **Achievement System**: Milestones and special rewards
3. **Advanced Upgrades**: Special upgrades using secondary currencies
4. **Balance Optimization**: Fine-tuning of progression and costs

### Phase 4: Polish & Enhancement
1. **Visual Polish**: Enhanced animations and effects
2. **Sound Design**: Audio feedback for all interactions
3. **Mobile Optimization**: Responsive design for mobile devices
4. **Performance Optimization**: Smooth 60 FPS gameplay

## Game Balance

### Progression Curve
- **Early Game**: Focus on manual flipping and basic upgrades
- **Mid Game**: Introduction of auto-flip and secondary currencies
- **Late Game**: Prestige mechanics and advanced optimization
- **End Game**: Achievement hunting and perfect optimization

### Upgrade Scaling
- **Cost Progression**: Exponential scaling with diminishing returns
- **Effect Scaling**: Linear to exponential effect increases
- **Prestige Timing**: First prestige available around 1-2 hours of play
- **Achievement Balance**: Mix of easy, medium, and challenging milestones

### Currency Balance
- **Primary Currency**: Main progression driver
- **Prestige Tokens**: Long-term progression currency
- **Achievement Points**: Bonus currency for completionists

## Questions for Clarification

### Technical Decisions
1. **Technology Stack**: HTML5 Canvas + JavaScript for maximum control?
2. **Animation Style**: 2D sprites or 3D-style rendering?
3. **Target Platform**: Web browser, mobile, or both?
4. **Save System**: Local storage or cloud saves?

### Game Design Decisions
1. **Edge Landing Rate**: Should 0.5% be the final rate or adjustable?
2. **Prestige Timing**: When should first prestige become available?
3. **Upgrade Complexity**: How many upgrade categories should we have?
4. **Achievement Scope**: How many achievements should be included?

## Success Metrics
- **Player Engagement**: Average session length and daily active users
- **Progression**: Time to first prestige and upgrade completion rates
- **Retention**: Player return rates and long-term engagement
- **Satisfaction**: Player feedback and achievement completion rates

## Monetization Considerations (Future)
- **Cosmetic Upgrades**: Special coin skins and visual effects
- **Convenience Features**: Auto-save slots and quick prestige options
- **Premium Currencies**: Optional premium currency for faster progression
- **Ad Integration**: Optional rewarded ads for bonus currency

---

*This document will be updated as development progresses and new features are implemented.* 
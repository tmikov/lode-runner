# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based Lode Runner clone written in vanilla JavaScript (ES6 modules). A tile-based arcade/puzzle platformer where players collect gold, dig holes to trap enemies, and navigate ladders and ropes.

## Development Commands

```bash
# Start development server (runs on http://localhost:8000)
bun serve.ts
```

No build step, test suite, or linting setup. The project uses Bun.js only for the dev server.

## Architecture

### Entry Point
- `index.html` loads Kontra.js from CDN and `js/main.js` as the entry module
- `js/main.js` initializes the game loop using `requestAnimationFrame` with delta time capping

### Core Modules

| Module | Purpose |
|--------|---------|
| `game.js` | Game state machine (LOADING, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, VICTORY) |
| `player.js` | Player entity with state machine (IDLE, RUNNING, CLIMBING, BAR_TRAVERSE, FALLING, DIGGING, DEAD) |
| `enemy.js` | Enemy AI with states (CHASING, CLIMBING, BAR_TRAVERSE, FALLING, TRAPPED, EMERGING, RESPAWNING) |
| `pathfinding.js` | A* pathfinding for enemy chase behavior |
| `level.js` | Level loading from ASCII strings, tile management, hole mechanics |
| `tiles.js` | Tile type definitions and collision properties |
| `renderer.js` | Canvas 2D rendering with sprite caching |
| `sprites.js` | Pixel art sprite definitions and color palette |
| `audio.js` | Web Audio API sound effects |
| `input.js` | Keyboard input handling |
| `config.js` | Game constants (speeds, timing, scoring, key bindings) |

### World Structure
- 28x16 tile grid at 2x scale (896x512 pixels)
- Tile types: EMPTY, BRICK, SOLID, LADDER, ROPE, GOLD, HIDDEN_LADDER, EXIT, DUG_HOLE

### Levels
- Located in `levels/` directory
- Defined as ASCII art strings parsed at load time
- Character mapping: `.`=empty, `#`=brick, `@`=solid, `H`=ladder, `-`=rope, `$`=gold, `P`=player start, `E`=enemy start

## Key Configuration (config.js)

- Player: 4 tiles/sec horizontal, 3 tiles/sec climb, 8 tiles/sec fall
- Enemy: 3 tiles/sec horizontal, 2.5 tiles/sec climb, 8 tiles/sec fall
- Enemy path recalculation: every 0.2 seconds
- Controls: Arrow keys or WASD

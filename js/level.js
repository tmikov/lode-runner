// Level loading and management

import { CONFIG, TILE_TYPES } from './config.js';
import { DugHole, isClimbable } from './tiles.js';

export class Level {
    constructor(levelData) {
        this.width = levelData.width || CONFIG.LEVEL_WIDTH;
        this.height = levelData.height || CONFIG.LEVEL_HEIGHT;
        this.tiles = [...levelData.tiles]; // Copy tile array
        this.originalTiles = [...levelData.tiles]; // Keep original for reset
        this.playerStart = { ...levelData.playerStart };
        this.enemyStarts = levelData.enemyStarts.map(e => ({ ...e }));
        this.goldCount = levelData.goldCount;
        this.collectedGold = 0;
        this.dugHoles = new Map(); // key: "x,y", value: DugHole
        this.occupiedHoles = new Set(); // holes with enemies in them
        this.laddersRevealed = false;
        this.revealedTraps = new Set(); // Track revealed trap doors
        console.log(`Level loaded: ${this.width}x${this.height}, ${this.goldCount} gold pieces`);
    }

    // Get tile at position
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            // Out of bounds - treat as solid except top (for exit)
            if (y < 0) return TILE_TYPES.EXIT;
            return TILE_TYPES.SOLID;
        }
        const index = y * this.width + x;
        return this.tiles[index];
    }

    // Set tile at position
    setTile(x, y, tileType) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        const index = y * this.width + x;
        this.tiles[index] = tileType;
    }

    // Get the original tile (before any digging)
    getOriginalTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TILE_TYPES.SOLID;
        }
        const index = y * this.width + x;
        return this.originalTiles[index];
    }

    // Convert pixel position to tile position
    pixelToTile(px, py) {
        return {
            x: Math.floor(px / CONFIG.DISPLAY_TILE_SIZE),
            y: Math.floor(py / CONFIG.DISPLAY_TILE_SIZE)
        };
    }

    // Convert tile position to pixel position (center of tile)
    tileToPixel(tx, ty) {
        return {
            x: tx * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2,
            y: ty * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2
        };
    }

    // Dig a hole at position
    digHole(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_TYPES.BRICK) {
            this.setTile(x, y, TILE_TYPES.DUG_HOLE);
            const key = `${x},${y}`;
            this.dugHoles.set(key, new DugHole(x, y));
            return true;
        }
        return false;
    }

    // Update dug holes (regeneration)
    updateHoles(dt) {
        const regenerated = [];

        for (const [key, hole] of this.dugHoles) {
            if (hole.update(dt)) {
                // Hole regenerated
                this.setTile(hole.x, hole.y, TILE_TYPES.BRICK);
                regenerated.push({ x: hole.x, y: hole.y });
                this.dugHoles.delete(key);
            }
        }

        return regenerated; // Return list of regenerated positions for crush detection
    }

    // Check if a hole is regenerating at position
    isHoleRegenerating(x, y) {
        const key = `${x},${y}`;
        const hole = this.dugHoles.get(key);
        return hole && hole.regenerating;
    }

    // Get hole at position (if exists)
    getHole(x, y) {
        const key = `${x},${y}`;
        return this.dugHoles.get(key);
    }

    // Collect gold at position
    collectGold(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_TYPES.GOLD) {
            this.setTile(x, y, TILE_TYPES.EMPTY);
            this.collectedGold++;
            console.log(`Gold collected: ${this.collectedGold}/${this.goldCount}`);

            // Check if all gold collected
            if (this.collectedGold >= this.goldCount) {
                this.revealLadders();
            }

            return true;
        }
        return false;
    }

    // Reveal hidden ladders
    revealLadders() {
        this.laddersRevealed = true;
        console.log('Hidden ladders revealed!');
        // Update hidden ladder tiles to be climbable
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i] === TILE_TYPES.HIDDEN_LADDER) {
                // Keep as hidden ladder but it will now be treated as climbable
            }
        }
    }

    // Check if position is at the exit (top of level)
    isAtExit(x, y) {
        return y < 0 && this.laddersRevealed;
    }

    // Check if all gold is collected
    isAllGoldCollected() {
        return this.collectedGold >= this.goldCount;
    }

    // Reset level to initial state
    reset() {
        this.tiles = [...this.originalTiles];
        this.collectedGold = 0;
        this.dugHoles.clear();
        this.occupiedHoles.clear();
        this.laddersRevealed = false;
        this.revealedTraps.clear();
    }

    // Reveal a trap door at position
    revealTrap(x, y) {
        this.revealedTraps.add(`${x},${y}`);
    }

    // Check if a trap door has been revealed
    isTrapRevealed(x, y) {
        return this.revealedTraps.has(`${x},${y}`);
    }

    // Clear all tiles to empty (for editor)
    clearAll() {
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = TILE_TYPES.EMPTY;
        }
        this.dugHoles.clear();
        this.occupiedHoles.clear();
        this.revealedTraps.clear();
        this.collectedGold = 0;
        this.goldCount = 0;
        this.laddersRevealed = false;
    }

    // Recalculate gold count (for editor)
    recalculateGoldCount() {
        let count = 0;
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i] === TILE_TYPES.GOLD) {
                count++;
            }
        }
        this.goldCount = count;
        return count;
    }

    // Export level to JSON format (for editor)
    exportToJSON() {
        return {
            width: this.width,
            height: this.height,
            tiles: [...this.tiles],
            playerStart: { ...this.playerStart },
            enemyStarts: this.enemyStarts.map(e => ({ ...e })),
            goldCount: this.recalculateGoldCount()
        };
    }

    // Mark a hole as occupied by an enemy
    occupyHole(x, y) {
        this.occupiedHoles.add(`${x},${y}`);
    }

    // Unmark a hole as occupied
    vacateHole(x, y) {
        this.occupiedHoles.delete(`${x},${y}`);
    }

    // Check if a hole is occupied (has enemy in it)
    isHoleOccupied(x, y) {
        return this.occupiedHoles.has(`${x},${y}`);
    }

    // Check if a dug hole is "filled" (occupied) and thus walkable
    isFilledHole(x, y) {
        const tile = this.getTile(x, y);
        return tile === TILE_TYPES.DUG_HOLE && this.isHoleOccupied(x, y);
    }

    // Check if a tile provides solid ground support (solid tile OR filled hole)
    isSolidAt(x, y) {
        const tile = this.getTile(x, y);
        if (tile === TILE_TYPES.BRICK || tile === TILE_TYPES.SOLID) {
            return true;
        }
        return this.isFilledHole(x, y);
    }

    // Check if a position provides support (can stand on)
    hasSupport(x, y) {
        const tileBelow = this.getTile(x, y + 1);
        const currentTile = this.getTile(x, y);

        // Standing on solid tile
        if (tileBelow === TILE_TYPES.BRICK || tileBelow === TILE_TYPES.SOLID) {
            return true;
        }

        // On a ladder
        if (isClimbable(currentTile, this.laddersRevealed)) {
            return true;
        }

        // Standing on top of a ladder
        if (isClimbable(tileBelow, this.laddersRevealed)) {
            return true;
        }

        return false;
    }

    // Check if entity can move to a position
    canMoveTo(x, y, fromX, fromY) {
        const tile = this.getTile(x, y);

        // Can't move into solid tiles
        if (tile === TILE_TYPES.BRICK || tile === TILE_TYPES.SOLID) {
            return false;
        }

        return true;
    }
}

// Parse a level from an array of line strings
export function parseLevelFromLines(lines, levelMeta = {}) {
    const height = lines.length;
    const width = lines[0].length;

    const tiles = [];
    const enemyStarts = [];
    let playerStart = { x: 0, y: 0 };
    let goldCount = 0;

    // Character mapping supports both original Apple II format and current format
    const charToTile = {
        ' ': TILE_TYPES.EMPTY,      // Original format: space = empty
        '.': TILE_TYPES.EMPTY,      // Current format: dot = empty
        '#': TILE_TYPES.BRICK,      // Both: # = brick
        '@': TILE_TYPES.SOLID,      // Original format: @ = solid
        '=': TILE_TYPES.SOLID,      // Current format: = = solid
        'H': TILE_TYPES.LADDER,     // Both: H = ladder
        '-': TILE_TYPES.ROPE,       // Both: - = rope
        '$': TILE_TYPES.GOLD,       // Original format: $ = gold
        'G': TILE_TYPES.GOLD,       // Current format: G = gold
        'S': TILE_TYPES.HIDDEN_LADDER, // Original format: S = hidden ladder
        'h': TILE_TYPES.HIDDEN_LADDER, // Current format: h = hidden ladder
        'X': TILE_TYPES.TRAP_DOOR,  // Original format: X = trap door
        '^': TILE_TYPES.EXIT,       // Both: ^ = exit
    };

    for (let y = 0; y < height; y++) {
        const line = lines[y];
        for (let x = 0; x < width; x++) {
            const char = line[x] || ' ';

            // Handle player spawn (both formats)
            if (char === 'P' || char === '&') {
                playerStart = { x, y };
                tiles.push(TILE_TYPES.EMPTY);
            }
            // Handle enemy spawn (both formats)
            else if (char === 'E' || char === '0') {
                enemyStarts.push({ x, y });
                tiles.push(TILE_TYPES.EMPTY);
            }
            // Handle gold (both formats)
            else if (char === 'G' || char === '$') {
                goldCount++;
                tiles.push(TILE_TYPES.GOLD);
            }
            // Handle trap door
            else if (char === 'X') {
                tiles.push(TILE_TYPES.TRAP_DOOR);
            }
            else {
                tiles.push(charToTile[char] !== undefined ? charToTile[char] : TILE_TYPES.EMPTY);
            }
        }
    }

    return {
        width,
        height,
        tiles,
        playerStart,
        enemyStarts,
        goldCount,
        ...levelMeta
    };
}

// Parse a level from string format (for backwards compatibility)
export function parseLevelString(levelString, levelMeta = {}) {
    const lines = levelString.trim().split('\n');
    return parseLevelFromLines(lines, levelMeta);
}

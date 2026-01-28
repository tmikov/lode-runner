// Game configuration constants

export const CONFIG = {
    // Tile dimensions
    TILE_SIZE: 16,           // Base tile size in pixels
    SCALE: 2,                // Display scale factor
    DISPLAY_TILE_SIZE: 32,   // TILE_SIZE * SCALE

    // Level dimensions
    LEVEL_WIDTH: 28,         // Tiles wide
    LEVEL_HEIGHT: 16,        // Tiles tall

    // Canvas dimensions (calculated)
    CANVAS_WIDTH: 28 * 32,   // 896 pixels
    CANVAS_HEIGHT: 16 * 32,  // 512 pixels

    // Frame rate
    FPS: 60,
    FRAME_TIME: 1000 / 60,   // ~16.67ms

    // Movement speeds (tiles per second)
    PLAYER_SPEED: 4,
    PLAYER_CLIMB_SPEED: 3,
    PLAYER_FALL_SPEED: 8,
    ENEMY_SPEED: 3,
    ENEMY_CLIMB_SPEED: 2.5,
    ENEMY_FALL_SPEED: 8,

    // Timing (in seconds)
    DIG_DURATION: 0.3,
    HOLE_DURATION: 5.0,
    HOLE_REGEN_TIME: 0.5,
    ENEMY_TRAP_TIME: 3.0,
    ENEMY_RESPAWN_DELAY: 4.0,
    PLAYER_RESPAWN_DELAY: 1.5,
    PLAYER_INVINCIBILITY: 2.0,

    // Animation frame durations (in seconds)
    ANIM_FRAME_TIME: 0.1,
    GOLD_SPARKLE_TIME: 0.2,

    // Pathfinding
    PATH_UPDATE_INTERVAL: 0.2,  // Seconds between path recalculation

    // Scoring
    SCORE_GOLD: 100,
    SCORE_ENEMY_KILL: 500,
    SCORE_LEVEL_COMPLETE: 1000,

    // Starting values
    STARTING_LIVES: 3
};

// Tile type constants
export const TILE_TYPES = {
    EMPTY: 0,
    BRICK: 1,
    SOLID: 2,
    LADDER: 3,
    ROPE: 4,
    GOLD: 5,
    HIDDEN_LADDER: 6,
    EXIT: 7,
    DUG_HOLE: 8      // Temporary state for dug brick
};

// Player state constants
export const PLAYER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    CLIMBING: 'climbing',
    BAR_TRAVERSE: 'bar_traverse',
    FALLING: 'falling',
    DIGGING: 'digging',
    DEAD: 'dead'
};

// Enemy state constants
export const ENEMY_STATES = {
    CHASING: 'chasing',
    CLIMBING: 'climbing',
    BAR_TRAVERSE: 'bar_traverse',
    FALLING: 'falling',
    TRAPPED: 'trapped',
    EMERGING: 'emerging',
    RESPAWNING: 'respawning'
};

// Game state constants
export const GAME_STATES = {
    MENU: 'menu',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    EDITOR: 'editor',
    PLAYTESTING: 'playtesting'
};

// Editor configuration
export const EDITOR_CONFIG = {
    // Autosave interval in seconds
    AUTOSAVE_INTERVAL: 30,
    // Maximum undo history size
    MAX_HISTORY: 50,
    // Maximum tiles for flood fill
    MAX_FLOOD_FILL: 200,
    // Grid line color
    GRID_COLOR: 'rgba(255, 255, 255, 0.2)',
    // Hover highlight color
    HOVER_COLOR: 'rgba(255, 255, 255, 0.3)',
    // Selection color
    SELECTION_COLOR: 'rgba(100, 200, 255, 0.4)',
    // Player spawn marker color
    PLAYER_SPAWN_COLOR: '#00FF00',
    // Enemy spawn marker color
    ENEMY_SPAWN_COLOR: '#FF4444',
    // Storage key prefix
    STORAGE_PREFIX: 'loderunner_editor_',
    // Autosave storage key
    AUTOSAVE_KEY: 'loderunner_editor_autosave'
};

// Direction constants
export const DIRECTIONS = {
    NONE: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3,
    DOWN: 4
};

// Key codes
export const KEYS = {
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    DIG_LEFT: ['KeyZ', 'KeyQ'],
    DIG_RIGHT: ['KeyX', 'KeyE'],
    PAUSE: ['KeyP', 'Escape'],
    RESTART: ['KeyR']
};

// Editor tool types
export const EDITOR_TOOLS = {
    DRAW: 'draw',
    ERASE: 'erase',
    FILL: 'fill',
    RECTANGLE: 'rectangle',
    PLAYER_SPAWN: 'player_spawn',
    ENEMY_SPAWN: 'enemy_spawn'
};

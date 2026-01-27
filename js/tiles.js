// Tile definitions and behaviors

import { TILE_TYPES, CONFIG } from './config.js';

// Tile properties lookup
export const TILE_PROPERTIES = {
    [TILE_TYPES.EMPTY]: {
        solid: false,
        climbable: false,
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: true,
        sprite: 'empty'
    },
    [TILE_TYPES.BRICK]: {
        solid: true,
        climbable: false,
        hangable: false,
        diggable: true,
        collectible: false,
        fallThrough: false,
        sprite: 'brick'
    },
    [TILE_TYPES.SOLID]: {
        solid: true,
        climbable: false,
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: false,
        sprite: 'solid'
    },
    [TILE_TYPES.LADDER]: {
        solid: false,
        climbable: true,
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: false,
        sprite: 'ladder'
    },
    [TILE_TYPES.ROPE]: {
        solid: false,
        climbable: false,
        hangable: true,
        diggable: false,
        collectible: false,
        fallThrough: true,
        sprite: 'rope'
    },
    [TILE_TYPES.GOLD]: {
        solid: false,
        climbable: false,
        hangable: false,
        diggable: false,
        collectible: true,
        fallThrough: true,
        sprite: 'gold_1'
    },
    [TILE_TYPES.HIDDEN_LADDER]: {
        solid: false,
        climbable: false,  // Not climbable until revealed
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: true,
        sprite: 'empty',
        revealedSprite: 'ladder'
    },
    [TILE_TYPES.EXIT]: {
        solid: false,
        climbable: true,
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: true,
        sprite: 'ladder'  // Exit looks like a ladder
    },
    [TILE_TYPES.DUG_HOLE]: {
        solid: false,
        climbable: false,
        hangable: false,
        diggable: false,
        collectible: false,
        fallThrough: true,
        sprite: 'empty',
        temporary: true
    }
};

// Get tile properties
export function getTileProperties(tileType) {
    return TILE_PROPERTIES[tileType] || TILE_PROPERTIES[TILE_TYPES.EMPTY];
}

// Check if a tile is solid (blocks movement)
export function isSolid(tileType) {
    return getTileProperties(tileType).solid;
}

// Check if a tile is climbable
export function isClimbable(tileType, laddersRevealed = false) {
    if (tileType === TILE_TYPES.HIDDEN_LADDER && laddersRevealed) {
        return true;
    }
    return getTileProperties(tileType).climbable;
}

// Check if a tile is hangable (rope)
export function isHangable(tileType) {
    return getTileProperties(tileType).hangable;
}

// Check if a tile is diggable
export function isDiggable(tileType) {
    return getTileProperties(tileType).diggable;
}

// Check if a tile can be fallen through
export function canFallThrough(tileType) {
    return getTileProperties(tileType).fallThrough;
}

// Check if standing on this tile provides support
export function providesSupport(tileType) {
    return isSolid(tileType);
}

// Get the sprite name for a tile
export function getTileSprite(tileType, laddersRevealed = false) {
    const props = getTileProperties(tileType);
    if (tileType === TILE_TYPES.HIDDEN_LADDER && laddersRevealed) {
        return props.revealedSprite;
    }
    return props.sprite;
}

// Dug hole management
export class DugHole {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = CONFIG.HOLE_DURATION;
        this.regenerating = false;
        this.regenTimer = 0;
        this.animFrame = 0;
    }

    update(dt) {
        if (this.regenerating) {
            this.regenTimer -= dt;
            if (this.regenTimer <= 0) {
                return true; // Hole is fully regenerated
            }
        } else {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.regenerating = true;
                this.regenTimer = CONFIG.HOLE_REGEN_TIME;
            }
        }
        return false;
    }

    getAnimFrame() {
        if (this.regenerating) {
            // Regenerating animation (reverse crumble)
            const progress = 1 - (this.regenTimer / CONFIG.HOLE_REGEN_TIME);
            return Math.floor(progress * 3);
        }
        return 3; // Empty hole
    }
}

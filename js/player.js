// Player entity with state machine — pixel-based movement

import { CONFIG, PLAYER_STATES, TILE_TYPES, DIRECTIONS } from './config.js';
import { isClimbable, isHangable, isSolid, isDiggable } from './tiles.js';

const TILE = CONFIG.DISPLAY_TILE_SIZE;
const HALF_TILE = TILE / 2;

export class Player {
    constructor(level) {
        this.level = level;
        this.reset();
    }

    reset() {
        // Position (in pixels, center of player)
        this.x = this.level.playerStart.x * TILE + HALF_TILE;
        this.y = this.level.playerStart.y * TILE + HALF_TILE;

        // Tile position (derived from pixel pos, updated at end of each frame)
        this.tileX = this.level.playerStart.x;
        this.tileY = this.level.playerStart.y;

        // State
        this.state = PLAYER_STATES.IDLE;
        this.prevState = PLAYER_STATES.IDLE;

        // Direction facing (for sprite flipping)
        this.facingRight = true;

        // Animation
        this.animTime = 0;

        // Digging
        this.digTimer = 0;
        this.digDirection = 0;
        this.digTargetX = 0;
        this.digTargetY = 0;

        // Invincibility after respawn
        this.invincibleTimer = 0;

        // Death
        this.deathTimer = 0;

        // Buffered dig input
        this.pendingDigDirection = 0;
    }

    // --- Snap helpers ---

    snapXToTile(tileCol) {
        this.x = tileCol * TILE + HALF_TILE;
    }

    snapYToTile(tileRow) {
        this.y = tileRow * TILE + HALF_TILE;
    }

    // Align both axes to tile center
    alignToTile() {
        this.x = this.tileX * TILE + HALF_TILE;
        this.y = this.tileY * TILE + HALF_TILE;
    }

    // --- Collision resolution helpers ---

    // Resolve horizontal movement, clamping against solid tiles and world bounds.
    // tileRow is the perpendicular-axis tile (the row the player is snapped to).
    resolveHorizontalMovement(newX, direction, tileRow) {
        // Clamp to world bounds
        newX = Math.max(HALF_TILE, Math.min(newX, this.level.width * TILE - HALF_TILE));

        if (direction > 0) {
            // Moving right — check if right edge enters a solid column
            const rightEdge = newX + HALF_TILE - 1;
            const col = Math.floor(rightEdge / TILE);
            if (isSolid(this.level.getTile(col, tileRow))) {
                newX = col * TILE - HALF_TILE;
            }
        } else if (direction < 0) {
            // Moving left — check if left edge enters a solid column
            const leftEdge = newX - HALF_TILE;
            const col = Math.floor(leftEdge / TILE);
            if (isSolid(this.level.getTile(col, tileRow))) {
                newX = (col + 1) * TILE + HALF_TILE;
            }
        }

        return newX;
    }

    // Resolve vertical movement, clamping against solid tiles.
    // tileCol is the perpendicular-axis tile (the column the player is snapped to).
    resolveVerticalMovement(newY, direction, tileCol) {
        if (direction < 0) {
            // Moving up — check if top edge enters a solid row
            const topEdge = newY - HALF_TILE;
            const row = Math.floor(topEdge / TILE);
            if (isSolid(this.level.getTile(tileCol, row))) {
                newY = (row + 1) * TILE + HALF_TILE;
            }
        } else if (direction > 0) {
            // Moving down — check if bottom edge enters a solid row
            const bottomEdge = newY + HALF_TILE - 1;
            const row = Math.floor(bottomEdge / TILE);
            if (isSolid(this.level.getTile(tileCol, row))) {
                newY = row * TILE - HALF_TILE;
            }
        }

        return newY;
    }

    // --- Main update ---

    update(dt, inputMove, digDirection) {
        this.animTime += dt;

        // Buffer dig input when pressed
        if (digDirection !== 0) {
            this.pendingDigDirection = digDirection;
        }

        // Update invincibility
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
        }

        // State machine
        switch (this.state) {
            case PLAYER_STATES.IDLE:
                this.updateIdle(dt, inputMove, digDirection);
                break;
            case PLAYER_STATES.RUNNING:
                this.updateRunning(dt, inputMove, digDirection);
                break;
            case PLAYER_STATES.CLIMBING:
                this.updateClimbing(dt, inputMove);
                break;
            case PLAYER_STATES.BAR_TRAVERSE:
                this.updateBarTraverse(dt, inputMove);
                break;
            case PLAYER_STATES.FALLING:
                this.updateFalling(dt);
                break;
            case PLAYER_STATES.DIGGING:
                this.updateDigging(dt);
                break;
            case PLAYER_STATES.DEAD:
                this.updateDead(dt);
                break;
        }

        // Update tile position from pixel position
        this.tileX = Math.floor(this.x / TILE);
        this.tileY = Math.floor(this.y / TILE);

        // Reveal trap door if player passes through it
        const currentTile = this.level.getTile(this.tileX, this.tileY);
        if (currentTile === TILE_TYPES.TRAP_DOOR) {
            this.level.revealTrap(this.tileX, this.tileY);
        }
    }

    // --- State updates ---

    updateIdle(dt, inputMove, digDirection) {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);
        const currentTile = this.level.getTile(tx, ty);
        const tileBelow = this.level.getTile(tx, ty + 1);

        // Trailing-edge fall check: use last facing direction so the player
        // doesn't fall until the entire sprite clears the ledge.
        const trailingEdge = this.facingRight ? this.x - HALF_TILE : this.x + HALF_TILE - 1;
        const trailingTx = Math.floor(trailingEdge / TILE);
        if (!this.hasSupportAt(trailingTx, ty)) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Check for digging (use buffered input)
        if (this.pendingDigDirection !== 0) {
            this.tryDig(this.pendingDigDirection);
            this.pendingDigDirection = 0;
            if (this.state === PLAYER_STATES.DIGGING) {
                return;
            }
        }

        // Check for climbing (vertical input on climbable tile)
        if (inputMove.dy !== 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.snapXToTile(tx);
            this.updateClimbing(dt, inputMove);
            return;
        }

        // Check for descending onto a ladder below
        if (inputMove.dy > 0 && isClimbable(tileBelow, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.snapXToTile(tx);
            this.updateClimbing(dt, inputMove);
            return;
        }

        // Check for dropping from rope
        if (inputMove.dy > 0 && isHangable(currentTile)) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Check for horizontal movement
        if (inputMove.dx !== 0) {
            this.facingRight = inputMove.dx > 0;

            // Check if on rope
            if (isHangable(currentTile)) {
                this.setState(PLAYER_STATES.BAR_TRAVERSE);
                this.updateBarTraverse(dt, inputMove);
                return;
            }

            // Transition to running and apply movement this frame
            this.setState(PLAYER_STATES.RUNNING);
            this.updateRunning(dt, inputMove, digDirection);
        }
    }

    updateRunning(dt, inputMove, digDirection) {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);

        // Snap Y to tile row (keep player aligned vertically while running)
        this.snapYToTile(ty);

        const currentTile = this.level.getTile(tx, ty);

        // Check for gold collection
        this.checkGoldCollection();

        // Check for digging (use buffered input)
        if (this.pendingDigDirection !== 0) {
            this.tryDig(this.pendingDigDirection);
            this.pendingDigDirection = 0;
            if (this.state === PLAYER_STATES.DIGGING) {
                return;
            }
        }

        // Check for climbing
        if (inputMove.dy !== 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.snapXToTile(tx);
            return;
        }

        // Check for descending onto a ladder below
        const tileBelow = this.level.getTile(tx, ty + 1);
        if (inputMove.dy > 0 && isClimbable(tileBelow, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.snapXToTile(tx);
            return;
        }

        // Check if on rope
        if (isHangable(currentTile)) {
            this.setState(PLAYER_STATES.BAR_TRAVERSE);
            return;
        }

        // Horizontal movement and support check
        const dx = inputMove.dx;
        if (dx !== 0) {
            this.facingRight = dx > 0;
        }

        // Trailing-edge support check: fall only when entire sprite clears support.
        // Use facingRight (current or last movement direction) to find the trailing edge.
        const trailingEdge = this.facingRight ? this.x - HALF_TILE : this.x + HALF_TILE - 1;
        const trailingTx = Math.floor(trailingEdge / TILE);
        if (!this.hasSupportAt(trailingTx, ty)) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        if (dx === 0) {
            // No input — stop
            this.setState(PLAYER_STATES.IDLE);
            return;
        }

        // Apply horizontal movement
        const newX = this.x + dx * CONFIG.PLAYER_SPEED * TILE * dt;
        this.x = this.resolveHorizontalMovement(newX, dx, ty);
    }

    updateClimbing(dt, inputMove) {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);
        const currentTile = this.level.getTile(tx, ty);

        // Snap X to ladder column
        this.snapXToTile(tx);

        // Check for exit (climbing off top of level)
        if (ty < 0 && this.level.laddersRevealed) {
            return;
        }

        // Check for gold collection
        this.checkGoldCollection();

        // If no longer on a climbable tile, handle transition
        const lr = this.level.laddersRevealed;
        if (!isClimbable(currentTile, lr)) {
            const tileBelow = this.level.getTile(tx, ty + 1);
            const ladderBelow = isClimbable(tileBelow, lr);

            if (ladderBelow) {
                // At the top of a ladder — either climbing off or descending onto it
                const tileCenterY = ty * TILE + HALF_TILE;

                if (this.y > tileCenterY) {
                    if (inputMove.dy > 0) {
                        // Descending onto ladder — continue down
                        this.y += CONFIG.PLAYER_CLIMB_SPEED * TILE * dt;
                        return;
                    }
                    // Climbing off top (going up) — auto-finish to tile center
                    const newY = this.y - CONFIG.PLAYER_CLIMB_SPEED * TILE * dt;
                    this.y = Math.max(newY, tileCenterY);
                    if (this.y <= tileCenterY) {
                        this.y = tileCenterY;
                        this.setState(PLAYER_STATES.IDLE);
                    }
                    return;
                }

                // At or above tile center — allow descent or dismount
                if (inputMove.dy > 0) {
                    // Descend onto ladder
                    this.y += CONFIG.PLAYER_CLIMB_SPEED * TILE * dt;
                    return;
                }
                if (inputMove.dx !== 0) {
                    const adjacentTile = this.level.getTile(tx + inputMove.dx, ty);
                    if (!isSolid(adjacentTile)) {
                        this.facingRight = inputMove.dx > 0;
                        this.snapYToTile(ty);
                        this.setState(PLAYER_STATES.RUNNING);
                        this.updateRunning(dt, inputMove, 0);
                        return;
                    }
                }

                // No relevant input — stop climbing
                this.setState(PLAYER_STATES.IDLE);
                return;
            }

            // Fully off ladder, no ladder below
            if (isHangable(currentTile)) {
                this.setState(PLAYER_STATES.BAR_TRAVERSE);
            } else if (this.hasSupport()) {
                this.setState(PLAYER_STATES.IDLE);
            } else {
                this.setState(PLAYER_STATES.FALLING);
            }
            return;
        }

        // Horizontal dismount (only if target tile isn't solid)
        if (inputMove.dx !== 0) {
            const adjacentTile = this.level.getTile(tx + inputMove.dx, ty);
            if (!isSolid(adjacentTile)) {
                this.facingRight = inputMove.dx > 0;
                this.snapYToTile(ty);
                this.setState(PLAYER_STATES.RUNNING);
                this.updateRunning(dt, inputMove, 0);
                return;
            }
        }

        // Vertical movement — allow into any non-solid tile; next frame's
        // climbability check at the top handles transitioning out
        if (inputMove.dy !== 0) {
            const newY = this.y + inputMove.dy * CONFIG.PLAYER_CLIMB_SPEED * TILE * dt;
            const resolvedY = this.resolveVerticalMovement(newY, inputMove.dy, tx);
            const newTy = Math.floor(resolvedY / TILE);
            const newTile = this.level.getTile(tx, newTy);

            if (newTy < 0) {
                // Allow climbing off top for exit
                this.y = resolvedY;
            } else if (!isSolid(newTile)) {
                this.y = resolvedY;
            }
            // If solid, don't move (stay put)
        }
    }

    updateBarTraverse(dt, inputMove) {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);
        const currentTile = this.level.getTile(tx, ty);

        // Snap Y to rope row
        this.snapYToTile(ty);

        // Check for gold collection
        this.checkGoldCollection();

        // Check if still on rope
        if (!isHangable(currentTile)) {
            if (isClimbable(currentTile, this.level.laddersRevealed)) {
                this.setState(PLAYER_STATES.CLIMBING);
            } else if (this.hasSupport()) {
                this.setState(PLAYER_STATES.IDLE);
            } else {
                this.setState(PLAYER_STATES.FALLING);
            }
            return;
        }

        // Going down releases from bar
        if (inputMove.dy > 0) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Climb up if there's a ladder
        if (inputMove.dy < 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.snapXToTile(tx);
            return;
        }

        // Horizontal movement on bar
        if (inputMove.dx !== 0) {
            this.facingRight = inputMove.dx > 0;
            const newX = this.x + inputMove.dx * CONFIG.PLAYER_SPEED * TILE * dt;
            this.x = this.resolveHorizontalMovement(newX, inputMove.dx, ty);
        }
        // No input: stay on bar (no transition to IDLE)
    }

    updateFalling(dt) {
        const fallSpeed = CONFIG.PLAYER_FALL_SPEED * TILE * dt;
        this.y += fallSpeed;

        // Use locally computed tile positions
        const tx = Math.floor(this.x / TILE);
        const newTileY = Math.floor(this.y / TILE);
        const prevTileY = this.tileY;

        const currentTile = this.level.getTile(tx, newTileY);

        // Catch on ladder
        if (isClimbable(currentTile, this.level.laddersRevealed)) {
            this.tileX = tx;
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(PLAYER_STATES.CLIMBING);
            this.checkGoldCollection();
            return;
        }

        // Catch on rope (only if we've fallen to a new tile row)
        if (isHangable(currentTile) && newTileY > prevTileY) {
            this.tileX = tx;
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(PLAYER_STATES.BAR_TRAVERSE);
            this.checkGoldCollection();
            return;
        }

        // Land on solid ground (includes filled holes)
        if (this.level.isSolidAt(tx, newTileY + 1)) {
            this.tileX = tx;
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(PLAYER_STATES.IDLE);
            this.checkGoldCollection();
            return;
        }

        // Continue falling
        this.tileY = newTileY;
    }

    updateDigging(dt) {
        this.digTimer -= dt;

        if (this.digTimer <= 0) {
            this.level.digHole(this.digTargetX, this.digTargetY);
            this.setState(PLAYER_STATES.IDLE);
        }
    }

    updateDead(dt) {
        this.deathTimer += dt;
    }

    // --- State transition ---

    setState(newState) {
        this.prevState = this.state;
        this.state = newState;
        this.animTime = 0;
    }

    // --- Support / collision helpers ---

    hasSupportAt(tx, ty) {
        const currentTile = this.level.getTile(tx, ty);

        // On solid ground (includes filled holes)
        if (this.level.isSolidAt(tx, ty + 1)) return true;

        // On ladder
        if (isClimbable(currentTile, this.level.laddersRevealed)) return true;

        // Standing on top of a ladder below
        const tileBelow = this.level.getTile(tx, ty + 1);
        if (isClimbable(tileBelow, this.level.laddersRevealed)) return true;

        // On rope
        if (isHangable(currentTile)) return true;

        return false;
    }

    hasSupport() {
        return this.hasSupportAt(Math.floor(this.x / TILE), Math.floor(this.y / TILE));
    }

    // --- Actions ---

    tryDig(direction) {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);
        const digX = tx + direction;
        const digY = ty + 1;
        const digTile = this.level.getTile(digX, digY);

        if (isDiggable(digTile)) {
            this.setState(PLAYER_STATES.DIGGING);
            this.digTimer = CONFIG.DIG_DURATION;
            this.digDirection = direction;
            this.digTargetX = digX;
            this.digTargetY = digY;
            this.facingRight = direction > 0;
        }
    }

    checkGoldCollection() {
        const tx = Math.floor(this.x / TILE);
        const ty = Math.floor(this.y / TILE);
        return this.level.collectGold(tx, ty);
    }

    // --- Lifecycle ---

    die() {
        if (this.invincibleTimer > 0) return false;
        if (this.state === PLAYER_STATES.DEAD) return false;

        this.setState(PLAYER_STATES.DEAD);
        this.deathTimer = 0;
        return true;
    }

    respawn() {
        this.reset();
        this.invincibleTimer = CONFIG.PLAYER_INVINCIBILITY;
    }

    // --- Rendering ---

    getSpriteInfo() {
        let spriteName = 'player_idle';
        let flipX = !this.facingRight;

        switch (this.state) {
            case PLAYER_STATES.IDLE:
                spriteName = 'player_idle';
                break;
            case PLAYER_STATES.RUNNING:
                spriteName = 'player_run_1';
                break;
            case PLAYER_STATES.CLIMBING:
                spriteName = 'player_climb_1';
                break;
            case PLAYER_STATES.BAR_TRAVERSE:
                spriteName = 'player_bar_1';
                break;
            case PLAYER_STATES.FALLING:
                spriteName = 'player_fall';
                break;
            case PLAYER_STATES.DIGGING:
                spriteName = 'player_dig_1';
                break;
            case PLAYER_STATES.DEAD:
                spriteName = 'player_dead_1';
                break;
        }

        return { spriteName, flipX };
    }

    getAnimationName() {
        switch (this.state) {
            case PLAYER_STATES.RUNNING:
                return 'player_run';
            case PLAYER_STATES.CLIMBING:
                return 'player_climb';
            case PLAYER_STATES.BAR_TRAVERSE:
                return 'player_bar';
            case PLAYER_STATES.DIGGING:
                return 'player_dig';
            case PLAYER_STATES.DEAD:
                return 'player_death';
            default:
                return null;
        }
    }

    isFlashing() {
        if (this.invincibleTimer <= 0) return false;
        return Math.floor(this.invincibleTimer * 10) % 2 === 0;
    }

    getRenderPos() {
        return {
            x: this.x - HALF_TILE,
            y: this.y - HALF_TILE
        };
    }
}

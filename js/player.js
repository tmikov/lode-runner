// Player entity with state machine

import { CONFIG, PLAYER_STATES, TILE_TYPES, DIRECTIONS } from './config.js';
import { isClimbable, isHangable, isSolid, isDiggable } from './tiles.js';

export class Player {
    constructor(level) {
        this.level = level;
        this.reset();
    }

    reset() {
        // Position (in pixels, center of player)
        this.x = this.level.playerStart.x * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        this.y = this.level.playerStart.y * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;

        // Tile position (for collision)
        this.tileX = this.level.playerStart.x;
        this.tileY = this.level.playerStart.y;

        // Target tile for movement
        this.targetX = this.tileX;
        this.targetY = this.tileY;

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

        // Movement interpolation
        this.moving = false;
        this.moveProgress = 0;
        this.moveStartX = 0;
        this.moveStartY = 0;
    }

    // Get current tile position
    getTilePos() {
        return {
            x: Math.floor(this.x / CONFIG.DISPLAY_TILE_SIZE),
            y: Math.floor(this.y / CONFIG.DISPLAY_TILE_SIZE)
        };
    }

    // Align to tile center
    alignToTile() {
        this.x = this.tileX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        this.y = this.tileY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
    }

    // Check if at tile center (for state transitions)
    isAtTileCenter() {
        const centerX = this.tileX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        const centerY = this.tileY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        const threshold = 2;
        return Math.abs(this.x - centerX) < threshold && Math.abs(this.y - centerY) < threshold;
    }

    // Update position based on input
    update(dt, inputMove, digDirection) {
        this.animTime += dt;

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

        // Update tile position
        this.tileX = Math.floor(this.x / CONFIG.DISPLAY_TILE_SIZE);
        this.tileY = Math.floor(this.y / CONFIG.DISPLAY_TILE_SIZE);
    }

    updateIdle(dt, inputMove, digDirection) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);
        const tileBelow = this.level.getTile(this.tileX, this.tileY + 1);

        // Check for falling
        if (!this.hasSupport()) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Check for digging
        if (digDirection !== 0) {
            this.tryDig(digDirection);
            return;
        }

        // Check for climbing
        if (inputMove.dy !== 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            this.updateClimbing(dt, inputMove);
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

            // Try to move horizontally
            if (this.tryMoveHorizontal(inputMove.dx)) {
                this.setState(PLAYER_STATES.RUNNING);
            }
        }
    }

    updateRunning(dt, inputMove, digDirection) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        // If moving, continue movement
        if (this.moving) {
            this.continueMovement(dt, CONFIG.PLAYER_SPEED);
            return;
        }

        // Arrived at target tile
        this.alignToTile();

        // Check for falling
        if (!this.hasSupport()) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Check for gold collection
        this.checkGoldCollection();

        // Check for digging
        if (digDirection !== 0) {
            this.tryDig(digDirection);
            return;
        }

        // Check for climbing
        if (inputMove.dy !== 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
            return;
        }

        // Continue running or stop
        if (inputMove.dx !== 0) {
            this.facingRight = inputMove.dx > 0;

            // Check if on rope
            if (isHangable(currentTile)) {
                this.setState(PLAYER_STATES.BAR_TRAVERSE);
                return;
            }

            if (!this.tryMoveHorizontal(inputMove.dx)) {
                this.setState(PLAYER_STATES.IDLE);
            }
        } else {
            this.setState(PLAYER_STATES.IDLE);
        }
    }

    updateClimbing(dt, inputMove) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        // If moving, continue movement
        if (this.moving) {
            this.continueMovement(dt, CONFIG.PLAYER_CLIMB_SPEED);
            return;
        }

        // Arrived at target tile
        this.alignToTile();

        // Check for exit
        if (this.tileY < 0 && this.level.laddersRevealed) {
            // Level complete handled in game.js
            return;
        }

        // Check for gold collection
        this.checkGoldCollection();

        // Check if still on ladder
        if (!isClimbable(currentTile, this.level.laddersRevealed)) {
            // Left the ladder
            if (this.hasSupport()) {
                this.setState(PLAYER_STATES.IDLE);
            } else {
                this.setState(PLAYER_STATES.FALLING);
            }
            return;
        }

        // Check for rope
        if (isHangable(currentTile)) {
            this.setState(PLAYER_STATES.BAR_TRAVERSE);
            return;
        }

        // Vertical movement
        if (inputMove.dy !== 0) {
            const targetY = this.tileY + inputMove.dy;
            const targetTile = this.level.getTile(this.tileX, targetY);

            // Can climb up onto ladder or into empty space (exiting)
            if (inputMove.dy < 0) {
                // Going up
                if (!isSolid(targetTile) || isClimbable(targetTile, this.level.laddersRevealed)) {
                    this.startMovement(this.tileX, targetY);
                }
            } else {
                // Going down
                if (isClimbable(targetTile, this.level.laddersRevealed) ||
                    (isClimbable(currentTile, this.level.laddersRevealed) && !isSolid(targetTile))) {
                    this.startMovement(this.tileX, targetY);
                }
            }
        }

        // Horizontal movement (can leave ladder)
        if (inputMove.dx !== 0 && !this.moving) {
            this.facingRight = inputMove.dx > 0;
            if (this.tryMoveHorizontal(inputMove.dx)) {
                // Will transition to appropriate state after movement
            }
        }

        // No movement
        if (inputMove.dx === 0 && inputMove.dy === 0 && !this.moving) {
            // Stay climbing idle
        }
    }

    updateBarTraverse(dt, inputMove) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        // If moving, continue movement
        if (this.moving) {
            this.continueMovement(dt, CONFIG.PLAYER_SPEED);
            return;
        }

        // Arrived at target tile
        this.alignToTile();

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

        // Horizontal movement on bar
        if (inputMove.dx !== 0) {
            this.facingRight = inputMove.dx > 0;
            if (!this.tryMoveHorizontal(inputMove.dx)) {
                // Can't move, stay on bar
            }
        }

        // Going down releases from bar
        if (inputMove.dy > 0) {
            this.setState(PLAYER_STATES.FALLING);
            return;
        }

        // Can climb up if there's a ladder
        if (inputMove.dy < 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
            this.setState(PLAYER_STATES.CLIMBING);
        }
    }

    updateFalling(dt) {
        // Move down
        const fallSpeed = CONFIG.PLAYER_FALL_SPEED * CONFIG.DISPLAY_TILE_SIZE * dt;
        this.y += fallSpeed;

        // Update tile position
        const newTileY = Math.floor(this.y / CONFIG.DISPLAY_TILE_SIZE);

        // Check if we've landed
        const currentTile = this.level.getTile(this.tileX, newTileY);
        const tileBelow = this.level.getTile(this.tileX, newTileY + 1);

        // Catch on ladder
        if (isClimbable(currentTile, this.level.laddersRevealed)) {
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(PLAYER_STATES.CLIMBING);
            this.checkGoldCollection();
            return;
        }

        // Catch on rope
        if (isHangable(currentTile)) {
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(PLAYER_STATES.BAR_TRAVERSE);
            this.checkGoldCollection();
            return;
        }

        // Land on solid ground
        if (isSolid(tileBelow)) {
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
            // Complete dig
            this.level.digHole(this.digTargetX, this.digTargetY);
            this.setState(PLAYER_STATES.IDLE);
        }
    }

    updateDead(dt) {
        this.deathTimer += dt;
    }

    // State transition
    setState(newState) {
        this.prevState = this.state;
        this.state = newState;
        this.animTime = 0;

        if (newState !== PLAYER_STATES.RUNNING && newState !== PLAYER_STATES.CLIMBING) {
            this.moving = false;
        }
    }

    // Check if player has support
    hasSupport() {
        const currentTile = this.level.getTile(this.tileX, this.tileY);
        const tileBelow = this.level.getTile(this.tileX, this.tileY + 1);

        // On solid ground
        if (isSolid(tileBelow)) return true;

        // On ladder
        if (isClimbable(currentTile, this.level.laddersRevealed)) return true;
        if (isClimbable(tileBelow, this.level.laddersRevealed)) return true;

        // On rope
        if (isHangable(currentTile)) return true;

        return false;
    }

    // Try to move horizontally
    tryMoveHorizontal(dx) {
        const targetX = this.tileX + dx;
        const targetTile = this.level.getTile(targetX, this.tileY);

        if (!isSolid(targetTile)) {
            this.startMovement(targetX, this.tileY);
            return true;
        }
        return false;
    }

    // Start movement to target tile
    startMovement(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.moveStartX = this.x;
        this.moveStartY = this.y;
        this.moveProgress = 0;
        this.moving = true;
    }

    // Continue movement interpolation
    continueMovement(dt, speed) {
        const distance = CONFIG.DISPLAY_TILE_SIZE;
        const moveAmount = speed * CONFIG.DISPLAY_TILE_SIZE * dt;

        this.moveProgress += moveAmount;

        if (this.moveProgress >= distance) {
            // Arrived at target
            this.tileX = this.targetX;
            this.tileY = this.targetY;
            this.alignToTile();
            this.moving = false;
        } else {
            // Interpolate position
            const progress = this.moveProgress / distance;
            const targetPixelX = this.targetX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
            const targetPixelY = this.targetY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;

            this.x = this.moveStartX + (targetPixelX - this.moveStartX) * progress;
            this.y = this.moveStartY + (targetPixelY - this.moveStartY) * progress;
        }
    }

    // Try to dig
    tryDig(direction) {
        const digX = this.tileX + direction;
        const digY = this.tileY + 1;
        const digTile = this.level.getTile(digX, digY);

        // Can only dig brick, and not if standing on it
        if (isDiggable(digTile)) {
            this.setState(PLAYER_STATES.DIGGING);
            this.digTimer = CONFIG.DIG_DURATION;
            this.digDirection = direction;
            this.digTargetX = digX;
            this.digTargetY = digY;
            this.facingRight = direction > 0;
        }
    }

    // Check for gold collection
    checkGoldCollection() {
        if (this.level.collectGold(this.tileX, this.tileY)) {
            return true;
        }
        return false;
    }

    // Kill the player
    die() {
        if (this.invincibleTimer > 0) return false;
        if (this.state === PLAYER_STATES.DEAD) return false;

        this.setState(PLAYER_STATES.DEAD);
        this.deathTimer = 0;
        return true;
    }

    // Respawn the player
    respawn() {
        this.reset();
        this.invincibleTimer = CONFIG.PLAYER_INVINCIBILITY;
    }

    // Get sprite info for rendering
    getSpriteInfo() {
        let spriteName = 'player_idle';
        let flipX = !this.facingRight;

        switch (this.state) {
            case PLAYER_STATES.IDLE:
                spriteName = 'player_idle';
                break;
            case PLAYER_STATES.RUNNING:
                spriteName = 'player_run_1'; // Animation handled in render
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

    // Get animation name for current state
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

    // Check if player is flashing (invincible)
    isFlashing() {
        if (this.invincibleTimer <= 0) return false;
        return Math.floor(this.invincibleTimer * 10) % 2 === 0;
    }

    // Get render position (top-left of sprite)
    getRenderPos() {
        return {
            x: this.x - CONFIG.DISPLAY_TILE_SIZE / 2,
            y: this.y - CONFIG.DISPLAY_TILE_SIZE / 2
        };
    }
}

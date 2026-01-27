// Enemy entity with AI and behaviors

import { CONFIG, ENEMY_STATES, TILE_TYPES } from './config.js';
import { isClimbable, isHangable, isSolid } from './tiles.js';
import { findPath, getNextMoveFromPath, getSimpleChaseDirection } from './pathfinding.js';

export class Enemy {
    constructor(level, startX, startY, id) {
        this.level = level;
        this.startX = startX;
        this.startY = startY;
        this.id = id;
        this.reset();
    }

    reset() {
        // Position (in pixels, center of enemy)
        this.x = this.startX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        this.y = this.startY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;

        // Tile position
        this.tileX = this.startX;
        this.tileY = this.startY;

        // Target tile for movement
        this.targetX = this.tileX;
        this.targetY = this.tileY;

        // State
        this.state = ENEMY_STATES.CHASING;

        // Direction facing
        this.facingRight = true;

        // Animation
        this.animTime = 0;

        // Movement
        this.moving = false;
        this.moveProgress = 0;
        this.moveStartX = 0;
        this.moveStartY = 0;

        // Pathfinding
        this.path = [];
        this.pathUpdateTimer = 0;

        // Trapped state
        this.trapTimer = 0;

        // Respawn state
        this.respawnTimer = 0;
        this.visible = true;

        // Carried gold (position where gold was)
        this.carriedGold = null;
    }

    // Get current tile position
    getTilePos() {
        return { x: this.tileX, y: this.tileY };
    }

    // Align to tile center
    alignToTile() {
        this.x = this.tileX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
        this.y = this.tileY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
    }

    // Update enemy
    update(dt, playerTileX, playerTileY) {
        this.animTime += dt;

        switch (this.state) {
            case ENEMY_STATES.CHASING:
                this.updateChasing(dt, playerTileX, playerTileY);
                break;
            case ENEMY_STATES.CLIMBING:
                this.updateClimbing(dt, playerTileX, playerTileY);
                break;
            case ENEMY_STATES.BAR_TRAVERSE:
                this.updateBarTraverse(dt, playerTileX, playerTileY);
                break;
            case ENEMY_STATES.FALLING:
                this.updateFalling(dt);
                break;
            case ENEMY_STATES.TRAPPED:
                this.updateTrapped(dt);
                break;
            case ENEMY_STATES.EMERGING:
                this.updateEmerging(dt);
                break;
            case ENEMY_STATES.RESPAWNING:
                this.updateRespawning(dt);
                break;
        }

        // Update tile position
        this.tileX = Math.floor(this.x / CONFIG.DISPLAY_TILE_SIZE);
        this.tileY = Math.floor(this.y / CONFIG.DISPLAY_TILE_SIZE);
    }

    updateChasing(dt, playerTileX, playerTileY) {
        // If moving, continue movement
        if (this.moving) {
            this.continueMovement(dt, CONFIG.ENEMY_SPEED);
            return;
        }

        // Arrived at target tile
        this.alignToTile();

        // Check for falling
        if (!this.hasSupport()) {
            this.setState(ENEMY_STATES.FALLING);
            return;
        }

        // Check if on hole (trapped)
        const currentTile = this.level.getTile(this.tileX, this.tileY);
        if (currentTile === TILE_TYPES.DUG_HOLE) {
            // Check if we should fall into the hole
            const tileBelow = this.level.getTile(this.tileX, this.tileY + 1);
            if (!isSolid(tileBelow) && tileBelow !== TILE_TYPES.DUG_HOLE) {
                this.setState(ENEMY_STATES.FALLING);
                return;
            }
        }

        // Check for gold to pick up
        this.checkGoldPickup();

        // Update pathfinding
        this.pathUpdateTimer -= dt;
        if (this.pathUpdateTimer <= 0 || this.path.length === 0) {
            this.updatePath(playerTileX, playerTileY);
            this.pathUpdateTimer = CONFIG.PATH_UPDATE_INTERVAL + (Math.random() - 0.5) * 0.2;
        }

        // Get next move from path
        const move = getNextMoveFromPath(this.path, this.tileX, this.tileY);

        // Update path if first step is reached
        if (this.path.length > 0 &&
            this.tileX === this.path[0].x &&
            this.tileY === this.path[0].y) {
            this.path.shift();
        }

        // Execute movement
        if (move.dx !== 0 || move.dy !== 0) {
            if (move.dx !== 0) {
                this.facingRight = move.dx > 0;
            }

            // Check if should climb
            if (move.dy !== 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
                this.setState(ENEMY_STATES.CLIMBING);
                this.tryMoveVertical(move.dy);
                return;
            }

            // Check if on rope
            if (isHangable(currentTile) && move.dy === 0) {
                this.setState(ENEMY_STATES.BAR_TRAVERSE);
                this.tryMoveHorizontal(move.dx);
                return;
            }

            // Try horizontal movement
            if (move.dx !== 0) {
                this.tryMoveHorizontal(move.dx);
            } else if (move.dy !== 0) {
                this.tryMoveVertical(move.dy);
            }
        }
    }

    updateClimbing(dt, playerTileX, playerTileY) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        if (this.moving) {
            this.continueMovement(dt, CONFIG.ENEMY_CLIMB_SPEED);
            return;
        }

        this.alignToTile();

        // Check if still on ladder
        if (!isClimbable(currentTile, this.level.laddersRevealed)) {
            if (this.hasSupport()) {
                this.setState(ENEMY_STATES.CHASING);
            } else {
                this.setState(ENEMY_STATES.FALLING);
            }
            return;
        }

        // Update path
        this.pathUpdateTimer -= dt;
        if (this.pathUpdateTimer <= 0) {
            this.updatePath(playerTileX, playerTileY);
            this.pathUpdateTimer = CONFIG.PATH_UPDATE_INTERVAL;
        }

        const move = getNextMoveFromPath(this.path, this.tileX, this.tileY);

        if (this.path.length > 0 &&
            this.tileX === this.path[0].x &&
            this.tileY === this.path[0].y) {
            this.path.shift();
        }

        if (move.dy !== 0) {
            this.tryMoveVertical(move.dy);
        } else if (move.dx !== 0) {
            this.facingRight = move.dx > 0;
            if (this.tryMoveHorizontal(move.dx)) {
                this.setState(ENEMY_STATES.CHASING);
            }
        }
    }

    updateBarTraverse(dt, playerTileX, playerTileY) {
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        if (this.moving) {
            this.continueMovement(dt, CONFIG.ENEMY_SPEED);
            return;
        }

        this.alignToTile();

        // Check if still on rope
        if (!isHangable(currentTile)) {
            if (isClimbable(currentTile, this.level.laddersRevealed)) {
                this.setState(ENEMY_STATES.CLIMBING);
            } else if (this.hasSupport()) {
                this.setState(ENEMY_STATES.CHASING);
            } else {
                this.setState(ENEMY_STATES.FALLING);
            }
            return;
        }

        // Update path
        this.pathUpdateTimer -= dt;
        if (this.pathUpdateTimer <= 0) {
            this.updatePath(playerTileX, playerTileY);
            this.pathUpdateTimer = CONFIG.PATH_UPDATE_INTERVAL;
        }

        const move = getNextMoveFromPath(this.path, this.tileX, this.tileY);

        if (this.path.length > 0 &&
            this.tileX === this.path[0].x &&
            this.tileY === this.path[0].y) {
            this.path.shift();
        }

        if (move.dx !== 0) {
            this.facingRight = move.dx > 0;
            this.tryMoveHorizontal(move.dx);
        } else if (move.dy > 0) {
            // Drop down
            this.setState(ENEMY_STATES.FALLING);
        }
    }

    updateFalling(dt) {
        const fallSpeed = CONFIG.ENEMY_FALL_SPEED * CONFIG.DISPLAY_TILE_SIZE * dt;
        this.y += fallSpeed;

        const newTileY = Math.floor(this.y / CONFIG.DISPLAY_TILE_SIZE);
        const currentTile = this.level.getTile(this.tileX, newTileY);
        const tileBelow = this.level.getTile(this.tileX, newTileY + 1);

        // Check for dug hole (trap)
        if (currentTile === TILE_TYPES.DUG_HOLE) {
            // Fell into hole - get trapped
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(ENEMY_STATES.TRAPPED);
            this.trapTimer = CONFIG.ENEMY_TRAP_TIME;
            this.dropGold();
            return;
        }

        // Catch on ladder
        if (isClimbable(currentTile, this.level.laddersRevealed)) {
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(ENEMY_STATES.CLIMBING);
            return;
        }

        // Catch on rope
        if (isHangable(currentTile)) {
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(ENEMY_STATES.BAR_TRAVERSE);
            return;
        }

        // Land on solid ground
        if (isSolid(tileBelow)) {
            this.tileY = newTileY;
            this.alignToTile();
            this.setState(ENEMY_STATES.CHASING);
            return;
        }

        this.tileY = newTileY;
    }

    updateTrapped(dt) {
        this.trapTimer -= dt;

        // Check if hole is regenerating with enemy in it
        if (this.level.isHoleRegenerating(this.tileX, this.tileY)) {
            // Enemy dies, will respawn
            this.setState(ENEMY_STATES.RESPAWNING);
            this.respawnTimer = CONFIG.ENEMY_RESPAWN_DELAY;
            this.visible = false;
            return;
        }

        if (this.trapTimer <= 0) {
            // Climb out
            this.setState(ENEMY_STATES.EMERGING);
        }
    }

    updateEmerging(dt) {
        // Move up out of hole
        const targetY = this.tileY - 1;
        const upTile = this.level.getTile(this.tileX, targetY);

        if (!isSolid(upTile)) {
            const climbSpeed = CONFIG.ENEMY_CLIMB_SPEED * CONFIG.DISPLAY_TILE_SIZE * dt;
            this.y -= climbSpeed;

            if (this.y <= targetY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2) {
                this.tileY = targetY;
                this.alignToTile();
                this.setState(ENEMY_STATES.CHASING);
            }
        } else {
            // Can't emerge, stay trapped
            this.setState(ENEMY_STATES.TRAPPED);
            this.trapTimer = 1.0; // Try again soon
        }
    }

    updateRespawning(dt) {
        this.respawnTimer -= dt;

        if (this.respawnTimer <= 0) {
            // Respawn at start position
            this.tileX = this.startX;
            this.tileY = this.startY;
            this.alignToTile();
            this.visible = true;
            this.setState(ENEMY_STATES.CHASING);
        }
    }

    // State transition
    setState(newState) {
        this.state = newState;
        this.animTime = 0;
        this.moving = false;
    }

    // Check if enemy has support
    hasSupport() {
        const currentTile = this.level.getTile(this.tileX, this.tileY);
        const tileBelow = this.level.getTile(this.tileX, this.tileY + 1);

        if (isSolid(tileBelow)) return true;
        if (isClimbable(currentTile, this.level.laddersRevealed)) return true;
        if (isClimbable(tileBelow, this.level.laddersRevealed)) return true;
        if (isHangable(currentTile)) return true;

        return false;
    }

    // Try horizontal movement
    tryMoveHorizontal(dx) {
        const targetX = this.tileX + dx;
        const targetTile = this.level.getTile(targetX, this.tileY);

        if (!isSolid(targetTile)) {
            this.startMovement(targetX, this.tileY);
            return true;
        }
        return false;
    }

    // Try vertical movement
    tryMoveVertical(dy) {
        const targetY = this.tileY + dy;
        const targetTile = this.level.getTile(this.tileX, targetY);
        const currentTile = this.level.getTile(this.tileX, this.tileY);

        if (!isSolid(targetTile)) {
            // Check if we can climb there
            if (dy < 0 && isClimbable(currentTile, this.level.laddersRevealed)) {
                this.startMovement(this.tileX, targetY);
                return true;
            }
            if (dy > 0 && (isClimbable(currentTile, this.level.laddersRevealed) ||
                          isClimbable(targetTile, this.level.laddersRevealed))) {
                this.startMovement(this.tileX, targetY);
                return true;
            }
        }
        return false;
    }

    // Start movement to target
    startMovement(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.moveStartX = this.x;
        this.moveStartY = this.y;
        this.moveProgress = 0;
        this.moving = true;
    }

    // Continue movement
    continueMovement(dt, speed) {
        const distance = CONFIG.DISPLAY_TILE_SIZE;
        const moveAmount = speed * CONFIG.DISPLAY_TILE_SIZE * dt;

        this.moveProgress += moveAmount;

        if (this.moveProgress >= distance) {
            this.tileX = this.targetX;
            this.tileY = this.targetY;
            this.alignToTile();
            this.moving = false;
        } else {
            const progress = this.moveProgress / distance;
            const targetPixelX = this.targetX * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;
            const targetPixelY = this.targetY * CONFIG.DISPLAY_TILE_SIZE + CONFIG.DISPLAY_TILE_SIZE / 2;

            this.x = this.moveStartX + (targetPixelX - this.moveStartX) * progress;
            this.y = this.moveStartY + (targetPixelY - this.moveStartY) * progress;
        }
    }

    // Update pathfinding
    updatePath(playerTileX, playerTileY) {
        this.path = findPath(
            this.level,
            this.tileX,
            this.tileY,
            playerTileX,
            playerTileY,
            this.level.laddersRevealed
        );
    }

    // Check for gold pickup
    checkGoldPickup() {
        if (this.carriedGold) return; // Already carrying gold

        const tile = this.level.getTile(this.tileX, this.tileY);
        if (tile === TILE_TYPES.GOLD) {
            // Pick up gold (don't remove from level, just track)
            this.carriedGold = { x: this.tileX, y: this.tileY };
        }
    }

    // Drop carried gold
    dropGold() {
        if (this.carriedGold) {
            // Gold reappears at top of current position
            // (In original game, dropped gold appears above the hole)
            this.carriedGold = null;
        }
    }

    // Check collision with player
    checkPlayerCollision(playerX, playerY) {
        if (!this.visible) return false;
        if (this.state === ENEMY_STATES.TRAPPED) return false;
        if (this.state === ENEMY_STATES.RESPAWNING) return false;

        const dx = Math.abs(this.x - playerX);
        const dy = Math.abs(this.y - playerY);
        const collisionDist = CONFIG.DISPLAY_TILE_SIZE * 0.6;

        return dx < collisionDist && dy < collisionDist;
    }

    // Get sprite info for rendering
    getSpriteInfo() {
        let spriteName = 'enemy_idle';
        let flipX = !this.facingRight;

        switch (this.state) {
            case ENEMY_STATES.CHASING:
            case ENEMY_STATES.BAR_TRAVERSE:
                spriteName = 'enemy_run_1';
                break;
            case ENEMY_STATES.CLIMBING:
            case ENEMY_STATES.EMERGING:
                spriteName = 'enemy_climb_1';
                break;
            case ENEMY_STATES.FALLING:
                spriteName = 'enemy_run_1';
                break;
            case ENEMY_STATES.TRAPPED:
                spriteName = 'enemy_trapped';
                break;
        }

        return { spriteName, flipX };
    }

    // Get animation name
    getAnimationName() {
        switch (this.state) {
            case ENEMY_STATES.CHASING:
            case ENEMY_STATES.BAR_TRAVERSE:
                return 'enemy_run';
            case ENEMY_STATES.CLIMBING:
                return 'enemy_climb';
            default:
                return null;
        }
    }

    // Get render position
    getRenderPos() {
        return {
            x: this.x - CONFIG.DISPLAY_TILE_SIZE / 2,
            y: this.y - CONFIG.DISPLAY_TILE_SIZE / 2
        };
    }
}

// Game state machine and main game logic

import { CONFIG, GAME_STATES, PLAYER_STATES, TILE_TYPES } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { renderer } from './renderer.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { ANIMATIONS } from './sprites.js';

export class Game {
    constructor(levelData) {
        this.levelData = levelData;
        this.level = null;
        this.player = null;
        this.enemies = [];

        this.state = GAME_STATES.LOADING;
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;

        // Timing
        this.stateTimer = 0;
        this.messageText = '';

        // Effects
        this.shakeTimer = 0;
        this.flashTimer = 0;
        this.flashColor = '#FFF';

        // Gold animation tracking
        this.goldAnimTime = 0;
    }

    // Initialize the game
    init() {
        this.level = new Level(this.levelData);
        this.player = new Player(this.level);
        this.enemies = [];

        // Create enemies
        this.level.enemyStarts.forEach((start, index) => {
            this.enemies.push(new Enemy(this.level, start.x, start.y, index));
        });

        // Update UI
        this.updateUI();

        // Start playing
        this.setState(GAME_STATES.PLAYING);
    }

    // Reset level (after death)
    resetLevel() {
        this.level.reset();
        this.player.reset();
        this.enemies.forEach(enemy => enemy.reset());
        this.updateUI();
    }

    // Set game state
    setState(newState, message = '') {
        this.state = newState;
        this.stateTimer = 0;
        this.messageText = message;

        // Update message overlay
        const overlay = document.getElementById('message-overlay');
        const messageEl = document.getElementById('message-text');

        if (message) {
            messageEl.textContent = message;
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Main update function
    update(dt) {
        this.stateTimer += dt;
        this.goldAnimTime += dt;

        // Update effects
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
        if (this.flashTimer > 0) this.flashTimer -= dt;

        switch (this.state) {
            case GAME_STATES.PLAYING:
                this.updatePlaying(dt);
                break;
            case GAME_STATES.PAUSED:
                this.updatePaused(dt);
                break;
            case GAME_STATES.LEVEL_COMPLETE:
                this.updateLevelComplete(dt);
                break;
            case GAME_STATES.GAME_OVER:
                this.updateGameOver(dt);
                break;
            case GAME_STATES.VICTORY:
                this.updateVictory(dt);
                break;
        }

        // Clear one-shot inputs
        input.update();
    }

    updatePlaying(dt) {
        // Check for pause
        if (input.wasPressed('PAUSE')) {
            this.setState(GAME_STATES.PAUSED, 'PAUSED');
            return;
        }

        // Get player input
        const movement = input.getMovement();
        const digDirection = input.getDigDirection();

        // Update player
        const prevGold = this.level.collectedGold;
        this.player.update(dt, movement, digDirection);

        // Check for gold collection
        if (this.level.collectedGold > prevGold) {
            this.score += CONFIG.SCORE_GOLD;
            audio.playCollectGold();
            this.flash('#FFD700', 0.1);
            this.updateUI();
        }

        // Check for dig sound
        if (this.player.state === PLAYER_STATES.DIGGING && this.player.digTimer > CONFIG.DIG_DURATION - 0.1) {
            audio.playDig();
        }

        // Update enemies
        this.enemies.forEach(enemy => {
            const prevState = enemy.state;
            enemy.update(dt, this.player.tileX, this.player.tileY);

            // Check for state changes for sound effects
            if (enemy.state === 'trapped' && prevState !== 'trapped') {
                audio.playEnemyTrapped();
                this.score += CONFIG.SCORE_ENEMY_KILL / 2;
                this.updateUI();
            }
            if (enemy.state === 'respawning' && prevState !== 'respawning') {
                audio.playEnemyDie();
                this.score += CONFIG.SCORE_ENEMY_KILL;
                this.updateUI();
            }
        });

        // Update level (holes regeneration)
        const regenerated = this.level.updateHoles(dt);

        // Check if player is crushed by regenerating brick
        regenerated.forEach(pos => {
            if (this.player.tileX === pos.x && this.player.tileY === pos.y) {
                this.playerDeath();
            }
        });

        // Check enemy collisions with player
        if (this.player.state !== PLAYER_STATES.DEAD) {
            this.enemies.forEach(enemy => {
                if (enemy.checkPlayerCollision(this.player.x, this.player.y)) {
                    this.playerDeath();
                }
            });
        }

        // Check for level exit
        if (this.level.laddersRevealed && this.player.tileY < 0) {
            this.levelComplete();
        }

        // Check for player death animation complete
        if (this.player.state === PLAYER_STATES.DEAD && this.player.deathTimer > 1.5) {
            this.lives--;
            this.updateUI();

            if (this.lives <= 0) {
                this.setState(GAME_STATES.GAME_OVER, 'GAME OVER - Press R to retry');
                audio.playGameOver();
            } else {
                this.resetLevel();
                this.player.respawn();
            }
        }
    }

    updatePaused(dt) {
        if (input.wasPressed('PAUSE')) {
            this.setState(GAME_STATES.PLAYING);
        }
    }

    updateLevelComplete(dt) {
        if (this.stateTimer > 3) {
            // Could load next level here
            // For now, just restart
            this.setState(GAME_STATES.VICTORY, 'VICTORY! Press R to play again');
        }
    }

    updateGameOver(dt) {
        if (input.wasPressed('RESTART')) {
            this.lives = CONFIG.STARTING_LIVES;
            this.score = 0;
            this.resetLevel();
            this.player.respawn();
            this.setState(GAME_STATES.PLAYING);
        }
    }

    updateVictory(dt) {
        if (input.wasPressed('RESTART')) {
            this.lives = CONFIG.STARTING_LIVES;
            this.score = 0;
            this.resetLevel();
            this.player.respawn();
            this.setState(GAME_STATES.PLAYING);
        }
    }

    // Player death handler
    playerDeath() {
        if (this.player.die()) {
            audio.playPlayerDie();
            this.shake(0.5);
        }
    }

    // Level complete handler
    levelComplete() {
        this.score += CONFIG.SCORE_LEVEL_COMPLETE;
        this.updateUI();
        this.setState(GAME_STATES.LEVEL_COMPLETE, 'LEVEL COMPLETE!');
        audio.playLevelComplete();
    }

    // Screen shake effect
    shake(duration, intensity = 5) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    // Screen flash effect
    flash(color, duration) {
        this.flashColor = color;
        this.flashTimer = duration;
    }

    // Update UI elements
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('gold').textContent = this.level.collectedGold;
        document.getElementById('gold-total').textContent = this.level.goldCount;
        document.getElementById('lives').textContent = this.lives;
    }

    // Main render function
    render() {
        // Apply shake if active
        if (this.shakeTimer > 0) {
            renderer.applyShake(this.shakeIntensity);
        }

        // Clear canvas
        renderer.clear('#1a1a2e');

        // Render tiles
        this.renderTiles();

        // Render enemies
        this.enemies.forEach(enemy => {
            if (!enemy.visible) return;

            const pos = enemy.getRenderPos();
            const { spriteName, flipX } = enemy.getSpriteInfo();
            const animName = enemy.getAnimationName();

            if (animName) {
                renderer.drawAnimatedSprite(animName, pos.x, pos.y, enemy.animTime, flipX);
            } else {
                renderer.drawSprite(spriteName, pos.x, pos.y, flipX);
            }
        });

        // Render player
        if (!this.player.isFlashing()) {
            const pos = this.player.getRenderPos();
            const { spriteName, flipX } = this.player.getSpriteInfo();
            const animName = this.player.getAnimationName();

            if (animName) {
                renderer.drawAnimatedSprite(animName, pos.x, pos.y, this.player.animTime, flipX);
            } else {
                renderer.drawSprite(spriteName, pos.x, pos.y, flipX);
            }
        }

        // Apply flash if active
        if (this.flashTimer > 0) {
            renderer.flash(this.flashColor, 0.3);
        }

        // Restore from shake
        if (this.shakeTimer > 0) {
            renderer.restoreFromShake();
        }
    }

    // Render all tiles
    renderTiles() {
        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                const tile = this.level.getTile(x, y);

                // Skip empty tiles
                if (tile === TILE_TYPES.EMPTY) continue;

                // Handle dug holes
                if (tile === TILE_TYPES.DUG_HOLE) {
                    const hole = this.level.getHole(x, y);
                    if (hole && hole.regenerating) {
                        // Render regeneration animation
                        const anim = ANIMATIONS.brick_regen;
                        const frame = hole.getAnimFrame();
                        if (frame < anim.length) {
                            renderer.drawSpriteAtTile(anim[frame], x, y);
                        }
                    }
                    continue;
                }

                // Handle gold animation
                if (tile === TILE_TYPES.GOLD) {
                    renderer.drawAnimatedSprite(
                        'gold_sparkle',
                        x * CONFIG.DISPLAY_TILE_SIZE,
                        y * CONFIG.DISPLAY_TILE_SIZE,
                        this.goldAnimTime,
                        false,
                        CONFIG.GOLD_SPARKLE_TIME
                    );
                    continue;
                }

                // Handle hidden ladder
                if (tile === TILE_TYPES.HIDDEN_LADDER) {
                    if (this.level.laddersRevealed) {
                        renderer.drawSpriteAtTile('ladder', x, y);
                    }
                    continue;
                }

                // Normal tile rendering
                renderer.drawTile(tile, x, y, this.level.laddersRevealed);
            }
        }
    }
}

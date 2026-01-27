// Canvas rendering utilities

import { CONFIG } from './config.js';
import { SPRITES, PALETTE, ANIMATIONS } from './sprites.js';
import { getTileSprite } from './tiles.js';

class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.spriteCache = new Map();
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Pre-render sprites to cache
        this.cacheSprites();
    }

    // Pre-render sprites to off-screen canvases for performance
    cacheSprites() {
        for (const [name, spriteData] of Object.entries(SPRITES)) {
            const spriteCanvas = document.createElement('canvas');
            spriteCanvas.width = CONFIG.TILE_SIZE;
            spriteCanvas.height = CONFIG.TILE_SIZE;
            const spriteCtx = spriteCanvas.getContext('2d');

            this.renderSpriteToContext(spriteCtx, spriteData, 0, 0, 1);

            this.spriteCache.set(name, spriteCanvas);
        }
    }

    // Render sprite data to a context
    renderSpriteToContext(ctx, spriteData, x, y, scale) {
        for (let py = 0; py < spriteData.length; py++) {
            for (let px = 0; px < spriteData[py].length; px++) {
                const colorIndex = spriteData[py][px];
                if (colorIndex === 0) continue; // Transparent

                const color = PALETTE[colorIndex];
                if (!color || color === 'transparent') continue;

                ctx.fillStyle = color;
                ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
            }
        }
    }

    // Clear the canvas
    clear(color = '#000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw a cached sprite
    drawSprite(spriteName, x, y, flipX = false) {
        const sprite = this.spriteCache.get(spriteName);
        if (!sprite) {
            console.warn(`Sprite not found: ${spriteName}`);
            return;
        }

        this.ctx.save();

        if (flipX) {
            this.ctx.translate(x + CONFIG.DISPLAY_TILE_SIZE, y);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(sprite, 0, 0, CONFIG.DISPLAY_TILE_SIZE, CONFIG.DISPLAY_TILE_SIZE);
        } else {
            this.ctx.drawImage(sprite, x, y, CONFIG.DISPLAY_TILE_SIZE, CONFIG.DISPLAY_TILE_SIZE);
        }

        this.ctx.restore();
    }

    // Draw a sprite at tile coordinates
    drawSpriteAtTile(spriteName, tileX, tileY, flipX = false) {
        const x = tileX * CONFIG.DISPLAY_TILE_SIZE;
        const y = tileY * CONFIG.DISPLAY_TILE_SIZE;
        this.drawSprite(spriteName, x, y, flipX);
    }

    // Draw tile at position
    drawTile(tileType, tileX, tileY, laddersRevealed = false) {
        const spriteName = getTileSprite(tileType, laddersRevealed);
        if (spriteName && spriteName !== 'empty') {
            this.drawSpriteAtTile(spriteName, tileX, tileY);
        }
    }

    // Get animation frame based on time
    getAnimationFrame(animName, time, frameTime = CONFIG.ANIM_FRAME_TIME) {
        const anim = ANIMATIONS[animName];
        if (!anim || anim.length === 0) return null;

        const frameIndex = Math.floor(time / frameTime) % anim.length;
        return anim[frameIndex];
    }

    // Draw an animated sprite
    drawAnimatedSprite(animName, x, y, time, flipX = false, frameTime = CONFIG.ANIM_FRAME_TIME) {
        const spriteName = this.getAnimationFrame(animName, time, frameTime);
        if (spriteName) {
            this.drawSprite(spriteName, x, y, flipX);
        }
    }

    // Draw text
    drawText(text, x, y, color = '#FFD700', fontSize = 16) {
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);
    }

    // Draw centered text
    drawCenteredText(text, y, color = '#FFD700', fontSize = 32) {
        this.ctx.font = `bold ${fontSize}px monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvas.width / 2, y);
    }

    // Draw a rectangle
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    // Draw screen flash effect
    flash(color = '#FFF', alpha = 0.3) {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
    }

    // Screen shake effect (returns offset to apply)
    getShakeOffset(intensity = 5, time = 0) {
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }

    // Apply shake to context
    applyShake(intensity) {
        const offset = this.getShakeOffset(intensity);
        this.ctx.save();
        this.ctx.translate(offset.x, offset.y);
    }

    // Restore from shake
    restoreFromShake() {
        this.ctx.restore();
    }
}

// Singleton instance
export const renderer = new Renderer();

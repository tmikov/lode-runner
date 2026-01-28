// Editor-specific rendering - grid overlay, spawn markers, hover highlights

import { CONFIG, TILE_TYPES, EDITOR_CONFIG, EDITOR_TOOLS } from '../config.js';
import { getTileSprite } from '../tiles.js';

export class EditorRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    // Draw grid overlay
    drawGrid(ctx) {
        ctx.strokeStyle = EDITOR_CONFIG.GRID_COLOR;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= CONFIG.LEVEL_WIDTH; x++) {
            const px = x * CONFIG.DISPLAY_TILE_SIZE;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, CONFIG.CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= CONFIG.LEVEL_HEIGHT; y++) {
            const py = y * CONFIG.DISPLAY_TILE_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, py);
            ctx.stroke();
        }
    }

    // Draw hover highlight on current tile
    drawHoverHighlight(ctx, tileX, tileY) {
        if (tileX < 0 || tileX >= CONFIG.LEVEL_WIDTH ||
            tileY < 0 || tileY >= CONFIG.LEVEL_HEIGHT) {
            return;
        }

        ctx.fillStyle = EDITOR_CONFIG.HOVER_COLOR;
        ctx.fillRect(
            tileX * CONFIG.DISPLAY_TILE_SIZE,
            tileY * CONFIG.DISPLAY_TILE_SIZE,
            CONFIG.DISPLAY_TILE_SIZE,
            CONFIG.DISPLAY_TILE_SIZE
        );
    }

    // Draw rectangle selection preview
    drawSelectionPreview(ctx, rect) {
        if (!rect) return;

        const x = rect.x1 * CONFIG.DISPLAY_TILE_SIZE;
        const y = rect.y1 * CONFIG.DISPLAY_TILE_SIZE;
        const w = (rect.x2 - rect.x1 + 1) * CONFIG.DISPLAY_TILE_SIZE;
        const h = (rect.y2 - rect.y1 + 1) * CONFIG.DISPLAY_TILE_SIZE;

        ctx.fillStyle = EDITOR_CONFIG.SELECTION_COLOR;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#64C8FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }

    // Draw player spawn marker
    drawPlayerSpawn(ctx, pos) {
        if (!pos) return;

        const x = pos.x * CONFIG.DISPLAY_TILE_SIZE;
        const y = pos.y * CONFIG.DISPLAY_TILE_SIZE;
        const size = CONFIG.DISPLAY_TILE_SIZE;

        // Draw background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(x, y, size, size);

        // Draw P marker
        ctx.fillStyle = EDITOR_CONFIG.PLAYER_SPAWN_COLOR;
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', x + size / 2, y + size / 2);

        // Draw border
        ctx.strokeStyle = EDITOR_CONFIG.PLAYER_SPAWN_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    }

    // Draw enemy spawn markers
    drawEnemySpawns(ctx, spawns) {
        const size = CONFIG.DISPLAY_TILE_SIZE;

        for (let i = 0; i < spawns.length; i++) {
            const pos = spawns[i];
            const x = pos.x * CONFIG.DISPLAY_TILE_SIZE;
            const y = pos.y * CONFIG.DISPLAY_TILE_SIZE;

            // Draw background
            ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
            ctx.fillRect(x, y, size, size);

            // Draw E marker with index
            ctx.fillStyle = EDITOR_CONFIG.ENEMY_SPAWN_COLOR;
            ctx.font = `bold ${size * 0.5}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`E${i + 1}`, x + size / 2, y + size / 2);

            // Draw border
            ctx.strokeStyle = EDITOR_CONFIG.ENEMY_SPAWN_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        }
    }

    // Render all level tiles
    renderTiles(level) {
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tile = level.getTile(x, y);
                if (tile === TILE_TYPES.EMPTY) continue;

                // Handle hidden ladder as visible in editor
                if (tile === TILE_TYPES.HIDDEN_LADDER) {
                    this.renderer.drawSpriteAtTile('ladder', x, y);
                    // Draw overlay to indicate hidden
                    this.renderer.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                    this.renderer.ctx.fillRect(
                        x * CONFIG.DISPLAY_TILE_SIZE,
                        y * CONFIG.DISPLAY_TILE_SIZE,
                        CONFIG.DISPLAY_TILE_SIZE,
                        CONFIG.DISPLAY_TILE_SIZE
                    );
                    continue;
                }

                this.renderer.drawTile(tile, x, y, false);
            }
        }
    }

    // Draw tile preview at cursor position
    drawTilePreview(ctx, tileX, tileY, tileType, toolType) {
        if (tileX < 0 || tileY < 0) return;
        if (toolType === EDITOR_TOOLS.PLAYER_SPAWN ||
            toolType === EDITOR_TOOLS.ENEMY_SPAWN) return;

        const x = tileX * CONFIG.DISPLAY_TILE_SIZE;
        const y = tileY * CONFIG.DISPLAY_TILE_SIZE;

        ctx.globalAlpha = 0.5;

        if (toolType === EDITOR_TOOLS.ERASE) {
            // Show X for erase
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 4);
            ctx.lineTo(x + CONFIG.DISPLAY_TILE_SIZE - 4, y + CONFIG.DISPLAY_TILE_SIZE - 4);
            ctx.moveTo(x + CONFIG.DISPLAY_TILE_SIZE - 4, y + 4);
            ctx.lineTo(x + 4, y + CONFIG.DISPLAY_TILE_SIZE - 4);
            ctx.stroke();
        } else {
            // Draw tile preview
            this.renderer.drawTile(tileType, tileX, tileY, true);
        }

        ctx.globalAlpha = 1;
    }
}

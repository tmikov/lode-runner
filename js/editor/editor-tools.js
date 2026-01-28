// Editor tool implementations

import { TILE_TYPES, EDITOR_CONFIG, EDITOR_TOOLS } from '../config.js';
import { SetTileAction, BatchTileAction, SetPlayerSpawnAction, AddEnemySpawnAction, RemoveEnemySpawnAction } from './editor-state.js';

// Draw tool - single tile placement and drag
export class DrawTool {
    constructor() {
        this.currentStroke = [];
        this.isDragging = false;
    }

    start(x, y, editor) {
        this.currentStroke = [];
        this.isDragging = true;
        this.placeTile(x, y, editor);
    }

    move(x, y, editor) {
        if (this.isDragging) {
            this.placeTile(x, y, editor);
        }
    }

    end(editor) {
        if (this.currentStroke.length > 0) {
            // Commit stroke as batch action
            const action = new BatchTileAction(this.currentStroke);
            editor.history.execute(action, editor.level, editor);
            editor.unsavedChanges = true;
        }
        this.currentStroke = [];
        this.isDragging = false;
    }

    placeTile(x, y, editor) {
        if (!editor.isValidTile(x, y)) return;

        const oldTile = editor.level.getTile(x, y);
        const newTile = editor.selectedTile;

        if (oldTile === newTile) return;

        // Check if already in current stroke
        const existing = this.currentStroke.find(c => c.x === x && c.y === y);
        if (existing) return;

        // Add to stroke and apply visually
        this.currentStroke.push({ x, y, oldTile, newTile });
        editor.level.setTile(x, y, newTile);
    }

    cancel(editor) {
        // Revert current stroke
        for (const change of this.currentStroke) {
            editor.level.setTile(change.x, change.y, change.oldTile);
        }
        this.currentStroke = [];
        this.isDragging = false;
    }
}

// Erase tool - same as draw but always places EMPTY
export class EraseTool extends DrawTool {
    placeTile(x, y, editor) {
        if (!editor.isValidTile(x, y)) return;

        const oldTile = editor.level.getTile(x, y);
        const newTile = TILE_TYPES.EMPTY;

        if (oldTile === newTile) return;

        const existing = this.currentStroke.find(c => c.x === x && c.y === y);
        if (existing) return;

        this.currentStroke.push({ x, y, oldTile, newTile });
        editor.level.setTile(x, y, newTile);
    }
}

// Flood fill tool - BFS fill
export class FloodFillTool {
    start(x, y, editor) {
        if (!editor.isValidTile(x, y)) return;

        const targetTile = editor.level.getTile(x, y);
        const fillTile = editor.selectedTile;

        if (targetTile === fillTile) return;

        const changes = this.floodFill(x, y, targetTile, fillTile, editor);

        if (changes.length > 0) {
            const action = new BatchTileAction(changes);
            editor.history.execute(action, editor.level, editor);
            editor.unsavedChanges = true;
        }
    }

    floodFill(startX, startY, targetTile, fillTile, editor) {
        const changes = [];
        const visited = new Set();
        const queue = [{ x: startX, y: startY }];

        while (queue.length > 0 && changes.length < EDITOR_CONFIG.MAX_FLOOD_FILL) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (!editor.isValidTile(x, y)) continue;
            if (editor.level.getTile(x, y) !== targetTile) continue;

            visited.add(key);
            changes.push({ x, y, oldTile: targetTile, newTile: fillTile });
            editor.level.setTile(x, y, fillTile);

            // Add neighbors
            queue.push({ x: x - 1, y });
            queue.push({ x: x + 1, y });
            queue.push({ x, y: y - 1 });
            queue.push({ x, y: y + 1 });
        }

        return changes;
    }

    move() { }
    end() { }
    cancel() { }
}

// Rectangle selection and fill tool
export class RectangleTool {
    constructor() {
        this.startPos = null;
        this.endPos = null;
        this.isDragging = false;
        this.previewChanges = [];
    }

    start(x, y, editor) {
        this.startPos = { x, y };
        this.endPos = { x, y };
        this.isDragging = true;
        this.previewChanges = [];
    }

    move(x, y, editor) {
        if (this.isDragging) {
            this.endPos = { x, y };
        }
    }

    end(editor) {
        if (!this.isDragging || !this.startPos || !this.endPos) {
            this.cancel(editor);
            return;
        }

        const minX = Math.min(this.startPos.x, this.endPos.x);
        const maxX = Math.max(this.startPos.x, this.endPos.x);
        const minY = Math.min(this.startPos.y, this.endPos.y);
        const maxY = Math.max(this.startPos.y, this.endPos.y);

        const changes = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (!editor.isValidTile(x, y)) continue;

                const oldTile = editor.level.getTile(x, y);
                if (oldTile !== editor.selectedTile) {
                    changes.push({ x, y, oldTile, newTile: editor.selectedTile });
                }
            }
        }

        if (changes.length > 0) {
            const action = new BatchTileAction(changes);
            editor.history.execute(action, editor.level, editor);
            editor.unsavedChanges = true;
        }

        this.isDragging = false;
        this.startPos = null;
        this.endPos = null;
    }

    getPreviewRect() {
        if (!this.isDragging || !this.startPos || !this.endPos) return null;

        return {
            x1: Math.min(this.startPos.x, this.endPos.x),
            y1: Math.min(this.startPos.y, this.endPos.y),
            x2: Math.max(this.startPos.x, this.endPos.x),
            y2: Math.max(this.startPos.y, this.endPos.y)
        };
    }

    cancel(editor) {
        this.isDragging = false;
        this.startPos = null;
        this.endPos = null;
        this.previewChanges = [];
    }
}

// Player spawn placement tool
export class PlayerSpawnTool {
    start(x, y, editor) {
        if (!editor.isValidTile(x, y)) return;

        const oldPos = editor.playerStart ? { ...editor.playerStart } : null;
        const newPos = { x, y };

        const action = new SetPlayerSpawnAction(oldPos, newPos);
        editor.history.execute(action, editor.level, editor);
        editor.unsavedChanges = true;
    }

    move() { }
    end() { }
    cancel() { }
}

// Enemy spawn placement tool
export class EnemySpawnTool {
    start(x, y, editor) {
        if (!editor.isValidTile(x, y)) return;

        // Check if there's already an enemy at this position
        const existingIndex = editor.enemyStarts.findIndex(
            e => e.x === x && e.y === y
        );

        if (existingIndex !== -1) {
            // Remove existing enemy spawn
            const action = new RemoveEnemySpawnAction(
                editor.enemyStarts[existingIndex],
                existingIndex
            );
            editor.history.execute(action, editor.level, editor);
        } else {
            // Add new enemy spawn
            const action = new AddEnemySpawnAction({ x, y });
            editor.history.execute(action, editor.level, editor);
        }
        editor.unsavedChanges = true;
    }

    move() { }
    end() { }
    cancel() { }
}

// Tool factory
export function createTool(toolType) {
    switch (toolType) {
        case EDITOR_TOOLS.DRAW:
            return new DrawTool();
        case EDITOR_TOOLS.ERASE:
            return new EraseTool();
        case EDITOR_TOOLS.FILL:
            return new FloodFillTool();
        case EDITOR_TOOLS.RECTANGLE:
            return new RectangleTool();
        case EDITOR_TOOLS.PLAYER_SPAWN:
            return new PlayerSpawnTool();
        case EDITOR_TOOLS.ENEMY_SPAWN:
            return new EnemySpawnTool();
        default:
            return new DrawTool();
    }
}

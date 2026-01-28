// Editor undo/redo state management using command pattern

import { EDITOR_CONFIG } from '../config.js';

// Base action class for undo/redo
class EditorAction {
    execute(level) { }
    undo(level) { }
}

// Action for setting a single tile
export class SetTileAction extends EditorAction {
    constructor(x, y, oldTile, newTile) {
        super();
        this.x = x;
        this.y = y;
        this.oldTile = oldTile;
        this.newTile = newTile;
    }

    execute(level) {
        level.setTile(this.x, this.y, this.newTile);
    }

    undo(level) {
        level.setTile(this.x, this.y, this.oldTile);
    }
}

// Action for multiple tile changes (drag strokes, flood fill, rectangle)
export class BatchTileAction extends EditorAction {
    constructor(changes) {
        super();
        // Make a deep copy of changes to prevent reference issues
        this.changes = changes.map(c => ({ ...c }));
    }

    execute(level) {
        for (const change of this.changes) {
            level.setTile(change.x, change.y, change.newTile);
        }
    }

    undo(level) {
        for (const change of this.changes) {
            level.setTile(change.x, change.y, change.oldTile);
        }
    }
}

// Action for moving player spawn
export class SetPlayerSpawnAction extends EditorAction {
    constructor(oldPos, newPos) {
        super();
        this.oldPos = oldPos ? { ...oldPos } : null;
        this.newPos = newPos ? { ...newPos } : null;
    }

    execute(level, editor) {
        editor.playerStart = this.newPos ? { ...this.newPos } : null;
    }

    undo(level, editor) {
        editor.playerStart = this.oldPos ? { ...this.oldPos } : null;
    }
}

// Action for adding enemy spawn
export class AddEnemySpawnAction extends EditorAction {
    constructor(pos) {
        super();
        this.pos = { ...pos };
    }

    execute(level, editor) {
        editor.enemyStarts.push({ ...this.pos });
    }

    undo(level, editor) {
        const index = editor.enemyStarts.findIndex(
            e => e.x === this.pos.x && e.y === this.pos.y
        );
        if (index !== -1) {
            editor.enemyStarts.splice(index, 1);
        }
    }
}

// Action for removing enemy spawn
export class RemoveEnemySpawnAction extends EditorAction {
    constructor(pos, index) {
        super();
        this.pos = { ...pos };
        this.index = index;
    }

    execute(level, editor) {
        const index = editor.enemyStarts.findIndex(
            e => e.x === this.pos.x && e.y === this.pos.y
        );
        if (index !== -1) {
            editor.enemyStarts.splice(index, 1);
        }
    }

    undo(level, editor) {
        editor.enemyStarts.splice(this.index, 0, { ...this.pos });
    }
}

// History manager for undo/redo
export class EditorHistory {
    constructor() {
        this.actions = [];
        this.currentIndex = -1;
        this.maxHistory = EDITOR_CONFIG.MAX_HISTORY;
    }

    // Execute an action and add to history
    execute(action, level, editor) {
        action.execute(level, editor);

        // Remove any redo actions
        this.actions = this.actions.slice(0, this.currentIndex + 1);

        // Add new action
        this.actions.push(action);
        this.currentIndex++;

        // Trim if over max
        if (this.actions.length > this.maxHistory) {
            this.actions.shift();
            this.currentIndex--;
        }
    }

    // Undo the last action
    undo(level, editor) {
        if (this.currentIndex < 0) return false;

        const action = this.actions[this.currentIndex];
        action.undo(level, editor);
        this.currentIndex--;
        return true;
    }

    // Redo the next action
    redo(level, editor) {
        if (this.currentIndex >= this.actions.length - 1) return false;

        this.currentIndex++;
        const action = this.actions[this.currentIndex];
        action.execute(level, editor);
        return true;
    }

    // Check if undo is available
    canUndo() {
        return this.currentIndex >= 0;
    }

    // Check if redo is available
    canRedo() {
        return this.currentIndex < this.actions.length - 1;
    }

    // Clear all history
    clear() {
        this.actions = [];
        this.currentIndex = -1;
    }
}

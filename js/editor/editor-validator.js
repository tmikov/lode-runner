// Editor level validation

import { TILE_TYPES } from '../config.js';

export class EditorValidator {
    constructor() {
        this.warnings = [];
        this.errors = [];
    }

    // Validate level and return warnings/errors
    validate(editor) {
        this.warnings = [];
        this.errors = [];

        // Check for player start
        if (!editor.playerStart) {
            this.errors.push('No player start position');
        }

        // Check for gold
        const goldCount = this.countGold(editor);
        if (goldCount === 0) {
            this.warnings.push('No gold placed');
        }

        // Check for enemies
        if (editor.enemyStarts.length === 0) {
            this.warnings.push('No enemy spawns');
        }

        // Check player start is not on solid tile
        if (editor.playerStart) {
            const tile = editor.level.getTile(editor.playerStart.x, editor.playerStart.y);
            if (tile === TILE_TYPES.BRICK || tile === TILE_TYPES.SOLID) {
                this.errors.push('Player start is inside a solid block');
            }
        }

        // Check enemy starts are not on solid tiles
        for (let i = 0; i < editor.enemyStarts.length; i++) {
            const spawn = editor.enemyStarts[i];
            const tile = editor.level.getTile(spawn.x, spawn.y);
            if (tile === TILE_TYPES.BRICK || tile === TILE_TYPES.SOLID) {
                this.warnings.push(`Enemy ${i + 1} is inside a solid block`);
            }
        }

        // Check for hidden ladders without regular ladders to top
        if (!this.hasPathToTop(editor)) {
            this.warnings.push('No visible path to level exit');
        }

        return {
            isValid: this.errors.length === 0,
            canPlaytest: editor.playerStart !== null,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    // Count gold tiles
    countGold(editor) {
        let count = 0;
        for (let y = 0; y < editor.level.height; y++) {
            for (let x = 0; x < editor.level.width; x++) {
                if (editor.level.getTile(x, y) === TILE_TYPES.GOLD) {
                    count++;
                }
            }
        }
        return count;
    }

    // Simple check if there's a ladder reaching the top
    hasPathToTop(editor) {
        // Check top row for ladders
        for (let x = 0; x < editor.level.width; x++) {
            const tile = editor.level.getTile(x, 0);
            if (tile === TILE_TYPES.LADDER || tile === TILE_TYPES.HIDDEN_LADDER) {
                return true;
            }
        }
        return false;
    }

    // Get validation summary for status bar
    getSummary() {
        if (this.errors.length > 0) {
            return {
                type: 'error',
                message: this.errors[0]
            };
        }
        if (this.warnings.length > 0) {
            return {
                type: 'warning',
                message: this.warnings[0]
            };
        }
        return {
            type: 'ok',
            message: 'Level OK'
        };
    }
}

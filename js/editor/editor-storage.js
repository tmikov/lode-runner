// Editor save/load and storage management

import { CONFIG, TILE_TYPES, EDITOR_CONFIG } from '../config.js';

// Character mapping for ASCII export (original Apple II Lode Runner format)
const TILE_TO_CHAR = {
    [TILE_TYPES.EMPTY]: ' ',
    [TILE_TYPES.BRICK]: '#',
    [TILE_TYPES.SOLID]: '@',
    [TILE_TYPES.LADDER]: 'H',
    [TILE_TYPES.ROPE]: '-',
    [TILE_TYPES.GOLD]: '$',
    [TILE_TYPES.HIDDEN_LADDER]: 'S',
    [TILE_TYPES.TRAP_DOOR]: 'X',
    [TILE_TYPES.EXIT]: '^',
    [TILE_TYPES.DUG_HOLE]: ' '
};

export class EditorStorage {
    constructor() {
        this.autosaveTimer = 0;
    }

    // Convert editor state to JSON-serializable format
    exportLevel(editor) {
        const tiles = [];
        for (let y = 0; y < editor.level.height; y++) {
            for (let x = 0; x < editor.level.width; x++) {
                tiles.push(editor.level.getTile(x, y));
            }
        }

        return {
            name: editor.levelName || 'Untitled Level',
            width: editor.level.width,
            height: editor.level.height,
            tiles: tiles,
            playerStart: editor.playerStart ? { ...editor.playerStart } : null,
            enemyStarts: editor.enemyStarts.map(e => ({ ...e })),
            createdAt: editor.createdAt || new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };
    }

    // Import level data into editor
    importLevel(editor, data) {
        // Clear current level
        editor.clearLevel();

        // Set tiles
        for (let y = 0; y < data.height; y++) {
            for (let x = 0; x < data.width; x++) {
                const index = y * data.width + x;
                if (data.tiles[index] !== undefined) {
                    editor.level.setTile(x, y, data.tiles[index]);
                }
            }
        }

        // Set spawns
        editor.playerStart = data.playerStart ? { ...data.playerStart } : null;
        editor.enemyStarts = data.enemyStarts ? data.enemyStarts.map(e => ({ ...e })) : [];
        editor.levelName = data.name || 'Untitled Level';
        editor.createdAt = data.createdAt || new Date().toISOString();

        editor.history.clear();
        editor.unsavedChanges = false;
    }

    // Save level to localStorage
    saveToLocalStorage(editor, name) {
        const data = this.exportLevel(editor);
        data.name = name;
        editor.levelName = name;

        const key = EDITOR_CONFIG.STORAGE_PREFIX + this.sanitizeName(name);
        localStorage.setItem(key, JSON.stringify(data));
        editor.unsavedChanges = false;

        return key;
    }

    // Load level from localStorage
    loadFromLocalStorage(editor, key) {
        const dataStr = localStorage.getItem(key);
        if (!dataStr) return false;

        try {
            const data = JSON.parse(dataStr);
            this.importLevel(editor, data);
            return true;
        } catch (e) {
            console.error('Failed to load level:', e);
            return false;
        }
    }

    // Autosave to localStorage
    autosave(editor) {
        const data = this.exportLevel(editor);
        data.name = editor.levelName || 'Autosave';
        localStorage.setItem(EDITOR_CONFIG.AUTOSAVE_KEY, JSON.stringify(data));
    }

    // Load autosave
    loadAutosave(editor) {
        return this.loadFromLocalStorage(editor, EDITOR_CONFIG.AUTOSAVE_KEY);
    }

    // Check if autosave exists
    hasAutosave() {
        return localStorage.getItem(EDITOR_CONFIG.AUTOSAVE_KEY) !== null;
    }

    // Get list of saved levels
    getSavedLevels() {
        const levels = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Skip autosave key
            if (key === EDITOR_CONFIG.AUTOSAVE_KEY) continue;

            if (key.startsWith(EDITOR_CONFIG.STORAGE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    levels.push({
                        key: key,
                        name: data.name,
                        modifiedAt: data.modifiedAt || data.createdAt
                    });
                } catch (e) {
                    console.error('Failed to parse level:', key, e);
                }
            }
        }
        // Sort by modification date, newest first
        levels.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
        return levels;
    }

    // Delete a saved level
    deleteLevel(key) {
        localStorage.removeItem(key);
    }

    // Export level to JSON file
    exportToFile(editor) {
        const data = this.exportLevel(editor);
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.sanitizeName(data.name)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import level from JSON file
    importFromFile(editor, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.importLevel(editor, data);
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Convert to level data format for game
    toLevelData(editor) {
        const tiles = [];
        let goldCount = 0;

        for (let y = 0; y < editor.level.height; y++) {
            for (let x = 0; x < editor.level.width; x++) {
                const tile = editor.level.getTile(x, y);
                tiles.push(tile);
                if (tile === TILE_TYPES.GOLD) goldCount++;
            }
        }

        return {
            width: editor.level.width,
            height: editor.level.height,
            tiles: tiles,
            playerStart: editor.playerStart ? { ...editor.playerStart } : { x: 0, y: CONFIG.LEVEL_HEIGHT - 1 },
            enemyStarts: editor.enemyStarts.map(e => ({ ...e })),
            goldCount: goldCount
        };
    }

    // Sanitize level name for use as storage key
    sanitizeName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 32);
    }

    // Update autosave timer
    updateAutosave(dt, editor) {
        if (!editor.unsavedChanges) return;

        this.autosaveTimer += dt;
        if (this.autosaveTimer >= EDITOR_CONFIG.AUTOSAVE_INTERVAL) {
            this.autosave(editor);
            this.autosaveTimer = 0;
        }
    }

    // Export level as ASCII string (original Apple II Lode Runner format)
    exportAsAscii(editor) {
        const lines = [];

        for (let y = 0; y < editor.level.height; y++) {
            let line = '';
            for (let x = 0; x < editor.level.width; x++) {
                // Check for player spawn at this position
                if (editor.playerStart && editor.playerStart.x === x && editor.playerStart.y === y) {
                    line += '&';
                    continue;
                }

                // Check for enemy spawn at this position
                const isEnemySpawn = editor.enemyStarts.some(e => e.x === x && e.y === y);
                if (isEnemySpawn) {
                    line += '0';
                    continue;
                }

                // Get tile character
                const tile = editor.level.getTile(x, y);
                line += TILE_TO_CHAR[tile] || ' ';
            }
            lines.push(line);
        }

        return lines.join('\n');
    }

    // Import a built-in level into the editor as a copy
    importBuiltinLevel(editor, levelData) {
        // Clear current level
        editor.clearLevel();

        // Set tiles
        for (let y = 0; y < levelData.height; y++) {
            for (let x = 0; x < levelData.width; x++) {
                const index = y * levelData.width + x;
                if (levelData.tiles[index] !== undefined) {
                    editor.level.setTile(x, y, levelData.tiles[index]);
                }
            }
        }

        // Set spawns
        editor.playerStart = levelData.playerStart ? { ...levelData.playerStart } : null;
        editor.enemyStarts = levelData.enemyStarts ? levelData.enemyStarts.map(e => ({ ...e })) : [];
        editor.levelName = (levelData.name || 'Built-in Level') + ' (Copy)';
        editor.createdAt = new Date().toISOString();

        editor.history.clear();
        // Mark as unsaved since it's a copy
        editor.unsavedChanges = true;
    }
}

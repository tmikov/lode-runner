// Main editor class - state management, tool coordination, update/render loop

import { CONFIG, TILE_TYPES, EDITOR_TOOLS, GAME_STATES } from '../config.js';
import { Level } from '../level.js';
import { renderer } from '../renderer.js';
import { EditorHistory } from './editor-state.js';
import { createTool } from './editor-tools.js';
import { EditorInput } from './editor-input.js';
import { EditorRenderer } from './editor-renderer.js';
import { EditorStorage } from './editor-storage.js';
import { EditorValidator } from './editor-validator.js';
import { EditorUI } from './editor-ui.js';

export class Editor {
    constructor(onExit, onPlaytest) {
        this.onExit = onExit;
        this.onPlaytest = onPlaytest;

        // Level data
        this.level = null;
        this.playerStart = null;
        this.enemyStarts = [];
        this.levelName = 'Untitled Level';
        this.createdAt = null;

        // Editor state
        this.selectedTile = TILE_TYPES.BRICK;
        this.currentTool = EDITOR_TOOLS.DRAW;
        this.gridVisible = true;
        this.unsavedChanges = false;

        // Components
        this.history = new EditorHistory();
        this.tool = createTool(EDITOR_TOOLS.DRAW);
        this.input = new EditorInput();
        this.renderer = new EditorRenderer(renderer);
        this.storage = new EditorStorage();
        this.validator = new EditorValidator();
        this.ui = null;

        // Playtest state
        this.playtestState = null;
    }

    init() {
        // Create empty level
        this.createEmptyLevel();

        // Initialize input
        const canvas = document.getElementById('game-canvas');
        this.input.init(canvas);

        // Initialize UI
        this.ui = new EditorUI(this);
        this.ui.init();

        // Show editor UI
        this.showEditorUI();

        // Check for autosave
        if (this.storage.hasAutosave()) {
            if (confirm('Found autosaved level. Load it?')) {
                this.storage.loadAutosave(this);
            }
        }

        console.log('Editor initialized');
    }

    createEmptyLevel() {
        // Create level data with all empty tiles
        const tiles = new Array(CONFIG.LEVEL_WIDTH * CONFIG.LEVEL_HEIGHT).fill(TILE_TYPES.EMPTY);

        const levelData = {
            width: CONFIG.LEVEL_WIDTH,
            height: CONFIG.LEVEL_HEIGHT,
            tiles: tiles,
            playerStart: { x: 1, y: CONFIG.LEVEL_HEIGHT - 2 },
            enemyStarts: [],
            goldCount: 0
        };

        this.level = new Level(levelData);
        this.playerStart = { x: 1, y: CONFIG.LEVEL_HEIGHT - 2 };
        this.enemyStarts = [];
        this.levelName = 'Untitled Level';
        this.createdAt = new Date().toISOString();
        this.unsavedChanges = false;
        this.history.clear();
    }

    clearLevel() {
        // Clear all tiles to empty
        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                this.level.setTile(x, y, TILE_TYPES.EMPTY);
            }
        }
        this.playerStart = null;
        this.enemyStarts = [];
        this.unsavedChanges = true;
        this.history.clear();
    }

    showEditorUI() {
        const editorUI = document.getElementById('editor-ui');
        const gameUI = document.getElementById('ui-overlay');
        const messageOverlay = document.getElementById('message-overlay');
        const canvas = document.getElementById('game-canvas');
        const editorCanvasArea = document.getElementById('editor-canvas-area');

        if (editorUI) editorUI.classList.remove('hidden');
        if (gameUI) gameUI.classList.add('hidden');
        if (messageOverlay) messageOverlay.classList.add('hidden');

        // Move canvas into editor layout
        if (canvas && editorCanvasArea) {
            editorCanvasArea.appendChild(canvas);
            // Update input handler canvas rect after move
            this.input.updateCanvasRect();
        }
    }

    hideEditorUI() {
        const editorUI = document.getElementById('editor-ui');
        const gameUI = document.getElementById('ui-overlay');
        const canvas = document.getElementById('game-canvas');
        const gameContainer = document.getElementById('game-container');

        if (editorUI) editorUI.classList.add('hidden');
        if (gameUI) gameUI.classList.remove('hidden');

        // Move canvas back to game container
        if (canvas && gameContainer) {
            gameContainer.insertBefore(canvas, gameContainer.firstChild);
        }
    }

    setTool(toolType) {
        // Cancel current tool if dragging
        if (this.tool.cancel) {
            this.tool.cancel(this);
        }

        this.currentTool = toolType;
        this.tool = createTool(toolType);

        if (this.ui) {
            this.ui.updateToolButtons();
            this.ui.updateStatusBar();
        }
    }

    setSelectedTile(tileType) {
        this.selectedTile = tileType;
        if (this.ui) {
            this.ui.updatePalette();
            this.ui.updateStatusBar();
        }
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
    }

    isValidTile(x, y) {
        return x >= 0 && x < CONFIG.LEVEL_WIDTH &&
               y >= 0 && y < CONFIG.LEVEL_HEIGHT;
    }

    update(dt) {
        // Handle keyboard shortcuts
        if (this.input.wasUndoPressed()) {
            if (this.history.undo(this.level, this)) {
                this.unsavedChanges = true;
            }
        }

        if (this.input.wasRedoPressed()) {
            if (this.history.redo(this.level, this)) {
                this.unsavedChanges = true;
            }
        }

        if (this.input.wasSavePressed()) {
            this.ui.showSaveModal();
        }

        if (this.input.wasGridTogglePressed()) {
            this.toggleGrid();
            this.ui.updateGridButton();
        }

        if (this.input.wasEscapePressed()) {
            // Cancel current tool action
            if (this.tool.cancel) {
                this.tool.cancel(this);
            }
        }

        // Handle mouse input for tools
        const tilePos = this.input.getTilePos();

        if (this.input.mousePressed && this.input.isMouseOverCanvas()) {
            if (this.input.rightMouseDown) {
                // Right click - erase
                const prevTool = this.currentTool;
                const prevToolObj = this.tool;
                this.tool = createTool(EDITOR_TOOLS.ERASE);
                this.tool.start(tilePos.x, tilePos.y, this);
            } else {
                this.tool.start(tilePos.x, tilePos.y, this);
            }
        } else if (this.input.mouseDown && this.tool.move) {
            this.tool.move(tilePos.x, tilePos.y, this);
        }

        if (this.input.mouseReleased) {
            if (this.tool.end) {
                this.tool.end(this);
            }
        }

        // Update autosave
        this.storage.updateAutosave(dt, this);

        // Update status bar
        if (this.ui) {
            this.ui.updateStatusBar();
        }

        // Clear input state
        this.input.update();
    }

    render() {
        // Clear canvas
        renderer.clear('#1a1a2e');

        // Render tiles
        this.renderer.renderTiles(this.level);

        // Draw grid if visible
        if (this.gridVisible) {
            this.renderer.drawGrid(renderer.ctx);
        }

        // Draw spawn markers
        this.renderer.drawPlayerSpawn(renderer.ctx, this.playerStart);
        this.renderer.drawEnemySpawns(renderer.ctx, this.enemyStarts);

        // Draw hover highlight and tile preview
        const tilePos = this.input.getTilePos();
        if (this.input.isMouseOverCanvas()) {
            this.renderer.drawHoverHighlight(renderer.ctx, tilePos.x, tilePos.y);
            this.renderer.drawTilePreview(
                renderer.ctx,
                tilePos.x,
                tilePos.y,
                this.selectedTile,
                this.currentTool
            );
        }

        // Draw rectangle selection preview
        if (this.tool.getPreviewRect) {
            const rect = this.tool.getPreviewRect();
            this.renderer.drawSelectionPreview(renderer.ctx, rect);
        }
    }

    startPlaytest() {
        const validation = this.validator.validate(this);

        if (!validation.canPlaytest) {
            alert('Cannot playtest: ' + validation.errors.join(', '));
            return;
        }

        // Save current state for return
        this.playtestState = {
            tiles: [...this.level.tiles],
            playerStart: this.playerStart ? { ...this.playerStart } : null,
            enemyStarts: this.enemyStarts.map(e => ({ ...e }))
        };

        // Generate level data
        const levelData = this.storage.toLevelData(this);

        // Hide editor UI
        this.hideEditorUI();

        // Start playtest
        if (this.onPlaytest) {
            this.onPlaytest(levelData);
        }
    }

    endPlaytest(completed) {
        // Restore editor state
        if (this.playtestState) {
            this.level.tiles = [...this.playtestState.tiles];
            this.playerStart = this.playtestState.playerStart;
            this.enemyStarts = this.playtestState.enemyStarts;
            this.playtestState = null;
        }

        // Show editor UI
        this.showEditorUI();

        if (completed) {
            console.log('Level completed during playtest!');
        }
    }

    exitEditor() {
        // Autosave before exit
        if (this.unsavedChanges) {
            this.storage.autosave(this);
        }

        this.hideEditorUI();

        if (this.onExit) {
            this.onExit();
        }
    }
}

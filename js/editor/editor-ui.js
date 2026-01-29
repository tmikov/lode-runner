// Editor UI management - tile palette, toolbar, status bar

import { TILE_TYPES, EDITOR_TOOLS, CONFIG } from '../config.js';
import { BUILT_IN_LEVELS } from '../../levels/index.js';

// Tile definitions for the palette
const PALETTE_TILES = [
    { type: TILE_TYPES.EMPTY, name: 'Empty', key: '1' },
    { type: TILE_TYPES.BRICK, name: 'Brick', key: '2' },
    { type: TILE_TYPES.SOLID, name: 'Solid', key: '3' },
    { type: TILE_TYPES.LADDER, name: 'Ladder', key: '4' },
    { type: TILE_TYPES.ROPE, name: 'Rope', key: '5' },
    { type: TILE_TYPES.GOLD, name: 'Gold', key: '6' },
    { type: TILE_TYPES.HIDDEN_LADDER, name: 'Hidden Ladder', key: '7' },
    { type: TILE_TYPES.TRAP_DOOR, name: 'Trap Door', key: '8' }
];

export class EditorUI {
    constructor(editor) {
        this.editor = editor;
        this.elements = {};
    }

    init() {
        this.setupToolbar();
        this.setupSidebar();
        this.setupStatusBar();
        this.setupModals();
        this.updateUI();
    }

    setupToolbar() {
        // Tool buttons are in the sidebar, not toolbar
        const sidebar = document.getElementById('editor-sidebar');
        if (sidebar) {
            const toolButtons = sidebar.querySelectorAll('[data-tool]');
            toolButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editor.setTool(btn.dataset.tool);
                    this.updateToolButtons();
                });
            });
        }

        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        // Grid toggle
        const gridBtn = document.getElementById('btn-grid');
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                this.editor.toggleGrid();
                this.updateGridButton();
            });
        }

        // Undo button
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.editor.history.undo(this.editor.level, this.editor);
                this.editor.unsavedChanges = true;
            });
        }

        // Redo button
        const redoBtn = document.getElementById('btn-redo');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.editor.history.redo(this.editor.level, this.editor);
                this.editor.unsavedChanges = true;
            });
        }

        // Save button
        const saveBtn = document.getElementById('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveModal());
        }

        // Load button
        const loadBtn = document.getElementById('btn-load');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.showLoadModal());
        }

        // New button
        const newBtn = document.getElementById('btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.confirmNew());
        }

        // Export button
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.editor.storage.exportToFile(this.editor);
            });
        }

        // Import button
        const importBtn = document.getElementById('btn-import');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('import-file-input').click();
            });
        }

        // File input for import
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.editor.storage.importFromFile(this.editor, e.target.files[0]);
                    this.updateUI();
                    e.target.value = '';
                }
            });
        }

        // Built-in levels button
        const builtinBtn = document.getElementById('btn-builtin');
        if (builtinBtn) {
            builtinBtn.addEventListener('click', () => this.showBuiltinModal());
        }

        // Test button
        const testBtn = document.getElementById('btn-test');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.editor.startPlaytest());
        }

        // Exit button
        const exitBtn = document.getElementById('btn-exit');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.confirmExit());
        }
    }

    setupSidebar() {
        const palette = document.getElementById('tile-palette');
        if (!palette) return;

        // Create tile buttons
        palette.innerHTML = '';
        PALETTE_TILES.forEach(tile => {
            const btn = document.createElement('button');
            btn.className = 'palette-tile';
            btn.dataset.tile = tile.type;
            btn.title = `${tile.name} (${tile.key})`;

            // Create mini canvas for tile preview
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            btn.appendChild(canvas);

            // Draw tile preview
            this.drawTilePreview(canvas, tile.type);

            btn.addEventListener('click', () => {
                this.editor.setSelectedTile(tile.type);
                this.updatePalette();
            });

            palette.appendChild(btn);
        });

        // Spawn buttons
        const playerSpawnBtn = document.getElementById('btn-player-spawn');
        if (playerSpawnBtn) {
            playerSpawnBtn.addEventListener('click', () => {
                this.editor.setTool(EDITOR_TOOLS.PLAYER_SPAWN);
                this.updateToolButtons();
            });
        }

        const enemySpawnBtn = document.getElementById('btn-enemy-spawn');
        if (enemySpawnBtn) {
            enemySpawnBtn.addEventListener('click', () => {
                this.editor.setTool(EDITOR_TOOLS.ENEMY_SPAWN);
                this.updateToolButtons();
            });
        }

        // Keyboard shortcuts for tiles
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;

            const tile = PALETTE_TILES.find(t => t.key === e.key);
            if (tile) {
                this.editor.setSelectedTile(tile.type);
                this.editor.setTool(EDITOR_TOOLS.DRAW);
                this.updatePalette();
                this.updateToolButtons();
            }
        });
    }

    drawTilePreview(canvas, tileType) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 32, 32);

        // Use renderer to draw tile if available
        if (this.editor.renderer && this.editor.renderer.renderer.spriteCache.size > 0) {
            const spriteName = this.getTileSpriteName(tileType);
            if (spriteName && spriteName !== 'empty') {
                const sprite = this.editor.renderer.renderer.spriteCache.get(spriteName);
                if (sprite) {
                    ctx.drawImage(sprite, 0, 0, 32, 32);
                }
            }
        } else {
            // Fallback colors
            const colors = {
                [TILE_TYPES.EMPTY]: '#1a1a2e',
                [TILE_TYPES.BRICK]: '#8B4513',
                [TILE_TYPES.SOLID]: '#4a4a6a',
                [TILE_TYPES.LADDER]: '#8B7355',
                [TILE_TYPES.ROPE]: '#DAA520',
                [TILE_TYPES.GOLD]: '#FFD700',
                [TILE_TYPES.HIDDEN_LADDER]: '#4a4a4a',
                [TILE_TYPES.TRAP_DOOR]: '#8B4513'  // Same as brick (deceptive)
            };
            ctx.fillStyle = colors[tileType] || '#333';
            ctx.fillRect(2, 2, 28, 28);
        }
    }

    getTileSpriteName(tileType) {
        const spriteNames = {
            [TILE_TYPES.BRICK]: 'brick',
            [TILE_TYPES.SOLID]: 'solid',
            [TILE_TYPES.LADDER]: 'ladder',
            [TILE_TYPES.ROPE]: 'rope',
            [TILE_TYPES.GOLD]: 'gold_1',
            [TILE_TYPES.HIDDEN_LADDER]: 'ladder',
            [TILE_TYPES.TRAP_DOOR]: 'trap_revealed'
        };
        return spriteNames[tileType];
    }

    setupStatusBar() {
        // Status bar is updated dynamically
    }

    setupModals() {
        // Save modal
        const saveModal = document.getElementById('save-modal');
        const saveForm = document.getElementById('save-form');
        if (saveForm) {
            saveForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('level-name-input');
                if (nameInput && nameInput.value.trim()) {
                    this.editor.storage.saveToLocalStorage(this.editor, nameInput.value.trim());
                    this.hideModal('save-modal');
                    this.updateUI();
                }
            });
        }

        // Load modal close button
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });

        // Cancel buttons
        document.querySelectorAll('.modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });
    }

    showSaveModal() {
        const modal = document.getElementById('save-modal');
        const input = document.getElementById('level-name-input');
        if (modal && input) {
            input.value = this.editor.levelName || '';
            modal.classList.remove('hidden');
            input.focus();
            input.select();
        }
    }

    showLoadModal() {
        const modal = document.getElementById('load-modal');
        const list = document.getElementById('level-list');
        if (!modal || !list) return;

        // Populate level list
        const levels = this.editor.storage.getSavedLevels();
        list.innerHTML = '';

        if (levels.length === 0) {
            list.innerHTML = '<p class="no-levels">No saved levels</p>';
        } else {
            levels.forEach(level => {
                const item = document.createElement('div');
                item.className = 'level-list-item';
                item.innerHTML = `
                    <span class="level-name">${level.name}</span>
                    <span class="level-date">${new Date(level.modifiedAt).toLocaleDateString()}</span>
                    <button class="btn-load-level" data-key="${level.key}">Load</button>
                    <button class="btn-delete-level" data-key="${level.key}">Delete</button>
                `;
                list.appendChild(item);
            });

            // Add event listeners
            list.querySelectorAll('.btn-load-level').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editor.storage.loadFromLocalStorage(this.editor, btn.dataset.key);
                    this.hideModal('load-modal');
                    this.updateUI();
                });
            });

            list.querySelectorAll('.btn-delete-level').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Delete this level?')) {
                        this.editor.storage.deleteLevel(btn.dataset.key);
                        this.showLoadModal(); // Refresh list
                    }
                });
            });
        }

        modal.classList.remove('hidden');
    }

    hideModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
    }

    showBuiltinModal() {
        const modal = document.getElementById('builtin-modal');
        const list = document.getElementById('builtin-list');
        if (!modal || !list) return;

        // Populate built-in level list
        list.innerHTML = '';

        if (BUILT_IN_LEVELS.length === 0) {
            list.innerHTML = '<p class="no-levels">No built-in levels available</p>';
        } else {
            BUILT_IN_LEVELS.forEach(level => {
                const item = document.createElement('div');
                item.className = 'level-list-item';
                item.innerHTML = `
                    <span class="level-name">${level.name}</span>
                    <button class="btn-load-level" data-id="${level.id}">Load</button>
                `;
                list.appendChild(item);
            });

            // Add event listeners for load buttons
            list.querySelectorAll('.btn-load-level').forEach(btn => {
                btn.addEventListener('click', () => {
                    const levelId = btn.dataset.id;
                    const level = BUILT_IN_LEVELS.find(l => l.id === levelId);
                    if (level) {
                        if (this.editor.unsavedChanges) {
                            if (!confirm('You have unsaved changes. Load built-in level anyway?')) {
                                return;
                            }
                        }
                        this.editor.storage.importBuiltinLevel(this.editor, level.data);
                        this.hideModal('builtin-modal');
                        this.updateUI();
                    }
                });
            });
        }

        modal.classList.remove('hidden');
    }

    confirmNew() {
        if (this.editor.unsavedChanges) {
            if (!confirm('You have unsaved changes. Create a new level anyway?')) {
                return;
            }
        }
        this.editor.clearLevel();
        this.editor.levelName = 'Untitled Level';
        this.updateUI();
    }

    confirmExit() {
        if (this.editor.unsavedChanges) {
            if (!confirm('You have unsaved changes. Exit editor anyway?')) {
                return;
            }
        }
        this.editor.exitEditor();
    }

    updateUI() {
        this.updateToolButtons();
        this.updatePalette();
        this.updateGridButton();
        this.updateStatusBar();
    }

    updateToolButtons() {
        // Update tool buttons in sidebar
        document.querySelectorAll('#editor-sidebar [data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.editor.currentTool);
        });

        const playerSpawnBtn = document.getElementById('btn-player-spawn');
        const enemySpawnBtn = document.getElementById('btn-enemy-spawn');

        if (playerSpawnBtn) {
            playerSpawnBtn.classList.toggle('active',
                this.editor.currentTool === EDITOR_TOOLS.PLAYER_SPAWN);
        }
        if (enemySpawnBtn) {
            enemySpawnBtn.classList.toggle('active',
                this.editor.currentTool === EDITOR_TOOLS.ENEMY_SPAWN);
        }
    }

    updatePalette() {
        document.querySelectorAll('.palette-tile').forEach(btn => {
            btn.classList.toggle('active',
                parseInt(btn.dataset.tile) === this.editor.selectedTile);
        });
    }

    updateGridButton() {
        const gridBtn = document.getElementById('btn-grid');
        if (gridBtn) {
            gridBtn.classList.toggle('active', this.editor.gridVisible);
        }
    }

    updateStatusBar() {
        const toolDisplay = document.getElementById('status-tool');
        const tileDisplay = document.getElementById('status-tile');
        const warningDisplay = document.getElementById('status-warning');

        if (toolDisplay) {
            const toolNames = {
                [EDITOR_TOOLS.DRAW]: 'Draw',
                [EDITOR_TOOLS.ERASE]: 'Erase',
                [EDITOR_TOOLS.FILL]: 'Fill',
                [EDITOR_TOOLS.RECTANGLE]: 'Rectangle',
                [EDITOR_TOOLS.PLAYER_SPAWN]: 'Player Spawn',
                [EDITOR_TOOLS.ENEMY_SPAWN]: 'Enemy Spawn'
            };
            toolDisplay.textContent = `Tool: ${toolNames[this.editor.currentTool] || 'Draw'}`;
        }

        if (tileDisplay) {
            const tileNames = {
                [TILE_TYPES.EMPTY]: 'Empty',
                [TILE_TYPES.BRICK]: 'Brick',
                [TILE_TYPES.SOLID]: 'Solid',
                [TILE_TYPES.LADDER]: 'Ladder',
                [TILE_TYPES.ROPE]: 'Rope',
                [TILE_TYPES.GOLD]: 'Gold',
                [TILE_TYPES.HIDDEN_LADDER]: 'Hidden Ladder',
                [TILE_TYPES.TRAP_DOOR]: 'Trap Door'
            };
            tileDisplay.textContent = `Tile: ${tileNames[this.editor.selectedTile] || 'Unknown'}`;
        }

        if (warningDisplay) {
            const validation = this.editor.validator.validate(this.editor);
            const summary = this.editor.validator.getSummary();

            warningDisplay.className = 'status-warning';
            if (summary.type === 'error') {
                warningDisplay.classList.add('error');
                warningDisplay.textContent = `⛔ ${summary.message}`;
            } else if (summary.type === 'warning') {
                warningDisplay.classList.add('warning');
                warningDisplay.textContent = `⚠ ${summary.message}`;
            } else {
                warningDisplay.classList.add('ok');
                warningDisplay.textContent = `✓ ${summary.message}`;
            }
        }

        // Update title with unsaved indicator
        const titleDisplay = document.getElementById('editor-title');
        if (titleDisplay) {
            const unsaved = this.editor.unsavedChanges ? '*' : '';
            titleDisplay.textContent = `${this.editor.levelName || 'Untitled Level'}${unsaved}`;
        }
    }
}

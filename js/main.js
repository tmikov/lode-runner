// Main entry point

import { Game } from './game.js';
import { Editor } from './editor/editor.js';
import { renderer } from './renderer.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { BUILT_IN_LEVELS } from '../levels/index.js';
import { GAME_STATES } from './config.js';

let game = null;
let editor = null;
let lastTime = 0;
let currentMode = 'menu'; // 'menu', 'game', 'editor', or 'playtest'

// Initialize the game
function init() {
    console.log('Initializing Lode Runner...');

    // Initialize renderer
    const canvas = document.getElementById('game-canvas');
    renderer.init(canvas);

    // Initialize audio
    audio.init();

    // Setup menu button handlers
    setupMenuHandlers();

    // Check for editor mode via URL parameter (for direct linking)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('editor') === 'true') {
        hideMenu();
        initEditor();
    } else {
        // Show menu by default
        showMenu();
    }

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);

    // Resume audio on first interaction
    document.addEventListener('keydown', () => {
        audio.resume();
    }, { once: true });

    console.log('Lode Runner initialized!');
}

// Setup menu button handlers
function setupMenuHandlers() {
    const playBtn = document.getElementById('btn-play');
    const editorBtn = document.getElementById('btn-editor');

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            hideMenu();
            initGame();
        });
    }

    if (editorBtn) {
        editorBtn.addEventListener('click', () => {
            hideMenu();
            initEditor();
        });
    }
}

// Show main menu
function showMenu() {
    currentMode = 'menu';
    const menuOverlay = document.getElementById('menu-overlay');
    const gameUI = document.getElementById('ui-overlay');
    const editorUI = document.getElementById('editor-ui');

    if (menuOverlay) menuOverlay.classList.remove('hidden');
    if (gameUI) gameUI.classList.add('hidden');
    if (editorUI) editorUI.classList.add('hidden');
}

// Hide main menu
function hideMenu() {
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) menuOverlay.classList.add('hidden');
}

// Initialize game mode
function initGame(levelData = null) {
    currentMode = 'game';

    // Hide editor UI if visible
    const editorUI = document.getElementById('editor-ui');
    if (editorUI) editorUI.classList.add('hidden');

    // Show game UI
    const gameUI = document.getElementById('ui-overlay');
    if (gameUI) gameUI.classList.remove('hidden');

    // Create game with level data or first built-in level
    const defaultLevel = BUILT_IN_LEVELS.length > 0 ? BUILT_IN_LEVELS[0].data : null;
    game = new Game(levelData || defaultLevel);
    game.init();
}

// Initialize editor mode
function initEditor() {
    currentMode = 'editor';

    // Create editor with callbacks
    editor = new Editor(
        // onExit callback - return to menu
        () => {
            showMenu();
        },
        // onPlaytest callback
        (levelData) => {
            startPlaytest(levelData);
        }
    );

    editor.init();
}

// Start playtesting a level
function startPlaytest(levelData) {
    currentMode = 'playtest';

    // Create game with editor level
    game = new Game(levelData);
    game.init();
    game.playtestMode = true;
}

// Main game loop
function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;

    if (currentMode === 'menu') {
        // Menu mode - just render the canvas background
        renderer.clear();
    } else if (currentMode === 'editor') {
        // Editor update/render
        editor.update(dt);
        editor.render();
    } else if (currentMode === 'playtest') {
        // Check for escape to exit playtest BEFORE game update
        // so it doesn't get caught by the pause handler
        if (input.wasPressed('PAUSE')) {
            input.update(); // Clear the input so game doesn't see it
            endPlaytest(false);
            return requestAnimationFrame(gameLoop);
        }

        // Playtest mode - check for exit conditions
        game.update(dt);
        game.render();

        // Draw playtest hint overlay
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        renderer.ctx.fillRect(0, 0, renderer.canvas.width, 28);
        renderer.ctx.font = 'bold 14px monospace';
        renderer.ctx.fillStyle = '#FFD700';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'middle';
        renderer.ctx.fillText('PLAYTEST MODE - Press ESC to return to editor', renderer.canvas.width / 2, 14);

        // Check for level complete or game over in playtest
        if (game.state === GAME_STATES.LEVEL_COMPLETE ||
            game.state === GAME_STATES.VICTORY) {
            endPlaytest(true);
        }

        // Check for game over - offer retry or exit
        if (game.state === GAME_STATES.GAME_OVER) {
            if (input.wasPressed('RESTART')) {
                // Retry playtest
                const levelData = editor.storage.toLevelData(editor);
                game = new Game(levelData);
                game.init();
                game.playtestMode = true;
            } else {
                // Show message about controls
                renderer.drawCenteredText('Press R to retry, Esc to exit editor', 300, '#AAA', 16);
            }
        }

        input.update();
    } else {
        // Normal game update/render
        game.update(dt);
        game.render();
    }

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// End playtest and return to editor
function endPlaytest(completed) {
    currentMode = 'editor';
    editor.endPlaytest(completed);

    if (completed) {
        alert('Level completed successfully!');
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for external access
window.lodeRunner = {
    startEditor: initEditor,
    startGame: initGame,
    showMenu: showMenu
};

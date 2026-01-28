// Main entry point

import { Game } from './game.js';
import { Editor } from './editor/editor.js';
import { renderer } from './renderer.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { LEVEL_1 } from '../levels/level1.js';
import { GAME_STATES } from './config.js';

let game = null;
let editor = null;
let lastTime = 0;
let currentMode = 'game'; // 'game' or 'editor' or 'playtest'

// Initialize the game
function init() {
    console.log('Initializing Lode Runner...');

    // Initialize renderer
    const canvas = document.getElementById('game-canvas');
    renderer.init(canvas);

    // Initialize audio
    audio.init();

    // Check for editor mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('editor') === 'true') {
        initEditor();
    } else {
        initGame();
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

// Initialize game mode
function initGame(levelData = null) {
    currentMode = 'game';

    // Hide editor UI if visible
    const editorUI = document.getElementById('editor-ui');
    if (editorUI) editorUI.classList.add('hidden');

    // Show game UI
    const gameUI = document.getElementById('ui-overlay');
    if (gameUI) gameUI.classList.remove('hidden');

    // Create game with level data or default level
    game = new Game(levelData || LEVEL_1);
    game.init();
}

// Initialize editor mode
function initEditor() {
    currentMode = 'editor';

    // Create editor with callbacks
    editor = new Editor(
        // onExit callback
        () => {
            initGame();
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

    if (currentMode === 'editor') {
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
    startGame: initGame
};

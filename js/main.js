// Main entry point

import { Game } from './game.js';
import { renderer } from './renderer.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { LEVEL_1 } from '../levels/level1.js';

let game = null;
let lastTime = 0;

// Initialize the game
function init() {
    console.log('Initializing Lode Runner...');

    // Initialize renderer
    const canvas = document.getElementById('game-canvas');
    renderer.init(canvas);

    // Initialize audio
    audio.init();

    // Create game with first level
    game = new Game(LEVEL_1);
    game.init();

    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);

    // Resume audio on first interaction
    document.addEventListener('keydown', () => {
        audio.resume();
    }, { once: true });

    console.log('Lode Runner initialized!');
}

// Main game loop
function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;

    // Update game
    game.update(dt);

    // Render game
    game.render();

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

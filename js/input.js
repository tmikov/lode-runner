// Keyboard input handler

import { KEYS } from './config.js';

class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {}; // For one-shot key detection
        this.keysReleased = {};

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Prevent default for game keys
            if (this.isGameKey(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysReleased[e.code] = true;
        });

        // Handle window blur
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    isGameKey(code) {
        return Object.values(KEYS).flat().includes(code);
    }

    // Check if any of the keys for an action are held
    isHeld(action) {
        const keyCodes = KEYS[action];
        if (!keyCodes) return false;
        return keyCodes.some(code => this.keys[code]);
    }

    // Check if any of the keys for an action were just pressed
    wasPressed(action) {
        const keyCodes = KEYS[action];
        if (!keyCodes) return false;
        return keyCodes.some(code => this.keysPressed[code]);
    }

    // Check if any of the keys for an action were just released
    wasReleased(action) {
        const keyCodes = KEYS[action];
        if (!keyCodes) return false;
        return keyCodes.some(code => this.keysReleased[code]);
    }

    // Get movement direction from input
    getMovement() {
        let dx = 0;
        let dy = 0;

        if (this.isHeld('LEFT')) dx -= 1;
        if (this.isHeld('RIGHT')) dx += 1;
        if (this.isHeld('UP')) dy -= 1;
        if (this.isHeld('DOWN')) dy += 1;

        return { dx, dy };
    }

    // Check for dig input
    getDigDirection() {
        if (this.wasPressed('DIG_LEFT')) return -1;
        if (this.wasPressed('DIG_RIGHT')) return 1;
        return 0;
    }

    // Clear one-shot key states (call at end of frame)
    update() {
        this.keysPressed = {};
        this.keysReleased = {};
    }

    // Reset all input state
    reset() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
    }
}

// Singleton instance
export const input = new InputManager();

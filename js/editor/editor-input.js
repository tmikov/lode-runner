// Editor input handling - mouse events and keyboard shortcuts

import { CONFIG } from '../config.js';

export class EditorInput {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.tileX = -1;
        this.tileY = -1;
        this.mouseDown = false;
        this.mousePressed = false;
        this.mouseReleased = false;
        this.rightMouseDown = false;
        this.ctrlKey = false;
        this.shiftKey = false;

        // Keyboard state
        this.keys = {};
        this.keysPressed = {};

        this.canvas = null;
        this.canvasRect = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.updateCanvasRect();

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Track modifier keys
        window.addEventListener('blur', () => {
            this.ctrlKey = false;
            this.shiftKey = false;
            this.mouseDown = false;
            this.rightMouseDown = false;
        });

        // Handle window resize
        window.addEventListener('resize', () => this.updateCanvasRect());
    }

    updateCanvasRect() {
        if (this.canvas) {
            this.canvasRect = this.canvas.getBoundingClientRect();
        }
    }

    onMouseDown(e) {
        this.updateCanvasRect();
        this.updateMousePos(e);

        if (e.button === 0) {
            this.mouseDown = true;
            this.mousePressed = true;
        } else if (e.button === 2) {
            this.rightMouseDown = true;
        }
    }

    onMouseMove(e) {
        this.updateMousePos(e);
    }

    onMouseUp(e) {
        if (e.button === 0 && this.mouseDown) {
            this.mouseDown = false;
            this.mouseReleased = true;
        } else if (e.button === 2 && this.rightMouseDown) {
            this.rightMouseDown = false;
        }
    }

    onMouseLeave(e) {
        this.tileX = -1;
        this.tileY = -1;
    }

    updateMousePos(e) {
        if (!this.canvasRect) return;

        // Get mouse position relative to canvas
        this.mouseX = e.clientX - this.canvasRect.left;
        this.mouseY = e.clientY - this.canvasRect.top;

        // Scale to canvas coordinates
        const scaleX = this.canvas.width / this.canvasRect.width;
        const scaleY = this.canvas.height / this.canvasRect.height;

        this.mouseX *= scaleX;
        this.mouseY *= scaleY;

        // Convert to tile coordinates
        this.tileX = Math.floor(this.mouseX / CONFIG.DISPLAY_TILE_SIZE);
        this.tileY = Math.floor(this.mouseY / CONFIG.DISPLAY_TILE_SIZE);
    }

    onKeyDown(e) {
        this.ctrlKey = e.ctrlKey || e.metaKey;
        this.shiftKey = e.shiftKey;

        // Always register key press for undo/redo to support key repeat
        if (e.code === 'KeyZ' || e.code === 'KeyY') {
            this.keysPressed[e.code] = true;
        } else if (!this.keys[e.code]) {
            this.keysPressed[e.code] = true;
        }
        this.keys[e.code] = true;
    }

    onKeyUp(e) {
        this.ctrlKey = e.ctrlKey || e.metaKey;
        this.shiftKey = e.shiftKey;
        this.keys[e.code] = false;
    }

    // Check if key was just pressed this frame
    wasPressed(code) {
        return this.keysPressed[code] === true;
    }

    // Check if key is currently held
    isHeld(code) {
        return this.keys[code] === true;
    }

    // Check for undo shortcut (Ctrl+Z)
    wasUndoPressed() {
        return this.ctrlKey && this.wasPressed('KeyZ') && !this.shiftKey;
    }

    // Check for redo shortcut (Ctrl+Y or Ctrl+Shift+Z)
    wasRedoPressed() {
        return this.ctrlKey && (
            this.wasPressed('KeyY') ||
            (this.wasPressed('KeyZ') && this.shiftKey)
        );
    }

    // Check for save shortcut (Ctrl+S)
    wasSavePressed() {
        return this.ctrlKey && this.wasPressed('KeyS');
    }

    // Check for grid toggle (G)
    wasGridTogglePressed() {
        return this.wasPressed('KeyG') && !this.ctrlKey;
    }

    // Check for escape
    wasEscapePressed() {
        return this.wasPressed('Escape');
    }

    // Clear one-shot inputs at end of frame
    update() {
        this.mousePressed = false;
        this.mouseReleased = false;
        this.keysPressed = {};
    }

    // Get current tile position
    getTilePos() {
        return { x: this.tileX, y: this.tileY };
    }

    // Check if mouse is over the canvas
    isMouseOverCanvas() {
        return this.tileX >= 0 && this.tileX < CONFIG.LEVEL_WIDTH &&
               this.tileY >= 0 && this.tileY < CONFIG.LEVEL_HEIGHT;
    }
}

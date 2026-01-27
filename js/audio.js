// Sound effects using Web Audio API

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.3;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Resume audio context (needed after user interaction)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Create an oscillator with envelope
    createTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // Create noise burst
    createNoise(duration, volume = 0.2) {
        if (!this.enabled || !this.ctx) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + duration);
    }

    // Sound: Dig
    playDig() {
        if (!this.enabled || !this.ctx) return;

        // Low crunch sound
        this.createNoise(0.15, 0.4);
        this.createTone(100, 0.1, 'square', 0.2);
    }

    // Sound: Collect gold
    playCollectGold() {
        if (!this.enabled || !this.ctx) return;

        // Rising arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, 0.1, 'square', 0.25);
            }, i * 50);
        });
    }

    // Sound: Enemy trapped
    playEnemyTrapped() {
        if (!this.enabled || !this.ctx) return;

        // Thud sound
        this.createTone(80, 0.2, 'square', 0.4);
        this.createNoise(0.1, 0.3);
    }

    // Sound: Enemy die
    playEnemyDie() {
        if (!this.enabled || !this.ctx) return;

        // Falling tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // Sound: Player die
    playPlayerDie() {
        if (!this.enabled || !this.ctx) return;

        // Sad descending melody
        const notes = [392, 349, 330, 262]; // G4, F4, E4, C4
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'square', 0.3);
            }, i * 150);
        });
    }

    // Sound: Level complete
    playLevelComplete() {
        if (!this.enabled || !this.ctx) return;

        // Victory fanfare
        const notes = [523, 659, 784, 1047, 784, 1047]; // C5, E5, G5, C6, G5, C6
        const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.4];

        let time = 0;
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, durations[i], 'square', 0.3);
            }, time);
            time += durations[i] * 1000;
        });
    }

    // Sound: Game over
    playGameOver() {
        if (!this.enabled || !this.ctx) return;

        // Sad tune
        const notes = [262, 247, 220, 196]; // C4, B3, A3, G3
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'square', 0.25);
            }, i * 300);
        });
    }

    // Sound: Footstep (subtle)
    playFootstep() {
        if (!this.enabled || !this.ctx) return;

        this.createTone(100, 0.05, 'square', 0.1);
    }

    // Sound: Fall/Land
    playLand() {
        if (!this.enabled || !this.ctx) return;

        this.createTone(60, 0.1, 'square', 0.2);
        this.createNoise(0.05, 0.2);
    }

    // Sound: Hole regenerating warning
    playHoleWarning() {
        if (!this.enabled || !this.ctx) return;

        this.createTone(200, 0.1, 'square', 0.15);
    }

    // Toggle audio
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Set master volume
    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }
}

// Singleton instance
export const audio = new AudioManager();

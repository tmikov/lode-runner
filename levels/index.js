// Built-in levels index
// This file exports all built-in levels loaded from the original Lode Runner format

import { parseLevelString, parseLevelFromLines } from '../js/level.js';
import originalLevels from './original.json' with { type: 'json' };

// Parse all levels from original.json
export const BUILT_IN_LEVELS = Object.entries(originalLevels).map(([num, lines]) => {
    const levelNum = parseInt(num) + 1;
    return {
        id: `level${levelNum}`,
        name: `Level ${levelNum}`,
        data: parseLevelFromLines(lines, {
            name: `Level ${levelNum}`
        })
    };
});

// Get a built-in level by ID
export function getBuiltinLevel(id) {
    return BUILT_IN_LEVELS.find(level => level.id === id);
}

// Get a built-in level by number (1-indexed)
export function getBuiltinLevelByNumber(num) {
    return BUILT_IN_LEVELS[num - 1];
}

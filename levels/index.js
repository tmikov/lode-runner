// Built-in levels index
// This file exports all built-in levels for use by the level editor

import { LEVEL_1 } from './level1.js';

// Array of all built-in levels with metadata
export const BUILT_IN_LEVELS = [
    {
        id: 'level1',
        name: 'Level 1 - Beginner',
        data: LEVEL_1
    }
];

// Get a built-in level by ID
export function getBuiltinLevel(id) {
    return BUILT_IN_LEVELS.find(level => level.id === id);
}

// Sprite definitions with pixel art data
// Each sprite is a 16x16 array of palette indices

// Color palette (index 0 = transparent)
export const PALETTE = {
    0: 'transparent',
    // Player colors
    1: '#000000',  // Black (outline)
    2: '#2b5c3f',  // Dark green (player body)
    3: '#4a9c5d',  // Light green (player body highlight)
    4: '#f0d0a0',  // Skin tone
    5: '#c0a080',  // Skin shadow
    6: '#ffffff',  // White
    // Brick colors
    10: '#8B4513', // Saddle brown (brick)
    11: '#654321', // Dark brown (brick shadow)
    12: '#A0522D', // Sienna (brick highlight)
    13: '#CD853F', // Peru (brick light)
    // Solid block colors
    14: '#4a4a6a', // Dark blue-gray
    15: '#6a6a8a', // Medium blue-gray
    16: '#8a8aaa', // Light blue-gray
    // Ladder colors
    20: '#8B7355', // Wood brown
    21: '#6B5344', // Wood shadow
    22: '#AB9375', // Wood highlight
    // Rope colors
    25: '#DAA520', // Goldenrod
    26: '#B8860B', // Dark goldenrod
    // Gold colors
    30: '#FFD700', // Gold
    31: '#FFA500', // Orange gold
    32: '#FFEC8B', // Light gold sparkle
    33: '#FFFFFF', // White sparkle
    // Enemy colors
    40: '#8B0000', // Dark red
    41: '#CD5C5C', // Indian red
    42: '#FF6347', // Tomato (highlight)
    43: '#000000', // Black
};

// Helper to create sprite data
function createSprite(data) {
    return data.map(row => row.split('').map(c => {
        const n = parseInt(c, 36);
        return isNaN(n) ? 0 : n;
    }));
}

// Player sprites (using hex-like notation for palette indices)
export const SPRITES = {
    // Player idle (facing right)
    player_idle: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
        '0000111011100000',
        '0000110001100000',
    ]),

    // Player running frames
    player_run_1: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011001100000',
        '0000110000110000',
        '0001100000011000',
    ]),

    player_run_2: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000110000110000',
        '0001100000011000',
        '0000000000000000',
    ]),

    player_run_3: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0001100000011000',
        '0000110000110000',
        '0000000000000000',
    ]),

    player_run_4: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000110000110000',
        '0000011001100000',
        '0000000000000000',
    ]),

    // Player climbing frames
    player_climb_1: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0110112221101100',
        '1121223332212110',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
        '0000011011000000',
        '0000011011000000',
    ]),

    player_climb_2: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0001112221110000',
        '0012223332221000',
        '1122233333221100',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
        '0000011011000000',
        '0000011011000000',
    ]),

    // Player on rope/bar
    player_bar_1: createSprite([
        '0001100000011000',
        '0011100000011100',
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
    ]),

    player_bar_2: createSprite([
        '0000110000110000',
        '0001110000111000',
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
    ]),

    // Player falling
    player_fall: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0110112221101100',
        '1121223332212110',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0001100001100000',
        '0011000000110000',
        '0000000000000000',
    ]),

    // Player digging
    player_dig_1: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221110',
        '0012233333221111',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
        '0000111011100000',
        '0000110001100000',
    ]),

    player_dig_2: createSprite([
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001445545411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332211100',
        '0012233333222110',
        '0012233333221100',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0000011011000000',
        '0000111011100000',
        '0000110001100000',
    ]),

    // Player death frames
    player_dead_1: createSprite([
        '0000000000000000',
        '0000011111100000',
        '0000144444110000',
        '0001444444411000',
        '0001446646411000',
        '0001444444411000',
        '0000144441110000',
        '0000112221100000',
        '0001223332210000',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0011011111011000',
        '0110000000001100',
        '0000000000000000',
    ]),

    player_dead_2: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000011111100000',
        '0000144444110000',
        '0001446646411000',
        '0001444444411000',
        '0000144441110000',
        '0110112221101100',
        '1101223332210110',
        '0012233333221000',
        '0012233333221000',
        '0001223332210000',
        '0000122221100000',
        '0000011111000000',
        '0011100001110000',
        '0000000000000000',
    ]),

    // Enemy sprites
    enemy_idle: createSprite([
        '0000011111100000',
        '0000155555110000',
        '0001555555511000',
        '0001551151511000',
        '0001555555511000',
        '0000155551110000',
        '0000011111100000',
        '0000111111110000',
        '0001111111111000',
        '0001111111111000',
        '0000111111110000',
        '0000011111100000',
        '0000011111000000',
        '0000011011000000',
        '0000111011100000',
        '0000110001100000',
    ]),

    enemy_run_1: createSprite([
        '0000011111100000',
        '0000155555110000',
        '0001555555511000',
        '0001551151511000',
        '0001555555511000',
        '0000155551110000',
        '0000011111100000',
        '0000111111110000',
        '0001111111111000',
        '0001111111111000',
        '0000111111110000',
        '0000011111100000',
        '0000011111000000',
        '0000011001100000',
        '0000110000110000',
        '0001100000011000',
    ]),

    enemy_run_2: createSprite([
        '0000011111100000',
        '0000155555110000',
        '0001555555511000',
        '0001551151511000',
        '0001555555511000',
        '0000155551110000',
        '0000011111100000',
        '0000111111110000',
        '0001111111111000',
        '0001111111111000',
        '0000111111110000',
        '0000011111100000',
        '0000011111000000',
        '0000110000110000',
        '0001100000011000',
        '0000000000000000',
    ]),

    enemy_climb_1: createSprite([
        '0000011111100000',
        '0000155555110000',
        '0001555555511000',
        '0001551151511000',
        '0001555555511000',
        '0000155551110000',
        '0110011111101100',
        '1110111111110110',
        '0001111111111000',
        '0001111111111000',
        '0000111111110000',
        '0000011111100000',
        '0000011111000000',
        '0000011011000000',
        '0000011011000000',
        '0000011011000000',
    ]),

    enemy_trapped: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0110011111101100',
        '1110155555110110',
        '0001555555511000',
        '0001551151511000',
        '0001555555511000',
        '0000155551110000',
        '0000011111100000',
        '0000011111100000',
        '0000011111100000',
    ]),

    // Tile sprites - Brick
    brick: createSprite([
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'bbcabbbcabbbcabb',
        'bbcabbbcabbbcabb',
        'aaaaaaaaaaaaaaaa',
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'bbcabbbcabbbcabb',
        'bbcabbbcabbbcabb',
        'aaaaaaaaaaaaaaaa',
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
    ]),

    // Brick crumbling frames
    brick_crumble_1: createSprite([
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'bbcabbbcabbbcabb',
        'bbcabbbcabbbcabb',
        'aaaaaaaaaaaaaaaa',
        'abbbcabbbbcabbbc',
        'abbbcabb0bcabbbc',
        'aaaaaa00aaaaaaaa',
        'bbcabb0cabbbcabb',
        'bbcabbbcabbbcabb',
        'aaaaaaaaaaaaaaaa',
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
    ]),

    brick_crumble_2: createSprite([
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'bbca0000abbbcabb',
        'bbca0000abbbcabb',
        'aaaa0000aaaaaaaa',
        'abbb0000bbcabbbc',
        'abbb0000b0cabbbc',
        'aaaa00000aaaaaaa',
        'bbca0000abbbcabb',
        'bbcabbbcabbbcabb',
        'aaaaaaaaaaaaaaaa',
        'abbbcabbbbcabbbc',
        'abbbcabbbbcabbbc',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
    ]),

    brick_crumble_3: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ]),

    // Solid block
    solid: createSprite([
        'effeeffeefffefff',
        'effeeffeefffefff',
        'effeefffefffeffe',
        'eeeeeeeeeeeeeeff',
        'fffeeffeefffefff',
        'fffeeffeefffefff',
        'effeeffeefffefff',
        'eeeeeeeeeeeeefff',
        'effeefffeffeefff',
        'effeefffeffeefff',
        'effeeffeefffefff',
        'eeeeeeeeeeeeeeff',
        'fffeeffeefffefff',
        'fffeeffeefffefff',
        'effeeffeefffefff',
        'eeeeeeeeeeeeefff',
    ]),

    // Ladder
    ladder: createSprite([
        'jk00000000000jk0',
        'jk00000000000jk0',
        'jkllllllllllljk0',
        'jk00000000000jk0',
        'jk00000000000jk0',
        'jkllllllllllljk0',
        'jk00000000000jk0',
        'jk00000000000jk0',
        'jkllllllllllljk0',
        'jk00000000000jk0',
        'jk00000000000jk0',
        'jkllllllllllljk0',
        'jk00000000000jk0',
        'jk00000000000jk0',
        'jkllllllllllljk0',
        'jk00000000000jk0',
    ]),

    // Rope/Bar
    rope: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        'pppppppppppppppp',
        'qpqpqpqpqpqpqpqp',
        'pppppppppppppppp',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ]),

    // Gold
    gold_1: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000uu0000000',
        '000000uttu000000',
        '00000uttstu00000',
        '0000uttststu0000',
        '000uttssssttu000',
        '00uttsssssstu000',
        '0utttssssssttu00',
        '0uuuuuuuuuuuuu00',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ]),

    gold_2: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000uu0000000',
        '000000uvvu000000',
        '00000uvvwvu00000',
        '0000uvvwwvu0000',
        '000uvvwwwwvvu000',
        '00uvvwwwwwwvu000',
        '0uvvvwwwwwwvvu00',
        '0uuuuuuuuuuuuu00',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ]),

    // Empty (for completeness)
    empty: createSprite([
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ]),
};

// Extended palette mapping for the createSprite function
// Maps character to palette index for tiles
const TILE_PALETTE_MAP = {
    '0': 0,
    // Numbers 1-9
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    // Brick colors: a=brown, b=dark, c=highlight
    'a': 10, 'b': 11, 'c': 12, 'd': 13,
    // Solid: e=dark, f=medium, g=light
    'e': 14, 'f': 15, 'g': 16,
    // Ladder: j=wood, k=shadow, l=highlight
    'j': 20, 'k': 21, 'l': 22,
    // Rope: p=main, q=shadow
    'p': 25, 'q': 26,
    // Gold: t=gold, u=orange, v=light, w=sparkle
    't': 30, 'u': 31, 'v': 32, 'w': 33,
    // Skin/player colors mapped to 4,5
    // Enemy uses 40-42 but we reuse slot 5 visually
};

// Re-process sprites with extended palette
function processSprite(data) {
    return data.map(row => row.split('').map(c => {
        if (TILE_PALETTE_MAP[c] !== undefined) {
            return TILE_PALETTE_MAP[c];
        }
        const n = parseInt(c, 36);
        return isNaN(n) ? 0 : n;
    }));
}

// Update tile sprites with proper palette
SPRITES.brick = processSprite([
    'abbbcabbbbcabbbc',
    'abbbcabbbbcabbbc',
    'aaaaaaaaaaaaaaaa',
    'bbcabbbcabbbcabb',
    'bbcabbbcabbbcabb',
    'aaaaaaaaaaaaaaaa',
    'abbbcabbbbcabbbc',
    'abbbcabbbbcabbbc',
    'aaaaaaaaaaaaaaaa',
    'bbcabbbcabbbcabb',
    'bbcabbbcabbbcabb',
    'aaaaaaaaaaaaaaaa',
    'abbbcabbbbcabbbc',
    'abbbcabbbbcabbbc',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
]);

SPRITES.solid = processSprite([
    'efffefffefffeffe',
    'efffefffefffeffe',
    'eeeeeeeeeeeeeeee',
    'fffefffefffefffg',
    'fffefffefffefffg',
    'eeeeeeeeeeeeeeee',
    'efffefffefffeffe',
    'efffefffefffeffe',
    'eeeeeeeeeeeeeeee',
    'fffefffefffefffg',
    'fffefffefffefffg',
    'eeeeeeeeeeeeeeee',
    'efffefffefffeffe',
    'efffefffefffeffe',
    'eeeeeeeeeeeeeeee',
    'eeeeeeeeeeeeeeee',
]);

SPRITES.ladder = processSprite([
    'jk00000000000jk0',
    'jk00000000000jk0',
    'jkllllllllllljk0',
    'jk00000000000jk0',
    'jk00000000000jk0',
    'jkllllllllllljk0',
    'jk00000000000jk0',
    'jk00000000000jk0',
    'jkllllllllllljk0',
    'jk00000000000jk0',
    'jk00000000000jk0',
    'jkllllllllllljk0',
    'jk00000000000jk0',
    'jk00000000000jk0',
    'jkllllllllllljk0',
    'jk00000000000jk0',
]);

SPRITES.rope = processSprite([
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    'pppppppppppppppp',
    'qpqpqpqpqpqpqpqp',
    'pppppppppppppppp',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
]);

SPRITES.gold_1 = processSprite([
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000uu0000000',
    '000000uttu000000',
    '00000uttstu00000',
    '0000uttsttu00000',
    '000uttssssttu000',
    '00uttsssssstu000',
    '0utttssssssttu00',
    '0uuuuuuuuuuuuu00',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
]);

SPRITES.gold_2 = processSprite([
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000uu0000000',
    '000000uvvu000000',
    '00000uvvwvu00000',
    '0000uvvwwvvu0000',
    '000uvvwwwwvvu000',
    '00uvvwwwwwwvu000',
    '0uvvvwwwwwwvvu00',
    '0uuuuuuuuuuuuu00',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
]);

// Revealed trap door - semi-transparent brick (checkerboard pattern)
SPRITES.trap_revealed = processSprite([
    'a0b0c0b0b0c0b0b0',
    '0b0b0a0b0b0a0b0c',
    'a0a0a0a0a0a0a0a0',
    '0b0a0b0c0b0b0a0b',
    'b0c0b0b0a0b0c0b0',
    '0a0a0a0a0a0a0a0a',
    'a0b0c0b0b0c0b0b0',
    '0b0b0a0b0b0a0b0c',
    'a0a0a0a0a0a0a0a0',
    '0b0a0b0c0b0b0a0b',
    'b0c0b0b0a0b0c0b0',
    '0a0a0a0a0a0a0a0a',
    'a0b0c0b0b0c0b0b0',
    '0b0b0a0b0b0a0b0c',
    'a0a0a0a0a0a0a0a0',
    '0a0a0a0a0a0a0a0a',
]);

// Animation sequences
export const ANIMATIONS = {
    player_run: ['player_run_1', 'player_run_2', 'player_run_3', 'player_run_4', 'player_run_3', 'player_run_2'],
    player_climb: ['player_climb_1', 'player_climb_2'],
    player_bar: ['player_bar_1', 'player_bar_2'],
    player_dig: ['player_dig_1', 'player_dig_2'],
    player_death: ['player_dead_1', 'player_dead_2'],
    enemy_run: ['enemy_run_1', 'enemy_run_2'],
    enemy_climb: ['enemy_climb_1', 'enemy_idle'],
    gold_sparkle: ['gold_1', 'gold_2'],
    brick_crumble: ['brick', 'brick_crumble_1', 'brick_crumble_2', 'brick_crumble_3'],
    brick_regen: ['brick_crumble_3', 'brick_crumble_2', 'brick_crumble_1', 'brick'],
};

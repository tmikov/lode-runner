// Level 1 - Beginner friendly level

import { parseLevelString } from '../js/level.js';

// Level layout using ASCII characters:
// . = Empty
// # = Brick (diggable)
// = = Solid block (indestructible)
// H = Ladder
// - = Rope/Bar
// G = Gold
// h = Hidden ladder (appears when all gold collected)
// P = Player start
// E = Enemy start

const LEVEL_1_STRING = `
h...........................
h...........................
H..........G...G...G.......h
H=======#######========....h
H..........................h
H....G..E..........G...E...h
H###===###======###===###==h
H..........................h
H......G...........G.......h
H==###======HH======###====h
H..........GHH.............h
H..........GHH...G.........h
H===###=====HH=====###=====h
H...........HH.............h
H....P......HH.............h
============================
`;

// Alternative level with more complexity
const LEVEL_1_ALT = `
............................
h..........................h
H.....G........G........G..H
H===####====####====####===H
H..........E...............H
H.....G.........G..........H
H##====##=======##====##===H
H..........................H
H...G-----------G----------H
H===##=======H======##=====H
H............H.....G.......H
H....G...E...H.............H
H##===##=====H====##===##==H
H............H.............H
H.....P......H..........hhhh
============================
`;

export const LEVEL_1 = parseLevelString(LEVEL_1_STRING, {
    name: 'Level 1',
    difficulty: 'easy'
});

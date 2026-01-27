// A* Pathfinding for enemies

import { TILE_TYPES, CONFIG } from './config.js';
import { isClimbable, isHangable, isSolid } from './tiles.js';

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift()?.item;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// Get valid moves from a position
function getValidMoves(level, x, y, laddersRevealed) {
    const moves = [];
    const currentTile = level.getTile(x, y);
    const tileBelow = level.getTile(x, y + 1);

    // Check if we have ground support (using level.isSolidAt for filled holes)
    const hasGround = level.isSolidAt(x, y + 1) ||
                      isClimbable(currentTile, laddersRevealed) ||
                      isClimbable(tileBelow, laddersRevealed) ||
                      isHangable(currentTile);

    // Horizontal movement (if we have support or on ladder/rope)
    if (hasGround) {
        // Move left
        const leftTile = level.getTile(x - 1, y);
        if (!isSolid(leftTile)) {
            const leftBelow = level.getTile(x - 1, y + 1);

            // Enemies don't know about dug holes - they'll fall in!
            // Treat original brick positions as walkable for pathfinding
            const canWalkLeft = level.isSolidAt(x - 1, y + 1) ||
                               leftBelow === TILE_TYPES.DUG_HOLE || // Treat hole as walkable (they'll fall)
                               isClimbable(leftTile, laddersRevealed) ||
                               isClimbable(leftBelow, laddersRevealed) ||
                               isHangable(leftTile);

            if (canWalkLeft || isHangable(currentTile)) {
                moves.push({ x: x - 1, y, cost: 1, type: 'walk' });
            }
        }

        // Move right
        const rightTile = level.getTile(x + 1, y);
        if (!isSolid(rightTile)) {
            const rightBelow = level.getTile(x + 1, y + 1);

            // Enemies don't know about dug holes - they'll fall in!
            const canWalkRight = level.isSolidAt(x + 1, y + 1) ||
                                rightBelow === TILE_TYPES.DUG_HOLE || // Treat hole as walkable (they'll fall)
                                isClimbable(rightTile, laddersRevealed) ||
                                isClimbable(rightBelow, laddersRevealed) ||
                                isHangable(rightTile);

            if (canWalkRight || isHangable(currentTile)) {
                moves.push({ x: x + 1, y, cost: 1, type: 'walk' });
            }
        }
    }

    // Climbing up (if on ladder)
    if (isClimbable(currentTile, laddersRevealed)) {
        const upTile = level.getTile(x, y - 1);
        if (!isSolid(upTile)) {
            moves.push({ x, y: y - 1, cost: 1.2, type: 'climb' });
        }
    }

    // Climbing down (if on ladder or ladder below)
    if (isClimbable(currentTile, laddersRevealed) ||
        isClimbable(tileBelow, laddersRevealed)) {
        const downTile = level.getTile(x, y + 1);
        if (!isSolid(downTile)) {
            moves.push({ x, y: y + 1, cost: 1.2, type: 'climb' });
        }
    }

    // Falling down (if no support and not on ladder)
    if (!hasGround) {
        const downTile = level.getTile(x, y + 1);
        if (!isSolid(downTile)) {
            moves.push({ x, y: y + 1, cost: 0.5, type: 'fall' });
        }
    }

    // Drop from rope (going down from rope)
    if (isHangable(currentTile) && !isClimbable(currentTile, laddersRevealed)) {
        const downTile = level.getTile(x, y + 1);
        if (!isSolid(downTile)) {
            moves.push({ x, y: y + 1, cost: 0.8, type: 'drop' });
        }
    }

    return moves;
}

// Manhattan distance heuristic
function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// A* pathfinding
export function findPath(level, startX, startY, goalX, goalY, laddersRevealed = false) {
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startX},${startY}`;
    const goalKey = `${goalX},${goalY}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, goalX, goalY));
    openSet.enqueue({ x: startX, y: startY }, fScore.get(startKey));

    const closedSet = new Set();
    let iterations = 0;
    const maxIterations = 500; // Prevent infinite loops

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        const current = openSet.dequeue();
        const currentKey = `${current.x},${current.y}`;

        // Reached goal
        if (current.x === goalX && current.y === goalY) {
            return reconstructPath(cameFrom, current);
        }

        if (closedSet.has(currentKey)) continue;
        closedSet.add(currentKey);

        const moves = getValidMoves(level, current.x, current.y, laddersRevealed);

        for (const move of moves) {
            const neighborKey = `${move.x},${move.y}`;
            if (closedSet.has(neighborKey)) continue;

            const tentativeGScore = gScore.get(currentKey) + move.cost;

            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, { ...current, moveType: move.type });
                gScore.set(neighborKey, tentativeGScore);
                const f = tentativeGScore + heuristic(move.x, move.y, goalX, goalY);
                fScore.set(neighborKey, f);
                openSet.enqueue({ x: move.x, y: move.y }, f);
            }
        }
    }

    // No path found - return path to closest reachable point
    let closest = { x: startX, y: startY };
    let closestDist = heuristic(startX, startY, goalX, goalY);

    for (const key of gScore.keys()) {
        const [x, y] = key.split(',').map(Number);
        const dist = heuristic(x, y, goalX, goalY);
        if (dist < closestDist) {
            closestDist = dist;
            closest = { x, y };
        }
    }

    if (closest.x !== startX || closest.y !== startY) {
        return reconstructPath(cameFrom, closest);
    }

    return [];
}

// Reconstruct path from cameFrom map
function reconstructPath(cameFrom, current) {
    const path = [{ x: current.x, y: current.y }];
    let key = `${current.x},${current.y}`;

    while (cameFrom.has(key)) {
        const node = cameFrom.get(key);
        path.unshift({ x: node.x, y: node.y, moveType: node.moveType });
        key = `${node.x},${node.y}`;
    }

    // Remove the starting position from the path
    if (path.length > 0) {
        path.shift();
    }

    return path;
}

// Get next move direction from path
export function getNextMoveFromPath(path, currentX, currentY) {
    if (!path || path.length === 0) {
        return { dx: 0, dy: 0, moveType: null };
    }

    const next = path[0];
    return {
        dx: Math.sign(next.x - currentX),
        dy: Math.sign(next.y - currentY),
        moveType: next.moveType
    };
}

// Simple chase behavior (backup if pathfinding fails)
export function getSimpleChaseDirection(level, enemyX, enemyY, playerX, playerY, laddersRevealed) {
    const currentTile = level.getTile(enemyX, enemyY);
    const tileBelow = level.getTile(enemyX, enemyY + 1);

    // Prioritize vertical movement on ladders
    if (isClimbable(currentTile, laddersRevealed) ||
        isClimbable(tileBelow, laddersRevealed)) {
        if (playerY < enemyY) {
            return { dx: 0, dy: -1 };
        } else if (playerY > enemyY) {
            return { dx: 0, dy: 1 };
        }
    }

    // Horizontal movement
    if (playerX < enemyX) {
        return { dx: -1, dy: 0 };
    } else if (playerX > enemyX) {
        return { dx: 1, dy: 0 };
    }

    return { dx: 0, dy: 0 };
}

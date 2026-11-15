import { CellType, Position } from '../models/types';

export function createDefaultGrid(rows: number = 20, cols: number = 20): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(CellType.Open);
  }
  return grid;
}

/**
 * Generates a random map and guarantees:
 * 1. Start and goal cells are always Open.
 * 2. A path exists between start and goal (BFS connectivity check; retries up to 10 times).
 */
export function generateRandomMap(
  rows: number = 20,
  cols: number = 20,
  trafficDensity: number = 0.22,
  obstacleDensity: number = 0.15,
  start: Position = [0, 0],
  goal: Position = [rows - 1, cols - 1]
): number[][] {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grid = createDefaultGrid(rows, cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Never block start or goal
        if ((r === start[0] && c === start[1]) || (r === goal[0] && c === goal[1])) continue;
        const rand = Math.random();
        if (rand < obstacleDensity) {
          grid[r][c] = CellType.Blocked;
        } else if (rand < obstacleDensity + trafficDensity) {
          grid[r][c] = CellType.Traffic;
        }
      }
    }

    if (isConnected(grid, start, goal)) return grid;
  }

  // Fallback: return an all-open grid with a traffic band in the middle
  return createDefaultGrid(rows, cols);
}

/** BFS connectivity check between start and goal on the grid. */
function isConnected(grid: number[][], start: Position, goal: Position): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const queue: Position[] = [start];
  visited[start[0]][start[1]] = true;
  const dirs: Position[] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === goal[0] && c === goal[1]) return true;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
        && !visited[nr][nc] && grid[nr][nc] !== CellType.Blocked) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

export interface MapPreset {
  name: string;
  description: string;
  grid: number[][];
  start: Position;
  goal: Position;
}

export const PRESET_MAPS: MapPreset[] = [
  /**
   * Downtown Traffic Bypass
   * A congested city core (cost 5). A* routes smartly around it;
   * Greedy dives straight in; BFS finds the shortest-hop path.
   */
  {
    name: 'Downtown Traffic Bypass',
    description: 'A congested city center. Greedy rushes directly in; A* smartly routes around it.',
    start: [1, 1],
    goal: [13, 18],
    grid: (() => {
      const g = createDefaultGrid(15, 20);

      // Heavy traffic core (rows 4-10, cols 5-14)
      for (let r = 4; r <= 10; r++) {
        for (let c = 5; c <= 14; c++) {
          g[r][c] = CellType.Traffic;
        }
      }

      // City block walls — gaps left so the map is always solvable
      for (let r = 3; r <= 11; r++) {
        if (r !== 7) g[r][3] = CellType.Blocked;  // left wall with gap at row 7
        if (r !== 7) g[r][16] = CellType.Blocked; // right wall with gap at row 7
      }

      // Ensure start and goal are open
      g[1][1] = CellType.Open;
      g[13][18] = CellType.Open;

      return g;
    })(),
  },

  /**
   * River Bridges
   * A river (blocked column 10) with two crossings:
   * - Bridge A (row 7): congested (cost 5) — shorter but expensive
   * - Bridge B (row 2): open (cost 1) — longer detour but cheap
   * A* will prefer Bridge B; Greedy and BFS will take Bridge A.
   */
  {
    name: 'River Bridges',
    description: 'A river with two bridges — one cheap but far, one costly but direct.',
    start: [7, 1],
    goal: [7, 18],
    grid: (() => {
      const g = createDefaultGrid(15, 20);

      // River along column 10 (fully blocked)
      for (let r = 0; r < 15; r++) {
        g[r][10] = CellType.Blocked;
      }

      // Bridge A: row 7, centre — congested (3 traffic cells)
      g[7][10] = CellType.Traffic;
      g[6][10] = CellType.Traffic;
      g[8][10] = CellType.Traffic;

      // Bridge B: row 2 — open and free, but requires detour north
      g[2][10] = CellType.Open;

      // Traffic zone on the right bank to make Bridge A less attractive
      for (let r = 5; r <= 9; r++) {
        for (let c = 11; c <= 14; c++) {
          g[r][c] = CellType.Traffic;
        }
      }

      // Ensure start / goal open
      g[7][1] = CellType.Open;
      g[7][18] = CellType.Open;

      return g;
    })(),
  },

  /**
   * Urban Maze
   * Vertical walls with alternating gaps create a maze-like structure.
   * DFS explores deep dead-ends; BFS and A* stay focused on cost.
   * Walls are carefully placed so start [1,1] and goal [13,17] are reachable.
   */
  {
    name: 'Urban Maze',
    description: 'Narrow corridors and dead-ends. DFS suffers; A* cuts through cleanly.',
    start: [1, 1],
    goal: [13, 17],
    grid: (() => {
      const g = createDefaultGrid(15, 20);

      // Vertical wall columns at 3, 7, 11, 15 — with alternating gaps (top / bottom)
      const wallCols = [3, 7, 11, 15];
      wallCols.forEach((col, i) => {
        const gapRow = i % 2 === 0 ? 12 : 2; // even walls: gap at bottom; odd: gap at top
        for (let r = 0; r < 15; r++) {
          if (Math.abs(r - gapRow) > 1) { // leave a 3-row gap
            g[r][col] = CellType.Blocked;
          }
        }
      });

      // Add some traffic patches to differentiate algorithm costs
      const trafficZones = [[4, 4], [4, 5], [5, 4], [5, 5],
                             [8, 8], [8, 9], [9, 8], [9, 9],
                             [3, 12], [3, 13], [4, 12], [4, 13]];
      trafficZones.forEach(([r, c]) => {
        if (g[r][c] === CellType.Open) g[r][c] = CellType.Traffic;
      });

      // Guarantee start and goal are open
      g[1][1] = CellType.Open;
      g[13][17] = CellType.Open;

      return g;
    })(),
  },
];

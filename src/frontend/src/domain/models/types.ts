export type Position = [number, number]; // [row, col]

export enum CellType {
  Blocked = -1,
  Open = 1,
  Traffic = 5,
}

export type AlgorithmName = 'BFS' | 'DFS' | 'Greedy' | 'A*';

export interface AlgorithmConfig {
  name: AlgorithmName;
  color: string;
}

export const ALGORITHMS: Record<AlgorithmName, AlgorithmConfig> = {
  BFS: {
    name: 'BFS',
    color: '#3B82F6', // Blue
  },
  DFS: {
    name: 'DFS',
    color: '#EC4899', // Pink / Magenta
  },
  Greedy: {
    name: 'Greedy',
    color: '#F97316', // Orange
  },
  'A*': {
    name: 'A*',
    color: '#10B981', // Emerald
  },
};

export interface AlgorithmResult {
  algorithm: AlgorithmName;
  cost: number | null;
  path: Position[] | null;
  explored: Position[];
  exploredCount: number;
  timeMs: number;
}

export interface RaceResult {
  id: string;
  createdAtUtc: string;
  grid: number[][];
  start: Position;
  goal: Position;
  winner: AlgorithmName | null;
  results: AlgorithmResult[];
  fromCache: boolean;
}

export interface SavedMap {
  id: string;
  name: string;
  grid: number[][];
  defaultStart?: Position | null;
  defaultGoal?: Position | null;
  createdAtUtc: string;
}

export interface Stats {
  totalRaces: number;
  wins: Record<AlgorithmName, number>;
  winPercentages: Record<AlgorithmName, number>;
}

export type PaintTool = 'start' | 'goal' | 'open' | 'traffic' | 'blocked';

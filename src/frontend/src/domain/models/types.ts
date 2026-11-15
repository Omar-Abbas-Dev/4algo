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
  lightColor: string;
  carColor: string;
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
  pan: number; // -1 to 1
  character: string;
}

export const ALGORITHMS: Record<AlgorithmName, AlgorithmConfig> = {
  BFS: {
    name: 'BFS',
    color: '#3B82F6', // Blue
    lightColor: 'rgba(59, 130, 246, 0.25)',
    carColor: '#60A5FA',
    waveform: 'sine',
    pan: -0.8,
    character: 'Calm, regular pulses (Stereo Left)',
  },
  DFS: {
    name: 'DFS',
    color: '#EC4899', // Pink / Magenta
    lightColor: 'rgba(236, 72, 153, 0.25)',
    carColor: '#F472B6',
    waveform: 'square',
    pan: -0.3,
    character: 'Descending tones (Slightly Left)',
  },
  Greedy: {
    name: 'Greedy',
    color: '#F97316', // Orange
    lightColor: 'rgba(249, 115, 22, 0.25)',
    carColor: '#FB923C',
    waveform: 'triangle',
    pan: 0.3,
    character: 'Fast, impulsive tones (Slightly Right)',
  },
  'A*': {
    name: 'A*',
    color: '#10B981', // Emerald
    lightColor: 'rgba(16, 185, 129, 0.25)',
    carColor: '#34D399',
    waveform: 'sawtooth',
    pan: 0.8,
    character: 'Intelligent, balanced tones (Stereo Right)',
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
